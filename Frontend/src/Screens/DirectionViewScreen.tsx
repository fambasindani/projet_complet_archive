/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useParams, useHistory, Link } from 'react-router-dom';
import { useUser } from '../Composant/UserContext';
import DirectionDetailScreen from './DirectionDetailScreen';

import { FaBuilding, FaArrowLeft, FaExclamationCircle, FaSearch, FaSpinner } from 'react-icons/fa';
import Menus from 'Composant/Menus';
import Head from 'Composant/Head';
import LoadingSpinner from "../Loading/LoadingSpinner";

const DirectionViewScreen = () => {
  const { id } = useParams();
  const navRouter = useHistory();
  const { getDirectionWithDetails } = useUser();
  const [loading, setLoading] = useState(true);
  const [directionDetails, setDirectionDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('📱 DirectionViewScreen - id reçu:', id);
    console.log('📱 DirectionViewScreen - type de id:', typeof id);

    try {
      const details = getDirectionWithDetails(id);
      console.log('📱 DirectionViewScreen - Détails retournés:', details);

      if (details) {
        setDirectionDetails(details);
        setError(null);
      } else {
        setError(`Aucune direction trouvée avec l'ID: ${id}`);
      }
    } catch (err) {
      console.error('❌ Erreur dans getDirectionWithDetails:', err);
      setError(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [id, getDirectionWithDetails]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Menus />
        <Head />
        <div className="lg:pl-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <LoadingSpinner
                message="Chargement de la direction..."
                subtitle={`Recherche ID: ${id}`}
                size="lg"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Menus />
        <Head />
        <div className="lg:pl-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500" />
                <div className="p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mx-auto">
                    <FaExclamationCircle size={22} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">Erreur</h3>
                  <p className="mt-2 text-sm text-slate-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      onClick={() => navRouter.push('/gestion-utilisateurs/directions')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
                    >
                      <FaArrowLeft size={12} /> Retour à la liste
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
                    >
                      <FaSearch size={12} /> Réessayer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!directionDetails) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Menus />
        <Head />
        <div className="lg:pl-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                <div className="p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mx-auto">
                    <FaBuilding size={20} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">Direction non trouvée</h3>
                  <p className="mt-2 text-sm text-slate-600">La direction avec l'ID <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">"{id}"</span> n'existe pas.</p>
                  <p className="text-xs text-slate-400 mt-1">Vérifiez l'URL ou retournez à la liste des directions.</p>
                  <button
                    onClick={() => navRouter.push('/gestion-utilisateurs/directions')}
                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
                  >
                    <FaArrowLeft size={12} /> Retour à la liste
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DirectionDetailScreen
      direction={directionDetails}
      onBack={() => navRouter.push('/gestion-utilisateurs/directions')}
    />
  );
};

export default DirectionViewScreen;
