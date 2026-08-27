// @ts-nocheck
import React, { useEffect, useState } from "react";
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaExclamationTriangle, FaTimes } from "react-icons/fa";

let addToastFn: (msg: string, type: string) => void = () => {};

export const toast = {
  success: (msg: string) => addToastFn(msg, "success"),
  error: (msg: string) => addToastFn(msg, "error"),
  info: (msg: string) => addToastFn(msg, "info"),
  warning: (msg: string) => addToastFn(msg, "warning"),
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: string }>>([]);

  useEffect(() => {
    addToastFn = (message, type) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
    };
  }, []);

  const bg = {
    success: "bg-emerald-600 border-emerald-500",
    error: "bg-red-600 border-red-500",
    info: "bg-sky-600 border-sky-500",
    warning: "bg-amber-500 border-amber-400",
  };

  const Icon = {
    success: FaCheckCircle,
    error: FaTimesCircle,
    info: FaInfoCircle,
    warning: FaExclamationTriangle,
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const I = Icon[t.type] || FaInfoCircle;
        return (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-xl border backdrop-blur ${bg[t.type]} animate-slideIn`}>
            <I className="shrink-0" />
            <span className="max-w-[320px]">{t.message}</span>
            <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} className="ml-2 p-1 rounded-lg hover:bg-white/20">
              <FaTimes size={11} />
            </button>
          </div>
        );
      })}
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}.animate-slideIn{animation:slideIn 0.25s ease}`}</style>
    </div>
  );
};

export default ToastContainer;
