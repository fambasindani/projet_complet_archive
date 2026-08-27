/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useEffect, useState } from "react";
import axios from "axios";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import ModalCentre from "../Modals/ModalCentre";
import ActionDropdown from "../Composant/ActionDropdown";
import {
    FaEdit,
    FaTrash,
    FaPlus,
    FaSearch,
    FaEye,
    FaChevronLeft,
    FaChevronRight,
    FaSync,
    FaCheckCircle,
    FaTimesCircle,
    FaCalendarAlt,
    FaBuilding,
} from "react-icons/fa";
import LoadingSpinner from "../Loading/LoadingSpinner";
import DetailModal from "../Modals/DetailModal";
import ConfirmModal from "../Modals/ConfirmModal";

const CentreScreen = () => {
    const [centres, setCentres] = useState([]);
    const [ministeres, setMinisteres] = useState([]);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 10,
    });
    const [modeRecherche, setModeRecherche] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [centreToEdit, setCentreToEdit] = useState(null);
    const [detailCentre, setDetailCentre] = useState(null);
    const [confirmCentre, setConfirmCentre] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const [statsCards, setStatsCards] = useState([
        {
            id: 1,
            title: "Total Centres",
            value: "0",
            icon: <FaBuilding className="text-white text-xl" />,
            gradient: "from-indigo-500 via-indigo-600 to-violet-600",
            description: "Tous les centres",
        },
        {
            id: 2,
            title: "Actifs",
            value: "0",
            icon: <FaCheckCircle className="text-white text-xl" />,
            gradient: "from-emerald-500 via-teal-500 to-cyan-600",
            description: "Centres actifs",
        },
        {
            id: 3,
            title: "Inactifs",
            value: "0",
            icon: <FaTimesCircle className="text-white text-xl" />,
            gradient: "from-amber-500 via-orange-500 to-orange-600",
            description: "Centres inactifs",
        },
    ]);

    const token = GetTokenOrRedirect();

    useEffect(() => {
        if (centres.length > 0) {
            const total = centres.length;
            const actifs = centres.filter((c) => c.statut === "1" || c.statut === 1 || c.statut === true).length;
            const inactifs = total - actifs;

            setStatsCards([
                {
                    id: 1,
                    title: "Total Centres",
                    value: total.toString(),
                    icon: <FaBuilding className="text-white text-xl" />,
                    gradient: "from-indigo-500 via-indigo-600 to-violet-600",
                    description: "Tous les centres",
                },
                {
                    id: 2,
                    title: "Actifs",
                    value: actifs.toString(),
                    icon: <FaCheckCircle className="text-white text-xl" />,
                    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
                    description: `${actifs > 0 ? Math.round((actifs / total) * 100) : 0}% actifs`,
                },
                {
                    id: 3,
                    title: "Inactifs",
                    value: inactifs.toString(),
                    icon: <FaTimesCircle className="text-white text-xl" />,
                    gradient: "from-amber-500 via-orange-500 to-orange-600",
                    description: `${inactifs > 0 ? Math.round((inactifs / total) * 100) : 0}% inactifs`,
                },
            ]);
        }
    }, [centres]);

    useEffect(() => {
        if (token) {
            fetchMinisteres();
            fetchCentres();
        }
    }, [pagination.current_page, pagination.per_page, modeRecherche, token]);

    const fetchMinisteres = async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${API_BASE_URL}/article`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMinisteres(res.data.data || res.data);
        } catch (err) {
            console.error("Erreur lors du chargement des ministères :", err);
        }
    };

    const fetchCentres = async (overridePage?: number) => {
        if (!token) return;

        const page = overridePage ?? pagination.current_page;
        setLoading(true);
        try {
            let res;
            if (modeRecherche && search.trim() !== "") {
                res = await axios.post(
                    `${API_BASE_URL}/centre_ordonnancements/search`,
                    { search, page, per_page: pagination.per_page },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                res = await axios.get(`${API_BASE_URL}/centre_ordonnancements/all?page=${page}&per_page=${pagination.per_page}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            setCentres(res.data.data || []);
            setPagination({
                current_page: res.data.current_page || 1,
                last_page: res.data.last_page || 1,
                total: res.data.total || 0,
                per_page: res.data.per_page || 10,
            });
        } catch (err) {
            console.error("Erreur lors du chargement des centres :", err);
            toast.error("Erreur lors du chargement des centres");
        } finally {
            setLoading(false);
        }
    };

    const handlePerPageChange = (e) => {
        const newPerPage = parseInt(e.target.value, 10);
        setPagination(prev => ({ ...prev, per_page: newPerPage, current_page: 1 }));
    };

    const handleSearch = () => {
        setPagination((prev) => ({ ...prev, current_page: 1 }));
        setModeRecherche(true);
    };

    const actualiser = () => {
        setSearch("");
        setModeRecherche(false);
        setPagination({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
    };

    const handleEdit = (centre) => {
        setCentreToEdit(centre);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (!token) return;
        const c = centres.find((x) => x.id === id);
        if (c) setConfirmCentre(c);
    };

    const confirmDelete = async () => {
        if (!confirmCentre || !token) return;
        const idToDelete = confirmCentre.id;
        setConfirmLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/centre_ordonnancements/${idToDelete}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setConfirmCentre(null);
            toast.success("Centre supprimé avec succès");
            fetchCentres(1);
        } catch (error) {
            setConfirmCentre(null);
            console.error(error);
            toast.error(error.response?.data?.message || "Erreur lors de la suppression");
        } finally {
            setConfirmLoading(false);
        }
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.last_page) {
            setPagination((prev) => ({ ...prev, current_page: page }));
        }
    };

    const handleModalSuccess = () => {
        fetchCentres();
        fetchMinisteres();
        setCentreToEdit(null);
    };

    const getStatusBadge = (statut) => {
        const isActive = statut === "1" || statut === 1 || statut === true;
        if (isActive) {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Actif
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Inactif
            </span>
        );
    };

    const getMinistereName = (id_ministere) => {
        const ministere = ministeres.find((m) => m.id === id_ministere);
        return ministere ? ministere.nom : "Non défini";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Menus />
            <Head />
            <div className="lg:pl-64">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
                                    <FaBuilding className="text-white" size={20} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                        Gestion des Centres d'Ordonnancement
                                    </h1>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Gérez les centres d'ordonnancement de votre organisation
                                    </p>
                                </div>
                            </div>
                            <nav className="flex items-center gap-2 text-sm">
                                <a href="/" className="text-slate-500 hover:text-indigo-600 transition-colors">
                                    Accueil
                                </a>
                                <span className="text-slate-300">/</span>
                                <span className="font-medium text-slate-900">Centres</span>
                            </nav>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                        {statsCards.map((card) => (
                            <div
                                key={card.id}
                                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-6 shadow-sm`}
                            >
                                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                                <div className="absolute -right-2 -bottom-8 h-32 w-32 rounded-full bg-white/5" />
                                <div className="relative flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                                            {card.title}
                                        </p>
                                        <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
                                        <p className="mt-1 text-xs font-medium text-white/70">{card.description}</p>
                                    </div>
                                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/20">
                                        {card.icon}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Toolbar - Recherche + Ajouter */}
                    <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-1 items-center gap-3 max-w-3xl">
                                <div className="relative flex-1">
                                    <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un centre..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition"
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition"
                                >
                                    <FaSearch className="text-xs" /> Rechercher
                                </button>
                                <button
                                    onClick={actualiser}
                                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                                >
                                    <FaSync className="text-xs" /> Actualiser
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setCentreToEdit(null);
                                    setShowModal(true);
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition lg:shrink-0"
                            >
                                <FaPlus className="text-xs" /> Ajouter un Centre
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
                        {loading ? (
                            <div className="py-8">
                                <LoadingSpinner message="Chargement des centres..." variant="table" size="lg" />
                            </div>
                        ) : centres.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                                    <FaBuilding className="text-2xl text-slate-400" />
                                </div>
                                <h3 className="mt-4 text-sm font-semibold text-slate-900">Aucun centre trouvé</h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    {modeRecherche
                                        ? "Aucun résultat pour votre recherche"
                                        : "Commencez par ajouter un centre"}
                                </p>
                                {!modeRecherche && (
                                    <button
                                        onClick={() => {
                                            setCentreToEdit(null);
                                            setShowModal(true);
                                        }}
                                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                                    >
                                        <FaPlus className="text-xs" /> Ajouter un centre
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500 w-16">
                                                #
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                                                Centre
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                                                Description
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                                                Service d'assiette
                                            </th>
                                            <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
                                                Statut
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                                                Date de création
                                            </th>
                                            <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-slate-500 w-24">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {centres.map((centre, index) => (
                                            <tr key={centre.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-500">
                                                    {(pagination.current_page - 1) * pagination.per_page + index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                                                            <FaBuilding className="text-sm" />
                                                        </span>
                                                        <span className="text-sm font-semibold text-slate-900">
                                                            {centre.nom}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 max-w-xs">
                                                    <span className="text-sm text-slate-600 truncate block" title={centre.description}>
                                                        {centre.description || "-"}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                                    {getMinistereName(centre.id_ministere)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    {getStatusBadge(centre.statut)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                                                        <FaCalendarAlt className="text-xs text-slate-400" />
                                                        {formatDate(centre.created_at)}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    <ActionDropdown>
                                                        <button
                                                            onClick={() => handleEdit(centre)}
                                                            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                                                        >
                                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                                                <FaEdit className="text-xs" />
                                                            </span>
                                                            Modifier
                                                        </button>
                                                        <button
                                                            onClick={() => setDetailCentre(centre)}
                                                            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition"
                                                        >
                                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                                                                <FaEye className="text-xs" />
                                                            </span>
                                                            Détails
                                                        </button>
                                                        <div className="my-1 border-t border-slate-100" />
                                                        <button
                                                            onClick={() => setConfirmCentre(centre)}
                                                            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition"
                                                        >
                                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                                                                <FaTrash className="text-xs" />
                                                            </span>
                                                            Supprimer
                                                        </button>
                                                    </ActionDropdown>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {centres.length > 0 && (
                        <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200/60 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <p className="text-sm text-slate-500">
                                    Affichage de{" "}
                                    <span className="font-semibold text-slate-900">
                                        {(pagination.current_page - 1) * pagination.per_page + 1}
                                    </span>{" "}
                                    à{" "}
                                    <span className="font-semibold text-slate-900">
                                        {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
                                    </span>{" "}
                                    sur <span className="font-semibold text-slate-900">{pagination.total}</span> centres
                                </p>
                                <select
                                    value={pagination.per_page}
                                    onChange={handlePerPageChange}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition"
                                >
                                    <option value={10}>10 / page</option>
                                    <option value={20}>20 / page</option>
                                    <option value={50}>50 / page</option>
                                    <option value={100}>100 / page</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
                                >
                                    <FaChevronLeft className="text-xs" />
                                </button>
                                {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => {
                                    let pageNum;
                                    if (pagination.last_page <= 5) pageNum = i + 1;
                                    else if (pagination.current_page <= 3) pageNum = i + 1;
                                    else if (pagination.current_page >= pagination.last_page - 2)
                                        pageNum = pagination.last_page - 4 + i;
                                    else pageNum = pagination.current_page - 2 + i;
                                    const active = pagination.current_page === pageNum;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-sm font-semibold transition ${
                                                active
                                                    ? "bg-indigo-600 text-white shadow-sm"
                                                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
                                >
                                    <FaChevronRight className="text-xs" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ModalCentre
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setCentreToEdit(null);
                }}
                centreToEdit={centreToEdit}
                ministeres={ministeres}
                onSuccess={handleModalSuccess}
            />

            <DetailModal
                isOpen={!!detailCentre}
                onClose={() => setDetailCentre(null)}
                title={detailCentre?.nom || "Détails"}
                icon={FaBuilding}
            >
                {detailCentre && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">Nom</p><p className="text-sm font-semibold text-slate-900 mt-1">{detailCentre.nom}</p></div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">Statut</p><p className="mt-1">{getStatusBadge(detailCentre.statut)}</p></div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">Description</p><p className="text-sm text-slate-700 mt-1">{detailCentre.description || "—"}</p></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">Service d'assiette</p><p className="text-sm font-medium text-slate-900 mt-1">{getMinistereName(detailCentre.id_ministere)}</p></div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">ID</p><p className="text-sm font-mono font-semibold text-slate-900 mt-1">#{detailCentre.id}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">Créé le</p><p className="text-sm text-slate-700 mt-1">{formatDate(detailCentre.created_at)}</p></div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs font-bold tracking-widest uppercase text-slate-400">Modifié le</p><p className="text-sm text-slate-700 mt-1">{formatDate(detailCentre.updated_at)}</p></div>
                    </div>
                  </div>
                )}
            </DetailModal>

            <ConfirmModal
                isOpen={!!confirmCentre}
                onClose={() => setConfirmCentre(null)}
                onConfirm={confirmDelete}
                title="Désactiver ce centre ?"
                message={confirmCentre ? "Voulez-vous supprimer \"" + (confirmCentre.nom) + "\" ? Cette action est irréversible." : ""}
                confirmText="Oui, supprimer"
                variant="danger"
                loading={confirmLoading}
            />

            
        </div>
    );
};

export default CentreScreen;
