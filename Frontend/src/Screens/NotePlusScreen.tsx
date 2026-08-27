/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React from "react";
import { useLocation, useHistory } from "react-router-dom";
import Menus from "../Composant/Menus";
import Head from "../Composant/Head";

const NotePlusScreen = () => {
  const location = useLocation();
  const navRouter = useHistory();
  const { note } = (location.state as any) || {};

  if (!note) {
    return (
      <div className="min-h-screen bg-[#f6f8fb]">
        <Menus />
        <Head />
        <div className="pt-[72px] lg:pl-[260px] transition-all">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
              <p className="text-slate-600 font-medium">Aucune note sélectionnée.</p>
              <button onClick={() => navRouter.goBack()} className="mt-4 inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold rounded-xl px-5 py-2.5 hover:bg-black transition">Retour</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const InfoRow = ({ label, value, icon }: any) => (
    <div className="group flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition">
      <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition">
        <i className={`fas ${icon} text-[13px]`}></i>
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold tracking-widest uppercase text-slate-400 leading-none">{label}</div>
        <div className="text-[14px] font-semibold text-slate-900 mt-1 leading-snug break-words">{value || "—"}</div>
      </div>
    </div>
  );

  const Section = ({ title, icon, children }: any) => (
    <div className="mb-7 last:mb-0">
      <h5 className="flex items-center gap-2.5 text-[13px] font-extrabold tracking-wide uppercase text-slate-900 border-b border-slate-100 pb-3 mb-4">
        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs">
          <i className={`fas ${icon}`}></i>
        </span>
        {title}
      </h5>
      <div className="space-y-1">{children}</div>
    </div>
  );

  const formatDate = (d: any) => {
    try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }); } catch { return d || "—"; }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] antialiased">
      <Menus />
      <Head />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@700;800&display=swap');
        .font-display{ font-family:'Plus Jakarta Sans','Inter',system-ui,sans-serif }
      `}</style>

      {/* content wrapper - compatible avec AdminLTE */}
      <div className="pt-[60px] lg:pl-[250px] transition-all">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Breadcrumb / Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm shadow-md shadow-blue-600/20"><i className="fas fa-file-invoice"></i></span>
                Détails de la Note
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">Fiche complète • Série <span className="font-semibold text-slate-700">{note.numero_serie}</span> • Mise à jour le {formatDate(note.date_enregistrement)}</p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-5 py-2.5 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition shrink-0"
            >
              <i className="fas fa-arrow-left text-xs"></i> Retour
            </button>
          </div>

          {/* Top summary card */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 rounded-2xl shadow-lg shadow-slate-900/10 overflow-hidden mb-6 relative">
            <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 w-72 h-72 bg-sky-400/10 rounded-full blur-3xl" />
            <div className="relative p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white text-slate-900 flex items-center justify-center text-2xl shadow-xl shrink-0">
                <i className="fas fa-file-invoice-dollar"></i>
              </div>
              <div className="flex-1 min-w-0 text-white">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur border border-white/10 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase"><i className="fas fa-hashtag text-[11px] opacity-80"></i> {note.numero_serie}</span>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-400 text-slate-900 rounded-full px-3 py-1 text-xs font-extrabold"><span className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-pulse" /> Archivée</span>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-extrabold mt-3 leading-tight truncate">{note.assujetti?.nom_raison_sociale || "Assujetti"}</h3>
                <p className="text-blue-100/80 text-sm mt-1">NIF: <span className="font-semibold text-white">{note.assujetti?.numero_nif || "—"}</span> • Article <span className="font-semibold text-white">{note.numero_article || "N/A"}</span></p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-2 text-white/90 text-xs">
                <span className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-3 py-2 backdrop-blur font-medium"><i className="fas fa-calendar-check"></i> Ordonnancement: {formatDate(note.date_ordonnancement)}</span>
                <span className="inline-flex items-center gap-2 bg-white text-slate-900 rounded-xl px-3 py-2 font-bold shadow"><i className="fas fa-calendar-plus text-slate-600"></i> Enregistrement: {formatDate(note.date_enregistrement)}</span>
              </div>
            </div>
          </div>

          {/* Grid 2 colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Colonne gauche */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7">
              <Section title="Assujetti" icon="fa-user">
                <InfoRow label="Nom / Raison sociale" value={note.assujetti?.nom_raison_sociale} icon="fa-id-card" />
                <InfoRow label="NIF" value={note.assujetti?.numero_nif} icon="fa-barcode" />
                <InfoRow label="BP" value={note.assujetti?.bp} icon="fa-envelope" />
                <InfoRow label="Téléphone" value={note.assujetti?.telephone} icon="fa-phone" />
                <InfoRow label="Email" value={note.assujetti?.email} icon="fa-at" />
              </Section>

              <Section title="Classeur" icon="fa-folder-open">
                <InfoRow label="Nom du classeur" value={note.classeur?.nom_classeur} icon="fa-archive" />
                {note.classeur?.description && <InfoRow label="Description" value={note.classeur?.description} icon="fa-align-left" />}
              </Section>

              <Section title="Centre d'ordonnancement" icon="fa-building">
                <InfoRow label="Nom" value={note.centre?.nom} icon="fa-map" />
                <InfoRow label="Description" value={note.centre?.description} icon="fa-align-left" />
              </Section>

              <Section title="Emplacement" icon="fa-map-marker-alt">
                <InfoRow label="Nom emplacement" value={note.emplacement?.nom_emplacement} icon="fa-location-dot" />
                {note.emplacement?.description && <InfoRow label="Détails" value={note.emplacement?.description} icon="fa-info-circle" />}
              </Section>
            </div>

            {/* Colonne droite */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7 flex flex-col">
              <Section title="Détails additionnels" icon="fa-list-alt">
                <InfoRow label="Numéro de série" value={note.numero_serie} icon="fa-hashtag" />
                <InfoRow label="Date d'ordonnancement" value={formatDate(note.date_ordonnancement)} icon="fa-calendar-check" />
                <InfoRow label="Date d'enregistrement" value={formatDate(note.date_enregistrement)} icon="fa-calendar-plus" />
                <InfoRow label="Numéro d'article" value={note.numero_article || "N/A"} icon="fa-list-ol" />
                <InfoRow label="Utilisateur" value={note.utilisateur ? note.utilisateur.nom : "Non spécifié"} icon="fa-user-circle" />
                {note.montant && <InfoRow label="Montant" value={note.montant} icon="fa-coins" />}
                {note.observation && <InfoRow label="Observation" value={note.observation} icon="fa-comment-dots" />}
              </Section>

              {/* Meta */}
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Statut</p>
                  <p className="inline-flex items-center gap-1.5 mt-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1"><span className="w-2 h-2 bg-emerald-500 rounded-full" /> Archivée & sécurisée</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Référence</p>
                  <p className="text-sm font-mono font-bold text-slate-900 mt-2 truncate">{note.numero_serie} / {note.numero_article || "—"}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-bold rounded-xl px-6 py-3 shadow-md shadow-slate-900/10 hover:bg-black transition"
                >
                  <i className="fas fa-print text-xs"></i> Imprimer
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-6 py-3 shadow-sm hover:bg-slate-50 transition"
                >
                  <i className="fas fa-arrow-left text-xs"></i> Retour à la liste
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-8">DGRAD • Système d'Archivage Numérique — Conforme ISO 14641 • Document généré le {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </div>
  );
};

export default NotePlusScreen;
