import React from "react";

const Input = ({
  type = "text",
  name,
  placeholder,
  value,
  onChange,
  icon,
  error,
  disabled
}) => {
  return (
    <div>
      <input
        type={type}
        name={name}
        className={`w-full border rounded-xl px-3.5 py-2.5 text-sm transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${
          error
            ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700'}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
};

export default Input;
