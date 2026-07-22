// Import the 16 real Gepromed skills straight into the Supabase `skills` table
// via the service-role key — the programmatic equivalent of running
// db/skills_real.sql, without pushing a 400 KB SQL blob through a tool call.
//
//   node scripts/import-skills.mjs           # apply
//   node scripts/import-skills.mjs --dry-run # show what would change, touch nothing
//
// Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.
// Deletes any skill not in the 16, then upserts the 16 (idempotent, by key).

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { buildAllRowObjects, skillKeys } from "./build-skills-sql.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const DRY = process.argv.includes("--dry-run");

// Minimal .env.local loader (KEY=VALUE, ignores comments/blank lines).
function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(join(REPO_ROOT, ".env.local"), "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
  } catch {
    /* fall through to process.env */
  }
  return env;
}

const env = { ...loadEnv(), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env.local).");
  process.exit(1);
}

const sb = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});

async function main() {
  const rows = buildAllRowObjects();
  console.log(`Built ${rows.length} skill rows from the repo (${skillKeys.length} keys).`);

  // 1) Which existing skills are NOT one of the 16 (the demos to remove)?
  const { data: existing, error: selErr } = await sb.from("skills").select("key");
  if (selErr) throw selErr;
  const toDelete = (existing ?? []).map((r) => r.key).filter((k) => !skillKeys.includes(k));
  console.log(`Existing rows: ${existing?.length ?? 0}. To delete (not in the 16): ${toDelete.length}` +
    (toDelete.length ? ` -> ${toDelete.join(", ")}` : ""));

  if (DRY) {
    console.log("\n--dry-run: no changes written. Would upsert 16 and delete the above.");
    return;
  }

  // 2) Upsert the 16 real skills (by key).
  const { error: upErr } = await sb.from("skills").upsert(rows, { onConflict: "key" });
  if (upErr) throw upErr;
  console.log(`Upserted ${rows.length} real skills.`);

  // 3) Delete the demos.
  if (toDelete.length) {
    const { error: delErr } = await sb.from("skills").delete().in("key", toDelete);
    if (delErr) throw delErr;
    console.log(`Deleted ${toDelete.length} demo skill(s).`);
  }

  // 4) Verify.
  const { data: after, error: afterErr } = await sb
    .from("skills")
    .select("key")
    .order("key");
  if (afterErr) throw afterErr;
  const keys = (after ?? []).map((r) => r.key);
  const gep = keys.filter((k) => k.startsWith("gepromed-")).length;
  console.log(`\nDone. skills table now has ${keys.length} rows (${gep} gepromed-*).`);
}

main().catch((e) => {
  console.error("Import failed:", e.message || e);
  process.exit(1);
});
