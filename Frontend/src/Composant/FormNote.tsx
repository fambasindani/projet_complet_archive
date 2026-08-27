// @ts-nocheck
import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import {
    FaSave,
    FaTimes,
    FaArrowLeft,
    FaArrowRight,
    FaCheckCircle,
    FaPaperclip,
    FaFileAlt,
    FaCalendarAlt,
    FaHashtag,
    FaBuilding,
    FaUser,
    FaMapMarkerAlt,
    FaFolder,
    FaEye,
    FaFilePdf,
    FaTrash
} from 'react-icons/fa';
import { toast } from "../Composant/Toast";
import FileUploadModal from "../Modals/FileUploadModal";
import ConfirmModal from "../Modals/ConfirmModal";
import Droplist from "../Composant/DropList";
import Input from "../Composant/Input";
import ModalNote from "../Modals/ModalNote";
import ModalAssujetti from "../Modals/ModalAssujetti";

const FormNote = ({
    isEditing = false,
    noteToEdit = null,
    onCancel,
    onSuccess,
    directions = [],
    classeurs = [],
    centres = [],
    emplacements = []
}) => {
    const token = GetTokenOrRedirect();
    const [confirmItem, setConfirmItem] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));
    const id_user = utilisateur?.id || "";

    const [formData, setFormData] = useState({
        id_ministere: "",
        numero_serie: "",
        date_ordonnancement: "",
        date_enregistrement: "",
        id_classeur: "",
        id_user: id_user,
        id_centre_ordonnancement: "",
        id_assujetti: "",
        id_emplacement: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [filePreviews, setFilePreviews] = useState([]);
    const [activeSection, setActiveSection] = useState(1);

    // États pour le modal d'upload
    const [showFileUploadModal, setShowFileUploadModal] = useState(false);
    const [createdNoteId, setCreatedNoteId] = useState(null);
    const [noteSubmitted, setNoteSubmitted] = useState(false);
    const [selectedNom, setSelectedNom] = useState(null);

    // Modal pour sélectionner l'assujetti
    const [showAssujettiModal, setShowAssujettiModal] = useState(false);
    const [confirmDeleteFile, setConfirmDeleteFile] = useState({ open: false, index: null });
    const [confirmCancel, setConfirmCancel] = useState(false);

    // Modal documents
    const [isModalNoteOpen, setIsModalNoteOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [monprojet, setmonprojet] = useState(null);
    const [idclasseur, setidclasseur] = useState(null);
    const [idcentre, setidcentre] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const ouvrirModalAvecId = (item) => {
        setSelectedId(item.id);
        setmonprojet(item.assujetti.nom_raison_sociale);
        setidclasseur(item.id_classeur);
        setidcentre(item.id_centre_ordonnancement);
        setIsModalNoteOpen(true);
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    // Effet pour surveiller les changements (débogage)
    useEffect(() => {
        console.log("=== ÉTAT ACTUEL ===");
        console.log("showFileUploadModal:", showFileUploadModal);
        console.log("createdNoteId:", createdNoteId);
        console.log("noteSubmitted:", noteSubmitted);
        console.log("==================");
    }, [showFileUploadModal, createdNoteId, noteSubmitted]);

    // Initialiser les données
    useEffect(() => {
        if (isEditing && noteToEdit) {
            const data = {
                id_ministere: noteToEdit.id_ministere ? noteToEdit.id_ministere.toString() : "",
                numero_serie: noteToEdit.numero_serie || "",
                date_ordonnancement: noteToEdit.date_ordonnancement ?
                    (noteToEdit.date_ordonnancement.split('T')[0] || "") : "",
                date_enregistrement: noteToEdit.date_enregistrement ?
                    (noteToEdit.date_enregistrement.split('T')[0] || "") : "",
                id_classeur: noteToEdit.id_classeur ? noteToEdit.id_classeur.toString() : "",
                id_user: id_user,
                id_centre_ordonnancement: noteToEdit.id_centre_ordonnancement ?
                    noteToEdit.id_centre_ordonnancement.toString() : "",
                id_assujetti: noteToEdit.id_assujetti ? noteToEdit.id_assujetti.toString() : "",
                id_emplacement: noteToEdit.id_emplacement ? noteToEdit.id_emplacement.toString() : "",
            };

            setFormData(data);

            // Récupérer le nom de l'assujetti
            if (noteToEdit.assujetti) {
                setSelectedNom({
                    id: noteToEdit.id_assujetti,
                    nom_raison_sociale: noteToEdit.assujetti.nom_raison_sociale
                });
            }

            // Charger les fichiers existants
            if (noteToEdit.id) {
                fetchExistingFiles(noteToEdit.id);
            }
        } else {
            setFormData({
                id_ministere: "",
                numero_serie: "",
                date_ordonnancement: "",
                date_enregistrement: "",
                id_classeur: "",
                id_user: id_user,
                id_centre_ordonnancement: "",
                id_assujetti: "",
                id_emplacement: "",
            });
            setSelectedNom(null);
        }

        setErrors({});
        setFilePreviews([]);
        setNoteSubmitted(false);
        setCreatedNoteId(null);
    }, [noteToEdit, id_user, isEditing]);

    // Récupérer les fichiers existants
    const fetchExistingFiles = async (noteId) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/documents/${noteId}/files`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data && response.data.files) {
                const existingFilesPreviews = response.data.files.map(file => ({
                    id: file.id,
                    name: file.original_name,
                    size: formatFileSize(file.size),
                    preview: file.url,
                    uploadDate: new Date(file.created_at).toLocaleTimeString('fr-FR'),
                    status: 'existing',
                    fileId: file.id
                }));
                setFilePreviews(existingFilesPreviews);
            }
        } catch (error) {
            console.error("Erreur lors du chargement des fichiers:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const selectAssujetti = (assujetti) => {
        setSelectedNom(assujetti);
        setFormData(prev => ({ ...prev, id_assujetti: assujetti.id }));
        setShowAssujettiModal(false);
    };

    const selectnom = (assujetti) => {
        setSelectedNom(assujetti);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error('Session expirée');
            return;
        }

        if (!selectedNom) {
            toast.error('Veuillez sélectionner un assujetti');
            return;
        }

        const validationErrors = {};
        const requiredFields = [
            'id_ministere', 'numero_serie', 'date_ordonnancement',
            'date_enregistrement', 'id_classeur', 'id_centre_ordonnancement',
            'id_emplacement'
        ];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                validationErrors[field] = ['Ce champ est obligatoire'];
            }
        });

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error('Veuillez remplir tous les champs obligatoires');
            return;
        }

        setLoading(true);

        try {
            let response;
            const dataToSend = {
                ...formData,
                id_ministere: parseInt(formData.id_ministere),
                id_classeur: parseInt(formData.id_classeur),
                id_centre_ordonnancement: parseInt(formData.id_centre_ordonnancement),
                id_assujetti: parseInt(selectedNom.id),
                id_emplacement: parseInt(formData.id_emplacement),
                id_user: parseInt(id_user)
            };

            console.log("=== SUBMIT NOTE ===");
            console.log("Données à envoyer:", dataToSend);

            if (isEditing) {
                // MODE ÉDITION
                response = await axios.put(
                    `${API_BASE_URL}/notes/${noteToEdit.id}`,
                    dataToSend,
                    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
                );

                console.log("Réponse édition:", response.data);
                
                setCreatedNoteId(noteToEdit.id);
                setNoteSubmitted(true);
                setShowFileUploadModal(true);

            } else {
                // MODE CRÉATION
                response = await axios.post(
                    `${API_BASE_URL}/notes`,
                    dataToSend,
                    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
                );

                console.log("Réponse création:", response.data);
                
                // La réponse API ne contient que le message, pas l'ID
                // On doit récupérer la dernière note créée par l'utilisateur
                
                try {
                    // Récupérer les notes triées par ID décroissant (la plus récente en premier)
                    const notesResponse = await axios.get(
                        `${API_BASE_URL}/notes?page=1`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    
                    console.log("Liste des notes:", notesResponse.data);
                    
                    if (notesResponse.data && notesResponse.data.data && notesResponse.data.data.length > 0) {
                        // Trier par ID descendant pour prendre le plus récent
                        const sortedNotes = notesResponse.data.data.sort((a, b) => b.id - a.id);
                        const lastNoteId = sortedNotes[0].id;
                        
                        console.log("ID de la dernière note trouvée:", lastNoteId);
                        
                        setCreatedNoteId(lastNoteId);
                        setNoteSubmitted(true);
                        setShowFileUploadModal(true);
                        
                        toast.success('Vous pouvez maintenant ajouter des fichiers');
                    } else {
                        console.error("Aucune note trouvée");
                        
                        // Fallback: on affiche quand même le succès mais sans upload
                        toast.success('La note a été créée avec succès');
                        if (onSuccess) onSuccess();
                    }
                } catch (error) {
                    console.error("Erreur lors de la récupération de la dernière note:", error);
                    
                    // En cas d'erreur, on ferme quand même
                    toast.success('La note a été créée avec succès');
                    if (onSuccess) onSuccess();
                }
            }

        } catch (error) {
            console.error('Erreur:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);

                let errorMessage = 'Veuillez corriger les erreurs :<br><ul>';
                Object.keys(error.response.data.errors).forEach(field => {
                    errorMessage += `<li><strong>${getFieldLabel(field)}</strong>: ${error.response.data.errors[field].join(', ')}</li>`;
                });
                errorMessage += '</ul>';

                toast.error('Erreur de validation');
            } else {
                toast.error(error.response?.data?.message || 'Une erreur est survenue');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFilesUploadComplete = (uploadedFiles) => {
        console.log("Upload terminé, fichiers:", uploadedFiles);

        const newFilePreviews = uploadedFiles.map(file => ({
            id: file.id || Date.now(),
            name: file.name,
            size: formatFileSize(file.size),
            preview: file.url,
            uploadDate: new Date().toLocaleTimeString('fr-FR'),
            status: 'uploaded',
            fileId: file.id
        }));

        setFilePreviews(prev => [...prev, ...newFilePreviews]);
        setShowFileUploadModal(false);

        toast.success(`${uploadedFiles.length} fichier(s) ajouté(s)`);

        if (!isEditing && onSuccess) {
            setTimeout(() => onSuccess(), 500);
        }
    };

    const handleFilesUploadCancel = () => {
        console.log("Annulation upload");
        setShowFileUploadModal(false);
        if (!isEditing) {
            toast.info('La note a été créée mais aucun fichier n\'a été ajouté'); if (true) {
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
        if (fileToRemove.fileId && createdNoteId) {
            try {
                await axios.delete(
                    `${API_BASE_URL}/documents/${createdNoteId}/files/${fileToRemove.fileId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (error) {
                console.error("Erreur lors de la suppression:", error);
            }
        }
        setFilePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handlePreviewFile = (file) => {
        if (file.preview) {
            window.open(file.preview, '_blank');
        }
    };

    const getFieldLabel = (field) => {
        const labels = {
            id_ministere: 'Service d\'Assiette',
            numero_serie: 'Numéro de série',
            date_ordonnancement: "Date d'ordonnancement",
            date_enregistrement: "Date d'enregistrement",
            id_classeur: 'Classeur',
            id_centre_ordonnancement: 'Centre d\'ordonnancement',
            id_assujetti: 'Assujetti',
            id_emplacement: 'Emplacement'
        };
        return labels[field] || field;
    };

    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    const setToday = (field) => {
        setFormData(prev => ({ ...prev, [field]: getTodayDate() }));
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const sections = [
        { id: 1, title: "Informations principales", icon: <FaBuilding /> },
        { id: 2, title: "Dates et références", icon: <FaCalendarAlt /> }
    ];

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-4 py-3">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-indigo-600 flex items-center gap-2">
                                <FaFileAlt />
                                {isEditing ? "Modifier la Note" : "Nouvelle Note de Perception"}
                            </h4>
                            <p className="text-sm text-slate-500">
                                {isEditing ? "Modifiez les informations de la note" : "Remplissez le formulaire pour ajouter une nouvelle note"}
                            </p>
                        </div>
                        {!noteSubmitted && (
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
                                disabled={loading || noteSubmitted}
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
                    </div>
                </div>
            </div>

            {/* Contenu du formulaire */}
            <div className="py-6 bg-slate-50 min-h-[calc(100vh-200px)]">
                <form id="noteForm" onSubmit={handleSubmit}>
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
                                                Service d'Assiette <span className="text-red-500">*</span>
                                            </label>
                                            <Droplist
                                                name="id_ministere"
                                                value={formData.id_ministere}
                                                onChange={handleChange}
                                                options={directions}
                                                placeholder="-- Sélectionnez un service d'assiette --"
                                                error={errors.id_ministere && errors.id_ministere[0]}
                                                disabled={loading || noteSubmitted}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Numéro Série <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="numero_serie"
                                                placeholder="Ex: NS-2024-001"
                                                value={formData.numero_serie}
                                                onChange={handleChange}
                                                icon="fas fa-hashtag"
                                                error={errors.numero_serie && errors.numero_serie[0]}
                                                disabled={loading || noteSubmitted}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Classeur <span className="text-red-500">*</span>
                                            </label>
                                            <Droplist
                                                name="id_classeur"
                                                value={formData.id_classeur}
                                                onChange={handleChange}
                                                options={classeurs}
                                                placeholder="-- Sélectionnez un classeur --"
                                                error={errors.id_classeur && errors.id_classeur[0]}
                                                disabled={loading || noteSubmitted}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Centre d'Ordonnancement <span className="text-red-500">*</span>
                                            </label>
                                            <Droplist
                                                name="id_centre_ordonnancement"
                                                value={formData.id_centre_ordonnancement}
                                                onChange={handleChange}
                                                options={centres}
                                                placeholder="-- Sélectionnez un centre d'ordonnancement --"
                                                error={errors.id_centre_ordonnancement && errors.id_centre_ordonnancement[0]}
                                                disabled={loading || noteSubmitted}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Assujetti <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 focus:outline-none"
                                                    value={selectedNom ? selectedNom.nom_raison_sociale : ''}
                                                    placeholder="Sélectionnez un assujetti"
                                                    readOnly
                                                />
                                                <button
                                                    type="button"
                                                    className="px-4 py-2.5 border border-indigo-200 text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition whitespace-nowrap"
                                                    disabled={loading || noteSubmitted}
                                                    onClick={handleOpenModal}
                                                >
                                                    Choisir
                                                </button>
                                            </div>
                                            {errors.id_assujetti && (
                                                <p className="text-red-500 text-xs mt-1.5">{errors.id_assujetti[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Emplacement <span className="text-red-500">*</span>
                                            </label>
                                            <Droplist
                                                name="id_emplacement"
                                                value={formData.id_emplacement}
                                                onChange={handleChange}
                                                options={emplacements}
                                                placeholder="-- Sélectionnez un emplacement --"
                                                error={errors.id_emplacement && errors.id_emplacement[0]}
                                                disabled={loading || noteSubmitted}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
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
                                        <FaCalendarAlt className="text-indigo-500" /> Dates et références
                                    </h5>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Date d'ordonnancement <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="date"
                                                    name="date_ordonnancement"
                                                    value={formData.date_ordonnancement}
                                                    onChange={handleChange}
                                                    className={`flex-1 border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                                                        errors.date_ordonnancement ? 'border-red-400' : 'border-slate-200'
                                                    }`}
                                                    disabled={loading || noteSubmitted}
                                                />
                                                <button
                                                    type="button"
                                                    className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition whitespace-nowrap"
                                                    onClick={() => setToday('date_ordonnancement')}
                                                    disabled={loading || noteSubmitted}
                                                >
                                                    Aujourd'hui
                                                </button>
                                            </div>
                                            {errors.date_ordonnancement && (
                                                <p className="text-red-500 text-xs mt-1.5">{errors.date_ordonnancement[0]}</p>
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
                                                    disabled={loading || noteSubmitted}
                                                />
                                                <button
                                                    type="button"
                                                    className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition whitespace-nowrap"
                                                    onClick={() => setToday('date_enregistrement')}
                                                    disabled={loading || noteSubmitted}
                                                >
                                                    Aujourd'hui
                                                </button>
                                            </div>
                                            {errors.date_enregistrement && (
                                                <p className="text-red-500 text-xs mt-1.5">{errors.date_enregistrement[0]}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fichiers attachés */}
                    {noteSubmitted && filePreviews.length > 0 && (
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
                                        {filePreviews.map((file) => (
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
                                                        onClick={() => handleRemoveFile(file.id !== undefined ? filePreviews.indexOf(file) : filePreviews.indexOf(file))}
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
                            {activeSection > 1 && !noteSubmitted && (
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
                                    onClick={() => setActiveSection(activeSection - 1)}
                                    disabled={loading || noteSubmitted}
                                >
                                    <FaArrowLeft /> Précédent
                                </button>
                            )}
                        </div>

                        <div className="flex items-center">
                            {!noteSubmitted ? (
                                activeSection < sections.length ? (
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-700 transition"
                                        onClick={() => setActiveSection(activeSection + 1)}
                                        disabled={loading || noteSubmitted}
                                    >
                                        Suivant <FaArrowRight />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-emerald-700 transition"
                                        disabled={loading || noteSubmitted}
                                        onClick={() => document.getElementById('noteForm')?.requestSubmit()}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Enregistrement...
                                            </>
                                        ) : isEditing ? (
                                            <>
                                                <FaSave /> Enregistrer
                                            </>
                                        ) : (
                                            <>
                                                <FaCheckCircle /> Créer la note
                                            </>
                                        )}
                                    </button>
                                )
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                                        <FaCheckCircle /> Note enregistrée
                                    </span>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 border border-indigo-200 text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition"
                                        onClick={() => setShowFileUploadModal(true)}
                                    >
                                        <FaPaperclip /> Ajouter des fichiers
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ModalAssujetti isOpen={isModalOpen} selectnom={selectnom} onClose={() => setIsModalOpen(false)} />

            {showFileUploadModal && createdNoteId && (
                <FileUploadModal
                    documentId={createdNoteId}
                    id_classeur={formData.id_classeur}
                    id_ministere={formData.id_ministere}
                    onClose={handleFilesUploadCancel}
                    onUploadComplete={handleFilesUploadComplete}
                    token={token}
                    existingFiles={filePreviews}
                    nom_fichier="note de perception"
                    uploadType="note"
                />
            )}

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

export default FormNote;