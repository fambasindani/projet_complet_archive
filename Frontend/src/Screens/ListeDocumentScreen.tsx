/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import Menus from "../Composant/Menus";
import Head from "../Composant/Head";
import DocumentModal from "../Modals/DocumentModal";
import { useParams, useLocation, useHistory } from "react-router-dom";
import LoadingSpinner from "../Loading/LoadingSpinner";
import {
  FaFolder,
  FaFileAlt,
  FaSearch,
  FaSync,
  FaBuilding,
  FaUser,
  FaChevronLeft,
  FaChevronRight,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaMapMarkerAlt,
  FaInfoCircle,
  FaEye,
  FaLayerGroup,
  FaArrowLeft,
} from "react-icons/fa";
import { toast } from "../Composant/Toast";
import DetailModal from "../Modals/DetailModal";
import ActionDropdown from "../Composant/ActionDropdown";


const ListeDocumentScreen = () => {
  const token = GetTokenOrRedirect();
    const [detailItem, setDetailItem] = useState(null);

  const { id } = useParams();
  const location = useLocation();
  const history = useHistory();

  const { classifier: navClassifier, direction, nomDirection, periode, searchTerm } = (location.state as any) || {};
  const [classifierState, setClassifierState] = useState(navClassifier || null);
  const classifier = classifierState || navClassifier;

  const [userDirectionIds, setUserDirectionIds] = useState([]);
  const [userDepartements, setUserDepartements] = useState([]);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  useEffect(() => {
    const storedDepartements = JSON.parse(localStorage.getItem("departements") || "[]");
    setUserDepartements(storedDepartements);
    const ids = storedDepartements.map((dept) => dept.id);
    setUserDirectionIds(ids);

    if (ids.length === 0) {
      toast.info("Vous n'avez accès à aucune direction. Veuillez contacter l'administrateur.");
    }

    const t = setTimeout(() => setIsLoadingUserData(false), 500);
    return () => clearTimeout(t);
  }, []);

  const [documents, setDocuments] = useState([]);
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
  const [monprojet, setMonProjet] = useState(null);
  const [idclasseur, setIdClasseur] = useState(null);
  const [filteredBy, setFilteredBy] = useState(null);

  const utilisateur = JSON.parse(localStorage.getItem("utilisateur") || "{}");
  const role = JSON.parse(localStorage.getItem("role") || "null");

  const [statsCards, setStatsCards] = useState([
    {
      id: 1,
      title: "Mes Documents",
      value: "0",
      icon: <FaFolder style={{ fontSize: "24px" }} />,
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      description: "Documents accessibles",
    },
    {
      id: 2,
      title: "Classificateur",
      value: classifier?.nom_classeur || "Chargement...",
      icon: <FaLayerGroup style={{ fontSize: "24px" }} />,
      color: "linear-gradient(135deg, #20c997 0%, #17a2b8 100%)",
      description: classifier?.nom_classeur || "Classificateur",
    },
  ]);

  // Charger le classeur si accès direct par URL (sans state)
  useEffect(() => {
    if (!classifierState && id && token) {
      axios
        .get(`${API_BASE_URL}/classeurs/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        ; ((res) => {
          const data = res.data?.data || res.data;
          if (data && data.nom_classeur) setClassifierState(data);
        })
        .catch(() => {});
    }
  }, [id, token]);

  useEffect(() => {
    // debug log
    // console.log("📍 Données reçues:", { id_classeur: id, direction, nomDirection, periode, searchTerm, classifier });
  }, []);

  useEffect(() => {
    if (token && !isLoadingUserData) {
      fetchDocuments();
    }
  }, [pagination.current_page, modeRecherche, token, userDirectionIds, isLoadingUserData, id]);

  const fetchDocuments = async () => {
    if (!token) return;
    setLoading(true);
    setDocuments([]);
    try {
      if (userDirectionIds.length === 0) {
        setDocuments([]);
        setFilteredBy("none");
        setPagination({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
        setLoading(false);
        return;
      }

      const params: any = {
        page: pagination.current_page,
        direction_ids: userDirectionIds.join(","),
      };
      if (modeRecherche && search.trim() !== "") {
        params.search = search;
      }

      const response = await axios.get(`${API_BASE_URL}/listedeclaration/${id}`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        const documentsData = response.data.data || [];
        setDocuments(documentsData);
        setFilteredBy("directions");
        setPagination({
          current_page: response.data.current_page || 1,
          last_page: response.data.last_page || 1,
          total: response.data.total || documentsData.length || 0,
          per_page: response.data.per_page || 10,
        });

        const total = response.data.total || documentsData.length;
        const actifs = documentsData.filter((d) => d.statut === true || d.statut === 1).length;
        setStatsCards((prev) => [
          {
            ...prev[0],
            value: total.toString(),
            description: total > 0 ? `${Math.round((actifs / total) * 100)}% actifs` : "0% actifs",
          },
          {
            ...prev[1],
            value: classifier?.nom_classeur || "Documents",
          },
        ]);
      }
    } catch (err: any) {
      console.error("❌ Erreur:", err);
      toast.error(err.response?.data?.message || "Erreur lors du chargement");
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

  const handleReset = () => {
    setSearch("");
    setModeRecherche(false);
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.last_page) {
      setPagination((prev) => ({ ...prev, current_page: page }));
    }
  };

  const ouvrirModalAvecId = (row: any) => {
    setSelectedId(row.id);
    setMonProjet(row.nom_direction || row.departement?.nom);
    setIdClasseur(row.id_classeur);
    setIsModalOpen(true);
  };

  const getFileIcon = (nom: string) => {
    const type = nom?.toLowerCase() || "";
    if (type.includes("pdf")) return <FaFilePdf className="text-red-500" size={20} />;
    if (type.includes("word") || type.includes("doc")) return <FaFileWord className="text-blue-600" size={20} />;
    if (type.includes("excel") || type.includes("xls")) return <FaFileExcel className="text-emerald-600" size={20} />;
    if (type.includes("image") || type.includes("jpg") || type.includes("png"))
      return <FaFileImage className="text-sky-500" size={20} />;
    return <FaFileAlt className="text-amber-500" size={20} />;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return "N/A";
    }
  };

  // Calcul pagination affichage
  const rangeStart = pagination.total === 0 ? 0 : (pagination.current_page - 1) * pagination.per_page + 1;
  const rangeEnd = Math.min(pagination.current_page * pagination.per_page, pagination.total);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Menus />
      <Head />
      <div className="lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header premium */}
          <div className="mb-6 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => history.goBack()}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 shrink-0"
                >
                  <FaArrowLeft size={14} />
                </button>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                  <FaFolder size={26} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">
                    {classifier?.nom_classeur || "Documents"}
                  </h1>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-slate-600 ring-1 ring-slate-200">
                      <FaUser className="text-slate-400" size={12} />
                      {utilisateur?.prenom || ""} {utilisateur?.nom || ""}
                    </span>
                    {userDepartements.length > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <FaBuilding className="text-slate-400" size={12} />
                        <span className="max-w-[420px] truncate">{userDepartements.map((d) => d.sigle || d.nom).join(" • ")}</span>
                      </span>
                    )}
                  </div>
                  {filteredBy && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Filtré par vos directions accessibles
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="hidden text-right sm:block">
                  <div className="text-xs font-medium uppercase tracking-widest text-slate-400">Classeur</div>
                  <div className="text-sm font-semibold text-slate-700">#{id}</div>
                </div>
                <button
                  onClick={handleReset}
                  disabled={loading || userDirectionIds.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaSync className={`${loading ? "animate-spin" : ""}`} size={14} />
                  Actualiser
                </button>
              </div>
            </div>
          </div>

          {/* Directions badges */}
          {userDepartements.length > 0 && (
            <div className="mb-6 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <FaBuilding size={13} />
                </span>
                Mes directions accessibles
              </div>
              <div className="flex flex-wrap gap-2">
                {userDepartements.map((dept) => (
                  <span
                    key={dept.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    {dept.sigle} — {dept.nom}
                    <span className="ml-1 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 ring-1 ring-indigo-100">ID {dept.id}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            {statsCards.map((card) => (
              <div
                key={card.id}
                className="relative overflow-hidden rounded-2xl p-[1px] shadow-sm"
                style={{ background: card.color }}
              >
                <div className="rounded-[15px] p-6 text-white" style={{ background: card.color }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-white/80">{card.title}</div>
                      <div className="mt-2 text-3xl font-bold tracking-tight text-white">{card.value}</div>
                      <div className="mt-1 text-sm font-medium text-white/70">{card.description}</div>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-md ring-1 ring-white/20">
                      {card.icon}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search bar */}
          <div className="mb-6 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <FaSearch size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Rechercher par intitulé, référence, mot clé..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    disabled={userDirectionIds.length === 0}
                    className="h-[46px] w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!search.trim() || userDirectionIds.length === 0}
                  className="inline-flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaSearch size={13} />
                  Rechercher
                </button>
              </div>
              <div className="flex items-center gap-2 sm:justify-end">
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                  <FaFolder className="text-slate-400" />
                  Total: {pagination.total} document(s)
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200/60 bg-white p-8 shadow-sm">
              <LoadingSpinner message="Chargement des documents..." variant="table" size="lg" />
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/80">
                      <tr>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Intitulé</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">N° Référence</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Mot Clé</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Direction</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Emplacement</th>
                        <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {documents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-16 text-center">
                            <div className="mx-auto max-w-md">
                              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-200">
                                <FaFolder size={28} />
                              </div>
                              <h3 className="mt-4 text-base font-semibold text-slate-900">Aucun document trouvé</h3>
                              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                                {userDirectionIds.length === 0
                                  ? "Vous n'avez accès à aucune direction. Veuillez contacter l'administrateur."
                                  : modeRecherche
                                  ? "Aucun résultat pour votre recherche"
                                  : "Aucun document dans ce classificateur pour vos directions"}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        documents.map((doc) => (
                          <tr key={doc.id} className="transition hover:bg-slate-50/60">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                                  {getFileIcon(doc.classeur?.nom_classeur)}
                                </div>
                                <span className="max-w-[220px] truncate text-sm font-semibold text-slate-900">{doc.intitule || "N/A"}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                {doc.num_reference || "N/A"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-600">{doc.mot_cle || "-"}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-700">
                                <FaBuilding className="shrink-0 text-slate-400" size={12} />
                                <span className="truncate">{doc.nom_direction || doc.departement?.nom || "-"}</span>
                                <span className="inline-flex shrink-0 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">ID: {doc.id_direction}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <FaMapMarkerAlt className="shrink-0 text-slate-400" size={12} />
                                <span className="truncate">{doc.nom_emplacement || doc.emplacement?.nom_emplacement || "-"}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <ActionDropdown>
                                <button
                                  onClick={() => setDetailItem(doc)}
                                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                                    <FaInfoCircle size={14} />
                                  </span>
                                  Détails
                                </button>
                                <button
                                  onClick={() => ouvrirModalAvecId(doc)}
                                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                                    <FaFilePdf size={14} />
                                  </span>
                                  PDF
                                </button>
                                <button
                                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                    <FaEye size={14} />
                                  </span>
                                  Visualiser
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
                <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-medium text-slate-500">
                    Affichage de <span className="font-semibold text-slate-900">{rangeStart}</span> à <span className="font-semibold text-slate-900">{rangeEnd}</span> sur <span className="font-semibold text-slate-900">{pagination.total}</span> documents
                  </div>
                  <nav className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40"
                    >
                      <FaChevronLeft size={12} />
                    </button>
                    {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => {
                      let pageNum: number;
                      if (pagination.last_page <= 5) pageNum = i + 1;
                      else if (pagination.current_page <= 3) pageNum = i + 1;
                      else if (pagination.current_page >= pagination.last_page - 2) pageNum = pagination.last_page - 4 + i;
                      else pageNum = pagination.current_page - 2 + i;
                      const active = pagination.current_page === pageNum;
                      return (
                        <button
                          key={i}
                          onClick={() => handlePageChange(pageNum)}
                          className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-sm font-semibold shadow-sm ring-1 transition ${active ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.last_page}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40"
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
        projet={monprojet}
        idclasseur={idclasseur}
        verification={false}
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

export default ListeDocumentScreen;
