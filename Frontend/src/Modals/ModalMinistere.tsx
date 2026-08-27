// @ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { FaPlus, FaEdit, FaTimes, FaFileInvoice, FaHashtag } from 'react-icons/fa';

const ModalMinistere = ({ isOpen, onClose, articleToEdit = null, onSuccess }) => {
  const [nom, setNom] = useState("");
  const [articleBudgetaire, setArticleBudgetaire] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const token = GetTokenOrRedirect();

  useEffect(() => {
    if (articleToEdit) {
      setNom(articleToEdit.nom || "");
      setArticleBudgetaire(articleToEdit.article_budgetaire || "");
      setIsEditing(true);
    } else {
      setNom("");
      setArticleBudgetaire("");
      setIsEditing(false);
    }
    setErrors({});
  }, [articleToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!token) return;

    const userPermissions = JSON.parse(localStorage.getItem('permissions') || '[]');

    if (isEditing && articleToEdit) {
      if (!userPermissions.includes('modifier_service_assiette')) return;
    } else {
      if (!userPermissions.includes('creer_service_assiette')) return;
    }

    if (!nom || nom.trim() === '') {
      setErrors({ nom: ["Le nom est obligatoire"] });
      return;
    }

    if (!articleBudgetaire || articleBudgetaire.trim() === '') {
      setErrors({ article_budgetaire: ["L'article budgétaire est obligatoire"] });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nom: nom.trim(),
        article_budgetaire: articleBudgetaire.trim(),
      };

      if (isEditing && articleToEdit) {
        await axios.put(`${API_BASE_URL}/update-article/${articleToEdit.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_BASE_URL}/create-article`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setNom("");
      setArticleBudgetaire("");
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
    setNom("");
    setArticleBudgetaire("");
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
            <FaFileInvoice />
            {isEditing ? "Modifier le Service" : "Nouveau Service d'Assiette"}
          </h3>
          <button onClick={handleCancel} className="text-white/80 hover:text-white transition">
            <FaTimes size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Service d'assiette <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500">
                <FaFileInvoice size={14} />
              </span>
              <input
                type="text"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${errors.nom ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200'} bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition`}
                placeholder="Nom du service"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                disabled={loading}
              />
            </div>
            {errors.nom && (
              <p className="mt-1.5 text-xs text-red-500">{errors.nom[0]}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Article budgétaire <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500">
                <FaHashtag size={14} />
              </span>
              <input
                type="text"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${errors.article_budgetaire ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200'} bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition`}
                placeholder="Numéro d'article budgétaire"
                value={articleBudgetaire}
                onChange={(e) => setArticleBudgetaire(e.target.value)}
                disabled={loading}
              />
            </div>
            {errors.article_budgetaire && (
              <p className="mt-1.5 text-xs text-red-500">{errors.article_budgetaire[0]}</p>
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

export default ModalMinistere;
