// @ts-nocheck
import React from "react";
const variantMap = {
  "btn-primary": "bg-primary-600 hover:bg-primary-700 text-white",
  "btn-secondary": "bg-gray-600 hover:bg-gray-700 text-white",
  "btn-success": "bg-green-600 hover:bg-green-700 text-white",
  "btn-danger": "bg-red-600 hover:bg-red-700 text-white",
  "btn-warning": "bg-amber-500 hover:bg-amber-600 text-white",
  "btn-light": "bg-white hover:bg-gray-50 text-gray-700 border border-slate-200 shadow-sm",
  "btn-outline-primary": "border border-primary-600 text-primary-600 hover:bg-primary-50",
  "btn-outline-success": "border border-green-600 text-green-600 hover:bg-green-50",
  "btn-outline-warning": "border border-amber-500 text-amber-500 hover:bg-amber-50",
};
const Button = ({ onClick, type = "button", loading, children, className = "btn-primary", icon, block = true }) => {
  const base = "inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variant = variantMap[className] || variantMap["btn-primary"];
  const blockClass = block ? "w-full" : "";
  return (
    <button type={type} onClick={onClick} className={`${base} ${variant} ${blockClass}`} disabled={loading}>
      {icon && <i className={`${icon} mr-2`}></i>}
      {loading ? "Chargement..." : children}
    </button>
  );
};
export default Button;
