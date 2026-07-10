import "server-only";
/**
 * Engineering-requests data access (Phase 5). Reads via the service_role client
 * (sees all rows regardless of RLS). Returns [] when Supabase isn't configured.
 * Pipeline definitions + helpers live in pipeline/engineering.ts + pipeline/core.ts.
 */
import { supabaseServer } from "./supabase";

export interface EngineeringRequest {
  id: string;
  ref: string | null;
  kind: "explant" | "test" | "equipment";
  variant: string | null;
  stage: string;
  requester_name: string;
  requester_email: string;
  institution: string;
  org_type: string;
  desired_date: string | null;
  notes: string;
  meta: Record<string, unknown>;
  reminders_active: boolean;
  exit_reason: string | null;
  exited_at: string | null;
  created_at: string;
  updated_at: string;
}

/** All engineering requests, newest first (empty when Supabase absent). */
export async function getEngineeringRequests(): Promise<EngineeringRequest[]> {
  const sb = supabaseServer();
  if (!sb) return [];
  const { data, error } = await sb
    .from("engineering_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as EngineeringRequest[];
}
