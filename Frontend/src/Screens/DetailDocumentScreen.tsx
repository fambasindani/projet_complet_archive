/* eslint-disable no-restricted-globals */
// @ts-nocheck
import { FaEye } from "react-icons/fa";
import DetailModal from "../Modals/DetailModal";

import React, { useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import axios from "axios";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import {
  FaArrowLeft,
  FaFilePdf,
  FaCalendarAlt,
  FaHashtag,
  FaKey,
  FaFileSignature,
  FaFileAlt,
  FaMapMarkerAlt,
  FaBuilding,
  FaFolder,
  FaUser,
  FaCheckCircle,
  FaClock,
  FaTag,
  FaDatabase,
} from "react-icons/fa";
import LoadingSpinner from "../Loading/LoadingSpinner";
import { toast } from "../Composant/Toast";

const DetailScreen = () => {
  const { id } = useParams();
  const historyRouter = useHistory();
  const token = GetTokenOrRedirect();
    const [detailItem, setDetailItem] = useState(null);


  const [loading, setLoading] = useState(true);
  const [declaration, setDeclaration] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (!token || !id) return;
    const fetchDeclarationDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/details/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDeclaration(response.data);
      } catch (error) {
        console.error("Erreur chargement détails:", error);
        toast.error("Erreur lors du chargement");
        historyRouter.push("/document");
      } finally {
        setLoading(false);
      }
    };
    fetchDeclarationDetails();
  }, [id, token, historyRouter]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (statut) => {
    if (statut === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <FaCheckCircle className="text-[11px]" /> Actif
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <FaClock className="text-[11px]" /> Inactif
      </span>
    );
  };

  const tabs = [
    { id: "details", label: "Informations principales", icon: FaFileAlt },
    { id: "references", label: "Références", icon: FaHashtag },
    { id: "dates", label: "Dates", icon: FaCalendarAlt },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Menus />
        <Head />
        <div className="lg:pl-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
              onClick={() => historyRouter.push("/document")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <FaArrowLeft /> Retour
            </button>
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200">
              <LoadingSpinner
                message="Chargement des détails du document..."
                subtitle={`ID: ${id}`}
                size="lg"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!declaration) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Menus />
        <Head />
        <div className="lg:pl-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
              onClick={() => historyRouter.push("/document")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <FaArrowLeft /> Retour
            </button>
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-10 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                <FaFilePdf className="text-3xl text-red-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-800">Document non trouvé</h3>
              <p className="text-sm text-slate-500">L'ID {id} n'existe pas ou a été supprimé.</p>
              <button
                onClick={() => historyRouter.push("/document")}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
              >
                <FaArrowLeft /> Retour à la liste
              </button>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex gap-4">
              <div className="hidden sm:flex h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 items-center justify-center text-white shadow-sm shrink-0">
                <FaFileAlt className="text-lg" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Détails du Document</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Référence : <span className="font-semibold text-slate-700">{declaration.num_reference}</span>
                  <span className="mx-2 text-slate-300">•</span>
                  ID : <span className="font-semibold text-slate-700">{declaration.id}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => historyRouter.push("/document")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
            >
              <FaArrowLeft className="text-xs" /> Retour à la liste
            </button>
          </div>

          {/* Main card */}
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Card top */}
            <div className="px-6 sm:px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-indigo-600">
                  <FaTag className="text-[11px]" /> Document
                </div>
                <h2 className="mt-1 text-lg font-bold text-slate-900 leading-tight break-words">{declaration.intitule || "Sans intitulé"}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600">
                    <FaHashtag className="text-[10px]" /> {declaration.num_declaration}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 border border-indigo-200 text-indigo-700">
                    <FaKey className="text-[10px]" /> {declaration.num_reference}
                  </span>
                </div>
              </div>
              <div className="shrink-0">{getStatusBadge(declaration.statut)}</div>
            </div>

            {/* Tabs */}
            <div className="px-2 sm:px-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex gap-1 overflow-x-auto scrollbar-none">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  const active = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`inline-flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                        active
                          ? "border-indigo-600 text-indigo-700 bg-white"
                          : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <Icon className={`text-xs ${active ? "text-indigo-600" : "text-slate-400"}`} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 sm:p-8 bg-white">
              {/* DETAILS */}
              {activeTab === "details" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-slate-700">
                      <span className="h-7 w-7 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                        <FaBuilding className="text-xs" />
                      </span>
                      Organisation
                    </h3>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        {
                          label: "Direction",
                          value: declaration.direction?.nom || "N/A",
                          sub: `ID: ${declaration.id_direction ?? "—"}`,
                          icon: FaBuilding,
                          tone: "bg-indigo-600",
                        },
                        {
                          label: "Emplacement",
                          value: declaration.emplacement?.nom_emplacement || "N/A",
                          sub: `ID: ${declaration.id_emplacement ?? "—"}`,
                          icon: FaMapMarkerAlt,
                          tone: "bg-sky-600",
                        },
                        {
                          label: "Classeur",
                          value: `Classeur #${declaration.id_classeur ?? "—"}`,
                          sub: `ID: ${declaration.id_classeur ?? "—"}`,
                          icon: FaFolder,
                          tone: "bg-amber-500",
                        },
                      ].map((item) => (
                        <div key={item.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex gap-4">
                          <div className={`h-11 w-11 rounded-xl ${item.tone} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                            <item.icon className="text-sm" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">{item.label}</p>
                            <p className="text-sm font-semibold text-slate-900 truncate">{item.value}</p>
                            <p className="text-xs text-slate-400">{item.sub}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                      <span className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                        <FaFileAlt className="text-xs" />
                      </span>
                      <h4 className="text-sm font-semibold text-slate-800">Description</h4>
                    </div>
                    <div className="p-5">
                      <h5 className="text-base font-semibold text-slate-900">{declaration.intitule}</h5>
                      <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 flex items-start gap-3">
                        <span className="mt-0.5 h-6 w-6 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                          <FaTag className="text-[10px]" />
                        </span>
                        <p className="text-sm text-sky-900">
                          <span className="font-semibold">Mot-clé :</span> {declaration.mot_cle || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* REFERENCES */}
              {activeTab === "references" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center gap-2">
                        <FaHashtag className="text-sm" />
                        <h4 className="text-sm font-semibold">Codes et références</h4>
                      </div>
                      <div className="p-5 space-y-4">
                        {[
                          { label: "Numéro de référence", value: declaration.num_reference, icon: FaHashtag, iconBg: "bg-emerald-600" },
                          { label: "Numéro de déclaration", value: declaration.num_declaration, icon: FaKey, iconBg: "bg-amber-500" },
                        ].map((f) => (
                          <div key={f.label}>
                            <label className="text-xs font-semibold tracking-widest uppercase text-slate-500">{f.label}</label>
                            <div className="mt-2 flex">
                              <span className={`inline-flex items-center justify-center h-11 w-11 rounded-l-xl ${f.iconBg} text-white shrink-0`}>
                                <f.icon className="text-sm" />
                              </span>
                              <input
                                type="text"
                                value={f.value || ""}
                                readOnly
                                className="flex-1 h-11 rounded-r-xl border-l-0 bg-slate-50 px-4 text-sm font-medium text-slate-700 focus:outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 bg-slate-900 text-white flex items-center gap-2">
                        <FaUser className="text-sm" />
                        <h4 className="text-sm font-semibold">Responsable</h4>
                      </div>
                      <div className="p-6 flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                          <FaUser className="text-lg" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Utilisateur #{declaration.id_user}</p>
                          <p className="text-xs text-slate-500">Responsable de l'enregistrement</p>
                          <span className="mt-2 inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600">
                            ID utilisateur : {declaration.id_user}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                      <span className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                        <FaFileSignature className="text-xs" />
                      </span>
                      <h4 className="text-sm font-semibold text-slate-800">Informations techniques</h4>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-indigo-50" />
                        <div className="relative">
                          <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                            <FaHashtag className="text-sm" />
                          </div>
                          <p className="mt-3 text-2xl font-bold text-slate-900">{declaration.id}</p>
                          <p className="text-xs font-semibold tracking-widest uppercase text-slate-500">ID Document</p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-emerald-100" />
                        <div className="relative">
                          <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                            <FaCheckCircle className="text-sm" />
                          </div>
                          <div className="mt-3">{getStatusBadge(declaration.statut)}</div>
                          <p className="mt-1 text-xs font-semibold tracking-widest uppercase text-emerald-700">Statut du document</p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-sky-100" />
                        <div className="relative">
                          <div className="h-9 w-9 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                            <FaClock className="text-sm" />
                          </div>
                          <p className="mt-3 text-sm font-bold text-slate-900 leading-tight">{formatDateTime(declaration.updated_at)}</p>
                          <p className="text-xs font-semibold tracking-widest uppercase text-sky-700">Dernière modification</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DATES */}
              {activeTab === "dates" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-2">
                    <FaCalendarAlt className="text-sm" />
                    <h4 className="text-sm font-semibold">Chronologie</h4>
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="relative">
                      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200 hidden sm:block" />
                      <div className="space-y-6">
                        {[
                          {
                            label: "Création document",
                            color: "bg-indigo-600",
                            dot: "bg-indigo-600",
                            date: formatDate(declaration.date_creation),
                            title: "Date de création du document",
                            desc: "Date originale de création du document physique ou numérique.",
                          },
                          {
                            label: "Enregistrement",
                            color: "bg-emerald-600",
                            dot: "bg-emerald-600",
                            date: formatDate(declaration.date_enregistrement),
                            title: "Date d'enregistrement",
                            desc: "Date d'enregistrement dans le système d'archivage.",
                          },
                          {
                            label: "Système",
                            color: "bg-sky-600",
                            dot: "bg-sky-600",
                            date: formatDateTime(declaration.created_at),
                            title: "Création dans le système",
                            desc: "Date et heure d'insertion dans la base de données.",
                          },
                        ].map((item) => (
                          <div key={item.title} className="relative flex gap-4">
                            <div className={`hidden sm:flex h-8 w-8 rounded-full ${item.dot} text-white items-center justify-center shrink-0 shadow-sm relative z-10`}>
                              <FaCalendarAlt className="text-[11px]" />
                            </div>
                            <div className="flex-1">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase text-white ${item.color}`}>{item.label}</span>
                              <div className="mt-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-100">
                                  <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 whitespace-nowrap">
                                    <FaCalendarAlt className="text-[11px]" /> {item.date}
                                  </span>
                                </div>
                                <p className="px-4 py-3 text-sm text-slate-600">{item.desc}</p>
                              </div>
                            </div>
                          </div>
                        ))}

                        {declaration.updated_at !== declaration.created_at && (
                          <div className="relative flex gap-4">
                            <div className="hidden sm:flex h-8 w-8 rounded-full bg-amber-500 text-white items-center justify-center shrink-0 shadow-sm relative z-10">
                              <FaClock className="text-[11px]" />
                            </div>
                            <div className="flex-1">
                              <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase text-white bg-amber-500">Modification</span>
                              <div className="mt-2 bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                                <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-amber-100 bg-amber-50/50">
                                  <h3 className="text-sm font-semibold text-slate-900">Dernière modification</h3>
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
                                    <FaClock className="text-[11px]" /> {formatDateTime(declaration.updated_at)}
                                  </span>
                                </div>
                                <p className="px-4 py-3 text-sm text-slate-600">Dernière mise à jour des informations du document.</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-4 items-center">
                          <div className="hidden sm:flex h-8 w-8 rounded-full bg-slate-100 border border-slate-200 text-slate-400 items-center justify-center shrink-0">
                            <FaClock className="text-[11px]" />
                          </div>
                          <div className="h-px flex-1 bg-slate-100" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">ArchiveCB • Détail document • Les dates sont affichées au format FR</p>
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

export default DetailScreen;



