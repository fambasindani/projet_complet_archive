/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React from 'react';
import { useParams, useHistory, Link } from 'react-router-dom';
import { FaUserShield, FaArrowLeft, FaEdit, FaExclamationTriangle } from 'react-icons/fa';
import { useUser } from '../Composant/UserContext';
import RoleForm from './RoleFormScreen';
import Head from '../Composant/Head';
import Menus from '../Composant/Menus';

const RoleEditScreen = () => {
  const { id } = useParams();
  const navRouter = useHistory();
  const { roles } = useUser();
  const role = roles.find((r) => r.id === id || String(r.id) === String(id));

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Menus />
        <Head />
        <div className="lg:pl-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                <FaExclamationTriangle className="text-red-500" size={24} />
              </div>
              <h3 className="font-bold text-slate-900">Rôle non trouvé</h3>
              <p className="text-sm text-slate-500 mt-1 mb-6">Ce rôle n'existe pas ou a été supprimé.</p>
              <Link to="/gestion-utilisateurs/roles" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition">
                <FaArrowLeft size={13} /> Retour à la liste
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Menus />
      <Head />
      <div className="lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                  <FaEdit size={16} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    Modifier le rôle
                    <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded-full text-xs font-bold">{role.nom}</span>
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">Mise à jour du rôle et de ses permissions</p>
                </div>
              </div>
              <Link to="/gestion-utilisateurs/roles" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition shrink-0">
                <FaArrowLeft size={13} /> Retour à la liste
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
            <div className="p-6 lg:p-8">
              <RoleForm role={role} onSuccess={() => navRouter.push('/gestion-utilisateurs/roles')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleEditScreen;
