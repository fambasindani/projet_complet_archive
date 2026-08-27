// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import scannerService from "../Composant/ScannerService";
import {
    FaFilePdf,
    FaTrash,
    FaTimes,
    FaPrint,
    FaCloudUploadAlt,
    FaEye,
    FaSpinner,
    FaHistory,
    FaDownload,
    FaCog,
    FaBell,
    FaCheckCircle,
    FaExclamationTriangle,
    FaStopCircle
} from 'react-icons/fa';
import { API_BASE_URL } from "../config";
import DetailModal from "./DetailModal";
import ConfirmModal from "./ConfirmModal";

const FileUploadModal = ({
    documentId,
    onClose,
    token,
    id_classeur,
    nom_fichier
}) => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [loadingExistingFiles, setLoadingExistingFiles] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showScannerConfig, setShowScannerConfig] = useState(false);
    const [scanInProgress, setScanInProgress] = useState(false);
    const [lastScanTime, setLastScanTime] = useState(null);
    const [scanTimeoutId, setScanTimeoutId] = useState(null);
    const [confirmCancelScan, setConfirmCancelScan] = useState(false);
    
    const scannerConfig = {
        apiUrl: API_BASE_URL,
        token: token,
        idDeclaration: documentId,
        idClasseur: id_classeur,
        nom_fichier: nom_fichier
    };

    const pollingIntervalRef = useRef(null);
    const scantoastRef = useRef(null);
    const lastFileCountRef = useRef(0);
    const scanStartTimeRef = useRef(null);
    const scanSafetyTimeoutRef = useRef(null);

    // ?? DEBUG: V�rifier les props re�ues
    useEffect(() => {
        console.log("=== FILE UPLOAD MODAL PROPS ===");
        console.log("documentId:", documentId);
        console.log("id_classeur:", id_classeur);
        console.log("token pr�sent:", !!token);
    }, [documentId, id_classeur, token]);

    // ?? Charger les fichiers existants au d�marrage
    useEffect(() => {
        if (documentId && token) {
            fetchExistingFiles();
            startPolling();
        }

        // Nettoyage � la fermeture
        return () => {
            stopPolling();
            clearAllTimeouts();
        };
    }, [documentId, token]);

    // ?? Nettoyer tous les timeouts
    const clearAllTimeouts = () => {
        if (scanSafetyTimeoutRef.current) {
            clearTimeout(scanSafetyTimeoutRef.current);
            scanSafetyTimeoutRef.current = null;
        }
    };

    // ?? D�marrer le polling pour v�rifier les nouveaux fichiers
    const startPolling = () => {
        stopPolling(); // S'assurer qu'il n'y a pas de doublon
        
        pollingIntervalRef.current = setInterval(() => {
            fetchExistingFiles();
        }, 3000); // V�rifier toutes les 3 secondes
        
        console.log("?? Polling d�marr�");
    };

    // ?? Arr�ter le polling
    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            console.log("?? Polling arr�t�");
        }
    };

    // ?? Charger les fichiers existants depuis l'API
    const fetchExistingFiles = async () => {
        try {
            const res = await axios.get(
                `${API_BASE_URL}/documents/${documentId}`,
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    } 
                }
            );
            
            if (res.data && Array.isArray(res.data)) {
                const newFiles = res.data.map(f => ({
                    id: f.id,
                    nom: f.nom_native || f.nom_fichier || f.nom || 'Sans nom',
                    url: `${API_BASE_URL}/documents-declaration/download/${f.id}`,
                    created_at: f.created_at || f.upload_date || new Date().toISOString(),
                    size: f.taille || f.size || 0,
                    type: f.type || 'application/pdf'
                }));

                // Trier par date de cr�ation (plus r�cent en premier)
                newFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                // V�rifier si des nouveaux fichiers sont arriv�s
                const currentCount = uploadedFiles.length;
                const newCount = newFiles.length;
                
                if (newCount > currentCount) {
                    const addedFiles = newFiles.slice(0, newCount - currentCount);
                    console.log(`?? ${addedFiles.length} nouveau(x) fichier(s) d�tect�(s) !`);
                    
                    // Si un scan �tait en cours, le terminer
                    if (scanInProgress) {
                        completeScan(addedFiles.length);
                    }
                }

                // Mettre � jour la liste des fichiers
                setUploadedFiles(newFiles);
                lastFileCountRef.current = newCount;
                
                // Marquer le chargement comme termin�
                if (loadingExistingFiles) {
                    setLoadingExistingFiles(false);
                }
            }
        } catch (err) {
            console.error("? Erreur chargement fichiers:", err);
            
            if (loadingExistingFiles) {
                setLoadingExistingFiles(false);
            }
        }
    };

    // ?? Terminer un scan avec succ�s
    const completeScan = (filesCount) => {
        console.log(`? Scan termin� avec ${filesCount} fichier(s)`);
        
        setScanInProgress(false);
        setLastScanTime(new Date());
        
        // Fermer la notification de scan si elle existe
        if (scantoastRef.current) {
            scantoastRef.current.close();
            scantoastRef.current = null;
        }
        
        // Nettoyer le timeout de s�curit�
        clearAllTimeouts();
        
        // Revenir au polling normal
        stopPolling();
        startPolling();
        
        // Afficher une notification de succ�s (optionnel, on peut laisser)
        toast.success(`${filesCount} fichier(s) ajout�(s) avec succ�s`);
    };

    // ?? Fonction pour uploader plusieurs fichiers
    const uploadMultipleFiles = async (files) => {
        if (!files.length || !documentId) return;
        
        const pdfFiles = files.filter(file => file.type === 'application/pdf');
        
        if (pdfFiles.length === 0) {
            toast.error('Aucun fichier PDF dans la s�lection');
            return;
        }

        const formData = new FormData();
        pdfFiles.forEach(file => formData.append("files[]", file));
        formData.append("id_declaration", documentId);
        formData.append("id_classeur", id_classeur);

        try {
            setUploading(true);
            
            toast.info('Upload en cours...');

            const response = await axios.post(
                `${API_BASE_URL}/documents-declaration/upload-multiple`,
                formData,
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            

            if (response.data.success || response.data.documents) {
                const uploadedDocuments = response.data.documents || response.data.files || [];
                
                const newFiles = uploadedDocuments.map((doc, index) => ({
                    id: doc.id,
                    nom: doc.nom_native || doc.nom || pdfFiles[index]?.name || 'Sans nom',
                    url: `${API_BASE_URL}/documents-declaration/download/${doc.id}`,
                    created_at: doc.created_at || new Date().toISOString(),
                    size: doc.size || pdfFiles[index]?.size || 0,
                    type: doc.type || 'application/pdf'
                }));

                // Ajouter les nouveaux fichiers au d�but de la liste
                setUploadedFiles(prev => [...newFiles, ...prev]);
                
                toast.success(`${uploadedDocuments.length} fichier(s) upload�(s) avec succ�s`);
            }

        } catch (err) {
            console.error("Erreur upload multiple:", err);
            
            let errorMessage = '�chec lors de l\'upload des fichiers';
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            
            toast.error(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    // ?? Annuler un scan en cours
    const cancelScan = () => {
        setConfirmCancelScan(true);
    };

    const confirmCancelScanAction = () => {
        setConfirmCancelScan(false);
        setScanInProgress(false);
        
        clearAllTimeouts();
        
        if (scantoastRef.current) {
            scantoastRef.current.close();
            scantoastRef.current = null;
        }
        
        stopPolling();
        startPolling();
        
        toast.info('Le scan a ete annule');
    };

    // ?? D�marrer le scan avec le scanner Windows
    const handleStartScan = async () => {
        // V�rifier d'abord la connexion
        const connectionResult = await scannerService.testConnectionWithInstructions();
        
        if (!connectionResult.connected) {
            toast.error(connectionResult.message || connectionResult.title || "Scanner non connect�");
            setShowScannerConfig(true);
            return;
        }

        // V�rifier les informations requises
        if (!scannerConfig.token || !scannerConfig.idDeclaration || !scannerConfig.idClasseur) {
            toast.error('Veuillez remplir tous les champs requis');
            return;
        }

        // Configurer le scanner
        toast.info('Envoi des param�tres au scanner');

        try {
            // 1. Envoyer l'URL de l'API
            const urlResult = await scannerService.setApiUrl(scannerConfig.apiUrl);
            if (!urlResult.success) {
                                toast.error(urlResult.message);
                return;
            }

            // 2. Envoyer les infos du document
            const infoResult = await scannerService.setDocumentInfo(
                scannerConfig.idDeclaration,
                scannerConfig.idClasseur,
                scannerConfig.token,
                scannerConfig.nom_fichier
            );
            
            if (!infoResult.success) {
                                toast.error(infoResult.message);
                return;
            }

                        // 3. Demander confirmation
            if (true) {
                // 4. D�marrer le scan
                setScanInProgress(true);
                scanStartTimeRef.current = new Date();
                
                // Timeout de s�curit� (3 minutes)
                scanSafetyTimeoutRef.current = setTimeout(() => {
                    if (scanInProgress) {
                        console.log("?? Timeout de s�curit� atteint");
                        setScanInProgress(false);
                        
                        // Fermer la notification de scan
                        if (scantoastRef.current) {
                            scantoastRef.current.close();
                            scantoastRef.current = null;
                        }
                        
                        // Revenir au polling normal
                        stopPolling();
                        startPolling();
                        
                        toast.warning('Le scan a pris trop de temps. V�rifiez l\'application scanner.');
                    }
                }, 180000); // 3 minutes

                // Augmenter la fr�quence de v�rification pendant le scan
                stopPolling();
                pollingIntervalRef.current = setInterval(() => {
                    fetchExistingFiles();
                }, 1500); // V�rifier toutes les 1.5 secondes pendant le scan

                const scanResult = await scannerService.startScan();
                
                if (scanResult.success) {
                    // Afficher la notification de scan
                    scantoastRef.current = setDetailItem(row);
                } else {
                    // En cas d'erreur
                    clearAllTimeouts();
                    setScanInProgress(false);
                    stopPolling();
                    startPolling();
                    
                    toast.error(scanResult.message || 'Impossible de d�marrer le scan');
                }
            }

        } catch (error) {
            await 
            clearAllTimeouts();
            setScanInProgress(false);
            stopPolling();
            startPolling();
            
            toast.error('Impossible de communiquer avec le scanner');
        }
    };

    // ?? Tester la connexion au scanner
    const testScannerConnection = async () => {
        const result = await scannerService.testConnectionWithInstructions();
        
        if (result.connected) {
            toast.success('Scanner connect� !');
        } else {
            toast.warning(result.title);
        }
    };

    // ?? Supprimer un fichier
    const handleRemoveFile = async (fileId) => {
        const file = uploadedFiles.find(f => f.id === fileId);
        if (!file) return;

        const confirmed = await setDetailItem(file);

        if (confirmed.isConfirmed) {
            try {
                await axios.delete(
                    `${API_BASE_URL}/delete-document/${fileId}`,
                    { 
                        headers: { 
                            'Authorization': `Bearer ${token}` 
                        } 
                    }
                );
                
                setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
                
                toast.success(`"${file.nom}" a �t� supprim� avec succ�s`);
            } catch (err) {
                console.error("? Erreur suppression:", err);
                
                let errorMessage = 'Impossible de supprimer le fichier';
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                }
                
                toast.error(errorMessage);
            }
        }
    };

    // ?? Drag & Drop
    const handleDragEnter = useCallback(e => { 
        e.preventDefault(); 
        e.stopPropagation(); 
        if (!uploading) setIsDragging(true); 
    }, [uploading]);
    
    const handleDragLeave = useCallback(e => { 
        e.preventDefault(); 
        e.stopPropagation(); 
        setIsDragging(false); 
    }, []);
    
    const handleDragOver = useCallback(e => { 
        e.preventDefault(); 
        e.stopPropagation(); 
    }, []);
    
    const handleDrop = useCallback(e => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const files = Array.from(e.dataTransfer.files);
        uploadMultipleFiles(files);
    }, [documentId, id_classeur, token]);

    // ?? Formatage de la date
    const formatDate = (dateString) => {
        if (!dateString) return 'Date inconnue';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    };

    // ?? Formatage de la taille
    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!documentId) {
        return (
            <div className="modal-backdrop fade show">
                <div className="modal fade show block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border border-slate-200-0 shadow-lg">
                            <div className="modal-header bg-red-600 text-white">
                                <h5 className="modal-title">Erreur</h5>
                                <button type="button" className="close text-white" onClick={onClose}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body text-center py-5">
                                <FaTimes className="text-red-600 mb-3" style={{ fontSize: '3rem' }} />
                                <h5>Document non trouv�</h5>
                                <p className="text-gray-500">L'ID du document est manquant</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal fade show block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content border border-slate-200-0 shadow-lg" style={{ maxHeight: '90vh' }}>
                        
                        <div className="modal-header bg-indigo-600 text-white sticky-top">
                            <div className="flex items-center">
                                <FaFilePdf className="mr-2" style={{ fontSize: '1.5rem' }} />
                                <div>
                                    <h5 className="modal-title mb-0">Fichiers PDF</h5>
                                    <small className="block">
                                        Document #{documentId} � Classeur: {id_classeur || 'N/A'}
                                        {scanInProgress && (
                                            <span className="ml-2 inline-flex px-2 py-0.5 rounded-lg-full text-xs font-medium inline-flex px-2 py-0.5 rounded-lg-full text-xs font-medium-warning">
                                                <FaSpinner className="fa-spin mr-1" /> Scan en cours...
                                            </span>
                                        )}
                                    </small>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                className="close text-white" 
                                onClick={onClose} 
                                disabled={uploading || scanInProgress}
                                style={{ opacity: (uploading || scanInProgress) ? 0.5 : 1 }}
                            >
                                <span>&times;</span>
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Indicateur de scan en cours */}
                            {scanInProgress && (
                                <div className="p-4 rounded-lg-lg border border-slate-200 p-4 rounded-lg-lg border border-slate-200-info flex items-center mb-3">
                                    <FaSpinner className="fa-spin mr-2" />
                                    <div className="flex-grow-1">
                                        <strong>Scan en cours...</strong>
                                        <small className="block text-gray-500">
                                            Les fichiers scann�s appara�tront automatiquement ici
                                        </small>
                                    </div>
                                    <button 
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={cancelScan}
                                    >
                                        <FaStopCircle className="mr-1" /> Annuler
                                    </button>
                                </div>
                            )}

                            {/* Section fichiers existants */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h6 className="font-bold text-indigo-600 mb-0">
                                        <FaHistory className="mr-2" /> 
                                        Fichiers attach�s ({uploadedFiles.length})
                                    </h6>
                                    <div>
                                        <button 
                                            className="btn btn-sm btn-outline-primary mr-2"
                                            onClick={fetchExistingFiles}
                                            disabled={loadingExistingFiles || uploading}
                                            title="Rafra�chir manuellement"
                                        >
                                            <FaSpinner className={loadingExistingFiles ? 'fa-spin mr-1' : ''} />
                                            Actualiser
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-outline-info"
                                            onClick={testScannerConnection}
                                            title="V�rifier la connexion au scanner"
                                        >
                                            Tester connexion
                                        </button>
                                    </div>
                                </div>
                                
                                {loadingExistingFiles ? (
                                    <div className="text-center py-5">
                                        <FaSpinner className="fa-spin mr-2" style={{ fontSize: '2rem' }} />
                                        <p className="mt-2">Chargement des fichiers...</p>
                                    </div>
                                ) : uploadedFiles.length > 0 ? (
                                    <div className="w-full border-collapse-responsive">
                                        <table className="w-full border-collapse w-full border-collapse-hover">
                                            <thead className="thead-light">
                                                <tr>
                                                    <th style={{ width: '40%' }}>Nom du fichier</th>
                                                    <th>Taille</th>
                                                    <th>Date d'ajout</th>
                                                    <th style={{ width: '20%' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {uploadedFiles.map(file => (
                                                    <tr key={file.id}>
                                                        <td>
                                                            <div className="flex items-center">
                                                                <FaFilePdf className="text-red-600 mr-2" />
                                                                <span className="font-bold text-truncate" style={{ maxWidth: '300px' }}>
                                                                    {file.nom}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="inline-flex px-2 py-0.5 rounded-lg-full text-xs font-medium inline-flex px-2 py-0.5 rounded-lg-full text-xs font-medium-light">
                                                                {formatFileSize(file.size)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <small className="text-gray-500">
                                                                {formatDate(file.created_at)}
                                                            </small>
                                                        </td>
                                                        <td>
                                                            <div className="inline-flex gap-2 inline-flex gap-2-sm">
                                                                <button 
                                                                    className="btn btn-outline-info"
                                                                    onClick={() => window.open(file.url, '_blank')}
                                                                    title="Pr�visualiser"
                                                                    disabled={uploading}
                                                                >
                                                                    <FaEye />
                                                                </button>
                                                                <button 
                                                                    className="btn btn-outline-success"
                                                                    onClick={() => window.open(file.url, '_blank')}
                                                                    title="T�l�charger"
                                                                    disabled={uploading}
                                                                >
                                                                    <FaDownload />
                                                                </button>
                                                                <button 
                                                                    className="btn btn-outline-danger"
                                                                    onClick={() => handleRemoveFile(file.id)}
                                                                    title="Supprimer"
                                                                    disabled={uploading}
                                                                >
                                                                    <FaTrash />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-lg-lg border border-slate-200 p-4 rounded-lg-lg border border-slate-200-info">
                                        <div className="flex items-center">
                                            <FaFilePdf className="mr-3" style={{ fontSize: '1.5rem' }} />
                                            <div>
                                                <p className="mb-0">Aucun fichier PDF n'est attach� � ce document</p>
                                                <small className="text-gray-500">
                                                    Utilisez le formulaire ci-dessous pour ajouter des fichiers
                                                    {scanInProgress && " (scan en cours...)"}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section upload et scan */}
                            <div className="mb-4">
                                <h6 className="font-bold mb-3 text-indigo-600">
                                    <FaCloudUploadAlt className="mr-2" />
                                    Ajouter de nouveaux fichiers
                                </h6>
                                
                                <div
                                    className={`drop-zone ${isDragging ? 'dragging' : ''} ${uploading ? 'disabled' : ''}`}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    style={{
                                        border: `3px dashed ${isDragging ? '#28a745' : uploading ? '#adb5bd' : '#007bff'}`,
                                        borderRadius: '12px',
                                        padding: '2rem',
                                        textAlign: 'center',
                                        backgroundColor: isDragging ? '#e8f5e9' : uploading ? '#f8f9fa' : '#f0f8ff',
                                        transition: 'all 0.3s ease',
                                        cursor: uploading ? 'not-allowed' : 'pointer',
                                        opacity: uploading ? 0.7 : 1
                                    }}
                                >
                                    <FaCloudUploadAlt 
                                        className="mb-3" 
                                        style={{ 
                                            fontSize: '3rem', 
                                            color: isDragging ? '#28a745' : uploading ? '#adb5bd' : '#007bff' 
                                        }} 
                                    />
                                    <h5 className="mb-2">
                                        {isDragging ? 'L�chez les fichiers ici' : 'Glissez-d�posez vos fichiers PDF'}
                                    </h5>
                                    <p className="text-gray-500 mb-3">Taille maximale: 50MB par fichier � Formats accept�s: PDF uniquement</p>

                                    <div className="flex justify-center flex-wrap">
                                        <label className={`bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg btn-lg mr-3 mb-2 ${uploading ? 'disabled' : ''}`}>
                                            {uploading ? (
                                                <>
                                                    <FaSpinner className="fa-spin mr-2" />
                                                    Upload en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <FaFilePdf className="mr-2" />
                                                    Choisir des fichiers
                                                    <input 
                                                        type="file" 
                                                        multiple 
                                                        accept=".pdf,application/pdf" 
                                                        onChange={e => {
                                                            const files = Array.from(e.target.files);
                                                            if (files.length > 0) {
                                                                uploadMultipleFiles(files);
                                                            }
                                                            e.target.value = '';
                                                        }} 
                                                        style={{ display: 'none' }} 
                                                        disabled={uploading || scanInProgress}
                                                    />
                                                </>
                                            )}
                                        </label>

                                        <button 
                                            className="btn btn-warning btn-lg mb-2"
                                            onClick={handleStartScan}
                                            disabled={uploading || scanInProgress}
                                        >
                                            {scanInProgress ? (
                                                <>
                                                    <FaSpinner className="fa-spin mr-2" />
                                                    Scan en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <FaPrint className="mr-2" /> 
                                                    Scanner un document
                                                </>
                                            )}
                                        </button>

                                        <button 
                                            className="btn btn-outline-secondary btn-lg mb-2 ml-2"
                                            onClick={() => setShowScannerConfig(!showScannerConfig)}
                                            disabled={uploading || scanInProgress}
                                        >
                                            <FaCog className="mr-2" />
                                            Configurer
                                        </button>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <small className="text-gray-500">
                                            <FaBell className="mr-1" />
                                            <strong>Surveillance active :</strong> Les fichiers scann�s appara�tront automatiquement
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button 
                                className="btn btn-secondary"
                                onClick={onClose}
                                disabled={uploading || scanInProgress}
                            >
                                Fermer
                            </button>
                            <button 
                                className="btn btn-success"
                                onClick={() => {
                                    toast.success(`${uploadedFiles.length} fichier(s) attach�(s) au document`); onClose();;
                                }}
                                disabled={uploading || scanInProgress}
                            >
                                Terminer
                            </button>
                        </div>
                    </div>
                </div>
                        
</div>

            <style jsx>{`
                .modal-backdrop {
                    opacity: 0.5;
                }
                
                .drop-zone.dragging {
                    transform: scale(1.02);
                    box-shadow: 0 0 20px rgba(40, 167, 69, 0.2);
                }
                
                .drop-zone.disabled {
                    pointer-events: none;
                }
                
                .btn:disabled {
                    cursor: not-allowed;
                }
                
                .table td, .table th {
                    vertical-align: middle;
                }
                
                .modal-dialog-scrollable .modal-body {
                    max-height: calc(90vh - 200px);
                    overflow-y: auto;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .alert-success {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>

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
        </>
    );
};

export default FileUploadModal;

