/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import ModalMinistere from "../Modals/ModalMinistere";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaFileInvoice,
  FaSync,
  FaCheckCircle,
  FaTimesCircle,
  FaCalendarAlt,
  FaHashtag,
} from "react-icons/fa";
import LoadingSpinner from "../Loading/LoadingSpinner";
import { toast } from "../Composant/Toast";
import DetailModal from "../Modals/DetailModal";
import ConfirmModal from "../Modals/ConfirmModal";
import ActionDropdown from "../Composant/ActionDropdown";

const MinistereScreen = () => {
  const [articles, setArticles] = useState([]);
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
  const [articleToEdit, setArticleToEdit] = useState(null);

  const [statsCards, setStatsCards] = useState([
    {
      id: 1,
      title: "Total Services",
      value: "0",
      icon: <FaFileInvoice className="text-white text-xl" />,
      gradient: "from-indigo-500 via-indigo-600 to-violet-600",
      description: "Tous les services d'assiette",
    },
    {
      id: 2,
      title: "Actifs",
      value: "0",
      icon: <FaCheckCircle className="text-white text-xl" />,
      gradient: "from-emerald-500 via-teal-500 to-cyan-600",
      description: "Services actifs",
    },
    {
      id: 3,
      title: "Inactifs",
      value: "0",
      icon: <FaTimesCircle className="text-white text-xl" />,
      gradient: "from-amber-500 via-orange-500 to-orange-600",
      description: "Services inactifs",
    },
  ]);

  const token = GetTokenOrRedirect();
    const [confirmItem, setConfirmItem] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const [detailItem, setDetailItem] = useState(null);


  useEffect(() => {
    if (articles.length > 0) {
      const total = articles.length;
      const actifs = articles.filter((a) => a.statut === 1 || a.statut === true).length;
      const inactifs = total - actifs;
      setStatsCards([
        {
          id: 1,
          title: "Total Services",
          value: total.toString(),
          icon: <FaFileInvoice className="text-white text-xl" />,
          gradient: "from-indigo-500 via-indigo-600 to-violet-600",
          description: "Tous les services d'assiette",
        },
        {
          id: 2,
          title: "Actifs",
          value: actifs.toString(),
          icon: <FaCheckCircle className="text-white text-xl" />,
          gradient: "from-emerald-500 via-teal-500 to-cyan-600",
          description: `${actifs > 0 ? Math.round((actifs / total) * 100) : 0}% actifs`,
        },
        {
          id: 3,
          title: "Inactifs",
          value: inactifs.toString(),
          icon: <FaTimesCircle className="text-white text-xl" />,
          gradient: "from-amber-500 via-orange-500 to-orange-600",
          description: `${inactifs > 0 ? Math.round((inactifs / total) * 100) : 0}% inactifs`,
        },
      ]);
    }
  }, [articles]);

  useEffect(() => {
    if (token) {
      fetchArticles();
    }
  }, [pagination.current_page, pagination.per_page, modeRecherche, token]);

  const fetchArticles = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let res;
      if (modeRecherche && search.trim() !== "") {
        res = await axios.post(
          `${API_BASE_URL}/search-article`,
          { search, page: pagination.current_page, per_page: pagination.per_page },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        res = await axios.get(`${API_BASE_URL}/article?page=${pagination.current_page}&per_page=${pagination.per_page}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setArticles(res.data.data || []);
      setPagination({
        current_page: res.data.current_page || 1,
        last_page: res.data.last_page || 1,
        total: res.data.total || 0,
        per_page: res.data.per_page || 10,
      });
    } catch (err) {
      console.error("Erreur lors du chargement :", err);
      toast.error("Erreur lors du chargement des services d'assiette");
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
    fetchArticles();
  };

  const actualiser = () => {
    setSearch("");
    setModeRecherche(false);
    setPagination({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
    fetchArticles();
  };

  const handleEdit = (article) => {
    setArticleToEdit(article);
    setShowModal(true);
  };

  const handleDelete = (id) => {
        if (!token) { toast.error("Vous n'êtes pas authentifié. Veuillez vous reconnecter."); return; }
        const _item = articles.find((x) => x.id === id);
        if (_item) setConfirmItem(_item); else setConfirmItem({ id });
    };

    const confirmDelete = async () => {
        if (!confirmItem || !token) return;
        setConfirmLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/delete-article/${confirmItem.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Supprimé avec succès");
            setConfirmItem(null);
            fetchArticles();
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
    fetchArticles();
    setArticleToEdit(null);
  };

  const getStatusBadge = (statut) => {
    if (statut === 1 || statut === true) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Actif
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Inactif
      </span>
    );
  };

  const formatDate = (dateString) => {
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


  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Menus />
      <Head />
      <div className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                    <FaFileInvoice className="text-sm" />
                  </span>
                  Gestion des Services d'Assiette
                </h1>
                <p className="mt-1.5 text-sm text-slate-500">Gérez les services d'assiette et articles budgétaires</p>
              </div>
              <nav className="flex items-center gap-1.5 text-sm">
                <a href="/" className="text-slate-500 hover:text-indigo-600 transition">Accueil</a>
                <span className="text-slate-300">/</span>
                <span className="font-medium text-slate-900">Services d'assiette</span>
              </nav>
            </div>
          </div>

          {/* Stats */}
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

          {/* Toolbar */}
          <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-xl">
                <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Rechercher un service d'assiette..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition"
                />
              </div>
              <button
                onClick={handleSearch}
                className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition"
              >
                <FaSearch className="text-xs" /> Rechercher
              </button>
              <button onClick={handleSearch} className="sm:hidden inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <FaSearch />
              </button>
              <button
                onClick={actualiser}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <FaSync className="text-xs" /> <span className="hidden sm:inline">Actualiser</span>
              </button>
            </div>
            <button
              onClick={() => { setArticleToEdit(null); setShowModal(true); }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
            >
              <FaPlus className="text-xs" /> Ajouter un Service
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 py-8">
              <LoadingSpinner message="Chargement des services d'assiette..." variant="table" size="lg" />
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50/80">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">#</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Service d'assiette</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Article budgétaire</th>
                        <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">Statut</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Date de création</th>
                        <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {articles.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-16 text-center">
                            <div className="mx-auto max-w-sm">
                              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                                <FaFileInvoice className="text-2xl text-slate-400" />
                              </div>
                              <h3 className="mt-4 text-sm font-semibold text-slate-900">Aucun service trouvé</h3>
                              <p className="mt-1 text-sm text-slate-500">
                                {modeRecherche ? "Aucun résultat pour votre recherche" : "Commencez par ajouter un service d'assiette"}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        articles.map((article, index) => (
                          <tr key={article.id} className="hover:bg-slate-50/70 transition">
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-500">
                              {(pagination.current_page - 1) * pagination.per_page + index + 1}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                                  <FaFileInvoice className="text-sm" />
                                </span>
                                <span className="text-sm font-semibold text-slate-900">{article.nom}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-sm font-semibold text-slate-700">
                                <FaHashtag className="text-xs text-slate-400" />
                                {article.article_budgetaire}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-center">{getStatusBadge(article.statut)}</td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                                <FaCalendarAlt className="text-xs text-slate-400" />
                                {formatDate(article.created_at)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-center">
                              <ActionDropdown>
                                <button onClick={() => handleEdit(article)} className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><FaEdit className="text-xs" /></span>
                                  Modifier
                                </button>
                                <button onClick={() => handleDelete(article.id, article.nom)} className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><FaTrash className="text-xs" /></span>
                                  Supprimer
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

              {articles.length > 0 && (
                <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200/60 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-500">
                    Affichage de <span className="font-semibold text-slate-900">{(pagination.current_page - 1) * pagination.per_page + 1}</span> à{" "}
                    <span className="font-semibold text-slate-900">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> sur{" "}
                    <span className="font-semibold text-slate-900">{pagination.total}</span> services
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
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <FaChevronRight className="text-xs" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ModalMinistere
        isOpen={showModal}
        onClose={() => { setShowModal(false); setArticleToEdit(null); }}
        articleToEdit={articleToEdit}
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

export default MinistereScreen;
