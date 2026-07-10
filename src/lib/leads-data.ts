import "server-only";
/**
 * Lead-management data access (SaaS side). Reads via the service_role client,
 * so it sees every lead regardless of RLS. Returns [] when Supabase is not
 * configured, so the page renders an empty state instead of crashing.
 *
 * Types + presentational constants live in leads-shared.ts (client-safe).
 */
import { supabaseServer } from "./supabase";
import type { Lead } from "./leads-shared";

export * from "./leads-shared";

const BASE_SELECT =
  "*, trainings(title,deposit_eur,price_eur,city,start_date,end_date,duration_days,program_type,is_sponsored,sponsors), lead_comments(id,author,body,created_at), documents(id,file_url,sign_channel,signed,verified,verified_at,created_at)";
const FULL_SELECT = `${BASE_SELECT}, contract_template:contract_templates(id,name,file_url)`;

/** All leads (newest first) with the joined training, comments, docs, contract. */
export async function getLeads(): Promise<Lead[]> {
  const sb = supabaseServer();
  if (!sb) return [];
  // Prefer the full select; if the contract_templates table isn't there yet
  // (db/contract_templates.sql not run), fall back so the board still works.
  let { data, error } = await sb
    .from("leads")
    .select(FULL_SELECT)
    .order("created_at", { ascending: false });
  if (error) {
    ({ data, error } = await sb
      .from("leads")
      .select(BASE_SELECT)
      .order("created_at", { ascending: false }));
  }
  if (error || !data) return [];
  for (const l of data as Lead[]) {
    l.lead_comments?.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  return data as Lead[];
}
