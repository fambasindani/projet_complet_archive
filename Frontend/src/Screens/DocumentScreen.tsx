/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useEffect, useState } from "react";
import axios from "axios";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { useHistory } from "react-router-dom";
import {
  FaPlus,
  FaSearch,
  FaSync,
  FaFileAlt,
  FaEdit,
  FaTrash,
  FaDownload,
  FaEye,
  FaCopy,
  FaShare,
  FaPrint,
  FaBuilding,
  FaMapMarkerAlt,
  FaFolder,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
} from "react-icons/fa";
import LoadingSpinner from "../Loading/LoadingSpinner";
import { Link } from "react-router-dom";
import FileUploadModal from "../Modals/FileUploadModal";
import { toast } from "../Composant/Toast";
import ConfirmModal from "../Modals/ConfirmModal";
import ActionDropdown from "../Composant/ActionDropdown";

const DocumentScreen = () => {
  const token = GetTokenOrRedirect();
    const [confirmItem, setConfirmItem] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

  const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));
  const role = JSON.parse(localStorage.getItem("role"));

  const [userDirectionIds, setUserDirectionIds] = useState([]);
  const [userDepartements, setUserDepartements] = useState([]);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  useEffect(() => {
    const storedDepartements = JSON.parse(localStorage.getItem("departements") || "[]");
    setUserDepartements(storedDepartements);
    const ids = storedDepartements.map((dept) => dept.id);
    setUserDirectionIds(ids);
    console.log("🏢 IDs des départements utilisateur (login):", ids);

    if (ids.length === 0) {
      toast.info("Vous n'avez accès à aucune direction. Veuillez contacter l'administrateur.");
    }

    setTimeout(() => {
      setIsLoadingUserData(false);
    }, 500);
  }, []);

  const navRouter = useHistory();

  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });
  const [modeRecherche, setModeRecherche] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredBy, setFilteredBy] = useState(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentForUpload, setSelectedDocumentForUpload] = useState(null);

  const [statsCards, setStatsCards] = useState([
    {
      id: 1,
      title: "Mes Documents",
      value: "0",
      icon: <FaFileAlt className="text-white text-xl" />,
      gradient: "from-indigo-500 via-indigo-600 to-violet-600",
      description: "Documents accessibles",
    },
    {
      id: 2,
      title: "Documents Actifs",
      value: "0",
      icon: <FaFileAlt className="text-white text-xl" />,
      gradient: "from-emerald-500 via-teal-500 to-cyan-600",
      description: "Documents actifs",
    },
    {
      id: 3,
      title: "Documents Inactifs",
      value: "0",
      icon: <FaFileAlt className="text-white text-xl" />,
      gradient: "from-amber-500 via-orange-500 to-orange-600",
      description: "Documents inactifs",
    },
  ]);

  const handleAddDocument = () => {
    navRouter.push("/addform");
  };

  const handleEditDocument = (document) => {
    navRouter.push(`/addform/${document.id}`);
  };

  const handleViewDocument = (document) => {
    navRouter.push(`/detail-document/${document.id}`);
  };

  const handleDuplicateDocument = (document) => {
    if (confirm("Dupliquer le document ?")) {
      if (result.isConfirmed) {
        toast.success("Document dupliqué avec succès.");
      }
    };
  };

  const handleShareDocument = (document) => {
    if (confirm("Partager le document")) {
      if (result.isConfirmed) {
        toast.success("Document partagé avec succès.");
      }
    };
  };

  const handleUploadClick = (document) => {
    setSelectedDocumentForUpload(document);
    setShowUploadModal(true);
  };

  useEffect(() => {
    if (token && !isLoadingUserData) {
      fetchDocuments();
    }
  }, [pagination.current_page, pagination.per_page, modeRecherche, token, userDirectionIds, isLoadingUserData]);

  const fetchDocuments = async () => {
    if (!token) return;

    setLoading(true);
    setDocuments([]);

    try {
      let params = {
        page: pagination.current_page,
        per_page: pagination.per_page,
      };

      if (userDirectionIds.length > 0) {
        params.direction_ids = userDirectionIds.join(",");
        console.log("📤 Envoi des direction_ids:", params.direction_ids);
      } else {
        console.log("📤 Aucune direction - ne rien afficher");
        setDocuments([]);
        setFilteredBy("none");
        setPagination({
          current_page: 1,
          last_page: 1,
          total: 0,
          per_page: 10,
        });
        setLoading(false);
        return;
      }

      let res;
      if (modeRecherche && search.trim() !== "") {
        res = await axios.post(
          `${API_BASE_URL}/declarations/search`,
          {
            search,
            page: pagination.current_page,
            direction_ids: userDirectionIds,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        res = await axios.get(`${API_BASE_URL}/declarations`, {
          headers: { Authorization: `Bearer ${token}` },
          params: params,
        });
      }

      console.log("📥 Réponse brute:", res.data);

      const responseData = res.data.data || res.data;
      const documentsList = responseData.data || responseData || [];
      const filteredByValue = res.data.filtered_by || "all";

      console.log("📊 Documents reçus:", documentsList.length);
      console.log("📌 IDs des directions:", [...new Set(documentsList.map((d) => d.id_direction))]);

      setDocuments(documentsList);
      setFilteredBy(filteredByValue);

      setPagination({
        current_page: responseData.current_page || 1,
        last_page: responseData.last_page || 1,
        total: responseData.total || documentsList.length,
        per_page: responseData.per_page || 10,
      });

      const total = documentsList.length;
      const actifs = documentsList.filter((d) => d.statut === true || d.statut === 1).length;

      setStatsCards((prev) => [
        {
          ...prev[0],
          value: total.toString(),
          gradient: "from-indigo-500 via-indigo-600 to-violet-600",
          icon: <FaFileAlt className="text-white text-xl" />,
          title: "Mes Documents",
          description: total > 0 ? `${total} document${total > 1 ? "s" : ""} accessibles` : "Documents accessibles",
        },
        {
          ...prev[1],
          value: actifs.toString(),
          gradient: "from-emerald-500 via-teal-500 to-cyan-600",
          icon: <FaFileAlt className="text-white text-xl" />,
          title: "Documents Actifs",
          description: total > 0 ? `${Math.round((actifs / total) * 100)}% actifs` : "0% actifs",
        },
        {
          ...prev[2],
          value: (total - actifs).toString(),
          gradient: "from-amber-500 via-orange-500 to-orange-600",
          icon: <FaFileAlt className="text-white text-xl" />,
          title: "Documents Inactifs",
          description: total > 0 ? `${Math.round(((total - actifs) / total) * 100)}% inactifs` : "0% inactifs",
        },
      ]);
    } catch (err) {
      console.error("❌ Erreur:", err);
      toast.error(err.response?.data?.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
    setModeRecherche(true);
  };

  const actualiser = () => {
    setSearch("");
    setModeRecherche(false);
    setDocuments([]);
    setPagination({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
  };

  const handlePerPageChange = (e) => {
    const newPerPage = parseInt(e.target.value, 10);
    setPagination(prev => ({ ...prev, per_page: newPerPage, current_page: 1 }));
  };

  const handleDelete = (id, intitule) => {
        if (!token) { toast.error("Vous n'êtes pas authentifié. Veuillez vous reconnecter."); return; }
        const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");
        if (!permissions.includes("supprimer_document")) { toast.error("Vous n'avez pas la permission 'supprimer_document' pour désactiver cet élément."); return; }
        const _item = documents.find((x) => x.id === id);
        if (_item) setConfirmItem(_item); else setConfirmItem({ id, intitule });
    };

    const confirmDelete = async () => {
        if (!confirmItem || !token) return;
        setConfirmLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/declarations/${confirmItem.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Désactivé avec succès");
            setConfirmItem(null);
            fetchDocuments();
        } catch (error) {
            let errorMessage = "Erreur lors de la désactivation.";
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;
                if (status === 403) errorMessage = data?.message || "Permission refusée.";
                else if (status === 404) errorMessage = data?.message || "Élément non trouvé.";
                else if (status === 401) errorMessage = "Session expirée. Veuillez vous reconnecter.";
                else if (data?.message) errorMessage = data.message;
            } else if (error.request) errorMessage = "Impossible de contacter le serveur.";
            else errorMessage = error.message || errorMessage;
            toast.error(errorMessage);
            console.error(error);
        } finally {
            setConfirmLoading(false);
        }
    };
;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.last_page) {
      setPagination((prev) => ({ ...prev, current_page: page }));
    }
  };

  const getStatusBadge = (statut) => {
    const isActive = statut === true || statut === 1 || statut === "1";
    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Actif
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Inactif
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Menus />
      <Head />
      <div className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header premium */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
                  <FaFileAlt className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mes Documents</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {userDirectionIds.length > 0
                      ? `Documents des directions: ${userDirectionIds.join(", ")}`
                      : "Aucune direction assignée"}
                  </p>
                  {filteredBy && filteredBy !== "all" && filteredBy !== "none" && Array.isArray(filteredBy) && (
                    <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
                      <FaBuilding className="text-[10px]" />
                      Filtré par directions: {filteredBy.join(", ")}
                    </p>
                  )}
                  {filteredBy === "none" && (
                    <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                      <FaBuilding className="text-[10px]" />
                      Aucune direction accessible
                    </p>
                  )}
                </div>
              </div>
              <nav className="flex items-center gap-2 text-sm">
                <Link to="/" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Accueil
                </Link>
                <span className="text-slate-300">/</span>
                <span className="font-medium text-slate-900">Documents</span>
              </nav>
            </div>

            {/* Mes directions accessibles */}
            {userDepartements.length > 0 && (
              <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60">
                <h6 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                    <FaBuilding className="text-xs" />
                  </span>
                  Mes directions accessibles
                </h6>
                <div className="flex flex-wrap gap-2">
                  {userDepartements.map((dept) => (
                    <span
                      key={dept.id}
                      className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/15"
                    >
                      {dept.sigle} – {dept.nom}
                      <span className="ml-2 rounded-full bg-white px-1.5 py-0.5 text-[11px] font-bold text-indigo-600 ring-1 ring-indigo-200">
                        ID: {dept.id}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stats 3 colonnes */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {statsCards.map((card) => (
              <div
                key={card.id}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-6 shadow-sm`}
              >
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                <div className="absolute -right-2 -bottom-8 h-32 w-32 rounded-full bg-white/5" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/80">{card.title}</p>
                    <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
                    <p className="mt-1 text-xs font-medium text-white/70">{card.description}</p>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/20">
                    {card.icon}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Barre recherche + Ajouter */}
          <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-3 max-w-3xl">
                <div className="relative flex-1">
                  <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un document (intitulé, référence, mot-clé)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    disabled={userDirectionIds.length === 0}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading || userDirectionIds.length === 0}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaSearch className="text-xs" /> Rechercher
                </button>
                <button
                  onClick={actualiser}
                  disabled={loading}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  <FaSync className="text-xs" /> Actualiser
                </button>
              </div>
              <button
                onClick={handleAddDocument}
                disabled={loading || userDirectionIds.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition lg:shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPlus className="text-xs" /> Nouveau Document
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
            {loading ? (
              <div className="py-8">
                <LoadingSpinner message="Chargement des documents..." variant="table" size="lg" />
              </div>
            ) : documents.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                  <FaFolder className="text-2xl text-slate-400" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">Aucun document trouvé</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                  {userDepartements.length === 0
                    ? "Vous n'avez accès à aucune direction. Veuillez contacter l'administrateur."
                    : userDirectionIds.length > 0
                    ? `Aucun document n'est disponible pour vos directions (IDs: ${userDirectionIds.join(", ")})`
                    : search
                    ? `Aucun résultat pour "${search}"`
                    : "Commencez par ajouter un nouveau document"}
                </p>
                {!search && userDirectionIds.length > 0 && (
                  <button
                    onClick={handleAddDocument}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                  >
                    <FaPlus className="text-xs" /> Ajouter un document
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <h6 className="text-sm font-bold text-slate-900">
                    Liste des Documents
                    {filteredBy && filteredBy !== "all" && filteredBy !== "none" && Array.isArray(filteredBy) && (
                      <span className="ml-2 font-normal text-slate-500">(Filtré par directions: {filteredBy.join(", ")})</span>
                    )}
                  </h6>
                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    {pagination.total} document{pagination.total > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500 w-14">#</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Classeur</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Intitulé</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Mot Clé</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Direction</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Emplacement</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Date</th>
                        <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">Statut</th>
                        <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-slate-500 w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {documents.map((row, index) => (
                        <tr key={row.id || index} className="hover:bg-slate-50 transition-colors">
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-500">
                            {(pagination.current_page - 1) * pagination.per_page + index + 1}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                            <span className="inline-flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                                <FaFolder className="text-xs" />
                              </span>
                              {row.nom_classeur || (row.classeur && row.classeur.nom_classeur) || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-[260px]">
                              <div className="text-sm font-semibold text-slate-900 truncate">{row.intitule}</div>
                              <div className="text-xs text-slate-500">{row.num_reference || "—"}</div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {row.mot_cle ? (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                                {row.mot_cle}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                              <FaBuilding className="text-xs text-slate-400" />
                              {row.nom_direction || "—"}
                              <span className="hidden sm:inline-flex items-center rounded-full bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200 ml-1">
                                ID: {row.id_direction}
                              </span>
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                              <FaMapMarkerAlt className="text-xs text-slate-400" />
                              {row.nom_emplacement || "—"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                              <FaCalendarAlt className="text-xs text-slate-400" />
                              <span>
                                <span className="font-medium text-slate-700">{formatDate(row.created_at)}</span>
                                <span className="ml-1 text-xs text-slate-400">{formatTime(row.created_at)}</span>
                              </span>
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center">{getStatusBadge(row.statut)}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-center">
                            <ActionDropdown>
                              <button onClick={() => handleViewDocument(row)} className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                  <FaEye className="text-xs" />
                                </span>
                                Voir
                              </button>
                              <button onClick={() => handleEditDocument(row)} className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                                  <FaEdit className="text-xs" />
                                </span>
                                Modifier
                              </button>
                              <button onClick={() => handleUploadClick(row)} className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                  <FaDownload className="text-xs" />
                                </span>
                                Gérer fichiers
                              </button>
                              <div className="my-1 border-t border-slate-100" />
                              <button onClick={() => handleDelete(row.id, row.intitule)} className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                                  <FaTrash className="text-xs" />
                                </span>
                                Supprimer
                              </button>
                            </ActionDropdown>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Pagination propre */}
          {documents.length > 0 && pagination.last_page > 1 && (
            <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200/60 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
              <p className="text-sm text-slate-500">
                Affichage de <span className="font-semibold text-slate-900">{(pagination.current_page - 1) * pagination.per_page + 1}</span> à{" "}
                <span className="font-semibold text-slate-900">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> sur{" "}
                <span className="font-semibold text-slate-900">{pagination.total}</span> documents
              </p>
              <select
                value={pagination.per_page}
                onChange={handlePerPageChange}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
                >
                  <FaChevronLeft className="text-xs" />
                </button>
                {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => {
                  let pageNum;
                  if (pagination.last_page <= 5) pageNum = i + 1;
                  else if (pagination.current_page <= 3) pageNum = i + 1;
                  else if (pagination.current_page >= pagination.last_page - 2) pageNum = pagination.last_page - 4 + i;
                  else pageNum = pagination.current_page - 2 + i;
                  const active = pagination.current_page === pageNum;
                  return (
                    <button
                      key={i}
                      onClick={() => handlePageChange(pageNum)}
                      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-sm font-semibold transition ${
                        active ? "bg-indigo-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
                >
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'upload */}
      {showUploadModal && selectedDocumentForUpload && (
        <FileUploadModal
          documentId={selectedDocumentForUpload.id}
          id_classeur={selectedDocumentForUpload.id_classeur || selectedDocumentForUpload.classeur?.id}
          onClose={() => setShowUploadModal(false)}
          token={token}
          nom_fichier={selectedDocumentForUpload.intitule}
        />
      )}
                
            <ConfirmModal
                isOpen={!!confirmItem}
                onClose={() => setConfirmItem(null)}
                onConfirm={confirmDelete}
                title="Confirmer la suppression ?"
                message={confirmItem ? "Voulez-vous désactiver \"" + (confirmItem.nom || confirmItem.nom_classeur || confirmItem.intitule || confirmItem.numero_serie || confirmItem.id) + "\" ?" : ""}
                confirmText="Oui, désactiver"
                variant="danger"
                loading={confirmLoading}
            />
            
</div>
  );
};

export default DocumentScreen;
