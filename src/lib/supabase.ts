import "server-only";
/**
 * Server-only Supabase client for the SaaS console.
 *
 * The SaaS uses its OWN HMAC-cookie auth (see lib/auth.ts), so all server-side
 * data access goes through the SERVICE_ROLE ("secret") client, which bypasses
 * RLS. n8n does the same. The public website — a separate app — uses the anon
 * ("publishable") key with the RLS policies in db/schema.sql.
 *
 * Blank env is intentional: if the keys aren't set, `supabaseServer()` returns
 * null and callers fall back to the seeded offline DEMO MODE. Nothing crashes on
 * a bare deploy — same philosophy as the rest of this app.
 *
 * `ws` transport: supabase-js constructs a Realtime client eagerly, which throws
 * on Node < 22 (no native WebSocket). We never subscribe server-side, but we
 * inject `ws` so construction never fails on the local Node 20 / Render runtime.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _server: SupabaseClient | null = null;

/** Server-only client with the service_role/secret key. Returns null if unconfigured. */
export function supabaseServer(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  if (!_server) {
    _server = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: ws as unknown as never },
    });
  }
  return _server;
}

/** True when Supabase is wired up (live mode); false keeps the offline demo. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && serviceKey);
}
