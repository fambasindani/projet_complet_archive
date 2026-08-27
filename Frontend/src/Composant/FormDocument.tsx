// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import {
    FaUpload,
    FaFilePdf,
    FaTrash,
    FaTimes,
    FaPlus,
    FaPrint,
    FaCalendarAlt,
    FaHashtag,
    FaKey,
    FaFileSignature,
    FaFileAlt,
    FaMapMarkerAlt,
    FaBuilding,
    FaFolder,
    FaUser,
    FaPaperclip,
    FaCloudUploadAlt,
    FaEye,
    FaSave,
    FaArrowLeft,
    FaArrowRight,
    FaCheckCircle
} from 'react-icons/fa';
import { toast } from "../Composant/Toast";
import FileUploadModal from "../Modals/FileUploadModal";
import ConfirmModal from "../Modals/ConfirmModal";

const FormDocument = ({
    isEditing = false,
    documentToEdit = null,
    onCancel,
    onSuccess,
    directions = [],
    emplacements = [],
    classeurs = []
}) => {
    const token = GetTokenOrRedirect();
    const [confirmItem, setConfirmItem] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));
    const id_user = utilisateur?.id || "";

    const [formData, setFormData] = useState({
        id_direction: "",
        id_emplacement: "",
        id_classeur: "",
        id_user: id_user,
        date_creation: "",
        date_enregistrement: "",
        intitule: "",
        num_reference: "",
        mot_cle: "",
        num_declaration: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const [filePreviews, setFilePreviews] = useState([]);
    const [activeSection, setActiveSection] = useState(1);
    
    // Nouveaux états pour le modal
    const [showFileUploadModal, setShowFileUploadModal] = useState(false);
    const [createdDocumentId, setCreatedDocumentId] = useState(null);
    const [documentSubmitted, setDocumentSubmitted] = useState(false);
    const [confirmDeleteFile, setConfirmDeleteFile] = useState({ open: false, index: null });
    const [confirmCancel, setConfirmCancel] = useState(false);

    // Initialiser les données
    useEffect(() => {
        console.log("=== INITIALISATION FORMULAIRE ===");
        console.log("Mode édition:", isEditing);
        console.log("Document à éditer:", documentToEdit);

        if (isEditing && documentToEdit) {
            const data = {
                id_direction: documentToEdit.id_direction ? documentToEdit.id_direction.toString() : "",
                id_emplacement: documentToEdit.id_emplacement ? documentToEdit.id_emplacement.toString() : "",
                id_classeur: documentToEdit.id_classeur ? documentToEdit.id_classeur.toString() : "",
                id_user: id_user,
                date_creation: documentToEdit.date_creation ?
                    (documentToEdit.date_creation.split('T')[0] || "") : "",
                date_enregistrement: documentToEdit.date_enregistrement ?
                    (documentToEdit.date_enregistrement.split('T')[0] || "") : "",
                intitule: documentToEdit.intitule || "",
                num_reference: documentToEdit.num_reference || "",
                mot_cle: documentToEdit.mot_cle || "",
                num_declaration: documentToEdit.num_declaration || "",
            };

            console.log("Données formatées:", data);
            setFormData(data);
            
            // Si édition, charger les fichiers existants
            if (documentToEdit.id) {
                fetchExistingFiles(documentToEdit.id);
            }
        } else {
            setFormData({
                id_direction: "",
                id_emplacement: "",
                id_classeur: "",
                id_user: id_user,
                date_creation: "",
                date_enregistrement: "",
                intitule: "",
                num_reference: "",
                mot_cle: "",
                num_declaration: "",
            });
        }

        setErrors({});
        setFiles([]);
        setFilePreviews([]);
        setDocumentSubmitted(false);
        setCreatedDocumentId(null);
    }, [documentToEdit, id_user, isEditing]);

    // Fonction pour récupérer les fichiers existants en mode édition
    const fetchExistingFiles = async (documentId) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/documents/${documentId}/files`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            if (response.data && response.data.files) {
                // Transformer les fichiers existants en format compatible
                const existingFilesPreviews = response.data.files.map(file => ({
                    id: file.id,
                    name: file.original_name,
                    size: formatFileSize(file.size),
                    sizeBytes: file.size,
                    preview: file.url,
                    uploadDate: new Date(file.created_at).toLocaleTimeString('fr-FR'),
                    status: 'existing',
                    fileId: file.id
                }));
                
                setFilePreviews(existingFilesPreviews);
            }
        } catch (error) {
            console.error("Erreur lors du chargement des fichiers existants:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("=== DÉBUT SUBMIT ===");

        if (!token) {
            toast.error("Notification");
            return;
        }

        // Validation
        setErrors({});
        const validationErrors = {};
        const requiredFields = [
            'id_direction', 'id_emplacement', 'id_classeur',
            'date_creation', 'date_enregistrement',
            'intitule', 'num_reference', 'mot_cle', 'num_declaration'
        ];

        requiredFields.forEach(field => {
            const value = formData[field];
            if (!value || value.toString().trim() === '') {
                validationErrors[field] = ['Ce champ est obligatoire'];
            }
        });

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error('Champs obligatoires manquants');
            return;
        }

        setLoading(true);

        try {
            let response;

            if (isEditing) {
                // MODE ÉDITION : Envoyer en JSON sans fichiers
                console.log("=== MODE ÉDITION ===");

                const dataToSend = {
                    ...formData,
                    id_direction: parseInt(formData.id_direction),
                    id_emplacement: parseInt(formData.id_emplacement),
                    id_classeur: parseInt(formData.id_classeur),
                    id_user: parseInt(formData.id_user),
                    date_creation: formData.date_creation,
                    date_enregistrement: formData.date_enregistrement
                };

                console.log("Données envoyées (JSON):", dataToSend);

                response = await axios.put(
                    `${API_BASE_URL}/declarations/${documentToEdit.id}`,
                    dataToSend,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                // Après modification réussie, ouvrir le modal pour les fichiers
                setCreatedDocumentId(documentToEdit.id);
                setDocumentSubmitted(true);
                setShowFileUploadModal(true);
                
            } else {
                // MODE CRÉATION : Envoyer seulement les données du formulaire
                console.log("=== MODE CRÉATION ===");

                const dataToSend = {
                    ...formData,
                    id_direction: parseInt(formData.id_direction),
                    id_emplacement: parseInt(formData.id_emplacement),
                    id_classeur: parseInt(formData.id_classeur),
                    id_user: parseInt(formData.id_user),
                    date_creation: formData.date_creation,
                    date_enregistrement: formData.date_enregistrement
                };

                response = await axios.post(
                    `${API_BASE_URL}/declarations`,
                    dataToSend,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                // Récupérer l'ID du document créé
                const newDocumentId = response.data.id;
                setCreatedDocumentId(newDocumentId);
                setDocumentSubmitted(true);
                
                // Ouvrir le modal pour l'upload des fichiers
                setShowFileUploadModal(true);
                
                // Ne pas appeler onSuccess ici, on attendra la fermeture du modal
            }

            console.log("Réponse API:", response.data);

            // Ne pas fermer le formulaire, on attend le modal de fichiers
            toast.success(isEditing 
                    ? 'Le document a été modifié avec succès. Vous pouvez maintenant ajouter des fichiers.'
                    : 'Le document a été créé avec succès. Vous pouvez maintenant ajouter des fichiers.');

        } catch (error) {
            console.error('❌ Erreur détaillée:', error);

            if (error.response?.data?.errors) {
                const apiErrors = error.response.data.errors;
                const formattedErrors = {};

                Object.keys(apiErrors).forEach(key => {
                    formattedErrors[key] = Array.isArray(apiErrors[key])
                        ? apiErrors[key]
                        : [apiErrors[key]];
                });

                setErrors(formattedErrors);

                let errorMessage = 'Veuillez corriger les erreurs suivantes :<br><ul>';
                Object.keys(formattedErrors).forEach(field => {
                    errorMessage += `<li><strong>${getFieldLabel(field)}</strong>: ${formattedErrors[field].join(', ')}</li>`;
                });
                errorMessage += '</ul>';

                toast.error('Erreur de validation');
            } else {
                toast.error(error.response?.data?.message || error.message || 'Une erreur est survenue');
            }
        } finally {
            setLoading(false);
            console.log("=== FIN SUBMIT ===");
        }
    };

    // Fonction appelée quand l'upload des fichiers est terminé
    const handleFilesUploadComplete = (uploadedFiles) => {
        // Ajouter les fichiers uploadés à la liste
        const newFilePreviews = uploadedFiles.map(file => ({
            id: file.id || Date.now() + Math.random(),
            name: file.name,
            size: formatFileSize(file.size),
            sizeBytes: file.size,
            preview: file.url,
            uploadDate: new Date().toLocaleTimeString('fr-FR'),
            status: 'uploaded',
            fileId: file.id
        }));
        
        setFilePreviews(prev => [...prev, ...newFilePreviews]);
        
        // Message de succès
        toast.success(`${uploadedFiles.length} fichier(s) ajouté(s) avec succès`);
        
        // Fermer le modal
        setShowFileUploadModal(false);
        
        // Si c'est un nouveau document, appeler onSuccess
        if (!isEditing && onSuccess) {
            setTimeout(() => {
                onSuccess();
            }, 500);
        }
    };

    // Fonction appelée quand on annule l'upload des fichiers
    const handleFilesUploadCancel = () => {
        setShowFileUploadModal(false);
        
        // Si c'est un nouveau document et on annule l'upload, on revient à la liste
        if (!isEditing) {
            toast.info('Le document a été créé mais aucun fichier n\'a été ajouté.'); if (true) {
                if (onSuccess) onSuccess();
            };
        }
    };

    const handleRemoveFile = async (index) => {
        setConfirmDeleteFile({ open: true, index });
    };

    const confirmRemoveFile = async () => {
        const { index } = confirmDeleteFile;
        setConfirmDeleteFile({ open: false, index: null });
        const fileToRemove = filePreviews[index];
        if (fileToRemove.fileId && createdDocumentId) {
            try {
                await axios.delete(
                    `${API_BASE_URL}/documents/${createdDocumentId}/files/${fileToRemove.fileId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (error) {
                console.error("Erreur lors de la suppression du fichier:", error);
            }
        }
        setFilePreviews(prev => prev.filter((_, i) => i !== index));
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handlePreviewFile = (file) => {
        if (file.preview) {
            window.open(file.preview, '_blank');
        } else if (file.fileObject) {
            const blobURL = URL.createObjectURL(file.fileObject);
            window.open(blobURL, '_blank');
            setTimeout(() => URL.revokeObjectURL(blobURL), 1000);
        }
    };

    const getFieldLabel = (field) => {
        const labels = {
            id_direction: 'Direction',
            id_emplacement: 'Emplacement',
            id_classeur: 'Classeur',
            date_creation: 'Date de création',
            date_enregistrement: 'Date d\'enregistrement',
            intitule: 'Intitulé',
            num_reference: 'Numéro de référence',
            mot_cle: 'Mot clé',
            num_declaration: 'Numéro de déclaration'
        };
        return labels[field] || field;
    };

    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    const setToday = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: getTodayDate()
        }));
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Sections du formulaire
    const sections = [
        { id: 1, title: "Informations principales", icon: <FaBuilding /> },
        { id: 2, title: "Dates et intitulé", icon: <FaCalendarAlt /> },
        { id: 3, title: "Références", icon: <FaHashtag /> }
    ];

    return (
        <div className="max-w-5xl mx-auto">
            {showFileUploadModal && createdDocumentId && (
                <FileUploadModal
                    documentId={createdDocumentId}
                    id_classeur={formData.id_classeur}
                    onClose={handleFilesUploadCancel}
                    onUploadComplete={handleFilesUploadComplete}
                    token={token}
                    existingFiles={filePreviews}
                    nom_fichier={formData.intitule}
                />
            )}

            {/* Header */}
            <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-4 py-3">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-indigo-600 flex items-center gap-2">
                                <FaFileAlt />
                                {isEditing ? "Modifier le Document" : "Nouveau Document"}
                            </h4>
                            <p className="text-sm text-slate-500">
                                {isEditing
                                    ? "Modifiez les informations du document"
                                    : "Remplissez le formulaire pour ajouter un nouveau document"}
                            </p>
                        </div>
                        {!documentSubmitted && (
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition"
                                onClick={() => setConfirmCancel(true)}
                                disabled={loading}
                            >
                                <FaTimes /> Annuler
                            </button>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-center gap-3 mt-3">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                type="button"
                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                                    activeSection === section.id
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                onClick={() => setActiveSection(section.id)}
                                disabled={loading || documentSubmitted}
                            >
                                {section.icon}
                                {section.title}
                            </button>
                        ))}
                    </div>

                    {/* Progression */}
                    <div className="mt-3">
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                style={{ width: `${(activeSection / sections.length) * 100}%` }}
                            />
                        </div>
                        <p className="text-center text-xs text-slate-400 mt-1">
                            Étape {activeSection} sur {sections.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Contenu du formulaire */}
            <div className="py-6 bg-slate-50 min-h-[calc(100vh-200px)]">
                <form id="documentForm" onSubmit={handleSubmit}>
                    {/* Section 1 */}
                    {activeSection === 1 && (
                        <div className="animate-fadeIn">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-600" />
                                    <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <FaBuilding className="text-indigo-500" /> Informations principales
                                    </h5>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Direction <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="id_direction"
                                                value={formData.id_direction}
                                                onChange={handleChange}
                                                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                                                    errors.id_direction ? 'border-red-400' : 'border-slate-200'
                                                }`}
                                                disabled={loading || documentSubmitted}
                                            >
                                                <option value="">Sélectionnez une direction</option>
                                                {directions.map(dir => (
                                                    <option key={dir.id} value={dir.id}>{dir.nom}</option>
                                                ))}
                                            </select>
                                            {errors.id_direction && (
                                                <p className="text-red-500 text-xs mt-1.5">{errors.id_direction[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Emplacement <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="id_emplacement"
                                                value={formData.id_emplacement}
                                                onChange={handleChange}
                                                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                                                    errors.id_emplacement ? 'border-red-400' : 'border-slate-200'
                                                }`}
                                                disabled={loading || documentSubmitted}
                                            >
                                                <option value="">Sélectionnez un emplacement</option>
                                                {emplacements.map(emp => (
                                                    <option key={emp.id} value={emp.id}>{emp.nom_emplacement}</option>
                                                ))}
                                            </select>
                                            {errors.id_emplacement && (
                                                <p className="text-red-500 text-xs mt-1.5">{errors.id_emplacement[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Classeur <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="id_classeur"
                                                value={formData.id_classeur}
                                                onChange={handleChange}
                                                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                                                    errors.id_classeur ? 'border-red-400' : 'border-slate-200'
                                                }`}
                                                disabled={loading || documentSubmitted}
                                            >
                                                <option value="">Sélectionnez un classeur</option>
                                                {classeurs.map(cl => (
                                                    <option key={cl.id} value={cl.id}>{cl.nom_classeur}</option>
                                                ))}
                                            </select>
                                            {errors.id_classeur && (
                                                <p className="text-red-500 text-xs mt-1.5">{errors.id_classeur[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                <FaUser className="inline mr-1" /> Utilisateur
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 text-slate-500"
                                                value={utilisateur?.nom || "Non connecté"}
                                                readOnly
                                                disabled
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section 2 */}
                    {activeSection === 2 && (
                        <div className="animate-fadeIn">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-600" />
                                    <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <FaCalendarAlt className="text-indigo-500" /> Dates et intitulé
                                    </h5>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Date de création <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="date"
                                                    name="date_creation"
                                                    value={formData.date_creation}
                                                    onChange={handleChange}
                                                    className={`flex-1 border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                                                        errors.date_creation ? 'border-red-400' : 'border-slate-200'
                                                    }`}
                                                    max={getTodayDate()}
                                                    disabled={loading || documentSubmitted}
                                                />
                                                <button
                                                    type="button"
                                                    className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition whitespace-nowrap"
                                                    onClick={() => setToday('date_creation')}
                                                    disabled={loading || documentSubmitted}
                                                >
                                                    Aujourd'hui
                                                </button>
                                            </div>
                                            {errors.date_creation && (
                                                <p className="text-red-500 text-xs mt-1.5">{errors.date_creation[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Date d'enregistrement <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="date"
                                                    name="date_enregistrement"
                                                    value={formData.date_enregistrement}
                                                    onChange={handleChange}
                                                    className={`flex-1 border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                                                        errors.date_enregistrement ? 'border-red-400' : 'border-slate-200'
                                                    }`}
                                                    max={getTodayDate()}
                                                    disabled={loading || documentSubmitted}
                                                />
                                                <button
                                                    type="button"
                                                    className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition whitespace-nowrap"
                                                    onClick={() => setToday('date_enregistrement')}
                                                    disabled={loading || documentSubmitted}
                                                >
                                                    Aujourd'hui
                                                </button>
                                            </div>
                                            {errors.date_enregistrement && (
                                                <p className="text-red-500 text-xs mt-1.5">{errors.date_enregistrement[0]}</p>
                                            )}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                <FaFileAlt className="inline mr-1" /> Intitulé <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                name="intitule"
                                                placeholder="Ex: Contrat de travail, Facture n°123..."
                                                value={formData.intitule}
                                                onChange={handleChange}
                                                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                                                    errors.intitule ? 'border-red-400' : 'border-slate-200'
                                                }`}
                                                disabled={loading || documentSubmitted}
                                            />
                                            {errors.intitule && (
                                                <p className="text-red-500 text-xs mt-1.5">{errors.intitule[0]}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section 3 */}
                    {activeSection === 3 && (
                        <div className="animate-fadeIn">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-600" />
                                    <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <FaHashtag className="text-indigo-500" /> Références
                                    </h5>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Numéro Référence <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                name="num_reference"
                                                placeholder="REF-0001"
                                                value={formData.num_reference}
                                                onChange={handleChange}
                                                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                                                    errors.num_reference ? 'border-red-400' : 'border-slate-200'
                                                }`}
                                                disabled={loading || documentSubmitted}
                                            />
                                            {errors.num_reference && (
                                                <p className="text-red-500 text-xs mt-1.5">{errors.num_reference[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Mot Clé <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                name="mot_cle"
                                                placeholder="Ex: Contrat, Facture..."
                                                value={formData.mot_cle}
                                                onChange={handleChange}
                                                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                                                    errors.mot_cle ? 'border-red-400' : 'border-slate-200'
                                                }`}
                                                disabled={loading || documentSubmitted}
                                            />
                                            {errors.mot_cle && (
                                                <p className="text-red-500 text-xs mt-1.5">{errors.mot_cle[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Numéro Référence Interne <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                name="num_declaration"
                                                placeholder="DEC-2023-001"
                                                value={formData.num_declaration}
                                                onChange={handleChange}
                                                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                                                    errors.num_declaration ? 'border-red-400' : 'border-slate-200'
                                                }`}
                                                disabled={loading || documentSubmitted}
                                            />
                                            {errors.num_declaration && (
                                                <p className="text-red-500 text-xs mt-1.5">{errors.num_declaration[0]}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fichiers attachés */}
                    {documentSubmitted && filePreviews.length > 0 && (
                        <div className="animate-fadeIn mt-6">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <FaPaperclip className="text-emerald-500" /> Fichiers attachés ({filePreviews.length})
                                    </h5>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filePreviews.map((file, index) => (
                                            <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white transition">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <FaFilePdf className="text-red-500 shrink-0" size={20} />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                                                        <p className="text-xs text-slate-400">{file.size} • {file.uploadDate}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                                    <button
                                                        type="button"
                                                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                                        onClick={() => handlePreviewFile(file)}
                                                        title="Prévisualiser"
                                                    >
                                                        <FaEye size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                        onClick={() => handleRemoveFile(index)}
                                                        title="Supprimer"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Barre d'actions fixe */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
                <div className="max-w-5xl mx-auto px-4 py-3">
                    <div className="flex justify-between items-center">
                        <div>
                            {activeSection > 1 && !documentSubmitted && (
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
                                    onClick={() => setActiveSection(activeSection - 1)}
                                    disabled={loading || documentSubmitted}
                                >
                                    <FaArrowLeft /> Précédent
                                </button>
                            )}
                        </div>

                        <div className="flex items-center">
                            {!documentSubmitted ? (
                                activeSection < sections.length ? (
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-700 transition"
                                        onClick={() => setActiveSection(activeSection + 1)}
                                        disabled={loading || documentSubmitted}
                                    >
                                        Suivant <FaArrowRight />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-emerald-700 transition"
                                        disabled={loading || documentSubmitted}
                                        onClick={() => {
                                            document.getElementById('documentForm')?.requestSubmit();
                                        }}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Enregistrement...
                                            </>
                                        ) : isEditing ? (
                                            <>
                                                <FaSave /> Enregistrer les modifications
                                            </>
                                        ) : (
                                            <>
                                                <FaCheckCircle /> Créer le document
                                            </>
                                        )}
                                    </button>
                                )
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                                        <FaCheckCircle /> Document enregistré
                                    </span>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 border border-indigo-200 text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition"
                                        onClick={() => setShowFileUploadModal(true)}
                                    >
                                        <FaPaperclip /> Ajouter d'autres fichiers
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmDeleteFile.open}
                onClose={() => setConfirmDeleteFile({ open: false, index: null })}
                onConfirm={confirmRemoveFile}
                title="Supprimer le fichier"
                message="Voulez-vous vraiment supprimer ce fichier ?"
                confirmText="Supprimer"
                cancelText="Annuler"
                variant="danger"
            />

            <ConfirmModal
                isOpen={confirmCancel}
                onClose={() => setConfirmCancel(false)}
                onConfirm={() => { setConfirmCancel(false); onCancel(); }}
                title="Quitter le formulaire"
                message="Voulez-vous vraiment annuler ? Les données non enregistrées seront perdues."
                confirmText="Oui, quitter"
                cancelText="Rester"
                variant="warning"
            />

            <style>{`
                .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default FormDocument;