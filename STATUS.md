# Gepromed — Console (SaaS) STATUS

Quick catch-up for any new session. Companion docs: `PROJECT_LOG.md` (history),
`IMPLEMENTATION_PLAN.md` (the 11-phase plan), `n8n/SETUP.md` (automation),
`SKILLS_IMPORT_PLAN.md` (how the real skills were loaded).

**This folder = the SaaS / AI console.** The public website is the sibling folder
`gepromed-ai-makers-claude-sleepy-maxwell-otfodc` (see its `DESIGN_HANDOFF.md`).

---

## LATEST SESSION (2026-07-06): real skills loaded + demo data cleanup

Client demo prep. All changes below are LIVE on the shared Supabase DB already
(some done directly via REST), so both apps reflect them now.

**Real skills are in (replaced the 8 demos).** The console reads skills from the
Supabase `skills` table at runtime (`src/lib/skills-data.ts`); no app code changed.
- The 16 real skills live in the sibling `../skills/` folder (Claude Agent Skill
  packages). They were flattened into `skills` table rows by tooling in `scripts/`:
  `skills.config.json` (metadata + run forms) + `build-skills-sql.mjs` (composes each
  RICH `system_prompt` from the skill's portable instructions + inlined references,
  strips memory/upload/script mechanics, adds a single-pass runtime footer) →
  `db/skills_real.sql`.
- **`db/skills_real.sql` is gitignored** (contains proprietary prompts; the console
  repo is PUBLIC). Regenerate with `node scripts/build-skills-sql.mjs`; run the SQL by
  hand in the Supabase SQL editor. To change a skill: edit `skills.config.json` or the
  `skills/` folder, regenerate, re-run the SQL (idempotent upsert).
- DB state: **16 skills, all `status='Live'`**, categories 7 Communication / 3 Training
  & Enablement / 2 Regulatory / 2 Clinical / 2 Operations. `scripts/` + plan were pushed
  to the console repo; the SQL was not.

**Demo data cleaned (shared DB, via service_role REST):**
- Leads reduced to **4 clean ones** (Élodie Bernard confirmed, Marco Rossi deposit_paid
  on abord-vasculaire; Liam Schneider contract_signed, Sofia Marin deposit_paid on
  endovasculaire). The other 10 (test junk) deleted; children cascade.
- Courses freed from "full": `enrolled` is a stored column set only by the
  `bump_enrolled` trigger on lead stage-change (NOT on insert/delete), so it was set
  directly: abord 6/16, phaco-2026-01 4/12, phaco-2026-11 5/12, endov 8/14, all `open`.
- Register flow re-verified end to end (create_lead RPC via anon → lead row).

**Pre-demo KNOWN NOT-WORKING (by design or deferred):** website contact form is
visual-only (no send); n8n emails not wired in this env (`/api/health` n8n/gmail false);
live training titles still have em dashes (backend-owned, deferred); the Stats skill
can't run its real Python compute (LLM-estimates from pasted data). Skills live-run was
not click-tested (needs login) — `anthropic:true`, should work; test 1-2 before a demo.

**Website fix same day:** training cards briefly showed a false "Complet" from the stale
seed fallback; fixed by aligning the seed to live in the website repo (pushed).

---

## Architecture (locked)
Two Next.js apps, ONE shared Supabase, n8n for email automation.
- **Console (this folder):** Next 15, staff-only, runs on **:3000**. Own HMAC cookie auth (3 roles). Uses the Supabase **service_role** (`sb_secret_…`) server-side + `ANTHROPIC_API_KEY`.
- **Website (sibling):** Next 14, public, runs on **:3001**. Uses the Supabase **anon** (`sb_publishable_…`) key only.
- **Supabase project:** `aablleekwyjqdxsscyeo` (keys in each app's gitignored `.env.local`). The MCP cannot see this project, so all DB changes are hand-run SQL files in `db/` (see "Migrations").

## Run it
```
# console
cd gepromed-os-ai-makers-gepromed-os && npm run dev        # :3000
# website
cd ../gepromed-ai-makers-claude-sleepy-maxwell-otfodc && npm run dev   # :3001
```
Login (console): `admin@aimakers.ai / aimakers-demo` (admin) · `demo@gepromed.com / gepromed-demo` · `manager@gepromed.com / gepromed-manager`.
> Windows dev-server gotcha: kill ALL project `node` processes before restarting, and don't `rm -rf .next` on a running server (causes `_next/static` 404s). Ports: console 3000, website 3001.

---

## What's built in the console (DONE + verified)

### Auth & roles (`src/lib/auth.ts`, `src/middleware.ts`)
HMAC-signed cookie, roles `admin | gepromed | manager`. Kept from the original app (not Supabase Auth). Admin = AI Makers (skill authoring + contract templates + lead delete). Gepromed/manager = operational.

### Skills catalog (`/skills`) — DB-backed, live Claude
- Reads skills from the `skills` table (`src/lib/skills-data.ts`, seeded from `db/skills.sql`).
- Run seam: `src/app/(app)/skills/[id]/actions.ts` calls Claude (`src/lib/claude.ts`, model `claude-sonnet-5`); falls back to the offline `demo()` if no key.
- Output UI (`src/components/SkillRunner.tsx`): resizable/scrollable box, **Export** menu (md/Word/PDF), rich Markdown (`src/components/Markdown.tsx`).
- **"Runs this month" is real** (counts `skill_runs.skill_key`).
- **Admin authoring:** `/skills/new`, `/skills/[id]/edit` (`SkillForm` + `skills/actions.ts`).
- Sample skills are the real Gepromed ones; swap for Maneesh's `.md` zip later.

### Lead management (`/leads`) — the core
- `src/components/LeadBoard.tsx`: **thin clickable rows in a scrollable box** + "X of Y leads" count; **search** + a **Filters button/panel** (Session, Interest, Reminders, Signed document, Accommodation, E-learning) + **stage tabs** with counts.
- **Right-side drawer** per lead: workflow stepper (with timestamps + LMS id), advance action, interest badge (`not_interested` = hard stop), reminders toggle, **Engagement contract** (auto-attached template + View + change dropdown), **Signed document** (upload/view/verify), **chat-style comments** with pinned composer. Admin gets delete.
- Data: `src/lib/leads-data.ts` (service_role, embeds trainings + comments + documents + contract_template; has a graceful fallback), actions in `src/app/(app)/leads/actions.ts`.

### Course management (`/courses`) — staff (not admin-gated)
- CRUD the `trainings` table. `CourseForm`: bilingual FR/EN title/summary/venue, specialty/level/audience, dates/price/deposit/capacity/qualiopi/status, **objectives + supervisors repeaters**, **structured day-by-day program editor**, **cover image upload** (public `course-images` bucket), past-session proof.

### Contract templates (`/contracts`) — admin only
- Upload/manage engagement-contract templates (public `contracts` bucket). One **default** + optional per-course override. DB trigger **auto-attaches** the template when a lead is marked deposit_paid.

### Document signing (manual path) — done
- Staff or the lead (via website `/sign`) upload the signed contract → `documents` row (pending verification) → staff **Verify & confirm** → lead confirmed + mock LMS id.

### Automation (n8n) — built, user wiring in their instance
- `db/phase8_email.sql`: `log_email_once` (idempotency) + `leads_due_reminders` view (respects hard-stop). Verified.
- 4 importable workflows in `n8n/` + `n8n/SETUP.md`: welcome, daily reminders, confirm+LMS, engagement-contract email. Professional bilingual HTML, **no em dashes**, deposit amount, contact footer. Sends from the user's own n8n Gmail credential.
- n8n instance: `othmaneaimakers.app.n8n.cloud`. Triggered by Supabase **Database Webhooks**.

---

## Database (Supabase `aablleekwyjqdxsscyeo`)
**Tables:** trainings, leads, lead_comments, documents, lead_events, email_log, skills, skill_runs, contract_templates.
**Buckets:** `documents` (private, signed docs), `course-images` (public), `contracts` (public, templates).
**RPCs:** `create_lead(jsonb)` (website insert + returns ref), `log_email_once`, `submit_signed_document`. **View:** `leads_due_reminders`.
**Migrations (run in this order) — all applied:** `schema.sql`, `seed_trainings.sql`, `skills.sql`, `seed_leads.sql`, `skill_runs_key.sql`, `create_lead_rpc.sql`, `course_images.sql`, `phase8_email.sql`, `lead_deposit_snapshot.sql`, `contract_templates.sql`, `public_upload.sql`.
**Key auth fact:** the `apikey` header alone (= service_role secret) gives full server access; anon can only insert leads (RLS) + read trainings + upload to `documents/uploads/` + call the 3 grant-ed RPCs.

## Conventions
- **No em dashes anywhere** (user preference; use commas/colons/parentheses).
- Server-only modules import `"server-only"`; `supabaseServer()` uses the `ws` transport (Node 20 fix).
- Client components get types from `*-shared.ts` files (never from `server-only` modules).

## Pending
- **User side:** finish n8n (delete duplicate WF4, activate, set real phone in email footers, test the 4 emails).
- **For a hosted demo:** deploy both apps to Render; update `NEXT_PUBLIC_CONSOLE_URL` + the engagement email's `localhost:3001/sign` link to the deployed website URL.
- **Optional/later:** website V2 visual polish (Phase 11), pre-course welcome + error-alert n8n workflows, Documenso online signing.
- **Waiting on Maneesh:** real skills `.md` zip, LMS name, confirmed deposit amounts, real phone number.
