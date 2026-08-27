/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useEffect, useState } from "react";
import axios from "axios";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import Droplist from "../Composant/DropList";
import {
  FaUsers,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaSpinner,
  FaExclamationCircle,
  FaChevronLeft,
  FaChevronRight,
  FaUserPlus,
  FaShieldAlt,
  FaBuilding,
  FaEnvelope,
  FaLock,
  FaTimes,
  FaSave,
  FaUser,
} from "react-icons/fa";
import { toast } from "../Composant/Toast";
import ConfirmModal from "../Modals/ConfirmModal";
import LoadingSpinner from "../Loading/LoadingSpinner";


const UtilisateurScreen = () => {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [directions, setDirections] = useState([]);
  const [notes, setNotes] = useState([]);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [entreprise, setEntreprise] = useState(null);
  const [entrepriseSelectionnee, setEntrepriseSelectionnee] = useState(null);
  const [idDirection, setIdDirection] = useState(null);
  const [idNote, setIdNote] = useState(null);

  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [utilisateurEnEdition, setUtilisateurEnEdition] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [visible, setvisible] = useState(false);

  const token = GetTokenOrRedirect();
    const [confirmItem, setConfirmItem] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);


  useEffect(() => {
    if (token) {
      fetchUtilisateurs();
      fetchRoles();
      fetchDirections();
      fetchNotes();
    }
  }, [pagination.current_page, token]);

  const fetchUtilisateurs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/utilisateurs?page=${pagination.current_page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUtilisateurs(res.data.data || []);
      setPagination({ current_page: res.data.current_page, last_page: res.data.last_page });
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    setRoles(["admin", "utilisateur", "encodeur"]);
  };

  const fetchDirections = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/direction`, { headers: { Authorization: `Bearer ${token}` } });
      setDirections(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des directions");
    }
  };

  const fetchNotes = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/centre`, { headers: { Authorization: `Bearer ${token}` } });
      setNotes(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des notes");
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const validationErrors = {};
    if (!nom) validationErrors.nom = ["Le nom est obligatoire."];
    if (!prenom) validationErrors.prenom = ["Le prénom est obligatoire."];
    if (!email) validationErrors.email = ["L'email est obligatoire."];
    if (!password) validationErrors.password = ["Le mot de passe est obligatoire."];
    if (!role) validationErrors.role = ["Le rôle est obligatoire."];
    if (entreprise === null) validationErrors.entreprise = ["Le type d'entreprise est obligatoire."];
    if (entrepriseSelectionnee === 1 && !idNote) validationErrors.id_note = ["La note est obligatoire."];
    if (entrepriseSelectionnee === 0 && !idDirection) validationErrors.id_direction = ["La direction est obligatoire."];
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      const payload = { nom, prenom, email, password, role, entreprise, id_direction: idDirection, id_note: idNote };
      if (utilisateurEnEdition) {
        await axios.put(`${API_BASE_URL}/utilisateurs/${utilisateurEnEdition}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Utilisateur mis à jour avec succès");
      } else {
        await axios.post(`${API_BASE_URL}/utilisateurs`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Utilisateur ajouté avec succès");
      }
      resetForm();
      fetchUtilisateurs();
      setIsFormVisible(false);
    } catch (error) {
      if (error.response?.data?.errors) setErrors(error.response.data.errors);
      else toast.error(error.response?.data?.message || "Une erreur est survenue");
    }
  };

  const handleEdit = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/utilisateurs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNom(res.data.nom || "");
      setPrenom(res.data.prenom || "");
      setEmail(res.data.email || "");
      setRole(res.data.role || "");
      setEntreprise(res.data.entreprise ?? null);
      setEntrepriseSelectionnee(res.data.entreprise ?? null);
      setIdDirection(res.data.id_direction ?? null);
      setIdNote(res.data.id_note ?? null);
      setUtilisateurEnEdition(id);
      setPassword("monpassword");
      setIsFormVisible(true);
      setvisible(false);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement de l'utilisateur");
    }
  };

  const handleDelete = (id) => {
        if (!token) { toast.error("Vous n'êtes pas authentifié. Veuillez vous reconnecter."); return; }
        const _item = utilisateurs.find((x) => x.id === id);
        if (_item) setConfirmItem(_item); else setConfirmItem({ id });
    };

    const confirmDelete = async () => {
        if (!confirmItem || !token) return;
        setConfirmLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/item/${confirmItem.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Désactivé avec succès");
            setConfirmItem(null);
            fetchUtilisateurs();
        } catch (error) {
            let errorMessage = "Erreur lors de la désactivation.";
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;
                if (status === 403) errorMessage = data?.message || "Permission refusée.";
                else if (status === 404) errorMessage = data?.message || "Élément non trouvé.";
                else if (status === 401) errorMessage = "Session expirée. Veuillez vous reconnecter.";
                else if (data?.message) errorMessage = data.message;
            } else if (error.request) errorMessage = "Impossible de contacter le serveur.";
            else errorMessage = error.message || errorMessage;
            toast.error(errorMessage);
            console.error(error);
        } finally {
            setConfirmLoading(false);
        }
    };
;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.last_page) setPagination((prev) => ({ ...prev, current_page: page }));
  };

  const resetForm = () => {
    setNom("");
    setPrenom("");
    setEmail("");
    setPassword("");
    setRole("");
    setEntreprise(null);
    setEntrepriseSelectionnee(null);
    setIdDirection(null);
    setIdNote(null);
    setUtilisateurEnEdition(null);
    setErrors({});
  };

  const filteredUtilisateurs = utilisateurs.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.nom && u.nom.toLowerCase().includes(q)) || (u.prenom && u.prenom.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q));
  });

  const FieldError = ({ msg }) => msg ? <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1"><FaExclamationCircle size={11} />{msg}</p> : null;

  const SelectField = ({ value, onChange, options, placeholder, error }) => (
    <div>
      <select value={value} onChange={onChange} className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${error ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
        <option value="">{placeholder}</option>
        {options.map(opt => <option key={opt.id} value={opt.id}>{opt.nom || opt.nom_emplacement || "Option"}</option>)}
      </select>
      <FieldError msg={error} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Menus />
      <Head />
      <div className="lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* HEADER */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                  <FaUsers size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gestion des Utilisateurs</h1>
                  <p className="text-sm text-slate-500">Administration des comptes • Direction & Notes de perception</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (isFormVisible) {
                    setIsFormVisible(false);
                    resetForm();
                    setvisible(true);
                  } else {
                    resetForm();
                    setIsFormVisible(true);
                    setvisible(true);
                  }
                }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition ${isFormVisible ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                {isFormVisible ? <><FaArrowLeft size={13} /> Retour à la liste</> : <><FaUserPlus size={14} /> Ajouter un utilisateur</>}
              </button>
            </div>
          </div>

          {isFormVisible ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><FaUser size={14} /></span>
                  {utilisateurEnEdition ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
                </h3>
                <span className="text-xs font-medium bg-white/20 rounded-full px-3 py-1">{utilisateurEnEdition ? "Édition" : "Création"}</span>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Col left */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FaUser size={13} /></span>
                        <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" className={`w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.nom ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                      </div>
                      <FieldError msg={errors.nom && errors.nom[0]} />
                    </div>

                    {visible && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FaEnvelope size={13} /></span>
                          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemple@domaine.com" className={`w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                        </div>
                        <FieldError msg={errors.email && errors.email[0]} />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Rôle <span className="text-red-500">*</span></label>
                      <SelectField
                        value={role || ""}
                        onChange={(e) => setRole(e.target.value)}
                        options={roles.map((r) => ({ id: r, nom: r }))}
                        placeholder="-- Sélectionnez un rôle --"
                        error={errors.role && errors.role[0]}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Type d'entreprise <span className="text-red-500">*</span></label>
                      <SelectField
                        value={entreprise === null ? "" : String(entreprise)}
                        onChange={(e) => {
                          const value = e.target.value === "" ? null : Number(e.target.value);
                          setEntreprise(value);
                          setEntrepriseSelectionnee(value);
                        }}
                        options={[{ id: 0, nom: "Direction" }, { id: 1, nom: "Note de perception" }]}
                        placeholder="-- Sélectionnez un type --"
                        error={errors.entreprise && errors.entreprise[0]}
                      />
                    </div>

                    {entrepriseSelectionnee !== null && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Entité <span className="text-red-500">*</span></label>
                        {entrepriseSelectionnee === 1 ? (
                          <SelectField
                            value={idNote === null ? "" : String(idNote)}
                            onChange={(e) => setIdNote(Number(e.target.value))}
                            options={notes.map((n) => ({ id: n.id, nom: n.nom }))}
                            placeholder="-- Sélectionnez une note --"
                            error={errors.id_note && errors.id_note[0]}
                          />
                        ) : (
                          <SelectField
                            value={idDirection === null ? "" : String(idDirection)}
                            onChange={(e) => setIdDirection(Number(e.target.value))}
                            options={directions.map((d) => ({ id: d.id, nom: d.nom }))}
                            placeholder="-- Sélectionnez une direction --"
                            error={errors.id_direction && errors.id_direction[0]}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Col right */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Prénom <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FaUser size={13} /></span>
                        <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" className={`w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.prenom ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                      </div>
                      <FieldError msg={errors.prenom && errors.prenom[0]} />
                    </div>

                    {visible && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FaLock size={13} /></span>
                          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" className={`w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                        </div>
                        <FieldError msg={errors.password && errors.password[0]} />
                      </div>
                    )}

                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-2"><FaShieldAlt size={13} /> Information</h4>
                      <p className="text-xs text-indigo-700/80 leading-relaxed mt-1.5">Sélectionnez le type d'entreprise puis l'entité correspondante. Les champs marqués d'un <span className="text-red-500">*</span> sont obligatoires.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  {utilisateurEnEdition ? (
                    <>
                      <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold shadow-sm transition">
                        <FaSave size={14} /> Modifier
                      </button>
                      <button type="button" onClick={() => { resetForm(); setIsFormVisible(false); }} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">
                        <FaTimes size={14} /> Annuler
                      </button>
                    </>
                  ) : (
                    <button type="submit" className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition">
                      <FaPlus size={13} /> Ajouter l'utilisateur
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search bar */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="text" placeholder="Rechercher un utilisateur (nom, prénom, email)" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
                  </div>
                  <button onClick={handleSearch} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition shrink-0">
                    <FaSearch size={13} /> Rechercher
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                  <LoadingSpinner
                    message="Chargement des utilisateurs..."
                    subtitle="Veuillez patienter"
                    size="lg"
                    variant="table"
                  />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold tracking-widest uppercase text-slate-500">
                            <th className="px-5 py-3 text-left">#</th>
                            <th className="px-5 py-3 text-left">Nom</th>
                            <th className="px-5 py-3 text-left">Prénom</th>
                            <th className="px-5 py-3 text-left">Email</th>
                            <th className="px-5 py-3 text-left">Rôle</th>
                            <th className="px-5 py-3 text-left">Type</th>
                            <th className="px-5 py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredUtilisateurs.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-16 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                                  <FaUsers className="text-slate-400" size={24} />
                                </div>
                                <p className="font-semibold text-slate-900">Aucun utilisateur trouvé</p>
                                <p className="text-sm text-slate-500 mt-1">Essayez avec d'autres termes ou ajoutez un nouvel utilisateur</p>
                              </td>
                            </tr>
                          ) : (
                            filteredUtilisateurs.map((row, idx) => (
                              <tr key={row.id} className="hover:bg-slate-50/70 transition">
                                <td className="px-5 py-4 font-medium text-slate-500">{(pagination.current_page - 1) * 10 + idx + 1}</td>
                                <td className="px-5 py-4 font-semibold text-slate-900">{row.nom}</td>
                                <td className="px-5 py-4 text-slate-700">{row.prenom}</td>
                                <td className="px-5 py-4 text-slate-600 max-w-[220px] truncate">{row.email}</td>
                                <td className="px-5 py-4">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-semibold">
                                    <FaShieldAlt size={10} /> {row.role}
                                  </span>
                                </td>
                                <td className="px-5 py-4">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${row.entreprise ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>
                                    <FaBuilding size={10} /> {row.entreprise ? "Note de perception" : "Direction"}
                                  </span>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button onClick={() => handleEdit(row.id)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 flex items-center justify-center transition" title="Modifier">
                                      <FaEdit size={12} />
                                    </button>
                                    <button onClick={() => handleDelete(row.id)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 flex items-center justify-center transition" title="Désactiver">
                                      <FaTrash size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {pagination.last_page > 1 && (
                      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs font-medium text-slate-500">Page {pagination.current_page} sur {pagination.last_page}</p>
                        <nav className="flex items-center gap-1">
                          <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1">
                            <FaChevronLeft size={10} /> Précédent
                          </button>
                          {Array.from({ length: pagination.last_page }, (_, i) => (
                            <button key={i} onClick={() => handlePageChange(i + 1)} className={`min-w-[32px] h-8 rounded-lg text-xs font-bold border transition ${pagination.current_page === i + 1 ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                              {i + 1}
                            </button>
                          ))}
                          <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1">
                            Suivant <FaChevronRight size={10} />
                          </button>
                        </nav>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
                
            <ConfirmModal
                isOpen={!!confirmItem}
                onClose={() => setConfirmItem(null)}
                onConfirm={confirmDelete}
                title="Confirmer la suppression ?"
                message={confirmItem ? "Voulez-vous désactiver \"" + (confirmItem.nom || confirmItem.nom_classeur || confirmItem.intitule || confirmItem.numero_serie || confirmItem.id) + "\" ?" : ""}
                confirmText="Oui, désactiver"
                variant="danger"
                loading={confirmLoading}
            />
            
</div>
  );
};

export default UtilisateurScreen;
