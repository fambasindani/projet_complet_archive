// @ts-nocheck
import React from "react";
import { FaTimes, FaEye } from "react-icons/fa";

const DetailModal = ({ isOpen, onClose, title, children, icon: Icon = FaEye }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-scaleIn max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center">
              <Icon size={14} />
            </div>
            <h3 className="font-bold">{title}</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
            <FaTimes size={14} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-3 text-sm leading-relaxed">{children}</div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition">Fermer</button>
        </div>
      </div>
      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}.animate-scaleIn{animation:scaleIn 0.2s ease}`}</style>
    </div>
  );
};

export default DetailModal;
