/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaPlus,
  FaSearch,
  FaUserShield,
  FaKey,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
  FaSpinner,
  FaSync,
  FaUsers,
  FaShieldAlt,
  FaCrown,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { API_BASE_URL } from '../config';
import LoadingSpinner from "../Loading/LoadingSpinner";
import Head from '../Composant/Head';
import Menus from '../Composant/Menus';
import { toast } from "../Composant/Toast";
import ConfirmModal from "../Modals/ConfirmModal";

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const token = GetTokenOrRedirect();
    const [confirmItem, setConfirmItem] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

  const handleSearch = () => {
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  useEffect(() => {
    if (token) fetchRoles();
  }, [search, currentPage, token]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, per_page: pagination.per_page, search: search || undefined };
      const response = await axios.get(`${API_BASE_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      if (response.data && response.data.success) {
        const apiData = response.data.data;
        if (apiData && apiData.data) {
          setRoles(apiData.data || []);
          setPagination({
            current_page: apiData.current_page || 1,
            last_page: apiData.last_page || 1,
            per_page: apiData.per_page || 10,
            total: apiData.total || 0,
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
      toast.error(error.response?.data?.message || 'Impossible de charger les rôles');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setSearchInput('');
    setSearch('');
    setFilter('all');
    setCurrentPage(1);
    setRefreshing(true);
    await fetchRoles();
    setRefreshing(false);
    toast.success('Liste des rôles mise à jour');
  };

  const handleDelete = (id) => {
        if (!token) { toast.error("Vous n'êtes pas authentifié. Veuillez vous reconnecter."); return; }
        const _item = roles.find((x) => x.id === id);
        if (_item) setConfirmItem(_item); else setConfirmItem({ id });
    };

    const confirmDelete = async () => {
        if (!confirmItem || !token) return;
        setConfirmLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/roles/${confirmItem.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Désactivé avec succès");
            setConfirmItem(null);
            fetchRoles();
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

  const getPermissionCount = (role) => role.permissions?.length || role.permissions_count || 0;
  const getUserCount = (role) => role.monutilisateurs_count || role.users_count || 0;
  const getPermissionNames = (role) => {
    if (!role.permissions || !Array.isArray(role.permissions)) return [];
    return role.permissions.slice(0, 3).map((perm) => perm.code || 'Permission');
  };

  const filteredRoles = Array.isArray(roles)
    ? roles.filter((role) => {
        if (!role) return false;
        const matchesSearch =
          search === '' ||
          (role.nom && role.nom.toLowerCase().includes(search.toLowerCase())) ||
          (role.description && role.description.toLowerCase().includes(search.toLowerCase()));
        if (!matchesSearch) return false;
        if (filter === 'all') return true;
        if (filter === 'with_users') return getUserCount(role) > 0;
        if (filter === 'without_users') return getUserCount(role) === 0;
        if (filter === 'with_permissions') return getPermissionCount(role) > 0;
        return true;
      })
    : [];

  const totalUsers = filteredRoles.reduce((acc, role) => acc + getUserCount(role), 0);
  const totalPermissions = filteredRoles.reduce((acc, role) => acc + getPermissionCount(role), 0);
  const activeRoles = filteredRoles.filter((role) => getUserCount(role) > 0).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shrink-0">
                  <FaUserShield size={18} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gestion des Rôles</h1>
                  <p className="text-sm text-slate-500 mt-0.5">Gérez les rôles et leurs permissions — {pagination.total} rôle{pagination.total !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link to="/gestion-utilisateurs/dashboard" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
                  <FaArrowLeft size={12} /> Retour
                </Link>
                <Link to="/gestion-utilisateurs/roles/nouveau" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition">
                  <FaPlus size={12} /> Nouveau rôle
                </Link>
              </div>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Rechercher un rôle par nom ou description..."
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
                  <option value="all">Tous les rôles</option>
                  <option value="with_users">Avec utilisateurs</option>
                  <option value="without_users">Sans utilisateurs</option>
                  <option value="with_permissions">Avec permissions</option>
                </select>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50"
              >
                <FaSync className={refreshing ? 'animate-spin' : ''} size={12} /> Actualiser
              </button>
              <span className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
                <FaShieldAlt size={11} /> {pagination.total} rôle{pagination.total !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Total rôles</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{pagination.total}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <FaUserShield size={18} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Utilisateurs totaux</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{totalUsers}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                  <FaUsers size={18} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Permissions totales</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{totalPermissions}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <FaKey size={18} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Rôles actifs</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{activeRoles}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <FaCrown size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <LoadingSpinner
                message="Chargement des rôles..."
                subtitle="Veuillez patienter"
                size="lg"
                variant="table"
              />
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                <FaUserShield className="text-slate-400" size={28} />
              </div>
              <h3 className="font-bold text-slate-900">Aucun rôle trouvé</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{search ? `Aucun résultat pour « ${search} »` : filter !== 'all' ? 'Aucun rôle ne correspond à ce filtre' : 'Commencez par créer votre premier rôle'}</p>
              {!search && filter === 'all' && (
                <Link to="/gestion-utilisateurs/roles/nouveau" className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                  <FaPlus size={12} /> Créer un rôle
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredRoles.map((role) => {
                  const userCount = getUserCount(role);
                  const permissionCount = getPermissionCount(role);
                  const permissionNames = getPermissionNames(role);
                  const isAdmin = role.nom === 'Admin';
                  return (
                    <div key={role.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col overflow-hidden group">
                      <div className={`h-1 ${isAdmin ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-indigo-600 to-violet-600'}`} />
                      <div className="p-5 pb-3">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 ${isAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-indigo-600 to-violet-600'}`}>
                              <FaUserShield size={14} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-900 text-sm truncate">{role.nom || 'Sans nom'}</h3>
                              <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${isAdmin ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                {isAdmin && <FaCrown size={10} />} {isAdmin ? 'Admin' : `${userCount} utilisateur(s)`}
                              </span>
                            </div>
                          </div>
                          <span className="shrink-0 inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[11px] font-bold">
                            {permissionCount} perm.
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] leading-relaxed">{role.description || 'Aucune description'}</p>
                        <div className="mt-4">
                          <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-2 flex items-center gap-1.5"><FaKey size={10} /> Permissions ({permissionCount})</p>
                          <div className="flex flex-wrap gap-1.5">
                            {permissionNames.length > 0 ? (
                              <>
                                {permissionNames.map((permName, idx) => (
                                  <span key={idx} className="px-2.5 py-1 bg-slate-900 text-white rounded-full text-[11px] font-semibold">
                                    {permName}
                                  </span>
                                ))}
                                {permissionCount > 3 && <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[11px] font-bold">+{permissionCount - 3} plus</span>}
                              </>
                            ) : (
                              <span className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-[11px]">Aucune permission</span>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-50 pt-3">
                          <span className="inline-flex items-center gap-1.5"><FaKey size={11} className="text-slate-400" /> {permissionCount} perm.</span>
                          <span className="inline-flex items-center gap-1.5"><FaUsers size={11} className="text-slate-400" /> {userCount} util.</span>
                        </div>
                      </div>
                      <div className="mt-auto px-5 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                        <Link to={`/gestion-utilisateurs/roles/${role.id}`} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition">
                          <FaEye size={11} /> Détails
                        </Link>
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/gestion-utilisateurs/roles/${role.id}/modifier`}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center border text-xs transition ${isAdmin ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed pointer-events-none' : 'bg-white border-amber-200 text-amber-600 hover:bg-amber-50'}`}
                            title={isAdmin ? 'Admin non modifiable' : 'Modifier'}
                          >
                            <FaEdit size={11} />
                          </Link>
                          <button
                            onClick={() => handleDelete(role.id, role.nom)}
                            disabled={isAdmin}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center border text-xs transition ${isAdmin ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-red-200 text-red-600 hover:bg-red-50'}`}
                            title={isAdmin ? 'Admin non supprimable' : 'Supprimer'}
                          >
                            <FaTrash size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">Page {pagination.current_page} sur {pagination.last_page} • {pagination.total} rôles</p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                      <FaChevronLeft size={11} />
                    </button>
                    {[...Array(pagination.last_page)].map((_, i) => {
                      const pageNum = i + 1;
                      const isCurrent = pageNum === currentPage;
                      if (pageNum === 1 || pageNum === pagination.last_page || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                        return (
                          <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-9 h-9 rounded-xl text-xs font-bold border transition ${isCurrent ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            {pageNum}
                          </button>
                        );
                      } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) return <span key={pageNum} className="px-1 text-slate-400 text-sm">…</span>;
                      return null;
                    })}
                    <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === pagination.last_page} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                      <FaChevronRight size={11} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
                
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

export default Roles;
