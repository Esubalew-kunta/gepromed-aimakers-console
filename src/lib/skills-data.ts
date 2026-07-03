import "server-only";
/**
 * Skills data access. Reads from Supabase when configured AND seeded; otherwise
 * falls back to the offline seed (src/lib/seed/skills.ts). This keeps the app
 * working before db/skills.sql is run, and makes the catalog DB-driven after.
 *
 * The DB carries system_prompt + inputs; the seed still provides each skill's
 * deterministic demo() used as the no-live-key fallback (matched by key).
 */
import { supabaseServer } from "./supabase";
import { skills as seedSkills, getSkill as getSeedSkill } from "./seed/skills";
import type { Skill, SkillField, Category } from "./types";

interface SkillRow {
  key: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  tags: string[] | null;
  owner: string | null;
  model: string | null;
  status: string | null;
  runs_this_month: number | null;
  avg_minutes_saved: number | null;
  system_prompt: string | null;
  inputs: SkillField[] | null;
}

const OFFLINE_FALLBACK = () =>
  "_Offline preview unavailable for this skill — set ANTHROPIC_API_KEY for live output._";

function rowToSkill(row: SkillRow): Skill {
  const seed = getSeedSkill(row.key);
  return {
    id: row.key,
    name: row.name,
    summary: row.description ?? "",
    category: row.category as Category,
    icon: row.icon ?? "sparkles",
    tags: row.tags ?? [],
    owner: row.owner ?? "",
    model: row.model ?? "Claude",
    status: (row.status as Skill["status"]) ?? "Live",
    runsThisMonth: row.runs_this_month ?? 0,
    avgMinutesSaved: row.avg_minutes_saved ?? 0,
    inputs: row.inputs ?? [],
    systemPrompt: row.system_prompt ?? undefined,
    demo: seed?.demo ?? OFFLINE_FALLBACK,
  };
}

/** First day of the current month, ISO — the window for "runs this month". */
function monthStartISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

/** Real run counts per skill key for the current month (from skill_runs). */
async function getMonthlyRunCounts(): Promise<Record<string, number>> {
  const sb = supabaseServer();
  if (!sb) return {};
  const { data, error } = await sb
    .from("skill_runs")
    .select("skill_key")
    .gte("created_at", monthStartISO())
    .limit(5000);
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const r of data as { skill_key: string | null }[]) {
    if (r.skill_key) counts[r.skill_key] = (counts[r.skill_key] ?? 0) + 1;
  }
  return counts;
}

/** All active skills — from the DB when available, else the seed. */
export async function getSkills(): Promise<Skill[]> {
  const sb = supabaseServer();
  if (sb) {
    const { data, error } = await sb
      .from("skills")
      .select("*")
      .eq("active", true)
      .order("category");
    if (!error && data && data.length) {
      const counts = await getMonthlyRunCounts();
      return (data as SkillRow[]).map((row) => ({
        ...rowToSkill(row),
        runsThisMonth: counts[row.key] ?? 0,
      }));
    }
  }
  return seedSkills;
}

/** A single skill by its key — from the DB when available, else the seed. */
export async function getSkillByKey(key: string): Promise<Skill | undefined> {
  const sb = supabaseServer();
  if (sb) {
    const { data, error } = await sb
      .from("skills")
      .select("*")
      .eq("key", key)
      .maybeSingle();
    if (!error && data) {
      const counts = await getMonthlyRunCounts();
      return { ...rowToSkill(data as SkillRow), runsThisMonth: counts[key] ?? 0 };
    }
  }
  return getSeedSkill(key);
}
