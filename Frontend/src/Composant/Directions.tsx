// @ts-nocheck
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaBuilding,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaEye,
  FaSpinner,
  FaUsers,
  FaExclamationCircle,
  FaSync,
  FaTag,
  FaCalendarAlt,
  FaCheckCircle,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "./getTokenOrRedirect";
import DetailModal from "../Modals/DetailModal";
import ConfirmModal from "../Modals/ConfirmModal";
import ActionDropdown from "./ActionDropdown";
import { toast } from "../Composant/Toast";

const Directions = () => {
  const [directions, setDirections] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDirection, setEditingDirection] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [stats, setStats] = useState({
    total: 0,
    directions_avec_utilisateurs: 0,
    total_affectations: 0,
  });
  const [perPage, setPerPage] = useState(10);

  const token = GetTokenOrRedirect();
    const [confirmItem, setConfirmItem] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const [detailItem, setDetailItem] = useState(null);


  const [formData, setFormData] = useState({
    sigle: "",
    nom: "",
  });

  // lock body scroll when modal open
  useEffect(() => {
    if (showModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [showModal]);

  // fetch on mount / page / perPage
  useEffect(() => {
    if (token) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentPage, perPage]);

  // debounce search -> fetch (keeps pagination coherent)
  useEffect(() => {
    if (!token) return;
    const id = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchDirections();
    }, 420);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchDirections(), loadDirectionStats()]);
    } catch (error) {
      console.error("Erreur chargement données:", error);
      if (error.response?.status === 401) return;
      toast.error("Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  const fetchDirections = async () => {
    try {
      const params = { page: currentPage, per_page: perPage };
      if (search) params.search = search;
      const response = await axios.get(`${API_BASE_URL}/departements`, {
        headers: getAuthHeaders(),
        params,
      });
      if (response.data && response.data.success) {
        const apiData = response.data.data;
        setDirections(apiData.data || []);
        setPagination({
          current_page: apiData.current_page || 1,
          last_page: apiData.last_page || 1,
          per_page: apiData.per_page || 10,
          total: apiData.total || 0,
        });
      }
    } catch (error) {
      console.error("Erreur chargement directions:", error);
      throw error;
    }
  };

  const loadDirectionStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/departements/stats/departement`, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) setStats(response.data.data);
    } catch (error) {
      console.error("Erreur stats directions:", error);
    }
  };

  const addDirection = async (directionData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/departements`, directionData, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) return response.data.data;
    } catch (error) {
      console.error("Erreur ajout direction:", error);
      throw error;
    }
  };

  const updateDirection = async (id, directionData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/departements/${id}`, directionData, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) return response.data.data;
    } catch (error) {
      console.error("Erreur modification direction:", error);
      throw error;
    }
  };

  const deleteDirection = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/departements/${id}`, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) return true;
    } catch (error) {
      console.error("Erreur suppression direction:", error);
      throw error;
    }
  };

  const handleDelete = (id) => {
        if (!token) { toast.error("Vous n'êtes pas authentifié. Veuillez vous reconnecter."); return; }
        const _item = directions.find((x) => x.id === id);
        if (_item) setConfirmItem(_item); else setConfirmItem({ id });
    };

    const confirmDelete = async () => {
        if (!confirmItem || !token) return;
        setConfirmLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/departements/${confirmItem.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Désactivé avec succès");
            setConfirmItem(null);
            fetchDirections();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const dataToSend = { sigle: formData.sigle.trim().toUpperCase(), nom: formData.nom.trim() };
      if (editingDirection) {
        await updateDirection(editingDirection.id, dataToSend);
        toast.success("Direction mise à jour avec succès");
      } else {
        await addDirection(dataToSend);
        toast.success("Direction créée avec succès");
      }
      setShowModal(false);
      resetForm();
      await fetchDirections();
    } catch (error) {
      console.error("Erreur soumission:", error);
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        toast.error("Veuillez corriger les erreurs dans le formulaire");
      } else if (error.response?.status === 409) {
        toast.error("Ce sigle est déjà utilisé par une autre direction");
      } else {
        toast.error(error.response?.data?.message || error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (direction) => {
    setEditingDirection(direction);
    setFormData({ sigle: direction.sigle, nom: direction.nom });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ sigle: "", nom: "" });
    setEditingDirection(null);
    setErrors({});
  };

  const handleSearch = (e) => setSearch(e.target.value);

  const handlePerPageChange = (e) => {
    const newPerPage = parseInt(e.target.value, 10);
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.last_page) setCurrentPage(page);
  };

  const formatDateSafe = (d) => {
    if (!d) return "—";
    try { return format(new Date(d), "dd/MM/yyyy à HH:mm", { locale: fr }); } catch { return "—"; }
  };

  // derived stats for cards (fallback sur pagination.total si stats.total = 0)
  const totalDirections = stats.total || pagination.total || directions.length;
  const avecUsers = stats.directions_avec_utilisateurs || directions.filter((d) => (d.users_count || 0) > 0).length;
  const affectations = stats.total_affectations ?? directions.reduce((acc, d) => acc + (d.users_count || 0), 0);

  const statsCards = [
    {
      id: 1,
      title: "Total Directions",
      value: String(totalDirections),
      icon: <FaBuilding className="text-white text-xl" />,
      gradient: "from-indigo-500 via-indigo-600 to-violet-600",
      description: `${pagination.total} enregistrée(s)`,
    },
    {
      id: 2,
      title: "Directions assignées",
      value: String(avecUsers),
      icon: <FaUsers className="text-white text-xl" />,
      gradient: "from-emerald-500 via-teal-500 to-cyan-600",
      description: avecUsers > 0 && totalDirections > 0 ? `${Math.round((avecUsers / totalDirections) * 100)}% du total` : "Avec utilisateurs",
    },
    {
      id: 3,
      title: "Affectations",
      value: String(affectations),
      icon: <FaCheckCircle className="text-white text-xl" />,
      gradient: "from-amber-500 via-orange-500 to-orange-600",
      description: "Utilisateurs rattachés",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
              <FaBuilding className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestion des Directions</h1>
              <p className="mt-1 text-sm text-slate-500">Gérez les directions, sigles et affectations utilisateurs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/gestion-utilisateurs/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Dashboard
            </Link>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              disabled={loading || submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition"
            >
              <FaPlus className="text-xs" /> Nouvelle Direction
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {statsCards.map((card) => (
          <div key={card.id} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-6 shadow-sm`}>
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

      {/* Toolbar */}
      <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 max-w-3xl">
            <div className="relative flex-1">
              <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par sigle ou nom..."
                value={search}
                onChange={handleSearch}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition"
              />
            </div>
            <div className="relative">
              <select
                value={perPage}
                onChange={handlePerPageChange}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-8 text-sm font-medium text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition"
              >
                <option value="5">5 / page</option>
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
              </select>
            </div>
            <button
              onClick={() => { setLoading(true); fetchDirections().finally(() => setLoading(false)); }}
              disabled={loading}
              title="Rafraîchir"
              className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <FaSync className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="flex items-center gap-2 lg:shrink-0">
            <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
              {pagination.total} direction(s)
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
              <FaSpinner className="animate-spin text-indigo-600" size={20} />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-600">Chargement des directions...</p>
          </div>
        ) : directions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
              <FaBuilding className="text-2xl text-slate-400" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">Aucune direction trouvée</h3>
            <p className="mt-1 text-sm text-slate-500">{search ? "Essayez avec d'autres termes de recherche" : "Commencez par créer votre première direction"}</p>
            {!search && (
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
              >
                <FaPlus className="text-xs" /> Nouvelle direction
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500 w-14">#</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Sigle</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Nom de la direction</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Utilisateurs</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Création</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-slate-500 w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {directions.map((direction, index) => (
                  <tr key={direction.id} className="hover:bg-slate-50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-500">
                      {(currentPage - 1) * pagination.per_page + index + 1}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold tracking-wide text-indigo-700 ring-1 ring-inset ring-indigo-600/15">
                        {direction.sigle}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                          <FaBuilding className="text-sm" />
                        </span>
                        <span className="text-sm font-semibold text-slate-900 line-clamp-1" title={direction.nom}>{direction.nom}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${ (direction.users_count || 0) > 0 ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-50 text-slate-600 ring-slate-200"}`}>
                        <FaUsers className="text-[11px] opacity-70" /> {direction.users_count || 0} utilisateur(s)
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                        <FaCalendarAlt className="text-xs text-slate-400" />
                        {direction.datecreation ? format(new Date(direction.datecreation), "dd/MM/yyyy", { locale: fr }) : formatDateSafe(direction.created_at)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <ActionDropdown>
                        <Link
                          to={`/gestion-utilisateurs/directions/${direction.id}`}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600"><FaEye className="text-xs" /></span>
                          Détails
                        </Link>
                        <button
                          onClick={() => handleEdit(direction)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><FaEdit className="text-xs" /></span>
                          Modifier
                        </button>
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          onClick={() => handleDelete(direction.id)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><FaTrash className="text-xs" /></span>
                          Supprimer
                        </button>
                      </ActionDropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.last_page > 1 && (
        <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200/60 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Affichage de <span className="font-semibold text-slate-900">{(currentPage - 1) * pagination.per_page + 1}</span> à{" "}
            <span className="font-semibold text-slate-900">{Math.min(currentPage * pagination.per_page, pagination.total)}</span> sur{" "}
            <span className="font-semibold text-slate-900">{pagination.total}</span> directions
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <FaChevronLeft className="text-xs" />
            </button>
            {(() => {
              const pages = [];
              const maxVisible = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
              let endPage = Math.min(pagination.last_page, startPage + maxVisible - 1);
              if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
              for (let i = startPage; i <= endPage; i++) pages.push(i);
              return (
                <>
                  {startPage > 1 && (
                    <>
                      <button onClick={() => handlePageChange(1)} className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">1</button>
                      {startPage > 2 && <span className="px-1 text-slate-400">…</span>}
                    </>
                  )}
                  {pages.map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      disabled={loading}
                      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-sm font-semibold transition ${page === currentPage ? "bg-indigo-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      {page}
                    </button>
                  ))}
                  {endPage < pagination.last_page && (
                    <>
                      {endPage < pagination.last_page - 1 && <span className="px-1 text-slate-400">…</span>}
                      <button onClick={() => handlePageChange(pagination.last_page)} className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">{pagination.last_page}</button>
                    </>
                  )}
                </>
              );
            })()}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.last_page || loading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <FaChevronRight className="text-xs" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 animate-[in_.2s_ease]">
            {/* Header gradient */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-6 py-5">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur ring-1 ring-white/20">
                    {editingDirection ? <FaEdit className="text-white" /> : <FaPlus className="text-white" />}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white">{editingDirection ? "Modifier la direction" : "Nouvelle Direction"}</h3>
                    <p className="text-xs font-medium text-white/70">{editingDirection ? "Mettez à jour les informations" : "Créez une nouvelle entité"}</p>
                  </div>
                </div>
                <button
                  onClick={() => !submitting && setShowModal(false)}
                  disabled={submitting}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur ring-1 ring-white/20 hover:bg-white/20 transition disabled:opacity-50"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Champs */}
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <FaBuilding className="text-indigo-600" /> Informations de la direction
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <FaTag className="text-indigo-500 text-xs" /> Sigle <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FaTag className="text-xs" /></span>
                        <input
                          type="text"
                          value={formData.sigle}
                          onChange={(e) => { setFormData({ ...formData, sigle: e.target.value.toUpperCase() }); if (errors.sigle) setErrors({ ...errors, sigle: undefined }); }}
                          placeholder="Ex: DRH"
                          maxLength={10}
                          disabled={submitting}
                          className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-sm font-semibold uppercase tracking-wide text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition ${errors.sigle ? "border-rose-300 focus:border-rose-300 focus:ring-rose-100" : "border-slate-200 focus:border-indigo-300 focus:ring-indigo-100"}`}
                        />
                      </div>
                      {errors.sigle && <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600"><FaExclamationCircle className="text-[11px]" />{Array.isArray(errors.sigle) ? errors.sigle[0] : errors.sigle}</p>}
                      <p className="mt-1 text-[11px] text-slate-400">Maximum 10 caractères</p>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <FaBuilding className="text-indigo-500 text-xs" /> Nom complet <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FaBuilding className="text-xs" /></span>
                        <input
                          type="text"
                          value={formData.nom}
                          onChange={(e) => { setFormData({ ...formData, nom: e.target.value }); if (errors.nom) setErrors({ ...errors, nom: undefined }); }}
                          placeholder="Ex: Direction des Ressources Humaines"
                          maxLength={100}
                          disabled={submitting}
                          className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition ${errors.nom ? "border-rose-300 focus:border-rose-300 focus:ring-rose-100" : "border-slate-200 focus:border-indigo-300 focus:ring-indigo-100"}`}
                        />
                      </div>
                      {errors.nom && <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600"><FaExclamationCircle className="text-[11px]" />{Array.isArray(errors.nom) ? errors.nom[0] : errors.nom}</p>}
                    </div>
                  </div>
                </div>

                {editingDirection && (
                  <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 ring-1 ring-sky-200"><FaUsers /></span>
                    <div className="text-sm">
                      <p className="font-semibold text-sky-900">Informations sur les utilisateurs</p>
                      <p className="text-sky-700">Cette direction a <strong>{editingDirection.users_count || 0}</strong> utilisateur(s) assigné(s)</p>
                    </div>
                  </div>
                )}

                {/* Aperçu */}
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><FaEye className="text-indigo-600" /> Aperçu</h4>
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow"><FaBuilding /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{formData.nom || "Nom de la direction"}</p>
                      <span className="mt-1 inline-flex rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-bold tracking-wide text-white">{formData.sigle || "SIGLE"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 transition"
                >
                  {submitting ? (<><FaSpinner className="animate-spin" />{editingDirection ? "Mise à jour..." : "Création..."}</>) : (editingDirection ? "Mettre à jour" : "Créer la direction")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
                
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

export default Directions;
