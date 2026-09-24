// @ts-nocheck
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL, SCANNER_SERVICE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import {
  FaCloudUploadAlt,
  FaQrcode,
  FaEye,
  FaTrashAlt,
  FaFilePdf,
  FaTimes,
  FaFileAlt,
  FaSpinner,
  FaFolderOpen,
  FaCheckCircle,
  FaInfoCircle,
} from "react-icons/fa";
import ConfirmModal from "./ConfirmModal";
import { toast } from "../Composant/Toast";


const DocumentModal = ({ modalId, isOpen, onClose, monid, projet, idclasseur, verification, apiEndpoint = "documents" }) => {
  const [fichiers, setFichiers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = GetTokenOrRedirect();
    const [confirmItem, setConfirmItem] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);


  useEffect(() => {
    if (isOpen && monid) {
      fetchDocuments();
    }
  }, [isOpen, monid, apiEndpoint]);

  // ESC + lock scroll
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  const fetchDocuments = async () => {
    if (!monid) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/${apiEndpoint}/${monid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(res.data);
    } catch (error) {
      console.error("Erreur chargement documents", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const pdfOnly = selectedFiles.every((file) => file.type === "application/pdf");

    if (!pdfOnly) {
      toast.error("Seuls les fichiers PDF sont autorisés");
      return;
    }

    setFichiers(selectedFiles);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (fichiers.length === 0) {
      toast.warning("Veuillez sélectionner au moins un fichier PDF");
      return;
    }

    const formData = new FormData();
    fichiers.forEach((file) => formData.append("files[]", file));
    formData.append("id_declaration", monid);
    formData.append("id_classeur", idclasseur);

    try {
      setUploading(true);
      await axios.post(`${API_BASE_URL}/documents-declaration/upload-multiple`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Documents PDF importés avec succès");
      setFichiers([]);
      // reset input visuellement
      const input = document.getElementById(`file-input-${modalId}`) as HTMLInputElement | null;
      if (input) input.value = "";
      fetchDocuments();
    } catch (err) {
      toast.error("Échec lors de l'import des documents");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (id) => {
    if (apiEndpoint === 'notes/download') {
      window.open(`${API_BASE_URL}/notes/downloads/${id}`, "_blank");
    } else {
      window.open(`${API_BASE_URL}/documents-declaration/download/${id}`, "_blank");
    }
  };

  const handleDelete = (id) => {
        if (!token) { toast.error("Vous n'êtes pas authentifié. Veuillez vous reconnecter."); return; }
        const _item = fichiers.find((x) => x.id === id);
        if (_item) setConfirmItem(_item); else setConfirmItem({ id });
    };

    const confirmDelete = async () => {
        if (!confirmItem || !token) return;
        setConfirmLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/delete-document/${confirmItem.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Désactivé avec succès");
            setConfirmItem(null);
            fetchDocuments();
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

  const handleScanning = async () => {
    setScanning(true);
    try {
      const response = await axios.post(
        `${SCANNER_SERVICE_URL}/scan`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        toast.success("Document scanné et importé avec succès");
        fetchDocuments();
      } else {
        toast.error(`Échec du scan : ${response.data.message}`);
      }
    } catch (error) {
      toast.error("Erreur lors de la communication avec le service de scan");
      console.error("Erreur lors du scan", error);
    } finally {
      setScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {/* overlay */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-white rounded-[24px] shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
              <FaFilePdf className="text-white" size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[17px] font-bold tracking-tight text-white leading-none flex items-center gap-2">
                <span className="truncate">Documents</span>
                {projet && (
                  <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white border border-white/20 truncate max-w-[260px]">
                    <FaFolderOpen size={10} className="mr-1.5 opacity-80" />
                    <span className="truncate">{projet}</span>
                  </span>
                )}
              </h3>
              <p className="text-xs font-medium text-indigo-100 mt-1 truncate">
                Déclaration #{monid} • {documents.length} document{documents.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition shrink-0 ml-3"
            aria-label="Fermer"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Upload / Scan */}
          {verification ? (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <FaCloudUploadAlt className="text-white" size={13} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Importer des documents</h4>
                <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white border border-slate-200 text-slate-600">
                  <FaCheckCircle size={10} className="text-emerald-500" /> PDF uniquement
                </span>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 items-end">
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <FaFileAlt size={10} className="text-slate-400" /> Fichiers PDF
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                        <FaFileAlt className="text-indigo-600" size={12} />
                      </div>
                      <input
                        id={`file-input-${modalId}`}
                        type="file"
                        multiple
                        accept="application/pdf"
                        onChange={handleFileChange}
                        disabled={uploading || scanning}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-[52px] pr-3.5 py-2.5 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:text-white file:px-3 file:py-1.5 file:text-xs file:font-semibold hover:file:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-60"
                      />
                    </div>
                    {fichiers.length > 0 ? (
                      <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1.5">
                        <FaCheckCircle size={11} /> {fichiers.length} fichier(s) sélectionné(s) — {fichiers.map((f) => f.name).join(", ")}
                      </p>
                    ) : (
                      <p className="text-[11px] font-medium text-slate-400 mt-1.5">Sélectionnez un ou plusieurs PDF à importer.</p>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      type="submit"
                      disabled={uploading || scanning}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[132px]"
                    >
                      {uploading ? (
                        <>
                          <FaSpinner className="animate-spin" size={14} />
                          Chargement…
                        </>
                      ) : (
                        <>
                          <FaCloudUploadAlt size={14} />
                          Uploader
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleScanning}
                      disabled={uploading || scanning}
                      title="Scanner un document"
                      className="w-[46px] h-[46px] inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {scanning ? <FaSpinner className="animate-spin text-indigo-600" size={14} /> : <FaQrcode size={16} className="text-slate-700" />}
                    </button>
                  </div>
                </div>
              </form>

              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-2">
                <FaInfoCircle size={12} className="text-indigo-500 shrink-0" />
                <span>Formats acceptés : PDF uniquement. Le scan nécessite le service local sur <code className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px]">localhost:9000</code>.</span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                <FaEye className="text-white" size={12} />
              </div>
              <p className="text-sm font-medium text-amber-900">Mode lecture seule — import et suppression désactivés.</p>
            </div>
          )}

          {/* Liste documents */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center">
                  <FaFilePdf className="text-white" size={12} />
                </span>
                Documents importés
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-white">{documents.length}</span>
              </h5>
              {loading && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                  <FaSpinner className="animate-spin" size={12} /> Chargement…
                </span>
              )}
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3">
                  <FaSpinner className="animate-spin text-indigo-600" size={20} />
                </div>
                <p className="text-sm font-semibold text-slate-900">Chargement des documents…</p>
                <p className="text-xs font-medium text-slate-500 mt-1">Veuillez patienter</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500 w-[64px]">#</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Nom du document</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-500 w-[220px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {documents.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                                <FaFilePdf className="text-slate-400" size={22} />
                              </div>
                              <h6 className="mt-3 text-sm font-bold text-slate-900">Aucun document trouvé</h6>
                              <p className="mt-1 text-sm font-medium text-slate-500 max-w-sm">
                                Aucun document n'est associé à cette déclaration. Importez vos premiers PDF ci-dessus.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        documents.map((doc, index) => (
                          <tr key={doc.id} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-3.5 text-sm font-bold text-slate-600">{index + 1}</td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3 min-w-[220px]">
                                <span className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                                  <FaFilePdf className="text-red-600" size={14} />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 leading-tight truncate" title={doc.nom_native}>
                                    {doc.nom_native}
                                  </p>
                                  {doc.created_at && (
                                    <p className="text-xs font-medium text-slate-500">{new Date(doc.created_at).toLocaleDateString("fr-FR")}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleDownload(doc.id)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition"
                                >
                                  <FaEye size={12} />
                                  Voir
                                </button>
                                {verification && (
                                  <button
                                    onClick={() => handleDelete(doc.id)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition shadow-sm"
                                  >
                                    <FaTrashAlt size={11} />
                                    Supprimer
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <p className="hidden sm:block text-xs font-medium text-slate-500">
            PDF uniquement • Upload multiple • Aperçu et suppression
          </p>
          <button
            onClick={onClose}
            className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <FaTimes size={12} />
            Fermer
          </button>
        </div>
      </div>

      <style>{`
        /* custom scrollbar for modal body */
        .overflow-y-auto::-webkit-scrollbar { width: 8px; }
        .overflow-y-auto::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 9999px; }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
                
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

export default DocumentModal;
