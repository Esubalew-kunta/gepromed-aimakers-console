import "server-only";
/**
 * Sidebar "new" counts — one lightweight head-count query per section, no
 * row data fetched. "New" means: not yet actioned by staff.
 *   - trainees: leads still at the first stage of their pathway ("lead")
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

  const [trainees, engineering, contacts] = await Promise.all([
    sb.from("leads").select("id", { count: "exact", head: true }).eq("stage", "lead"),
    sb
      .from("engineering_requests")
      .select("id", { count: "exact", head: true })
      .is("exited_at", null)
      .or("and(kind.eq.explant,stage.eq.prospection),and(kind.neq.explant,stage.eq.request)"),
    sb.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  return {
    trainees: trainees.count ?? 0,
    engineering: engineering.count ?? 0,
    contacts: contacts.count ?? 0,
  };
}
