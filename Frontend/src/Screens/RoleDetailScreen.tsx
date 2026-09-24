/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaUserShield,
  FaKey,
  FaUsers,
  FaEdit,
  FaArrowLeft,
  FaSpinner,
  FaTrash,
  FaExclamationTriangle,
  FaInfoCircle,
  FaSync,
  FaCrown,
  FaShieldAlt,
  FaCalendarAlt,
} from 'react-icons/fa';
import { Link, useParams, useHistory } from 'react-router-dom';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { API_BASE_URL } from '../config';
import { toast } from "../Composant/Toast";
import ConfirmModal from "../Modals/ConfirmModal";
import LoadingSpinner from "../Loading/LoadingSpinner";

const RoleDetailScreen = () => {
  const { id } = useParams();
  const navRouter = useHistory();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const token = GetTokenOrRedirect();
    const [confirmItem, setConfirmItem] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);


  useEffect(() => {
    if (token && id) fetchRoleDetails();
  }, [token, id]);

  const fetchRoleDetails = async () => {
    setLoading(true);
    try {
      let response;
      try {
        response = await axios.get(`${API_BASE_URL}/roles/${id}/with-details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        response = await axios.get(`${API_BASE_URL}/roles/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (response.data && response.data.success) setRole(response.data.data);
      else throw new Error('Format de réponse invalide');
    } catch (error) {
      console.error('Erreur lors du chargement des détails du rôle:', error);
      toast.error(error.response?.data?.message || 'Impossible de charger les détails du rôle');
      navRouter.push('/gestion-utilisateurs/roles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
        if (!token) { toast.error("Vous n'êtes pas authentifié. Veuillez vous reconnecter."); return; }
        setConfirmItem(role);
    };

    const confirmDelete = async () => {
        if (!confirmItem || !token) return;
        setConfirmLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/roles/${confirmItem.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Désactivé avec succès");
            setConfirmItem(null);
            fetchRoleDetails();
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

  const handleRefresh = async () => {
    await fetchRoleDetails();
    toast.success('Informations du rôle mises à jour');
  };

  const getUserCount = () => {
    if (role.users_count !== undefined) return role.users_count;
    if (role.users_count !== undefined) return role.users_count;
    if (role.mon_utilisateurs && Array.isArray(role.mon_utilisateurs)) return role.mon_utilisateurs.length;
    if (role.users && Array.isArray(role.users)) return role.users.length;
    return 0;
  };
  const getPermissionCount = () => {
    if (role.permissions_count !== undefined) return role.permissions_count;
    if (role.permissions && Array.isArray(role.permissions)) return role.permissions.length;
    return 0;
  };
  const getUsers = () => {
    if (role.mon_utilisateurs && Array.isArray(role.mon_utilisateurs)) return role.mon_utilisateurs;
    if (role.users && Array.isArray(role.users)) return role.users;
    return [];
  };
  const getPermissions = () => role.permissions || [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <LoadingSpinner
            message="Chargement des détails du rôle..."
            subtitle="Veuillez patienter"
            size="lg"
          />
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle className="text-red-500" size={22} />
          </div>
          <h3 className="font-bold text-slate-900">Rôle non trouvé</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">Le rôle demandé n'existe pas ou vous n'y avez pas accès.</p>
          <button onClick={() => navRouter.push('/gestion-utilisateurs/roles')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition">
            <FaArrowLeft size={12} /> Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const userCount = getUserCount();
  const permissionCount = getPermissionCount();
  const users = getUsers();
  const permissions = getPermissions();
  const isAdminRole = role.nom === 'Admin';

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 ${isAdminRole ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-indigo-600 to-violet-600'}`}>
                  {isAdminRole ? <FaCrown size={16} /> : <FaUserShield size={16} />}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight truncate flex items-center gap-2">
                    {role.nom}
                    {isAdminRole && <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-bold inline-flex items-center gap-1"><FaCrown size={10} /> Admin</span>}
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">Détails du rôle • Créé le {role.created_at ? new Date(role.created_at).toLocaleDateString('fr-FR') : '—'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => navRouter.push('/gestion-utilisateurs/roles')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
                  <FaArrowLeft size={12} /> Retour
                </button>
                <button onClick={handleRefresh} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
                  <FaSync className={loading ? 'animate-spin' : ''} size={12} /> Rafraîchir
                </button>
                <Link to={`/gestion-utilisateurs/roles/${id}/modifier`} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${isAdminRole ? 'bg-slate-100 text-slate-400 border border-slate-200 pointer-events-none' : 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'}`}>
                  <FaEdit size={12} /> Modifier
                </Link>
                <button onClick={handleDelete} disabled={isAdminRole || deleting} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${isAdminRole || deleting ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white border-red-200 text-red-600 hover:bg-red-50'}`}>
                  {deleting ? <FaSpinner className="animate-spin" size={12} /> : <FaTrash size={12} />} {deleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-2"><FaUserShield size={18} /></div>
              <p className="text-2xl font-bold text-slate-900">1</p>
              <p className="text-xs font-medium text-slate-500">Rôle</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
              <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mx-auto mb-2"><FaUsers size={18} /></div>
              <p className="text-2xl font-bold text-slate-900">{userCount}</p>
              <p className="text-xs font-medium text-slate-500">Utilisateur{userCount !== 1 ? 's' : ''}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-2"><FaKey size={18} /></div>
              <p className="text-2xl font-bold text-slate-900">{permissionCount}</p>
              <p className="text-xs font-medium text-slate-500">Permission{permissionCount !== 1 ? 's' : ''}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mx-auto mb-2 ${isAdminRole ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}><FaShieldAlt size={18} /></div>
              <p className="text-lg font-bold text-slate-900">{isAdminRole ? 'Admin' : 'Standard'}</p>
              <p className="text-xs font-medium text-slate-500">Type</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className={`h-1 ${isAdminRole ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-indigo-600 to-violet-600'}`} />
                <div className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><FaInfoCircle className="text-indigo-600" size={14} /> Informations du rôle</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                      <p className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-1">Nom du rôle</p>
                      <p className="font-bold text-slate-900">{role.nom}</p>
                      {isAdminRole && <span className="inline-flex items-center gap-1 mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full"><FaInfoCircle size={10} /> Rôle administrateur système</span>}
                    </div>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                      <p className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-1 flex items-center gap-1"><FaCalendarAlt size={10} /> Date de création</p>
                      <p className="font-semibold text-slate-900 text-sm">{role.created_at ? new Date(role.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Non spécifiée'}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                    <p className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-1">Description</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{role.description || 'Aucune description fournie'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2"><FaKey className="text-emerald-600" size={14} /> Permissions <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded-full text-xs font-bold">{permissionCount}</span></h3>
                </div>
                {permissions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissions.map((perm) => (
                      <div key={perm.id} className="flex gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition group">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition shrink-0"><FaKey size={12} /></div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{perm.code || 'Permission'}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{perm.description || 'Aucune description'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-2 text-sm text-amber-800">
                    <FaInfoCircle /> Aucune permission attribuée à ce rôle
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><FaUsers className="text-sky-600" size={13} /> Utilisateurs <span className="px-2 py-0.5 bg-slate-900 text-white rounded-full text-xs font-bold">{userCount}</span></h3>
                </div>
                <div className="p-2">
                  {users.length > 0 ? (
                    <div className="max-h-[380px] overflow-y-auto space-y-1 pr-1">
                      {users.slice(0, 10).map((user) => (
                        <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {(user.prenom?.[0] || '') + (user.nom?.[0] || '') || '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 truncate">{user.prenom} {user.nom}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${user.statut === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : user.statut === 'inactive' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{user.statut || '—'}</span>
                          </div>
                        </div>
                      ))}
                      {users.length > 10 && <p className="text-center text-xs text-slate-500 py-2">+ {users.length - 10} autre{users.length - 10 !== 1 ? 's' : ''}</p>}
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3"><FaUsers className="text-slate-400" size={18} /></div>
                      <p className="text-sm text-slate-500">Aucun utilisateur avec ce rôle</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-100"><h3 className="font-bold text-slate-900 text-sm">Actions</h3></div>
                <div className="p-4 space-y-2">
                  <Link to={`/gestion-utilisateurs/roles/${id}/modifier`} className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition ${isAdminRole ? 'bg-slate-100 text-slate-400 border-slate-200 pointer-events-none' : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50'}`}>
                    <FaEdit size={12} /> Modifier ce rôle
                  </Link>
                  <button onClick={handleDelete} disabled={isAdminRole} className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition ${isAdminRole ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white border-red-200 text-red-600 hover:bg-red-50'}`}>
                    <FaTrash size={12} /> Supprimer ce rôle
                  </button>
                  <Link to="/gestion-utilisateurs/roles" className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition">
                    <FaArrowLeft size={12} /> Retour à la liste
                  </Link>
                </div>
              </div>
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

export default RoleDetailScreen;
