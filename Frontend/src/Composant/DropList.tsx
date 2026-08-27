import React from "react";

const Droplist = ({
  name,
  value,
  onChange,
  options = [],
  placeholder = "-- Sélectionnez --",
  error,
  disabled
}) => {
  return (
    <div>
      <div className="relative">
        <select
          name={name}
          className={`w-full appearance-none border rounded-xl px-3.5 py-2.5 pr-10 text-sm bg-white transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${
            error
              ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
              : 'border-slate-200 hover:border-slate-300'
          } ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'text-slate-700'}`}
          value={value}
          onChange={onChange}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt.id} value={opt.id}>
              {opt.nom || opt.nom_emplacement || opt.nom_classeur || opt.nom_raison_sociale || "Option"}
            </option>
          ))}
        </select>
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
};

export default Droplist;
