// Build db/skills_real.sql from the 16 real skill folders + scripts/skills.config.json.
//
// For each skill it composes a self-contained `system_prompt` (RICH mode):
//   [portable "Instructions (paste this)" block, mechanics stripped]
//   + inlined reference knowledge (all references/*.md except intake-questions.md)
//   + a console runtime footer (single-pass, no follow-up questions).
// Then emits a re-runnable upsert that also deletes any skill not in the 16.
//
// Usage:  node scripts/build-skills-sql.mjs
// No dependencies. No app code touched. The generated SQL is run by hand in the
// Supabase SQL editor (same as every other db/*.sql migration).

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const CONFIG_PATH = join(SCRIPT_DIR, "skills.config.json");
const OUT_PATH = join(REPO_ROOT, "db", "skills_real.sql");

const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
const SKILLS_DIR = resolve(SCRIPT_DIR, config.skillsDir);

const MAX_REF_CHARS = 7000; // cap each reference file
const MAX_PROMPT_CHARS = 48000; // safety cap on the whole system prompt

// Lines that reference things the single-call console cannot do. Any line
// containing one of these tokens (case-insensitive) is dropped from the prompt.
const STRIP_TOKENS = [
  "memory.md",
  "memory/",
  "memory protocol",
  "memory update",
  "📝",
  "uploaded knowledge",
  "upload these files",
  "re-upload",
  "knowledge file",
  "scripts/",
  "python scripts",
  "code interpreter",
  "self-contained on upload",
];

const warnings = [];

/** Take the paste-able instruction block from instructions-portable.md. */
function extractInstructions(portable, key) {
  const marker = portable.search(/##\s*Instructions\b/i);
  if (marker === -1) {
    warnings.push(`${key}: no "## Instructions" marker in portable file; used full body`);
    // fall back: everything after the first horizontal rule, else whole file
    const rule = portable.indexOf("\n---");
    return (rule === -1 ? portable : portable.slice(rule + 4)).trim();
  }
  // skip the heading line itself
  const afterHeading = portable.slice(marker).replace(/^##[^\n]*\n/, "");
  return afterHeading.trim();
}

/** Sentence-level cleanup for the instruction block, so removing memory/upload
 *  mechanics never leaves dangling fragments or eats surrounding real content. */
function preClean(text) {
  return (
    text
      // "Start every task by reading MEMORY.md ..." directive (whole sentence/line)
      .replace(/\*{0,2}Start every task by reading[^\n]*\n?/gi, "")
      // a dangling "(priority: ... MEMORY ... references)." note, inline or standalone
      .replace(/\s*\(priority:[^)\n]*references\)\.?/gi, "")
      .replace(/^\s*\**Priority order when sources conflict:[^\n]*\n?/gim, "")
      // "Use the uploaded Knowledge as ground truth." — sentence only, keep the line
      .replace(/\s*Use the uploaded Knowledge[^.\n]*\.?/gi, "")
      // the memory-update numbered step (item + its indented continuation lines)
      .replace(
        /^\s*\d+\.\s+[^\n]*(learned something durable|MEMORY UPDATE)[\s\S]*?(?=\n\s*\d+\.\s|\n\s*\n|$)/gim,
        "",
      )
      // any residual "emit a ... MEMORY UPDATE ... block" sentence
      .replace(/[^.\n]*MEMORY UPDATE[^.\n]*\.?/gi, "")
      .replace(/\n{3,}/g, "\n\n")
  );
}

/** Drop mechanics lines the console cannot honour (memory/scripts/uploads). */
function stripMechanics(text) {
  return text
    .split("\n")
    .filter((line) => {
      const l = line.toLowerCase();
      return !STRIP_TOKENS.some((t) => l.includes(t));
    })
    .join("\n")
    // collapse 3+ blank lines left by removals
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Ordered list of reference files to inline (brand first, qa-rubric last). */
function refFiles(skillPath) {
  const dir = join(skillPath, "references");
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter(
    (f) => f.endsWith(".md") && f !== "intake-questions.md",
  );
  const rank = (f) =>
    f === "brand-guidelines.md" ? 0 : f === "examples.md" ? 8 : f === "qa-rubric.md" ? 9 : 4;
  return files.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)).map((f) => join(dir, f));
}

function inlineReferences(skillPath, key) {
  const parts = [];
  for (const file of refFiles(skillPath)) {
    let body = readFileSync(file, "utf8").trim();
    body = stripMechanics(body);
    if (body.length > MAX_REF_CHARS) body = body.slice(0, MAX_REF_CHARS) + "\n\n[... reference truncated ...]";
    const nameNoExt = file.split(/[\\/]/).pop().replace(/\.md$/, "");
    parts.push(`### ${nameNoExt}\n${body}`);
  }
  return parts.join("\n\n");
}

const RUNTIME_FOOTER = `

---

## Runtime (Gepromed console)
You run as a single-pass assistant. The user's field values are provided as the message.
- Do NOT ask follow-up questions. Infer sensibly, and put any inferred choices on one short \`Assumptions:\` line at the top.
- Output GitHub-flavored Markdown.
- Bilingual FR/EN: use the requested output language; if "mirror", match the user's input language.
- You produce a DRAFT. A human reviews and validates before anything is sent, published, or filed. Flag regulated or sensitive content for the responsible role.
- Never invent facts, figures, legal text, article numbers, citations, names, dates, or prices. Put unknowns in [brackets].`;

function firstSentence(desc) {
  const clean = desc.replace(/\s+/g, " ").trim();
  // split on the first sentence-ending period followed by a space + capital,
  // but keep it simple: cut at the first ". " that is not a decimal/abbrev.
  const m = clean.match(/^(.*?[.!?])\s/);
  let s = m ? m[1] : clean;
  if (s.length > 320) s = s.slice(0, 317) + "...";
  return s;
}

function frontmatterDescription(skillMd) {
  const m = skillMd.match(/description:\s*([\s\S]*?)\n(?:[a-zA-Z_-]+:|---)/);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}

/** Pick a dollar-quote tag not present in the content. */
function dq(content) {
  for (const tag of ["$g$", "$gp$", "$gpr$", "$gpro$", "$gprom$", "$gepromed$"]) {
    if (!content.includes(tag)) return tag + content + tag;
  }
  // extremely unlikely fallback
  const t = "$gpz9$";
  return t + content.split(t).join("") + t;
}

/** Build a plain row OBJECT for one skill (shared by the SQL writer and the
 *  direct-upsert importer scripts/import-skills.mjs). */
export function buildRowObject(skill) {
  const skillPath = join(SKILLS_DIR, skill.key);
  if (!existsSync(skillPath)) throw new Error(`skill folder missing: ${skill.key}`);

  const portable = readFileSync(join(skillPath, "instructions-portable.md"), "utf8");
  const skillMd = readFileSync(join(skillPath, "SKILL.md"), "utf8");

  let instructions = stripMechanics(preClean(extractInstructions(portable, skill.key)));
  const refs = inlineReferences(skillPath, skill.key);

  let systemPrompt =
    instructions +
    "\n\n---\n\n# Gepromed reference knowledge (ground truth, use verbatim where relevant)\n\n" +
    refs +
    RUNTIME_FOOTER;

  if (systemPrompt.length > MAX_PROMPT_CHARS) {
    warnings.push(`${skill.key}: prompt ${systemPrompt.length} chars > cap, truncated refs`);
    systemPrompt = systemPrompt.slice(0, MAX_PROMPT_CHARS) + "\n[... truncated ...]" + RUNTIME_FOOTER;
  }

  const description = firstSentence(frontmatterDescription(skillMd)) || skill.name;

  return {
    key: skill.key,
    name: skill.name,
    description,
    category: skill.category,
    icon: skill.icon,
    tags: skill.tags,
    owner: skill.owner,
    model: skill.model,
    status: skill.status,
    runs_this_month: 0, // app overwrites with real count
    avg_minutes_saved: skill.avgMinutesSaved,
    system_prompt: systemPrompt,
    inputs: skill.inputs,
    active: true,
  };
}

/** Serialize a row object into an SQL VALUES tuple (dollar-quoted). */
function rowToSqlTuple(o) {
  const cols = [
    dq(o.key),
    dq(o.name),
    dq(o.description),
    dq(o.category),
    dq(o.icon),
    dq(JSON.stringify(o.tags)),
    dq(o.owner),
    dq(o.model),
    dq(o.status),
    String(o.runs_this_month),
    String(o.avg_minutes_saved),
    dq(o.system_prompt),
    dq(JSON.stringify(o.inputs)),
    String(o.active),
  ];
  return `(\n  ${cols.join(",\n  ")}\n)`;
}

/** All 16 skill row objects, in config order. */
export function buildAllRowObjects() {
  return config.skills.map(buildRowObject);
}

/** The 16 real skill keys (used to delete demos). */
export const skillKeys = config.skills.map((s) => s.key);

// ---- SQL file generation (only when run directly: `node build-skills-sql.mjs`) ----

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {

const rows = config.skills.map(buildRowObject).map(rowToSqlTuple);
const keyList = config.skills.map((s) => `'${s.key}'`).join(", ");

const sql = `-- ============================================================================
-- db/skills_real.sql  (GENERATED by scripts/build-skills-sql.mjs -- do not hand-edit)
-- Loads the 16 real Gepromed skills into the "skills" table and removes the demos.
-- Re-runnable: upsert by key. Run in the Supabase SQL editor AFTER schema.sql + skills.sql.
-- ============================================================================

begin;

-- Ensure the presentational columns exist (idempotent; also created by skills.sql).
alter table skills add column if not exists icon              text  default 'sparkles';
alter table skills add column if not exists tags              jsonb default '[]';
alter table skills add column if not exists owner             text  default '';
alter table skills add column if not exists status            text  default 'Live';
alter table skills add column if not exists runs_this_month   int   default 0;
alter table skills add column if not exists avg_minutes_saved int   default 0;

-- Remove every skill that is not one of the 16 real ones (drops the 8 demos).
delete from skills where key not in (${keyList});

insert into skills
  (key, name, description, category, icon, tags, owner, model, status,
   runs_this_month, avg_minutes_saved, system_prompt, inputs, active)
values
${rows.join(",\n")}
on conflict (key) do update set
  name              = excluded.name,
  description       = excluded.description,
  category          = excluded.category,
  icon              = excluded.icon,
  tags              = excluded.tags,
  owner             = excluded.owner,
  model             = excluded.model,
  status            = excluded.status,
  avg_minutes_saved = excluded.avg_minutes_saved,
  system_prompt     = excluded.system_prompt,
  inputs            = excluded.inputs,
  active            = excluded.active,
  updated_at        = now();

commit;

-- Sanity check (optional): select count(*) from skills;  -- expect 16
`;

writeFileSync(OUT_PATH, sql, "utf8");

console.log(`Wrote ${OUT_PATH}`);
console.log(`Skills: ${rows.length}`);
console.log(`SQL size: ${(sql.length / 1024).toFixed(1)} KB`);
if (warnings.length) {
  console.log("\nWarnings:");
  for (const w of warnings) console.log("  - " + w);
} else {
  console.log("No warnings.");
}

} // end isMain
