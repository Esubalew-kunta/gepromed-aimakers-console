# Gepromed — Console (SaaS) STATUS

Quick catch-up for any new session. For the full, structured picture (env vars,
deployment, database, feature list), see **`ONBOARDING.md`** — that's the doc
kept authoritative going forward. This file is a running "what changed
recently" log; treat entries older than the LATEST SESSION date below as
history, not current state. Companion docs: `PROJECT_LOG.md` (history),
`IMPLEMENTATION_PLAN.md` (the original 11-phase plan), `n8n/SETUP.md`
(automation), `SKILLS_IMPORT_PLAN.md` (how the real skills were loaded).

**This folder = the SaaS / AI console.** The public website is the sibling
repo `gepromed-web`.

---

## LATEST SESSION (2026-07-31): docs refresh to match shipped state

Both apps are live in production on Render, connected to the shared Supabase
project and live Anthropic — not offline demos. `ONBOARDING.md` and `README.md`
were rewritten from the actual code and commit history (not from this file,
which had drifted). The corrections made:

- **Contact form is fully wired**, not visual-only: `gepromed-web`'s contact
  page submits to Supabase (`contact_messages` table) via `createContactMessage()`,
  and shows up in this app's **Contacts** tab, where staff can reply.
- **n8n contact/engineering replies and the Expenses Google Sheet mirror are
  fully built in code.** Whether they actually send/sync in a given deployment
  depends only on whether the matching webhook URL + `N8N_WEBHOOK_SECRET` are
  set as environment variables there — no code work remains. `/api/health`'s
  `n8n`/`gmail: false` means "not configured in this environment," not
  "not built."
- **Trainees, Engineering, Contacts, Automations, Expenses, Integrations,
  Roadmap, Inputs, Training** are all real, shipped sidebar sections (14
  total) — this file previously only described Leads/Courses/Skills/Contracts.
- LMS handoff is still a deliberate mock (unchanged): it builds the exact
  payload that would be sent but does not call a real LMS API.
- The Stats skill still can't run its real Python compute (LLM-estimates from
  pasted data) — unchanged.

See `ONBOARDING.md` §7 for the full, current feature breakdown.

---

## Architecture (locked)
Two Next.js apps, ONE shared Supabase, n8n for email automation.
- **Console (this folder):** Next 15, staff-only, runs on **:3000** locally. Own HMAC cookie auth (3 roles). Uses the Supabase **service_role** (`sb_secret_…`) server-side + `ANTHROPIC_API_KEY`.
- **Website (sibling `gepromed-web`):** Next 14, public, runs on **:3001** locally. Uses the Supabase **anon** (`sb_publishable_…`) key only.
- **Supabase project:** `hdvqiiprylrrzrkydtpa` (keys live in each app's gitignored `.env.local`, confirmed to match what's configured on Render). Some older docs/SQL comments in this repo still reference a previous project id, `aablleekwyjqdxsscyeo` — that one is no longer live, ignore it. All DB changes are hand-run SQL files in `db/` (see "Migrations").

## Run it
```
# console
cd gepromed-ai-console && npm run dev        # :3000
# website
cd ../gepromed-web && npm run dev            # :3001
```
Login (console): `admin@aimakers.ai / aimakers-demo` (admin) · `demo@gepromed.com / gepromed-demo` · `manager@gepromed.com / gepromed-manager`.
> Windows dev-server gotcha: kill ALL project `node` processes before restarting, and don't `rm -rf .next` on a running server (causes `_next/static` 404s). Ports: console 3000, website 3001.

---

## What's built in the console

See `ONBOARDING.md` §7 for the current, complete list (Dashboard, Trainees,
Courses, Engineering, Contacts, Contract templates, Skills catalog,
Automations, Expenses, Integrations, Roadmap, Inputs, Training, Feedback, LMS
handoff, document signing). Key facts worth keeping here:

### Auth & roles (`src/lib/auth.ts`, `src/middleware.ts`)
HMAC-signed cookie, roles `admin | gepromed | manager`. Kept from the original app (not Supabase Auth). Admin = AI Makers (skill authoring + contract templates + lead delete). Gepromed/manager = operational.

### Skills catalog (`/skills`) — DB-backed, live Claude
- Reads skills from the `skills` table (`src/lib/skills-data.ts`).
- Run seam: `src/app/(app)/skills/[id]/actions.ts` calls Claude (`src/lib/claude.ts`, model `claude-sonnet-5`); falls back to the offline `demo()` if no key.
- 16 real Gepromed skills, all `status='Live'`. `db/skills_real.sql` is gitignored (proprietary prompts, repo is public) — regenerate with `node scripts/build-skills-sql.mjs`, run by hand in the Supabase SQL editor.

### Automation (n8n)
- `db/phase8_email.sql`: `log_email_once` (idempotency) + `leads_due_reminders` view (respects hard-stop).
- Workflows in `n8n/` + `n8n/SETUP.md`: welcome, daily reminders, confirm+LMS, engagement-contract email, plus Contacts/Engineering reply-sending wired from this app's action code.
- n8n instance: `othmaneaimakers.app.n8n.cloud`. Triggered by Supabase **Database Webhooks** and, for replies, by direct webhook calls from the console.

---

## Database (Supabase `aablleekwyjqdxsscyeo`)
**Tables:** trainings, leads, lead_comments, documents, lead_events, email_log, skills, skill_runs, contract_templates, contact_messages, contact_replies (see `ONBOARDING.md` §4 for the fuller, current list and migration order).
**Buckets:** `documents` (private, signed docs), `course-images` (public), `contracts` (public, templates).
**RPCs:** `create_lead(jsonb)` (website insert + returns ref), `log_email_once`, `submit_signed_document`, `create_contact_message`. **View:** `leads_due_reminders`.
**Key auth fact:** the `apikey` header alone (= service_role secret) gives full server access; anon can only insert leads (RLS) + read trainings + upload to `documents/uploads/` + call the granted RPCs.

## Conventions
- **No em dashes anywhere** (user preference; use commas/colons/parentheses).
- Server-only modules import `"server-only"`; `supabaseServer()` uses the `ws` transport (Node 20 fix).
- Client components get types from `*-shared.ts` files (never from `server-only` modules).
- Browser auto-translate is deliberately disabled (crash guard) — see `ONBOARDING.md` §7 if you hit a `removeChild`/`insertBefore` React error.

## Pending / open questions
- Real LMS integration (currently mock only) — waiting on a real LMS name/API.
- Confirm whether n8n webhook env vars (`CONTACT_EMAIL_WEBHOOK_URL`,
  `ENG_EMAIL_WEBHOOK_URL`, `EXPENSE_SHEET_*`, `N8N_WEBHOOK_SECRET`) are set in
  the live Render environment — the reply/mirror code is ready either way.
- Stats skill still can't run its real Python compute.
