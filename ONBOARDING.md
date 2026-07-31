# Gepromed AI Console — Onboarding

This document describes how this app is currently set up and running, based on
the actual code and commit history. `README.md` and `STATUS.md` are both out of
date by several weeks and describe some features as unfinished that are
actually shipped and working (for example, `README.md` still says the app
"calls no external APIs," and `STATUS.md` describes the contact-reply and
Contacts features as not wired up — both are now live). Where this document
disagrees with either of those files, trust this document.

## 1. Repository & branch

- GitHub repository: `https://github.com/Esubalew-kunta/gepromed-aimakers-console`
- Branch used for deployment: `main`
- Every push to `main` triggers a new deployment on Render.
- Note: the README mentions a different, older repository
  (`ManeeshBehera/gepromed-os-ai-makers`, branch `gepromed-os`). That is not where
  the app is deployed from today. The current source is the repository above.

## 2. Deployment (Render)

- Render service name: `gepromed-ai-console`
- Plan: Free
- Live URL: `https://gepromed-ai-console.onrender.com`
- Deployment method: Render Blueprint, defined in this repo's `render.yaml`
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Render checks the app is healthy by calling `/api/health`
- Auto-deploy is turned on: pushing to `main` redeploys automatically
- On the free plan, the service goes to sleep after about 15 minutes without
  traffic. The next request after that wakes it up, which takes 30-60 seconds.
- Variables starting with `NEXT_PUBLIC_` are baked into the app at build time.
  Changing one in Render requires "Manual Deploy → Clear build cache & deploy" —
  a normal redeploy will not pick up the new value.

## 3. Environment variables

These are set in the Render dashboard, under the service's Environment tab. They
are never committed to the repository. For local development, the same variable
names go into a `.env.local` file (also not committed). The full list of variable
names with explanations is in `.env.example`.

**Local and Render use the same values for almost every variable** — the only
ones that differ are the handful of URL variables that naturally point to
`localhost:3000` locally and to the deployed Render URL in production
(`NEXTAUTH_URL`, `APP_BASE_URL`, and in `gepromed-web`,
`NEXT_PUBLIC_CONSOLE_URL` / `NEXT_PUBLIC_PROGRAM_API_URL`). Everything else
(Supabase keys, Anthropic/OpenAI keys, n8n webhook URLs, demo logins) is
identical between local and production.

**Login / session**
| Variable | What it's for |
|---|---|
| `NEXTAUTH_SECRET` | Signs the session cookie. Render generates this automatically. |
| `NEXTAUTH_URL` | Public URL of the deployment — `http://localhost:3000` locally, `https://gepromed-ai-console.onrender.com` on Render. |
| `APP_BASE_URL` | Base URL used for links and health checks — same local-vs-Render pattern as `NEXTAUTH_URL`. |

**Demo login accounts** (set directly in `render.yaml`):
`DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `DEMO_GEPROMED_EMAIL`,
`DEMO_GEPROMED_PASSWORD`, `DEMO_MANAGER_EMAIL`, `DEMO_MANAGER_PASSWORD`.
These accounts and their passwords are visible in the repo and on the login
screen — this is how the app is currently configured to work.

**Supabase** (the database, shared with `gepromed-web`):

The current, live Supabase project is `hdvqiiprylrrzrkydtpa`
(`https://hdvqiiprylrrzrkydtpa.supabase.co`) — confirmed to match what's
configured on Render, so local (`.env.local`) and production are in sync. Note:
several older docs in this repo (`STATUS.md`, `PROJECT_LOG.md`, some SQL file
comments, `n8n/SETUP.md`, the top-level `../DEPLOYMENT.md`) still reference a
previous project id, `aablleekwyjqdxsscyeo` — that one is no longer the live
project; ignore it where you see it.

| Variable | What it's for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Address of the Supabase project. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key, limited permissions. |
| `SUPABASE_SERVICE_ROLE_KEY` | Full-access key. Used only on the server, never sent to the browser. |
| `DATABASE_URL` | Direct Postgres connection string (via Supabase's session pooler, which is IPv4-reachable, unlike the direct `db.<ref>.supabase.co` host which is IPv6-only). Used for running SQL migrations by hand with `psql` — **not unused**, despite `/api/health` showing `database:false` when this or the DB it points to isn't reachable from the health-check context. Server-only. |

**AI**
| Variable | What it's for |
|---|---|
| `ANTHROPIC_API_KEY` | Lets the app call Claude. |
| `ANTHROPIC_MODEL` | Model used for expense-notes receipt extraction specifically (currently set to an Opus model locally, for maximum extraction accuracy) — this is not the same model the Skills catalog runs use, which are set directly in code (`src/lib/claude.ts`). Confirm the current skills model in that file rather than assuming it matches `ANTHROPIC_MODEL`. |
| `OPENAI_API_KEY` | Present in dependencies; Anthropic is the primary path for skill runs. |

**Currency conversion** (used by expense-notes processing):
| Variable | What it's for |
|---|---|
| `FX_FALLBACK_PROVIDER` | Fallback FX-rate provider. Primary lookup is ECB/Frankfurter (free, no key needed); this fallback (currently CurrencyBeacon) is used for currencies ECB doesn't cover (e.g. AED). |
| `FX_FALLBACK_API_KEY` | API key for the fallback FX provider above. |

**n8n webhooks** (n8n is the automation tool the app talks to, instance
`othmaneaimakers.app.n8n.cloud`):
`EXPENSE_SHEET_WEBHOOK_URL`, `EXPENSE_SHEET_EXPORT_URL`, `EXPENSE_SHEET_CLEAR_URL`,
`ENG_EMAIL_WEBHOOK_URL`, `CONTACT_EMAIL_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`.
Locally, all of these are set to real `othmaneaimakers.app.n8n.cloud` webhook
URLs — confirm the same are set in the Render dashboard if you want these
features (contact/engineering email replies, the expenses Sheet mirror) to work
in the deployed environment too.

**Other variables present, not currently wired to a live feature:**
`GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `LMS_API_URL`, `LMS_API_KEY`, `ENG_INTERNAL_EMAIL_MODE`,
`ENG_INTERNAL_EMAIL_TEST_RECIPIENT`.

**Present locally but not in `.env.example`** (confirm with whoever added these
whether `.env.example` should be updated to include them): `NEXT_PUBLIC_PROGRAM_API_URL`
(points the "download program PDF" flow at this app's own deployment — same
purpose as in `gepromed-web`), and `FRONEND_URL` — this looks like a typo for
`FRONTEND_URL`; worth confirming with whoever added it before treating it as
intentional.

## 4. Database (Supabase)

Shared with `gepromed-web`. Project: `hdvqiiprylrrzrkydtpa` (see §3 above —
ignore the older `aablleekwyjqdxsscyeo` id still referenced in some older
docs). There is no Supabase CLI
or migration tool in use: the schema is built from plain SQL files in `db/`
(currently 26+ files), each run by hand in the Supabase SQL editor. This
section is built directly from those files, not from `STATUS.md`/`PROJECT_LOG.md`,
which only describe an earlier subset.

⚠️ `db/all.sql` is **not** a rollup of everything — despite the name, it's only
a fresh-project bootstrap of the first 5 files (`schema.sql`,
`seed_trainings.sql`, `skills.sql`, `seed_leads.sql`, `skill_runs_key.sql`).
None of the phase8-phase11, trainee/engineering, contacts, expenses, or
sponsors migrations are in it. Do not run `all.sql` against an existing
database expecting it to catch you up — check `db/` file-by-file instead.

### Tables
| Table | What it stores |
|---|---|
| `trainings` | Course/session catalog. Bilingual (FR/EN) title/summary/venue/objectives/program/supervisors. `status` (open/full) is set automatically by a trigger from `capacity`/`enrolled`. Also holds sponsor info (`is_sponsored`, `sponsors` jsonb) and a default contract template link. |
| `leads` (shown in the UI as **Trainees**) | The core registrant/pipeline record. Linked to a training. `parcours` (`helpmesee` or `bootcamp`) picks which stage set applies — each parcours has its own sequence of stages (e.g. bootcamp: prerequisites → pre-registration → deposit/contract → practical info → e-learning sent → confirmed → done). Also holds funding/sponsor fields, per-stage timestamps, and a `cancelled_at` flag. |
| `lead_comments` | Staff notes/comment thread on a lead. |
| `documents` | Uploaded files (signed contracts, and payment-receipt screenshots) linked to a lead. |
| `lead_events` | Generic audit log per lead. |
| `email_log` | Records of sent emails, used to prevent duplicate sends. |
| `skills` | The AI skill definitions shown in the Skills catalog. |
| `skill_runs` | History of every skill run. |
| `engineering_requests` | The Engineering pipeline's equivalent of `leads` — one table covering all 3 request types (explant analysis, testing platform, equipment rental), distinguished by a `kind` column, each with its own stage sequence. |
| `engineering_comments` | Staff comment thread on an engineering request (mirrors `lead_comments`). |
| `contact_messages` | Every submission from the public website's contact form. |
| `contact_replies` | Full history of staff replies to a contact message (not just the latest one). |
| `ai_provider_settings` | Single-row table holding the admin-editable Anthropic/OpenAI keys used for expense receipt extraction (the Expenses page's key-rotation UI writes here). |
| `expense_runs` | One row per expense-processing run (status, totals, summary). |
| `expense_receipts` | One row per processed receipt line within a run, including the FX conversion used. |
| `fx_rate_cache` | Cached currency-conversion rates, so the same rate isn't looked up repeatedly. |
| `contract_templates` | The library of blank engagement-contract templates (one marked default, others per-course). |
| `sponsors` | Reusable list of sponsors (name, logo, website) that a training can be linked to. |
| `notification_templates` | One editable row per automated email (subject/body/merge fields), covering both the Trainees and Engineering pipelines. |

### View
- `leads_due_reminders` — leads still active in the pipeline that are due a reminder today. Read by n8n via the service_role key, not exposed to the public/anon key.

### Functions — callable from the public website (via Supabase RPC, anon key)
- `create_lead(payload)` — the website's registration form uses this to create a lead.
- `submit_signed_document(ref, path, kind)` — lets a registrant (or staff) attach an uploaded file (`kind`: contract or payment_receipt) to a lead by its reference code, and can advance the lead's stage once a contract is uploaded.
- `create_engineering_request(payload)` — the website's engineering-request forms use this.
- `create_contact_message(payload)` — the website's contact form uses this.

### Functions — internal (service_role / trigger-only, not called directly by the website)
- `notify_for_stage` / `notify_reminder` / `render_notification` / `wrap_email_html` — the pipeline that turns a lead/engineering-request stage change into an actual email: picks the right `notification_templates` row, merges in the lead's data, wraps it in the branded HTML shell, and returns what should be sent (n8n then does the actual sending, gated by the webhook env vars in §3).
- `log_email_once` — prevents the same automated email being sent twice.
- A handful of trigger functions handle bookkeeping automatically: assigning human-readable reference codes (`REG-000123`, `ENG-000001`, `MSG-000001`) on insert, keeping `trainings.enrolled`/`status` in sync as leads move through the pipeline, bumping `updated_at`, and auto-attaching the right contract template when a lead reaches the relevant stage.

### Storage buckets
| Bucket | Public? | What it's for |
|---|---|---|
| `documents` | Private | Signed contracts and payment-receipt uploads. |
| `contracts` | Public | Blank contract templates and per-lead attached contracts (public so a link in an email can be opened directly). |
| `course-images` | Public | Training cover images. |
| `sponsor-logos` | Public | Sponsor logo images shown on the public website. |
| `expense-files` | Private | Receipt files and the persisted expense workbook. |
| `brand` | Public | Holds the logo used in outgoing emails. ⚠️ No file in `db/` actually creates this bucket — it must have been created manually in the Supabase dashboard at some point. Worth confirming it still exists if email templates ever start showing a missing logo. |

### Access model
This app uses the full-access `service_role` key on the server. `gepromed-web`
uses the limited `anon` key, which can only: insert leads, engineering
requests, and contact messages; read trainings; upload to
`documents/uploads/`; and call the four RPCs listed above.

### A few migration-file conventions worth knowing
- Most files after `schema.sql` are written to be safely re-run (`create table
  if not exists`, `drop ... if exists` + recreate, `on conflict do nothing`) —
  this is a deliberate house convention, not an accident.
- Numbered "phase" files (`phase8_email.sql` → `phase9` → `phase10` →
  `phase11`) build on each other in order — each one redefines the same
  notification functions on top of the previous phase's version, so they must
  be run in numeric order.
- `db/notification_render.sql` explicitly warns in its own header that it can
  drift from what's actually live in Supabase if a change is applied directly
  in the SQL editor without also updating this file — treat it as "should
  match prod," not as a guaranteed source of truth.
- `db/skills_real.sql` is not committed to the repository (it contains the
  actual skill instructions/prompts, and this repo is public). To regenerate
  it: update `skills.config.json` or the files in the sibling `../skills/`
  folder, run `node scripts/build-skills-sql.mjs`, then run the resulting SQL
  by hand in the Supabase SQL editor.

## 5. External services

- **Anthropic (Claude)** — runs the AI skills in the Skills catalog.
- **n8n** — instance at `othmaneaimakers.app.n8n.cloud`. The workflow files this
  app connects to are in the `n8n/` folder (`01-new-lead-welcome.json`,
  `02-daily-reminder-sweep.json`, `03-confirm-lms-handoff.json`,
  `04-engagement-contract.json`, and three more numbered 10-12). Setup steps for
  these are in `n8n/SETUP.md`. The code paths that call these webhooks (contact
  replies, engineering replies, the expenses Google Sheet mirror) are fully
  built — see §7 — and work as soon as the matching webhook URL and
  `N8N_WEBHOOK_SECRET` are set as environment variables in a given deployment.
- **LMS** — the app currently talks to a mock/placeholder LMS, not a real one.

## 6. Run locally

```bash
npm install
cp .env.example .env.local   # add Supabase and Anthropic values to run against live data
npm run dev                  # http://localhost:3000
```

To run it the same way it runs in production: `npm run build && npm run start`.

Demo logins:
- `admin@aimakers.ai` / `aimakers-demo` (admin)
- `demo@gepromed.com` / `gepromed-demo` (gepromed user)
- `manager@gepromed.com` / `gepromed-manager` (manager)

Windows note: stop all running `node` processes for this project before starting
the dev server again, and don't delete the `.next` folder while the server is
running (it causes `404` errors on static files). This app runs on port `3000`;
the `gepromed-web` app runs on port `3001` when both are running at the same time.

## 7. Features built — what the app actually does

This section is based on the current code and commit history, not on the older
planning documents (`STATUS.md`, `README.md`), which are about three weeks out of
date and describe some features as unfinished that are actually done. The
sidebar has 14 sections. Three roles can log in: `admin` (AI Makers staff),
`gepromed`, and `manager` (Gepromed staff, operational).

- **Dashboard** — metrics, popular skills, activity feed, and the current user's
  own recent skill runs.
- **Trainees** (`/trainees`) — the core of the app: a searchable, filterable list
  of leads (people interested in a training), with a summary view and a courses
  view, stats, stage tabs (lead, deposit paid, contract signed, confirmed), and a
  cancel action. Clicking a lead opens a side panel with: a timeline, a button to
  move it to the next stage, an "interest" flag (marking someone as not
  interested stops the process), a reminders toggle, the engagement contract
  attached to that lead (swappable template), document upload/verification (both
  a signed contract and, where relevant, a payment-receipt screenshot), and a
  comment thread with a "send email" composer (see Automation below). Admins can
  delete leads and export the list.
- **Courses** (`/courses`) — staff create and edit trainings: bilingual
  title/summary/venue, specialty/level/audience, dates, price, deposit, capacity,
  objectives, supervisors, a day-by-day program, sponsor logos, and a cover
  image. A real, downloadable Qualiopi program PDF is generated from this data
  (built with `pdfkit`) — this is the same PDF the public website's "download
  the program" button fetches.
- **Engineering** (`/engineering`) — a staff pipeline, separate from Trainees,
  for handling engineering/testing requests (explant analysis, testing platform,
  equipment rental enquiries submitted from the public website). Has its own
  stage flow (advance/skip/reopen with an exit reason), a comment thread, and a
  "send email" composer, the same pattern as Trainees.
- **Contacts** (`/contacts`) — every submission from the public website's
  contact form lands here (see the `gepromed-web` doc — this is fully wired, not
  visual-only). Staff can view, mark read, delete, and reply. Replying sends a
  real email through an n8n webhook (see Automation below) and keeps a full
  reply history per message, not just the latest one.
- **Contract templates** (`/contracts`, admin only) — upload and manage the
  contract templates used for engagement contracts. One is marked default;
  individual courses can override it. When a lead's stage changes to "deposit
  paid," the matching template is attached automatically.
- **Skills catalog** (`/skills`) — 16 real Gepromed skills (regulatory, clinical,
  quality, funding, communication, training) stored in Supabase. Staff open a
  skill, fill in the inputs, and run it — the run actually calls Claude and
  returns a structured result, which can be exported as Markdown/Word/PDF. The
  "runs this month" count on the dashboard is a real count from the database.
  Admins can also create and edit skills (`/skills/new`, `/skills/[id]/edit`).
- **Automations** (`/automations`) — automation status/controls for the n8n
  workflows this app talks to (see §5 for which ones exist).
- **Expenses** (`/expenses`, admin-gated parts) — three parts: (1) an admin-only
  card to paste/rotate the Anthropic and OpenAI API keys used for receipt
  extraction, stored in Supabase so a key can be rotated without a redeploy;
  (2) a batch upload/commit/clear flow for processed expense files, where a bad
  file is rejected individually instead of failing the whole batch;
  (3) a "download the live Google Sheet as Excel" button, which reads the actual
  Sheet through an n8n webhook (see §5) — the Sheet, not the app's local Excel
  file, is treated as the source of truth once the Sheet mirror is enabled.
- **Integrations** (`/integrations`) — an overview page showing which
  integrations (Anthropic, n8n, LMS, etc.) are currently active in this
  environment.
- **Roadmap, Inputs, Training** — supporting/reference pages (planned items,
  data-source inventory and access matrix, enablement modules).
- **Feedback** — staff can submit feedback from within the app; it's stored for
  the session, not saved permanently to the database.
- **Document signing** — either staff (Trainees panel) or the lead themselves
  (through a link on the public website's `/sign` page) can upload a signed
  contract. A staff member then verifies it, which moves the lead to "confirmed"
  and generates a placeholder LMS id (see LMS below).
- **LMS handoff** (`/lms`) — this is a deliberate demo/mock flow: the app builds
  the exact payload that would be sent to an LMS and returns a mock course id,
  but it does not call a real LMS API. This has not changed recently — there is
  no real LMS connected yet.

### Automation (n8n) — what's real vs. what depends on configuration

The Contacts and Engineering "send email" composers, and the Expenses Google
Sheet mirror, are fully implemented in code and call real n8n webhooks. Whether
sending/mirroring actually happens in a given deployment depends only on
whether the corresponding webhook URL and secret are set as environment
variables there (`CONTACT_EMAIL_WEBHOOK_URL`, `ENG_EMAIL_WEBHOOK_URL`,
`EXPENSE_SHEET_EXPORT_URL` / `_WEBHOOK_URL` / `_CLEAR_URL`, and
`N8N_WEBHOOK_SECRET`) — no code changes are needed once those are set. The
`/api/health` endpoint's `n8n`/`gmail` fields simply reflect whether
`N8N_WEBHOOK_SECRET` / `GMAIL_CLIENT_ID` are set in that environment; `false`
there means "not configured in this environment," not "not built."

### A real gotcha worth knowing

Browser auto-translate (e.g. Chrome's "Translate this page") is deliberately
disabled in this app, with a crash guard that allows it only for client demos.
This is intentional — without it, auto-translate causes React crashes
(`removeChild`/`insertBefore` errors) in the console UI. If you see those
errors, check whether auto-translate is on before assuming it's a new bug.

## 8. Architecture

- Two separate Next.js apps, one shared Supabase database, n8n handling email
  automation.
- This app (console): Next.js 15, used by staff only, has its own login system
  (cookie-based, not Supabase Auth), three roles: `admin`, `gepromed`, `manager`.
  Uses the full-access Supabase key on the server.
- `gepromed-web`: Next.js 14, public-facing, uses the limited Supabase key only.
- There is no automated testing or CI pipeline connected to this repository yet;
  `npm run lint` is run manually.
- Text convention: no em dashes anywhere in the app's copy or UI text (this was a
  specific client request) — commas, colons, or parentheses are used instead.

## 8. Other documents in this repo

- `STATUS.md` — the most recent notes on what has changed and what state things
  are in. Read this first if you want the latest picture.
- `PROJECT_LOG.md` — a running history of the project across sessions.
- `IMPLEMENTATION_PLAN.md` — the original build plan, including the database
  schema.
- `n8n/SETUP.md` and `n8n/PHASE3_EMAIL_JOURNEY.md` — details on the automation
  setup.
- `SKILLS_IMPORT_PLAN.md` — how the current set of skills was loaded into the
  database.
- `../DEPLOYMENT.md` (one folder up) — a short deployment summary covering both
  this app and `gepromed-web` together.
- Other files (`TRAINEE_*`, `EXPENSE_NOTES_FEATURE.md`, etc.) are feature-specific
  planning notes, not required reading to get started.
