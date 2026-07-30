import "server-only";
/**
 * Sidebar "new" counts — one lightweight head-count query per section, no
 * row data fetched. "New" means: not yet actioned by staff.
 *   - trainees: leads still at the first stage of their pathway ("lead"),
 *     PLUS leads sitting at deposit_contract with a document (signed
 *     contract or payment receipt) awaiting staff verification — the
 *     trainee uploaded via the public /sign link, staff hasn't looked yet.
 *   - engineering: requests still at their kind's initial stage and not exited
 *   - contacts: messages not yet opened (status "new")
 * Returns all-zero when Supabase isn't configured.
 */
import { supabaseServer } from "./supabase";

export interface ConsoleBadges {
  trainees: number;
  engineering: number;
  contacts: number;
}

const EMPTY: ConsoleBadges = { trainees: 0, engineering: 0, contacts: 0 };

export async function getConsoleBadgeCounts(): Promise<ConsoleBadges> {
  const sb = supabaseServer();
  if (!sb) return EMPTY;

  const [newLeads, engineering, contacts, unverifiedDocs] = await Promise.all([
    sb.from("leads").select("id", { count: "exact", head: true }).eq("stage", "lead"),
    sb
      .from("engineering_requests")
      .select("id", { count: "exact", head: true })
      .is("exited_at", null)
      .or("and(kind.eq.explant,stage.eq.prospection),and(kind.neq.explant,stage.eq.request)"),
    sb.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
    sb.from("documents").select("lead_id").eq("verified", false),
  ]);

  // Documents come back per-row (not a head count) so a lead with both an
  // unverified contract AND receipt is only counted once, and restricted
  // here to leads still at deposit_contract (awaiting the confirm step) —
  // a stray unverified doc on an already-confirmed/cancelled lead shouldn't
  // keep pinging staff.
  const pendingLeadIds = [...new Set((unverifiedDocs.data ?? []).map((d) => d.lead_id))];
  let pendingDocsAtGate = 0;
  if (pendingLeadIds.length > 0) {
    const { count } = await sb
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("stage", "deposit_contract")
      .in("id", pendingLeadIds);
    pendingDocsAtGate = count ?? 0;
  }

  return {
    trainees: (newLeads.count ?? 0) + pendingDocsAtGate,
    engineering: engineering.count ?? 0,
    contacts: contacts.count ?? 0,
  };
}
