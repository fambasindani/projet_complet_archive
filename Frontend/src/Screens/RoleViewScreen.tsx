/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React from 'react';
import { useParams, useHistory, Link } from 'react-router-dom';
import { FaUserShield, FaExclamationTriangle, FaArrowLeft, FaKey, FaUsers, FaInfoCircle, FaCrown } from 'react-icons/fa';
import { useUser } from '../Composant/UserContext';
import Head from '../Composant/Head';
import Menus from '../Composant/Menus';

const RoleViewScreen = () => {
  const { id } = useParams();
  const navRouter = useHistory();
  const { getRoleWithDetails } = useUser();
  const roleDetails = getRoleWithDetails ? getRoleWithDetails(id) : null;

  if (!roleDetails) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Menus />
        <Head />
        <div className="lg:pl-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                <FaExclamationTriangle className="text-red-500" size={22} />
              </div>
              <h3 className="font-bold text-slate-900">Rôle non trouvé</h3>
              <p className="text-sm text-slate-500 mt-1 mb-6">Ce rôle n'existe pas dans le contexte local. Essayez via la page détails.</p>
              <div className="flex items-center justify-center gap-2">
                <Link to="/gestion-utilisateurs/roles" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition">
                  <FaArrowLeft size={12} /> Retour à la liste
                </Link>
                <Link to={`/gestion-utilisateurs/roles/${id}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
                  <FaUserShield size={12} /> Voir détails API
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = roleDetails.nom === 'Admin';
  const permissions = roleDetails.permissions || [];
  const users = roleDetails.monutilisateurs || roleDetails.users || [];
  const permCount = permissions.length;
  const userCount = users.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Menus />
      <Head />
      <div className="lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${isAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-indigo-600 to-violet-600'}`}>
                  {isAdmin ? <FaCrown size={16} /> : <FaUserShield size={16} />}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    {roleDetails.nom}
                    <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded-full text-xs font-bold">Vue locale</span>
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{roleDetails.description || 'Aucune description'}</p>
                </div>
              </div>
              <button onClick={() => navRouter.push('/gestion-utilisateurs/roles')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition shrink-0">
                <FaArrowLeft size={13} /> Retour à la liste
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-2"><FaKey size={16} /></div>
              <p className="text-2xl font-bold text-slate-900">{permCount}</p>
              <p className="text-xs text-slate-500">Permissions</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mx-auto mb-2"><FaUsers size={16} /></div>
              <p className="text-2xl font-bold text-slate-900">{userCount}</p>
              <p className="text-xs text-slate-500">Utilisateurs</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center col-span-2 lg:col-span-1">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mx-auto mb-2"><FaInfoCircle size={16} /></div>
              <p className="text-sm font-bold text-slate-900">{isAdmin ? 'Administrateur' : 'Standard'}</p>
              <p className="text-xs text-slate-500">Type</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><FaKey className="text-indigo-600" size={12} /> Permissions</h3>
                {permissions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {permissions.map((p) => (
                      <span key={p.id || p.code} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-semibold">{p.code}</span>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-500 text-center">Aucune permission</div>
                )}
                <div className="mt-6 flex gap-2">
                  <Link to={`/gestion-utilisateurs/roles/${id}`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">Voir détails complets</Link>
                  <Link to={`/gestion-utilisateurs/roles/${id}/modifier`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition">Modifier</Link>
                </div>
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2"><FaUsers className="text-sky-600" size={12} /> Utilisateurs ({userCount})</h3>
                {users.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {users.slice(0, 8).map((u) => (
                      <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold">{(u.prenom?.[0] || '') + (u.nom?.[0] || '')}</div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{u.prenom} {u.nom}</p>
                          <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-6">Aucun utilisateur</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleViewScreen;
