/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FaBuilding, FaArrowLeft, FaPlus } from 'react-icons/fa';
import DirectionForm from './DirectionFormScreen';


const DirectionCreateScreen = () => {
  const navRouter = useHistory();

  return (
    <div className="max-w-7xl mx-auto py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-slate-500">
              <Link to="/gestion-utilisateurs/directions" className="hover:text-indigo-600 transition">Directions</Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-medium">Créer</span>
            </nav>

            {/* Header premium */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <FaBuilding size={18} />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2.5 flex-wrap">
                      Créer une nouvelle direction
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold tracking-wide">
                        <FaPlus size={10} />
                        Nouveau
                      </span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Définissez une nouvelle direction pour l'organisation</p>
                  </div>
                </div>
                <Link
                  to="/gestion-utilisateurs/directions"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition shrink-0 shadow-sm"
                >
                  <FaArrowLeft size={13} />
                  Retour à la liste
                </Link>
              </div>
            </div>

            {/* Form card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500" />
              <div className="p-6 lg:p-8">
                <DirectionForm onSuccess={() => navRouter.push('/gestion-utilisateurs/directions')} />
              </div>
            </div>

            <p className="text-center text-xs text-slate-400">
              Les champs marqués d'un <span className="text-red-500 font-bold">*</span> sont obligatoires
            </p>
          </div>
        </div>
  );
};

export default DirectionCreateScreen;
