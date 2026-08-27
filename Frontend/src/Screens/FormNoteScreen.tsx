// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useHistory as useRouterHistory } from "react-router-dom";
import axios from "axios";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import FormNote from "../Composant/FormNote";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { FaArrowLeft, FaFileAlt } from 'react-icons/fa';
import { toast } from "../Composant/Toast";
import LoadingSpinner from "../Loading/LoadingSpinner";

const FormNoteScreen = () => {
    const navRouter = useRouterHistory();
    const token = GetTokenOrRedirect();

    const getCurrentId = () => {
        const path = window.location.pathname;
        const match = path.match(/\/note\/form\/(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
    };

    const id = getCurrentId();
    const isEditing = !!id;

    const [loading, setLoading] = useState(true);
    const [noteToEdit, setNoteToEdit] = useState(null);
    const [directions, setDirections] = useState([]);
    const [classeurs, setClasseurs] = useState([]);
    const [centres, setCentres] = useState([]);
    const [emplacements, setEmplacements] = useState([]);

    useEffect(() => {
        if (!token) return;
        const fetchData = async () => {
            try {
                const [directionsRes, classeursRes, centresRes, emplacementsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/articleall`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_BASE_URL}/classeur`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_BASE_URL}/centre_ordonnancements/all`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_BASE_URL}/emplacements`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                ]);

                setDirections(directionsRes.data.data || directionsRes.data);
                const classeursData = classeursRes.data.data || classeursRes.data;
                const filteredClasseurs = classeursData.filter(
                    classeur => classeur.nom_classeur === "Note de Perception"
                );
                setClasseurs(filteredClasseurs);
                setCentres(centresRes.data.data || centresRes.data);
                setEmplacements(emplacementsRes.data.data || emplacementsRes.data);

                if (isEditing && id) {
                    const noteRes = await axios.get(
                        `${API_BASE_URL}/notes/${id}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const noteData = noteRes.data;
                    const transformedData = {
                        ...noteData,
                        id_ministere: noteData.id_ministere?.id || noteData.id_ministere,
                        id_classeur: noteData.id_classeur?.id || noteData.id_classeur,
                        id_centre_ordonnancement: noteData.id_centre_ordonnancement?.id || noteData.id_centre_ordonnancement,
                        id_assujetti: noteData.id_assujetti?.id || noteData.id_assujetti,
                        id_emplacement: noteData.id_emplacement?.id || noteData.id_emplacement,
                    };
                    setNoteToEdit(transformedData);
                }
            } catch (err) {
                console.error('Erreur:', err);
                toast.error('Impossible de charger les données');
                setTimeout(() => navRouter.push('/note-perception'), 1500);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token, id, isEditing, navRouter]);

    const handleCancel = () => {
        navRouter.push('/note-perception');
    };

    const handleSuccess = () => {
        toast.success(isEditing ? 'Note modifiée avec succès' : 'Note ajoutée avec succès');
        setTimeout(() => navRouter.push('/note-perception'), 1200);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Menus />
                <Head />
                <div className="lg:pl-64">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <button
                            onClick={() => navRouter.push('/note-perception')}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition mb-6"
                        >
                            <FaArrowLeft /> Retour
                        </button>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
                            <LoadingSpinner
                                message={isEditing ? 'Chargement de la note...' : 'Préparation du formulaire...'}
                                subtitle="Veuillez patienter"
                                size="lg"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Menus />
            <Head />
            <div className="lg:pl-64 pt-4 pb-24">
                <FormNote
                    isEditing={isEditing}
                    noteToEdit={noteToEdit}
                    onCancel={handleCancel}
                    onSuccess={handleSuccess}
                    directions={directions}
                    classeurs={classeurs}
                    centres={centres}
                    emplacements={emplacements}
                />
            </div>
        </div>
    );
};

export default FormNoteScreen;
