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
import type { PipelineDef, StageDef } from "./core";

const st = (
  id: string,
  label: string,
  short: string,
  tone: string,
  advanceLabel: string | null,
): StageDef => ({ id, label, short, tone, advanceLabel });

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
  st("prospection", "Prospection / intérêt à confirmer", "Prospection", A, "Intérêt confirmé"),
  formalisation,
  st("reception", "Réception & analyse macroscopique", "Réception", I, "Résultats macro"),
  firstReport,
  st("complementary", "Analyses complémentaires (sur demande)", "Complément", O, "Rapport complémentaire émis"),
  st("follow_up", "Fidélisation / enquête annuelle", "Fidélisation", C, "Marquer terminé"),
  st("done", "Terminé", "Terminé", D, null),
];

export const EXPLANT_PIPELINE: PipelineDef = {
  kind: "explant",
  label: "Analyse d'explants",
  defaultVariantKey: "hospital",
  exitStatus: "sans_suite",
  variants: [
    {
      key: "hospital",
      label: "Institution hospitalière",
      tone: "bg-brand-50 text-brand-700",
      stages: EXPLANT_COMMON(
        st("formalisation", "Convention + volet RGPD/DPA", "Convention", S, "Convention signée"),
        st("first_report", "Premier rapport envoyé", "1er rapport", V, "Rapport envoyé"),
      ),
    },
    {
      key: "industrial",
      label: "Industriel (fabricant)",
      tone: "bg-teal-50 text-teal-700",
      stages: EXPLANT_COMMON(
        st("formalisation", "Contrat signé + modalités / NDA", "Contrat", S, "Contrat signé"),
        st("first_report", "Premier rapport (si contrat actif)", "1er rapport", V, "Rapport envoyé"),
      ),
    },
  ],
};

/* ------------------------------------------------------------------ *
 * 2. Test Platform — single flow (réception → devis → exécution → rapport).
 * ------------------------------------------------------------------ */
export const TEST_PIPELINE: PipelineDef = {
  kind: "test",
  label: "Plateforme de tests",
  defaultVariantKey: "default",
  exitStatus: "declined",
  variants: [
    {
      key: "default",
      label: "Prestation de test",
      tone: "bg-brand-50 text-brand-700",
      stages: [
        st("request", "Demande reçue", "Demande", A, "Qualifier (Go)"),
        st("qualified", "Qualifiée (Go)", "Qualifiée", S, "Envoyer le devis"),
        st("quote", "Devis envoyé", "Devis", I, "Commande confirmée"),
        st("order", "Commande confirmée", "Commande", V, "Démarrer les essais"),
        st("execution", "Essais en cours", "Essais", O, "Livrer le rapport"),
        st("report", "Rapport livré", "Rapport", E, "Marquer terminé"),
        st("done", "Terminé", "Terminé", D, null),
      ],
    },
  ],
};

/* ------------------------------------------------------------------ *
 * 3. Equipment Rental — machine-access reservation (accès machine).
 * ------------------------------------------------------------------ */
export const EQUIPMENT_PIPELINE: PipelineDef = {
  kind: "equipment",
  label: "Location d'équipement",
  defaultVariantKey: "default",
  exitStatus: "declined",
  variants: [
    {
      key: "default",
      label: "Accès machine",
      tone: "bg-brand-50 text-brand-700",
      stages: [
        st("request", "Demande de créneau", "Demande", A, "Qualifier"),
        st("qualified", "Qualifiée / faisabilité", "Qualifiée", S, "Réserver le créneau"),
        st("scheduled", "Créneau réservé", "Réservé", I, "Prise en main / habilitation"),
        st("habilitation", "Prise en main / habilitation", "Habilitation", V, "Créneau réalisé"),
        st("completed", "Créneau réalisé", "Réalisé", E, "Marquer terminé"),
        st("done", "Terminé", "Terminé", D, null),
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
