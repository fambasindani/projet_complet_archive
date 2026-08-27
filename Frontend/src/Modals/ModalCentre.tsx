// @ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { FaPlus, FaEdit, FaTimes, FaBuilding, FaAlignLeft, FaSpinner, FaFolder } from 'react-icons/fa';
import { toast } from "../Composant/Toast";

const ModalCentre = ({ isOpen, onClose, centreToEdit = null, ministeres = [], onSuccess }) => {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [ministereId, setMinistereId] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const token = GetTokenOrRedirect();

  useEffect(() => {
    if (centreToEdit) { setNom(centreToEdit.nom || ""); setDescription(centreToEdit.description || ""); setMinistereId(String(centreToEdit.id_ministere || "")); setIsEditing(true); }
    else { setNom(""); setDescription(""); setMinistereId(""); setIsEditing(false); }
    setErrors({});
  }, [centreToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setErrors({});
    if (!token) { toast.error("Non authentifié"); return; }
    const perms = JSON.parse(localStorage.getItem('permissions') || '[]');
    if (isEditing) { if (!perms.includes('modifier_centre')) { toast.error("Permission 'modifier_centre' requise"); return; } }
    else { if (!perms.includes('creer_centre')) { toast.error("Permission 'creer_centre' requise"); return; } }
    if (!ministereId) { setErrors({ id_ministere: ["Service d'assiette requis"] }); return; }
    if (!nom.trim()) { setErrors({ nom: ["Nom requis"] }); return; }
    setLoading(true);
    try {
      const payload = { nom: nom.trim(), description: description.trim(), id_ministere: parseInt(ministereId) };
      if (isEditing && centreToEdit) {
        await axios.put(`${API_BASE_URL}/centre_ordonnancements/${centreToEdit.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Centre modifié avec succès");
      } else {
        await axios.post(`${API_BASE_URL}/centre_ordonnancements`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Centre ajouté avec succès");
      }
      setNom(""); setDescription(""); setMinistereId(""); setIsEditing(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      if (error.response?.status === 422 && error.response.data.errors) {
        setErrors(error.response.data.errors);
        const first = Object.values(error.response.data.errors)[0]?.[0];
        if (first) toast.error(first);
      } else if (error.response?.status === 403) toast.error(error.response.data.message || "Permission refusée");
      else if (error.response?.status === 401) toast.error("Session expirée");
      else toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally { setLoading(false); }
  };

  const handleCancel = () => { setNom(""); setDescription(""); setMinistereId(""); setErrors({}); setIsEditing(false); onClose(); };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCancel} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-scaleIn">
        <div className="px-6 py-5 bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center">
              <FaBuilding className="text-white" size={16} />
            </div>
            <div>
              <h3 className="font-bold text-white leading-none">{isEditing ? "Modifier le Centre" : "Nouveau Centre"}</h3>
              <p className="text-xs text-white/80 mt-1">{isEditing ? "Modifiez les informations" : "Créez un nouveau centre"}</p>
            </div>
          </div>
          <button onClick={handleCancel} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
            <FaTimes size={14} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Service d'assiette <span className="text-rose-500">*</span></label>
            <div className="relative">
              <FaFolder className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <select value={ministereId} onChange={(e) => setMinistereId(e.target.value)} disabled={loading} className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.id_ministere ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                <option value="">-- Sélectionnez --</option>
                {ministeres.map((m) => (<option key={m.id} value={String(m.id)}>{m.nom}</option>))}
              </select>
            </div>
            {errors.id_ministere && <p className="mt-1.5 text-xs text-red-600">{errors.id_ministere[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nom du centre <span className="text-rose-500">*</span></label>
            <div className="relative">
              <FaBuilding className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du centre" disabled={loading} className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.nom ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
            </div>
            {errors.nom && <p className="mt-1.5 text-xs text-red-600">{errors.nom[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <div className="relative">
              <FaAlignLeft className="absolute left-3.5 top-3.5 text-slate-400" size={12} />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optionnelle)" disabled={loading} rows={3} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleCancel} disabled={loading} className="flex-1 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">Annuler</button>
            <button type="submit" disabled={loading || !nom.trim() || !ministereId} className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm disabled:opacity-50 transition">
              {loading ? <><FaSpinner className="animate-spin" size={12} /> {isEditing ? 'Modification...' : 'Création...'} </> : <><FaPlus size={12} /> {isEditing ? 'Modifier' : 'Créer'} </>}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}.animate-scaleIn{animation:scaleIn 0.2s ease}`}</style>
    </div>
  );
};

export default ModalCentre;
