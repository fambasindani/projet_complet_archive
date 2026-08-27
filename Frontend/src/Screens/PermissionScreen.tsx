/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaKey,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaUserShield,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
  FaInfoCircle,
  FaSpinner,
  FaSync,
  FaShieldAlt,
  FaTimes,
  FaLock,
  FaCheckCircle,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { API_BASE_URL } from '../config';
import { toast } from "../Composant/Toast";
import ConfirmModal from "../Modals/ConfirmModal";
import LoadingSpinner from "../Loading/LoadingSpinner";
import ActionDropdown from "../Composant/ActionDropdown";

const Permissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const token = GetTokenOrRedirect();
    const [confirmItem, setConfirmItem] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  useEffect(() => {
    if (token) {
      fetchPermissions();
      fetchRoles();
    }
  }, [token, currentPage, search]);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          per_page: pagination.per_page,
          search: search || undefined,
        },
      });

      if (response.data && response.data.success) {
        const apiData = response.data.data;
        setPermissions(apiData.data || []);
        setPagination({
          current_page: apiData.current_page || 1,
          last_page: apiData.last_page || 1,
          per_page: apiData.per_page || 10,
          total: apiData.total || 0,
        });
      }
    } catch (error) {
      console.error('Erreur chargement permissions:', error);
      toast.error('Impossible de charger les permissions');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success) {
        const apiData = response.data.data;
        setRoles(apiData.data || apiData || []);
      }
    } catch (error) {
      console.error('Erreur chargement rôles:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingPermission) {
        const response = await axios.put(`${API_BASE_URL}/permissions/${editingPermission.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          fetchPermissions();
          toast.success('Permission mise à jour avec succès');
        }
      } else {
        const response = await axios.post(`${API_BASE_URL}/permissions`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          fetchPermissions();
          toast.success('Permission créée avec succès');
        }
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Erreur:', error);

      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        let errorMessage = 'Veuillez corriger les erreurs suivantes:<br><ul>';
        Object.keys(errors).forEach((key) => {
          errors[key].forEach((msg) => {
            errorMessage += `<li>${msg}</li>`;
          });
        });
        errorMessage += '</ul>';

        toast.error('Erreur de validation');
      } else {
        toast.error(error.response?.data?.message || error.message || 'Une erreur est survenue');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
        if (!token) { toast.error("Vous n'êtes pas authentifié. Veuillez vous reconnecter."); return; }
        const _item = permissions.find((x) => x.id === id);
        if (_item) setConfirmItem(_item); else setConfirmItem({ id });
    };

    const confirmDelete = async () => {
        if (!confirmItem || !token) return;
        setConfirmLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/permissions/${confirmItem.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Désactivé avec succès");
            setConfirmItem(null);
            fetchPermissions();
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

  const handleEdit = (permission) => {
    setEditingPermission(permission);
    setFormData({
      code: permission.code,
      description: permission.description || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
    });
    setEditingPermission(null);
  };

  const getRolesUsingPermission = (permissionId) => {
    const permission = permissions.find((p) => p.id === permissionId);
    if (permission && permission.roles_count > 0) {
      return [];
    }
    return [];
  };

  const filteredPermissions = Array.isArray(permissions)
    ? permissions.filter((p) => {
        if (filter === 'all') return true;
        if (filter === 'with_roles') return (p.roles_count || 0) > 0;
        if (filter === 'without_roles') return !p.roles_count || p.roles_count === 0;
        return true;
      })
    : [];

  // Stats calculées depuis la page courante
  const withRolesCount = permissions.filter((p) => (p.roles_count || 0) > 0).length;
  const withoutRolesCount = permissions.filter((p) => !p.roles_count || p.roles_count === 0).length;
  const totalOnPage = permissions.length;

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <FaKey size={18} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gestion des Permissions</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Gérez les permissions système — {pagination.total} permission{pagination.total !== 1 ? 's' : ''} au total
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/gestion-utilisateurs/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
            >
              <FaArrowLeft size={12} /> Retour
            </Link>
            <button
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setFilter('all');
                setCurrentPage(1);
                fetchPermissions();
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50"
            >
              <FaSync className={loading ? 'animate-spin' : ''} size={12} />
              Actualiser
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition disabled:opacity-50"
            >
              <FaPlus size={12} /> Nouvelle permission
            </button>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Rechercher une permission (code, description)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            <FaSearch size={12} /> Rechercher
          </button>
          <div className="relative">
            <FaFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              disabled={loading}
              className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition appearance-none"
            >
              <option value="all">Toutes les permissions</option>
              <option value="with_roles">Avec rôles associés</option>
              <option value="without_roles">Sans rôles associés</option>
            </select>
          </div>
          <span className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
            <FaShieldAlt size={11} /> {pagination.total} permission{pagination.total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{pagination.total}</p>
              <p className="text-xs text-slate-400 mt-1">Permissions système</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FaKey size={18} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Associées</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{withRolesCount}</p>
              <p className="text-xs text-slate-400 mt-1">Sur cette page</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <FaCheckCircle size={18} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Libres</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{withoutRolesCount}</p>
              <p className="text-xs text-slate-400 mt-1">Sans rôles</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <FaLock size={18} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Page</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalOnPage}</p>
              <p className="text-xs text-slate-400 mt-1">Éléments affichés</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <FaUserShield size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <LoadingSpinner
            message="Chargement des permissions..."
            subtitle="Veuillez patienter"
            size="lg"
            variant="table"
          />
        </div>
      ) : filteredPermissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <FaKey className="text-slate-400" size={28} />
          </div>
          <h3 className="font-bold text-slate-900">Aucune permission trouvée</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {search ? `Aucun résultat pour « ${search} »` : filter !== 'all' ? 'Aucune permission ne correspond à ce filtre' : 'Commencez par créer votre première permission'}
          </p>
          {!search && filter === 'all' && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
            >
              <FaPlus size={12} /> Créer une permission
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500 w-16">#</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <FaKey className="text-indigo-500" size={12} /> Code permission
                      </span>
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Description</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <FaUserShield size={11} /> Utilisation
                      </span>
                    </th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-slate-500 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredPermissions.map((permission, index) => (
                    <tr key={permission.id} className="hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-500">
                        {(pagination.current_page - 1) * pagination.per_page + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                            <FaKey size={13} />
                          </span>
                          <span className="text-sm font-semibold text-slate-900 font-mono">{permission.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[420px]">
                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {permission.description || <span className="text-slate-400 italic">Aucune description</span>}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {permission.roles_count > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-600/15">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                            {permission.roles_count} rôle{permission.roles_count > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                            Aucun rôle
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <ActionDropdown>
                            <button
                              onClick={() => handleEdit(permission)}
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                            >
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                <FaEdit size={11} />
                              </span>
                              Modifier
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                              onClick={() => handleDelete(permission.id)}
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition"
                            >
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                                <FaTrash size={11} />
                              </span>
                              Supprimer
                            </button>
                          </ActionDropdown>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Affichage de <span className="font-semibold text-slate-900">{(pagination.current_page - 1) * pagination.per_page + 1}</span> à{' '}
                <span className="font-semibold text-slate-900">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> sur{' '}
                <span className="font-semibold text-slate-900">{pagination.total}</span> permissions
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <FaChevronLeft size={11} />
                </button>
                {(() => {
                  const pages = [];
                  const maxVisible = 5;
                  let startPage = Math.max(1, pagination.current_page - Math.floor(maxVisible / 2));
                  let endPage = Math.min(pagination.last_page, startPage + maxVisible - 1);
                  if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
                  for (let i = startPage; i <= endPage; i++) pages.push(i);
                  return (
                    <>
                      {startPage > 1 && (
                        <>
                          <button onClick={() => setCurrentPage(1)} className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
                            1
                          </button>
                          {startPage > 2 && <span className="px-1 text-slate-400">…</span>}
                        </>
                      )}
                      {pages.map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold border transition ${pagination.current_page === pageNum ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          {pageNum}
                        </button>
                      ))}
                      {endPage < pagination.last_page && (
                        <>
                          {endPage < pagination.last_page - 1 && <span className="px-1 text-slate-400">…</span>}
                          <button
                            onClick={() => setCurrentPage(pagination.last_page)}
                            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                          >
                            {pagination.last_page}
                          </button>
                        </>
                      )}
                    </>
                  );
                })()}
                <button
                  onClick={() => setCurrentPage(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <FaChevronRight size={11} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setShowModal(false); resetForm(); }} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-5 bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                  <FaKey size={14} />
                </div>
                <div>
                  <h3 className="font-bold leading-none">{editingPermission ? 'Modifier la permission' : 'Nouvelle permission'}</h3>
                  <p className="text-xs text-white/80 mt-1">{editingPermission ? 'Mettre à jour les informations' : 'Créer une nouvelle permission système'}</p>
                </div>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                disabled={submitting}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur flex items-center justify-center text-white transition disabled:opacity-50"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Code de la permission <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FaKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    placeholder="Ex: user_create, content_read..."
                    disabled={submitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition disabled:opacity-50"
                  />
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <FaInfoCircle size={11} /> Utilisez le format snake_case (ex: user_create, content_delete)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez ce que cette permission permet..."
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin" size={13} />
                      {editingPermission ? 'Mise à jour...' : 'Création...'}
                    </>
                  ) : editingPermission ? 'Mettre à jour' : 'Créer la permission'}
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

export default Permissions;
