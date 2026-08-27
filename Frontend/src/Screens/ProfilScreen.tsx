/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams, useHistory } from "react-router-dom/cjs/react-router-dom.min";
import {
  FaUserCircle,
  FaEnvelope,
  FaBuilding,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaLock,
  FaEdit,
  FaArrowLeft,
  FaShieldAlt,
  FaIdCard,
  FaUser,
  FaSpinner,
  FaDownload,
  FaPrint,
  FaShare,
  FaFileAlt,
  FaFolderOpen,
  FaChartPie,
  FaClock,
  FaHistory,
  FaFileSignature,
  FaExclamationCircle,
  FaCamera,
  FaTimes,
  FaSave,
  FaKey,
  FaCheckDouble,
  FaLockOpen,
} from "react-icons/fa";
import LoadingSpinner from "../Loading/LoadingSpinner";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import { toast } from "../Composant/Toast";

const ProfilScreen = () => {
  const utilisateur = JSON.parse(localStorage.getItem("utilisateur")) || {};
  const id = utilisateur?.id || "";
  const navRouter = useHistory();
  const token = GetTokenOrRedirect();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    current_password: "",
    password: "",
    password_confirmation: "",
    avatar: null,
  });

  const [errors, setErrors] = useState({});
  const [userStats, setUserStats] = useState({
    total_documents: 0,
    documents_mois: 0,
    dernier_activite: null,
  });

  const userId = id || 17;

  useEffect(() => {
    if (token) fetchUserProfile();
  }, [userId, token]);

  useEffect(() => {
    if (showModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [showModal]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        nom: user.nom || "",
        prenom: user.prenom || "",
        email: user.email || "",
        current_password: "",
        password: "",
        password_confirmation: "",
        avatar: null,
      }));
    }
  }, [user]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  });

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/profil/afficher/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (response.data && response.data.success) {
        setUser(response.data.data);
        setUserStats({
          total_documents: Math.floor(Math.random() * 200) + 50,
          documents_mois: Math.floor(Math.random() * 30) + 5,
          dernier_activite: new Date().toISOString(),
        });
      }
    } catch (error) {
      if (error.response?.status === 401) return;
      if (error.response?.status === 404) {
        toast.error("Ce profil n'existe pas ou a été supprimé"); setTimeout(() => navRouter.push("/gestion-utilisateurs/utilisateurs"), 1500);
      } else {
        toast.error("Impossible de charger le profil utilisateur");
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    if (!user) return;
    try {
      const response = await axios.get(
        `${API_BASE_URL}/profil/afficher/${user.id}?t=${Date.now()}`,
        { headers: getAuthHeaders() }
      );
      if (response.data && response.data.success) setUser(response.data.data);
    } catch (error) {
      console.error("Erreur rafraîchissement profil:", error);
    }
  };

  const handleDirectAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Notification");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Maximum 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
    setUploadingAvatar(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("_method", "PUT");
      formDataToSend.append("avatar", file);
      const response = await axios({
        method: "post",
        url: `${API_BASE_URL}/profil/modifier/${user.id}`,
        data: formDataToSend,
        headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        await refreshUserProfile();
        setAvatarPreview(null);
        toast.success("Photo mise à jour");
      }
    } catch (error) {
      toast.error("Impossible de modifier la photo");
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[name];
        return n;
      });
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({ ...prev, avatar: "Format d'image non supporté. Utilisez JPG, PNG ou GIF" }));
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, avatar: "L'image ne doit pas dépasser 2MB" }));
        return;
      }
      setFormData((prev) => ({ ...prev, avatar: file }));
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
      if (errors.avatar) {
        setErrors((prev) => {
          const n = { ...prev };
          delete n.avatar;
          return n;
        });
      }
    }
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatar: null }));
    setAvatarPreview(null);
    const el = document.getElementById("avatar-input");
    if (el) el.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    if (!user) { setSubmitting(false); return; }
    if (formData.password || formData.password_confirmation) {
      if (!formData.current_password) {
        setErrors((prev) => ({ ...prev, current_password: "L'ancien mot de passe est requis pour changer le mot de passe" }));
        setSubmitting(false);
        return;
      }
      if (formData.password !== formData.password_confirmation) {
        setErrors((prev) => ({ ...prev, password_confirmation: "Les mots de passe ne correspondent pas" }));
        setSubmitting(false);
        return;
      }
      if (formData.password.length < 6) {
        setErrors((prev) => ({ ...prev, password: "Le mot de passe doit contenir au moins 6 caractères" }));
        setSubmitting(false);
        return;
      }
    }
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("_method", "PUT");
      if (formData.password) {
        formDataToSend.append("current_password", formData.current_password);
        formDataToSend.append("password", formData.password);
        formDataToSend.append("password_confirmation", formData.password_confirmation);
      }
      if (formData.nom !== user.nom) formDataToSend.append("nom", formData.nom);
      if (formData.prenom !== user.prenom) formDataToSend.append("prenom", formData.prenom);
      if (formData.email !== user.email) formDataToSend.append("email", formData.email);
      if (formData.avatar) formDataToSend.append("avatar", formData.avatar);
      if (Array.from(formDataToSend.entries()).length <= 1) {
        toast.info("Vous n'avez apporté aucune modification");
        setSubmitting(false);
        return;
      }
      const response = await axios({
        method: "post",
        url: `${API_BASE_URL}/profil/modifier/${user.id}`,
        data: formDataToSend,
        headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data", "X-HTTP-Method-Override": "PUT" },
      });
      if (response.data && response.data.success) {
        await refreshUserProfile();
        setAvatarPreview(null);
        toast.success(response.data.message || "Profil mis à jour avec succès");
        setShowModal(false);
        setFormData((prev) => ({ ...prev, current_password: "", password: "", password_confirmation: "", avatar: null }));
      }
    } catch (error) {
      if (error.response?.status === 422) {
        const serverErrors = error.response.data.errors || {};
        if (serverErrors.current_password) setErrors((prev) => ({ ...prev, current_password: serverErrors.current_password[0] }));
        if (serverErrors.password) setErrors((prev) => ({ ...prev, password: serverErrors.password[0] }));
        if (serverErrors.password_confirmation) setErrors((prev) => ({ ...prev, password_confirmation: serverErrors.password_confirmation[0] }));
        if (serverErrors.password && serverErrors.password[0].includes("confirmation")) {
          toast.error("Les mots de passe ne correspondent pas");
        } else {
          toast.error(serverErrors.current_password?.[0] || "Veuillez corriger les erreurs");
        }
      } else if (error.response?.status === 401) {
        setErrors((prev) => ({ ...prev, current_password: "L'ancien mot de passe est incorrect" }));
        toast.error("L'ancien mot de passe fourni est incorrect");
      } else if (error.response?.status === 404) {
        toast.error(`Ce profil (ID: ${user.id}) n'existe plus`);
          setShowModal(false);
          fetchUserProfile();
      } else {
        toast.error(error.response?.data?.message || "Impossible de modifier le profil");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try { return format(new Date(dateString), "dd MMMM yyyy", { locale: fr }); } catch { return "N/A"; }
  };
  const formatShortDate = (dateString) => {
    if (!dateString) return "N/A";
    try { return format(new Date(dateString), "dd/MM/yyyy", { locale: fr }); } catch { return "N/A"; }
  };
  const timeAgo = (dateString) => {
    if (!dateString) return "Jamais";
    try { return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr }); } catch { return "N/A"; }
  };

  const getStatusBadge = (statut) => {
    const map = {
      active: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", text: "Actif", Icon: FaCheckCircle },
      inactive: { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", text: "Inactif", Icon: FaTimesCircle },
      bloqué: { bg: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", text: "Bloqué", Icon: FaLock },
    };
    const c = map[statut] || map.active;
    const Icon = c.Icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.bg}`}>
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
        <Icon size={12} /> {c.text}
      </span>
    );
  };

  const getUserInitials = () => {
    if (!user) return "?";
    return `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setErrors({});
    setAvatarPreview(null);
    if (user) {
      setFormData((prev) => ({
        ...prev,
        nom: user.nom || "",
        prenom: user.prenom || "",
        email: user.email || "",
        current_password: "",
        password: "",
        password_confirmation: "",
        avatar: null,
      }));
    }
  };

  const FieldError = ({ error }) => {
    if (!error) return null;
    return (
      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
        <FaExclamationCircle size={12} />
        {Array.isArray(error) ? error[0] : error}
      </p>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Menus />
        <Head />
        <div className="lg:pl-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <LoadingSpinner
                message="Chargement du profil..."
                subtitle="Veuillez patienter"
                size="lg"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Menus />
        <Head />
        <div className="lg:pl-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <FaExclamationCircle className="text-red-500" size={28} />
              </div>
              <h4 className="text-slate-900 font-bold text-lg">Utilisateur non trouvé</h4>
              <p className="text-slate-500 text-sm mt-1 mb-6">Ce profil n'existe pas ou a été supprimé</p>
              <button onClick={() => navRouter.push("/gestion-utilisateurs/utilisateurs")} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                <FaArrowLeft /> Retour à la liste
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Menus />
      <Head />

      <div className="lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">

            {/* HEADER */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => navRouter.goBack()} className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-white hover:shadow-sm transition text-slate-600 hover:text-indigo-600">
                    <FaArrowLeft size={16} />
                  </button>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Profil Utilisateur</h1>
                    <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center gap-1"><FaUser size={12} /> ID: {user.id}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      Membre depuis {formatDate(user.datecreation)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-700 transition">
                    <FaEdit size={14} /> Modifier le profil
                  </button>
                  <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
                    <FaDownload size={14} /> Exporter
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="h-24 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500" />
                  <div className="px-6 pb-6 text-center">
                    <div className="relative -mt-14 flex justify-center">
                      <div className="relative group cursor-pointer" onClick={() => document.getElementById("avatar-direct-upload")?.click()}>
                        <div className="w-[120px] h-[120px] rounded-full p-1 bg-white shadow-xl overflow-hidden">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Aperçu" className="w-full h-full rounded-full object-cover" />
                          ) : user.avatar_url ? (
                            <img
                              src={`${user.avatar_url}?t=${Date.now()}`}
                              alt={`${user.prenom} ${user.nom}`}
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fallback = e.currentTarget.nextElementSibling;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full rounded-full flex items-center justify-center text-white text-3xl font-bold ${!avatarPreview && !user.avatar_url ? "flex" : "hidden"} bg-gradient-to-br from-indigo-500 to-violet-600`}>
                            {getUserInitials()}
                          </div>
                          <div className="hidden w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 items-center justify-center text-white text-3xl font-bold absolute inset-1">
                            {getUserInitials()}
                          </div>
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition gap-1 m-1">
                          <FaCamera size={20} />
                          <span className="text-[11px] font-medium">Changer la photo</span>
                        </div>
                        {uploadingAvatar && (
                          <div className="absolute inset-0 rounded-full bg-white/90 flex items-center justify-center m-1">
                            <FaSpinner className="animate-spin text-indigo-600" size={28} />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 right-[calc(50%-48px)]">
                        <div className="bg-white rounded-full p-1 shadow-sm border border-slate-100">
                          {getStatusBadge(user.statut)}
                        </div>
                      </div>
                    </div>
                    <input type="file" id="avatar-direct-upload" ref={fileInputRef} accept="image/jpeg,image/png,image/jpg,image/gif" onChange={handleDirectAvatarUpload} className="hidden" />

                    <h3 className="font-bold text-slate-900 text-lg mt-4">
                      {user.prenom} {user.nom}
                    </h3>
                    <p className="text-sm text-slate-500 flex items-center justify-center gap-1.5 mt-1">
                      <FaEnvelope size={12} /> {user.email}
                    </p>

                    <div className="grid grid-cols-3 gap-3 mt-6">
                      <div className="bg-slate-50 rounded-xl py-3 border border-slate-100">
                        <div className="text-lg font-bold text-slate-900">{user.roles?.length || 0}</div>
                        <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Rôles</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl py-3 border border-slate-100">
                        <div className="text-lg font-bold text-slate-900">{user.departements?.length || 0}</div>
                        <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Directions</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl py-3 border border-slate-100">
                        <div className="text-lg font-bold text-indigo-600">{userStats.total_documents}</div>
                        <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Documents</div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      <button className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                        <FaPrint size={12} /> Imprimer
                      </button>
                      <button className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                        <FaShare size={12} /> Partager
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <FaClock className="text-indigo-600" size={14} />
                    </div>
                    <h6 className="font-semibold text-slate-900 text-sm">Activité récente</h6>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <FaFileAlt className="text-indigo-600" size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Dernier document</p>
                        <p className="text-xs text-slate-500">{timeAgo(userStats.dernier_activite)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <FaCalendarAlt className="text-emerald-600" size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Inscription</p>
                        <p className="text-xs text-slate-500">{formatDate(user.datecreation)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="border-b border-slate-100 px-2">
                    <nav className="flex gap-1 p-1">
                      {[
                        { key: "info", label: "Informations", icon: FaIdCard, count: null },
                        { key: "departements", label: "Directions", icon: FaBuilding, count: user.departements?.length || 0 },
                        { key: "roles", label: "Rôles", icon: FaShieldAlt, count: user.roles?.length || 0 },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === tab.key ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                          <tab.icon size={14} />
                          {tab.label}
                          {tab.count !== null && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>{tab.count}</span>
                          )}
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="p-6">
                    {activeTab === "info" && (
                      <div>
                        <h6 className="font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 mb-6">
                          <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><FaUserCircle className="text-indigo-600" size={14} /></span>
                          Informations personnelles
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { label: "Nom complet", value: `${user.prenom} ${user.nom}`, icon: FaUser },
                            { label: "Email", value: user.email, icon: FaEnvelope },
                            { label: "ID Utilisateur", value: `#${user.id}`, icon: FaIdCard },
                            { label: "Date d'inscription", value: formatDate(user.datecreation), icon: FaCalendarAlt },
                          ].map((item) => (
                            <div key={item.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                              <label className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 flex items-center gap-1.5 mb-1">
                                <item.icon size={11} /> {item.label}
                              </label>
                              <p className="font-semibold text-slate-900 text-sm break-all">{item.value}</p>
                            </div>
                          ))}
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 md:col-span-2">
                            <label className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 flex items-center gap-1.5 mb-1">
                              <FaCheckCircle size={11} /> Statut
                            </label>
                            <div className="mt-1">{getStatusBadge(user.statut)}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "departements" && (
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h6 className="font-semibold text-slate-900 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><FaBuilding className="text-indigo-600" size={14} /></span>
                            Directions assignées
                          </h6>
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">{user.departements?.length || 0} direction(s)</span>
                        </div>
                        {user.departements && user.departements.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {user.departements.map((dept) => (
                              <div key={dept.id} className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-200 hover:shadow-md transition">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition">
                                    <FaBuilding size={16} />
                                  </div>
                                  <div className="min-w-0">
                                    <h6 className="font-bold text-slate-900 text-sm">{dept.sigle}</h6>
                                    <p className="text-xs text-slate-500 line-clamp-1">{dept.nom}</p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-500 flex items-center gap-1"><FaCalendarAlt size={11} /> Depuis {formatShortDate(dept.datecreation)}</span>
                                  <span className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-bold">{dept.sigle}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3"><FaBuilding className="text-slate-400" size={20} /></div>
                            <p className="text-sm text-slate-500">Aucune direction assignée</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "roles" && (
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h6 className="font-semibold text-slate-900 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><FaShieldAlt className="text-amber-600" size={14} /></span>
                            Rôles et permissions
                          </h6>
                          <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">{user.roles?.length || 0} rôle(s)</span>
                        </div>
                        {user.roles && user.roles.length > 0 ? (
                          <div className="space-y-3">
                            {user.roles.map((role) => (
                              <div key={role.id} className="flex gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                                  <FaShieldAlt size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <h5 className="font-bold text-slate-900 text-sm">{role.nom}</h5>
                                      <p className="text-xs text-slate-500 mt-0.5">{role.description || "Aucune description"}</p>
                                    </div>
                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200 shrink-0">{role.nom}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1"><FaCalendarAlt size={10} /> Assigné depuis {formatShortDate(role.created_at)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3"><FaShieldAlt className="text-slate-400" size={20} /></div>
                            <p className="text-sm text-slate-500">Aucun rôle assigné</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between shrink-0">
              <h5 className="font-semibold flex items-center gap-2"><FaEdit /> Modifier le profil</h5>
              <button onClick={handleCloseModal} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h6 className="font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                    <FaUserCircle className="text-indigo-600" /> Informations personnelles
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom <span className="text-red-500">*</span></label>
                      <input type="text" name="nom" value={formData.nom} onChange={handleInputChange} placeholder="Entrez le nom" className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.nom ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                      <FieldError error={errors.nom} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Prénom <span className="text-red-500">*</span></label>
                      <input type="text" name="prenom" value={formData.prenom} onChange={handleInputChange} placeholder="Entrez le prénom" className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.prenom ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                      <FieldError error={errors.prenom} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FaEnvelope size={14} /></span>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="exemple@domaine.com" className={`w-full pl-10 pr-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.email ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                      </div>
                      <FieldError error={errors.email} />
                    </div>
                  </div>
                </div>

                <div>
                  <h6 className="font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 mb-2">
                    <FaKey className="text-indigo-600" /> Changer le mot de passe
                  </h6>
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2 mb-4">
                    <FaExclamationCircle className="text-amber-500 shrink-0" /> Pour changer votre mot de passe, vous devez d'abord entrer votre ancien mot de passe.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Ancien mot de passe <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FaLockOpen size={14} /></span>
                        <input type="password" name="current_password" value={formData.current_password} onChange={handleInputChange} placeholder="Entrez votre ancien mot de passe" className={`w-full pl-10 pr-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.current_password ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                      </div>
                      <FieldError error={errors.current_password} />
                      {!formData.current_password && formData.password && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1"><FaExclamationCircle size={10} /> L'ancien mot de passe est requis pour changer le mot de passe</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Nouveau mot de passe</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FaLock size={14} /></span>
                        <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Minimum 6 caractères" className={`w-full pl-10 pr-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.password ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                      </div>
                      <FieldError error={errors.password} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmer le mot de passe</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FaCheckDouble size={14} /></span>
                        <input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleInputChange} placeholder="Confirmez le mot de passe" className={`w-full pl-10 pr-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.password_confirmation ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                      </div>
                      <FieldError error={errors.password_confirmation} />
                    </div>
                  </div>
                  {errors.general && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                      <FaExclamationCircle /> {errors.general}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={handleCloseModal} disabled={submitting} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition inline-flex items-center gap-2 disabled:opacity-60">
                  <FaTimes size={12} /> Annuler
                </button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition inline-flex items-center gap-2 shadow-sm disabled:opacity-60">
                  {submitting ? (<><FaSpinner className="animate-spin" /> Enregistrement...</>) : (<><FaSave size={14} /> Enregistrer les modifications</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{` *{scrollbar-width:thin;scrollbar-color:#cbd5e1 transparent} ::-webkit-scrollbar{width:6px;height:6px} ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:999px}`}</style>
                
</div>
  );
};

export default ProfilScreen;
