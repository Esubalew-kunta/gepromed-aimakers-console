# Gepromed AI Console

The internal staff console for Gepromed: lead/trainee management, course
management, an engineering-request pipeline, contact-message handling, a Claude-
powered skills catalog, contract templates, and expense processing with a Google
Sheets mirror.

For the full picture (env vars, database, deployment, and a section-by-section
feature rundown), see **`ONBOARDING.md`** — that file is kept current; this
README is a quick-start summary only.

## Current state

This app is deployed on **Render** from the `main` branch of
`https://github.com/Esubalew-kunta/gepromed-aimakers-console`, connected to a
**live Supabase database** (shared with the `gepromed-web` sibling app) and
**live Anthropic (Claude)** for skill runs. It is not an offline/mock demo.

Live URL: `https://gepromed-ai-console.onrender.com`

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Anthropic values to run against live data
npm run dev                  # http://localhost:3000
```

Production-style local run: `npm run build && npm run start`.

Demo logins:
- `admin@aimakers.ai` / `aimakers-demo` (admin)
- `demo@gepromed.com` / `gepromed-demo` (gepromed user)
- `manager@gepromed.com` / `gepromed-manager` (manager)

## What's built

Sidebar sections: Dashboard, Trainees, Courses, Engineering, Contacts,
Contracts, Skills, Automations, Expenses, Integrations, Roadmap, Inputs,
Training, Feedback.

- **Trainees** — the lead pipeline: stage tracking, contracts, document
  upload/verification, comments, and email replies.
- **Engineering** — a separate pipeline for engineering/testing requests
  submitted from the public website.
- **Contacts** — every message submitted through the public website's contact
  form lands here; staff can read, reply (sent via an n8n webhook), and manage
  it.
- **Skills** — 16 real Gepromed skills that run against Claude and return a
  structured, exportable result.
- **Expenses** — admin key management for the AI providers used in receipt
  extraction, batch commit/clear of processed expense files, and a "download the
  live Google Sheet" button backed by an n8n webhook.
- **LMS handoff** — still a deliberate mock: it builds the exact payload that
  would be sent to an LMS but does not call a real LMS API.

See `ONBOARDING.md` for the full breakdown, including which features depend on
environment variables being set, database details, and how this app relates to
`gepromed-web`.

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS
- HMAC-signed cookie auth (own session system, not Supabase Auth)
- Supabase (shared project with `gepromed-web`) — schema managed as hand-run SQL
  files in `db/`, no migration tool
- Anthropic (Claude) for skill runs
- n8n for contact/engineering email replies and the expenses Google Sheet mirror

## Project layout

```
src/
  app/
    (app)/            # authenticated pages (dashboard, trainees, courses, engineering, contacts, skills, expenses, ...)
    api/health/       # Render health check
    login/  logout/   # credential login + sign-out
  components/         # UI (Sidebar, LeadBoard, SkillRunner, ContactsList, ...)
  lib/
    auth.ts           # signed-cookie sessions + demo users (env-driven)
    claude.ts         # Anthropic client for skill runs
db/                   # hand-run SQL migrations (see ONBOARDING.md for order)
n8n/                  # exported n8n workflows + SETUP.md
render.yaml           # Render Blueprint
.env.example          # documented env vars
```
