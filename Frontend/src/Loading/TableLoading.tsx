// @ts-nocheck
// 📁 Composant/TableLoading.jsx
import React from "react";
import { FaSpinner } from "react-icons/fa";

const TableLoading = ({ 
  message = "Chargement des données...", 
  colSpan = 6 
}) => {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-5">
        <div className="spinner-wrapper mb-3">
          <FaSpinner className="fa-spin text-indigo-600" size={32} />
        </div>
        <p className="text-gray-500 mb-0">{message}</p>
      </td>
    </tr>
  );
};

export default TableLoading;