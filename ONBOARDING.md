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

**Login / session**
| Variable | What it's for |
|---|---|
| `NEXTAUTH_SECRET` | Signs the session cookie. Render generates this automatically. |
| `NEXTAUTH_URL` | Public URL of the deployment. |
| `APP_BASE_URL` | Base URL used for links and health checks. |

**Demo login accounts** (set directly in `render.yaml`):
`DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `DEMO_GEPROMED_EMAIL`,
`DEMO_GEPROMED_PASSWORD`, `DEMO_MANAGER_EMAIL`, `DEMO_MANAGER_PASSWORD`.
These accounts and their passwords are visible in the repo and on the login
screen — this is how the app is currently configured to work.

**Supabase** (the database, shared with `gepromed-web`, project id
`aablleekwyjqdxsscyeo`):
| Variable | What it's for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Address of the Supabase project. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key, limited permissions. |
| `SUPABASE_SERVICE_ROLE_KEY` | Full-access key. Used only on the server, never sent to the browser. |

**AI**
| Variable | What it's for |
|---|---|
| `ANTHROPIC_API_KEY` | Lets the app run skills using Claude. Model used is set by `ANTHROPIC_MODEL`. |
| `OPENAI_API_KEY` | Present but not the one currently used for live runs. |

**n8n webhooks** (n8n is the automation tool the app talks to, instance
`othmaneaimakers.app.n8n.cloud`):
`EXPENSE_SHEET_WEBHOOK_URL`, `EXPENSE_SHEET_EXPORT_URL`, `EXPENSE_SHEET_CLEAR_URL`,
`ENG_EMAIL_WEBHOOK_URL`, `CONTACT_EMAIL_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`.

**Other variables present but not currently active:** `DATABASE_URL` (the
`/api/health` page shows `database:false` because of this — that line does not
mean Supabase is down, it just means this separate, unused variable is empty),
`GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `LMS_API_URL`, `LMS_API_KEY`, `ENG_INTERNAL_EMAIL_MODE`,
`ENG_INTERNAL_EMAIL_TEST_RECIPIENT`.

## 4. Database (Supabase)

- Project id: `aablleekwyjqdxsscyeo`. This same project is shared with
  `gepromed-web`.
- There is no Supabase CLI or migration tool in use. The database schema is built
  from plain SQL files kept in the `db/` folder, run by hand in the Supabase SQL
  editor.
- SQL files applied so far, in order: `schema.sql`, `seed_trainings.sql`,
  `skills.sql`, `seed_leads.sql`, `skill_runs_key.sql`, `create_lead_rpc.sql`,
  `course_images.sql`, `phase8_email.sql`, `lead_deposit_snapshot.sql`,
  `contract_templates.sql`, `public_upload.sql`. There are additional, more recent
  files in the same folder (for example `phase9`, `phase10`, `phase11`,
  `security_hardening.sql`) — `STATUS.md` and `PROJECT_LOG.md` have the latest
  record of what has been run.
- Tables: `trainings`, `leads`, `lead_comments`, `documents`, `lead_events`,
  `email_log`, `skills`, `skill_runs`, `contract_templates`.
- Storage buckets: `documents` (private, signed contracts), `course-images`
  (public), `contracts` (public, contract templates).
- Database functions (RPCs): `create_lead` (used by the website), `log_email_once`,
  `submit_signed_document`. There is also a view called `leads_due_reminders`.
- Access: this app uses the full-access `service_role` key on the server.
  `gepromed-web` uses the limited `anon` key, which can only insert leads, read
  trainings, upload signed documents, and call the three functions above.
- `db/skills_real.sql` is not committed to the repository (it contains the actual
  skill instructions/prompts, and this repo is public). To regenerate it: update
  `skills.config.json` or the files in the sibling `../skills/` folder, run
  `node scripts/build-skills-sql.mjs`, then run the resulting SQL by hand in the
  Supabase SQL editor.

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
