// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import scannerService from "../Composant/ScannerService";
import ocrService from "../Composant/ocrService";
import OCRTextModal from "./OCRTextModal";
import ConfirmModal from "./ConfirmModal";
import {
    FaFilePdf, FaTrash, FaTimes, FaPrint, FaCloudUploadAlt,
    FaEye, FaSpinner, FaHistory, FaDownload, FaCheckCircle,
    FaStopCircle, FaBell, FaFileAlt
} from 'react-icons/fa';
import { API_BASE_URL } from "../config";
import { toast } from "../Composant/Toast";

const FileUploadModal = ({ documentId, onClose, token, id_classeur, nom_fichier, uploadType = "document", id_ministere }) => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [loadingExistingFiles, setLoadingExistingFiles] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [scanInProgress, setScanInProgress] = useState(false);
    const [ocrInProgress, setOcrInProgress] = useState(false);
    const [ocrResults, setOcrResults] = useState({});
    const [ocrProgress, setOcrProgress] = useState({ current: 0, total: 0, file: '', message: '' });
    const [selectedOCRText, setSelectedOCRText] = useState(null);
    const [showOCRModal, setShowOCRModal] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, fileId: null, fileName: '' });
    const [confirmCancelScan, setConfirmCancelScan] = useState(false);

    const scannerConfig = { apiUrl: API_BASE_URL, token, idDeclaration: documentId, idClasseur: id_classeur, nom_fichier };
    const pollingIntervalRef = useRef(null);
    const processedFilesRef = useRef(new Set());
    const isProcessingOCRRef = useRef(false);
    const scanSafetyTimeoutRef = useRef(null);

    useEffect(() => {
        if (documentId && token) {
            fetchExistingFiles();
            startPolling();
        }
        return () => { stopPolling(); if (scanSafetyTimeoutRef.current) clearTimeout(scanSafetyTimeoutRef.current); };
    }, [documentId, token]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const startPolling = () => {
        stopPolling();
        pollingIntervalRef.current = setInterval(() => fetchExistingFiles(), 3000);
    };

    const stopPolling = () => {
        if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null; }
    };

    const fetchExistingFiles = async () => {
        if (isProcessingOCRRef.current) return;
        try {
            const url = uploadType === "note"
                ? `${API_BASE_URL}/notes/download/${documentId}`
                : `${API_BASE_URL}/documents/${documentId}`;
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
            });
            if (res.data && Array.isArray(res.data)) {
                const newFiles = res.data.map(f => {
                    const existing = uploadedFiles.find(ef => ef.id === f.id);
                    return {
                        id: f.id,
                        nom: f.nom_native || f.nom_fichier || f.nom || 'Sans nom',
                        url: uploadType === "note"
                            ? `${API_BASE_URL}/notes/downloads/${f.id}`
                            : `${API_BASE_URL}/documents-declaration/download/${f.id}`,
                        created_at: f.created_at || new Date().toISOString(),
                        size: f.taille || f.size || existing?.size || 0,
                        type: f.type || 'application/pdf',
                        hasOcr: !!f.montext || existing?.hasOcr || false
                    };
                }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                if (newFiles.length > uploadedFiles.length) {
                    const added = newFiles.slice(0, newFiles.length - uploadedFiles.length);
                    const toProcess = added.filter(f => !processedFilesRef.current.has(f.id) && !f.hasOcr && !ocrResults[f.id]);
                    toProcess.forEach(f => processedFilesRef.current.add(f.id));
                    setUploadedFiles(newFiles);
                    if (toProcess.length > 0) await processMultipleFilesWithOCR(toProcess);
                } else {
                    setUploadedFiles(newFiles);
                }
                if (loadingExistingFiles) setLoadingExistingFiles(false);
            }
        } catch (err) {
            if (loadingExistingFiles) setLoadingExistingFiles(false);
        }
    };

    const processFileWithOCR = async (file, fileId) => {
        try {
            if (!file?.url) return false;
            setOcrProgress(prev => ({ ...prev, message: `Extraction du texte de ${file.nom}...` }));
            const response = await fetch(file.url);
            if (!response.ok) throw new Error(`Erreur: ${response.status}`);
            const blob = await response.blob();
            const pdfFile = new File([blob], file.nom, { type: 'application/pdf' });
            const result = await ocrService.extractTextFromPDF(pdfFile);
            if (result.success && result.text) {
                const ocrUrl = uploadType === "note"
                    ? `${API_BASE_URL}/notes/${fileId}/update-text`
                    : `${API_BASE_URL}/documents-declaration/${fileId}/update-text`;
                const saveResponse = await axios.put(
                    ocrUrl,
                    { montext: result.text },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (saveResponse.data.success) {
                    setOcrResults(prev => ({ ...prev, [fileId]: { text: result.text, pages: result.pages, date: new Date().toISOString() } }));
                    setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, hasOcr: true } : f));
                    return true;
                }
            }
            return false;
        } catch (error) {
            return false;
        }
    };

    const processMultipleFilesWithOCR = async (files) => {
        if (!files?.length) return 0;
        isProcessingOCRRef.current = true;
        setOcrInProgress(true);
        let successCount = 0;
        for (let i = 0; i < files.length; i++) {
            setOcrProgress({ current: i + 1, total: files.length, file: files[i].nom, message: `OCR ${i + 1}/${files.length} : ${files[i].nom}` });
            try { if (await processFileWithOCR(files[i], files[i].id)) successCount++; } catch (e) {}
        }
        setOcrInProgress(false);
        setOcrProgress({ current: 0, total: 0, file: '', message: '' });
        isProcessingOCRRef.current = false;
        return successCount;
    };

    const uploadMultipleFiles = async (files) => {
        if (!files.length || !documentId) return;
        const pdfFiles = files.filter(file => file.type === 'application/pdf');
        if (pdfFiles.length === 0) { toast.error('Aucun fichier PDF dans la sélection'); return; }

        const formData = new FormData();
        pdfFiles.forEach(file => formData.append("files[]", file));

        let uploadUrl;
        if (uploadType === "note") {
            uploadUrl = `${API_BASE_URL}/notes/upload`;
            formData.append("id_note_perception", documentId);
            formData.append("id_classeur", id_classeur);
            formData.append("id_ministere", id_ministere);
        } else {
            uploadUrl = `${API_BASE_URL}/documents-declaration/upload-multiple`;
            formData.append("id_declaration", documentId);
            formData.append("id_classeur", id_classeur);
        }

        try {
            setUploading(true);
            console.log("=== UPLOAD DEBUG ===");
            console.log("uploadUrl:", uploadUrl);
            for (let [key, value] of formData.entries()) { console.log(key, ":", value); }
            toast.info('Upload en cours...');
            const response = await axios.post(uploadUrl, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success || response.data.documents) {
                const docs = response.data.documents || [];
                const newFiles = docs.map((doc, i) => ({
                    id: doc.id,
                    nom: doc.nom_native || pdfFiles[i]?.name || 'Sans nom',
                    url: uploadType === "note"
                        ? `${API_BASE_URL}/notes/downloads/${doc.id}`
                        : `${API_BASE_URL}/documents-declaration/download/${doc.id}`,
                    created_at: doc.created_at || new Date().toISOString(),
                    size: doc.taille || pdfFiles[i]?.size || 0,
                    type: 'application/pdf',
                    hasOcr: false
                }));
                newFiles.forEach(f => processedFilesRef.current.add(f.id));
                setUploadedFiles(prev => [...newFiles, ...prev]);
                toast.info('Extraction du texte en cours...');
                const successCount = await processMultipleFilesWithOCR(newFiles);
                toast.success(`${docs.length} fichier(s) uploadé(s) - ${successCount} analysé(s) avec succès`);
            }
        } catch (err) {
            console.error("Erreur upload:", err);
            toast.error(err.response?.data?.message || "Échec lors de l'upload");
        } finally {
            setUploading(false);
        }
    };

    const handleViewOCRText = (file) => {
        const r = ocrResults[file.id];
        if (r) { setSelectedOCRText({ nom: file.nom, text: r.text, pages: r.pages }); setShowOCRModal(true); }
        else { toast.info("Le texte n'a pas encore été extrait pour ce fichier"); }
    };

    const handleRemoveFile = async (fileId) => {
        const file = uploadedFiles.find(f => f.id === fileId);
        if (!file) return;
        setConfirmDelete({ open: true, fileId, fileName: file.nom });
    };

    const confirmDeleteFile = async () => {
        const { fileId, fileName } = confirmDelete;
        setConfirmDelete({ open: false, fileId: null, fileName: '' });
        try {
            const deleteUrl = uploadType === "note"
                ? `${API_BASE_URL}/notes/delete/${fileId}`
                : `${API_BASE_URL}/delete-document/${fileId}`;
            await axios.delete(deleteUrl, { headers: { Authorization: `Bearer ${token}` } });
            const newOcr = { ...ocrResults }; delete newOcr[fileId]; setOcrResults(newOcr);
            processedFilesRef.current.delete(fileId);
            setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
            toast.success(`"${fileName}" supprimé`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Impossible de supprimer');
        }
    };

    const handleStartScan = async () => {
        const conn = await scannerService.testConnectionWithInstructions();
        if (!conn.connected) { toast.error(conn.message || "Scanner non connecté"); return; }
        if (!scannerConfig.token || !scannerConfig.idDeclaration || !scannerConfig.idClasseur) { toast.error('Champs requis manquants'); return; }

        try {
            const urlRes = await scannerService.setApiUrl(scannerConfig.apiUrl);
            if (!urlRes.success) { toast.error(urlRes.message); return; }
            const infoRes = await scannerService.setDocumentInfo(scannerConfig.idDeclaration, scannerConfig.idClasseur, scannerConfig.token, scannerConfig.nom_fichier);
            if (!infoRes.success) { toast.error(infoRes.message); return; }

            setScanInProgress(true);
            stopPolling();
            pollingIntervalRef.current = setInterval(() => fetchExistingFiles(), 1500);

            scanSafetyTimeoutRef.current = setTimeout(() => {
                setScanInProgress(false); stopPolling(); startPolling();
                toast.warning("Le scan a pris trop de temps.");
            }, 180000);

            const scanResult = await scannerService.startScan();
            if (scanResult.success) {
                toast.info('Scan lancé, les fichiers apparaîtront automatiquement');
            } else {
                clearTimeout(scanSafetyTimeoutRef.current);
                setScanInProgress(false); stopPolling(); startPolling();
                toast.error(scanResult.message || 'Impossible de démarrer le scan');
            }
        } catch (error) {
            if (scanSafetyTimeoutRef.current) clearTimeout(scanSafetyTimeoutRef.current);
            setScanInProgress(false); stopPolling(); startPolling();
            toast.error('Impossible de communiquer avec le scanner');
        }
    };

    const cancelScan = () => {
        setConfirmCancelScan(true);
    };

    const confirmCancelScanAction = () => {
        setConfirmCancelScan(false);
        setScanInProgress(false);
        if (scanSafetyTimeoutRef.current) { clearTimeout(scanSafetyTimeoutRef.current); scanSafetyTimeoutRef.current = null; }
        stopPolling(); startPolling();
        toast.info('Scan annulé');
    };

    const handleDragEnter = useCallback(e => { e.preventDefault(); e.stopPropagation(); if (!uploading) setIsDragging(true); }, [uploading]);
    const handleDragLeave = useCallback(e => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDragOver = useCallback(e => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDrop = useCallback(e => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); uploadMultipleFiles(Array.from(e.dataTransfer.files)); }, [documentId, id_classeur, token]);

    const formatDate = (d) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return d; } };
    const formatSize = (b) => { if (!b) return 'N/A'; const k = 1024, s = ['B', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(b) / Math.log(k)); return (b / Math.pow(k, i)).toFixed(1) + ' ' + s[i]; };

    if (!documentId) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
                    <FaTimes className="text-red-500 mx-auto mb-3" size={40} />
                    <h5 className="text-lg font-bold text-slate-800">Document non trouvé</h5>
                    <p className="text-sm text-slate-500 mt-1">L'ID du document est manquant</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-100 rounded-xl text-sm font-medium hover:bg-slate-200 transition">Fermer</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={(uploading || scanInProgress || ocrInProgress) ? undefined : onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-modalIn">
                {/* Header */}
                <div className="px-6 py-4 bg-indigo-600 text-white shrink-0 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FaFilePdf size={22} />
                            <div>
                                <h5 className="text-lg font-bold">Fichiers PDF</h5>
                                <p className="text-xs text-indigo-200">
                                    Document #{documentId} — Classeur: {id_classeur || 'N/A'}
                                    {scanInProgress && <span className="ml-2 px-2 py-0.5 bg-amber-500 rounded-full text-[10px] font-bold">SCAN</span>}
                                    {ocrInProgress && <span className="ml-2 px-2 py-0.5 bg-blue-400 rounded-full text-[10px] font-bold">OCR</span>}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} disabled={uploading || scanInProgress || ocrInProgress} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition disabled:opacity-50">
                            <FaTimes size={14} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Scan banner */}
                    {scanInProgress && (
                        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <FaSpinner className="animate-spin text-amber-600" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-amber-800">Scan en cours...</p>
                                <p className="text-xs text-amber-600">Les fichiers scannés apparaîtront automatiquement</p>
                            </div>
                            <button onClick={cancelScan} className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition">
                                <FaStopCircle className="inline mr-1" /> Annuler
                            </button>
                        </div>
                    )}

                    {/* OCR banner */}
                    {ocrInProgress && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                            <FaSpinner className="animate-spin text-blue-600" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-blue-800">OCR en cours...</p>
                                <p className="text-xs text-blue-600">{ocrProgress.message || `${ocrProgress.current}/${ocrProgress.total}`}</p>
                                {ocrProgress.total > 0 && (
                                    <div className="mt-2 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${(ocrProgress.current / ocrProgress.total) * 100}%` }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Existing files */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h6 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <FaHistory className="text-indigo-500" /> Fichiers attachés ({uploadedFiles.length})
                            </h6>
                            <button onClick={fetchExistingFiles} disabled={loadingExistingFiles || uploading} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-40">
                                <FaSpinner className={`inline mr-1 ${loadingExistingFiles ? 'animate-spin' : ''}`} size={12} /> Actualiser
                            </button>
                        </div>

                        {loadingExistingFiles ? (
                            <div className="text-center py-8"><FaSpinner className="animate-spin text-indigo-500 mx-auto" size={28} /><p className="text-sm text-slate-500 mt-2">Chargement...</p></div>
                        ) : uploadedFiles.length > 0 ? (
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase">Fichier</th>
                                            <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase">Taille</th>
                                            <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase">Date</th>
                                            <th className="text-center px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase">OCR</th>
                                            <th className="text-center px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {uploadedFiles.map(file => (
                                            <tr key={file.id} className="hover:bg-slate-50 transition">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <FaFilePdf className="text-red-500 shrink-0" />
                                                        <span className="font-medium text-slate-800 truncate max-w-[200px]">{file.nom}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 text-xs">{file.size > 0 ? formatSize(file.size) : '—'}</td>
                                                <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(file.created_at)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {ocrResults[file.id] || file.hasOcr ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                                                            <FaCheckCircle size={12} /> OK
                                                        </span>
                                                    ) : (
                                                        <FaTimes className="text-slate-300 mx-auto" size={12} />
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => window.open(file.url, '_blank')} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Voir">
                                                            <FaEye size={13} />
                                                        </button>
                                                        <button onClick={() => window.open(file.url, '_blank')} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition" title="Télécharger">
                                                            <FaDownload size={13} />
                                                        </button>
                                                        {(ocrResults[file.id] || file.hasOcr) && (
                                                            <button onClick={() => handleViewOCRText(file)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition" title="Texte OCR">
                                                                <FaFileAlt size={13} />
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleRemoveFile(file.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                                                            <FaTrash size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                                <FaFilePdf className="text-slate-400" size={24} />
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Aucun fichier PDF attaché</p>
                                    <p className="text-xs text-slate-400">Utilisez la zone ci-dessous pour ajouter des fichiers</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Upload zone */}
                    <div>
                        <h6 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <FaCloudUploadAlt className="text-indigo-500" /> Ajouter de nouveaux fichiers
                        </h6>
                        <div
                            onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                                isDragging ? 'border-emerald-400 bg-emerald-50 scale-[1.02]' : uploading ? 'border-slate-300 bg-slate-50 opacity-60' : 'border-indigo-300 bg-indigo-50/50 hover:border-indigo-400'
                            }`}
                        >
                            <FaCloudUploadAlt className={`mx-auto mb-3 ${isDragging ? 'text-emerald-500' : 'text-indigo-400'}`} size={40} />
                            <p className="text-sm font-semibold text-slate-700 mb-1">
                                {isDragging ? 'Déposez les fichiers ici' : 'Glissez-déposez vos fichiers PDF'}
                            </p>
                            <p className="text-xs text-slate-400 mb-4">PDF uniquement — Max 50 MB</p>

                            <div className="flex items-center justify-center gap-3">
                                <label className={`inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-700 transition cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                    {uploading ? <><FaSpinner className="animate-spin" /> Upload...</> : <><FaFilePdf /> Choisir des fichiers</>}
                                    <input type="file" multiple accept=".pdf,application/pdf" className="hidden" disabled={uploading || scanInProgress || ocrInProgress}
                                        onChange={e => { const files = Array.from(e.target.files); if (files.length > 0) uploadMultipleFiles(files); e.target.value = ''; }} />
                                </label>
                                <button onClick={handleStartScan} disabled={uploading || scanInProgress || ocrInProgress} className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-50">
                                    {scanInProgress ? <><FaSpinner className="animate-spin" /> Scan...</> : <><FaPrint /> Scanner</>}
                                </button>
                            </div>

                            <p className="text-[11px] text-slate-400 mt-4 flex items-center justify-center gap-1">
                                <FaBell size={10} /> L'OCR est automatique
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between shrink-0">
                    <button onClick={onClose} disabled={uploading || scanInProgress || ocrInProgress} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-100 transition disabled:opacity-40">
                        Fermer
                    </button>
                    <button onClick={() => { toast.success(`${uploadedFiles.length} fichier(s) attaché(s)`); onClose(); }} disabled={uploading || scanInProgress || ocrInProgress} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-40">
                        Terminer
                    </button>
                </div>
            </div>

            <OCRTextModal isOpen={showOCRModal} onClose={() => setShowOCRModal(false)} textData={selectedOCRText} />

            <ConfirmModal
                isOpen={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, fileId: null, fileName: '' })}
                onConfirm={confirmDeleteFile}
                title="Supprimer le fichier"
                message={`Voulez-vous vraiment supprimer "${confirmDelete.fileName}" ?`}
                confirmText="Supprimer"
                cancelText="Annuler"
                variant="danger"
            />

            <ConfirmModal
                isOpen={confirmCancelScan}
                onClose={() => setConfirmCancelScan(false)}
                onConfirm={confirmCancelScanAction}
                title="Annuler le scan"
                message="Voulez-vous vraiment annuler le scan en cours ?"
                confirmText="Oui, annuler"
                cancelText="Non"
                variant="warning"
            />

            <style>{`
                @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .animate-modalIn { animation: modalIn 0.25s ease-out; }
            `}</style>
        </div>
    );
};

export default FileUploadModal;
