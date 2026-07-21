/**
 * Engineering pipelines (Master Plan Phase 5) — the three tracked boards the
 * client asked for ("equivalent lead management for explant analysis, testing
 * platform and equipment rental"), built on the shared pipeline core.
 * Stage sets are derived from the client's workflow SOPs:
 *   • Explant Analysis — workflow-suivi-explants (2 cases: hospital / industrial)
 *   • Test Platform    — workflow-plateforme-de-tests (single flow)
 *   • Equipment Rental — "Réserver un créneau machine" (accès machine)
 * All three back onto ONE table `engineering_requests` (kind + variant); the
 * shared PipelineBoard + advance/exit logic operate on these defs.
 */
import type { PipelineDef, StageDef, Localized } from "./core";

const st = (
  id: string,
  label: Localized,
  short: Localized,
  tone: string,
  advanceLabel: Localized | null,
  optional = false,
): StageDef => ({ id, label, short, tone, advanceLabel, optional });

const A = "bg-amber-50 text-amber-700";
const S = "bg-sky-50 text-sky-700";
const I = "bg-indigo-50 text-indigo-700";
const V = "bg-violet-50 text-violet-700";
const C = "bg-cyan-50 text-cyan-700";
const O = "bg-orange-50 text-orange-700";
const E = "bg-emerald-50 text-emerald-700";
const D = "bg-ink-100 text-ink-600";

/* ------------------------------------------------------------------ *
 * 1. Explant Analysis — 2 cases share a 7-stage skeleton; only the
 *    "formalisation" wording differs (convention vs contract).
 * ------------------------------------------------------------------ */
const EXPLANT_COMMON = (formalisation: StageDef, firstReport: StageDef): StageDef[] => [
  st(
    "prospection",
    { fr: "Prospection / intérêt à confirmer", en: "Prospecting / interest to confirm" },
    { fr: "Prospection", en: "Prospecting" },
    A,
    { fr: "Intérêt confirmé", en: "Interest confirmed" },
  ),
  formalisation,
  st(
    "reception",
    { fr: "Réception & analyse macroscopique", en: "Receipt & macroscopic analysis" },
    { fr: "Réception", en: "Receipt" },
    I,
    { fr: "Résultats macro", en: "Macro results" },
  ),
  firstReport,
  st(
    "complementary",
    { fr: "Analyses complémentaires (sur demande)", en: "Complementary analyses (on request)" },
    { fr: "Complément", en: "Complement" },
    O,
    { fr: "Rapport complémentaire émis", en: "Complementary report issued" },
    // Optional supplementary test: recorded when performed, but NOT a
    // prerequisite for Fidélisation — a case may skip straight from the 1st
    // report to Fidélisation (client requirement, 2026-07).
    true,
  ),
  st(
    "follow_up",
    { fr: "Fidélisation / enquête annuelle", en: "Retention / annual survey" },
    { fr: "Fidélisation", en: "Retention" },
    C,
    { fr: "Marquer terminé", en: "Mark complete" },
  ),
  st("done", { fr: "Terminé", en: "Done" }, { fr: "Terminé", en: "Done" }, D, null),
];

export const EXPLANT_PIPELINE: PipelineDef = {
  kind: "explant",
  label: { fr: "Analyse d'explants", en: "Explant analysis" },
  defaultVariantKey: "hospital",
  exitStatus: "sans_suite",
  variants: [
    {
      key: "hospital",
      label: { fr: "Institution hospitalière", en: "Hospital institution" },
      tone: "bg-brand-50 text-brand-700",
      stages: EXPLANT_COMMON(
        st(
          "formalisation",
          { fr: "Convention + volet RGPD/DPA", en: "Agreement + GDPR/DPA addendum" },
          { fr: "Convention", en: "Agreement" },
          S,
          { fr: "Convention signée", en: "Agreement signed" },
        ),
        st(
          "first_report",
          { fr: "Premier rapport envoyé", en: "First report sent" },
          { fr: "1er rapport", en: "1st report" },
          V,
          { fr: "Rapport envoyé", en: "Report sent" },
        ),
      ),
    },
    {
      key: "industrial",
      label: { fr: "Industriel (fabricant)", en: "Industrial (manufacturer)" },
      tone: "bg-teal-50 text-teal-700",
      stages: EXPLANT_COMMON(
        st(
          "formalisation",
          { fr: "Contrat signé + modalités / NDA", en: "Contract signed + terms / NDA" },
          { fr: "Contrat", en: "Contract" },
          S,
          { fr: "Contrat signé", en: "Contract signed" },
        ),
        st(
          "first_report",
          { fr: "Premier rapport (si contrat actif)", en: "First report (if contract active)" },
          { fr: "1er rapport", en: "1st report" },
          V,
          { fr: "Rapport envoyé", en: "Report sent" },
        ),
      ),
    },
  ],
};

/* ------------------------------------------------------------------ *
 * 2. Test Platform — single flow (réception → devis → exécution → rapport).
 * ------------------------------------------------------------------ */
export const TEST_PIPELINE: PipelineDef = {
  kind: "test",
  label: { fr: "Plateforme de tests", en: "Testing platform" },
  defaultVariantKey: "default",
  exitStatus: "declined",
  variants: [
    {
      key: "default",
      label: { fr: "Prestation de test", en: "Testing service" },
      tone: "bg-brand-50 text-brand-700",
      stages: [
        st("request", { fr: "Demande reçue", en: "Request received" }, { fr: "Demande", en: "Request" }, A, { fr: "Qualifier (Go)", en: "Qualify (Go)" }),
        st("qualified", { fr: "Qualifiée (Go)", en: "Qualified (Go)" }, { fr: "Qualifiée", en: "Qualified" }, S, { fr: "Envoyer le devis", en: "Send quote" }),
        st("quote", { fr: "Devis envoyé", en: "Quote sent" }, { fr: "Devis", en: "Quote" }, I, { fr: "Commande confirmée", en: "Order confirmed" }),
        st("order", { fr: "Commande confirmée", en: "Order confirmed" }, { fr: "Commande", en: "Order" }, V, { fr: "Démarrer les essais", en: "Start tests" }),
        st("execution", { fr: "Essais en cours", en: "Tests in progress" }, { fr: "Essais", en: "Tests" }, O, { fr: "Livrer le rapport", en: "Deliver report" }),
        st("report", { fr: "Rapport livré", en: "Report delivered" }, { fr: "Rapport", en: "Report" }, E, { fr: "Marquer terminé", en: "Mark complete" }),
        st("done", { fr: "Terminé", en: "Done" }, { fr: "Terminé", en: "Done" }, D, null),
      ],
    },
  ],
};

/* ------------------------------------------------------------------ *
 * 3. Equipment Rental — machine-access reservation (accès machine).
 * ------------------------------------------------------------------ */
export const EQUIPMENT_PIPELINE: PipelineDef = {
  kind: "equipment",
  label: { fr: "Location d'équipement", en: "Equipment rental" },
  defaultVariantKey: "default",
  exitStatus: "declined",
  variants: [
    {
      key: "default",
      label: { fr: "Accès machine", en: "Machine access" },
      tone: "bg-brand-50 text-brand-700",
      stages: [
        st("request", { fr: "Demande de créneau", en: "Slot request" }, { fr: "Demande", en: "Request" }, A, { fr: "Qualifier", en: "Qualify" }),
        st("qualified", { fr: "Qualifiée / faisabilité", en: "Qualified / feasibility" }, { fr: "Qualifiée", en: "Qualified" }, S, { fr: "Réserver le créneau", en: "Book the slot" }),
        st("scheduled", { fr: "Créneau réservé", en: "Slot booked" }, { fr: "Réservé", en: "Booked" }, I, { fr: "Prise en main / habilitation", en: "Onboarding / certification" }),
        st("habilitation", { fr: "Prise en main / habilitation", en: "Onboarding / certification" }, { fr: "Habilitation", en: "Certification" }, V, { fr: "Créneau réalisé", en: "Slot completed" }),
        st("completed", { fr: "Créneau réalisé", en: "Slot completed" }, { fr: "Réalisé", en: "Completed" }, E, { fr: "Marquer terminé", en: "Mark complete" }),
        st("done", { fr: "Terminé", en: "Done" }, { fr: "Terminé", en: "Done" }, D, null),
      ],
    },
  ],
};

/** Registry — look up a pipeline by its `kind`. */
export const ENGINEERING_PIPELINES: Record<string, PipelineDef> = {
  explant: EXPLANT_PIPELINE,
  test: TEST_PIPELINE,
  equipment: EQUIPMENT_PIPELINE,
};

export type EngineeringKind = "explant" | "test" | "equipment";

/** Initial stage a new request of each kind enters. */
export const ENGINEERING_INITIAL_STAGE: Record<EngineeringKind, string> = {
  explant: "prospection",
  test: "request",
  equipment: "request",
};
