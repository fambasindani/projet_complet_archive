/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useHistory, Link } from 'react-router-dom';
import axios from 'axios';
import { FaBuilding, FaInfoCircle, FaArrowLeft, FaSave, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { toast } from "../Composant/Toast";
import LoadingSpinner from "../Loading/LoadingSpinner";

const DirectionForm = ({ direction: propDirection, onSuccess }: any) => {
  const { id: paramId } = useParams();
  const navRouter = useHistory();
  const token = GetTokenOrRedirect();
  // id can come from route params or propDirection
  const id = paramId || propDirection?.id;
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ sigle: '', nom: '' });

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  useEffect(() => {
    if (propDirection) {
      setFormData({ sigle: propDirection.sigle || '', nom: propDirection.nom || '' });
      return;
    }
    if (isEditMode && token) loadDirection();
  }, [isEditMode, token, propDirection?.id]);

  const loadDirection = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/departements/${id}`, { headers: getAuthHeaders() });
      if (response.data.success) {
        const d = response.data.data;
        setFormData({ sigle: d.sigle || '', nom: d.nom || '' });
      } else throw new Error('Direction non trouvée');
    } catch (error) {
      if (error.response?.status === 401) return;
      toast.error("Cette direction n'existe pas ou a été supprimée."); setTimeout(() => navRouter.push('/gestion-utilisateurs/directions'), 1500);
    } finally { setLoading(false); }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.sigle.trim()) newErrors.sigle = ['Le sigle est requis'];
    else if (formData.sigle.trim().length > 10) newErrors.sigle = ['Le sigle ne doit pas dépasser 10 caractères'];
    if (!formData.nom.trim()) newErrors.nom = ['Le nom est requis'];
    else if (formData.nom.trim().length > 100) newErrors.nom = ['Le nom ne doit pas dépasser 100 caractères'];
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setErrors({});
    try {
      const dataToSend = { sigle: formData.sigle.trim().toUpperCase(), nom: formData.nom.trim() };
      if (isEditMode) {
        const response = await axios.put(`${API_BASE_URL}/departements/${id}`, dataToSend, { headers: getAuthHeaders() });
        if (response.data.success) {
          toast.success('Direction mise à jour avec succès'); {
            if (onSuccess) onSuccess();
            else navRouter.push(`/gestion-utilisateurs/directions/${id}`);
          };
        }
      } else {
        const response = await axios.post(`${API_BASE_URL}/departements`, dataToSend, { headers: getAuthHeaders() });
        if (response.data.success) {
          const newDirectionId = response.data.data.id;
          toast.success('Direction créée avec succès'); {
            if (onSuccess) onSuccess();
            else navRouter.push(`/gestion-utilisateurs/directions/${newDirectionId}`);
          };
        }
      }
    } catch (error) {
      if (error.response?.status === 401) return;
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        toast.error('Veuillez corriger les erreurs dans le formulaire');
      } else if (error.response?.status === 409) {
        toast.error("Ce sigle est déjà utilisé par une autre direction");
      } else if (error.response?.status === 404 && isEditMode) {
        toast.error("La direction n'existe plus");
        navRouter.push('/gestion-utilisateurs/directions');
      } else toast.error(error.response?.data?.message || error.message);
    } finally { setSubmitting(false); }
  };

  const renderFieldError = (fieldName) => {
    if (!errors[fieldName]) return null;
    return <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1"><FaExclamationCircle size={11} />{Array.isArray(errors[fieldName]) ? errors[fieldName][0] : errors[fieldName]}</p>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner
          message="Chargement de la direction..."
          subtitle="Veuillez patienter"
          size="md"
        />
      </div>
    );
  }

  return (
    <div>
      {/* header interne */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <FaBuilding size={16} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 leading-tight">{isEditMode ? 'Modifier la direction' : 'Créer une nouvelle direction'}</h2>
            <p className="text-xs text-slate-500">{isEditMode ? 'Modifiez les informations de la direction' : 'Définissez une nouvelle direction'}</p>
          </div>
        </div>
        {/* Back link hidden when embedded in Create/Edit (they have own header) -> show only when used as standalone route without onSuccess? Keep subtle */}
        {!onSuccess && (
          <Link to={isEditMode ? `/gestion-utilisateurs/directions/${id}` : '/gestion-utilisateurs/directions'} className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            <FaArrowLeft size={12} /> {isEditMode ? 'Retour aux détails' : 'Retour à la liste'}
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
          <h5 className="font-semibold text-slate-900 text-sm mb-5 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600"><FaBuilding size={12} /></span>
            Informations de la direction
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Sigle <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.sigle}
                onChange={(e) => { setFormData({ ...formData, sigle: e.target.value }); if (errors.sigle) setErrors((prev) => ({ ...prev, sigle: undefined })); }}
                required placeholder="Ex: DRH, DSI..." maxLength={10} disabled={submitting}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium uppercase placeholder:normal-case focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.sigle ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
              />
              {renderFieldError('sigle')}
              <p className="text-[11px] text-slate-400 mt-1">Max 10 caractères, auto-majuscules</p>
            </div>
            <div className="md:col-span-8">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom complet <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => { setFormData({ ...formData, nom: e.target.value }); if (errors.nom) setErrors((prev) => ({ ...prev, nom: undefined })); }}
                required placeholder="Ex: Direction des Ressources Humaines" maxLength={100} disabled={submitting}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.nom ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
              />
              {renderFieldError('nom')}
            </div>
          </div>
          <div className="mt-5 bg-white border border-slate-200 rounded-xl p-3 flex gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0"><FaInfoCircle size={14} /></div>
            <p className="text-xs text-slate-600 leading-relaxed"><span className="font-semibold text-slate-900">Conseil :</span> Le sigle doit être unique et représentatif. Il sera utilisé pour identifier rapidement la direction.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 border-t border-slate-100">
          <Link to={isEditMode ? `/gestion-utilisateurs/directions/${id}` : '/gestion-utilisateurs/directions'} className="inline-flex justify-center items-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
            Annuler
          </Link>
          <button type="submit" disabled={submitting} className="inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed">
            {submitting ? (<><FaSpinner className="animate-spin" />{isEditMode ? 'Mise à jour...' : 'Création...'}</>) : (<><FaSave size={14} />{isEditMode ? 'Mettre à jour' : 'Créer la direction'}</>)}
          </button>
        </div>
      </form>
                
</div>
  );
};

export default DirectionForm;
