# Gepromed SaaS — Implementation Plan (Lead Management + Skills)

**Deadline:** first SaaS version + website by **end of July 3**. Demo at the bi-weekly client meeting Wednesday.
**Cost:** €0 beyond the existing paid n8n account.

---

## 1. What we are building (scope)

| In this pass | Later (out of scope now) |
| --- | --- |
| Website V2 — **frontend only** (existing content) | Website backend |
| Skill Catalog — frontend + **Claude API** | Finance module (invoices/expenses) |
| Lead Management — **full backend** (Supabase + n8n) | Deep LMS integration |

- SaaS is **internal staff only** → reached via a **link in the website footer** (separate link/subdomain). No public "register" button.
- **No payment field in the registration form** (Nicole's rule — deposit is a follow-up step).

---

## 2. Architecture

```
Public website (frontend)              Organizer space (AI console)
  course cards + lead form                pipeline dashboard + per-lead actions
        | insert (anon key)                        ^ read/update (Realtime)
        v                                           |
   ┌──────────── SUPABASE (Postgres + Storage + Realtime) ────────────┐
   └───────────────────────────────┬──────────────────────────────────┘
                                    | DB webhooks + REST
                                    v
                              n8n (paid) — reminders, emails, signing webhook, LMS handoff
```

- **Frontend** → Supabase `anon` key (RLS: insert leads only).
- **n8n** → Supabase `service_role` key (backend, bypasses RLS). **Never expose service_role in frontend.**
- **Email** → n8n Send Email via Gmail SMTP or Resend (free).
- **Doc signing** → **Documenso** free cloud tier (webhook `document.signed`). Manual upload = fallback path.

---

## 3. Data model (Supabase)

```sql
create type lead_stage   as enum ('lead','deposit_paid','contract_signed','confirmed','lms_provisioned');
create type sign_channel as enum ('online','manual');
create type interest_level as enum ('highly_interested','interested','neutral','not_interested','unreachable');

create table trainings (
  id uuid primary key default gen_random_uuid(),
  title text, specialty text, level text, city text,
  start_date date, end_date date,
  seats_total int, seats_taken int default 0,
  price numeric, deposit_amount numeric,          -- deposit is per course
  status text default 'open'                       -- open | full
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references trainings(id),
  first_name text, last_name text, email text, phone text, profession text,
  dietary_notes text, arrival_notes text, accommodation_notes text,
  stage lead_stage default 'lead',
  interest interest_level default 'interested',    -- staff-set warmth badge
  reminders_active boolean default true,           -- admin master switch per lead
  sign_channel sign_channel,
  deposit_paid_at timestamptz, contract_signed_at timestamptz,
  confirmed_at timestamptz, lms_user_id text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table lead_comments (                       -- staff notes timeline
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id),
  author text, body text, created_at timestamptz default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id),
  file_url text, signed boolean default false, verified boolean default false,
  verified_at timestamptz
);

create table lead_events (                          -- dashboard activity feed
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id),
  type text, payload jsonb, created_at timestamptz default now()
);

create table email_log (                            -- prevents double sends
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id),
  template text, to_email text, sent_at timestamptz default now(), status text
);
```

**RLS:** public role → `INSERT` on `leads` only. Staff/service_role → full read/update.

---

## 4. The pipeline (state machine)

| # | Stage | Enters when | Action |
| --- | --- | --- | --- |
| 1 | `lead` | form submitted | email "pay deposit" + start daily unpaid reminders |
| 2 | `deposit_paid` | organizer clicks **Mark paid** (demo) | email engagement doc + start daily unsigned reminders |
| 3 | `contract_signed` | lead picks Option A or B in the doc email | notify organizer / auto-confirm |
| 4 | `confirmed` | seat confirmed | confirmation email + welcome note 1–2 days pre-course |
| 5 | `lms_provisioned` | on confirm | create mock **Gepromed LMS** account + email credentials |

**Signed-document — the engagement email gives the lead 2 buttons:**
- **Option A — Sign online (recommended):** link opens the doc on **Documenso's hosted signing page** → lead signs → `document.signed` webhook → n8n sets `contract_signed` → **auto-confirms seat** → LMS handoff. *(Free on Documenso cloud free tier.)*
- **Option B — Download, sign & upload:** link → lead downloads PDF, signs, uploads via an upload page (Supabase Storage) → `documents.verified=false`, shows as **"pending verification"** → Nicole reviews → **Confirm seat (popup)** → LMS handoff.
- **Option C — sign embedded inside our own UI:** NOT free (Documenso cloud needs Teams $40/mo; free only if we self-host Documenso/DocuSeal). **Deferred** — Option A already covers click-and-sign-online.

**Reminders:** daily, per lead, until stage advances **or** admin flips `reminders_active = false`.

**`not_interested` = hard stop:** when staff set a lead's interest to `not_interested`, **everything stops** — reminders off, no stage progression, no further emails. This is the terminal state for cold/lost leads.

---

## 5. Organizer space (dashboard) — must have

- 4 pipeline columns: **Lead à suivre · Acompte payé · Contrat signé · Confirmé** + metrics (Demandes, Leads à suivre, Confirmés, Acomptes potentiels €).
- Per-lead card actions:
  - **Mark deposit paid** (demo)
  - **View document** / **Confirm seat** (popup)
  - **Interest badge** dropdown (highly interested → unreachable)
  - **Comment box** (staff notes timeline)
  - **Reminders on/off** toggle
- Live updates via Supabase **Realtime**.

---

## 6. n8n workflows

1. **Daily reminder sweep** — Schedule Trigger → Supabase get unpaid/unsigned leads where `reminders_active=true` → Send Email → write `email_log`.
2. **New-lead welcome** — Supabase DB webhook (insert) → send deposit-request email.
3. **Signing webhook** — Documenso `document.signed` → update Supabase → auto-confirm (Path A).
4. **Confirm + LMS handoff** — on `confirmed` → confirmation email + mock Gepromed LMS credentials email.
5. **Pre-course welcome** — Schedule Trigger → confirmed leads starting in 1–2 days → welcome note.

Trigger source: Supabase **Database Webhooks** → n8n production webhook URL (paid n8n provides public URLs).

---

## 7. Skill Catalog (wire to Claude API)

- Current: frontend only, offline `demo()` mocks.
- Change: on **Run skill**, call **Claude API** with `system prompt` (from the skill `.md` file) + `user prompt` (form inputs) → render output.
- Keep the demo fallback for skills without a live key.
- Unzip the provided skills `.md` files → load as system prompts.

---

## 8. Free-tier fit ✅

| Need | Free tier | OK |
| --- | --- | --- |
| DB + tables | Supabase 500 MB | ✅ |
| Signed PDFs | Supabase 1 GB storage | ✅ |
| Live dashboard | Realtime 200 conn. | ✅ |
| DB → n8n events | Database Webhooks (pg_net) | ✅ |
| Automation/email | n8n (paid) + Gmail/Resend free | ✅ |
| E-signing + webhook | Documenso free (25/mo) | ✅ |

⚠️ Supabase free project **pauses after 7 days idle** — fine for demo; upgrade or ping to keep alive before client relies on it.

---

## 9. Build order (July 3)

1. **Supabase**: create project → run schema (§3) → RLS → seed 3 trainings with `deposit_amount`.
2. **Website**: registration form → insert into `leads` (no payment field) → add footer link to SaaS.
3. **Organizer space**: wire pipeline + metrics to live data → add actions (mark paid, confirm popup, interest badge, comments, reminders toggle).
4. **n8n**: workflows 1, 2, 4 first → then 3 (Documenso) and 5 if time.
5. **Skill Catalog**: wire Run → Claude API with skill `.md` as system prompt.
6. **Demo pass**: submit lead on website → appears in dashboard → mark paid → sign/upload → confirm → LMS credentials email.

---

## 10. Waiting on Maneesh

- Website content (using existing old-site content for now — confirmed).
- Skills zip (`.md` files) + repo link.
- Refundable **deposit amount per course** (~€400–600; course prices are €1,750–2,950).
- Confirm demo LMS name = **Gepromed LMS**.
