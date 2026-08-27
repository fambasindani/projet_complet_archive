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
  FaDatabase,
  FaIdCard,
  FaEnvelope,
  FaPhone,
  FaMapPin,
  FaEdit,
} from "react-icons/fa";
import LoadingSpinner from "../Loading/LoadingSpinner";

const DetailNoteScreen = () => {
  const { id } = useParams();
  const navRouter = useHistory();
  const token = GetTokenOrRedirect();
    const [detailItem, setDetailItem] = useState(null);


  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (!token || !id) return;
    const fetchNoteDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/notes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Détails de la note:", response.data);
        setNote(response.data);
      } catch (error) {
        console.error("Erreur chargement détails:", error);
        toast.error("Erreur lors du chargement"); navRouter.push("/note-perception");
      } finally {
        setLoading(false);
      }
    };
    fetchNoteDetails();
  }, [id, token, navRouter]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
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
    { id: "assujetti", label: "Assujetti", icon: FaUser },
    { id: "organisation", label: "Organisation", icon: FaBuilding },
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
              onClick={() => navRouter.push("/note-perception")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <FaArrowLeft className="text-xs" /> Retour
            </button>
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200">
              <LoadingSpinner
                message="Chargement des détails de la note..."
                subtitle="Veuillez patienter"
                size="lg"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Menus />
        <Head />
        <div className="lg:pl-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
              onClick={() => navRouter.push("/note-perception")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <FaArrowLeft className="text-xs" /> Retour
            </button>
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-10 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                <FaFilePdf className="text-3xl text-red-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-800">Note non trouvée</h3>
              <p className="text-sm text-slate-500">Cette note n'existe pas ou a été supprimée.</p>
              <button
                onClick={() => navRouter.push("/note-perception")}
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
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Détails de la Note de Perception</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Numéro série : <span className="font-semibold text-slate-700">{note.numero_serie}</span>
                  <span className="mx-2 text-slate-300">•</span>ID : <span className="font-semibold text-slate-700">{note.id}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navRouter.push(`/note/form/${note.id}`)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
              >
                <FaEdit className="text-xs" /> Modifier
              </button>
              <button
                onClick={() => navRouter.push("/note-perception")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                <FaArrowLeft className="text-xs" /> Retour
              </button>
            </div>
          </div>

          {/* Main card */}
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 sm:px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-indigo-600">
                  <FaHashtag className="text-[11px]" /> Note de perception
                </div>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Note {note.numero_serie || "—"} </h2>
                <p className="text-sm text-slate-500">
                  Article : <span className="font-medium text-slate-700">{note.numero_article || "N/A"}</span>
                </p>
              </div>
              <div className="shrink-0">{getStatusBadge(note.statut)}</div>
            </div>

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
                        active ? "border-indigo-600 text-indigo-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
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
              {activeTab === "details" && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center gap-2">
                      <FaHashtag className="text-sm" />
                      <h4 className="text-sm font-semibold">Informations générales</h4>
                    </div>
                    <div className="p-5">
                      <dl className="divide-y divide-slate-100">
                        {[
                          {
                            label: "Numéro série",
                            value: (
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {note.numero_serie || "N/A"}
                              </span>
                            ),
                          },
                          {
                            label: "Numéro article",
                            value: (
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                {note.numero_article || "N/A"}
                              </span>
                            ),
                          },
                          { label: "Date ordonnancement", value: <span className="inline-flex items-center gap-1.5 text-sm text-slate-700"><FaCalendarAlt className="text-slate-400 text-xs" />{formatDate(note.date_ordonnancement)}</span> },
                          { label: "Date enregistrement", value: <span className="inline-flex items-center gap-1.5 text-sm text-slate-700"><FaCalendarAlt className="text-slate-400 text-xs" />{formatDate(note.date_enregistrement)}</span> },
                          { label: "Créé le", value: <span className="text-sm text-slate-700">{formatDateTime(note.created_at)}</span> },
                          { label: "Modifié le", value: <span className="text-sm text-slate-700">{formatDateTime(note.updated_at)}</span> },
                        ].map((row) => (
                          <div key={row.label} className="flex items-center justify-between gap-4 py-3.5">
                            <dt className="text-xs font-semibold tracking-widest uppercase text-slate-500">{row.label}</dt>
                            <dd className="text-right">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                        <span className="h-8 w-8 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
                          <FaFileAlt className="text-xs" />
                        </span>
                        <h4 className="text-sm font-semibold text-slate-800">Article budgétaire</h4>
                      </div>
                      <div className="p-5">
                        {note.article_budgetaire ? (
                          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4">
                            <p className="text-sm font-semibold text-sky-900">
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sky-600 text-white text-xs font-bold mr-2">
                                {note.article_budgetaire.article_budgetaire}
                              </span>
                              {note.article_budgetaire.nom}
                            </p>
                            <p className="mt-2 text-xs text-sky-700">Article budgétaire associé à la note.</p>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500 text-center">
                            Aucun article budgétaire associé
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <h5 className="text-xs font-bold tracking-widest uppercase text-slate-500">Résumé rapide</h5>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-xl border border-slate-200 p-3">
                          <p className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">Centre</p>
                          <p className="text-sm font-semibold text-slate-900 truncate">{note.centre?.nom || note.centre_id || "—"}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-3">
                          <p className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">Classeur</p>
                          <p className="text-sm font-semibold text-slate-900 truncate">{note.classeur?.nom_classeur || `Classeur #${note.classeur_id ?? "—"}`}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "assujetti" && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                      <FaUser className="text-xs" />
                    </span>
                    <h3 className="text-sm font-bold tracking-widest uppercase text-slate-700">Détails de l'assujetti</h3>
                  </div>
                  {note.assujetti ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: "NIF", value: note.assujetti.numero_nif || "N/A", icon: FaIdCard, tone: "bg-indigo-600" },
                        { label: "Raison sociale", value: note.assujetti.nom_raison_sociale || "N/A", icon: FaUser, tone: "bg-emerald-600" },
                        { label: "BP", value: note.assujetti.bp || "N/A", icon: FaMapPin, tone: "bg-sky-600" },
                        { label: "Téléphone", value: note.assujetti.telephone || "N/A", icon: FaPhone, tone: "bg-amber-500" },
                        { label: "Email", value: note.assujetti.email || "N/A", icon: FaEnvelope, tone: "bg-rose-500" },
                        {
                          label: "Statut assujetti",
                          value: note.assujetti.statut ? (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Actif</span>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">Inactif</span>
                          ),
                          icon: FaCheckCircle,
                          tone: "bg-slate-700",
                          isNode: true,
                        },
                      ].map((card) => (
                        <div key={card.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex gap-4 items-center">
                          <div className={`h-11 w-11 rounded-xl ${card.tone} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                            <card.icon className="text-sm" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">{card.label}</p>
                            {card.isNode ? (
                              <div className="mt-1">{card.value}</div>
                            ) : (
                              <p className="text-sm font-semibold text-slate-900 truncate" title={String(card.value)}>
                                {card.value}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-center">
                      <div className="mx-auto h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                        <FaUser className="text-sm" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-amber-900">Aucun assujetti associé à cette note.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "organisation" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      title: "Classeur",
                      icon: FaFolder,
                      header: "bg-gradient-to-r from-sky-600 to-cyan-600",
                      data: note.classeur,
                      rows: [
                        { label: "Nom", value: note.classeur?.nom_classeur },
                        { label: "Statut", value: note.classeur ? (note.classeur.statut ? "Actif" : "Inactif") : null, badge: true },
                      ],
                      empty: "Aucun classeur associé",
                    },
                    {
                      title: "Centre d'ordonnancement",
                      icon: FaBuilding,
                      header: "bg-gradient-to-r from-emerald-600 to-teal-600",
                      data: note.centre,
                      rows: [
                        { label: "Nom", value: note.centre?.nom },
                        { label: "Description", value: note.centre?.description || "N/A" },
                      ],
                      empty: "Aucun centre associé",
                    },
                    {
                      title: "Emplacement",
                      icon: FaMapMarkerAlt,
                      header: "bg-gradient-to-r from-amber-500 to-orange-500",
                      data: note.emplacement,
                      rows: [
                        { label: "Nom", value: note.emplacement?.nom_emplacement },
                        { label: "Statut", value: note.emplacement ? (note.emplacement.statut ? "Actif" : "Inactif") : null, badge: true },
                      ],
                      empty: "Aucun emplacement associé",
                    },
                    {
                      title: "Article budgétaire",
                      icon: FaDatabase,
                      header: "bg-gradient-to-r from-indigo-600 to-violet-600",
                      data: note.article_budgetaire,
                      rows: [
                        { label: "Article", value: note.article_budgetaire?.article_budgetaire, badgeIndigo: true },
                        { label: "Nom", value: note.article_budgetaire?.nom },
                        { label: "Statut", value: note.article_budgetaire ? (note.article_budgetaire.statut ? "Actif" : "Inactif") : null, badge: true },
                      ],
                      empty: "Aucun article budgétaire associé",
                    },
                  ].map((card) => (
                    <div key={card.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className={`px-5 py-4 ${card.header} text-white flex items-center gap-2`}>
                        <card.icon className="text-sm" />
                        <h4 className="text-sm font-semibold">{card.title}</h4>
                      </div>
                      <div className="p-5 flex-1">
                        {card.data ? (
                          <dl className="space-y-3">
                            {card.rows.map((r) => (
                              <div key={r.label} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                                <dt className="text-xs font-semibold tracking-widest uppercase text-slate-500">{r.label}</dt>
                                <dd className="text-sm font-medium text-slate-800 text-right">
                                  {r.badge ? (
                                    r.value === "Actif" ? (
                                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{r.value}</span>
                                    ) : (
                                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">{r.value}</span>
                                    )
                                  ) : r.badgeIndigo ? (
                                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">{r.value}</span>
                                  ) : (
                                    r.value || "—"
                                  )}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        ) : (
                          <p className="text-sm text-slate-500 text-center py-4">{card.empty}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
                        <div className="relative flex gap-4">
                          <div className="hidden sm:flex h-8 w-8 rounded-full bg-indigo-600 text-white items-center justify-center shrink-0 shadow-sm relative z-10">
                            <FaCalendarAlt className="text-[11px]" />
                          </div>
                          <div className="flex-1">
                            <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase text-white bg-indigo-600">Ordonnancement</span>
                            <div className="mt-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                              <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-900">Date d'ordonnancement</h3>
                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><FaCalendarAlt className="text-[11px]" />{formatDate(note.date_ordonnancement)}</span>
                              </div>
                              <p className="px-4 py-3 text-sm text-slate-600">Date à laquelle la note a été ordonnancée.</p>
                            </div>
                          </div>
                        </div>

                        <div className="relative flex gap-4">
                          <div className="hidden sm:flex h-8 w-8 rounded-full bg-emerald-600 text-white items-center justify-center shrink-0 shadow-sm relative z-10">
                            <FaDatabase className="text-[11px]" />
                          </div>
                          <div className="flex-1">
                            <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase text-white bg-emerald-600">Enregistrement</span>
                            <div className="mt-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                              <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-900">Date d'enregistrement</h3>
                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><FaCalendarAlt className="text-[11px]" />{formatDate(note.date_enregistrement)}</span>
                              </div>
                              <p className="px-4 py-3 text-sm text-slate-600">Date d'enregistrement dans le système.</p>
                            </div>
                          </div>
                        </div>

                        <div className="relative flex gap-4">
                          <div className="hidden sm:flex h-8 w-8 rounded-full bg-sky-600 text-white items-center justify-center shrink-0 shadow-sm relative z-10">
                            <FaDatabase className="text-[11px]" />
                          </div>
                          <div className="flex-1">
                            <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase text-white bg-sky-600">Système</span>
                            <div className="mt-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                              <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-900">Création dans le système</h3>
                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><FaDatabase className="text-[11px]" />{formatDateTime(note.created_at)}</span>
                              </div>
                              <p className="px-4 py-3 text-sm text-slate-600">Date et heure d'insertion dans la base de données.</p>
                            </div>
                          </div>
                        </div>

                        {note.updated_at !== note.created_at && (
                          <div className="relative flex gap-4">
                            <div className="hidden sm:flex h-8 w-8 rounded-full bg-amber-500 text-white items-center justify-center shrink-0 shadow-sm relative z-10">
                              <FaClock className="text-[11px]" />
                            </div>
                            <div className="flex-1">
                              <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase text-white bg-amber-500">Modification</span>
                              <div className="mt-2 bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                                <div className="px-4 py-3 flex items-center justify-between border-b border-amber-100 bg-amber-50/50">
                                  <h3 className="text-sm font-semibold text-slate-900">Dernière modification</h3>
                                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-600"><FaClock className="text-[11px]" />{formatDateTime(note.updated_at)}</span>
                                </div>
                                <p className="px-4 py-3 text-sm text-slate-600">Dernière mise à jour des informations.</p>
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

          <p className="mt-6 text-center text-xs text-slate-400">ArchiveCB • Note de perception • Format dates FR</p>
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

export default DetailNoteScreen;



