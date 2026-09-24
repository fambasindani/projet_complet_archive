/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useEffect, useState } from "react";
import axios from "axios";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { useHistory } from "react-router-dom";
import AdvancedSearchNoteModal from "../Modals/AdvancedSearchNoteModal";
import {
  FaFolder,
  FaSearch,
  FaSync,
  FaArrowRight,
  FaBuilding,
  FaUser,
  FaCalendarAlt,
  FaEye,
  FaSpinner,
  FaClock,
  FaCheckCircle,
  FaArchive,
  FaChartLine,
  FaLayerGroup,
  FaTags,
  FaFilter,
  FaTimes,
  FaFileInvoice,
  FaChartPie,
  FaUsers,
  FaMapMarkerAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaMoneyBillWave,
  FaPercentage,
  FaBoxes,
  FaRegBuilding,
  FaRegFileAlt,
  FaChevronUp,
  FaChevronDown,
  FaMicroscope,
} from "react-icons/fa";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "../Loading/LoadingSpinner";
import { toast } from "../Composant/Toast";

const Tableaudebordnote = () => {
  const navRouter = useHistory();
  const token = GetTokenOrRedirect();

  // 🔹 État utilisateur
  const utilisateur = JSON.parse(localStorage.getItem("utilisateur")) || {};
  const nom = utilisateur?.nom || "";
  const prenom = utilisateur?.prenom || "";
  const role = utilisateur?.role || "";

  // 🔹 État pour le modal de recherche avancée
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // 🔹 États principaux
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [centres, setCentres] = useState([]);
  const [articles, setArticles] = useState([]);
  const [assujettis, setAssujettis] = useState([]);
  const [classeurs, setClasseurs] = useState([]);
  const [stats, setStats] = useState({
    total_notes: 0,
    total_centres: 0,
    total_articles: 0,
    total_assujettis: 0,
    total_emplacements: 0,
    notes_actives: 0,
    notes_archivees: 0,
    notes_aujourdhui: 0,
    notes_semaine: 0,
    notes_mois: 0,
    notes_annee: 0,
    top_centres: [],
    top_articles: [],
    top_assujettis: [],
    par_classeur: [],
  });

  // 🔹 État pour cacher/afficher la section Top Rankings
  const [showTopRankings, setShowTopRankings] = useState(false);

  // 🔹 Filtres avancés
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticle, setSelectedArticle] = useState("");
  const [selectedAssujetti, setSelectedAssujetti] = useState("");
  const [selectedClasseur, setSelectedClasseur] = useState("");
  const [selectedPeriode, setSelectedPeriode] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // 🔹 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0,
  });

  const itemsPerPage = 12;

  // 🔹 Chargement initial
  useEffect(() => {
    if (token) {
      fetchAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // 🔹 Mise à jour quand la page change
  useEffect(() => {
    if (token && !loading) {
      fetchCentres();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // 🔹 Obtenir les en-têtes d'authentification
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  });

  // 🔹 Charger TOUTES les données en parallèle
  const fetchAllData = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      await Promise.all([fetchStatistics(), fetchCentres(), fetchArticles(), fetchAssujettis(), fetchClasseurs()]);
    } catch (error) {
      console.error("Erreur chargement données:", error);
      toast.error("Impossible de charger les données");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🔹 Statistiques
  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboards/notes/statistics`, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Erreur statistiques:", error);
    }
  };

  // 🔹 Centres avec pagination
  const fetchCentres = async () => {
    try {
      const params: any = {
        page: currentPage,
        per_page: itemsPerPage,
      };
      if (searchTerm) params.search = searchTerm;
      if (selectedArticle) params.numero_article = selectedArticle;
      if (selectedAssujetti) params.id_assujetti = selectedAssujetti;
      if (selectedClasseur) params.id_classeur = selectedClasseur;
      if (selectedPeriode !== "all") params.periode = selectedPeriode;

      const response = await axios.get(`${API_BASE_URL}/dashboards/notes/centres`, {
        headers: getAuthHeaders(),
        params,
      });
      if (response.data.success) {
        setCentres(response.data.data.data || []);
        setPagination({
          current_page: response.data.data.current_page || 1,
          last_page: response.data.data.last_page || 1,
          per_page: response.data.data.per_page || 12,
          total: response.data.data.total || 0,
        });
      }
    } catch (error) {
      console.error("Erreur centres:", error);
    }
  };

  // 🔹 Articles
  const fetchArticles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboards/notes/articles`, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) {
        setArticles(response.data.data);
      }
    } catch (error) {
      console.error("Erreur articles:", error);
    }
  };

  // 🔹 Assujettis
  const fetchAssujettis = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboards/notes/assujettis`, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) {
        setAssujettis(response.data.data);
      }
    } catch (error) {
      console.error("Erreur assujettis:", error);
    }
  };

  // 🔹 Classeurs
  const fetchClasseurs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboards/notes/classeurs`, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) {
        setClasseurs(response.data.data);
      }
    } catch (error) {
      console.error("Erreur classeurs:", error);
    }
  };

  // 🔹 Recherche avancée
  const handleSearch = async () => {
    if (!searchTerm && !selectedArticle && !selectedAssujetti && !selectedClasseur && selectedPeriode === "all") {
      toast.info("Veuillez remplir au moins un critère de recherche");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/dashboards/notes/search`,
        {
          nom_centre: searchTerm,
          numero_article: selectedArticle,
          id_assujetti: selectedAssujetti,
          id_classeur: selectedClasseur,
          periode: selectedPeriode,
        },
        { headers: getAuthHeaders() }
      );
      if (response.data.success) {
        setCentres(response.data.data.centres || []);
        setPagination(response.data.data.pagination);
        toast.success(`${response.data.data.centres.length} centre(s) trouvé(s)`);
      }
    } catch (error) {
      console.error("Erreur recherche:", error);
      toast.error("Impossible de charger les résultats");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Réinitialisation
  const handleReset = () => {
    setSearchTerm("");
    setSelectedArticle("");
    setSelectedAssujetti("");
    setSelectedClasseur("");
    setSelectedPeriode("all");
    setCurrentPage(1);
    fetchAllData();
  };

  // 🔹 Navigation vers liste des notes
  const handleListeNotes = (centre: any) => {
    navRouter.push({
      pathname: `/listenote/${centre.id}`,
      state: {
        centre,
        id_article: selectedArticle,
        id_assujetti: selectedAssujetti,
        id_classeur: selectedClasseur,
        periode: selectedPeriode,
        searchTerm,
      },
    });
  };

  // 🔹 Formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: fr });
    } catch {
      return "N/A";
    }
  };

  // 🔹 Temps relatif
  const timeAgo = (dateString: string) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return "";
    }
  };

  // 🔹 Cartes statistiques premium
  const QuickStats = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-1">Total Notes</p>
            <p className="text-3xl font-bold text-slate-900 leading-none">{stats.total_notes}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              <FaCheckCircle size={10} /> {stats.notes_actives} actives
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <FaFileInvoice className="text-indigo-600" size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-1">Centres</p>
            <p className="text-3xl font-bold text-slate-900 leading-none">{stats.total_centres}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-sky-600 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-full">
              <FaBuilding size={10} /> {centres.length} affichés
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
            <FaBuilding className="text-sky-600" size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-1">Ce Mois</p>
            <p className="text-3xl font-bold text-slate-900 leading-none">{stats.notes_mois}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
              <FaCalendarAlt size={10} /> +{stats.notes_semaine} cette semaine
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <FaCalendarAlt className="text-amber-600" size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-1">Articles</p>
            <p className="text-3xl font-bold text-slate-900 leading-none">{stats.total_articles}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              <FaTags size={10} /> Budgétaires
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <FaTags className="text-emerald-600" size={20} />
          </div>
        </div>
      </div>
    </div>
  );

  const rankBadgeStyles = (index: number) => {
    if (index === 0) return "bg-amber-100 text-amber-700 border-amber-200";
    if (index === 1) return "bg-slate-100 text-slate-700 border-slate-200";
    if (index === 2) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  const TopCentres = () => {
    if (!stats.top_centres || stats.top_centres.length === 0) return null;
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <FaChartLine className="text-indigo-600" size={14} />
          </span>
          <h6 className="font-semibold text-slate-900">Top 5 Centres</h6>
        </div>
        <div className="p-5 space-y-3">
          {stats.top_centres.map((centre: any, index: number) => (
            <div key={centre.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${rankBadgeStyles(index)}`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900 truncate">{centre.nom}</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shrink-0">
                    {centre.total}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <FaClock size={10} /> {timeAgo(centre.dernier_ajout)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const TopArticles = () => {
    if (!stats.top_articles || stats.top_articles.length === 0) return null;
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <FaTags className="text-emerald-600" size={14} />
          </span>
          <h6 className="font-semibold text-slate-900">Top 5 Articles</h6>
        </div>
        <div className="p-5 space-y-3">
          {stats.top_articles.map((article: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${rankBadgeStyles(index)}`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 leading-none">{article.code}</p>
                  <p className="text-xs text-slate-500 truncate">{article.nom}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shrink-0">
                  {article.total}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const TopAssujettis = () => {
    if (!stats.top_assujettis || stats.top_assujettis.length === 0) return null;
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center">
            <FaUsers className="text-sky-600" size={14} />
          </span>
          <h6 className="font-semibold text-slate-900">Top 5 Assujettis</h6>
        </div>
        <div className="p-5 space-y-3">
          {stats.top_assujettis.map((assujetti: any, index: number) => (
            <div key={assujetti.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${rankBadgeStyles(index)}`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 leading-none truncate">{assujetti.nom}</p>
                  <p className="text-xs text-slate-500">NIF: {assujetti.nif}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-sky-600 text-white shrink-0">
                  {assujetti.total}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    const totalPages = pagination.last_page;
    if (totalPages <= 1) return null;
    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);

    return (
      <nav className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Précédent
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              className="w-9 h-9 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              1
            </button>
            {startPage > 2 && <span className="px-1 text-slate-400">…</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`w-9 h-9 rounded-lg border text-sm font-semibold transition ${
              currentPage === page
                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
            <button
              onClick={() => setCurrentPage(totalPages)}
              className="w-9 h-9 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Suivant
        </button>
      </nav>
    );
  };

  const maxTotal = Math.max(...centres.map((c: any) => c.total || 0), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Menus />
      <Head />
      <div className="lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* HEADER PREMIUM */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                  <FaFileInvoice className="text-white" size={22} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notes de Perception</h1>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                      <span className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <FaUser size={11} className="text-slate-500" />
                      </span>
                      {prenom} {nom}
                    </span>
                    {role && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white">
                        {role}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-50"
                >
                  <FaSync className={refreshing ? "animate-spin" : ""} size={14} />
                  Actualiser
                </button>
                <button
                  onClick={() => setShowAdvancedSearch(true)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-200 transition disabled:opacity-50"
                >
                  <FaMicroscope size={14} />
                  Recherche OCR
                </button>
              </div>
            </div>
          </div>

          {/* STATISTIQUES */}
          <QuickStats />

          {/* TOP RANKINGS */}
          <div className="mb-6">
            <button
              onClick={() => setShowTopRankings(!showTopRankings)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition text-left group"
              style={{ borderLeftWidth: "4px", borderLeftColor: "#4f46e5" }}
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <FaChartLine className="text-indigo-600" size={14} />
                </span>
                <span className="font-semibold text-slate-900">Top Rankings</span>
                <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Centres · Articles · Assujettis
                </span>
              </div>
              <span className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-white transition">
                {showTopRankings ? <FaChevronUp className="text-slate-500" size={12} /> : <FaChevronDown className="text-slate-500" size={12} />}
              </span>
            </button>
            {showTopRankings && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                <TopCentres />
                <TopArticles />
                <TopAssujettis />
              </div>
            )}
          </div>

          {/* FILTRES */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-slate-100" style={{ borderLeftWidth: "4px", borderLeftColor: "#4f46e5" }}>
              <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition">
                <FaFilter size={13} />
                {showFilters ? "Masquer les filtres" : "Afficher les filtres avancés"}
              </button>
              {(searchTerm || selectedArticle || selectedAssujetti || selectedClasseur || selectedPeriode !== "all") && (
                <button onClick={handleReset} className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-full transition">
                  <FaTimes size={10} /> Effacer tous les filtres
                </button>
              )}
            </div>

            {showFilters && (
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-3">
                    <label className="block text-xs font-semibold tracking-wide uppercase text-slate-500 mb-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <FaSearch size={11} /> Centre
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nom du centre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      disabled={loading}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <label className="block text-xs font-semibold tracking-wide uppercase text-slate-500 mb-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <FaTags size={11} /> Article budgétaire
                      </span>
                    </label>
                    <select
                      value={selectedArticle}
                      onChange={(e) => setSelectedArticle(e.target.value)}
                      disabled={loading}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
                    >
                      <option value="">Tous les articles</option>
                      {articles.map((article: any) => (
                        <option key={article.id} value={article.code}>
                          {article.code} - {article.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-3">
                    <label className="block text-xs font-semibold tracking-wide uppercase text-slate-500 mb-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <FaUsers size={11} /> Assujetti
                      </span>
                    </label>
                    <select
                      value={selectedAssujetti}
                      onChange={(e) => setSelectedAssujetti(e.target.value)}
                      disabled={loading}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
                    >
                      <option value="">Tous les assujettis</option>
                      {assujettis.map((assujetti: any) => (
                        <option key={assujetti.id} value={assujetti.id}>
                          {assujetti.nom} ({assujetti.numero_nif})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-3">
                    <label className="block text-xs font-semibold tracking-wide uppercase text-slate-500 mb-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <FaFolder size={11} /> Classeur
                      </span>
                    </label>
                    <select
                      value={selectedClasseur}
                      onChange={(e) => setSelectedClasseur(e.target.value)}
                      disabled={loading}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
                    >
                      <option value="">Tous les classeurs</option>
                      {classeurs.map((classeur: any) => (
                        <option key={classeur.id} value={classeur.id}>
                          {classeur.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-3">
                    <label className="block text-xs font-semibold tracking-wide uppercase text-slate-500 mb-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <FaCalendarAlt size={11} /> Période
                      </span>
                    </label>
                    <select
                      value={selectedPeriode}
                      onChange={(e) => setSelectedPeriode(e.target.value)}
                      disabled={loading}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
                    >
                      <option value="all">Toutes</option>
                      <option value="today">Aujourd'hui</option>
                      <option value="week">Cette semaine</option>
                      <option value="month">Ce mois</option>
                      <option value="year">Cette année</option>
                    </select>
                  </div>

                  <div className="lg:col-span-9 flex items-end">
                    <button
                      onClick={handleSearch}
                      disabled={loading}
                      className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-200 transition disabled:opacity-50"
                    >
                      {loading ? <FaSpinner className="animate-spin" size={14} /> : <FaSearch size={14} />}
                      Rechercher
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LISTE DES CENTRES */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <h5 className="text-base font-bold text-slate-900 inline-flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <FaBuilding className="text-white" size={13} />
                  </span>
                  Centres d'ordonnancement
                </h5>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white">
                  {pagination.total} résultat(s)
                </span>
              </div>
              {!loading && pagination.total > 0 && (
                <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full">
                  Page {pagination.current_page} sur {pagination.last_page}
                </span>
              )}
            </div>

            {loading ? (
              <LoadingSpinner message="Chargement des centres..." />
            ) : centres.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                  <FaBuilding className="text-slate-400" size={32} />
                </div>
                <h5 className="text-slate-900 font-semibold mb-1">Aucun centre trouvé</h5>
                <p className="text-sm text-slate-500 mb-5 max-w-md mx-auto">
                  Aucun centre d'ordonnancement ne correspond à vos critères de recherche.
                </p>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition"
                >
                  <FaSync size={12} /> Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {centres.map((centre: any) => (
                    <div
                      key={centre.id}
                      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden"
                    >
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                            <FaBuilding className="text-indigo-600" size={20} />
                          </div>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white">
                            {centre.total || 0} note{(centre.total || 0) > 1 ? "s" : ""}
                          </span>
                        </div>

                        <h6 className="font-semibold text-slate-900 leading-tight line-clamp-2 min-h-[2.6rem] mb-1">{centre.nom}</h6>

                        {centre.description && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{centre.description}</p>}

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                            <FaCalendarAlt size={10} className="text-slate-400" /> Créé le {formatDate(centre.created_at)}
                          </span>
                          {centre.derniere_note && (
                            <span
                              title={timeAgo(centre.derniere_note)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full"
                            >
                              <FaClock size={10} className="text-slate-400" /> Dernière note {timeAgo(centre.derniere_note)}
                            </span>
                          )}
                        </div>

                        {centre.repartition_articles && centre.repartition_articles.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Articles</p>
                            <div className="flex flex-wrap gap-1.5">
                              {centre.repartition_articles.map((item: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700"
                                >
                                  {item.code || "N/A"} ({item.total})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-auto">
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all"
                              style={{ width: `${((centre.total || 0) / maxTotal) * 100}%` }}
                            />
                          </div>

                          <button
                            onClick={() => handleListeNotes(centre)}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 text-indigo-700 text-sm font-semibold transition"
                          >
                            <FaEye size={13} /> Voir les notes <FaArrowRight size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!loading && pagination.last_page > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3">
                    <p className="text-xs font-medium text-slate-500">
                      Affichage {(pagination.current_page - 1) * pagination.per_page + 1} à{" "}
                      {Math.min(pagination.current_page * pagination.per_page, pagination.total)} sur {pagination.total} centres
                    </p>
                    {renderPagination()}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <AdvancedSearchNoteModal isOpen={showAdvancedSearch} onClose={() => setShowAdvancedSearch(false)} token={token} />
                
</div>
  );
};

export default Tableaudebordnote;
