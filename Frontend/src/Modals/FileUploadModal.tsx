// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import scannerService from "../Composant/ScannerService";
import ConfirmModal from "./ConfirmModal";
import {
    FaFilePdf, FaTrash, FaTimes, FaPrint, FaCloudUploadAlt,
    FaEye, FaSpinner, FaHistory, FaDownload, FaStopCircle
} from 'react-icons/fa';
import { API_BASE_URL } from "../config";
import { toast } from "../Composant/Toast";

const FileUploadModal = ({ documentId, onClose, token, id_classeur, nom_fichier, uploadType = "document", id_ministere }) => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [loadingExistingFiles, setLoadingExistingFiles] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [scanInProgress, setScanInProgress] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, fileId: null, fileName: '' });
    const [confirmCancelScan, setConfirmCancelScan] = useState(false);

    const scannerConfig = { apiUrl: API_BASE_URL, token, idDeclaration: documentId, idClasseur: id_classeur, nom_fichier };
    const pollingIntervalRef = useRef(null);
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
        pollingIntervalRef.current = setInterval(fetchExistingFiles, 8000);
    };
    const stopPolling = () => { if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null; } };

    const fetchExistingFiles = async () => {
        try {
            const url = uploadType === "note"
                ? `${API_BASE_URL}/notes/download/${documentId}`
                : `${API_BASE_URL}/documents/${documentId}`;
            const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = response.data;
            if (Array.isArray(data)) {
                const newFiles = data.map(doc => ({
                    id: doc.id,
                    nom: doc.nom_native || doc.nom_fichier || 'Sans nom',
                    url: uploadType === "note"
                        ? `${API_BASE_URL}/notes/downloads/${doc.id}`
                        : `${API_BASE_URL}/documents-declaration/download/${doc.id}`,
                    created_at: doc.created_at || new Date().toISOString(),
                    size: doc.taille || 0,
                    type: 'application/pdf',
                    hasOcr: !!doc.montext,
                }));
                setUploadedFiles(newFiles);
                if (loadingExistingFiles) setLoadingExistingFiles(false);
            }
        } catch (err) {
            if (loadingExistingFiles) setLoadingExistingFiles(false);
        }
    };

    const uploadMultipleFiles = async (files) => {
        if (!files.length || !documentId) return;
        const pdfFiles = files.filter(file => file.type === 'application/pdf');
        if (pdfFiles.length === 0) { toast.error('Aucun fichier PDF dans la sélection'); return; }

        const MAX_SIZE = 50 * 1024 * 1024;
        const oversized = pdfFiles.filter(f => f.size > MAX_SIZE);
        if (oversized.length > 0) {
            toast.error(`${oversized.length} fichier(s) dépasse 50 Mo : ${oversized.map(f => f.name).join(', ')}`);
            return;
        }

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
            toast.info('Upload en cours...');
            const response = await axios.post(uploadUrl, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success || response.data.documents) {
                toast.success(`${response.data.documents?.length || pdfFiles.length} fichier(s) uploadé(s) avec OCR`);
                fetchExistingFiles();
            }
        } catch (err) {
            console.error("Erreur upload:", err);
            toast.error(err.response?.data?.message || "Échec lors de l'upload");
        } finally {
            setUploading(false);
        }
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
            setScanInProgress(true);
            toast.info('Scan en cours...');
            const result = await scannerService.scanAndUpload(scannerConfig);
            if (result?.success) {
                toast.success(`${result.files?.length || 1} fichier(s) scanné(s)`);
                fetchExistingFiles();
            } else {
                toast.error(result?.message || 'Scan échoué');
            }
        } catch (err) {
            toast.error(err.message || 'Erreur scan');
        } finally {
            setScanInProgress(false);
        }
    };

    const cancelScan = () => setConfirmCancelScan(true);
    const confirmCancelScanAction = () => { setConfirmCancelScan(false); setScanInProgress(false); toast.info('Scan annulé'); };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' o';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' Ko';
        return (bytes / 1048576).toFixed(1) + ' Mo';
    };

    const formatDate = (d) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
        catch { return '—'; }
    };

    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files.length > 0) uploadMultipleFiles(Array.from(e.dataTransfer.files)); };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-modalIn">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <FaFilePdf className="text-indigo-600" size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Gestion des fichiers</h3>
                            <p className="text-xs text-slate-500">{uploadedFiles.length} fichier(s) attaché(s)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                        <FaTimes size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
                    {/* Scan in progress */}
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
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => window.open(file.url, '_blank')} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Voir">
                                                            <FaEye size={13} />
                                                        </button>
                                                        <button onClick={() => window.open(file.url, '_blank')} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition" title="Télécharger">
                                                            <FaDownload size={13} />
                                                        </button>
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
                                    <input type="file" multiple accept=".pdf,application/pdf" className="hidden" disabled={uploading || scanInProgress}
                                        onChange={e => { const files = Array.from(e.target.files); if (files.length > 0) uploadMultipleFiles(files); e.target.value = ''; }} />
                                </label>
                                <button onClick={handleStartScan} disabled={uploading || scanInProgress} className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-50">
                                    {scanInProgress ? <><FaSpinner className="animate-spin" /> Scan...</> : <><FaPrint /> Scanner</>}
                                </button>
                            </div>

                            <p className="text-[11px] text-slate-400 mt-4 flex items-center justify-center gap-1">
                                L'OCR est automatique côté serveur
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between shrink-0">
                    <button onClick={onClose} disabled={uploading || scanInProgress} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-100 transition disabled:opacity-40">
                        Fermer
                    </button>
                    <button onClick={() => { toast.success(`${uploadedFiles.length} fichier(s) attaché(s)`); onClose(); }} disabled={uploading || scanInProgress} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-40">
                        Terminer
                    </button>
                </div>
            </div>

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
