"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

/**
 * Real, app-controlled French/English toggle for the console — same pattern
 * as gepromed-web's lib/i18n.tsx. Deliberately NOT relying on the browser's
 * Google Translate: Translate injects <font> tags into the DOM that React
 * doesn't track, which caused real removeChild/insertBefore crashes on
 * dynamic pages (see the expense review table). This dictionary swap never
 * touches the DOM outside React, so it can't cause that class of bug.
 */

export type Lang = "fr" | "en";

const KEY = "gepromed-console.lang";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; toggle: () => void };
const LanguageContext = createContext<Ctx>({
  lang: "fr",
  setLang: () => {},
  toggle: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY) as Lang | null;
    if (saved === "fr" || saved === "en") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(KEY, l);
    document.documentElement.lang = l;
  }, []);

  const toggle = useCallback(
    () => setLang(lang === "fr" ? "en" : "fr"),
    [lang, setLang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

// UI string dictionary. `t(key)` returns the string in the active language.
// Start with the sidebar nav (highest-visibility, every page) + shared chrome;
// extend page-by-page as each is converted from hardcoded English.
const DICT = {
  "nav.dashboard": { fr: "Tableau de bord", en: "Dashboard" },
  "nav.trainees": { fr: "Gestion des Trainees", en: "Trainees management" },
  "nav.courses": { fr: "Gestion des formations", en: "Course management" },
  "nav.engineering": { fr: "Ingénierie", en: "Engineering" },
  "nav.contracts": { fr: "Modèles de contrats", en: "Contract templates" },
  "nav.skills": { fr: "Catalogue de compétences", en: "Skills catalog" },
  "nav.automations": { fr: "Automatisations", en: "Automations" },
  "nav.expenses": { fr: "Notes de frais", en: "Expense reports" },
  "nav.integrations": { fr: "Intégrations", en: "Integrations" },
  "nav.roadmap": { fr: "Feuille de route", en: "Roadmap" },
  "nav.inputs": { fr: "Accès & paramètres", en: "Inputs & access" },
  "nav.training": { fr: "Espace formation", en: "Training hub" },
  "nav.feedback": { fr: "Retours", en: "Feedback" },

  "chrome.menu": { fr: "Menu", en: "Menu" },
  "chrome.signOut": { fr: "Se déconnecter", en: "Sign out" },
  "chrome.by": { fr: "par AI Makers", en: "by AI Makers" },
  "chrome.demoMode": {
    fr: "Mode démo · IA, automatisations et intégrations simulées hors ligne, aucune API externe appelée.",
    en: "Demo mode · All AI, automations & integrations are simulated offline, no external APIs are called.",
  },

  "dashboard.eyebrow": { fr: "Vue d'ensemble", en: "Overview" },
  "dashboard.welcome": { fr: "Bon retour, {name}", en: "Welcome back, {name}" },
  "dashboard.description": {
    fr: "Votre console IA pour le réglementaire, le clinique, la qualité et la formation chez Gepromed.",
    en: "Your AI Console for regulatory, clinical, quality and enablement work at Gepromed.",
  },
  "dashboard.browseSkills": { fr: "Parcourir les compétences", en: "Browse skills" },
  "dashboard.startHere": { fr: "Pour commencer", en: "Start here" },
  "dashboard.popularSkills": { fr: "Compétences populaires", en: "Popular skills" },
  "dashboard.runsPerMonth": { fr: "exéc. / mois", en: "runs / mo" },
  "dashboard.recentActivity": { fr: "Activité récente", en: "Recent activity" },
  "dashboard.yourSession": { fr: "Votre session", en: "Your session" },
  "dashboard.ran": { fr: "Exécuté", en: "Ran" },
  "dashboard.minutesSaved": { fr: "min économisées", en: "min saved" },

  "expenses.eyebrow": { fr: "Finance · Notes de frais", en: "Finance · Expense reports" },
  "expenses.title": { fr: "Notes de frais", en: "Expense reports" },
  "expenses.description": {
    fr: "Déposez les justificatifs : lecture IA, conversion des devises au taux officiel de la date d'émission, catégorisation, puis ajout dans le fichier Matrice de Nathalie (une feuille par voyage). Vous vérifiez et validez à la fin.",
    en: "Drop your receipts: AI reads them, converts currencies at the official rate for the issue date, categorizes them, then appends to Nathalie's Matrice file (one sheet per trip). You review and validate at the end.",
  },

  // Trainee summary subsection (read-only table + detail + stats) — tab switcher
  "traineeViews.pipelineTab": { fr: "Suivi & actions", en: "Follow-up & actions" },
  "traineeViews.summaryTab": { fr: "Résumé trainees", en: "Trainee summary" },
  "traineeViews.coursesTab": { fr: "Formations", en: "Courses" },

  // Course rollup tab (Phase 2) — one row per course/session
  "courseRollup.colCourse": { fr: "Formation", en: "Course" },
  "courseRollup.colDates": { fr: "Dates", en: "Dates" },
  "courseRollup.colFillRate": { fr: "Taux de remplissage", en: "Fill rate" },
  "courseRollup.colFinancials": { fr: "Suivi financier", en: "Financial tracking" },
  "courseRollup.colOutstanding": { fr: "En attente", en: "Outstanding" },
  "courseRollup.empty": { fr: "Aucune formation à afficher.", en: "No courses to display." },
  "courseRollup.invoicesPaid": { fr: "Factures payées", en: "Invoices paid" },
  "courseRollup.depositsCollected": { fr: "Cautions perçues", en: "Deposits collected" },
  "courseRollup.ofExpected": { fr: "sur {expected} attendu", en: "of {expected} expected" },
  "courseRollup.outstandingInvoices": { fr: "{count} facture{plural} en attente", en: "{count} invoice{plural} outstanding" },
  "courseRollup.outstandingDeposits": { fr: "{count} caution{plural} en attente", en: "{count} deposit{plural} outstanding" },
  "courseRollup.seats": { fr: "{enrolled} / {capacity} places", en: "{enrolled} / {capacity} seats" },
  "courseRollup.tuitionNote": {
    fr: "Le paiement de la formation Bootcamp (hors caution) est géré manuellement en dehors de cette plateforme — seule la caution de 200 € est suivie ici.",
    en: "Bootcamp tuition payment (beyond the deposit) is handled manually outside this platform — only the €200 deposit is tracked here.",
  },

  // Trainee summary — filter bar
  "traineeSummary.searchPlaceholder": {
    fr: "Rechercher par nom, email, sponsor…",
    en: "Search by name, email, sponsor…",
  },
  "traineeSummary.allParcours": { fr: "Tous les parcours", en: "All parcours" },
  "traineeSummary.allCourses": { fr: "Toutes les formations", en: "All courses" },
  "traineeSummary.allStatuses": { fr: "Tous les statuts", en: "All statuses" },
  "traineeSummary.allFunding": { fr: "Tout financement", en: "All funding" },
  "traineeSummary.registeredFrom": { fr: "Inscrit à partir du", en: "Registered from" },
  "traineeSummary.registeredTo": { fr: "Inscrit jusqu'au", en: "Registered until" },
  "traineeSummary.fundingSelf": { fr: "Autofinancé", en: "Self-funded" },
  "traineeSummary.fundingSponsored": { fr: "Sponsorisé", en: "Sponsored" },

  // Trainee summary — table
  "traineeSummary.colTrainee": { fr: "Trainee", en: "Trainee" },
  "traineeSummary.colCourse": { fr: "Formation", en: "Course" },
  "traineeSummary.colStatus": { fr: "Statut", en: "Status" },
  "traineeSummary.colRegistered": { fr: "Inscrit le", en: "Registered on" },
  "traineeSummary.colStart": { fr: "Début", en: "Start" },
  "traineeSummary.colSponsor": { fr: "Sponsor", en: "Sponsor" },
  "traineeSummary.empty": {
    fr: "Aucun trainee ne correspond aux filtres.",
    en: "No trainee matches the current filters.",
  },

  // Trainee summary — detail drawer
  "traineeSummary.drawerTitle": { fr: "Détail Trainee", en: "Trainee detail" },
  "traineeSummary.currentStatus": { fr: "Statut actuel", en: "Current status" },
  "traineeSummary.courseRegistered": { fr: "Formation inscrite", en: "Course registered" },
  "traineeSummary.description": { fr: "Description", en: "Description" },
  "traineeSummary.registrationDate": { fr: "Date d'inscription", en: "Registration date" },
  "traineeSummary.courseStart": { fr: "Début de formation", en: "Course start" },
  "traineeSummary.courseEnd": { fr: "Fin de formation", en: "Course end" },
  "traineeSummary.confirmedOn": { fr: "Confirmé le", en: "Confirmed on" },
  "traineeSummary.paymentSection": { fr: "Prise en charge / paiement", en: "Funding / payment" },
  "traineeSummary.funding": { fr: "Financement", en: "Funding" },
  "traineeSummary.sponsor": { fr: "Sponsor", en: "Sponsor" },
  "traineeSummary.amountDeposit": { fr: "Montant / acompte", en: "Amount / deposit" },
  "traineeSummary.invoicePaidOn": { fr: "Facture payée le", en: "Invoice paid on" },
  "traineeSummary.depositContractOn": { fr: "Caution/contrat reçus le", en: "Deposit/contract received on" },
  "traineeSummary.depositWaived": { fr: "Levée", en: "Waived" },
  "traineeSummary.depositRefundedOn": { fr: "Caution remboursée le", en: "Deposit refunded on" },
  "traineeSummary.depositLabel": { fr: "Caution", en: "Deposit" },
  "traineeSummary.close": { fr: "Fermer", en: "Close" },
  "traineeSummary.sponsorSection": { fr: "Sponsor", en: "Sponsor" },
  "traineeSummary.sponsorEmail": { fr: "Email du sponsor", en: "Sponsor email" },
  "traineeSummary.contractSection": { fr: "Contrat", en: "Contract" },
  "traineeSummary.contractNone": { fr: "Aucun contrat associé", en: "No contract attached" },
  "traineeSummary.contractView": { fr: "Voir le contrat", en: "View contract" },
  "traineeSummary.documentSection": { fr: "Document signé", en: "Signed document" },
  "traineeSummary.documentNone": { fr: "Aucun document déposé", en: "No document on file" },
  "traineeSummary.documentVerified": { fr: "Vérifié", en: "Verified" },
  "traineeSummary.documentPending": { fr: "En attente de vérification", en: "Pending verification" },
  "traineeSummary.documentView": { fr: "Voir le document", en: "View document" },

  // Trainee summary — stats chart
  "traineeStats.title": { fr: "Statistiques trainees", en: "Trainee statistics" },
  "traineeStats.byStatus": { fr: "Répartition par statut", en: "Breakdown by status" },
  "traineeStats.byFunding": { fr: "Répartition par financement", en: "Breakdown by funding" },
  "traineeStats.topCourses": { fr: "Formations les plus suivies", en: "Top courses" },
  "traineeStats.byMonth": { fr: "Inscriptions par mois", en: "Registrations by month" },

  // Trainees page (server component chrome)
  "traineesPage.eyebrow": { fr: "Pipeline de formation", en: "Training pipeline" },
  "traineesPage.title": { fr: "Gestion des Trainees", en: "Trainees management" },
  "traineesPage.description": {
    fr: "Deux parcours Trainee, chacun avec ses propres étapes. HelpMeSee (fondation, 7 étapes) : trainee → dates → facture → e-learning (verrou) → accès simulateur → confirmé → terminé. Bootcamps & Workshops (Gepromed, 9 étapes) : trainee → prérequis → pré-inscription → caution/contrat → infos pratiques → e-learning → confirmé → caution remboursée → terminé. Automatise le suivi manuel basé sur Excel.",
    en: "Two Trainee tracks, each with its own steps. HelpMeSee (foundation, 7 steps): trainee → dates → invoice → e-learning (gate) → simulator access → confirmed → done. Bootcamps & Workshops (Gepromed, 9 steps): trainee → prerequisites → pre-registration → deposit/contract → practical info → e-learning → confirmed → deposit refunded → done. Automates the manual Excel-based follow-up.",
  },
  "traineesPage.notConfigured": {
    fr: "Supabase n'est pas configuré : renseignez les clés dans .env.local pour charger les Trainees en direct.",
    en: "Supabase is not configured: set the keys in .env.local to load Trainees live.",
  },
  "traineesPage.kpiTotal": { fr: "Trainees", en: "Trainees" },
  "traineesPage.kpiActive": { fr: "En cours", en: "In progress" },
  "traineesPage.kpiConfirmed": { fr: "Confirmés", en: "Confirmed" },
  "traineesPage.kpiCompleted": { fr: "Terminés", en: "Completed" },
  "traineesPage.kpiSponsored": { fr: "Sponsorisés", en: "Sponsored" },
  "traineesPage.kpiNotInterested": { fr: "Non intéressés", en: "Not interested" },
  "traineesPage.kpiOfTotal": { fr: "{pct}% du total", en: "{pct}% of total" },

  // LeadBoard (pipeline) — toolbar
  "pipeline.parcoursLabel": { fr: "Parcours", en: "Parcours" },
  "pipeline.all": { fr: "Tous", en: "All" },
  "pipeline.searchPlaceholder": {
    fr: "Rechercher nom, email, institution, profession…",
    en: "Search name, email, institution, profession…",
  },
  "pipeline.filters": { fr: "Filtres", en: "Filters" },
  "pipeline.clearAll": { fr: "Tout effacer", en: "Clear all" },
  "pipeline.filterSession": { fr: "Session", en: "Session" },
  "pipeline.filterAllSessions": { fr: "Toutes les sessions", en: "All sessions" },
  "pipeline.filterInterest": { fr: "Intérêt", en: "Interest" },
  "pipeline.filterAll": { fr: "Tous", en: "All" },
  "pipeline.filterReminders": { fr: "Rappels", en: "Reminders" },
  "pipeline.filterOn": { fr: "Activés", en: "On" },
  "pipeline.filterOff": { fr: "Désactivés", en: "Off" },
  "pipeline.filterSignedDoc": { fr: "Document signé", en: "Signed document" },
  "pipeline.filterPending": { fr: "En attente de vérification", en: "Pending verification" },
  "pipeline.filterVerified": { fr: "Vérifié", en: "Verified" },
  "pipeline.filterNoDoc": { fr: "Aucun document", en: "No document" },
  "pipeline.filterAccommodation": { fr: "Hébergement", en: "Accommodation" },
  "pipeline.filterNeeded": { fr: "Requis", en: "Needed" },
  "pipeline.filterNotNeeded": { fr: "Non requis", en: "Not needed" },
  "pipeline.interest.highlyInterested": { fr: "Très intéressé", en: "Highly interested" },
  "pipeline.interest.interested": { fr: "Intéressé", en: "Interested" },
  "pipeline.interest.neutral": { fr: "Neutre", en: "Neutral" },
  "pipeline.interest.notInterested": { fr: "Non intéressé", en: "Not interested" },
  "pipeline.interest.unreachable": { fr: "Injoignable", en: "Unreachable" },
  "pipeline.filterElearning": { fr: "E-learning", en: "E-learning" },
  "pipeline.filterEnabled": { fr: "Activé", en: "Enabled" },
  "pipeline.filterDisabled": { fr: "Désactivé", en: "Disabled" },
  "pipeline.tabAll": { fr: "Tous", en: "All" },
  "pipeline.tabNotInterested": { fr: "Non intéressé", en: "Not interested" },
  "pipeline.listCount": { fr: "{visible} sur {total} Trainee{plural}", en: "{visible} of {total} trainee{plural}" },
  "pipeline.emptyGlobal": {
    fr: "Aucun Trainee pour l'instant. Soumettez le formulaire d'inscription sur le site pour voir le pipeline se remplir.",
    en: "No trainees yet. Submit the registration form on the website to see the pipeline fill up.",
  },
  "pipeline.emptyFiltered": {
    fr: "Aucun Trainee ne correspond à vos filtres.",
    en: "No trainee matches your filters.",
  },
  "pipeline.drawerAriaLabel": { fr: "Détail Trainee", en: "Trainee detail" },

  // LeadBoard drawer — sections
  "pipeline.drawer.close": { fr: "Fermer", en: "Close" },
  "pipeline.drawer.workflow": { fr: "Étapes", en: "Workflow" },
  "pipeline.drawer.lmsProvisioned": { fr: "Compte LMS créé", en: "LMS provisioned" },
  "pipeline.drawer.currentStep": { fr: "Étape actuelle", en: "Current step" },
  "pipeline.drawer.waitingFor": { fr: "En attente de :", en: "Waiting for:" },
  "pipeline.drawer.elearningVerified": { fr: "E-learning vérifié ✓", en: "E-learning verified ✓" },
  "pipeline.drawer.markElearningVerified": { fr: "Marquer l'e-learning vérifié", en: "Mark e-learning verified" },
  "pipeline.drawer.depositWaivedException": { fr: "Caution levée (exception)", en: "Deposit waived (exception)" },
  "pipeline.drawer.depositRequired": { fr: "Caution requise", en: "Deposit required" },
  "pipeline.drawer.depositWaiverTitle": {
    fr: "Exception inscrit tardif : caution 200 € / contrat levés",
    en: "Late registrant exception: €200 deposit / contract waived",
  },
  "pipeline.drawer.attendedConfirmed": { fr: "Présent · formation suivie", en: "Attended · training completed" },
  "pipeline.drawer.attendanceNotConfirmed": { fr: "Présence non confirmée", en: "Attendance not confirmed" },
  "pipeline.drawer.attendanceTitle": {
    fr: "Formation suivie en intégralité (conditionne le remboursement)",
    en: "Training attended in full (conditions the refund)",
  },
  "pipeline.drawer.contractAutoTitle": {
    fr: "Contrat à envoyer (sélection automatique)",
    en: "Contract to send (auto-matched)",
  },
  "pipeline.drawer.contractDefault": { fr: "Par défaut", en: "Default" },
  "pipeline.drawer.contractMatching": { fr: "Cours correspondant", en: "Matching course" },
  "pipeline.drawer.previewContract": { fr: "Prévisualiser le contrat", en: "Preview contract" },
  "pipeline.drawer.noFilePreview": { fr: "Aucun fichier à prévisualiser.", en: "No file to preview." },
  "pipeline.drawer.contractApproveLabel": {
    fr: "J'ai vérifié le contrat et j'approuve son envoi.",
    en: "I've checked the contract and approve sending it.",
  },
  "pipeline.drawer.noContractAvailable": {
    fr: "Aucun contrat disponible pour ce cours. Ajoutez-en un dans « Contrats ».",
    en: "No contract available for this course. Add one under \"Contracts\".",
  },
  "pipeline.drawer.confirmMilestone": { fr: "Confirmer : {milestone}", en: "Confirm: {milestone}" },
  "pipeline.drawer.eligibilityOkNoContract": { fr: "Aucun contrat disponible pour ce cours", en: "No contract available for this course" },
  "pipeline.drawer.eligibilityOkNeedApproval": {
    fr: "Vérifiez et approuvez le contrat ci-dessus",
    en: "Check and approve the contract above",
  },
  "pipeline.drawer.eligibilityOk": { fr: "Prérequis conformes", en: "Prerequisites met" },
  "pipeline.drawer.eligibilityNotOk": { fr: "Prérequis non conformes", en: "Prerequisites not met" },
  "pipeline.drawer.confirmFirstAbove": { fr: "Confirmez d'abord l'étape ci-dessus", en: "Confirm the step above first" },
  "pipeline.drawer.trackDone": { fr: "Parcours terminé", en: "Track completed" },
  "pipeline.drawer.interestReminders": { fr: "Rappels activés", en: "Reminders on" },
  "pipeline.drawer.remindersOff": { fr: "Rappels désactivés", en: "Reminders off" },
  "pipeline.drawer.notInterested": { fr: "Non intéressé", en: "Not interested" },
  "pipeline.drawer.exitTitle": { fr: "Sortie du parcours", en: "Exit the track" },
  "pipeline.drawer.cancel": { fr: "Annuler l'inscription", en: "Cancel registration" },
  "pipeline.drawer.cancelTitle": {
    fr: "Annulation d'un trainee inscrit (la caution n'est pas remboursée — géré hors plateforme)",
    en: "Cancel a registered trainee (deposit is not refunded — handled off-platform)",
  },
  "pipeline.drawer.cancelPrompt": {
    fr: "Annuler l'inscription de ce trainee ? Indiquez éventuellement un motif (laisser vide pour confirmer sans motif, Annuler pour ne rien faire).",
    en: "Cancel this trainee's registration? Optionally enter a reason (leave blank to confirm with no reason, Cancel to abort).",
  },
  "pipeline.drawer.cancelledBadge": { fr: "Annulé", en: "Cancelled" },
  "pipeline.drawer.reinstate": { fr: "Réintégrer", en: "Reinstate" },
  "pipeline.drawer.reinstateConfirm": {
    fr: "Réintégrer ce trainee dans le parcours ?",
    en: "Reinstate this trainee back into the pipeline?",
  },
  "pipeline.drawer.sessionLogistics": { fr: "Session & logistique", en: "Session & logistics" },
  "pipeline.drawer.session": { fr: "Session", en: "Session" },
  "pipeline.drawer.dates": { fr: "Dates", en: "Dates" },
  "pipeline.drawer.price": { fr: "Tarif", en: "Price" },
  "pipeline.drawer.priceFoundation": { fr: "pris en charge par la fondation", en: "covered by the foundation" },
  "pipeline.drawer.priceDeposit": { fr: "caution", en: "deposit" },
  "pipeline.drawer.diet": { fr: "Régime", en: "Diet" },
  "pipeline.drawer.funding": { fr: "Financement", en: "Funding" },
  "pipeline.drawer.sponsoredFallback": { fr: "Sponsorisé", en: "Sponsored" },
  "pipeline.drawer.sponsoredNote": {
    fr: "Sponsorisé — logo affiché sur les communications (Règle 1)",
    en: "Sponsored — logo shown on communications (Rule 1)",
  },
  "pipeline.drawer.selfFunded": { fr: "Autofinancé", en: "Self-funded" },
  "pipeline.drawer.selfFundedNote": { fr: "Tarif trainee affiché sur les communications", en: "Trainee rate shown on communications" },
  "pipeline.drawer.foundation": { fr: "Fondation", en: "Foundation" },
  "pipeline.drawer.foundationFunding": { fr: "Fondation HelpMeSee · facture", en: "HelpMeSee Foundation · invoice" },
  "pipeline.drawer.reference": { fr: "Référence", en: "Reference" },
  "pipeline.drawer.coordinator": { fr: "Coordinateur", en: "Coordinator" },
  "pipeline.drawer.engagementContract": { fr: "Contrat d'engagement", en: "Engagement contract" },
  "pipeline.drawer.noContractYet": { fr: "Aucun contrat associé pour le moment", en: "No contract attached yet" },
  "pipeline.drawer.contractFromTemplates": { fr: "Sélectionné parmi les modèles de la plateforme.", en: "Selected from the platform templates." },
  "pipeline.drawer.contractAutoAttach": {
    fr: "S'attache automatiquement une fois la caution marquée payée.",
    en: "Attaches automatically when the deposit is marked paid.",
  },
  "pipeline.drawer.view": { fr: "Voir", en: "View" },
  "pipeline.drawer.template": { fr: "Modèle :", en: "Template:" },
  "pipeline.drawer.noneOption": { fr: "– aucun –", en: "– none –" },
  "pipeline.drawer.defaultSuffix": { fr: " (par défaut)", en: " (default)" },
  "pipeline.drawer.noTemplatesYet": {
    fr: "Aucun modèle pour le moment. Ajoutez-en dans Modèles de contrats (admin).",
    en: "No templates yet. Add them in Contract templates (admin).",
  },
  "pipeline.drawer.signedDocument": { fr: "Document signé", en: "Signed document" },
  "pipeline.drawer.communications": { fr: "Communications", en: "Communications" },
  "pipeline.drawer.noEmailsYet": {
    fr: "Aucun email pour l'instant. Un email est généré et enregistré automatiquement à chaque changement d'étape.",
    en: "No emails yet. An email is generated and logged automatically on every stage change.",
  },
  "pipeline.drawer.comments": { fr: "Commentaires", en: "Comments" },
  "pipeline.drawer.fromRegistrant": { fr: "De l'inscrit", en: "From the registrant" },
  "pipeline.drawer.noNotesYet": { fr: "Aucune note de suivi pour le moment.", en: "No follow-up notes yet." },
  "pipeline.drawer.staffFallback": { fr: "Équipe", en: "Staff" },
  "pipeline.drawer.notePlaceholder": { fr: "Écrire une note de suivi…", en: "Write a follow-up note…" },
  "pipeline.drawer.send": { fr: "Envoyer", en: "Send" },
  "pipeline.drawer.deleteTraineeConfirm": {
    fr: "Supprimer le Trainee {name} ?",
    en: "Delete trainee {name}?",
  },
  "pipeline.drawer.deleteTrainee": { fr: "Supprimer le Trainee", en: "Delete trainee" },
  "pipeline.drawer.adminOnly": { fr: "Réservé aux admins", en: "Admin only" },
  "pipeline.drawer.depositRefundedShort": { fr: "Caution remboursée", en: "Deposit refunded" },
  "pipeline.drawer.markDoneShort": { fr: "Marquer terminé", en: "Mark done" },
  "pipeline.drawer.closeDepositKept": { fr: "Terminer, caution conservée", en: "Close out, deposit kept" },

  // LeadBoard drawer — DocState
  "pipeline.doc.title": { fr: "Document d'engagement", en: "Engagement document" },
  "pipeline.doc.verifiedText": { fr: "Signé & vérifié. Place confirmée.", en: "Signed & verified. Seat confirmed." },
  "pipeline.doc.verifiedPill": { fr: "Vérifié", en: "Verified" },
  "pipeline.doc.pendingText": { fr: "Chargé & signé ({channel}), en attente de vérification.", en: "Uploaded & signed ({channel}), awaiting verification." },
  "pipeline.doc.pendingPill": { fr: "En attente de vérification", en: "Pending verification" },
  "pipeline.doc.nonePastStageText": { fr: "Aucun document en attente à ce stade.", en: "No document pending at this stage." },
  "pipeline.doc.nonePill": { fr: "Aucun", en: "None" },
  "pipeline.doc.notSentText": { fr: "Envoyé au trainee après les premières étapes du parcours.", en: "Sent to the trainee after the track's first steps." },
  "pipeline.doc.notSentPill": { fr: "Non envoyé", en: "Not sent" },
  "pipeline.doc.awaitingText": { fr: "En attente du document d'engagement signé.", en: "Awaiting the signed engagement document." },
  "pipeline.doc.awaitingPill": { fr: "En attente de signature", en: "Awaiting signature" },
  "pipeline.doc.viewSigned": { fr: "📄 Voir le document signé", en: "📄 View signed document" },
  "pipeline.doc.verifyConfirm": { fr: "Vérifier & confirmer la place →", en: "Verify & confirm seat →" },
  "pipeline.doc.uploadLabel": { fr: "Charger le document d'engagement signé", en: "Upload the signed engagement document" },
  "pipeline.doc.uploadButton": { fr: "Charger & marquer signé", en: "Upload & mark signed" },
  "pipeline.doc.onlineSigningNote": {
    fr: "La signature électronique en ligne (Documenso) s'attache ici automatiquement une fois n8n configuré.",
    en: "Online e-signing (Documenso) attaches here automatically once n8n is wired.",
  },
} as const;

export type DictKey = keyof typeof DICT;

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export function useT() {
  const { lang } = useLang();
  return useCallback(
    (key: DictKey, vars?: Record<string, string | number>) =>
      interpolate(DICT[key][lang], vars),
    [lang],
  );
}
