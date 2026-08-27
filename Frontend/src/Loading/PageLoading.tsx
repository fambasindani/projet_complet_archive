// @ts-nocheck
// 📁 Composant/PageLoading.jsx
import React from "react";
import { FaSpinner } from "react-icons/fa";

const PageLoading = ({ 
  message = "Chargement de la page...", 
  subtitle = "Veuillez patienter"
}) => {
  return (
    <div 
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8f9fa"
      }}
    >
      <div className="text-center">
        <div className="spinner-wrapper mb-4">
          <FaSpinner className="fa-spin text-indigo-600" size={64} />
        </div>
        <h4 className="text-dark mb-2">{message}</h4>
        <p className="text-gray-500 mb-0">{subtitle}</p>
      </div>
    </div>
  );
};

export default PageLoading;