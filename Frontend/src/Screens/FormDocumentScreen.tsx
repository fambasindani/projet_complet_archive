/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useHistory as useRouterHistory } from "react-router-dom";
import axios from "axios";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import FormDocument from "../Composant/FormDocument";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import {FaArrowLeft, FaFileAlt, FaEye} from "react-icons/fa";
import { toast } from "../Composant/Toast";
import DetailModal from "../Modals/DetailModal";
import ConfirmModal from "../Modals/ConfirmModal";
import LoadingSpinner from "../Loading/LoadingSpinner";

const FormDocumentScreen = () => {
  const navRouter = useRouterHistory();
  const token = GetTokenOrRedirect();
    const [confirmItem, setConfirmItem] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const [detailItem, setDetailItem] = useState(null);


  const getCurrentId = () => {
    const path = window.location.pathname;
    console.log("Path actuel:", path);
    const match = path.match(/\/archive\/addform\/(\d+)$/);
    if (match && match[1]) {
      const id = parseInt(match[1], 10);
      console.log("ID extrait:", id);
      return id;
    }
    console.log("Aucun ID trouvé - mode création");
    return null;
  };

  const id = getCurrentId();
  const isEditing = !!id;

  console.log("=== DEBUG ===");
  console.log("URL complète:", window.location.href);
  console.log("ID détecté:", id);
  console.log("isEditing:", isEditing);
  console.log("=== FIN DEBUG ===");

  const [loading, setLoading] = useState(true);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [directions, setDirections] = useState([]);
  const [emplacements, setEmplacements] = useState([]);
  const [classeurs, setClasseurs] = useState([]);

  useEffect(() => {
    if (!token) {
      console.log("Pas de token, retour");
      return;
    }
    console.log("Début du chargement - ID:", id, "Mode édition:", isEditing);
    const fetchData = async () => {
      try {
        console.log("Chargement des listes dropdown...");
        const [directionsRes, emplacementsRes, classeursRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/departements`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/emplacement`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/classeur`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
        ]);

        setDirections(directionsRes.data.data.data);
        const userDepartements = JSON.parse(localStorage.getItem("departements")) || [];
        const filteredDirections = directionsRes.data.data.data.filter(direction =>
          userDepartements.some(userDept => userDept.id === direction.id)
        );
        setDirections(filteredDirections);
        setEmplacements(emplacementsRes.data);
        const filteredClasseurs = classeursRes.data.filter(
          classeur => classeur.nom_classeur !== "Note de Perception"
        );
        setClasseurs(filteredClasseurs);

        console.log("Listes chargées:");
        console.log("- Directions:", directionsRes.data.length);
        console.log("- Emplacements:", emplacementsRes.data.length);
        console.log("- Classeurs:", classeursRes.data.length);

        if (isEditing && id) {
          try {
            console.log(`Tentative de chargement du document ID ${id}...`);
            console.log(`URL API: ${API_BASE_URL}/editdeclaration/${id}`);
            const documentRes = await axios.get(
              `${API_BASE_URL}/editdeclaration/${id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
            console.log("✅ Document chargé avec succès:", documentRes.data);
            const documentData = documentRes.data;
            const transformedData = {
              ...documentData,
              id_direction: documentData.id_direction
                ? (typeof documentData.id_direction === 'object'
                  ? documentData.id_direction.id
                  : documentData.id_direction)
                : "",
              id_emplacement: documentData.id_emplacement
                ? (typeof documentData.id_emplacement === 'object'
                  ? documentData.id_emplacement.id
                  : documentData.id_emplacement)
                : "",
              id_classeur: documentData.id_classeur
                ? (typeof documentData.id_classeur === 'object'
                  ? documentData.id_classeur.id
                  : documentData.id_classeur)
                : "",
              id_user: documentData.id_user
                ? (typeof documentData.id_user === 'object'
                  ? documentData.id_user.id
                  : documentData.id_user)
                : "",
            };
            console.log("Données transformées:", transformedData);
            setDocumentToEdit(transformedData);
          } catch (error) {
            console.error("❌ Erreur lors du chargement du document:", error);
            if (error.response) {
              console.error("Status:", error.response.status);
              console.error("Data:", error.response.data);
              console.error("Headers:", error.response.headers);
            }
            setDetailItem(error);
              navRouter.push('/document');
          }
        } else {
          console.log("Mode création - Pas de chargement de document");
        }
      } catch (err) {
        console.error('❌ Erreur générale de chargement:', err);
toast.error('Impossible de charger les données nécessaires');
              navRouter.push('/document');
      } finally {
        console.log("Chargement terminé");
        setLoading(false);
      }
    };
    fetchData();
  }, [token, id, isEditing, navRouter]);

  const handleCancel = () => {
    navRouter.push('/document');
  };

  const handleSuccess = () => {
    const message = isEditing
      ? 'Document modifié avec succès'
      : 'Document ajouté avec succès';
    toast.success(message);
    navRouter.push('/document');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Menus />
        <Head />
        <div className="lg:pl-64">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
              onClick={() => navRouter.push('/document')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition mb-6"
            >
              <FaArrowLeft className="text-xs" /> Retour
            </button>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <LoadingSpinner
                message={isEditing ? 'Chargement du document...' : 'Préparation du formulaire...'}
                subtitle={isEditing ? `Document ID: ${id}` : 'Initialisation en cours...'}
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
      <div className="lg:pl-64">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header premium */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <FaFileAlt className="text-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    {isEditing ? "Modifier le Document" : "Nouveau Document"}
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {isEditing ? `Modification du document ID: ${id}` : "Remplissez le formulaire pour ajouter un document"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
              >
                <FaArrowLeft className="text-xs" /> Retour à la liste
              </button>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
              <p className="text-xs font-semibold tracking-widest uppercase text-slate-500">
                {isEditing ? "Édition" : "Création"} • Informations du document
              </p>
            </div>
            <div className="p-6 sm:p-8">
              <FormDocument
                isEditing={isEditing}
                documentToEdit={documentToEdit}
                onCancel={handleCancel}
                onSuccess={handleSuccess}
                directions={directions}
                emplacements={emplacements}
                classeurs={classeurs}
              />
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Les champs marqués d’un <span className="text-rose-500 font-bold">*</span> sont obligatoires
          </p>
        </div>
      </div>
                
            <DetailModal
                isOpen={!!detailItem}
                onClose={() => setDetailItem(null)}
                title={detailItem?.nom || detailItem?.nom_classeur || detailItem?.intitule || detailItem?.numero_serie || "Détails"}
            >
                {detailItem && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">Nom</p><p className="text-sm font-semibold text-slate-900 mt-1">{detailItem.nom || detailItem.nom_classeur || detailItem.intitule || "—"}</p></div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">ID</p><p className="text-sm font-mono font-semibold text-slate-900 mt-1">#{detailItem.id}</p></div>
                    </div>
                    {detailItem.description && <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">Description</p><p className="text-sm text-slate-700 mt-1">{detailItem.description}</p></div>}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">Créé le</p><p className="text-sm text-slate-700 mt-1">{detailItem.created_at ? new Date(detailItem.created_at).toLocaleDateString("fr-FR") : "—"}</p></div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">Modifié le</p><p className="text-sm text-slate-700 mt-1">{detailItem.updated_at ? new Date(detailItem.updated_at).toLocaleDateString("fr-FR") : "—"}</p></div>
                    </div>
                    {detailItem.statut !== undefined && (
  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
    <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Statut</p>
    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${detailItem.statut ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
      {detailItem.statut ? 'Actif' : 'Inactif'}
    </span>
  </div>
)}
{detailItem.numero_serie && (
  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
    <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Numéro de série</p>
    <p className="text-sm font-semibold text-slate-900 mt-1">{detailItem.numero_serie}</p>
  </div>
)}
{detailItem.intitule && (
  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
    <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Intitulé</p>
    <p className="text-sm font-semibold text-slate-900 mt-1">{detailItem.intitule}</p>
  </div>
)}
{detailItem.code && (
  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
    <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Code</p>
    <p className="text-sm font-mono font-semibold text-slate-900 mt-1">{detailItem.code}</p>
  </div>
)}
                  </div>
                )}
            </DetailModal>
            
</div>
  );
};

export default FormDocumentScreen;
