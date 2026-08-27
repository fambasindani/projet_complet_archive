// @ts-nocheck
import { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { FaUser, FaSignOutAlt, FaBars, FaChevronDown, FaBell, FaEnvelope } from "react-icons/fa";

const Head = () => {
  const utilisateur = JSON.parse(localStorage.getItem("utilisateur") || "null");
  const nom = utilisateur?.nom || ""; const prenom = utilisateur?.prenom || "";
  const email = utilisateur?.email || ""; const nomcomplet = `${prenom} ${nom}`.trim() || "Utilisateur";
  const history = useHistory();
  const [showDropdown, setShowDropdown] = useState(false);
  const logout = () => { localStorage.clear(); history.push("/"); };

  return (
    <header className="h-[64px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between pl-14 pr-4 lg:pl-6 lg:pr-6 shadow-lg sticky top-0 z-30">
      <div className="hidden lg:block text-sm font-medium tracking-wide opacity-90">Archivage Électronique • DGRAD</div>
      <div className="flex items-center gap-2">
        <button className="relative p-2.5 rounded-xl hover:bg-white/10 transition">
          <FaBell className="opacity-90" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">3</span>
        </button>
        <button className="relative p-2.5 rounded-xl hover:bg-white/10 transition">
          <FaEnvelope className="opacity-90" />
          <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">5</span>
        </button>
        <div className="relative ml-2">
          <button onClick={() => setShowDropdown(!showDropdown)} onBlur={() => setTimeout(() => setShowDropdown(false), 180)} className="flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-full pl-1 pr-3 py-1 transition">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-cyan-400 flex items-center justify-center font-bold text-sm">
              {prenom?.[0]}{nom?.[0]}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-sm font-semibold">{nomcomplet}</div>
              <div className="text-xs opacity-70 -mt-1">{email}</div>
            </div>
            <FaChevronDown className="text-xs opacity-70" />
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold">{prenom?.[0]}{nom?.[0]}</div>
                <div>
                  <div className="font-semibold">{nomcomplet}</div>
                  <div className="text-xs opacity-80">{email}</div>
                </div>
              </div>
              <Link to="/profil" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700">
                <FaUser className="text-indigo-600" />
                <div><div className="font-medium text-sm">Mon Profil</div><div className="text-xs text-gray-500">Gérer vos informations</div></div>
              </Link>
              <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 border-t">
                <FaSignOutAlt />
                <div className="text-left"><div className="font-medium text-sm">Déconnecter</div><div className="text-xs opacity-70">Quitter la session</div></div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Head;
