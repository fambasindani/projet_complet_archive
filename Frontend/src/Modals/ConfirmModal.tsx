// @ts-nocheck
import React from "react";
import { FaExclamationTriangle, FaTrash, FaTimes, FaSpinner } from "react-icons/fa";

const ConfirmModal = ({ isOpen, onClose, onConfirm, title = "Confirmer", message, confirmText = "Confirmer", cancelText = "Annuler", variant = "danger", loading = false }) => {
  if (!isOpen) return null;
  const isDanger = variant === "danger";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-scaleIn">
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDanger ? "bg-red-50 border border-red-100 text-red-600" : "bg-amber-50 border border-amber-100 text-amber-600"}`}>
            <FaExclamationTriangle size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{message}</p>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-50">
            <FaTimes className="inline mr-1.5" size={11} /> {cancelText}
          </button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 ${isDanger ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}`}>
            {loading ? <FaSpinner className="animate-spin" size={12} /> : <FaTrash size={12} />} {confirmText}
          </button>
        </div>
      </div>
      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}.animate-scaleIn{animation:scaleIn 0.2s ease}`}</style>
    </div>
  );
};

export default ConfirmModal;
