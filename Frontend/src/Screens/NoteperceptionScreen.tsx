/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useEffect, useState } from "react";
import axios from "axios";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import Table from "../Composant/Table";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { useHistory } from "react-router-dom";
import {
  FaPlus, FaSearch, FaSync, FaFileAlt, FaEdit, FaTrash, FaDownload, FaEye, FaMapMarkerAlt, FaFolder, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import ActionDropdown from "../Composant/ActionDropdown";
import LoadingSpinner from "../Loading/LoadingSpinner";
import FileUploadModal from "../Modals/FileUploadModal";
import { toast } from "../Composant/Toast";
import ConfirmModal from "../Modals/ConfirmModal";

const NoteperceptionScreen = () => {
  const token = GetTokenOrRedirect();
    const [confirmItem, setConfirmItem] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

  const utilisateur = JSON.parse(localStorage.getItem("utilisateur") || "null");
  const role = JSON.parse(localStorage.getItem("role") || "null");
  const navRouter = useHistory();
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 20 });
  const [modeRecherche, setModeRecherche] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedNoteForUpload, setSelectedNoteForUpload] = useState(null);
  const [statsCards, setStatsCards] = useState([
    { id: 1, title: "Total Notes", value: "0", icon: <FaFileAlt size={18} />, color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", description: "Toutes les notes" },
    { id: 2, title: "Notes Actives", value: "0", icon: <FaFileAlt size={18} />, color: "linear-gradient(135deg, #20c997 0%, #17a2b8 100%)", description: "Notes actives" },
    { id: 3, title: "Notes Inactives", value: "0", icon: <FaFileAlt size={18} />, color: "linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)", description: "Notes inactives" },
  ]);
  const handleAddNote = () => navRouter.push("/note/form");
  const handleEditNote = (note) => navRouter.push(`/note/form/${note.id}`);
  const handleViewNote = (note) => navRouter.push(`/note/detail/${note.id}`);
  const handleUploadClick = (note) => { setSelectedNoteForUpload(note); setShowUploadModal(true); };
  useEffect(() => { if (token) fetchNotes(); }, [pagination.current_page, pagination.per_page, modeRecherche, token]);
  const fetchNotes = async () => {
    if (!token) return; setLoading(true);
    try {
      let res; if (modeRecherche && search.trim() !== "") res = await axios.post(`${API_BASE_URL}/notes/search`, { search, page: pagination.current_page, per_page: pagination.per_page }, { headers: { Authorization: `Bearer ${token}` } });
      else res = await axios.get(`${API_BASE_URL}/notes?page=${pagination.current_page}&per_page=${pagination.per_page}`, { headers: { Authorization: `Bearer ${token}` } });
      setNotes(res.data.data); setPagination({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total, per_page: res.data.per_page || 20 });
      const total = res.data.total || res.data.data.length; const actifs = res.data.data.filter((n) => n.statut === true || n.statut === 1).length; const inactifs = total - actifs;
      setStatsCards([
        { id: 1, title: "Total Notes", value: total.toString(), icon: <FaFileAlt size={18} />, color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", description: "Toutes les notes" },
        { id: 2, title: "Notes Actives", value: actifs.toString(), icon: <FaFileAlt size={18} />, color: "linear-gradient(135deg, #20c997 0%, #17a2b8 100%)", description: `${actifs > 0 ? Math.round((actifs / total) * 100) : 0}% actives` },
        { id: 3, title: "Notes Inactives", value: inactifs.toString(), icon: <FaFileAlt size={18} />, color: "linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)", description: `${inactifs > 0 ? Math.round((inactifs / total) * 100) : 0}% inactives` },
      ]);
    } catch (err) { console.error(err); toast.error("Erreur lors du chargement des notes"); } finally { setLoading(false); }
  };
  const handleSearch = () => { setPagination((prev) => ({ ...prev, current_page: 1 })); setModeRecherche(true); };
  const actualiser = () => { setSearch(""); setModeRecherche(false); setPagination({ current_page: 1, last_page: 1, total: 0, per_page: 20 }); };
  const handleDelete = (id) => {
        if (!token) { toast.error("Vous n'êtes pas authentifié. Veuillez vous reconnecter."); return; }
        const _item = notes.find((x) => x.id === id);
        if (_item) setConfirmItem(_item); else setConfirmItem({ id });
    };

    const confirmDelete = async () => {
        if (!confirmItem || !token) return;
        setConfirmLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/notes/${confirmItem.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Désactivé avec succès");
            setConfirmItem(null);
            fetchNotes();
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
  const handlePageChange = (page) => { if (page >= 1 && page <= pagination.last_page) setPagination((prev) => ({ ...prev, current_page: page })); };
  const handlePerPageChange = (e) => { const v = parseInt(e.target.value, 10); setPagination(prev => ({ ...prev, per_page: v, current_page: 1 })); };
  const formatDate = (dateString) => { if (!dateString) return "N/A"; try { return new Date(dateString).toLocaleDateString("fr-FR"); } catch (e) { return dateString; } };
  const columns = [
    { key: "numero_serie", label: "Num. Série", render: (row) => (<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-white">{row.numero_serie || "N/A"}</span>) },
    { key: "date_ordonnancement", label: "Date Ord.", render: (row) => <span className="text-sm text-slate-700">{formatDate(row.date_ordonnancement)}</span> },
    { key: "date_enregistrement", label: "Date Enr.", render: (row) => <span className="text-sm text-slate-700">{formatDate(row.date_enregistrement)}</span> },
    { key: "assujetti", label: "Assujetti", render: (row) => (<span className="text-sm font-medium text-slate-900">{row.assujetti?.nom_raison_sociale || row.nom_assujetti || "N/A"}</span>) },
    { key: "emplacement", label: "Emplacement", render: (row) => { const n = row.emplacement?.nom_emplacement || row.nom_emplacement || "N/A"; return (<span className="inline-flex items-center gap-1.5 text-sm text-slate-700"><span className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center"><FaMapMarkerAlt className="text-slate-400" size={11} /></span>{n}</span>); } },
    { key: "statut", label: "Statut", render: (row) => row.statut ? (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">● Actif</span>) : (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">● Inactif</span>) },
  ];
  const customColumns = [...columns, { key: "actions", label: "Actions", render: (row) => (
    <ActionDropdown>
      <button onClick={() => handleViewNote(row)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium hover:bg-slate-50 transition text-indigo-600">
        <FaEye size={13} /> Voir
      </button>
      <button onClick={() => handleEditNote(row)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium hover:bg-slate-50 transition text-sky-600">
        <FaEdit size={13} /> Modifier
      </button>
      <button onClick={() => handleUploadClick(row)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium hover:bg-slate-50 transition text-slate-600">
        <FaDownload size={13} /> Gérer fichiers
      </button>
      <div className="border-t border-slate-100" />
      <button onClick={() => handleDelete(row.id, row.numero_serie)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium hover:bg-slate-50 transition text-red-600">
        <FaTrash size={13} /> Supprimer
      </button>
    </ActionDropdown>
  ) }];
  return (
    <div className="min-h-screen bg-slate-50"><Menus /><Head />
      <div className="lg:pl-64"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><h1 className="text-[22px] font-bold tracking-tight text-slate-900 flex items-center gap-2.5"><span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20"><FaFileAlt className="text-white" size={16} /></span>Gestion des Notes de Perception</h1><p className="text-sm text-slate-500 mt-1 ml-[46px]">Gérez les notes de perception de votre organisation</p></div>
            <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-500"><a href="/" className="hover:text-indigo-600 transition">Accueil</a><span className="text-slate-300">/</span><span className="text-slate-900 font-semibold">Notes</span></nav>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {statsCards.map((card) => (
              <div key={card.id} className="relative overflow-hidden rounded-2xl shadow-sm border border-slate-200 p-[1px]"><div className="absolute inset-0 opacity-90" style={{ background: card.color }} /><div className="relative rounded-[15px] p-5 flex justify-between items-start h-full" style={{ background: card.color }}><div><p className="text-xs font-semibold tracking-widest text-white/80 uppercase">{card.title}</p><p className="text-3xl font-bold text-white mt-1">{card.value}</p><p className="text-xs font-medium text-white/70 mt-1">{card.description}</p></div><div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white border border-white/20">{card.icon}</div></div></div>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <div className="flex flex-col lg:flex-row gap-3"><div className="flex-1 flex gap-2"><div className="relative flex-1"><FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" placeholder="Rechercher une note (numéro série, assujetti)..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} /></div><button onClick={handleSearch} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition disabled:opacity-50 shrink-0"><FaSearch size={13} /> Rechercher</button><button onClick={actualiser} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 shrink-0"><FaSync size={13} /> Actualiser</button></div><button onClick={handleAddNote} disabled={loading} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow hover:bg-black transition disabled:opacity-50 lg:w-auto w-full"><FaPlus size={13} /> Nouvelle Note</button></div>
          </div>
          {loading ? (<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8"><LoadingSpinner message="Chargement des notes..." /></div>) : notes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center"><div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4"><FaFolder className="text-slate-300" size={32} /></div><h3 className="text-base font-semibold text-slate-900">Aucune note trouvée</h3><p className="text-sm text-slate-500 mt-1">{search ? `Aucun résultat pour "${search}"` : "Commencez par ajouter une nouvelle note"}</p>{!search && (<button onClick={handleAddNote} className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 transition"><FaPlus size={12} /> Ajouter une note</button>)}</div>
          ) : (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900">Liste des Notes de Perception</h3><span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white">{pagination.total} note{pagination.total > 1 ? "s" : ""}</span></div><div className="overflow-x-auto"><div className="min-w-[760px]"><div className="[&_table]:w-full [&_thead]:bg-slate-50 [&_thead_th]:px-4 [&_thead_th]:py-3 [&_thead_th]:text-left [&_thead_th]:text-xs [&_thead_th]:font-bold [&_thead_th]:tracking-widest [&_thead_th]:text-slate-500 [&_thead_th]:uppercase [&_thead_th]:border-b [&_thead_th]:border-slate-200 [&_tbody_td]:px-4 [&_tbody_td]:py-3.5 [&_tbody_tr]:border-b [&_tbody_tr]:border-slate-100 [&_tbody_tr:hover]:bg-slate-50/60 [&_tbody_tr:last-child]:border-0"><Table columns={customColumns} data={notes} startIndex={(pagination.current_page - 1) * pagination.per_page} /></div></div></div></div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4"><div className="flex items-center gap-3"><p className="text-sm text-slate-600">Affichage <span className="font-semibold text-slate-900">{(pagination.current_page - 1) * pagination.per_page + 1}</span> à <span className="font-semibold text-slate-900">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> sur <span className="font-semibold text-slate-900">{pagination.total}</span> notes</p><select value={pagination.per_page} onChange={handlePerPageChange} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition"><option value={10}>10 / page</option><option value={20}>20 / page</option><option value={50}>50 / page</option><option value={100}>100 / page</option></select></div><div className="flex items-center gap-1.5"><button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"><FaChevronLeft size={11} /> Précédent</button>{(() => { const pages: any[] = []; const totalPages = pagination.last_page; const current = pagination.current_page; pages.push(<button key={1} onClick={() => handlePageChange(1)} className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${current === 1 ? "bg-indigo-600 text-white shadow" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>1</button>); if (current > 3) pages.push(<span key="e1" className="px-1 text-slate-400">…</span>); for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) pages.push(<button key={i} onClick={() => handlePageChange(i)} className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${current === i ? "bg-indigo-600 text-white shadow" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>{i}</button>); if (current < totalPages - 2) pages.push(<span key="e2" className="px-1 text-slate-400">…</span>); if (totalPages > 1) pages.push(<button key={totalPages} onClick={() => handlePageChange(totalPages)} className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${current === totalPages ? "bg-indigo-600 text-white shadow" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>{totalPages}</button>); return pages; })()}<button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">Suivant <FaChevronRight size={11} /></button></div></div>
            </>
          )}
        </div>
      </div>
      {showUploadModal && selectedNoteForUpload && (<FileUploadModal documentId={selectedNoteForUpload.id} id_classeur={selectedNoteForUpload.id_classeur || selectedNoteForUpload.classeur?.id} onClose={() => setShowUploadModal(false)} token={token} nom_fichier={selectedNoteForUpload.assujetti?.nom_raison_sociale || selectedNoteForUpload.nom_assujetti || "note de perception"} uploadType="note" id_ministere={selectedNoteForUpload.id_ministere} />)}
                
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
export default NoteperceptionScreen;
