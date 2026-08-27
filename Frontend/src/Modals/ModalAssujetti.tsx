// @ts-nocheck
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
  FaTimes, FaPlus, FaArrowLeft, FaSearch, FaSave, FaEdit,
  FaBuilding, FaPhone, FaMap, FaIdCard, FaEnvelope,
  FaSpinner, FaUser
} from 'react-icons/fa';
import { toast } from "../Composant/Toast";

const ModalAssujetti = ({ isOpen, onClose, selectnom }) => {
  const token = localStorage.getItem('token');
  const [assujettis, setAssujettis] = useState([]);
  const [formData, setFormData] = useState({
    nom_raison_sociale: '',
    telephone: '',
    bp: '',
    numero_nif: '',
    email: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTable, setShowTable] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    nom_raison_sociale: false,
    telephone: false,
    email: false
  });

  useEffect(() => {
    if (isOpen) {
      fetchAssujettis();
      setShowTable(true);
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const fetchAssujettis = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/assujettis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssujettis(res.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des assujettis');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      fetchAssujettis();
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/assujettis/search?search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssujettis(res.data.data);
    } catch (error) {
      toast.error('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: !value.trim() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {
      nom_raison_sociale: !formData.nom_raison_sociale.trim(),
      telephone: !formData.telephone.trim(),
      email: formData.email && !/\S+@\S+\.\S+/.test(formData.email),
    };
    setErrors(newErrors);
    if (newErrors.nom_raison_sociale || newErrors.telephone || newErrors.email) return;

    setSubmitting(true);
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/assujettis/${currentId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Assujetti mis à jour avec succès');
      } else {
        await axios.post(`${API_BASE_URL}/assujettis`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Assujetti ajouté avec succès');
      }
      fetchAssujettis();
      resetForm();
      setShowTable(true);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ nom_raison_sociale: '', telephone: '', bp: '', numero_nif: '', email: '' });
    setIsEditing(false);
    setCurrentId(null);
    setErrors({ nom_raison_sociale: false, telephone: false, email: false });
  };

  const handleEdit = (assujetti) => {
    setFormData({
      nom_raison_sociale: assujetti.nom_raison_sociale,
      telephone: assujetti.telephone,
      bp: assujetti.bp || '',
      numero_nif: assujetti.numero_nif || '',
      email: assujetti.email || '',
    });
    setIsEditing(true);
    setCurrentId(assujetti.id);
    setShowTable(false);
  };

  const handlePlus = (assujetti) => {
    selectnom({ nom_raison_sociale: assujetti.nom_raison_sociale, id: assujetti.id });
    onClose();
  };

  const totalItems = assujettis.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = assujettis.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-modalIn">
        {/* Header */}
        <div className="px-6 py-4 text-white shrink-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <FaBuilding size={18} />
              </div>
              <h5 className="text-lg font-bold">Gestion des Assujettis</h5>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
            >
              <FaTimes size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Toggle button */}
          <div className="mb-4">
            <button
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                showTable
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
              onClick={() => { resetForm(); setShowTable(!showTable); }}
            >
              {showTable ? <><FaPlus /> Ajouter un assujetti</> : <><FaArrowLeft /> Retour à la liste</>}
            </button>
          </div>

          {/* Form */}
          {!showTable && (
            <form onSubmit={handleSubmit} className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h6 className="font-bold mb-4 text-indigo-600 flex items-center gap-2">
                {isEditing ? 'Modifier l\'assujetti' : 'Nouvel assujetti'}
              </h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nom Raison Sociale *</label>
                  <div className="relative">
                    <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                      name="nom_raison_sociale"
                      placeholder="Nom Raison Sociale"
                      value={formData.nom_raison_sociale}
                      onChange={handleChange}
                      className={`w-full border rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.nom_raison_sociale ? 'border-red-400' : 'border-slate-200'}`}
                    />
                  </div>
                  {errors.nom_raison_sociale && <p className="text-red-500 text-xs mt-1">Le nom raison sociale est obligatoire.</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Téléphone *</label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                      name="telephone"
                      placeholder="Téléphone"
                      value={formData.telephone}
                      onChange={handleChange}
                      className={`w-full border rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.telephone ? 'border-red-400' : 'border-slate-200'}`}
                    />
                  </div>
                  {errors.telephone && <p className="text-red-500 text-xs mt-1">Le téléphone est obligatoire.</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">BP</label>
                  <div className="relative">
                    <FaMap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                      name="bp"
                      placeholder="BP"
                      value={formData.bp}
                      onChange={handleChange}
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Numéro NIF</label>
                  <div className="relative">
                    <FaIdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                      name="numero_nif"
                      placeholder="Numéro NIF"
                      value={formData.numero_nif}
                      onChange={handleChange}
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full border rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.email ? 'border-red-400' : 'border-slate-200'}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">Format de l'email invalide.</p>}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition" onClick={() => { resetForm(); setShowTable(true); }} disabled={submitting}>
                  Annuler
                </button>
                <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold shadow-sm transition" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} disabled={submitting}>
                  {submitting ? <><FaSpinner className="animate-spin" /> {isEditing ? 'Mise à jour...' : 'Création...'}</> : <><FaSave /> {isEditing ? 'Mettre à jour' : 'Ajouter'}</>}
                </button>
              </div>
            </form>
          )}

          {/* Table */}
          {showTable && (
            <div>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1 max-w-md">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    placeholder="Rechercher par nom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-semibold shadow-sm transition" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} onClick={handleSearch}>
                  <FaSearch /> Rechercher
                </button>
                {searchTerm && (
                  <button className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition" onClick={() => { setSearchTerm(''); fetchAssujettis(); }}>
                    <FaTimes />
                  </button>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Nom Raison Sociale</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Téléphone</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan="3" className="text-center py-8"><FaSpinner className="animate-spin text-indigo-600 mx-auto" size={28} /><p className="text-slate-500 mt-2 text-sm">Chargement...</p></td></tr>
                    ) : currentItems.length === 0 ? (
                      <tr><td colSpan="3" className="text-center py-8"><FaBuilding className="mx-auto text-slate-300 mb-2" size={32} /><p className="text-slate-500 text-sm">Aucun assujetti trouvé</p></td></tr>
                    ) : currentItems.map((assujetti) => (
                      <tr key={assujetti.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                              <FaBuilding className="text-indigo-600" size={14} />
                            </div>
                            <span className="font-medium text-slate-800">{assujetti.nom_raison_sociale}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{assujetti.telephone}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button className="inline-flex items-center gap-1 px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition" onClick={() => handleEdit(assujetti)}>
                              <FaEdit size={12} /> Modifier
                            </button>
                            <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition" onClick={() => handlePlus(assujetti)}>
                              <FaPlus size={12} /> Sélectionner
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-slate-500">
                    Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, totalItems)} sur {totalItems}
                  </p>
                  <div className="flex gap-1">
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 hover:bg-slate-50 disabled:opacity-40" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                      Préc.
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)).map((pageNum, idx, arr) => (
                      <React.Fragment key={pageNum}>
                        {idx > 0 && pageNum - arr[idx - 1] > 1 && <span className="px-2 py-1.5 text-xs text-slate-400">...</span>}
                        <button
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${currentPage === pageNum ? 'text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                          style={currentPage === pageNum ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } : {}}
                          onClick={() => paginate(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </React.Fragment>
                    ))}
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 hover:bg-slate-50 disabled:opacity-40" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
                      Suiv.
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
          <button type="button" className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-100 transition" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-modalIn { animation: modalIn 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default ModalAssujetti;
