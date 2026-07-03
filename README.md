# Gepromed AI Console

An **AI Makers × Gepromed** demo console: AI skills, automations, and enablement
for medical-device teams (regulatory, clinical, quality, funding, communication).

This V1 is built to be **deployed to Render from GitHub and demoed from a private
Render URL**. It runs entirely on **seeded, Gepromed-specific demo data** and calls
**no external APIs** — no OpenAI, LMS, Gmail, Google, n8n, or database required.

---

## 🚀 Deploying Gepromed AI Console to Render

This is the **primary, supported path**. Local setup (further below) is optional.

### 1. GitHub repo & branch to select
- **Repository:** `ManeeshBehera/gepromed-os-ai-makers`
- **Branch:** `gepromed-os`

### 2. Render service type
- **Web Service** (Node runtime).
- Or use the included **Blueprint** (`render.yaml`) — *New +* → *Blueprint* →
  connect the repo → Render provisions the service automatically.

### 3. Build command
```bash
npm install && npm run build
```

### 4. Start command
```bash
npm run start
```
The app listens on Render's injected `$PORT` automatically.
Render health checks hit **`/api/health`** (already configured in `render.yaml`).

### 5. Required environment variables
The app **deploys and demos even if these are blank** (safe fallbacks are built in),
but set them for a hardened, branded demo:

| Variable | Purpose | Fallback if blank |
| --- | --- | --- |
| `NEXTAUTH_SECRET` | Signs the session cookie | Built-in demo secret (`render.yaml` auto-generates one) |
| `NEXTAUTH_URL` | Public URL of the deployment | Inferred from request |
| `APP_BASE_URL` | Base URL for links/health | Inferred from request |
| `DEFAULT_ADMIN_EMAIL` | Admin login | `admin@aimakers.ai` |
| `DEFAULT_ADMIN_PASSWORD` | Admin password | `aimakers-demo` |
| `DEMO_GEPROMED_EMAIL` | Gepromed user login | `demo@gepromed.com` |
| `DEMO_GEPROMED_PASSWORD` | Gepromed user password | `gepromed-demo` |
| `DEMO_MANAGER_EMAIL` | Manager login | `manager@gepromed.com` |
| `DEMO_MANAGER_PASSWORD` | Manager password | `gepromed-manager` |

### 6. Optional environment variables (future integrations)
Leave these **blank** to stay in fully-mocked **Demo Mode**. Setting any of them
does **not** break the build or runtime — it only lights up the corresponding
integration later.

```
DATABASE_URL=         OPENAI_API_KEY=       N8N_WEBHOOK_SECRET=
GMAIL_CLIENT_ID=      GMAIL_CLIENT_SECRET=  GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET= LMS_API_URL=          LMS_API_KEY=
```

### 7. Demo credentials
| Role | Email | Password |
| --- | --- | --- |
| Gepromed user | `demo@gepromed.com` | `gepromed-demo` |
| Manager | `manager@gepromed.com` | `gepromed-manager` |
| Admin | `admin@aimakers.ai` | `aimakers-demo` |

> These reflect the **fallback** values. If you set the `DEMO_*` / `DEFAULT_*`
> env vars in Render, use those instead. The login screen also lists the active
> demo accounts and lets you click one to auto-fill.

### 8. First demo checklist
Once the Render URL is live:

1. ✅ Open the Render URL → you're redirected to **/login**.
2. ✅ Check **`/api/health`** → returns `{"status":"healthy","demoMode":true,...}`.
3. ✅ Log in with a demo account (click a credential chip to auto-fill).
4. ✅ **Dashboard** loads with seeded Gepromed metrics and activity.
5. ✅ **Skills catalog** → open *MDR Technical File Gap Analysis* →
   *Fill with sample* → **Run skill** → structured output appears (offline).
6. ✅ **Automations** → *Run now (simulated)* → watch the mock run log stream.
7. ✅ **LMS handoff** → *Generate module* → *Publish to LMS (mock)* → see the payload.
8. ✅ Browse **Integrations, Roadmap, Inputs & access, Training hub, Feedback**.
9. ✅ Submit **Feedback** → it appears instantly (in-memory for the session).

---

## What the demo includes

| Area | What it does (all offline) |
| --- | --- |
| **Dashboard** | Seeded metrics, popular skills, activity feed, your live session runs. |
| **Skills catalog** | 8 Gepromed skills (MDR gap analysis, clinical evidence summary, CAPA drafter, vigilance triage, funding proposal, patient comms, meeting→actions, micro-training). Each runs deterministically **without OpenAI**. |
| **Automations** | 5 mock workflows (complaint intake, PMS digest, literature watch, onboarding, NB deadlines) with animated **simulated run logs** — no n8n. |
| **LMS handoff** | Generate a micro-training and "publish" it to a **mock LMS** (shows the exact payload; nothing is sent). |
| **Integrations** | Honest **Manual / Mock / Planned** statuses; each card shows which env var switches it to live. |
| **Roadmap** | Shipped → In progress → Next → Exploring board. |
| **Inputs & access** | Data-source inventory, role-based access matrix, demo accounts, data-handling posture. |
| **Training hub** | Seeded enablement modules. |
| **Feedback** | Submit feedback; stored in memory for the session. |

### Demo Mode
When no optional API keys are set, a banner confirms **Demo Mode** and every AI
result, automation, and integration is simulated locally. This is by design so the
console is fully demoable straight from a Render URL with zero credentials.

### Data persistence
Skill-run history and feedback live **in memory** and **reset on redeploy/restart**
(Option A — no database needed). To persist later, attach a **Render PostgreSQL**,
set `DATABASE_URL`, and back the functions in `src/lib/store.ts` — the call sites
stay identical.

---

## Optional: run locally

Local development is **not required** for the demo. If you want it:

```bash
npm install
cp .env.example .env.local   # optional — safe fallbacks exist
npm run dev                  # http://localhost:3000
```

Production-style run:
```bash
npm run build && npm run start
```

## Tech stack
- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS**
- Lightweight **HMAC-signed cookie** auth (no external auth service)
- Seeded TypeScript data in `src/lib/seed/*` — no database

## Project layout
```
src/
  app/
    (app)/            # authenticated pages (dashboard, skills, automations, …)
    api/health/       # Render health check
    login/  logout/   # credential login + sign-out
  components/         # UI (Sidebar, SkillRunner, AutomationRunner, LmsHandoff, …)
  lib/
    auth.ts           # signed-cookie sessions + demo users (env-driven)
    store.ts          # in-memory run history + feedback
    seed/             # Gepromed demo data (skills, automations, …)
render.yaml           # Render Blueprint
.env.example          # documented env vars
public/robots.txt     # private demo — disallow indexing
```
