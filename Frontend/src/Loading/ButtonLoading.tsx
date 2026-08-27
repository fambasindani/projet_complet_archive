// @ts-nocheck
// 📁 Composant/ButtonLoading.jsx
import React from "react";
import { FaSpinner } from "react-icons/fa";


const ButtonLoading = ({ 
  text = "Chargement...", 
  size = 16,
  className = ""
}) => {
  return (
    <span className={`d-inline-flex items-center ${className}`}>
      <FaSpinner className="fa-spin mr-2" size={size} />
      {text}
    </span>
  );
};

export default ButtonLoading;