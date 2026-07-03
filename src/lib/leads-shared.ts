/**
 * Lead types + presentational constants shared by server and client code.
 * (No "server-only" here — the client LeadBoard imports these too.)
 * Data fetching lives in leads-data.ts (server-only).
 */

export type LeadStage = "lead" | "deposit_paid" | "contract_signed" | "confirmed";

export type InterestLevel =
  | "highly_interested"
  | "interested"
  | "neutral"
  | "not_interested"
  | "unreachable";

export const LEAD_STAGES: LeadStage[] = [
  "lead",
  "deposit_paid",
  "contract_signed",
  "confirmed",
];

export const STAGE_LABEL: Record<LeadStage, string> = {
  lead: "Lead — à suivre",
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

/** Label shown on the primary advance button for each stage (null = terminal). */
export const ADVANCE_LABEL: Record<LeadStage, string | null> = {
  lead: "Mark deposit paid",
  deposit_paid: "Mark contract signed",
  contract_signed: "Confirm seat",
  confirmed: null,
};

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
  stage: LeadStage;
  interest: InterestLevel;
  reminders_active: boolean;
  sign_channel: "online" | "manual" | null;
  deposit_paid_at: string | null;
  contract_signed_at: string | null;
  confirmed_at: string | null;
  lms_provisioned_at: string | null;
  lms_user_id: string | null;
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
