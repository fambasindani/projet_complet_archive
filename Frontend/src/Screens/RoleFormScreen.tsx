/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaKey, FaInfoCircle, FaArrowLeft, FaSave, FaSpinner, FaExclamationCircle, FaUserShield, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Link, useParams, useHistory } from 'react-router-dom';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { API_BASE_URL } from '../config';
import { toast } from "../Composant/Toast";
import LoadingSpinner from "../Loading/LoadingSpinner";

const RoleForm = () => {
  const { id } = useParams();
  const navRouter = useHistory();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const token = GetTokenOrRedirect();
  const [formData, setFormData] = useState({ nom: '', description: '', permissions: [] });

  const fetchPermissions = async (page = 1, search = '') => {
    try {
      const params = { page, per_page: pagination.per_page };
      if (search) params.search = search;
      const response = await axios.get(`${API_BASE_URL}/permissions`, { headers: { Authorization: `Bearer ${token}` }, params });
      if (response.data?.success && response.data?.data) {
        setPermissions(response.data.data.data || []);
        setPagination({ current_page: response.data.data.current_page || page, last_page: response.data.data.last_page || 1, total: response.data.data.total || 0, per_page: response.data.data.per_page || 10 });
      }
    } catch (error) {
      toast.error('Impossible de charger les permissions');
    }
  };

  const fetchRole = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/roles/${id}/with-details`, { headers: { Authorization: `Bearer ${token}` } });
      const role = response?.data?.data;
      if (!role || !role.id) { toast.error("Ce rôle n'existe pas ou a été supprimé."); navRouter.push('/gestion-utilisateurs/roles'); return; }
      const permissionIds = Array.isArray(role.permissions) ? role.permissions.filter((p) => p && p.id).map((p) => p.id) : [];
      setFormData({ nom: role.nom || '', description: role.description || '', permissions: permissionIds });
    } catch (err) {
      toast.error('Impossible de charger ce rôle');
      navRouter.push('/gestion-utilisateurs/roles');
    }
  };

  useEffect(() => {
    if (!token) return;
    const init = async () => {
      setLoading(true);
      try { await fetchPermissions(1, ''); if (id) await fetchRole(); } finally { setLoading(false); }
    };
    init();
  }, [token, id]);

  useEffect(() => { if (token && !loading) fetchPermissions(pagination.current_page, searchTerm); }, [pagination.current_page, searchTerm]);

  const handleSearch = (e) => { e.preventDefault(); setSearchTerm(searchInput); setPagination((prev) => ({ ...prev, current_page: 1 })); };
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= pagination.last_page) setPagination((prev) => ({ ...prev, current_page: newPage })); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setErrors({});
    const newErrors = {};
    if (!formData.nom.trim()) newErrors.nom = ['Le nom du rôle est obligatoire'];
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); setSubmitting(false); return; }
    try {
      const dataToSend = { nom: formData.nom.trim(), description: formData.description.trim(), permissions: formData.permissions };
      if (id) {
        await axios.put(`${API_BASE_URL}/roles/${id}`, dataToSend, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Rôle mis à jour avec succès');
        navRouter.push('/gestion-utilisateurs/roles');
      } else {
        const response = await axios.post(`${API_BASE_URL}/roles`, dataToSend, { headers: { Authorization: `Bearer ${token}` } });
        if (response.data?.success) {
          toast.success('Rôle créé avec succès');
          navRouter.push(`/gestion-utilisateurs/roles/${response.data.data.id}`);
        } else throw new Error('Réponse serveur invalide');
      }
    } catch (error) {
      if (error.response?.status === 422) { setErrors(error.response.data.errors || {}); toast.error('Veuillez corriger les erreurs dans le formulaire'); }
      else if (error.response?.status === 403) toast.error("Vous n'avez pas la permission de modifier ce rôle");
      else if (error.response?.status === 404) { toast.error("Le rôle n'existe pas"); navRouter.push('/gestion-utilisateurs/roles'); }
      else toast.error(error.response?.data?.message || error.message);
    } finally { setSubmitting(false); }
  };

  const renderFieldError = (fieldName) => {
    if (!errors[fieldName]) return null;
    return <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1"><FaExclamationCircle size={11} />{Array.isArray(errors[fieldName]) ? errors[fieldName][0] : errors[fieldName]}</p>;
  };

  const groupPermissionsByCategory = () => {
    const grouped = {};
    permissions.forEach((perm) => { if (!perm?.code) return; const cat = perm.code.split('_')[0] || 'Autres'; if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(perm); });
    return grouped;
  };
  const groupedPermissions = groupPermissionsByCategory();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner
          message="Chargement du formulaire..."
          subtitle="Veuillez patienter"
          size="md"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600"><FaUserShield size={16} /></div>
          <div>
            <h2 className="font-bold text-slate-900">{id ? 'Modifier le rôle' : 'Créer un nouveau rôle'}</h2>
            <p className="text-xs text-slate-500">{id ? 'Modifiez les informations du rôle' : 'Définissez un nouveau rôle avec ses permissions'}</p>
          </div>
        </div>
        <Link to="/gestion-utilisateurs/roles" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition"><FaArrowLeft size={12} /> Retour</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 space-y-4">
              <h5 className="font-semibold text-slate-900 text-sm">Informations du rôle</h5>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom du rôle <span className="text-red-500">*</span></label>
                <input type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} disabled={submitting || id === '1'} placeholder="Ex: Administrateur, Éditeur..." className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.nom ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                {renderFieldError('nom')}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} disabled={submitting} placeholder="Décrivez le rôle..." className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none ${errors.description ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                {renderFieldError('description')}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-semibold text-slate-900 text-sm flex items-center gap-2"><FaKey className="text-indigo-600" /> Permissions</h5>
                <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-bold">{formData.permissions.length} sélectionnée(s)</span>
              </div>

              <div className="mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input type="text" placeholder="Rechercher une permission..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
                  </div>
                  <button type="button" onClick={handleSearch} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-black transition"><FaSearch size={13} /></button>
                </div>
              </div>

              <div className="space-y-6 max-h-[520px] overflow-y-auto pr-1">
                {Object.keys(groupedPermissions).length > 0 ? (
                  Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category}>
                      <h6 className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center"><FaKey size={10} className="text-slate-500" /></span>
                        {category.replace(/_/g, ' ')}
                      </h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {perms.map((permission) => {
                          const checked = formData.permissions.includes(permission.id);
                          return (
                            <label key={permission.id} className={`group flex gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${checked ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const newPerms = e.target.checked ? [...formData.permissions, permission.id] : formData.permissions.filter((pid) => pid !== permission.id);
                                  setFormData({ ...formData, permissions: newPerms });
                                }}
                                disabled={submitting || id === '1'}
                                className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold leading-tight ${checked ? 'text-indigo-900' : 'text-slate-900'}`}>{permission.code}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{permission.description || 'Aucune description'}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-2 text-sm text-amber-800">
                    <FaInfoCircle /> Aucune permission trouvée.
                  </div>
                )}
              </div>

              {pagination.last_page > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Page {pagination.current_page} sur {pagination.last_page} • {pagination.total} permissions</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"><FaChevronLeft size={11} /></button>
                    {[...Array(pagination.last_page)].map((_, i) => {
                      const pageNum = i + 1;
                      if (pageNum === 1 || pageNum === pagination.last_page || (pageNum >= pagination.current_page - 2 && pageNum <= pagination.current_page + 2)) {
                        return <button key={pageNum} type="button" onClick={() => handlePageChange(pageNum)} className={`w-8 h-8 rounded-lg text-xs font-bold border transition ${pagination.current_page === pageNum ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{pageNum}</button>;
                      } else if (pageNum === pagination.current_page - 3 || pageNum === pagination.current_page + 3) return <span key={`e-${pageNum}`} className="px-1 text-slate-400">…</span>;
                      return null;
                    })}
                    <button type="button" onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"><FaChevronRight size={11} /></button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100"><h6 className="font-semibold text-slate-900 text-sm">Récapitulatif</h6></div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 mb-1">Nom du rôle</p>
                    <p className="font-bold text-slate-900 text-sm">{formData.nom || <span className="text-slate-400 font-normal">Non défini</span>}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 mb-2">Permissions sélectionnées</p>
                    {formData.permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                        {formData.permissions.map((permId) => {
                          const perm = permissions.find((p) => p.id === permId);
                          return perm ? <span key={perm.id} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[11px] font-semibold">{perm.code}</span> : null;
                        })}
                      </div>
                    ) : <p className="text-xs text-slate-400">Aucune permission sélectionnée</p>}
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-2">
                    <FaInfoCircle className="text-slate-400 mt-0.5 shrink-0" size={12} />
                    <p className="text-xs text-slate-600"><span className="font-semibold">Conseil :</span> Sélectionnez uniquement les permissions nécessaires.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Link to="/gestion-utilisateurs/roles" className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium text-center hover:bg-slate-50 transition">Annuler</Link>
                <button type="submit" disabled={submitting} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
                  {submitting ? (<><FaSpinner className="animate-spin" size={12} />{id ? 'Mise à jour...' : 'Création...'}</>) : (<><FaSave size={12} />{id ? 'Mettre à jour' : 'Créer le rôle'}</>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
                
</div>
  );
};

export default RoleForm;
