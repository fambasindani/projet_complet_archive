// @ts-nocheck
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  FaTachometerAlt, FaCogs, FaFolder, FaUsersCog, FaUserFriends,
  FaUserShield, FaKey, FaLayerGroup, FaBuilding, FaArchive,
  FaMapMarkerAlt, FaFileInvoiceDollar, FaUser, FaAngleDown, FaAngleUp,
  FaHome, FaChartBar, FaBars, FaTimes
} from "react-icons/fa";

const Menus = () => {
  const [openConfig, setOpenConfig] = useState(false);
  const [openGestion, setOpenGestion] = useState(false);
  const [activeMenu, setActiveMenu] = useState("");
  const [userPermissions, setUserPermissions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const location = useLocation();
  const entreprise = localStorage.getItem("archive_module"); // ad | np
  const hasPermission = (c) => userPermissions.includes(c);

  useEffect(() => {
    const p = JSON.parse(localStorage.getItem('permissions') || '[]');
    setUserPermissions(p);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
    const path = location.pathname;
    if (path.includes("/tableaudebord")) setActiveMenu("dashboard");
    else if (path.includes("/direction")) { setActiveMenu("direction"); setOpenConfig(true); }
    else if (path.includes("/classeur")) { setActiveMenu("classeur"); setOpenConfig(true); }
    else if (path.includes("/centre-ordonnancement")) { setActiveMenu("centre"); setOpenConfig(true); }
    else if (path.includes("/emplacement")) { setActiveMenu("emplacement"); setOpenConfig(true); }
    else if (path.includes("/ministere")) { setActiveMenu("ministere"); setOpenConfig(true); }
    else if (path.includes("/document")) setActiveMenu("document");
    else if (path.includes("/note-perception")) setActiveMenu("note-perception");
    else if (path.includes("/gestion-utilisateurs/dashboard")) { setActiveMenu("user-dashboard"); setOpenGestion(true); }
    else if (path.includes("/gestion-utilisateurs/utilisateurs")) { setActiveMenu("users"); setOpenGestion(true); }
    else if (path.includes("/gestion-utilisateurs/roles")) { setActiveMenu("roles"); setOpenGestion(true); }
    else if (path.includes("/gestion-utilisateurs/permissions")) { setActiveMenu("permissions"); setOpenGestion(true); }
    else if (path.includes("/profil")) setActiveMenu("profil");
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const isActive = (n) => activeMenu === n
    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
    : "text-slate-300 hover:bg-white/10 hover:text-white";

  const brandText = entreprise === "np" ? "Archiv-NP" : "Archiv-Docs";
  const brandGradient = entreprise === "np" ? "from-emerald-500 to-teal-600" : "from-blue-500 to-indigo-600";

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="h-20 flex items-center gap-3 px-5 border-b border-white/10 bg-slate-900/50 backdrop-blur">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${brandGradient} flex items-center justify-center shadow-lg`}>
          <FaArchive className="text-white text-xl" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[15px] tracking-wide truncate">{brandText}</div>
          <div className="text-[11px] text-slate-400 -mt-1">Système de Gestion</div>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition">
          <FaTimes size={16} />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
        {hasPermission('dashboard') && (
          <Link to={entreprise === "ad" ? "/tableaudebord" : "/tableaudebordnote"} className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${isActive("dashboard")}`}>
            <FaTachometerAlt className="text-lg shrink-0" />
            <span>Dashboard</span>
            <span className="ml-auto bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">1</span>
          </Link>
        )}

        {hasPermission('configuration') && (
          <div>
            <button onClick={() => setOpenConfig(!openConfig)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${openConfig ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
              <FaCogs className="text-lg" />
              <span>Configuration</span>
              <span className="ml-auto">{openConfig ? <FaAngleUp /> : <FaAngleDown />}</span>
            </button>
            {openConfig && (
              <div className="ml-4 mt-1 pl-4 border-l border-white/10 space-y-1">
                {(entreprise === "ad" && hasPermission('direction')) && (
                  <Link to="/direction" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive("direction")}`}> <FaBuilding /> Direction</Link>
                )}
                {hasPermission('classeur') && (
                  <Link to="/classeur" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive("classeur")}`}> <FaFolder /> Classeur</Link>
                )}
                {(entreprise === "np" && hasPermission('centre')) && (
                  <Link to="/centre-ordonnancement" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive("centre")}`}> <FaHome /> Centre</Link>
                )}
                {hasPermission('emplacement') && (
                  <Link to="/emplacement" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive("emplacement")}`}> <FaMapMarkerAlt /> Emplacement</Link>
                )}
                {(entreprise === "np" && hasPermission('serv_assiette')) && (
                  <Link to="/ministere" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive("ministere")}`}> <FaFileInvoiceDollar /> Serv. d'assiette</Link>
                )}
              </div>
            )}
          </div>
        )}

        {(entreprise === "ad" && hasPermission('archiv_doc') && hasPermission('acceder_au__document')) && (
          <Link to="/document" className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${isActive("document")}`}>
            <FaLayerGroup className="text-lg" /> Documents
            <span className="ml-auto bg-gradient-to-r from-pink-500 to-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">Nouveau</span>
          </Link>
        )}

        {(entreprise === "np" && hasPermission('note_perception') && hasPermission('acceder_au_note_perception')) && (
          <Link to="/note-perception" className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${isActive("note-perception")}`}>
            <FaChartBar className="text-lg" /> Note-Perception
          </Link>
        )}

        {hasPermission('utilisateur') && (
          <div>
            <button onClick={() => setOpenGestion(!openGestion)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${openGestion ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
              <FaUsersCog className="text-lg" /> Gestion Utilisateurs
              <span className="ml-auto">{openGestion ? <FaAngleUp /> : <FaAngleDown />}</span>
            </button>
            {openGestion && (
              <div className="ml-4 mt-1 pl-4 border-l border-white/10 space-y-1">
                <Link to="/gestion-utilisateurs/dashboard" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive("user-dashboard")}`}> <FaTachometerAlt /> Dashboard</Link>
                <Link to="/gestion-utilisateurs/utilisateurs" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive("users")}`}> <FaUserFriends /> Utilisateurs</Link>
                <Link to="/gestion-utilisateurs/roles" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive("roles")}`}> <FaUserShield /> Rôles</Link>
                <Link to="/gestion-utilisateurs/permissions" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive("permissions")}`}> <FaKey /> Permissions</Link>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 mt-4 border-t border-white/10">
          <div className="px-3 mb-2 text-[11px] tracking-widest text-slate-400 font-semibold">SYSTÈME</div>
          <Link to="/profil" className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${isActive("profil")}`}>
            <FaUser className="text-lg" /> Mon Profil
          </Link>
        </div>
      </div>

      {/* Footer mini */}
      <div className="p-3 border-t border-white/10 text-center text-[11px] text-slate-400">
        © 2026 GS-Archive
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg hover:bg-slate-800 transition"
      >
        <FaBars size={18} />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-white flex-col fixed inset-y-0 left-0 z-40 shadow-2xl">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside ref={sidebarRef} className="absolute inset-y-0 left-0 w-72 bg-slate-900 text-white flex flex-col shadow-2xl animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
};

export default Menus;
