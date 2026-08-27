/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useEffect, useState } from "react";
import axios from "axios";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { useHistory } from "react-router-dom";
import AdvancedSearchModal from "../Modals/AdvancedSearchModal";
import {
  FaFolder,
  FaFileAlt,
  FaSearch,
  FaSync,
  FaArrowRight,
  FaBuilding,
  FaUser,
  FaCalendarAlt,
  FaEye,
  FaSpinner,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaClock,
  FaCheckCircle,
  FaLayerGroup,
  FaFilter,
  FaTimes,
  FaChevronUp,
  FaChevronDown,
  FaMicroscope,
} from "react-icons/fa";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "../Loading/LoadingSpinner";
import { toast } from "../Composant/Toast";

const DashboardScreen = () => {
  const navRouter = useHistory();
  const token = GetTokenOrRedirect();
  const utilisateur = JSON.parse(localStorage.getItem("utilisateur")) || {};
  const nom = utilisateur?.nom || "";
  const prenom = utilisateur?.prenom || "";
  const role = utilisateur?.role || "";
  const departements = JSON.parse(localStorage.getItem("departements")) || [];
  const [selectedUserDirection, setSelectedUserDirection] = useState(departements.length > 0 ? departements[0].id : "");
  const userDirection = departements.find((d) => d.id === parseInt(selectedUserDirection)) || null;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classificateurs, setClassificateurs] = useState([]);
  const [directions, setDirections] = useState([]);
  const [stats, setStats] = useState({
    total_documents: 0, total_classificateurs: 0, total_directions: 0, documents_actifs: 0, documents_archives: 0, documents_aujourdhui: 0, documents_semaine: 0, documents_mois: 0, top_classificateurs: [], top_directions: [],
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDirection, setSelectedDirection] = useState("");
  const [selectedPeriode, setSelectedPeriode] = useState("all");
  const [selectedStatut, setSelectedStatut] = useState("tous");
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 12, total: 0 });
  const itemsPerPage = 12;

  useEffect(() => { fetchAllData(currentPage); }, [currentPage, selectedUserDirection]);
  const getAuthHeaders = () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" });
  const fetchAllData = async (page = currentPage) => {
    setLoading(true); setRefreshing(true);
    try { await Promise.all([fetchStatistics(), fetchClassifiers(page), fetchDirections()]); }
    catch (error) { console.error(error); toast.error("Impossible de charger les données"); }
    finally { setLoading(false); setRefreshing(false); }
  };
  const fetchStatistics = async () => { try { const r = await axios.get(`${API_BASE_URL}/dashboard/statistics`, { headers: getAuthHeaders() }); if (r.data.success) setStats(r.data.data); } catch (e) { console.error(e); } };
  const fetchClassifiers = async (page = currentPage) => {
    try {
      const params: any = { page, per_page: itemsPerPage };
      if (searchTerm) params.search = searchTerm;
      if (selectedDirection) params.id_direction = selectedDirection;
      if (selectedPeriode !== "all") params.periode = selectedPeriode;
      const r = await axios.get(`${API_BASE_URL}/dashboard/classifiers`, { headers: getAuthHeaders(), params });
      if (r.data.success) { const d = r.data.data; setClassificateurs(d.data || []); setPagination({ current_page: d.current_page || 1, last_page: d.last_page || 1, per_page: d.per_page || 12, total: d.total || 0 }); return d.data || []; }
    } catch (e) { console.error(e); } return [];
  };
  const fetchDirections = async () => { try { const r = await axios.get(`${API_BASE_URL}/departements`, { headers: getAuthHeaders() }); setDirections(r.data.data.data); } catch (e) { console.error(e); } };
  const handleSearch = async () => {
    if (!searchTerm && !selectedDirection && selectedPeriode === "all" && selectedStatut === "tous") { toast.info("Veuillez remplir au moins un critère de recherche"); return; }
    setCurrentPage(1); setLoading(true); const results = await fetchClassifiers(1); setLoading(false);
    if (results.length > 0) toast.success(`${results.length} résultat(s) trouvé(s)`);
    else toast.info("Aucun classificateur ne correspond à vos critères.");
  };
  const handleReset = () => { setSearchTerm(""); setSelectedDirection(""); setSelectedPeriode("all"); setSelectedStatut("tous"); setCurrentPage(1); fetchAllData(1); };
  const handleListeDocument = (classifier) => {
    let directionAEnvoyer = selectedDirection; let nomDirectionAEnvoyer = ""; let directionInfo = null;
    if (!directionAEnvoyer) { directionAEnvoyer = selectedUserDirection; directionInfo = userDirection; nomDirectionAEnvoyer = directionInfo ? `${directionInfo.sigle || ""} ${directionInfo.nom}`.trim() : ""; }
    else { directionInfo = directions.find((d) => d.id === parseInt(selectedDirection)); nomDirectionAEnvoyer = directionInfo ? `${directionInfo.sigle || ""} ${directionInfo.nom}`.trim() : ""; }
    navRouter.push({ pathname: `/listedocument/${classifier.id}`, state: { classifier, direction: directionAEnvoyer, nomDirection: nomDirectionAEnvoyer, directionInfo, periode: selectedPeriode, searchTerm } });
  };
  const getFileIcon = (nom) => {
    const t = nom?.toLowerCase() || "";
    if (t.includes("pdf")) return <FaFilePdf className="text-red-500" size={22} />;
    if (t.includes("word") || t.includes("doc")) return <FaFileWord className="text-blue-600" size={22} />;
    if (t.includes("excel") || t.includes("xls")) return <FaFileExcel className="text-emerald-500" size={22} />;
    if (t.includes("image") || t.includes("jpg") || t.includes("png")) return <FaFileImage className="text-sky-500" size={22} />;
    return <FaFolder className="text-indigo-500" size={22} />;
  };
  const formatDate = (dateString) => { if (!dateString) return "N/A"; try { return format(new Date(dateString), "dd MMM yyyy", { locale: fr }); } catch { return "N/A"; } };
  const timeAgo = (dateString) => { if (!dateString) return ""; try { return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr }); } catch { return ""; } };
  const maxDocs = Math.max(...classificateurs.map((c) => c.total || 0), 1);
  const renderPagination = () => {
    const totalPages = pagination.last_page; if (totalPages <= 1) return null;
    const pages: number[] = []; const maxVisible = 5; let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2)); let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3.5 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">Précédent</button>
        {startPage > 1 && (<><button onClick={() => setCurrentPage(1)} className="w-9 h-9 rounded-xl text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 transition">1</button>{startPage > 2 && <span className="px-1 text-slate-400">…</span>}</>)}
        {pages.map((page) => (<button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${currentPage === page ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>{page}</button>))}
        {endPage < totalPages && (<>{endPage < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}<button onClick={() => setCurrentPage(totalPages)} className="w-9 h-9 rounded-xl text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 transition">{totalPages}</button></>)}
        <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3.5 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">Suivant</button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Menus /><Head />
      <div className="lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20"><FaLayerGroup className="text-white" size={24} /></div>
                <div>
                  <h1 className="text-[22px] font-bold tracking-tight text-slate-900 leading-none">Gestion Documentaire</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600"><FaUser className="text-slate-400" size={12} /> {prenom} {nom}</span>
                    {role && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white">{role}</span>}
                    {departements.length > 0 && (
                      <div className="flex items-center gap-1.5 ml-1"><FaBuilding className="text-slate-400" size={12} />
                        <select value={selectedUserDirection} onChange={(e) => setSelectedUserDirection(e.target.value)} className="text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                          {departements.map((d) => (<option key={d.id} value={d.id}>{d.sigle} - {d.nom}</option>))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleReset} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"><FaSync className={`${refreshing ? "animate-spin" : ""}`} size={14} /> Actualiser</button>
                <button onClick={() => setShowAdvancedSearch(true)} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition disabled:opacity-50"><FaMicroscope size={14} /> Recherche OCR</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition"><div className="flex justify-between items-start"><div><p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Total Documents</p><p className="text-3xl font-bold text-slate-900 mt-1">{stats.total_documents}</p><p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1"><FaCheckCircle size={11} /> {stats.documents_actifs} actifs</p></div><div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center"><FaFileAlt className="text-indigo-600" size={20} /></div></div><div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 rounded-full" style={{ width: "78%" }} /></div></div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition"><div className="flex justify-between items-start"><div><p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Classificateurs</p><p className="text-3xl font-bold text-slate-900 mt-1">{stats.total_classificateurs}</p><p className="text-xs font-medium text-sky-600 mt-1 flex items-center gap-1"><FaFolder size={11} /> {classificateurs.length} affichés</p></div><div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center"><FaFolder className="text-sky-600" size={20} /></div></div><div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-sky-500 rounded-full" style={{ width: "62%" }} /></div></div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition"><div className="flex justify-between items-start"><div><p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Ce Mois</p><p className="text-3xl font-bold text-slate-900 mt-1">{stats.documents_mois}</p><p className="text-xs font-medium text-amber-600 mt-1 flex items-center gap-1"><FaCalendarAlt size={11} /> +{stats.documents_semaine} cette semaine</p></div><div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center"><FaCalendarAlt className="text-amber-500" size={20} /></div></div><div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: "45%" }} /></div></div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition"><div className="flex justify-between items-start"><div><p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Aujourd'hui</p><p className="text-3xl font-bold text-slate-900 mt-1">{stats.documents_aujourdhui}</p><p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1"><FaClock size={11} /> Nouveaux documents</p></div><div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center"><FaClock className="text-emerald-600" size={20} /></div></div><div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: "30%" }} /></div></div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition text-left">
              <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center"><FaFilter className="text-white" size={14} /></div><h3 className="font-semibold text-slate-900">Filtres de recherche</h3>{(searchTerm || selectedDirection || selectedPeriode !== "all" || selectedStatut !== "tous") && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Filtres actifs</span>}</div>
              <div className="flex items-center gap-2">{(searchTerm || selectedDirection || selectedPeriode !== "all" || selectedStatut !== "tous") && <span onClick={(e) => { e.stopPropagation(); handleReset(); }} className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1 rounded-full hover:bg-red-50 transition"><FaTimes size={11} /> Effacer tout</span>}<span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">{showFilters ? <FaChevronUp className="text-slate-500" size={12} /> : <FaChevronDown className="text-slate-500" size={12} />}</span></div>
            </button>
            {showFilters && (
              <div className="px-5 pb-5 border-t border-slate-100 pt-5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3"><label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1"><FaSearch size={11} className="text-slate-400" /> Nom du classeur</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" placeholder="Nom du classeur..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={loading} /></div>
                  <div className="md:col-span-3"><label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1"><FaBuilding size={11} className="text-slate-400" /> Direction</label><select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={selectedDirection} onChange={(e) => setSelectedDirection(e.target.value)} disabled={loading}><option value="">Toutes les directions</option>{directions.map((d) => (<option key={d.id} value={d.id}>{d.sigle} - {d.nom}</option>))}</select>{selectedDirection && <p className="text-xs font-medium text-emerald-600 mt-1.5">✅ {directions.find((d) => d.id === parseInt(selectedDirection))?.nom}</p>}</div>
                  <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1"><FaCalendarAlt size={11} className="text-slate-400" /> Période</label><select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={selectedPeriode} onChange={(e) => setSelectedPeriode(e.target.value)} disabled={loading}><option value="all">Toutes</option><option value="today">Aujourd'hui</option><option value="week">Cette semaine</option><option value="month">Ce mois</option><option value="year">Cette année</option></select></div>
                  <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1"><FaFileAlt size={11} className="text-slate-400" /> Statut</label><select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={selectedStatut} onChange={(e) => setSelectedStatut(e.target.value)} disabled={loading}><option value="tous">Tous</option><option value="actif">Actif</option><option value="archivé">Archivé</option></select></div>
                  <div className="md:col-span-2 flex items-end"><button onClick={handleSearch} disabled={loading} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition disabled:opacity-50">{loading ? <FaSpinner className="animate-spin" size={14} /> : <FaSearch size={14} />} Chercher</button></div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3"><h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><span className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center"><FaFolder className="text-white" size={13} /></span> Classificateurs</h2><span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow">{pagination.total} résultat(s)</span></div>
              {!loading && pagination.total > 0 && (<span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full">Page {pagination.current_page} sur {pagination.last_page} • {pagination.total} classeurs</span>)}
            </div>
            {loading ? (<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8"><LoadingSpinner message="Chargement des classificateurs..." /></div>) : classificateurs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center"><div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4"><FaFolder className="text-slate-300" size={32} /></div><h3 className="text-base font-semibold text-slate-900">Aucun classificateur trouvé</h3><p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">Aucun classificateur ne correspond à vos critères de recherche. Essayez de modifier vos filtres.</p><button onClick={handleReset} className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 transition"><FaSync size={12} /> Réinitialiser les filtres</button></div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {classificateurs.map((classifier) => (
                    <div key={classifier.id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 to-violet-600" />
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-3"><div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition">{getFileIcon(classifier.nom_classeur)}</div><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">{classifier.total || 0} doc{(classifier.total || 0) > 1 ? "s" : ""}</span></div>
                        <h3 className="text-[15px] font-bold text-slate-900 leading-tight line-clamp-2 min-h-[44px]" title={classifier.nom_classeur}>{classifier.nom_classeur}</h3>
                        <div className="flex flex-wrap gap-1.5 mt-3"><span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200"><FaCalendarAlt size={10} className="text-slate-400" /> {formatDate(classifier.created_at)}</span>{classifier.dernier_document && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200" title={timeAgo(classifier.dernier_document)}><FaClock size={10} className="text-slate-400" /> {timeAgo(classifier.dernier_document)}</span>}</div>
                        <div className="mt-4"><div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1.5"><span>Volume</span><span className="font-bold text-slate-700">{classifier.total || 0}</span></div><div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all duration-500" style={{ width: `${((classifier.total || 0) / maxDocs) * 100}%` }} /></div></div>
                        <button onClick={() => handleListeDocument(classifier)} className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition"><FaEye size={13} /> Voir les documents <FaArrowRight size={11} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {pagination.last_page > 1 && (<div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4"><p className="text-sm text-slate-600">Affichage <span className="font-semibold text-slate-900">{(pagination.current_page - 1) * pagination.per_page + 1}</span> à <span className="font-semibold text-slate-900">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> sur <span className="font-semibold text-slate-900">{pagination.total}</span> classeurs</p>{renderPagination()}</div>)}
              </>
            )}
          </div>
        </div>
      </div>
      <AdvancedSearchModal isOpen={showAdvancedSearch} onClose={() => setShowAdvancedSearch(false)} token={token} selectedUserDirection={selectedUserDirection} userDirection={userDirection} allDirections={directions} />
                
</div>
  );
};
export default DashboardScreen;
