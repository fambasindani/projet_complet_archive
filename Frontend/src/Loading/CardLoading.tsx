// @ts-nocheck
// 📁 Composant/CardLoading.jsx
import React from "react";
import { FaSpinner } from "react-icons/fa";

const CardLoading = ({ 
  message = "Chargement...", 
  height = "200px" 
}) => {
  return (
    <div 
      className="bg-white rounded-lg-xl shadow-sm border border-slate-200-gray-100 border border-slate-200-0 shadow-sm"
      style={{ 
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div className="text-center">
        <div className="spinner-wrapper mb-3">
          <FaSpinner className="fa-spin text-indigo-600" size={32} />
        </div>
        <p className="text-gray-500 mb-0">{message}</p>
      </div>
    </div>
  );
};

export default CardLoading;