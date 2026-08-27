// @ts-nocheck
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaUsers,
  FaUserShield,
  FaKey,
  FaTachometerAlt,
  FaBars,
  FaTimes,
  FaHome,
  FaBuilding,
  FaChevronRight,
  FaShieldAlt,
  FaHistory,
} from 'react-icons/fa';

const UserManagementLayout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const menuItems = [
    {
      path: '/gestion-utilisateurs/dashboard',
      label: 'Dashboard',
      desc: 'Vue générale',
      icon: <FaTachometerAlt size={14} />,
    },
    {
      path: '/gestion-utilisateurs/utilisateurs',
      label: 'Utilisateurs',
      desc: 'Gestion comptes',
      icon: <FaUsers size={14} />,
    },
    {
      path: '/gestion-utilisateurs/roles',
      label: 'Rôles',
      desc: 'Permissions rôles',
      icon: <FaUserShield size={14} />,
    },
    {
      path: '/gestion-utilisateurs/permissions',
      label: 'Permissions',
      desc: 'Droits d’accès',
      icon: <FaKey size={14} />,
    },
    {
      path: '/gestion-utilisateurs/directions',
      label: 'Directions',
      desc: 'Entités & sigles',
      icon: <FaBuilding size={14} />,
    },
    {
      path: '/gestion-utilisateurs/journal',
      label: 'Journal',
      desc: 'Historique des actions',
      icon: <FaHistory size={14} />,
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header premium - bleu/violet comme les autres */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 shadow-lg">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[64px] gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden w-9 h-9 rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? <FaTimes size={14} /> : <FaBars size={14} />}
              </button>

              <Link to="/gestion-utilisateurs/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center shadow-lg">
                  <FaShieldAlt className="text-white" size={16} />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-extrabold tracking-tight text-white leading-none">Gestion des Utilisateurs</p>
                  <p className="text-[11px] font-semibold tracking-widest text-white/70 uppercase">Administration • ArchiveCB</p>
                </div>
                <span className="sm:hidden text-sm font-extrabold text-white">Admin</span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-xs font-bold text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Système actif
              </span>
              <Link
                to="/tableaudebord"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-700 text-xs sm:text-sm font-bold hover:bg-slate-50 transition shadow"
              >
                <FaHome size={13} /> <span className="hidden sm:inline">Dashboard Principal</span><span className="sm:hidden">Accueil</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 items-start">
          {/* Sidebar desktop + mobile overlay */}
          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 lg:hidden"
            />
          )}

          <aside
            className={`
              bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0
              lg:sticky lg:top-[88px] lg:h-[calc(100vh-104px)] lg:w-[260px] lg:flex lg:flex-col lg:overflow-y-auto
              fixed inset-y-0 left-0 z-40 w-[300px] flex flex-col transition-transform duration-300
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              max-lg:rounded-none max-lg:border-y-0 max-lg:border-l-0
            `}
          >
            {/* Sidebar header */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                    <FaUserShield className="text-white" size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900 leading-none">Administration</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
                >
                  <FaTimes size={12} />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                <span className="h-px flex-1 bg-slate-200" /> MENU <span className="h-px flex-1 bg-slate-200" />
              </div>
            </div>

            {/* Nav */}
            <nav className="p-3 space-y-1.5 overflow-y-auto flex-1">
              {menuItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition border ${
                      active
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                        active ? 'bg-white/15 text-white border border-white/20' : 'bg-slate-50 border border-slate-200 text-slate-600 group-hover:bg-white'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0 text-left">
                      <p className={`leading-none text-[13px] font-bold ${active ? 'text-white' : 'text-slate-900'}`}>{item.label}</p>
                      <p className={`text-[11px] font-medium mt-1 leading-none ${active ? 'text-indigo-100' : 'text-slate-500'}`}>{item.desc}</p>
                    </div>
                    <FaChevronRight size={11} className={`${active ? 'text-white/70' : 'text-slate-300 group-hover:text-slate-400'} transition shrink-0`} />
                  </Link>
                );
              })}
            </nav>

            {/* Footer card */}
            <div className="p-3 border-t border-slate-100 bg-slate-50">
              <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0">
                  <FaShieldAlt className="text-white" size={12} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 leading-none">ArchiveCB</p>
                  <p className="text-[11px] font-medium text-slate-500 truncate">Gestion centralisée</p>
                </div>
                <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              </div>
              <p className="text-[11px] text-center font-medium text-slate-400 mt-2">© 2026 • Premium UI • Tailwind</p>
            </div>
          </aside>

          {/* Main Content centered premium */}
          <main className="flex-1 min-w-0">
            <div className="bg-transparent">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default UserManagementLayout;
