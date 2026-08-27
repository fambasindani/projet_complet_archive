/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React from 'react';
import { useHistory, Link } from 'react-router-dom';
import { FaUserShield, FaArrowLeft, FaPlus, FaKey } from 'react-icons/fa';
import RoleForm from './RoleFormScreen';

const RoleCreateScreen = () => {
  const navRouter = useHistory();
  return (
    <div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg">
                  <FaUserShield size={18} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    Créer un nouveau rôle
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                      <FaPlus size={10} /> Nouveau
                    </span>
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <FaKey size={11} /> Définissez un rôle avec ses permissions associées
                  </p>
                </div>
              </div>
              <Link to="/gestion-utilisateurs/roles" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition shrink-0">
                <FaArrowLeft size={13} /> Retour à la liste
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500" />
            <div className="p-6 lg:p-8">
              <RoleForm onSuccess={() => navRouter.push('/gestion-utilisateurs/roles')} />
            </div>
          </div>
    </div>
  );
};

export default RoleCreateScreen;
