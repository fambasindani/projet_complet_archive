/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaFilter,
  FaUser,
  FaUserCheck,
  FaUserTimes,
  FaUserLock,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
  FaTimes,
  FaSpinner,
  FaExclamationCircle,
  FaCheck,
  FaCircle,
  FaLock,
  FaEnvelope,
  FaShieldAlt,
  FaUsers
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { API_BASE_URL } from '../config';
import Head from '../Composant/Head';
import Menus from '../Composant/Menus';
import { toast } from "../Composant/Toast";
import ConfirmModal from "../Modals/ConfirmModal";
import LoadingSpinner from "../Loading/LoadingSpinner";

const UserScreen = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    statut: 'active',
    role_ids: []
  });

  const token = GetTokenOrRedirect();
    const [confirmItem, setConfirmItem] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);


  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchRoles();
    }
  }, [token, currentPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/mon-utilisateurs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          per_page: pagination.per_page,
          search: search || undefined
        }
      });
      if (response.data && response.data.success) {
        const apiData = response.data.data;
        setUsers(apiData.data || []);
        setPagination({
          current_page: apiData.current_page || 1,
          last_page: apiData.last_page || 1,
          per_page: apiData.per_page || 10,
          total: apiData.total || 0
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast.error('Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        setRoles(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      if (editingUser) {
        const updateData = {
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          statut: formData.statut,
          role_ids: formData.role_ids
        };
        if (formData.password) updateData.password = formData.password;
        await axios.put(`${API_BASE_URL}/mon-utilisateurs/${editingUser.id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Utilisateur mis à jour avec succès');
      } else {
        const createData = {
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          password: formData.password,
          statut: formData.statut,
          role_ids: formData.role_ids
        };
        await axios.post(`${API_BASE_URL}/mon-utilisateurs`, createData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Utilisateur créé avec succès');
      }
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        toast.error('Veuillez corriger les erreurs dans le formulaire');
      } else {
        toast.error(error.response?.data?.message || 'Une erreur est survenue');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
        if (!token) { toast.error("Vous n'êtes pas authentifié. Veuillez vous reconnecter."); return; }
        const _item = users.find((x) => x.id === id);
        if (_item) setConfirmItem(_item); else setConfirmItem({ id });
    };

    const confirmDelete = async () => {
        if (!confirmItem || !token) return;
        setConfirmLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/mon-utilisateurs/${confirmItem.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Désactivé avec succès");
            setConfirmItem(null);
            fetchUsers();
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

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      nom: user.nom || '',
      prenom: user.prenom || '',
      email: user.email || '',
      password: '',
      statut: user.statut || 'active',
      role_ids: user.roles?.map(role => role.id) || []
    });
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ nom: '', prenom: '', email: '', password: '', statut: 'active', role_ids: [] });
    setEditingUser(null);
    setErrors({});
  };

  const handleAddRole = (roleId) => {
    if (!roleId || formData.role_ids.includes(parseInt(roleId))) return;
    setFormData({ ...formData, role_ids: [...formData.role_ids, parseInt(roleId)] });
  };

  const handleRemoveRole = (roleId) => {
    setFormData({ ...formData, role_ids: formData.role_ids.filter(id => id !== roleId) });
  };

  const getStatusText = (statut) => {
    switch (statut) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'bloqué': return 'Bloqué';
      default: return statut;
    }
  };

  const getStatusStyle = (statut) => {
    if (statut === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (statut === 'inactive') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getStatusDot = (statut) => {
    if (statut === 'active') return 'bg-emerald-500';
    if (statut === 'inactive') return 'bg-amber-500';
    return 'bg-red-500';
  };

  const renderFieldError = (fieldName) => {
    if (errors[fieldName]) {
      return <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1"><FaExclamationCircle size={11} />{errors[fieldName][0]}</p>;
    }
    return null;
  };

  const activeUsers = users.filter(u => u.statut === 'active').length;
  const inactiveUsers = users.filter(u => u.statut === 'inactive').length;
  const blockedUsers = users.filter(u => u.statut === 'bloqué').length;

  // Scroll lock for modal
  useEffect(() => {
    if (showModal) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showModal]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* HEADER */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                  <FaUsers size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gestion des Utilisateurs</h1>
                  <p className="text-sm text-slate-500">Gérez les utilisateurs et leurs rôles • {pagination.total} utilisateur(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/gestion-utilisateurs/dashboard" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                  <FaArrowLeft size={13} /> Retour
                </Link>
                <button onClick={() => { resetForm(); setShowModal(true); }} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-700 transition disabled:opacity-60">
                  <FaPlus size={13} /> Nouvel Utilisateur
                </button>
              </div>
            </div>
          </div>

          {/* SEARCH + FILTER */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom ou email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="relative min-w-[200px]">
                  <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} disabled={loading} className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none cursor-pointer">
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actifs</option>
                    <option value="inactive">Inactifs</option>
                    <option value="bloqué">Bloqués</option>
                  </select>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold whitespace-nowrap">
                  <FaUsers size={11} /> {pagination.total}
                </span>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: pagination.total, icon: <FaUser />, bg: 'bg-slate-900', soft: 'bg-slate-50 border-slate-200' },
              { label: 'Actifs', value: activeUsers, icon: <FaUserCheck />, bg: 'bg-emerald-500', soft: 'bg-emerald-50 border-emerald-100' },
              { label: 'Inactifs', value: inactiveUsers, icon: <FaUserTimes />, bg: 'bg-amber-500', soft: 'bg-amber-50 border-amber-100' },
              { label: 'Bloqués', value: blockedUsers, icon: <FaUserLock />, bg: 'bg-red-500', soft: 'bg-red-50 border-red-100' },
            ].map((s, i) => (
              <div key={i} className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4 ${s.soft}`}>
                <div className={`w-11 h-11 rounded-xl ${s.bg} text-white flex items-center justify-center shadow-sm shrink-0`}>{s.icon}</div>
                <div>
                  <p className="text-xl font-extrabold text-slate-900 leading-none">{s.value}</p>
                  <p className="text-xs font-semibold tracking-widest uppercase text-slate-500 mt-1">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <LoadingSpinner
                message="Chargement des utilisateurs..."
                subtitle="Veuillez patienter"
                size="lg"
                variant="table"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold tracking-widest uppercase text-slate-500">
                      <th className="px-5 py-3 text-left">#</th>
                      <th className="px-5 py-3 text-left">Nom</th>
                      <th className="px-5 py-3 text-left">Prénom</th>
                      <th className="px-5 py-3 text-left">Email</th>
                      <th className="px-5 py-3 text-left">Rôles</th>
                      <th className="px-5 py-3 text-left">Statut</th>
                      <th className="px-5 py-3 text-left">Créé le</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center">
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                            <FaUser className="text-slate-400" size={24} />
                          </div>
                          <p className="font-semibold text-slate-900">Aucun utilisateur trouvé</p>
                          <p className="text-sm text-slate-500 mt-1">{search ? "Essayez avec d'autres termes de recherche" : "Commencez par créer votre premier utilisateur"}</p>
                        </td>
                      </tr>
                    ) : (
                      users
                        .filter(u => {
                          if (statusFilter === 'all') return true;
                          return u.statut === statusFilter;
                        })
                        .filter(u => {
                          if (!search) return true;
                          const q = search.toLowerCase();
                          return (u.nom && u.nom.toLowerCase().includes(q)) || (u.prenom && u.prenom.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q));
                        })
                        .map((u, index) => (
                          <tr key={u.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-5 py-4 font-medium text-slate-500">{(currentPage - 1) * pagination.per_page + index + 1}</td>
                            <td className="px-5 py-4 font-semibold text-slate-900">{u.nom || 'N/A'}</td>
                            <td className="px-5 py-4 text-slate-700">{u.prenom || 'N/A'}</td>
                            <td className="px-5 py-4 text-slate-600 max-w-[220px] truncate">{u.email || 'N/A'}</td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                                {u.roles && u.roles.length > 0 ? u.roles.map(role => (
                                  <span key={role.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-semibold">
                                    <FaShieldAlt size={10} /> {role.nom}
                                  </span>
                                )) : <span className="text-xs text-slate-400 italic">Aucun rôle</span>}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(u.statut)}`}>
                                <span className={`w-2 h-2 rounded-full ${getStatusDot(u.statut)}`} /> {getStatusText(u.statut)}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{u.created_at ? format(new Date(u.created_at), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => handleEdit(u)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 flex items-center justify-center transition" title="Modifier">
                                  <FaEdit size={13} />
                                </button>
                                <button onClick={() => handleDelete(u.id)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200 flex items-center justify-center transition" title="Supprimer">
                                  <FaTrash size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* PAGINATION */}
            {!loading && pagination.last_page > 1 && (
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">
                  Affichage de {((currentPage - 1) * pagination.per_page) + 1} à {Math.min(currentPage * pagination.per_page, pagination.total)} sur {pagination.total} utilisateurs
                </p>
                <nav className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    <FaChevronLeft size={12} />
                  </button>
                  {[...Array(pagination.last_page)].map((_, i) => {
                    const pageNum = i + 1;
                    const isCurrent = pageNum === currentPage;
                    if (pageNum === 1 || pageNum === pagination.last_page || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                      return (
                        <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`min-w-[32px] h-8 rounded-lg text-xs font-bold border transition ${isCurrent ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return <span key={pageNum} className="px-1 text-slate-400">…</span>;
                    }
                    return null;
                  })}
                  <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === pagination.last_page} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    <FaChevronRight size={12} />
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between shrink-0">
              <h5 className="font-semibold flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><FaUser size={14} /></span>
                {editingUser ? "Modifier l'utilisateur" : "Nouvel Utilisateur"}
              </h5>
              <button onClick={handleCloseModal} disabled={submitting} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Infos */}
                <div>
                  <h6 className="font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                    <FaUser className="text-indigo-600" /> Informations personnelles
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FaUser size={13} /></span>
                        <input type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} disabled={submitting} placeholder="Entrez le nom" className={`w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.nom ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                      </div>
                      {renderFieldError('nom')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Prénom</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FaUser size={13} /></span>
                        <input type="text" value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} disabled={submitting} placeholder="Entrez le prénom" className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h6 className="font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                    <FaEnvelope className="text-indigo-600" /> Contact
                  </h6>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Adresse email <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FaEnvelope size={13} /></span>
                      <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={!!editingUser || submitting} placeholder="exemple@email.com" className={`w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                    </div>
                    {renderFieldError('email')}
                    {editingUser && <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mt-2 flex items-center gap-1.5"><FaCircle size={6} className="text-amber-500" /> L'email ne peut pas être modifié</p>}
                  </div>
                </div>

                <div>
                  <h6 className="font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                    <FaLock className="text-indigo-600" /> Sécurité
                  </h6>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe {!editingUser && <span className="text-red-500">*</span>}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FaLock size={13} /></span>
                      <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingUser} disabled={submitting} placeholder={editingUser ? "Laisser vide pour conserver le mot de passe actuel" : "Entrez le mot de passe"} className={`w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                    </div>
                    {renderFieldError('password')}
                    {editingUser && <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1"><FaCircle size={6} className="text-indigo-400" /> Laissez vide pour ne pas modifier le mot de passe</p>}
                  </div>
                </div>

                <div>
                  <h6 className="font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                    <FaCircle className="text-indigo-600" size={10} /> Statut
                  </h6>
                  <select value={formData.statut} onChange={(e) => setFormData({ ...formData, statut: e.target.value })} disabled={submitting} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="bloqué">Bloqué</option>
                  </select>
                </div>

                <div>
                  <h6 className="font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                    <FaShieldAlt className="text-indigo-600" /> Rôles
                  </h6>
                  <div className="relative mb-3">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FaPlus size={12} /></span>
                    <select onChange={(e) => { if (e.target.value) { handleAddRole(e.target.value); e.target.value = ''; } }} disabled={submitting} className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                      <option value="">Ajouter un rôle...</option>
                      {roles.map(role => <option key={role.id} value={role.id}>{role.nom} - {role.description || 'Pas de description'}</option>)}
                    </select>
                  </div>

                  {formData.role_ids.length > 0 && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-4">
                      <p className="text-xs font-bold text-indigo-900 mb-3">Rôles attribués ({formData.role_ids.length})</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {formData.role_ids.map(roleId => {
                          const role = roles.find(r => r.id === roleId);
                          return role ? (
                            <div key={roleId} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{role.nom}</p>
                                {role.description && <p className="text-xs text-slate-500 truncate">{role.description}</p>}
                              </div>
                              <button type="button" onClick={() => handleRemoveRole(roleId)} disabled={submitting} className="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center shrink-0 ml-2">
                                <FaTrash size={11} />
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-3">Tous les rôles disponibles ({roles.length})</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                      {roles.map(role => {
                        const selected = formData.role_ids.includes(role.id);
                        return (
                          <div key={role.id} className={`flex items-center justify-between p-3 border rounded-xl transition ${selected ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900">{role.nom}</p>
                              {role.description && <p className="text-xs text-slate-500 line-clamp-1">{role.description}</p>}
                            </div>
                            <button type="button" onClick={() => selected ? handleRemoveRole(role.id) : handleAddRole(role.id)} disabled={submitting} className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 ml-2 inline-flex items-center gap-1 ${selected ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                              {selected ? <><FaCheck size={10} /> Ajouté</> : 'Ajouter'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={handleCloseModal} disabled={submitting} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition disabled:opacity-60">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition inline-flex items-center gap-2 disabled:opacity-60">
                  {submitting ? <><FaSpinner className="animate-spin" /> {editingUser ? 'Mise à jour...' : 'Création...'}</> : (editingUser ? 'Mettre à jour' : "Créer l'utilisateur")}
                </button>
              </div>
            </form>
          </div>
        </div>
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

export default UserScreen;
