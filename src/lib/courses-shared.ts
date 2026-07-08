/**
 * Course (training session) types + constants shared by server and client.
 * These are the vascular/ophthalmology sessions shown on the public website —
 * distinct from the SaaS "Training hub" enablement modules.
 */

export type Bi = { fr: string; en: string };

export const SPECIALTIES = ["vascular", "ophthalmology", "simulation"] as const;
export const SPECIALTY_LABEL: Record<string, string> = {
  vascular: "Vascular surgery",
  ophthalmology: "Ophthalmology",
  simulation: "Simulation & innovation",
};

export const LEVELS = ["Initiation", "Advanced", "Expert"] as const;
export const AUDIENCES = ["France", "Europe"] as const;
export const COURSE_STATUS = ["open", "full"] as const;

export interface Supervisor {
  name: string;
  role: Bi;
}
export interface ProgramDay {
  day: Bi;
  items: Bi[];
}

export interface Course {
  id: string;
  slug: string;
  title: Bi;
  specialty: string;
  level: string;
  audience: string;
  city: string;
  venue: Bi;
  start_date: string;
  end_date: string;
  duration_days: number;
  price_eur: number;
  deposit_eur: number;
  capacity: number;
  enrolled: number;
  qualiopi: boolean;
  summary: Bi;
  objectives: Bi[];
  program: ProgramDay[];
  supervisors: Supervisor[];
  satisfaction: number | null;
  pass_rate: number | null;
  photos: number | null;
  status: string;
  image_url: string | null;
  // Qualiopi fields (public training detail pages). All optional so existing
  // seed/DB rows keep compiling and Supabase rows without these columns still map.
  target_audience?: string[]; // "public visé" tags (distinct from geography `audience`)
  prerequisites?: Bi; // Prérequis
  pedagogical_resources?: Bi; // Ressources pédagogiques
  teaching_methods?: Bi; // Méthodes d'enseignement (présentiel, simulateur, atelier…)
  evaluation_methods?: Bi; // Méthodes d'évaluation
  supervision_organization?: Bi; // Organisation / encadrement
}

export function isUpcoming(c: Course, now = new Date()): boolean {
  return new Date(c.start_date) >= now;
}

export function euro(n: number): string {
  return (n ?? 0).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

export function fmtRange(a?: string, b?: string): string {
  if (!a) return "—";
  const s = new Date(a);
  const e = new Date(b || a);
  const o = { day: "numeric", month: "short" } as const;
  return `${s.toLocaleDateString("en-GB", o)} – ${e.toLocaleDateString("en-GB", o)} ${e.getFullYear()}`;
}
