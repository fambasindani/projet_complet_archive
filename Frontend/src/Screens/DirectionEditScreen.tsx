/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React from 'react';
import { useParams, useHistory, Link } from 'react-router-dom';
import { FaBuilding, FaArrowLeft, FaEdit, FaPen } from 'react-icons/fa';
import { useUser } from '../Composant/UserContext';
import DirectionForm from './DirectionFormScreen';


const DirectionEditScreen = () => {
  const { id } = useParams();
  const navRouter = useHistory();
  const { directions } = useUser();

  const direction = directions?.find((dir) => String(dir.id) === String(id));

  return (
    <div className="max-w-7xl mx-auto py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-slate-500">
              <Link to="/gestion-utilisateurs/directions" className="hover:text-indigo-600 transition">Directions</Link>
              <span className="text-slate-300">/</span>
              <Link to={`/gestion-utilisateurs/directions/${id}`} className="hover:text-indigo-600 transition truncate max-w-[160px]">{direction?.sigle || 'Détail'}</Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-medium">Modifier</span>
            </nav>

            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                    <FaEdit size={16} />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                      Modifier la direction
                      {direction?.sigle && (
                        <span className="inline-flex items-center px-2.5 py-1 bg-slate-900 text-white rounded-full text-xs font-bold tracking-widest">
                          {direction.sigle}
                        </span>
                      )}
                      {!direction?.sigle && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-bold">
                          <FaPen size={10} /> Édition
                        </span>
                      )}
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5 truncate max-w-md">
                      {direction ? `Édition de "${direction.nom}"` : "Modifiez les informations de la direction"}
                    </p>
                  </div>
                </div>
                <Link
                  to={direction ? `/gestion-utilisateurs/directions/${id}` : '/gestion-utilisateurs/directions'}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition shrink-0 shadow-sm"
                >
                  <FaArrowLeft size={13} />
                  {direction ? 'Retour aux détails' : 'Retour'}
                </Link>
              </div>
            </div>

            {/* Form card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
              <div className="p-6 lg:p-8">
                <DirectionForm direction={direction} onSuccess={() => navRouter.push(`/gestion-utilisateurs/directions/${id}`)} />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <FaBuilding className="text-slate-300" size={12} />
              <span>Modification sécurisée — les changements sont tracés</span>
            </div>
          </div>
        </div>
  
  );
};

export default DirectionEditScreen;
