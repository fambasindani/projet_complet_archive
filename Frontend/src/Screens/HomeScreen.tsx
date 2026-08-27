/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import logo from '../Images/Logo.png';
import axios from "axios";
import {
    FaArchive,
    FaFileInvoiceDollar,
    FaChartBar,
    FaDatabase,
    FaLock,
    FaSearch,
    FaUpload,
    FaBoxOpen,
    FaBuilding,
    FaRegGem,
    FaUserLock,
    FaCalendarAlt,
    FaShieldAlt,
    FaFileContract,
    FaRegFileAlt,
    FaSpinner,
    FaTimes,
    FaChevronDown
} from "react-icons/fa";
import { API_BASE_URL } from "../config";
import LoadingSpinner from "../Loading/LoadingSpinner";

const HomeScreen = () => {
    const navRouter = useHistory();
    const [currentTime, setCurrentTime] = useState("");
    const [loading, setLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(true);
    const [stats, setStats] = useState({
        total_archives: 0,
        archivages_mois: 0,
        documents_traitement: 0,
        taux_disponibilite: 99.8,
        modules: {
            ad: { total: 0, monthly: 0, label: "Archivage Ordinaire" },
            np: { total: 0, monthly: 0, label: "Notes de Perception" }
        }
    });

    useEffect(() => {
        const welcomeHidden = localStorage.getItem("hide_welcome_card");
        if (welcomeHidden === "true") setShowWelcome(false);
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const dateString = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            setCurrentTime(`${dateString} - ${timeString}`);
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        fetchStats();
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/public/stats`);
            if (response.data.success) setStats(response.data.data);
            const modulesResponse = await axios.get(`${API_BASE_URL}/public/modules`);
            if (modulesResponse.data.success) {
                console.log("Modules:", modulesResponse.data.data);
            }
        } catch (error) {
            console.error("Erreur chargement statistiques:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleModuleClick = (moduleType) => {
        localStorage.removeItem("archive_module");
        localStorage.setItem("archive_module", moduleType);
        navRouter.push("/login");
    };

    const toggleWelcomeCard = () => {
        const newState = !showWelcome;
        setShowWelcome(newState);
        localStorage.setItem("hide_welcome_card", (!newState).toString());
    };

    const formatNumber = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    const ModuleCard = ({ title, description, icon, color, stats, moduleType }) => (
        <div
            onClick={() => handleModuleClick(moduleType)}
            className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 flex flex-col"
        >
            <div className="h-1.5 w-full" style={{ background: color }} />
            <div className="p-7 sm:p-8 flex flex-col flex-1">
                <div className="flex items-start gap-5 mb-5">
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm"
                        style={{ backgroundColor: `${color}14`, color: color, border: `1px solid ${color}18` }}
                    >
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[19px] font-extrabold text-slate-900 leading-tight tracking-tight">{title}</h3>
                        <p className="text-[13px] font-medium mt-1.5 leading-relaxed text-slate-500 line-clamp-3">{description}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 rounded-xl px-3.5 py-3 border border-slate-100 flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 text-sm shadow-sm"><FaDatabase /></span>
                        <div>
                            <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase leading-none">Total</p>
                            <p className="text-sm font-bold text-slate-900 leading-none mt-1">{formatNumber(stats.total)} <span className="font-medium text-slate-500">archives</span></p>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3.5 py-3 border border-slate-100 flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 text-sm shadow-sm"><FaChartBar /></span>
                        <div>
                            <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase leading-none">Ce mois</p>
                            <p className="text-sm font-bold text-slate-900 leading-none mt-1">{formatNumber(stats.monthly)}</p>
                        </div>
                    </div>
                </div>
                <button
                    style={{ backgroundColor: color }}
                    className="mt-auto w-full inline-flex items-center justify-center gap-2.5 rounded-xl text-white text-[13px] font-bold tracking-wide uppercase py-3.5 px-5 shadow-lg shadow-slate-900/5 hover:brightness-110 hover:shadow-xl active:scale-[0.98] transition-all"
                >
                    Accéder au module <FaBoxOpen className="opacity-90" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f6f8fb] text-slate-800 antialiased selection:bg-blue-100">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
                .font-display{ font-family: 'Plus Jakarta Sans','Inter',system-ui,sans-serif }
                @keyframes fadeInUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
                .anim-fade{ animation: fadeInUp .6s cubic-bezier(.16,1,.3,1) both }
                .anim-delay-1{ animation-delay:.08s } .anim-delay-2{ animation-delay:.16s } .anim-delay-3{ animation-delay:.24s }
            `}</style>

            <header className="relative overflow-hidden">
                <div className="bg-gradient-to-br from-[#0f1e3a] via-[#1e3a8a] to-[#1e40af] text-white">
                    <div className="pointer-events-none absolute -top-24 -right-24 w-[520px] h-[520px] bg-white/10 rounded-full blur-[80px]" />
                    <div className="pointer-events-none absolute -bottom-32 -left-32 w-[420px] h-[420px] bg-sky-400/20 rounded-full blur-[70px]" />
                    <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-10">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 py-7 sm:py-8">
                            <div className="flex items-center gap-5 sm:gap-6">
                                <div className="bg-white rounded-2xl p-2.5 shadow-xl shadow-black/20 shrink-0">
                                    <img src={logo} alt="DGRAD Logo" className="h-[62px] sm:h-[74px] w-auto object-contain rounded-xl" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="font-display text-[28px] sm:text-[32px] font-extrabold tracking-tight leading-none">DGRAD</h1>
                                    <p className="hidden sm:block text-[12.5px] leading-5 text-blue-100/90 max-w-[560px] mt-1.5 font-medium">Direction Générale des Recettes Administratives, Judiciaires, Domaniales et de Participations</p>
                                    <p className="sm:hidden text-[12px] text-blue-200/90 font-medium mt-1">République Démocratique du Congo</p>
                                    <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold tracking-widest uppercase bg-white/10 border border-white/15 rounded-full px-3 py-1 backdrop-blur">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Système d'Archivage Numérique Intégré
                                    </span>
                                </div>
                            </div>
                            <div className="flex lg:flex-col items-center lg:items-end gap-3 self-start lg:self-center">
                                <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur border border-white/10 rounded-full px-4 py-2 text-sm font-medium shadow-sm">
                                    <FaCalendarAlt className="text-white/80 text-[14px]" />
                                    <span className="capitalize hidden sm:inline">{currentTime}</span>
                                    <span className="sm:hidden text-xs">{currentTime.split(" - ")[1] || currentTime}</span>
                                </div>
                                <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/20 text-emerald-100 rounded-full px-3.5 py-2 text-xs sm:text-sm font-semibold backdrop-blur">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                                    Système Opérationnel
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 py-6 border-t border-white/10">
                            <div>
                                <h2 className="font-display text-2xl sm:text-[27px] font-bold leading-tight">Plateforme d'Archivage Numérique DGRAD</h2>
                                <p className="text-blue-100/80 text-sm sm:text-[15px] mt-2 max-w-2xl leading-relaxed">Une solution complète pour la gestion et la préservation de vos documents administratifs et financiers.</p>
                            </div>
                            <div className="inline-flex items-center gap-2.5 bg-white text-slate-900 rounded-full px-5 py-3 text-xs sm:text-[13px] font-bold shadow-lg shadow-black/10 shrink-0 self-start lg:self-auto">
                                <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm"><FaUserLock /></span>
                                Environnement Sécurisé Certifié
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-10 py-8 sm:py-10">
                {showWelcome ? (
                    <div className="anim-fade mb-8 sm:mb-10">
                        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 overflow-hidden">
                            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-2xl opacity-70" />
                            <button onClick={toggleWelcomeCard} aria-label="Masquer ce message" className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition">
                                <FaTimes className="text-xs" />
                            </button>
                            <div className="relative">
                                <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
                                    <FaShieldAlt className="text-[11px]" /> Bienvenue
                                </span>
                                <h2 className="font-display text-[22px] sm:text-[26px] font-extrabold text-slate-900 mt-3 tracking-tight">Bienvenue sur la Plateforme d'Archivage DGRAD</h2>
                                <p className="text-slate-600 text-[15px] leading-7 mt-3 max-w-4xl">Cette plateforme vous permet de gérer efficacement les archives administratives et financières de la Direction Générale des Recettes. Sélectionnez le module correspondant à vos besoins pour commencer.</p>
                                <p className="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-100">Vous pouvez masquer ce message définitivement en cliquant sur la croix — il restera masqué lors de vos prochaines visites.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-end mb-6">
                        <button onClick={toggleWelcomeCard} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-dashed border-slate-300 rounded-full px-4 py-2 hover:bg-slate-50 hover:border-slate-400 transition">
                            <FaChevronDown className="text-[10px]" /> Afficher le message de bienvenue
                        </button>
                    </div>
                )}

                <section className="mb-10 sm:mb-12">
                    <div className="text-center max-w-2xl mx-auto mb-8">
                        <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 mb-4 text-xl"><FaBuilding /></span>
                        <h2 className="font-display text-[22px] sm:text-[26px] font-extrabold text-slate-900 tracking-tight">Modules d'Archivage Disponibles</h2>
                        <p className="text-slate-500 text-sm sm:text-[15px] mt-2">Sélectionnez le module correspondant à votre type de documents</p>
                    </div>
                    {loading ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <LoadingSpinner
                                message="Chargement des modules..."
                                subtitle="Veuillez patienter"
                                size="lg"
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7">
                            <div className="anim-fade anim-delay-1">
                                <ModuleCard title="Archivage Ordinaire" description="Gestion des documents administratifs courants, correspondances, rapports, circulaires et documents généraux de l'administration" icon={<FaArchive />} color="#2563eb" stats={{ total: stats.modules.ad.total, monthly: stats.modules.ad.monthly }} moduleType="ad" />
                            </div>
                            <div className="anim-fade anim-delay-2">
                                <ModuleCard title="Archivage Note de Perception" description="Gestion spécialisée des notes de perception, quittances, documents financiers et pièces comptables" icon={<FaFileInvoiceDollar />} color="#0ea66a" stats={{ total: stats.modules.np.total, monthly: stats.modules.np.monthly }} moduleType="np" />
                            </div>
                        </div>
                    )}
                </section>

                <section className="mb-10 sm:mb-12">
                    <div className="text-center max-w-2xl mx-auto mb-8">
                        <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 mb-4 text-xl"><FaChartBar /></span>
                        <h2 className="font-display text-[22px] sm:text-[26px] font-extrabold text-slate-900 tracking-tight">Statistiques du Système</h2>
                        <p className="text-slate-500 text-sm sm:text-[15px] mt-2">Aperçu de l'activité d'archivage</p>
                    </div>
                    {loading ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-12 flex justify-center"><FaSpinner className="animate-spin text-slate-400 text-2xl" /></div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {[
                                { label: "Documents archivés au total", value: formatNumber(stats.total_archives), icon: <FaArchive />, accent: "border-blue-500", bg: "bg-blue-600" },
                                { label: "Archivages ce mois-ci", value: formatNumber(stats.archivages_mois), icon: <FaUpload />, accent: "border-emerald-500", bg: "bg-emerald-500" },
                                { label: "Documents en traitement", value: formatNumber(stats.documents_traitement), icon: <FaRegFileAlt />, accent: "border-amber-500", bg: "bg-amber-500" },
                                { label: "Taux de disponibilité", value: `${stats.taux_disponibilite}%`, icon: <FaFileContract />, accent: "border-violet-500", bg: "bg-violet-600" },
                            ].map((s, i) => (
                                <div key={i} className={`anim-fade bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 border-l-4 ${s.accent} flex items-center gap-4 hover:shadow-md hover:-translate-y-1 transition-all`} style={{ animationDelay: `${i * 0.08}s` }}>
                                    <div className={`w-12 h-12 rounded-xl ${s.bg} text-white flex items-center justify-center text-lg shadow-md shrink-0`}>{s.icon}</div>
                                    <div className="min-w-0">
                                        <p className="text-[22px] sm:text-[26px] font-extrabold text-slate-900 leading-none tracking-tight truncate">{s.value}</p>
                                        <p className="text-xs font-medium text-slate-500 mt-1.5 leading-tight">{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="mb-10 sm:mb-12">
                    <div className="text-center max-w-2xl mx-auto mb-8">
                        <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20 mb-4 text-xl"><FaRegGem /></span>
                        <h2 className="font-display text-[22px] sm:text-[26px] font-extrabold text-slate-900 tracking-tight">Fonctionnalités de la Plateforme</h2>
                        <p className="text-slate-500 text-sm sm:text-[15px] mt-2">Découvrez les capacités de notre système d'archivage</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[
                            { t: "Dépôt Numérique Sécurisé", d: "Transfert sécurisé de documents avec validation automatique et chiffrement", icon: <FaUpload /> },
                            { t: "Recherche Intelligente", d: "Recherche multicritère avec indexation avancée et suggestions", icon: <FaSearch /> },
                            { t: "Sécurité Renforcée", d: "Authentification à deux facteurs et contrôle d'accès granulaire", icon: <FaLock /> },
                            { t: "Analytics et Rapports", d: "Tableaux de bord personnalisables et génération de rapports", icon: <FaChartBar /> },
                        ].map((f, i) => (
                            <div key={i} className="anim-fade bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group" style={{ animationDelay: `${i * 0.07}s` }}>
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl mx-auto shadow-lg shadow-blue-600/20 group-hover:rotate-3 group-hover:scale-105 transition">{f.icon}</div>
                                <h4 className="font-bold text-slate-900 mt-5 text-[15px] leading-tight">{f.t}</h4>
                                <p className="text-sm text-slate-500 leading-relaxed mt-2">{f.d}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mb-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 lg:p-10">
                        <h3 className="font-display text-center text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Guide de Démarrage Rapide</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mt-8 max-w-5xl mx-auto">
                            {[
                                { n: "1", title: "Sélectionnez votre module", desc: "Choisissez entre \"Archivage Ordinaire\" pour les documents administratifs généraux ou \"Archivage Note de Perception\" pour les documents financiers" },
                                { n: "2", title: "Authentification", desc: "Connectez-vous avec vos identifiants DGRAD sur la page suivante" },
                                { n: "3", title: "Accédez aux fonctionnalités", desc: "Utilisez les outils de dépôt, recherche, consultation et gestion des archives" },
                                { n: "4", title: "Assistance technique", desc: "En cas de difficulté, contactez le support technique aux coordonnées indiquées ci-dessous" },
                            ].map((step) => (
                                <div key={step.n} className="flex gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all">
                                    <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-md shadow-blue-600/20">{step.n}</span>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 text-[14.5px] leading-tight">{step.title}</p>
                                        <p className="text-sm text-slate-500 leading-relaxed mt-1.5">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-[#0b1220] text-slate-300 border-t border-white/5 mt-8">
                <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-10 py-9">
                    <div className="flex flex-col lg:flex-row justify-between gap-10">
                        <div className="flex gap-4 items-center">
                            <div className="bg-white rounded-xl p-1.5 shadow-lg shrink-0">
                                <img src={logo} alt="DGRAD Logo" className="h-12 w-auto object-contain rounded-lg" />
                            </div>
                            <div>
                                <h4 className="font-display font-extrabold text-white leading-none">DGRAD</h4>
                                <p className="text-sm text-slate-300 font-medium">Direction Générale des Recettes</p>
                                <p className="text-xs text-slate-500">Administratives, Judiciaires, Domaniales et de Participations</p>
                            </div>
                        </div>
                        <div className="text-center lg:text-center">
                            <p className="text-sm text-slate-200 font-medium">© {new Date().getFullYear()} DGRAD — République Démocratique du Congo</p>
                            <p className="inline-flex items-center gap-2 text-xs text-slate-400 mt-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                                <FaShieldAlt className="text-slate-300" /> Version 3.0.1 • Plateforme d'Archivage Numérique
                            </p>
                            <p className="text-xs text-slate-500 italic mt-2">Conforme aux normes d'archivage électronique ISO 14641</p>
                        </div>
                        <div className="text-sm leading-6 lg:text-right bg-white/[0.03] border border-white/5 rounded-2xl p-5 lg:min-w-[300px]">
                            <p><span className="font-semibold text-white">Support technique:</span> <span className="text-slate-300">support.archivage@dgrad.gov.cm</span></p>
                            <p><span className="font-semibold text-white">Assistance téléphonique:</span> <span className="text-slate-300">+237 XXX XX XX XX</span></p>
                            <p><span className="font-semibold text-white">Horaires:</span> <span className="text-slate-400">Lun — Ven, 8h — 17h</span></p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomeScreen;
