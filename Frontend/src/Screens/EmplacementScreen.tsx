/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useEffect, useState } from "react";
import axios from "axios";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import ModalEmplacementScreen from "../Modals/ModalEmplacementScreen";
import ActionDropdown from "../Composant/ActionDropdown";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaMapMarkerAlt,
  FaSync,
  FaCheckCircle,
  FaTimesCircle,
  FaCalendarAlt,
} from "react-icons/fa";
import LoadingSpinner from "../Loading/LoadingSpinner";
import { toast } from "../Composant/Toast";
import DetailModal from "../Modals/DetailModal";
import ConfirmModal from "../Modals/ConfirmModal";

const EmplacementScreen = () => {
  const [emplacements, setEmplacements] = useState([]);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });
  const [modeRecherche, setModeRecherche] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [emplacementToEdit, setEmplacementToEdit] = useState(null);

  const [statsCards, setStatsCards] = useState([
    {
      id: 1,
      title: "Total Emplacements",
      value: "0",
      icon: <FaMapMarkerAlt className="text-white" size={22} />,
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      description: "Tous les emplacements",
    },
    {
      id: 2,
      title: "Actifs",
      value: "0",
      icon: <FaCheckCircle className="text-white" size={22} />,
      color: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
      description: "Emplacements actifs",
    },
    {
      id: 3,
      title: "Inactifs",
      value: "0",
      icon: <FaTimesCircle className="text-white" size={22} />,
      color: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
      description: "Emplacements inactifs",
    },
  ]);

  const token = GetTokenOrRedirect();
    const [confirmItem, setConfirmItem] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const [detailItem, setDetailItem] = useState(null);


  useEffect(() => {
    if (emplacements.length > 0) {
      const total = emplacements.length;
      const actifs = emplacements.filter((e) => e.statut === true || e.statut === 1).length;
      const inactifs = total - actifs;
      setStatsCards([
        {
          id: 1,
          title: "Total Emplacements",
          value: total.toString(),
          icon: <FaMapMarkerAlt className="text-white" size={22} />,
          color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          description: "Tous les emplacements",
        },
        {
          id: 2,
          title: "Actifs",
          value: actifs.toString(),
          icon: <FaCheckCircle className="text-white" size={22} />,
          color: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
          description: `${actifs > 0 ? Math.round((actifs / total) * 100) : 0}% actifs`,
        },
        {
          id: 3,
          title: "Inactifs",
          value: inactifs.toString(),
          icon: <FaTimesCircle className="text-white" size={22} />,
          color: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
          description: `${inactifs > 0 ? Math.round((inactifs / total) * 100) : 0}% inactifs`,
        },
      ]);
    }
  }, [emplacements]);

  useEffect(() => {
    if (token) {
      fetchEmplacements();
    }
  }, [pagination.current_page, pagination.per_page, modeRecherche, token]);

  const fetchEmplacements = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let res;
      if (modeRecherche && search.trim() !== "") {
        res = await axios.get(`${API_BASE_URL}/emplacements/search`, {
          params: { search, page: pagination.current_page, per_page: pagination.per_page },
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        res = await axios.get(`${API_BASE_URL}/emplacements?page=${pagination.current_page}&per_page=${pagination.per_page}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setEmplacements(res.data.data);
      setPagination({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
        total: res.data.total,
        per_page: res.data.per_page || 10,
      });
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des emplacements");
    } finally {
      setLoading(false);
    }
  };

  const handlePerPageChange = (e) => {
    const newPerPage = parseInt(e.target.value, 10);
    setPagination(prev => ({ ...prev, per_page: newPerPage, current_page: 1 }));
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current_page: 1 }));
    setModeRecherche(true);
  };

  const actualiser = () => {
    setSearch("");
    setModeRecherche(false);
    setPagination({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
  };

  const handleEdit = (emplacement) => {
    setEmplacementToEdit(emplacement);
    setShowModal(true);
  };

  const handleDelete = (id) => {
        if (!token) { toast.error("Vous n'êtes pas authentifié. Veuillez vous reconnecter."); return; }
        const _item = emplacements.find((x) => x.id === id);
        if (_item) setConfirmItem(_item); else setConfirmItem({ id });
    };

    const confirmDelete = async () => {
        if (!confirmItem || !token) return;
        setConfirmLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/emplacements/${confirmItem.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Supprimé avec succès");
            setConfirmItem(null);
            fetchEmplacements();
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

  const handleModalSuccess = () => {
    fetchEmplacements();
    setEmplacementToEdit(null);
  };

  const getStatusBadge = (statut) => {
    const isActive = statut === true || statut === 1 || statut === "1";
    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Actif
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
        Inactif
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Menus />
      <Head />
      <div className="lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <FaMapMarkerAlt className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestion des Emplacements</h1>
                  <p className="text-sm text-slate-500 mt-1">Gérez les emplacements de votre organisation</p>
                </div>
              </div>
              <nav className="flex items-center gap-2 text-sm">
                <a href="/" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Accueil
                </a>
                <span className="text-slate-300">/</span>
                <span className="font-medium text-slate-900">Emplacements</span>
              </nav>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statsCards.map((card) => (
              <div
                key={card.id}
                className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg"
                style={{ background: card.color }}
              >
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">{card.title}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight">{card.value}</p>
                    <p className="mt-1 text-xs text-white/70">{card.description}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-3 max-w-3xl">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Rechercher un emplacement..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-indigo-500/20 transition-colors shrink-0"
                >
                  <FaSearch size={12} /> Rechercher
                </button>
                <button
                  onClick={actualiser}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-colors shrink-0"
                >
                  <FaSync size={12} /> Actualiser
                </button>
              </div>
              <button
                onClick={() => {
                  setEmplacementToEdit(null);
                  setShowModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all shrink-0"
              >
                <FaPlus size={12} /> Ajouter un Emplacement
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-8">
                <LoadingSpinner message="Chargement des emplacements..." variant="table" size="lg" />
              </div>
            ) : emplacements.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <FaMapMarkerAlt className="text-slate-400" size={28} />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Aucun emplacement trouvé</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                  {modeRecherche ? "Aucun résultat pour votre recherche" : "Commencez par ajouter un emplacement pour le voir apparaître ici."}
                </p>
                {!modeRecherche && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    <FaPlus size={12} /> Ajouter un emplacement
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">#</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Emplacement</th>
                      <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date de création</th>
                      <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {emplacements.map((emplacement, index) => (
                      <tr key={emplacement.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-500">
                            {(pagination.current_page - 1) * pagination.per_page + index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                              <FaMapMarkerAlt className="text-indigo-600" size={16} />
                            </div>
                            <span className="text-sm font-semibold text-slate-900">{emplacement.nom_emplacement}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">{getStatusBadge(emplacement.statut)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                            <FaCalendarAlt className="text-slate-400" size={12} /> {formatDate(emplacement.created_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <ActionDropdown>
                            <button
                              onClick={() => handleEdit(emplacement)}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                            >
                              <FaEdit className="text-indigo-600" /> Modifier
                            </button>
                            <button
                              onClick={() => setDetailItem(emplacement)}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                            >
                              <FaEye className="text-sky-600" /> Détails
                            </button>
                            <div className="my-1 border-t border-slate-100"></div>
                            <button
                              onClick={() => handleDelete(emplacement.id, emplacement.nom_emplacement)}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                            >
                              <FaTrash /> Supprimer
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
          {emplacements.length > 0 && (
            <div className="mt-4 bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
              <p className="text-sm text-slate-500">
                Affichage de <span className="font-semibold text-slate-900">{(pagination.current_page - 1) * pagination.per_page + 1}</span> à{" "}
                <span className="font-semibold text-slate-900">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> sur{" "}
                <span className="font-semibold text-slate-900">{pagination.total}</span> emplacements
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
              <nav className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronLeft size={12} />
                </button>
                {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => {
                  let pageNum;
                  if (pagination.last_page <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.current_page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.current_page >= pagination.last_page - 2) {
                    pageNum = pagination.last_page - 4 + i;
                  } else {
                    pageNum = pagination.current_page - 2 + i;
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handlePageChange(pageNum)}
                      className={`h-9 min-w-[36px] px-3 inline-flex items-center justify-center rounded-lg text-sm font-medium border transition-colors ${
                        pagination.current_page === pageNum
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronRight size={12} />
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      <ModalEmplacementScreen
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEmplacementToEdit(null);
        }}
        emplacementToEdit={emplacementToEdit}
        onSuccess={handleModalSuccess}
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

            <ConfirmModal
                isOpen={!!confirmItem}
                onClose={() => setConfirmItem(null)}
                onConfirm={confirmDelete}
                title="Confirmer la suppression ?"
                message={confirmItem ? "Voulez-vous supprimer \"" + (confirmItem.nom || confirmItem.nom_classeur || confirmItem.intitule || confirmItem.numero_serie || confirmItem.id) + "\" ? Cette action est irréversible." : ""}
                confirmText="Oui, supprimer"
                variant="danger"
                loading={confirmLoading}
            />
            
</div>
  );
};

export default EmplacementScreen;
