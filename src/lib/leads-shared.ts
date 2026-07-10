/**
 * Lead types + presentational constants shared by server and client code.
 * (No "server-only" here — the client LeadBoard imports these too.)
 * Data fetching lives in leads-data.ts (server-only).
 *
 * The participant pipeline is split into TWO distinct pathways ("parcours"):
 *   • HelpMeSee  — foundation-imposed process (fixed steps).
 *   • Bootcamp   — Gepromed's own Bootcamps & Workshops process.
 * A status like "Confirmé" means different things in each world, so each
 * parcours has its own ordered stage set, labels, tones and advance labels.
 */

import {
  type PipelineDef,
  type VariantDef,
  stageIdsFor,
  stageLabelOf,
  stageShortOf,
  stageToneOf,
  advanceLabelOf,
} from "./pipeline/core";

/* ------------------------------------------------------------------ *
 * Parcours discriminator
 * ------------------------------------------------------------------ */

export type Parcours = "helpmesee" | "bootcamp";

export const PARCOURS: Parcours[] = ["helpmesee", "bootcamp"];

export const PARCOURS_LABEL: Record<Parcours, string> = {
  helpmesee: "HelpMeSee",
  bootcamp: "Bootcamps & Workshops",
};

export const PARCOURS_TONE: Record<Parcours, string> = {
  helpmesee: "bg-violet-50 text-violet-700",
  bootcamp: "bg-teal-50 text-teal-700",
};

/** Default parcours used for any lead read from the DB without one set yet. */
export const DEFAULT_PARCOURS: Parcours = "bootcamp";

/* ------------------------------------------------------------------ *
 * Stage sets — one ordered list per parcours
 * ------------------------------------------------------------------ */

export type HelpMeSeeStage =
  | "lead"
  | "enrollment_form"
  | "dates_validation"
  | "invoice"
  | "elearning_check"
  | "simulator_access"
  | "confirmed"
  | "done";

export type BootcampStage =
  | "lead"
  | "prerequisites"
  | "pre_registration"
  | "deposit_contract"
  | "practical_info"
  | "elearning_sent"
  | "confirmed"
  | "deposit_refunded"
  | "done";

/** Any stage across either parcours. */
export type Stage = HelpMeSeeStage | BootcampStage;

/** Exit status available at any stage of either parcours. */
export const NOT_INTERESTED = "not_interested" as const;
export type ExitStatus = typeof NOT_INTERESTED;

export const HELPMESEE_STAGES: readonly HelpMeSeeStage[] = [
  "lead",
  "enrollment_form",
  "dates_validation",
  "invoice",
  "elearning_check",
  "simulator_access",
  "confirmed",
  "done",
] as const;

export const BOOTCAMP_STAGES: readonly BootcampStage[] = [
  "lead",
  "prerequisites",
  "pre_registration",
  "deposit_contract",
  "practical_info",
  "elearning_sent",
  "confirmed",
  "deposit_refunded",
  "done",
] as const;

/* ------------------------------------------------------------------ *
 * FR labels (this console is primarily French)
 * ------------------------------------------------------------------ */

const HELPMESEE_STAGE_LABEL: Record<HelpMeSeeStage, string> = {
  lead: "Lead à suivre",
  enrollment_form: "Enrollment form à compléter",
  dates_validation: "Dates à valider",
  invoice: "Facture à payer",
  elearning_check: "E-learning à vérifier",
  simulator_access: "Accès simulateur envoyé",
  confirmed: "Confirmé",
  done: "Terminé",
};

const BOOTCAMP_STAGE_LABEL: Record<BootcampStage, string> = {
  lead: "Lead à suivre",
  prerequisites: "Prérequis à vérifier",
  pre_registration: "Pré-inscription confirmée",
  deposit_contract: "Caution / contrat reçus",
  practical_info: "Infos pratiques (J-30)",
  elearning_sent: "E-learning (J-15/7)",
  confirmed: "Confirmé",
  deposit_refunded: "Caution remboursée",
  done: "Terminé",
};

/** Short caps used under the workflow stepper nodes. */
const HELPMESEE_STAGE_SHORT: Record<HelpMeSeeStage, string> = {
  lead: "Lead",
  enrollment_form: "Form",
  dates_validation: "Dates",
  invoice: "Facture",
  elearning_check: "E-learn",
  simulator_access: "Simu",
  confirmed: "Confirmé",
  done: "Terminé",
};

const BOOTCAMP_STAGE_SHORT: Record<BootcampStage, string> = {
  lead: "Lead",
  prerequisites: "Prérequis",
  pre_registration: "Pré-insc.",
  deposit_contract: "Caution",
  practical_info: "Infos",
  elearning_sent: "E-learn",
  confirmed: "Confirmé",
  deposit_refunded: "Remb.",
  done: "Terminé",
};

const HELPMESEE_STAGE_TONE: Record<HelpMeSeeStage, string> = {
  lead: "bg-amber-50 text-amber-700",
  enrollment_form: "bg-sky-50 text-sky-700",
  dates_validation: "bg-indigo-50 text-indigo-700",
  invoice: "bg-orange-50 text-orange-700",
  elearning_check: "bg-violet-50 text-violet-700",
  simulator_access: "bg-teal-50 text-teal-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  done: "bg-ink-100 text-ink-600",
};

const BOOTCAMP_STAGE_TONE: Record<BootcampStage, string> = {
  lead: "bg-amber-50 text-amber-700",
  prerequisites: "bg-sky-50 text-sky-700",
  pre_registration: "bg-indigo-50 text-indigo-700",
  deposit_contract: "bg-violet-50 text-violet-700",
  practical_info: "bg-cyan-50 text-cyan-700",
  elearning_sent: "bg-orange-50 text-orange-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  deposit_refunded: "bg-teal-50 text-teal-700",
  done: "bg-ink-100 text-ink-600",
};

/** Label on the advance button = action that moves to the NEXT stage (null = terminal). */
const HELPMESEE_ADVANCE_LABEL: Record<HelpMeSeeStage, string | null> = {
  lead: "Enrollment form complété",
  enrollment_form: "Valider les dates",
  dates_validation: "Facture payée",
  invoice: "Vérifier l'e-learning",
  elearning_check: "Envoyer accès simulateur",
  simulator_access: "Confirmer la place",
  confirmed: "Marquer terminé",
  done: null,
};

const BOOTCAMP_ADVANCE_LABEL: Record<BootcampStage, string | null> = {
  lead: "Vérifier les prérequis",
  prerequisites: "Confirmer la pré-inscription",
  pre_registration: "Caution / contrat reçus",
  deposit_contract: "Envoyer infos pratiques",
  practical_info: "Envoyer l'e-learning",
  elearning_sent: "Confirmer la place",
  confirmed: "Caution remboursée",
  deposit_refunded: "Marquer terminé",
  done: null,
};

/* ------------------------------------------------------------------ *
 * Trainee pipeline, registered through the shared pipeline core.
 * The board + actions call the wrappers below (stable signatures); the
 * per-stage data now lives in ONE PipelineDef built from the maps above,
 * so Phase 5 can add explant/test/equipment pipelines the same way
 * (Master Plan Decision 1). No labels are re-typed here — the existing
 * maps feed the def, so behaviour is identical.
 * ------------------------------------------------------------------ */

function buildVariant<S extends string>(
  key: Parcours,
  label: string,
  tone: string,
  ids: readonly S[],
  labels: Record<S, string>,
  shorts: Record<S, string>,
  tones: Record<S, string>,
  advances: Record<S, string | null>,
): VariantDef {
  return {
    key,
    label,
    tone,
    stages: ids.map((id) => ({
      id,
      label: labels[id],
      short: shorts[id],
      tone: tones[id],
      advanceLabel: advances[id] ?? null,
    })),
  };
}

/** The trainee pipeline (2 parcours) as a shared PipelineDef. */
export const TRAINEE_PIPELINE: PipelineDef = {
  kind: "trainee",
  label: "Trainees management",
  defaultVariantKey: DEFAULT_PARCOURS,
  exitStatus: NOT_INTERESTED,
  variants: [
    buildVariant(
      "helpmesee",
      PARCOURS_LABEL.helpmesee,
      PARCOURS_TONE.helpmesee,
      HELPMESEE_STAGES,
      HELPMESEE_STAGE_LABEL,
      HELPMESEE_STAGE_SHORT,
      HELPMESEE_STAGE_TONE,
      HELPMESEE_ADVANCE_LABEL,
    ),
    buildVariant(
      "bootcamp",
      PARCOURS_LABEL.bootcamp,
      PARCOURS_TONE.bootcamp,
      BOOTCAMP_STAGES,
      BOOTCAMP_STAGE_LABEL,
      BOOTCAMP_STAGE_SHORT,
      BOOTCAMP_STAGE_TONE,
      BOOTCAMP_ADVANCE_LABEL,
    ),
  ],
};

/* ------------------------------------------------------------------ *
 * Parcours-aware helpers — thin wrappers over the pipeline core
 * (stable signatures; tolerate unknown/legacy stage ids gracefully).
 * ------------------------------------------------------------------ */

/** Normalize a (possibly legacy / undefined) lead into a concrete parcours. */
export function normalizeParcours(lead: { parcours?: Parcours | null }): Parcours {
  return lead?.parcours === "helpmesee" ? "helpmesee" : DEFAULT_PARCOURS;
}

/** Ordered stage list for a parcours. */
export function stagesFor(parcours: Parcours): readonly Stage[] {
  return stageIdsFor(TRAINEE_PIPELINE, parcours) as Stage[];
}

/** FR label for a stage within a parcours (falls back to the raw id). */
export function stageLabel(parcours: Parcours, stage: string): string {
  return stageLabelOf(TRAINEE_PIPELINE, parcours, stage);
}

/** Short cap for a stage within a parcours (stepper node). */
export function stageShort(parcours: Parcours, stage: string): string {
  return stageShortOf(TRAINEE_PIPELINE, parcours, stage);
}

/** Badge tone classes for a stage within a parcours. */
export function stageTone(parcours: Parcours, stage: string): string {
  return stageToneOf(TRAINEE_PIPELINE, parcours, stage);
}

/** Advance-button label for a stage within a parcours (null = terminal). */
export function advanceLabelFor(parcours: Parcours, stage: string): string | null {
  return advanceLabelOf(TRAINEE_PIPELINE, parcours, stage);
}

/**
 * Resolve the concrete next stage when staff advance a lead, applying the
 * Bootcamp caution/refund rule (SOP §Bootcamp): from `confirmed`,
 * `deposit_refunded` only applies when the caution was REQUIRED (not waived)
 * AND the participant attended the full training; otherwise the caution is
 * kept or was levée, so we skip straight to `done`. All other stages advance
 * linearly. Returns null at a terminal stage. Used by BOTH the board (button
 * label) and the server action (enforcement), so the rule can't be bypassed.
 */
export function resolveAdvance(
  parcours: Parcours,
  current: Stage,
  flags: { attended?: boolean | null; cautionWaived?: boolean | null } = {},
): Stage | null {
  const stages = stagesFor(parcours);
  const i = stages.indexOf(current);
  if (i < 0 || i >= stages.length - 1) return null;
  let next = stages[i + 1] as Stage;
  if (parcours === "bootcamp" && current === "confirmed" && next === "deposit_refunded") {
    if (flags.cautionWaived || !flags.attended) next = "done";
  }
  return next;
}

/* ------------------------------------------------------------------ *
 * Legacy single-pipeline exports — kept for backward compatibility.
 * (Grep confirms only the leads UI/actions used these; retained as thin
 * aliases so nothing that still references them breaks.)
 * ------------------------------------------------------------------ */

export type LeadStage = "lead" | "deposit_paid" | "contract_signed" | "confirmed";

export const LEAD_STAGES: LeadStage[] = [
  "lead",
  "deposit_paid",
  "contract_signed",
  "confirmed",
];

export const STAGE_LABEL: Record<LeadStage, string> = {
  lead: "Lead à suivre",
  deposit_paid: "Acompte payé",
  contract_signed: "Contrat signé",
  confirmed: "Confirmé",
};

export const STAGE_TONE: Record<LeadStage, string> = {
  lead: "bg-amber-50 text-amber-700",
  deposit_paid: "bg-sky-50 text-sky-700",
  contract_signed: "bg-indigo-50 text-indigo-700",
  confirmed: "bg-emerald-50 text-emerald-700",
};

/* ------------------------------------------------------------------ *
 * Interest levels (unchanged)
 * ------------------------------------------------------------------ */

export type InterestLevel =
  | "highly_interested"
  | "interested"
  | "neutral"
  | "not_interested"
  | "unreachable";

export const INTEREST_LEVELS: InterestLevel[] = [
  "highly_interested",
  "interested",
  "neutral",
  "not_interested",
  "unreachable",
];

export const INTEREST_LABEL: Record<InterestLevel, string> = {
  highly_interested: "Highly interested",
  interested: "Interested",
  neutral: "Neutral",
  not_interested: "Not interested",
  unreachable: "Unreachable",
};

export const INTEREST_TONE: Record<InterestLevel, string> = {
  highly_interested: "bg-emerald-50 text-emerald-700",
  interested: "bg-brand-50 text-brand-700",
  neutral: "bg-ink-100 text-ink-600",
  not_interested: "bg-red-50 text-red-700",
  unreachable: "bg-orange-50 text-orange-700",
};

export interface LeadComment {
  id: string;
  author: string | null;
  body: string;
  created_at: string;
}

export interface LeadDocument {
  id: string;
  file_url: string | null;
  sign_channel: "online" | "manual" | null;
  signed: boolean;
  verified: boolean;
  verified_at: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  ref: string | null;
  training_id: string | null;
  training_title_snapshot: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profession: string;
  institution: string;
  country: string;
  dietary: string;
  arrival: string;
  needs_accommodation: boolean;
  elearning_access: boolean;
  notes: string;
  /** Which pathway this participant follows. */
  parcours: Parcours;
  stage: Stage;
  interest: InterestLevel;
  reminders_active: boolean;
  sign_channel: "online" | "manual" | null;

  // SOP business-rule fields (Phase 1 migration).
  caution_waived: boolean;
  attended: boolean | null;
  attendance_confirmed_at: string | null;
  elearning_completed: boolean;
  year_of_residency: string | null;

  // Legacy single-pipeline timestamps (kept).
  deposit_paid_at: string | null;
  contract_signed_at: string | null;
  confirmed_at: string | null;
  lms_provisioned_at: string | null;
  lms_user_id: string | null;

  // HelpMeSee parcours timestamps.
  enrollment_form_at?: string | null;
  dates_validated_at?: string | null;
  invoice_paid_at?: string | null;
  elearning_checked_at?: string | null;
  simulator_access_at?: string | null;

  // Bootcamp parcours timestamps.
  prerequisites_ok_at?: string | null;
  pre_registration_at?: string | null;
  deposit_contract_at?: string | null;
  practical_info_at?: string | null;
  elearning_sent_at?: string | null;
  deposit_refunded_at?: string | null;

  // Shared tail-end / exit timestamps.
  done_at?: string | null;
  not_interested_at?: string | null;

  created_at: string;
  updated_at: string;
  trainings: {
    title: { fr: string; en: string };
    deposit_eur: number;
    price_eur: number;
    city: string;
    start_date: string;
    end_date: string;
    duration_days: number;
    program_type?: string;
    is_sponsored?: boolean;
    sponsors?: { name: string; logo_url?: string }[];
  } | null;
  lead_comments: LeadComment[];
  documents: LeadDocument[];
  contract_template_id: string | null;
  contract_template: { id: string; name: string; file_url: string | null } | null;
}

export interface LeadStats {
  total: number;
  toFollow: number;
  confirmed: number;
  potentialDeposits: number;
}

export function computeStats(leads: Lead[]): LeadStats {
  return {
    total: leads.length,
    toFollow: leads.filter((l) => l.stage === "lead").length,
    confirmed: leads.filter((l) => l.stage === "confirmed").length,
    potentialDeposits: leads
      .filter((l) => l.interest !== "not_interested")
      .reduce((sum, l) => sum + (l.trainings?.deposit_eur ?? 0), 0),
  };
}
