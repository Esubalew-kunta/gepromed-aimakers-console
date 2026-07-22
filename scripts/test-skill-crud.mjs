// Integration test for the Skills add / edit / run flows. Exercises the exact
// operations the server actions perform (src/app/(app)/skills/actions.ts and
// [id]/actions.ts): create (insert with slugified key), read-back (getSkillByKey),
// edit (update by key), run (getSkillByKey -> renderUserPrompt -> live Claude ->
// record in skill_runs -> monthly run count). Self-cleaning.
//
//   node scripts/test-skill-crud.mjs

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import Anthropic from "@anthropic-ai/sdk";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(join(REPO_ROOT, ".env.local"), "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i > -1) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
  } catch {}
  return env;
}
const env = { ...loadEnv(), ...process.env };

// --- mirror of the server-action helpers -----------------------------------
const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "skill";
const renderUserPrompt = (skill, values) =>
  `Task: ${skill.name}\n\n` +
  skill.inputs.map((f) => `## ${f.label}\n${values[f.name] || "(not provided)"}`).join("\n\n");
const monthStartISO = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), 1).toISOString();
};

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});
const anthropic = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;
const MODEL = env.ANTHROPIC_MODEL || "claude-sonnet-5";

let pass = 0,
  fail = 0;
const ok = (cond, label, extra = "") => {
  console.log(`${cond ? "  ✅ PASS" : "  ❌ FAIL"}  ${label}${extra ? " — " + extra : ""}`);
  cond ? pass++ : fail++;
};

const NAME = "Zz Test Skill (auto)";
const KEY = slugify(NAME);
const NAME2 = "Zz Test Skill (edited)";

async function main() {
  console.log(`Test skill key: ${KEY}\n`);
  // clean any leftover from a previous run
  await sb.from("skill_runs").delete().eq("skill_key", KEY);
  await sb.from("skills").delete().eq("key", KEY);

  // 1) CREATE (saveSkill insert path)
  console.log("1) Add new skill");
  const createRow = {
    key: KEY,
    name: NAME,
    description: "Auto integration-test skill.",
    category: "Operations",
    icon: "sparkles",
    owner: "QA",
    model: "Claude Sonnet 5",
    status: "Live",
    system_prompt:
      "You are a terse assistant. Reply with EXACTLY one uppercase word and nothing else.",
    inputs: [{ name: "word", label: "Word to echo", type: "text" }],
    tags: ["test", "auto"],
    active: true,
  };
  const { error: cErr } = await sb.from("skills").insert(createRow);
  ok(!cErr, "insert new skill", cErr?.message);

  // 2) READ BACK (getSkillByKey path)
  const { data: read } = await sb.from("skills").select("*").eq("key", KEY).maybeSingle();
  ok(!!read, "skill readable by key");
  ok(read?.name === NAME, "name persisted");
  ok(read?.system_prompt?.includes("EXACTLY one uppercase word"), "system_prompt persisted");
  ok(Array.isArray(read?.inputs) && read.inputs[0]?.name === "word", "inputs persisted as array");
  const { data: active } = await sb.from("skills").select("key").eq("active", true).eq("key", KEY);
  ok(active?.length === 1, "appears in active catalog (getSkills filter)");

  // 3) EDIT (saveSkill update path)
  console.log("\n2) Edit skill");
  const { error: uErr } = await sb
    .from("skills")
    .update({ name: NAME2, system_prompt: "Reply with EXACTLY the word BANANA and nothing else." })
    .eq("key", KEY);
  ok(!uErr, "update by key", uErr?.message);
  const { data: read2 } = await sb.from("skills").select("*").eq("key", KEY).maybeSingle();
  ok(read2?.name === NAME2, "edited name persisted");
  ok(read2?.system_prompt?.includes("BANANA"), "edited system_prompt persisted");

  // 4) RUN (runSkillAction path) — live Claude with the edited prompt
  console.log("\n3) Use (run) the skill");
  const skill = { id: KEY, name: read2.name, inputs: read2.inputs, systemPrompt: read2.system_prompt };
  const values = { word: "hello" };
  let output = "";
  if (anthropic) {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: skill.systemPrompt,
      messages: [{ role: "user", content: renderUserPrompt(skill, values) }],
    });
    output = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    ok(output.length > 0, "live Claude returned output", JSON.stringify(output).slice(0, 80));
    ok(/BANANA/i.test(output), "output follows the EDITED prompt (contains BANANA)", output);
  } else {
    ok(false, "ANTHROPIC_API_KEY set for live run");
  }
  // record the run (as runSkillAction does)
  const { error: rErr } = await sb
    .from("skill_runs")
    .insert({ skill_key: KEY, run_by: "qa@test", inputs: values, output });
  ok(!rErr, "skill_runs record inserted", rErr?.message);
  const { data: runs } = await sb
    .from("skill_runs")
    .select("skill_key")
    .eq("skill_key", KEY)
    .gte("created_at", monthStartISO());
  ok((runs?.length ?? 0) >= 1, "run counted for this month (runsThisMonth path)");

  // 5) CLEANUP
  console.log("\n4) Cleanup");
  await sb.from("skill_runs").delete().eq("skill_key", KEY);
  const { error: dErr } = await sb.from("skills").delete().eq("key", KEY);
  ok(!dErr, "delete test skill", dErr?.message);
  const { data: gone } = await sb.from("skills").select("key").eq("key", KEY);
  ok((gone?.length ?? 0) === 0, "test skill removed");

  console.log(`\n${fail === 0 ? "✅ ALL PASS" : "❌ SOME FAILED"} — ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Test crashed:", e.message || e);
  process.exit(1);
});
