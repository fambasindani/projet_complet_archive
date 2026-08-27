// @ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaSync, FaHistory, FaFilter, FaEye, FaCalendarAlt, FaUser, FaCog, FaDatabase, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { API_BASE_URL } from '../config';
import { toast } from '../Composant/Toast';
import DetailModal from '../Modals/DetailModal';
import LoadingSpinner from '../Loading/LoadingSpinner';

const JournalScreen = () => {
  const token = GetTokenOrRedirect();
  const getAuthHeaders = () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' });

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tables, setTables] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, this_week: 0, by_action: {}, by_table: {} });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [detailItem, setDetailItem] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(pagination.current_page));
      params.append('per_page', String(pagination.per_page));
      if (search) params.append('search', search);
      if (actionFilter) params.append('action', actionFilter);
      if (tableFilter) params.append('table_name', tableFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const [logsRes, statsRes, tablesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/journal?${params.toString()}`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/journal/stats`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/journal/tables`, { headers: getAuthHeaders() }),
      ]);

      if (logsRes.data.success) {
        const d = logsRes.data.data;
        setLogs(d.data || []);
        setPagination({ current_page: d.current_page || 1, last_page: d.last_page || 1, per_page: d.per_page || 15, total: d.total || 0 });
      }
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (tablesRes.data.success) setTables(tablesRes.data.data || []);
    } catch (error) {
      toast.error('Erreur de chargement du journal');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => { setPagination(p => ({ ...p, current_page: 1 })); };
  const handlePageChange = (page) => { if (page >= 1 && page <= pagination.last_page) setPagination(p => ({ ...p, current_page: page })); };

  useEffect(() => { fetchData(); }, [pagination.current_page, actionFilter, tableFilter, dateFrom, dateTo]);
  useEffect(() => { const t = setTimeout(() => { setPagination(p => ({ ...p, current_page: 1 })); }, 500); return () => clearTimeout(t); }, [search]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <FaHistory className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">Journal des activités</h1>
                <p className="text-sm text-slate-500 font-medium">Historique complet des actions du système</p>
              </div>
            </div>
            <button onClick={fetchData} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50">
              <FaSync size={13} className={loading ? 'animate-spin' : ''} /> Actualiser
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                <FaHistory className="text-violet-600" size={16} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{stats.total}</p>
                <p className="text-xs font-semibold text-slate-500">Total actions</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <FaCalendarAlt className="text-blue-600" size={16} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{stats.today}</p>
                <p className="text-xs font-semibold text-slate-500">Aujourd'hui</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <FaCog className="text-emerald-600" size={16} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{stats.this_week}</p>
                <p className="text-xs font-semibold text-slate-500">Cette semaine</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <FaDatabase className="text-amber-600" size={16} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{Object.keys(stats.by_table).length}</p>
                <p className="text-xs font-semibold text-slate-500">Tables actives</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-slate-400" placeholder="Rechercher dans les logs..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
              </div>
              <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPagination(p => ({ ...p, current_page: 1 })); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-4 focus:ring-violet-100">
                <option value="">Toutes les actions</option>
                <option value="CREATE">Création</option>
                <option value="UPDATE">Modification</option>
                <option value="DELETE">Suppression</option>
                <option value="LOGIN">Connexion</option>
                <option value="LOGOUT">Déconnexion</option>
              </select>
              <select value={tableFilter} onChange={(e) => { setTableFilter(e.target.value); setPagination(p => ({ ...p, current_page: 1 })); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-4 focus:ring-violet-100">
                <option value="">Toutes les tables</option>
                {tables.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex gap-2 items-center">
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPagination(p => ({ ...p, current_page: 1 })); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-4 focus:ring-violet-100" />
              <span className="text-slate-400 text-sm">à</span>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPagination(p => ({ ...p, current_page: 1 })); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-4 focus:ring-violet-100" />
              <button onClick={handleSearch} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/20 hover:bg-violet-700 transition disabled:opacity-50 shrink-0">
                <FaSearch size={13} /> Filtrer
              </button>
            </div>
          </div>
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Chargement des logs..." subtitle="Veuillez patienter" size="lg" variant="table" />
          ) : logs.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                <FaHistory className="text-slate-300" size={32} />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Aucun log trouvé</h3>
              <p className="text-sm text-slate-500 mt-1">{search || actionFilter || tableFilter || dateFrom || dateTo ? "Aucun résultat pour vos filtres" : "Le journal est vide"}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-bold tracking-wider text-slate-500 uppercase">Date</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold tracking-wider text-slate-500 uppercase">Utilisateur</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold tracking-wider text-slate-500 uppercase">Action</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold tracking-wider text-slate-500 uppercase">Table</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold tracking-wider text-slate-500 uppercase">Description</th>
                      <th className="px-5 py-3.5 text-center text-xs font-bold tracking-wider text-slate-500 uppercase">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-slate-900">{new Date(log.created_at).toLocaleDateString('fr-FR')}</p>
                          <p className="text-xs text-slate-500">{new Date(log.created_at).toLocaleTimeString('fr-FR')}</p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                              <FaUser className="text-violet-600" size={12} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{log.user?.name || 'Système'}</p>
                              <p className="text-xs text-slate-500">{log.user?.email || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            log.action === 'DELETE' ? 'bg-red-50 text-red-700 border border-red-200' :
                            log.action === 'LOGIN' ? 'bg-violet-50 text-violet-700 border border-violet-200' :
                            'bg-slate-50 text-slate-700 border border-slate-200'
                          }`}>
                            {log.action === 'CREATE' ? 'Création' : log.action === 'UPDATE' ? 'Modification' : log.action === 'DELETE' ? 'Suppression' : log.action === 'LOGIN' ? 'Connexion' : log.action === 'LOGOUT' ? 'Déconnexion' : log.action}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
                            <FaDatabase size={10} className="text-slate-400" /> {log.table_name}
                          </span>
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <p className="text-sm text-slate-700 truncate">{log.description || '—'}</p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button onClick={() => setDetailItem(log)} className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 hover:bg-violet-100 transition">
                            <FaEye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white rounded-b-2xl border-t border-slate-100 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-600">
                    Affichage de <span className="font-semibold text-slate-900">{(pagination.current_page - 1) * pagination.per_page + 1}</span> à{' '}
                    <span className="font-semibold text-slate-900">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> sur{' '}
                    <span className="font-semibold text-slate-900">{pagination.total}</span> logs
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition">
                    <FaChevronLeft className="text-xs" />
                  </button>
                  {Array.from({ length: Math.min(pagination.last_page, 7) }, (_, i) => {
                    let pageNum;
                    if (pagination.last_page <= 7) pageNum = i + 1;
                    else if (pagination.current_page <= 4) pageNum = i + 1;
                    else if (pagination.current_page >= pagination.last_page - 3) pageNum = pagination.last_page - 6 + i;
                    else pageNum = pagination.current_page - 3 + i;
                    const active = pagination.current_page === pageNum;
                    return (
                      <button key={i} onClick={() => handlePageChange(pageNum)} className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-sm font-semibold transition ${active ? "bg-violet-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                        {pageNum}
                      </button>
                    );
                  })}
                  <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition">
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* DetailModal */}
        <DetailModal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title={detailItem ? `Log #${detailItem.id}` : 'Détails'}>
          {detailItem && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">ID</p><p className="text-sm font-mono font-semibold text-slate-900 mt-1">#{detailItem.id}</p></div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">Action</p><p className="text-sm font-semibold text-slate-900 mt-1">{detailItem.action}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">Table</p><p className="text-sm font-mono font-semibold text-slate-900 mt-1">{detailItem.table_name}</p></div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">Record ID</p><p className="text-sm font-mono font-semibold text-slate-900 mt-1">{detailItem.record_id || '—'}</p></div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Utilisateur</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{detailItem.user?.name || 'Système'} {detailItem.user?.email ? `(${detailItem.user.email})` : ''}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Description</p>
                <p className="text-sm text-slate-700 mt-1">{detailItem.description || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">IP</p><p className="text-sm font-mono text-slate-700 mt-1">{detailItem.ip_address || '—'}</p></div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">Date</p><p className="text-sm text-slate-700 mt-1">{detailItem.created_at ? new Date(detailItem.created_at).toLocaleString('fr-FR') : '—'}</p></div>
              </div>
              {detailItem.user_agent && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs font-bold tracking-widest uppercase text-slate-400">User Agent</p>
                  <p className="text-xs text-slate-500 mt-1 break-all">{detailItem.user_agent}</p>
                </div>
              )}
            </div>
          )}
        </DetailModal>
      </div>
    </div>
  );
};

export default JournalScreen;
