/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import Menus from "../Composant/Menus";
import Head from "../Composant/Head";
import { useLocation, useParams, useHistory } from "react-router-dom";
import LoadingSpinner from "../Loading/LoadingSpinner";
import {FaFileInvoice,
  FaSearch,
  FaSync,
  FaFilePdf,
  FaBuilding,
  FaUser,
  FaFolder,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaFileAlt,
  FaInfoCircle, FaEye, FaArrowLeft} from "react-icons/fa";
import ActionDropdown from "../Composant/ActionDropdown";
import DocumentModal from "../Modals/DocumentModal";
import { toast } from "../Composant/Toast";
import DetailModal from "../Modals/DetailModal";

const ListenoteScreen = () => {
  const token = GetTokenOrRedirect();
  const history = useHistory();
    const [detailItem, setDetailItem] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [centreInfo, setCentreInfo] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modeRecherche, setModeRecherche] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [monProjet, setMonProjet] = useState(null);
  const [idclasseur, setIdClasseur] = useState(null);

  const [documentNom] = useState("Liste des notes de perception");

  const location = useLocation();
  const state = location.state || {};
  const item = state.centre || state.item || null;

  const utilisateur = JSON.parse(localStorage.getItem("utilisateur") || "{}") || {};
  const { id } = useParams();

  const [statsCards, setStatsCards] = useState([
    {
      id: 1,
      title: "Total Notes",
      value: "0",
      icon: <FaFileInvoice className="text-white" size={22} />,
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      description: "Toutes les notes",
    },
    {
      id: 2,
      title: "Centre",
      value: item?.nom || "Chargement...",
      icon: <FaBuilding className="text-white" size={22} />,
      color: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
      description: item?.description || "Centre d'ordonnancement",
    },
    {
      id: 3,
      title: "Période",
      value: new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      icon: <FaCalendarAlt className="text-white" size={22} />,
      color: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
      description: "Date du jour",
    },
  ]);

  useEffect(() => {
    if (item) {
      setCentreInfo(item);
      setStatsCards((prev) => [
        prev[0],
        {
          ...prev[1],
          value: item.nom || "N/A",
          description: item.description || "Centre d'ordonnancement",
        },
        prev[2],
      ]);
    }
  }, [item]);

  const Actualiser = () => {
    setSearch("");
    setModeRecherche(false);
    setPagination({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
    fetchDocuments();
  };

  useEffect(() => {
    if (token) fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current_page, pagination.per_page, modeRecherche, token]);

  useEffect(() => {
    if (documents.length > 0 || pagination.total > 0) {
      setStatsCards((prev) => [
        { ...prev[0], value: pagination.total.toString() },
        prev[1],
        prev[2],
      ]);
    }
  }, [documents, pagination.total]);

  const fetchDocuments = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let res;
      if (modeRecherche && search.trim() !== "") {
        res = await axios.post(
          `${API_BASE_URL}/search-note/${id}?page=${pagination.current_page}&per_page=${pagination.per_page}`,
          { search },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        res = await axios.get(`${API_BASE_URL}/note-centre/${id}?page=${pagination.current_page}&per_page=${pagination.per_page}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (res.data && res.data.data) {
        setDocuments(res.data.data);
        setPagination({
          current_page: res.data.current_page || 1,
          last_page: res.data.last_page || 1,
          total: res.data.total || res.data.data.length || 0,
          per_page: res.data.per_page || 10,
        });
        if (!centreInfo && res.data.data.length > 0 && res.data.data[0].centre) {
          const firstDoc = res.data.data[0];
          setCentreInfo(firstDoc.centre);
          setStatsCards((prev) => [
            prev[0],
            {
              ...prev[1],
              value: firstDoc.centre.nom || "N/A",
              description: firstDoc.centre.description || "Centre d'ordonnancement",
            },
            prev[2],
          ]);
        }
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des documents");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (search.trim() === "") {
      toast.warning("Veuillez entrer un terme de recherche");
      return;
    }
    setPagination((prev) => ({ ...prev, current_page: 1 }));
    setModeRecherche(true);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.last_page) {
      setPagination((prev) => ({ ...prev, current_page: page }));
    }
  };

  const ouvrirModalAvecId = (row) => {
    setSelectedId(row.id);
    setMonProjet(row.assujetti?.nom_raison_sociale || "");
    setIdClasseur(row.id_classeur);
    setIsModalOpen(true);
  };

  const getDocumentIcon = (document) => {
    const type = document.classeur?.nom_classeur?.toLowerCase() || "";
    if (type.includes("pdf")) return <FaFilePdf className="text-red-500" size={18} />;
    if (type.includes("note")) return <FaFileInvoice className="text-indigo-600" size={18} />;
    if (type.includes("lettre")) return <FaFileAlt className="text-amber-500" size={18} />;
    return <FaFolder className="text-amber-500" size={18} />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };


  return (
    <div className="min-h-screen bg-slate-50">
      <Menus />
      <Head />
      <div className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb / Header */}
          <div className="mb-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => history.goBack()}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm"
                >
                  <FaArrowLeft size={14} />
                </button>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <a href="/" className="transition hover:text-indigo-600">
                    Accueil
                  </a>
                  <span className="text-slate-300">/</span>
                  <span className="font-medium text-slate-700">Notes de perception</span>
                </div>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Gestion des notes</h1>
              <p className="text-sm text-slate-500">Consultez et recherchez les notes de perception par centre d&apos;ordonnancement</p>
            </div>
          </div>

          {/* Top card header */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
                  <FaFileInvoice className="text-indigo-600" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{documentNom}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <FaUser className="text-slate-400" size={12} />
                      {utilisateur?.prenom || ""} {utilisateur?.nom || ""}
                    </span>
                    {centreInfo?.nom && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="inline-flex items-center gap-1.5">
                          <FaBuilding className="text-slate-400" size={12} />
                          {centreInfo.nom}
                        </span>
                      </>
                    )}
                    {pagination.total > 0 && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                          {pagination.total} note{pagination.total > 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={Actualiser}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
              >
                <FaSync className={loading ? "animate-spin" : ""} size={14} />
                Actualiser
              </button>
            </div>
          </div>

          {/* Stats cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {statsCards.map((card) => (
              <div
                key={card.id}
                className="relative overflow-hidden rounded-2xl p-[1px] shadow-sm"
                style={{ background: card.color }}
              >
                <div className="rounded-[15px] p-5" style={{ background: card.color }}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/80">{card.title}</p>
                      <p className="mt-2 truncate text-2xl font-bold text-white sm:text-3xl">{card.value}</p>
                      <p className="mt-1 text-xs font-medium text-white/70 line-clamp-1">{card.description}</p>
                    </div>
                    <div className="ml-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur ring-1 ring-white/30">
                      {card.icon}
                    </div>
                  </div>
                  <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                </div>
              </div>
            ))}
          </div>

          {/* Search bar */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <FaSearch className="text-slate-400" size={14} />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher par numéro de série, assujetti, classeur..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 sm:flex-none"
                >
                  <FaSearch size={14} />
                  Rechercher
                </button>
                {modeRecherche && (
                  <button
                    onClick={Actualiser}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>
            {modeRecherche && search && (
              <p className="mt-3 text-xs text-slate-500">
                Résultats pour : <span className="font-semibold text-slate-700">&quot;{search}&quot;</span>
                <span className="mx-2 text-slate-300">•</span>
                {pagination.total} résultat{pagination.total !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <LoadingSpinner message="Chargement des notes de perception..." />
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    {modeRecherche ? "Résultats de recherche" : "Notes récentes"}
                  </h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    Page {pagination.current_page} / {pagination.last_page || 1}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">N° Série</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Centre</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Assujetti</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Classeur</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Emplacement</th>
                        <th className="px-6 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {documents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-16 text-center">
                            <div className="mx-auto max-w-sm">
                              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                                <FaFileInvoice className="text-slate-400" size={28} />
                              </div>
                              <h4 className="mt-4 text-sm font-bold text-slate-900">Aucune note trouvée</h4>
                              <p className="mt-1 text-sm text-slate-500">
                                {modeRecherche ? "Aucun résultat pour votre recherche. Essayez un autre terme." : "Aucune note de perception pour ce centre pour le moment."}
                              </p>
                              {modeRecherche && (
                                <button onClick={Actualiser} className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                                  Voir toutes les notes →
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        documents.map((doc) => (
                          <tr key={doc.id} className="group transition hover:bg-slate-50/70">
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                                  {getDocumentIcon(doc)}
                                </span>
                                <span className="text-sm font-semibold text-slate-900">{doc.numero_serie || "N/A"}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                                <FaCalendarAlt className="text-slate-400" size={10} />
                                {formatDate(doc.date_ordonnancement)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-700">{doc.centre?.nom || centreInfo?.nom || "-"}</td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-700">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                                  <FaUser className="text-slate-500" size={10} />
                                </span>
                                <span className="max-w-[160px] truncate font-medium">{doc.assujetti?.nom_raison_sociale || "-"}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                {doc.classeur?.nom_classeur || "-"}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                              <span className="inline-flex items-center gap-1.5">
                                <FaMapMarkerAlt className="text-slate-400" size={11} />
                                {doc.emplacement?.nom_emplacement || "-"}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-center">
                              <ActionDropdown>
                                <button
                                  onClick={() => setDetailItem(doc)}
                                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                    <FaInfoCircle size={14} />
                                  </span>
                                  <span>Détails</span>
                                </button>
                                <button
                                  onClick={() => ouvrirModalAvecId(doc)}
                                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                                    <FaFilePdf size={14} />
                                  </span>
                                  <span>Voir PDF</span>
                                </button>
                              </ActionDropdown>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {documents.length > 0 && pagination.last_page > 1 && (
                <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm sm:flex-row">
                  <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-500">
                    Affichage de <span className="font-semibold text-slate-900">{(pagination.current_page - 1) * pagination.per_page + 1}</span> à{" "}
                    <span className="font-semibold text-slate-900">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> sur{" "}
                    <span className="font-semibold text-slate-900">{pagination.total}</span> notes
                  </p>
                  <select
                    value={pagination.per_page}
                    onChange={(e) => { const v = parseInt(e.target.value, 10); setPagination(prev => ({ ...prev, per_page: v, current_page: 1 })); }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition"
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                  </div>
                  <nav className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <FaChevronLeft size={12} />
                    </button>
                    {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => {
                      let pageNum;
                      if (pagination.last_page <= 5) pageNum = i + 1;
                      else if (pagination.current_page <= 3) pageNum = i + 1;
                      else if (pagination.current_page >= pagination.last_page - 2) pageNum = pagination.last_page - 4 + i;
                      else pageNum = pagination.current_page - 2 + i;
                      const isActive = pagination.current_page === pageNum;
                      return (
                        <button
                          key={i}
                          onClick={() => handlePageChange(pageNum)}
                          className={`inline-flex h-9 min-w-[36px] items-center justify-center rounded-xl px-3 text-sm font-semibold shadow-sm transition ${
                            isActive
                              ? "bg-indigo-600 text-white shadow-indigo-600/20 ring-1 ring-indigo-600"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.last_page}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <FaChevronRight size={12} />
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <DocumentModal
        modalId="documentModal"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        monid={selectedId}
        projet={monProjet}
        idclasseur={idclasseur}
        verification={false}
        apiEndpoint="notes/download"
      />
                
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

export default ListenoteScreen;
