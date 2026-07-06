# Plan: Load the 16 real Gepromed skills into Supabase

Plan only. No implementation until you approve.

Goal: replace the 8 demo skills in the console `/skills` section with the 16 real
Gepromed skills from the `skills/` repo folder, so the catalog and the "Run" action
work on the real prompts.

---

## 1. How it works today (verified in code)

- The console reads skills at runtime from the Supabase **`skills` table** via
  `src/lib/skills-data.ts` (`getSkills` / `getSkillByKey`). If the table is empty or
  Supabase is off, it falls back to the static seed `src/lib/seed/skills.ts`.
- A run (`src/app/(app)/skills/[id]/actions.ts`) is **one Claude call**:
  - `system` = the row's **`system_prompt`**
  - `user`  = the skill's **`inputs`** rendered as `Task: <name>` + one block per field
  - model is fixed in `src/lib/claude.ts` (Sonnet 5); the `model` column is display only.
- Today the table holds **8 demo skills** (seeded by `db/skills.sql`), e.g.
  "MDR Gap Analysis". These are placeholders, not the real Gepromed skills.

So to "make it real" we do not touch app code. We **replace the table rows**.

## 2. What the real skills are (the gap)

The `skills/` folder has **16 skills** in Claude Agent Skill format. Each is a rich
package, not a single prompt:

```
gepromed-<name>/
  SKILL.md                 # instructions, clarification + memory protocol, output spec
  instructions-portable.md # a clean, self-contained "paste this" instruction block
  references/*.md          # brand, voice/tone, glossary, templates, examples, QA rubric
  memory/MEMORY.md         # self-updating house style (agent writes to it)
  scripts/*.py             # brand-voice lint, memory updater
  assets/                  # logo, signatures, templates
  agents/openai.yaml       # display name + example prompts
```

**The mismatch to solve:** the console runs **one stateless Claude call with a fixed
system prompt + a form**. It cannot load reference files, cannot run the Python
scripts, and cannot write to a memory file. So each package must be **flattened into
one `system_prompt` + a small set of form `inputs`**, dropping the parts the console
cannot execute.

Two behaviors in the packages that need a decision because the console is **one-shot,
not a chat**:
- **Clarification protocol** ("ask up to 5 questions, then proceed"): the console
  cannot ask follow-ups. We convert this to "infer and state assumptions", and move
  the important questions into the **input form** instead.
- **Memory / self-improvement** (loads and rewrites `MEMORY.md`): there is no
  per-skill memory store in the console. For v1 we drop the file mechanics and soften
  it to "if the user states a durable preference, acknowledge it". (A real memory
  table is a possible later phase, see section 8.)

## 3. Field mapping (skill package -> `skills` table row)

| DB column | Source in the package | Notes |
|---|---|---|
| `key` | folder name (`gepromed-email-reformulation`) | unique, upsert key |
| `name` | `openai.yaml` display_name / `SKILL.md` title | human name |
| `description` | `SKILL.md` frontmatter description (trimmed) | one line for the card |
| `category` | mapped from the README grouping | must be one of the 6 console categories (section 5) |
| `icon` | chosen per skill | lucide icon name (e.g. `mail`, `graduation-cap`) |
| `tags` | key nouns from the skill | jsonb array, for search/badges |
| `owner` | the skill's validator role | RQ, DPO, RAF, Comms, Direction |
| `model` | `'Claude Sonnet 5'` | display only |
| `status` | `Live` (all 16 are built + audited) | a couple could be `Beta` |
| `avg_minutes_saved` | estimate per skill | needs a source or a sensible default (decision) |
| `system_prompt` | **composed** (section 4) | the real work |
| `inputs` | **authored** per skill (section 4) | the real work |
| `active` | `true` | |

`runs_this_month` is ignored on write: the app overwrites it with the real count from
`skill_runs`.

## 4. The two parts that need real work

### 4a. `system_prompt` (composed automatically)
Best source = each skill's **`instructions-portable.md`** "Instructions (paste this)"
block. It is already a clean, self-contained system prompt (brand identity, voice
rules, output format, guardrails). The importer will:
1. Extract that block.
2. Strip the lines that reference files/scripts/memory the console cannot use
   ("read MEMORY.md", "use the uploaded Knowledge", "run scripts/…").
3. Inline the **essential ground truth** so quality survives: append compact,
   delimited sections from `references/brand-guidelines.md`, `references/voice-and-tone.md`,
   and `references/glossary-fr-en.md` (these exist in most skills).
4. Append a short console adapter footer: "You run in a single pass with the fields
   below. Do not ask follow-up questions; infer, state assumptions, and produce the
   deliverable. Output GitHub-flavored Markdown. Bilingual FR/EN, mirror the user."

Result: one faithful, self-contained prompt per skill, generated, not hand-written.
Size stays roughly 2 to 6k tokens each (fine for Sonnet).

### 4b. `inputs` (authored per skill, the one manual step)
The console form fields must capture up front what the clarification protocol would
otherwise ask. Source = each skill's `references/intake-questions.md` (14 of 16 have
one) plus the `SKILL.md` "## Inputs" section. Because turning free-form intake
questions into clean typed fields needs judgment, we hand-author a small
`skills.config.json` (one entry per skill: 1 to 5 fields of type text/textarea/select,
each with label, placeholder, sample, and options for selects), plus the per-skill
metadata (category, icon, tags, owner, status, minutes). 16 skills x a few fields is
a small, well-bounded task.

## 5. Proposed category mapping (needs your OK)

Console has 6 categories. Proposed:

| Skill | Category |
|---|---|
| email-reformulation, linkedin-post-drafter, editorial-calendar-builder, infographic-spec-generator, website-content-generator, branded-template-library, prospect-outreach-drafter | Communication |
| qualiopi-program-generator, elearning-module-structurer, training-admin-doc-pack | Training & Enablement |
| rgpd-document-drafter, iso-gap-analysis | Regulatory & Compliance |
| scientific-writing-summarizer, stats-publication-chart | Clinical & Quality |
| management-review-deck, hr-drafting | Operations |

(Project & Funding would be empty; fine, or move management-review there. Your call.)

## 6. Recommended approach: a generator script + hand-authored config

Rather than hand-write 16 big SQL rows (error-prone) or hand-write 16 prompts, use a
small **importer** that is re-runnable and reviewable:

```
scripts/import-skills.(ts|py)
  reads   skills/<each>/instructions-portable.md + references/*
  reads   scripts/skills.config.json   (hand-authored: inputs + metadata)
  writes  db/skills_real.sql           (upsert by key, same shape as db/skills.sql)
```

Why this and not alternatives:
- **vs hand-writing SQL:** the prompts are long; generating avoids copy/paste errors
  and re-runs cleanly when a skill's `.md` changes.
- **vs importing SKILL.md raw:** SKILL.md is full of file/script/memory mechanics that
  would confuse a one-shot model; the portable block is the clean source.
- **vs a live filesystem loader in the app:** the app is deployed on Render without the
  `skills/` folder and the DB is the established source of truth. Keep runtime = DB.

The generated `db/skills_real.sql` is then run once in the Supabase SQL editor (same
way every other migration in `db/` was applied; the Supabase MCP cannot see this
project). The live console picks it up immediately (no redeploy needed, since
`NEXT_PUBLIC_*` is not involved and skills are read at request time).

## 7. Step by step (phased)

1. **Confirm decisions** (section 9).
2. **Author `scripts/skills.config.json`** (inputs + category/icon/tags/owner/status/
   minutes for all 16). Review it with you.
3. **Write `scripts/import-skills`** to compose prompts + emit `db/skills_real.sql`.
4. **Generate + eyeball** 2-3 prompts (email, qualiopi, iso-gap) for fidelity.
5. **Retire the demo rows:** either `active=false` for the 8 samples or delete them
   (decision). The importer can include this.
6. **Run `db/skills_real.sql`** in Supabase (you or me via provided SQL).
7. **Verify** in the console (section 10).
8. **Later (optional):** per-skill memory table so the "self-improving" behavior works.

## 8. Out of scope for v1 (flag)
- The Python scripts (brand-voice lint, memory updater) do not run in the console; the
  behavior is folded into the prompt instead.
- Self-updating memory: dropped for v1 (no store). Optional later phase = a
  `skill_memory` table the run action loads/appends.
- Interactive clarifying questions: replaced by up-front form fields + "state
  assumptions", because the console run is one-shot.
- File/asset uploads (logo, templates as attachments): the console outputs Markdown
  text only; assets are not attached.

## 9. Decisions (ALL LOCKED)

1. **Replace** the 8 demo skills (delete them, show only the 16 real ones). ✅
2. **Category mapping:** use the table in section 5 as-is (7 Communication, 3 Training
   & Enablement, 2 Regulatory & Compliance, 2 Clinical & Quality, 2 Operations;
   Project & Funding empty). ✅
3. **Prompt richness: RICH** — skill instruction block + inlined brand-guidelines +
   voice-and-tone + glossary, so output uses exact Gepromed wording. ✅
4. **`avg_minutes_saved`:** my per-skill estimates. ✅
5. **Status:** `Beta` for `rgpd-document-drafter`, `iso-gap-analysis`,
   `management-review-deck`; all other 13 `Live`. ✅
6. **You** run the generated SQL in the Supabase SQL editor; I hand you a
   ready-to-paste `db/skills_real.sql`. ✅

All decisions locked. Ready to build on your go (steps in section 7). Not started yet.

---

## 11. Detailed implementation plan (execution)

No app code changes. Three new files under the console repo, plus the generated SQL.

### Files
1. **`scripts/skills.config.json`** (hand-authored) — an array of 16 entries, one per
   skill. Each entry:
   ```json
   {
     "key": "gepromed-email-reformulation",
     "name": "Email Reformulation & Professional Tone",
     "category": "Communication",
     "icon": "mail",
     "tags": ["Email","FR/EN","Tone","Draft"],
     "owner": "Communication",
     "model": "Claude Sonnet 5",
     "status": "Live",
     "avgMinutesSaved": 12,
     "richRefs": ["brand-guidelines.md","voice-and-tone.md","glossary-fr-en.md"],
     "inputs": [
       {"name":"text","label":"Raw email or intent","type":"textarea","placeholder":"Paste the message or describe what you want to say...","sample":"..."},
       {"name":"recipient","label":"Recipient","type":"select","options":["Infer","Surgeon","Manufacturer","Researcher","Institution/Funder","Participant","Supplier","Member/Donor"],"sample":"Surgeon"},
       {"name":"tone","label":"Tone","type":"select","options":["Neutral-professional","Warm","Firm","Formal"],"sample":"Warm"},
       {"name":"language","label":"Output language","type":"select","options":["Mirror input","French","English"],"sample":"Mirror input"}
     ]
   }
   ```
   Inputs are derived from each skill's `references/intake-questions.md` (14 of 16) and
   the `SKILL.md` "## Inputs" section, condensed to 1 to 5 form fields. This is the one
   judgment step; I will show you the full config for a quick review before generating.

2. **`scripts/build-skills-sql.mjs`** (Node, no dependencies) — for each config entry:
   - read `<skill>/instructions-portable.md`, extract the "## Instructions (paste this)"
     block;
   - **strip** lines that reference things the console cannot do (mentions of
     `MEMORY.md`, "uploaded Knowledge", "scripts/…", "re-upload", the memory-update
     block);
   - **inline** each `richRefs` file from `<skill>/references/` as a clearly delimited
     `--- BRAND / VOICE / GLOSSARY ---` section (RICH mode, decision 3);
   - append a fixed **console adapter footer**: "You run in a single pass with the
     fields below. Do not ask follow-up questions; infer, state assumptions in one line,
     then produce the deliverable in GitHub-flavored Markdown. Bilingual FR/EN: mirror
     the user's language. You draft; a human reviews and sends/publishes." ;
   - assemble the row and emit SQL with safe dollar-quoting (`$sp$…$sp$` for the prompt,
     `$j$…$j$` for JSON, `$d$…$d$` for description); the script auto-picks a longer tag
     if a delimiter ever appears in content.
   - Output structure of `db/skills_real.sql`:
     ```sql
     begin;
     -- remove every skill that is not one of the 16 real ones (drops the 8 demos)
     delete from skills where key not in ( ...16 keys... );
     -- upsert the 16 real skills (on conflict (key) do update ...)
     insert into skills (...) values (...) , (...) on conflict (key) do update set ...;
     commit;
     ```

3. **`db/skills_real.sql`** (generated) — the file you paste into the Supabase SQL
   editor. Re-runnable (idempotent upsert). Regenerate any time a skill `.md` changes.

### Order of work
1. Read all 16 skills' intake/inputs sections. *(me)*
2. Write `scripts/skills.config.json`. *(me)* → **show you for a quick review.**
3. Write `scripts/build-skills-sql.mjs`. *(me)*
4. Run it, generate `db/skills_real.sql`. *(me)*
5. Self-check the output: 16 rows; each `system_prompt` has the brand text inlined and
   NO leftover "MEMORY.md / upload / scripts/" lines; every `inputs`/`tags` JSON parses;
   dollar-quote tags are safe; demo keys are deleted. *(me)*
6. **You run `db/skills_real.sql`** in the Supabase SQL editor. *(you — I will ping you)*
7. Verify in the console: `/skills` shows 16 by category; open 3 and run with sample
   inputs; confirm live Sonnet output (not the offline fallback) and a `skill_runs` row.
   *(me, then you eyeball)*

### When I will need you
- **Checkpoint A:** review `scripts/skills.config.json` (the input forms + categories).
- **Checkpoint B:** run the generated `db/skills_real.sql` in Supabase (decision 6).
- **Checkpoint C:** eyeball 1 or 2 live runs in the console.

I will build steps 1 to 5 now and stop at Checkpoint A.

### BUILT (steps 1 to 5 done, local only, nothing pushed, no app code touched)
- `scripts/skills.config.json` — 16 skills, categories 7/3/2/2/2, 12 Live + 4 Beta
  (Beta: rgpd, iso-gap, management-review, **stats-publication-chart** — added to Beta
  because the console cannot run its real Python stats script, so numbers are
  LLM-estimated from pasted data; confirm or flip to Live).
- `scripts/build-skills-sql.mjs` — importer (RICH prompts: instruction block, mechanics
  cleaned sentence-aware, all references inlined except intake-questions, single-pass
  runtime footer).
- `db/skills_real.sql` — GENERATED, 397 KB, 16 upsert rows + deletes the 8 demos.
  Self-checked: 16 rows, dollar-quote parity exact, no leftover memory/upload/script
  mechanics, brand knowledge inlined 16/16.

**Now at Checkpoint B: you run `db/skills_real.sql` in the Supabase SQL editor.** Then
I verify in the console (Checkpoint C).

## 10. Verification (after import)
- `getSkills()` returns 16; `/skills` catalog lists them by category with icons/tags.
- Open 3 skills, run with the sample inputs, confirm live Sonnet output (not the
  offline fallback), on-brand and bilingual.
- A run inserts into `skill_runs`; "runs this month" increments.
- `tsc --noEmit` still clean (no app code changed).
- Demo skills no longer appear (if we retire them).

Nothing above is built yet. Tell me the decisions in section 9 and I will start.
