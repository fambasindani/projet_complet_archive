/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useHistory, Link } from 'react-router-dom';
import axios from 'axios';
import {
  FaBuilding,
  FaUsers,
  FaCalendarAlt,
  FaArrowLeft,
  FaEdit,
  FaUserPlus,
  FaTimes,
  FaSpinner,
  FaExclamationCircle,
  FaEye,
  FaShieldAlt,
  FaCheckCircle,
  FaClock,
  FaTrash
} from 'react-icons/fa';
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import Head from '../Composant/Head';
import Menus from '../Composant/Menus';
import { toast } from "../Composant/Toast";
import DetailModal from "../Modals/DetailModal";
import ConfirmModal from "../Modals/ConfirmModal";
import LoadingSpinner from "../Loading/LoadingSpinner";

const DirectionDetailScreen = (props) => {
  const { id: paramId } = useParams();
  // support prop from DirectionViewScreen: props.direction etc.
  const id = paramId || props?.direction?.id;
  const navRouter = useHistory();
  const token = GetTokenOrRedirect();
    const [confirmItem, setConfirmItem] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const [detailItem, setDetailItem] = useState(null);


  const [direction, setDirection] = useState(props?.direction || null);
  const [assignedUsers, setAssignedUsers] = useState(props?.direction?.monutilisateurs || []);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(!props?.direction);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [removingUser, setRemovingUser] = useState(null);

  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  };

  useEffect(() => {
    if (id && token && !props?.direction) {
      fetchDirectionData();
    } else if (props?.direction) {
      // if direction passed as prop, still load available users
      fetchAvailableUsers();
      setLoading(false);
    }
  }, [id, token]);

  const fetchDirectionData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/departements/${id}/with-details`,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        const directionData = response.data.data;
        setDirection(directionData);

        if (directionData.monutilisateurs) {
          setAssignedUsers(directionData.monutilisateurs);
        }

        await fetchAvailableUsers();
      } else {
        throw new Error('Direction non trouvée');
      }
    } catch (error) {
      console.error('Erreur chargement direction:', error);

      if (error.response?.status === 401) {
        return;
      }

      toast.error("Cette direction n'existe pas ou a été supprimée.");
      navRouter.push('/gestion-utilisateurs/directions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/departements/${id}/available-users`,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setAvailableUsers(response.data.data.utilisateurs_disponibles || []);
      }
    } catch (error) {
      console.error('Erreur utilisateurs disponibles:', error);
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddUser = async (userId) => {
    if (!userId) {
      toast.error('Veuillez sélectionner un utilisateur');
      return;
    }

    try {
      setLoadingUsers(true);
      const response = await axios.post(
        `${API_BASE_URL}/departements/${id}/assign-user/${userId}`,
        {},
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Utilisateur assigné avec succès');

        setSelectedUserId('');

        await fetchDirectionData();
      }
    } catch (error) {
      console.error('Erreur assignation:', error);

      if (error.response?.status === 401) {
        return;
      }

      if (error.response?.status === 409) {
        toast.warning('Cet utilisateur est déjà assigné à cette direction');
      } else if (error.response?.status === 404) {
        toast.error('Utilisateur ou direction non trouvé');
      } else {
        toast.error(error.response?.data?.message || error.message);
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRemoveUser = async (userId) => {
    const user = assignedUsers.find(u => u.id === userId);
    if (!user) return;

    const result = await setDetailItem(user);

    if (result.isConfirmed) {
      setRemovingUser(userId);
      try {
        const response = await axios.post(
          `${API_BASE_URL}/departements/${id}/remove-user/${userId}`,
          {},
          { headers: getAuthHeaders() }
        );

        if (response.data.success) {
          toast.success('Utilisateur retiré de la direction');

          await fetchDirectionData();
        }
      } catch (error) {
        console.error('Erreur retrait utilisateur:', error);

        if (error.response?.status === 401) {
          return;
        }

        toast.error(error.response?.data?.message || error.message);
      } finally {
        setRemovingUser(null);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <LoadingSpinner
            message="Chargement de la direction..."
            subtitle="Veuillez patienter"
            size="lg"
          />
        </div>
      </div>
    );
  }

  if (!direction) {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mx-auto mb-3">
            <FaExclamationCircle size={20} />
          </div>
          <h3 className="font-bold text-slate-900">Direction non trouvée</h3>
          <p className="text-sm text-slate-500 mt-1">Cette direction n'existe pas ou a été supprimée.</p>
          <Link to="/gestion-utilisateurs/directions" className="inline-flex mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">Retour à la liste</Link>
        </div>
      </div>
    );
  }

  const totalUsers = assignedUsers.length + availableUsers.length;

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/gestion-utilisateurs/directions" className="hover:text-indigo-600 transition">Directions</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-medium flex items-center gap-2">
              <span className="inline-flex px-2 py-0.5 bg-indigo-600 text-white rounded-md text-xs font-bold">{direction.sigle}</span>
              {direction.nom}
            </span>
          </nav>

          {/* Header premium */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500" />
            <div className="p-6 lg:p-7">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
                    <FaBuilding size={18} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3 flex-wrap">
                      {direction.sigle}
                      <span className="text-slate-400 font-normal">—</span>
                      <span className="font-semibold">{direction.nom}</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold">
                        <FaCheckCircle size={11} /> Active
                      </span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                      <FaUsers className="text-slate-400" size={12} />
                      Gestion des utilisateurs de cette direction
                      <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-600">
                        <FaShieldAlt size={10} /> ID: {direction.id}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => props?.onBack ? props.onBack() : navRouter.push('/gestion-utilisateurs/directions')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition shadow-sm"
                  >
                    <FaArrowLeft size={13} />
                    Retour
                  </button>
                  <Link
                    to={`/gestion-utilisateurs/directions/${direction.id}/modifier`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-700 transition"
                  >
                    <FaEdit size={13} />
                    Modifier
                  </Link>
                </div>
              </div>

              {/* Meta row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600"><FaBuilding size={14} /></div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Sigle</p>
                    <p className="text-sm font-bold text-slate-900">{direction.sigle}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-600"><FaCalendarAlt size={14} /></div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Date de création</p>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><FaClock size={11} className="text-slate-400" />{formatDate(direction.datecreation)}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-violet-600"><FaUsers size={14} /></div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Effectif assigné</p>
                    <p className="text-sm font-bold text-slate-900">{assignedUsers.length} utilisateur{assignedUsers.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Assignés</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{assignedUsers.length}</p>
                  <p className="text-xs text-slate-500 mt-1">{assignedUsers.length > 0 ? 'Utilisateurs actifs' : 'Aucun utilisateur'}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600"><FaUsers /></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Disponibles</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{availableUsers.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Pouvant être assignés</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600"><FaUserPlus /></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Total actifs</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{totalUsers}</p>
                  <p className="text-xs text-slate-500 mt-1">Utilisateurs dans le système</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center text-white"><FaEye size={14} /></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main - users table */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600"><FaUsers size={12} /></span>
                    Utilisateurs assignés
                    <span className="px-2 py-0.5 bg-slate-900 text-white rounded-full text-xs font-bold">{assignedUsers.length}</span>
                  </h3>
                  <span className="text-xs text-slate-400 hidden sm:inline">Gestion de l'effectif</span>
                </div>

                {assignedUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          <th className="px-6 py-3">Nom & Prénom</th>
                          <th className="px-6 py-3">Email</th>
                          <th className="px-6 py-3">Statut</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {assignedUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                  {(user.prenom?.[0] || '').toUpperCase()}{(user.nom?.[0] || '').toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 truncate">{user.prenom} {user.nom}</p>
                                  <p className="text-xs text-slate-500">ID: {user.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600 truncate max-w-[180px] inline-block">{user.email}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                                user.statut === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                user.statut === 'inactive' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {user.statut}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleRemoveUser(user.id)}
                                disabled={removingUser === user.id || loadingUsers}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50 transition disabled:opacity-50 shadow-sm"
                              >
                                {removingUser === user.id ? <FaSpinner className="animate-spin" size={11} /> : <FaTrash size={11} />}
                                Retirer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto"><FaUsers size={20} /></div>
                    <h4 className="mt-3 font-semibold text-slate-900">Aucun utilisateur assigné</h4>
                    <p className="text-sm text-slate-500 mt-1">Cette direction n'a encore aucun membre. Ajoutez-en depuis le panneau latéral.</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3"><FaBuilding className="text-slate-400" size={12} /> Description complète</h4>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-4">{direction.nom}</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white"><FaUserPlus size={12} /></span>
                    Ajouter un utilisateur
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Assignez un membre actif à cette direction</p>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sélectionner un utilisateur</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      disabled={loadingUsers || availableUsers.length === 0}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 transition"
                    >
                      <option value="">Choisir un utilisateur...</option>
                      {availableUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.prenom} {user.nom} — {user.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => handleAddUser(selectedUserId)}
                    disabled={!selectedUserId || loadingUsers}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingUsers ? (<><FaSpinner className="animate-spin" size={14} /> Traitement...</>) : (<><FaUserPlus size={14} /> Assigner l'utilisateur</>)}
                  </button>

                  {availableUsers.length === 0 && !loadingUsers && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5">
                      <FaExclamationCircle className="text-amber-600 mt-0.5 shrink-0" size={14} />
                      <p className="text-xs text-amber-800 leading-relaxed"><span className="font-bold">Info :</span> Tous les utilisateurs actifs sont déjà assignés à cette direction.</p>
                    </div>
                  )}

                  {loadingUsers && availableUsers.length === 0 && (
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-2">
                      <FaSpinner className="animate-spin" size={12} />
                      Chargement des utilisateurs...
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-3">Statistiques</h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                        <p className="text-lg font-bold text-indigo-600">{assignedUsers.length}</p>
                        <p className="text-[11px] font-medium text-slate-500">Assignés</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3">
                        <p className="text-lg font-bold text-emerald-600">{availableUsers.length}</p>
                        <p className="text-[11px] font-medium text-emerald-700">Disponibles</p>
                      </div>
                      <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-3">
                        <p className="text-lg font-bold text-slate-900">{totalUsers}</p>
                        <p className="text-[11px] font-medium text-slate-600">Total</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-2.5">
                    <FaExclamationCircle className="text-slate-400 mt-0.5 shrink-0" size={14} />
                    <p className="text-xs text-slate-600 leading-relaxed"><span className="font-semibold text-slate-900">Note :</span> Seuls les utilisateurs avec statut <span className="font-bold">active</span> apparaissent ici.</p>
                  </div>
                </div>
              </div>
          </div>
        </div>
                
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
            
</div>
  );
};

export default DirectionDetailScreen;
