// @ts-nocheck
import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import {
  FaSearch,
  FaTimes,
  FaFilePdf,
  FaCalendarAlt,
  FaBuilding,
  FaTag,
  FaSpinner,
  FaFileAlt,
  FaEye,
  FaDownload,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
  FaInfoCircle,
  FaMicroscope,
  FaFilter,
  FaLayerGroup,
  FaClock,
  FaHashtag,
} from "react-icons/fa";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const AdvancedSearchModal = ({
  isOpen,
  onClose,
  token,
  selectedUserDirection,
  userDirection,
  allDirections = [],
}) => {
  const [searchParams, setSearchParams] = useState({
    query: "",
    id_declaration: "",
    id_classeur: "",
    date_debut: "",
    date_fin: "",
    direction_ids: "",
    sort_by: "created_at",
    sort_order: "desc",
    page: 1,
    per_page: 10,
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const [filteredDirections, setFilteredDirections] = useState([]);
  const [loadingDirections, setLoadingDirections] = useState(false);
  const [localDirections, setLocalDirections] = useState([]);

  useEffect(() => {
    if (allDirections.length > 0) {
      setLocalDirections(allDirections);
    } else if (token) {
      fetchDirections();
    }
  }, [allDirections, token]);

  const fetchDirections = async () => {
    setLoadingDirections(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/departements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocalDirections(response.data.data.data || []);
    } catch (error) {
      console.error("Erreur chargement directions:", error);
    } finally {
      setLoadingDirections(false);
    }
  };

  useEffect(() => {
    const directionsSource = allDirections.length > 0 ? allDirections : localDirections;
    if (directionsSource.length > 0 && selectedUserDirection) {
      const filtered = directionsSource.filter((dir) => dir.id !== parseInt(selectedUserDirection));
      setFilteredDirections(filtered);
    } else {
      setFilteredDirections(directionsSource);
    }
  }, [allDirections, localDirections, selectedUserDirection]);

  useEffect(() => {
    if (isOpen) handleReset();
  }, [isOpen]);

  const handleReset = () => {
    setSearchParams({
      query: "",
      id_declaration: "",
      id_classeur: "",
      date_debut: "",
      date_fin: "",
      direction_ids: "",
      sort_by: "created_at",
      sort_order: "desc",
      page: 1,
      per_page: 10,
    });
    setResults([]);
  };

  const handleSearch = async (page = 1) => {
    if (
      !searchParams.query &&
      !searchParams.id_declaration &&
      !searchParams.id_classeur &&
      !searchParams.date_debut &&
      !searchParams.date_fin
    ) {
      toast.info("Veuillez saisir au moins un critère de recherche");
      return;
    }

    setLoading(true);
    try {
      const params = {
        ...searchParams,
        page,
        direction_ids: searchParams.direction_ids || undefined,
      };

      const response = await axios.post(
        `${API_BASE_URL}/documents-declaration/advanced-search/${selectedUserDirection}`,
        params,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setResults(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Erreur recherche:", error);
      toast.error(error.response?.data?.message || "Impossible d'effectuer la recherche");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    setSearchParams((prev) => ({
      ...prev,
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === "desc" ? "asc" : "desc",
      page: 1,
    }));
    setTimeout(() => handleSearch(1), 0);
  };

  const getSortIcon = (field) => {
    if (searchParams.sort_by !== field) return <FaSort className="text-slate-400" size={12} />;
    return searchParams.sort_order === "asc" ? (
      <FaSortUp className="text-indigo-600" size={12} />
    ) : (
      <FaSortDown className="text-indigo-600" size={12} />
    );
  };

  const formatDateValue = (dateString) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm", { locale: fr });
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "—";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return parts
      .map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? `<mark class="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-semibold">${part}</mark>`
          : part
      )
      .join("");
  };

  const getDirectionName = (directionId) => {
    if (!directionId) return "—";
    const dir = (allDirections.length > 0 ? allDirections : localDirections).find(
      (d) => d.id === parseInt(directionId)
    );
    return dir ? `${dir.sigle || ""} ${dir.nom}`.trim() : `ID: ${directionId}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {/* overlay click close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-white rounded-[24px] shadow-2xl border border-slate-200 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
              <FaMicroscope className="text-white" size={18} />
            </div>
            <div>
              <h3 className="text-[17px] font-bold tracking-tight text-white leading-none flex items-center gap-2">
                Recherche avancée OCR
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white border border-white/20">TEXTE EXTRAIT</span>
              </h3>
              <p className="text-xs font-medium text-indigo-100 mt-1">
                Recherchez dans le contenu OCR — mots-clés, dates, classeurs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition"
            aria-label="Fermer"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Info direction */}
          <div className="bg-indigo-50/80 rounded-2xl border border-indigo-100 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow">
              <FaInfoCircle className="text-white" size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 leading-none">
                Direction active :{" "}
                <span className="text-indigo-700">
                  {userDirection ? `${userDirection.sigle} — ${userDirection.nom}` : `Direction #${selectedUserDirection}`}
                </span>
              </p>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Tous les résultats sont filtrés par cette direction par défaut. Ajoutez une direction supplémentaire ci-dessous si nécessaire.
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-indigo-100 text-indigo-700 shrink-0">
              <FaBuilding size={10} /> {userDirection?.sigle || `#${selectedUserDirection}`}
            </span>
          </div>

          {/* Formulaire */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                <FaFilter className="text-white" size={12} />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Critères de recherche</h4>
              <span className="ml-auto text-[11px] font-semibold tracking-widest uppercase text-slate-400">OCR • montext</span>
            </div>

            {/* Query */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <FaSearch size={10} className="text-slate-400" /> Rechercher dans le texte OCR
              </label>
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="Mots-clés dans le contenu des documents..."
                  value={searchParams.query}
                  onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value, page: 1 })}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch(1)}
                />
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1.5">Recherche dans le texte extrait par OCR (champ montext).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <FaHashtag size={10} className="text-slate-400" /> ID Déclaration
                </label>
                <input
                  type="number"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="ex: 123"
                  value={searchParams.id_declaration}
                  onChange={(e) => setSearchParams({ ...searchParams, id_declaration: e.target.value, page: 1 })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <FaTag size={10} className="text-slate-400" /> ID Classeur
                </label>
                <input
                  type="number"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="ex: 456"
                  value={searchParams.id_classeur}
                  onChange={(e) => setSearchParams({ ...searchParams, id_classeur: e.target.value, page: 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <FaCalendarAlt size={10} className="text-slate-400" /> Date début
                </label>
                <input
                  type="date"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  value={searchParams.date_debut}
                  onChange={(e) => setSearchParams({ ...searchParams, date_debut: e.target.value, page: 1 })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <FaCalendarAlt size={10} className="text-slate-400" /> Date fin
                </label>
                <input
                  type="date"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  value={searchParams.date_fin}
                  onChange={(e) => setSearchParams({ ...searchParams, date_fin: e.target.value, page: 1 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <FaBuilding size={10} className="text-slate-400" /> Direction supplémentaire (optionnel)
              </label>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-60"
                value={searchParams.direction_ids}
                onChange={(e) => setSearchParams({ ...searchParams, direction_ids: e.target.value, page: 1 })}
                disabled={loadingDirections}
              >
                <option value="">Aucune direction supplémentaire</option>
                {filteredDirections.map((dir) => (
                  <option key={dir.id} value={dir.id}>
                    {dir.sigle} — {dir.nom}
                  </option>
                ))}
              </select>
              <p className="text-[11px] font-medium text-slate-400 mt-1.5">
                {filteredDirections.length > 0
                  ? `${filteredDirections.length} direction(s) disponible(s) en plus de la vôtre`
                  : "Aucune autre direction disponible"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-1">
              <button
                onClick={handleReset}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                <FaTimes size={12} /> Effacer
              </button>
              <button
                onClick={() => handleSearch(1)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" size={14} /> Recherche…
                  </>
                ) : (
                  <>
                    <FaSearch size={13} /> Rechercher
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3">
                <FaSpinner className="animate-spin text-indigo-600" size={20} />
              </div>
              <p className="text-sm font-semibold text-slate-900">Recherche en cours…</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Analyse du contenu OCR</p>
            </div>
          )}

          {/* Résultats */}
          {!loading && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
                    <FaFileAlt className="text-white" size={12} />
                  </span>
                  Résultats
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-white">
                    {pagination.total}
                  </span>
                </h5>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700">
                    Page {pagination.current_page} / {pagination.last_page}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700">
                    <FaBuilding size={10} /> {userDirection?.sigle || `Dir #${selectedUserDirection}`}
                  </span>
                  {searchParams.direction_ids && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 border border-violet-100 text-violet-700">
                      + {getDirectionName(searchParams.direction_ids)}
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th
                          onClick={() => handleSort("id")}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500 cursor-pointer select-none hover:text-slate-700 transition"
                        >
                          <span className="inline-flex items-center gap-1.5">ID {getSortIcon("id")}</span>
                        </th>
                        <th
                          onClick={() => handleSort("nom_native")}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500 cursor-pointer select-none hover:text-slate-700 transition"
                        >
                          <span className="inline-flex items-center gap-1.5">Document {getSortIcon("nom_native")}</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Direction</th>
                        <th
                          onClick={() => handleSort("taille")}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500 cursor-pointer select-none hover:text-slate-700 transition"
                        >
                          <span className="inline-flex items-center gap-1.5">Taille {getSortIcon("taille")}</span>
                        </th>
                        <th
                          onClick={() => handleSort("created_at")}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500 cursor-pointer select-none hover:text-slate-700 transition"
                        >
                          <span className="inline-flex items-center gap-1.5">Date {getSortIcon("created_at")}</span>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {results.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3.5 text-sm font-bold text-slate-700">#{doc.id}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-start gap-3 min-w-[240px]">
                              <span className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
                                <FaFilePdf className="text-red-600" size={14} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900 leading-tight truncate" title={doc.nom_native || doc.nom_fichier}>
                                  {doc.nom_native || doc.nom_fichier}
                                </p>
                                {doc.extrait && (
                                  <p
                                    className="text-xs leading-relaxed text-slate-500 mt-1 line-clamp-2"
                                    dangerouslySetInnerHTML={{ __html: highlightText(doc.extrait, searchParams.query) }}
                                  />
                                )}
                                {doc.extrait && searchParams.query && (
                                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-100 text-amber-700">
                                    <FaSearch size={8} /> occurrence trouvée
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 max-w-[180px] truncate">
                              {doc.direction_nom || getDirectionName(doc.direction_id) || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900 text-white">
                              <FaLayerGroup size={10} className="opacity-70" /> {formatFileSize(doc.taille)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
                              <FaClock size={10} className="text-slate-400" /> {formatDateValue(doc.created_at)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await axios.get(`${API_BASE_URL}/documents-declaration/download/${doc.id}`, {
                                      headers: { Authorization: `Bearer ${token}` },
                                      responseType: 'blob',
                                    });
                                    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                                    window.open(url, '_blank');
                                    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
                                  } catch (e) {
                                    toast.error(e.response?.data?.message || 'Impossible d\'ouvrir le document');
                                  }
                                }}
                                title="Voir le PDF"
                                className="w-8 h-8 inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition"
                              >
                                <FaEye size={12} />
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await axios.get(`${API_BASE_URL}/documents-declaration/download/${doc.id}`, {
                                      headers: { Authorization: `Bearer ${token}` },
                                      responseType: 'blob',
                                    });
                                    const blob = new Blob([res.data], { type: 'application/pdf' });
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = doc.nom_native || `document-${doc.id}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                    window.URL.revokeObjectURL(url);
                                  } catch (e) {
                                    toast.error(e.response?.data?.message || 'Téléchargement impossible');
                                  }
                                }}
                                title="Télécharger"
                                className="w-8 h-8 inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
                              >
                                <FaDownload size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs font-medium text-slate-500">
                    Affichage{" "}
                    <span className="font-bold text-slate-900">{(pagination.current_page - 1) * pagination.per_page + 1}</span> à{" "}
                    <span className="font-bold text-slate-900">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> sur{" "}
                    <span className="font-bold text-slate-900">{pagination.total}</span> documents
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSearch(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1}
                      className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <FaChevronLeft size={12} />
                    </button>
                    {(() => {
                      const total = pagination.last_page;
                      const current = pagination.current_page;
                      const maxVisible = 5;
                      let start = Math.max(1, current - Math.floor(maxVisible / 2));
                      let end = Math.min(total, start + maxVisible - 1);
                      if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
                      const pages = [];
                      for (let i = start; i <= end; i++) pages.push(i);
                      return (
                        <>
                          {start > 1 && (
                            <>
                              <button onClick={() => handleSearch(1)} className="w-9 h-9 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
                                1
                              </button>
                              {start > 2 && <span className="px-1 text-slate-400 text-sm">…</span>}
                            </>
                          )}
                          {pages.map((pageNum) => (
                            <button
                              key={pageNum}
                              onClick={() => handleSearch(pageNum)}
                              className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${
                                pagination.current_page === pageNum
                                  ? "bg-slate-900 text-white shadow"
                                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          ))}
                          {end < total && (
                            <>
                              {end < total - 1 && <span className="px-1 text-slate-400 text-sm">…</span>}
                              <button onClick={() => handleSearch(total)} className="w-9 h-9 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
                                {total}
                              </button>
                            </>
                          )}
                        </>
                      );
                    })()}
                    <button
                      onClick={() => handleSearch(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.last_page}
                      className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <FaChevronRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!loading && results.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto">
                <FaSearch className="text-slate-400" size={22} />
              </div>
              <h6 className="mt-4 text-sm font-bold text-slate-900">Aucun résultat</h6>
              <p className="mt-1 text-sm font-medium text-slate-500 max-w-md mx-auto">
                Utilisez les filtres ci-dessus pour rechercher dans les documents OCR. Ajoutez au moins un critère et lancez la recherche.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
                <FaInfoCircle size={11} /> Astuce : essayez un mot-clé présent dans le texte extrait
              </div>
            </div>
          )}
        </div>

        {/* Footer actions mobile */}
        <div className="shrink-0 px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <p className="hidden sm:block text-xs font-medium text-slate-500">
            Recherche OCR • filtrage par direction • pagination 10 / page
          </p>
          <button
            onClick={onClose}
            className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Fermer
          </button>
        </div>
      </div>
                
</div>
  );
};

export default AdvancedSearchModal;
