// @ts-nocheck
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { toast } from "../Composant/Toast";
import {
  FaCloudUploadAlt,
  FaQrcode,
  FaEye,
  FaTrashAlt,
  FaFilePdf,
  FaTimes,
  FaFileAlt,
  FaSpinner,
  FaCheckCircle,
} from "react-icons/fa";
import ConfirmModal from "./ConfirmModal";

const ModalNote = ({ modalId, isOpen, onClose, monid, projet, idclasseur, idcentre, verification }) => {
  const [fichiers, setFichiers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const fileInputRef = useRef(null);

  const token = GetTokenOrRedirect();

  useEffect(() => {
    if (isOpen && monid) fetchDocuments();
  }, [isOpen, monid]);

  const fetchDocuments = async () => {
    if (!monid) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/notes/download/${monid}`);
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
      if (fileInputRef.current) fileInputRef.current.value = "";
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
    formData.append("id_note_perception", monid);
    formData.append("id_classeur", idclasseur);
    formData.append("id_ministere", idcentre);
    try {
      setUploading(true);
      await axios.post(`${API_BASE_URL}/notes/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Documents PDF importés avec succès");
      setFichiers([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchDocuments();
    } catch (err) {
      toast.error("Échec lors de l'import des documents");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (id) => {
    window.open(`${API_BASE_URL}/notes/downloads/${id}`, "_blank");
  };

  const handleDelete = (id) => {
    if (!token) {
      toast.error("Vous n'êtes pas authentifié. Veuillez vous reconnecter.");
      return;
    }
    const _item = documents.find((x) => x.id === id) || fichiers.find((x) => x.id === id);
    if (_item) setConfirmItem(_item);
    else setConfirmItem({ id });
  };

  const confirmDelete = async () => {
    if (!confirmItem || !token) return;
    setConfirmLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/notes/delete/${confirmItem.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const handleScanning = async () => {
    setScanning(true);
    try {
      const response = await axios.post(
        "http://localhost:9000/scan",
        {},
        { headers: { "Content-Type": "application/json" } }
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

  const handleClose = () => {
    setFichiers([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
        {/* Header gradient */}
        <div className="px-6 py-5 bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center">
              <FaFilePdf className="text-white" size={16} />
            </div>
            <div>
              <h3 className="font-bold text-white leading-none flex items-center gap-2">
                Documents
                {projet && <span className="font-normal text-white/90">— {projet}</span>}
              </h3>
              <p className="text-xs text-white/80 mt-1">
                {documents.length} document{documents.length !== 1 ? "s" : ""} • PDF uniquement
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            aria-label="Fermer"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Upload zone */}
          {verification && (
            <form onSubmit={handleUpload} className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <FaCloudUploadAlt className="text-indigo-600" />
                Importer des fichiers PDF
                <span className="text-xs font-normal text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">PDF uniquement</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1 relative flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/20 transition group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition">
                    <FaFileAlt className="text-indigo-600 group-hover:text-white transition" size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {fichiers.length > 0 ? `${fichiers.length} fichier(s) sélectionné(s)` : "Choisir des fichiers PDF"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {fichiers.length > 0 ? fichiers.map((f) => f.name).join(", ") : "Cliquez pour parcourir • Multiple autorisé"}
                    </p>
                  </div>
                  {fichiers.length > 0 && <FaCheckCircle className="text-emerald-500 shrink-0" size={16} />}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="application/pdf"
                    onChange={handleFileChange}
                    disabled={uploading || scanning}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>

                <div className="flex gap-2 shrink-0">
                  <button
                    type="submit"
                    disabled={uploading || scanning}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm disabled:opacity-50 transition min-w-[130px]"
                  >
                    {uploading ? (
                      <>
                        <FaSpinner className="animate-spin" size={12} />
                        Chargement...
                      </>
                    ) : (
                      <>
                        <FaCloudUploadAlt size={12} />
                        Uploader
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleScanning}
                    disabled={uploading || scanning}
                    title="Scanner un document"
                    className="w-[46px] h-[46px] inline-flex items-center justify-center bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-50 shadow-sm shrink-0"
                  >
                    {scanning ? <FaSpinner className="animate-spin text-indigo-600" size={14} /> : <FaQrcode className="text-slate-600" size={14} />}
                  </button>
                </div>
              </div>

              {fichiers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {fichiers.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700">
                      <FaFilePdf className="text-red-500" size={11} />
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </form>
          )}

          {/* Documents list header */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                  <FaFilePdf className="text-red-600" size={12} />
                </span>
                Documents importés
                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-600">
                  {documents.length}
                </span>
              </h4>
              {loading && <span className="text-xs text-slate-500 flex items-center gap-1.5"><FaSpinner className="animate-spin" size={11} /> Chargement</span>}
            </div>

            {loading ? (
              <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <FaSpinner className="animate-spin text-indigo-600 mx-auto" size={28} />
                <p className="text-sm text-slate-500 mt-3">Chargement des documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3">
                  <FaFilePdf className="text-slate-400" size={22} />
                </div>
                <h6 className="font-semibold text-slate-700">Aucun document trouvé</h6>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Aucun document n'est associé à cette note. Importez vos fichiers PDF ci-dessus.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {documents.map((doc, index) => (
                  <div
                    key={doc.id}
                    className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-200 hover:shadow-sm hover:bg-indigo-50/20 transition"
                  >
                    <div className="hidden sm:flex w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-slate-500">{index + 1}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                      <FaFilePdf className="text-red-600" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{doc.nom_native || doc.nom || `Document ${doc.id}`}</p>
                      <p className="text-xs text-slate-500">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
                        {doc.taille ? ` • ${doc.taille}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleDownload(doc.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 border border-sky-200 text-sky-700 rounded-xl text-xs font-semibold hover:bg-sky-600 hover:text-white hover:border-sky-600 transition"
                      >
                        <FaEye size={11} />
                        <span className="hidden sm:inline">Voir</span>
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-red-600 hover:text-white hover:border-red-600 transition"
                      >
                        <FaTrashAlt size={11} />
                        <span className="hidden sm:inline">Supprimer</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition"
          >
            Fermer
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmItem}
        onClose={() => setConfirmItem(null)}
        onConfirm={confirmDelete}
        title="Confirmer la suppression ?"
        message={confirmItem ? `Voulez-vous désactiver "${confirmItem.nom_native || confirmItem.nom || confirmItem.nom_classeur || confirmItem.intitule || confirmItem.numero_serie || confirmItem.id}" ?` : ""}
        confirmText="Oui, désactiver"
        variant="danger"
        loading={confirmLoading}
      />

      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}.animate-scaleIn{animation:scaleIn 0.2s ease}`}</style>
    </div>
  );
};

export default ModalNote;
