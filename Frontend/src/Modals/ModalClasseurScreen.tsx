// @ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { FaPlus, FaEdit, FaTimes, FaFolder, FaSpinner } from 'react-icons/fa';
import { toast } from "../Composant/Toast";

const ModalClasseurScreen = ({ isOpen, onClose, classeurToEdit = null, onSuccess }) => {
  const [nomClasseur, setNomClasseur] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const token = GetTokenOrRedirect();

  useEffect(() => {
    if (classeurToEdit) { setNomClasseur(classeurToEdit.nom_classeur); setIsEditing(true); }
    else { setNomClasseur(""); setIsEditing(false); }
    setErrors({});
  }, [classeurToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setErrors({});
    if (!token) { toast.error("Vous n'êtes pas authentifié."); return; }
    const perms = JSON.parse(localStorage.getItem('permissions') || '[]');
    if (isEditing && classeurToEdit) {
      if (!perms.includes('modifier_classeur')) { toast.error("Permission 'modifier_classeur' requise"); return; }
    } else {
      if (!perms.includes('creer_classeur')) { toast.error("Permission 'creer_classeur' requise"); return; }
    }
    setLoading(true);
    try {
      if (isEditing && classeurToEdit) {
        await axios.put(`${API_BASE_URL}/classeurs/${classeurToEdit.id}`, { nom_classeur: nomClasseur }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Classeur modifié avec succès');
      } else {
        await axios.post(`${API_BASE_URL}/classeurs`, { nom_classeur: nomClasseur }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Classeur ajouté avec succès');
      }
      setNomClasseur(""); setIsEditing(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      if (error.response?.status === 422 && error.response.data.errors) {
        setErrors(error.response.data.errors);
        const first = Object.values(error.response.data.errors)[0]?.[0];
        if (first) toast.error(first);
      } else if (error.response?.status === 403) toast.error(error.response.data.message || "Permission refusée");
      else if (error.response?.status === 401) toast.error('Session expirée. Veuillez vous reconnecter.');
      else toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally { setLoading(false); }
  };

  const handleCancel = () => { setNomClasseur(""); setErrors({}); setIsEditing(false); onClose(); };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCancel} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-scaleIn">
        <div className="px-6 py-5 bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center">
              <FaFolder className="text-white" size={16} />
            </div>
            <div>
              <h3 className="font-bold text-white leading-none">{isEditing ? "Modifier le Classeur" : "Nouveau Classeur"}</h3>
              <p className="text-xs text-white/80 mt-1">{isEditing ? "Modifiez le nom du classeur" : "Créez un nouveau classeur"}</p>
            </div>
          </div>
          <button onClick={handleCancel} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
            <FaTimes size={14} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nom du classeur <span className="text-rose-500">*</span></label>
            <div className="relative">
              <FaFolder className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" value={nomClasseur} onChange={(e) => setNomClasseur(e.target.value)} placeholder="Ex: Classeur A, Archives 2024..." disabled={loading} className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.nom_classeur ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
            </div>
            {errors.nom_classeur && <p className="mt-2 text-xs text-red-600 flex items-center gap-1"><FaTimes size={10} />{errors.nom_classeur[0]}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleCancel} disabled={loading} className="flex-1 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">Annuler</button>
            <button type="submit" disabled={loading || !nomClasseur.trim()} className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm disabled:opacity-50 transition">
              {loading ? <><FaSpinner className="animate-spin" size={12} /> {isEditing ? 'Modification...' : 'Création...'} </> : <><FaPlus size={12} /> {isEditing ? 'Modifier' : 'Créer'} </>}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}.animate-scaleIn{animation:scaleIn 0.2s ease}`}</style>
    </div>
  );
};

export default ModalClasseurScreen;
