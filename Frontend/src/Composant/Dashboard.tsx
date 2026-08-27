// @ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  FaSpinner,
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaUserLock,
  FaBuilding,
  FaUserTag,
  FaCalendarAlt,
  FaEnvelope,
  FaChevronRight,
  FaSync,
  FaChartPie,
  FaChartBar,
  FaClock,
  FaShieldAlt,
  FaUserCog,
  FaDoorOpen,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaUserPlus,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';

const Dashboard = () => {
  const token = GetTokenOrRedirect();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    users: {
      total: 0,
      active: 0,
      inactive: 0,
      blocked: 0
    },
    roles: [],
    directions: [],
    recent_users: [],
    total_roles: 0,
    total_directions: 0,
    directions_with_users: 0
  });

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/statistique`, {
        headers: getAuthHeaders()
      });

      console.log('API Response Dashboard:', response.data);

      if (response.data && response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);

      if (error.response?.status === 401) {
        return;
      }

      toast.error('Impossible de charger les données du tableau de bord');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getStatusBadge = (statut) => {
    const config = {
      active: {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: FaUserCheck,
        text: 'Actif',
        dot: 'bg-emerald-500'
      },
      inactive: {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: FaUserTimes,
        text: 'Inactif',
        dot: 'bg-amber-500'
      },
      bloqué: {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: FaUserLock,
        text: 'Bloqué',
        dot: 'bg-rose-500'
      }
    };

    const { bg, icon: Icon, text, dot } = config[statut] || config.active;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        <Icon size={11} />
        {text}
      </span>
    );
  };

  const StatCard = ({ title, value, icon, color, subtitle, trend, trendValue, onClick }) => {
    const colorMap = {
      primary: { iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', bar: 'from-indigo-600 to-violet-600', ring: 'ring-indigo-100' },
      success: { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', bar: 'from-emerald-500 to-teal-600', ring: 'ring-emerald-100' },
      warning: { iconBg: 'bg-amber-50', iconColor: 'text-amber-600', bar: 'from-amber-500 to-orange-500', ring: 'ring-amber-100' },
      danger: { iconBg: 'bg-rose-50', iconColor: 'text-rose-600', bar: 'from-rose-500 to-pink-600', ring: 'ring-rose-100' },
    };
    const c = colorMap[color] || colorMap.primary;

    const getTrendIcon = () => {
      if (!trend) return null;
      if (trend === 'up') return <FaArrowUp className="text-emerald-600" size={10} />;
      if (trend === 'down') return <FaArrowDown className="text-rose-600" size={10} />;
      return <FaMinus className="text-amber-600" size={10} />;
    };

    return (
      <div
        onClick={onClick}
        className={`group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col ${onClick ? 'cursor-pointer' : ''}`}
      >
        <div className={`h-1 w-full bg-gradient-to-r ${c.bar}`} />
        <div className="p-5 flex-1">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">{title}</p>
              <p className="text-[30px] font-extrabold tracking-tight text-slate-900 leading-none mt-2">{value}</p>
              {subtitle && (
                <p className="text-xs font-medium text-slate-500 mt-2 leading-snug">{subtitle}</p>
              )}
              {trend && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-50 border border-slate-200">
                  {getTrendIcon()}
                  <span className={`text-[11px] font-bold ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-amber-600'}`}>
                    {trendValue} vs mois dernier
                  </span>
                </div>
              )}
            </div>
            <div className={`w-12 h-12 rounded-xl ${c.iconBg} border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition ${c.iconColor} shadow-sm ring-4 ${c.ring}`}>
              {icon}
            </div>
          </div>
        </div>
        <div className={`px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between ${onClick ? 'group-hover:bg-slate-900 group-hover:text-white transition-colors' : ''}`}>
          <span className={`text-xs font-semibold ${onClick ? 'text-slate-600 group-hover:text-white' : 'text-slate-500'}`}>Voir les détails</span>
          <span className={`w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center ${onClick ? 'group-hover:bg-white/20 group-hover:border-white/20 group-hover:text-white' : ''} text-slate-500 transition`}>
            <FaChevronRight size={11} />
          </span>
        </div>
      </div>
    );
  };

  const renderLoading = () => (
    <div className="text-center py-10">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
        <FaSpinner className="animate-spin text-indigo-600" size={22} />
      </div>
      <h4 className="text-sm font-bold text-slate-900">Chargement du tableau de bord...</h4>
      <p className="text-xs text-slate-500 mt-1">Veuillez patienter pendant le chargement des données</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Header gradient premium - bleu comme les autres dashboards */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-600 px-6 sm:px-8 py-7 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0" />
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -right-20 -bottom-10 w-56 h-56 bg-violet-300/20 rounded-full blur-3xl" />
            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center shadow-lg shrink-0">
                  <FaChartPie className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-[22px] font-extrabold tracking-tight text-white leading-none">Gestion des Utilisateurs</h1>
                  <p className="text-sm text-indigo-100 mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur border border-white/20 px-2.5 py-1 rounded-full text-xs font-semibold text-white">
                      <FaClock size={11} /> Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-white/80 text-xs">
                      <FaShieldAlt size={11} /> Administration centrale
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-sm font-bold text-indigo-700 shadow-lg shadow-indigo-900/20 hover:bg-slate-50 transition disabled:opacity-60"
                >
                  <FaSync className={`${refreshing ? 'animate-spin' : ''}`} size={13} />
                  {refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
                </button>
                <Link to="/gestion-utilisateurs/utilisateurs" className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 backdrop-blur border border-white/20 text-sm font-semibold text-white hover:bg-white/20 transition">
                  <FaUsers size={13} /> Utilisateurs
                </Link>
              </div>
            </div>
          </div>
          <div className="px-6 sm:px-8 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 font-semibold"><FaUsers className="text-indigo-500" size={11} /> {stats.users?.total || 0} utilisateurs</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 font-semibold"><FaUserTag className="text-amber-500" size={11} /> {stats.total_roles || 0} rôles</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 font-semibold"><FaBuilding className="text-emerald-500" size={11} /> {stats.total_directions || 0} directions</span>
            </div>
          </div>
        </div>

        {/* Stats 4 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Utilisateurs Totaux"
            value={stats.users?.total || 0}
            icon={<FaUsers size={20} />}
            color="primary"
            subtitle="Tous les utilisateurs enregistrés"
            trend="up"
            trendValue="+12%"
          />
          <StatCard
            title="Actifs"
            value={stats.users?.active || 0}
            icon={<FaUserCheck size={20} />}
            color="success"
            subtitle={`${stats.users?.total > 0 ? ((stats.users.active / stats.users.total) * 100).toFixed(1) : 0}% du total`}
            trend={stats.users?.active > 0 ? 'up' : 'down'}
            trendValue={`${((stats.users?.active / (stats.users?.total || 1)) * 100).toFixed(0)}%`}
          />
          <StatCard
            title="Inactifs"
            value={stats.users?.inactive || 0}
            icon={<FaUserTimes size={20} />}
            color="warning"
            subtitle={`${stats.users?.total > 0 ? ((stats.users.inactive / stats.users.total) * 100).toFixed(1) : 0}% du total`}
            trend="down"
            trendValue="-5%"
          />
          <StatCard
            title="Bloqués"
            value={stats.users?.blocked || 0}
            icon={<FaUserLock size={20} />}
            color="danger"
            subtitle={`${stats.users?.total > 0 ? ((stats.users.blocked / stats.users.total) * 100).toFixed(1) : 0}% du total`}
            trend="down"
            trendValue="-2%"
          />
        </div>

        {/* Grille centrale : récents + rôles + directions */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

          {/* Utilisateurs récents */}
          <div className="xl:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
                  <FaUserPlus className="text-sky-600" size={14} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Utilisateurs Récents</h3>
              </div>
              <Link to="/gestion-utilisateurs/utilisateurs" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-black transition">
                Voir tous <FaChevronRight size={10} />
              </Link>
            </div>

            <div className="flex-1">
              {loading ? (
                <div className="p-4">{renderLoading()}</div>
              ) : stats.recent_users && stats.recent_users.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {stats.recent_users.slice(0, 5).map((user, index) => (
                    <div key={user.id} className="p-4 hover:bg-slate-50/70 transition group">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/20 shrink-0">
                          {user.prenom?.[0]}{user.nom?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 truncate">{user.prenom} {user.nom}</h4>
                              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                                <FaEnvelope size={11} className="text-slate-400 shrink-0" /> <span className="truncate">{user.email}</span>
                              </p>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {user.roles && user.roles.length > 0 ? (
                                  user.roles.slice(0, 2).map((role) => (
                                    <span key={role.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                      <FaShieldAlt size={9} /> {role.nom}
                                    </span>
                                  ))
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                                    <FaUserCog size={9} /> Aucun rôle
                                  </span>
                                )}
                                {user.roles?.length > 2 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-white">
                                    +{user.roles.length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0 flex flex-col items-end gap-2">
                              {getStatusBadge(user.statut)}
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full">
                                <FaCalendarAlt size={10} className="text-slate-400" />
                                {format(new Date(user.datecreation), 'dd/MM/yyyy', { locale: fr })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3">
                    <FaUsers className="text-slate-300" size={26} />
                  </div>
                  <h6 className="text-sm font-semibold text-slate-700">Aucun utilisateur récent</h6>
                  <p className="text-xs text-slate-500 mt-1">Les nouveaux utilisateurs apparaîtront ici</p>
                </div>
              )}
            </div>

            {!loading && stats.recent_users?.length > 0 && (
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  <FaClock size={11} className="text-slate-400" /> Derniers {Math.min(stats.recent_users.length, 5)} utilisateurs inscrits
                </span>
              </div>
            )}
          </div>

          {/* Rôles */}
          <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <FaUserTag className="text-amber-600" size={14} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Rôles</h3>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow">
                {stats.total_roles || 0} total
              </span>
            </div>
            <div className="p-5 flex-1">
              {loading ? (
                renderLoading()
              ) : stats.roles && stats.roles.length > 0 ? (
                <>
                  <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                    {stats.roles.map((role, index) => {
                      const palette = [
                        { dot: 'bg-indigo-500', bar: 'bg-indigo-600' },
                        { dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
                        { dot: 'bg-sky-500', bar: 'bg-sky-500' },
                        { dot: 'bg-amber-500', bar: 'bg-amber-500' },
                      ];
                      const pal = palette[index % 4];
                      const pct = stats.users?.total > 0 ? ((role.users_count || 0) / stats.users.total * 100) : 0;
                      return (
                        <div key={role.id} className={index < stats.roles.length - 1 ? 'pb-4 border-b border-slate-100' : ''}>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-2.5 h-2.5 rounded-full ${pal.dot} shrink-0`} />
                              <span className="text-sm font-semibold text-slate-900 truncate">{role.nom}</span>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shrink-0">
                              {role.users_count || 0}
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${pal.bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[11px] font-medium text-slate-500 mt-1.5 text-right">{pct.toFixed(1)}% des utilisateurs</p>
                        </div>
                      );
                    })}
                  </div>
                  <Link to="/gestion-utilisateurs/roles" className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition">
                    Gérer les rôles <FaChevronRight size={11} />
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3">
                    <FaUserTag className="text-slate-300" size={26} />
                  </div>
                  <p className="text-sm text-slate-500 mb-3">Aucun rôle disponible</p>
                  <Link to="/gestion-utilisateurs/roles" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition">
                    Créer un rôle
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Directions */}
          <div className="xl:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <FaBuilding className="text-emerald-600" size={14} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Directions</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow">
                  {stats.directions_with_users || 0} actives
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {stats.total_directions || 0} total
                </span>
              </div>
            </div>
            <div className="p-5 flex-1">
              {loading ? (
                renderLoading()
              ) : stats.directions && stats.directions.length > 0 ? (
                <>
                  <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    {stats.directions.slice(0, 6).map((direction, index) => {
                      const styles = [
                        { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600', bar: 'bg-indigo-600' },
                        { bg: 'bg-sky-50', border: 'border-sky-100', text: 'text-sky-600', bar: 'bg-sky-500' },
                        { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', bar: 'bg-emerald-500' },
                      ];
                      const s = styles[index % 3];
                      const pct = stats.users?.total > 0 ? ((direction.users_count || 0) / stats.users.total * 100) : 0;
                      return (
                        <div key={direction.id} className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center shrink-0`}>
                            <FaBuilding className={s.text} size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-bold text-slate-900 truncate">{direction.sigle}</span>
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 shrink-0">
                                <FaUsers size={10} className="text-slate-400" /> {direction.users_count || 0}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate" title={direction.nom}>{direction.nom}</p>
                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-2">
                              <div className={`h-full ${s.bar} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {stats.directions.length > 6 && (
                    <p className="text-center text-xs font-semibold text-slate-500 mt-4 bg-slate-50 border border-slate-200 rounded-full py-2">
                      +{stats.directions.length - 6} autres directions
                    </p>
                  )}
                  <Link to="/gestion-utilisateurs/directions" className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition">
                    Gérer les directions <FaChevronRight size={11} />
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3">
                    <FaBuilding className="text-slate-300" size={26} />
                  </div>
                  <p className="text-sm text-slate-500 mb-3">Aucune direction disponible</p>
                  <Link to="/gestion-utilisateurs/directions" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition">
                    Créer une direction
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistiques globales - footer premium */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <FaChartBar className="text-white" size={14} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Statistiques Globales</h3>
            <span className="ml-auto text-xs font-medium text-slate-500 hidden sm:inline">Vue d'ensemble du système</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3">
                  <FaUsers className="text-indigo-600" size={18} />
                </div>
                <p className="text-2xl font-extrabold text-slate-900">{stats.users?.total || 0}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Utilisateurs</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition">
                <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-3">
                  <FaUserTag className="text-sky-600" size={18} />
                </div>
                <p className="text-2xl font-extrabold text-slate-900">{stats.total_roles || 0}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Rôles</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <FaBuilding className="text-emerald-600" size={18} />
                </div>
                <p className="text-2xl font-extrabold text-slate-900">{stats.total_directions || 0}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Directions</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-3">
                  <FaDoorOpen className="text-amber-600" size={18} />
                </div>
                <p className="text-2xl font-extrabold text-slate-900">{stats.directions_with_users || 0}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Directions actives</p>
              </div>
            </div>
          </div>
        </div>

      </div>
                
</div>
  );
};

export default Dashboard;
