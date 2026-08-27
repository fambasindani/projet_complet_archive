// @ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { FaPlus, FaEdit, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';

const ModalEmplacementScreen = ({ isOpen, onClose, emplacementToEdit = null, onSuccess }) => {
  const [nomEmplacement, setNomEmplacement] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const token = GetTokenOrRedirect();

  useEffect(() => {
    if (emplacementToEdit) {
      setNomEmplacement(emplacementToEdit.nom_emplacement);
      setIsEditing(true);
    } else {
      setNomEmplacement("");
      setIsEditing(false);
    }
    setErrors({});
  }, [emplacementToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!token) {
      return;
    }

    const userPermissions = JSON.parse(localStorage.getItem('permissions') || '[]');

    if (isEditing && emplacementToEdit) {
      if (!userPermissions.includes('modifier_emplacement')) return;
    } else {
      if (!userPermissions.includes('creer_emplacement')) return;
    }

    if (!nomEmplacement || nomEmplacement.trim() === '') {
      setErrors({ nom_emplacement: ["Veuillez saisir un nom d'emplacement"] });
      return;
    }

    setLoading(true);

    try {
      const payload = { nom_emplacement: nomEmplacement.trim() };

      if (isEditing && emplacementToEdit) {
        await axios.put(`${API_BASE_URL}/emplacements/${emplacementToEdit.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_BASE_URL}/emplacements`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setNomEmplacement("");
      setIsEditing(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 422 && data.errors) {
          setErrors(data.errors);
        } else if (status === 401) {
          localStorage.clear();
          window.location.href = '/';
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNomEmplacement("");
    setErrors({});
    setIsEditing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleCancel} />
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FaMapMarkerAlt />
            {isEditing ? "Modifier l'Emplacement" : "Nouvel Emplacement"}
          </h3>
          <button onClick={handleCancel} className="text-white/80 hover:text-white transition">
            <FaTimes size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nom de l'emplacement <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500">
                <FaMapMarkerAlt size={14} />
              </span>
              <input
                type="text"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${errors.nom_emplacement ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200'} bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition`}
                placeholder="Nom de l'emplacement"
                value={nomEmplacement}
                onChange={(e) => setNomEmplacement(e.target.value)}
                disabled={loading}
              />
            </div>
            {errors.nom_emplacement && (
              <p className="mt-1.5 text-xs text-red-500">{errors.nom_emplacement[0]}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isEditing ? (
                <><FaEdit size={12} /> Modifier</>
              ) : (
                <><FaPlus size={12} /> Ajouter</>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
              disabled={loading}
            >
              <FaTimes size={12} /> Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEmplacementScreen;
