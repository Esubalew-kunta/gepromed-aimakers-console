# Gepromed — FINAL Implementation Plan (step by step)

> The authoritative build plan. Context lives in **`PROJECT_LOG.md`**; the earlier draft is
> **`PLAN.md`**. This file supersedes both for *how to build*. Written after the field
> inventory + meeting-transcript review. **Last updated: 2026-07-02.**
>
> **Golden rule (locked):** build **functionality first, website UI last**. The public-site
> visual rebuild is the *final* task (Phase 11) so it carries zero functional risk.

---

## 0. Decisions locked (do not re-litigate)

| # | Decision |
|---|---|
| Architecture | **Two separate frontends, two URLs, two GitHub repos, two Render deploys**, **ONE shared Supabase**. |
| Website | Public. Reads `trainings`, inserts `leads`. Supabase **anon** key. No login. |
| SaaS console | Staff-only, reached via a **footer link → separate subdomain**. Staff log in (Supabase Auth). Supabase **service_role** key on its backend only. |
| Pipeline | 4 forward stages: `lead → deposit_paid → contract_signed → confirmed`. |
| Cancel/lost | **Not a stage.** Modeled as `interest = not_interested` + `reminders_active = false` (hard stop: no emails, no progression). |
| LMS provisioning | An **event/timestamp** (`lms_provisioned_at`) + a mock "Gepromed LMS" credentials email — **not** a pipeline stage. |
| Deposit | Refundable €400–600, **follow-up step only. NEVER a field in the registration form** (Nicole's rule). |
| Bilingual | Website content stays **curated fr/en** (no live machine translation — medical/Qualiopi content). Stored as **JSONB `{fr,en}`**. |
| Trainings | **SaaS-managed (full CRUD "Course Management"), website-read.** Seed the 5 existing trainings into the DB. |
| Seats | `enrolled` **auto-increments** via DB trigger when a lead reaches `confirmed`. |
| Signing | **Two paths** — A) Documenso online → `document.signed` webhook → auto-confirm; B) download + upload → Nicole verifies → confirm. Both store the signed PDF in **our** Supabase Storage. |
| Skills | **DB-backed `skills` table** (more SaaS, live add/edit demo). `.md` files are the **seed source**; DB is source of truth at runtime. |
| Staff/roles | Keep simple: **Supabase Auth login only**, no RBAC matrix. Comment author = logged-in user. |
| IDs | UUID primary key **+** human-facing `ref` (`REG-000123`) shown to users. |
| Out of scope | Finance module, real LMS integration, in-app skill authoring for the *client*, RBAC, SEO-final content. |

**Deadline:** first SaaS version + website functional by **end of 2026-07-03**; Maneesh demos **Wed 2026-07-08**.

---

## 1. Field inventory (the contract) — DONE ✅

Source of truth = the website code, reconciled with the SaaS pipeline needs.

- **Trainings (course cards):** slug, title{fr,en}, specialty, level, audience, city, venue{fr,en}, start/end date, duration_days, price_eur, deposit_eur, capacity, enrolled, qualiopi, summary{fr,en}, objectives[{fr,en}], program[{day,items}], supervisors[{name,role{fr,en}}], satisfaction?, pass_rate?, photos?.
- **Registration form (lead insert):** sessionSlug, sessionTitle(snapshot), first_name, last_name, email (required); phone, profession, institution, country, dietary, arrival, needs_accommodation(bool), elearning_access(bool), notes (optional). **No payment field.**
- **Tracking (staff side):** stage, interest, reminders_active, sign_channel, per-stage timestamps, comments timeline, documents, events, email log.

---

## SaaS console — as-built inventory (2026-07-02)

The SaaS folder is **more built-out than a v0.5 mock**. What already exists (all offline/seeded):
- **Auth** — `src/lib/auth.ts`: dependency-free HMAC-signed session cookie, 3 roles (`admin` / `gepromed` / `manager`), `src/middleware.ts` protects routes. **Reuse this — do NOT add Supabase Auth.**
- **Skills** — `src/lib/seed/skills.ts` (real Gepromed skills), `SkillCatalog`/`SkillRunner` components, run action `src/app/(app)/skills/[id]/actions.ts`. The `Skill` type (`inputs: SkillField[]`) already matches our `skills` table. **Run seam = one line:** `actions.ts` → `const output = skill.demo(values)`.
- **Run history / feedback** — in-memory `src/lib/store.ts` (`recordRun` → maps to `skill_runs`).
- **Other pages** — automations, lms handoff, training *modules* (enablement content, NOT course sessions), integrations, roadmap, feedback, inputs. All seeded mocks; leave as-is for the demo.
- **NO lead pipeline exists in the SaaS** — the 4-column board is only on the website demo. Phase 4 **builds it fresh** in the SaaS against Supabase.

Env philosophy to preserve: the app **deploys/logs in even with blank env** (safe fallbacks). Keep that — Supabase/Anthropic keys light up live mode without breaking the offline demo.

---

## PHASE-BY-PHASE BUILD

Each phase has **Goal · Tasks · Acceptance**. Do them in order. Phases 3–6 are the SaaS core;
Phase 7 wires the website *functionally*; Phase 11 is the *visual* website rebuild (last).

---

## Phase 0 — Project & environment setup

**Goal:** both apps can reach one Supabase project; secrets in place.

**Tasks**
1. Create **one Supabase project** (free tier). Record: Project URL, `anon` key, `service_role` key.
2. Create a Storage bucket **`documents`** (private).
3. **SaaS repo** `.env`: add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` — **alongside** the existing `NEXTAUTH_SECRET` + demo-credential vars (keep them). Preserve the blank-safe fallback: no key set → offline demo still works.
4. **Website repo** `.env`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon only — never service_role).
5. Confirm the **paid n8n** instance is reachable and can expose production webhook URLs.
6. Install `@supabase/supabase-js` in both repos.

**Acceptance:** both apps start locally and can call a trivial Supabase query with their key.

---

## Phase 1 — Supabase schema (run `schema.sql`)

**Goal:** the DB contract exists: enums, tables, triggers, RLS, seeds. **Do not apply until this plan is approved.**

Run the SQL in **§ Appendix A** in the Supabase SQL editor (or as a migration), in this order:
1. Enums → 2. Tables → 3. Triggers (ref, updated_at, seat-count) → 4. RLS policies → 5. Realtime publication → 6. Seed 5 trainings → 7. Seed skills (Phase 3 seed script).

**Acceptance**
- `select * from trainings` returns 5 rows; `enrolled/capacity` correct.
- Inserting a `leads` row with the anon key succeeds; selecting leads with the anon key is **denied**.
- Advancing a lead to `confirmed` bumps `trainings.enrolled` by 1.
- A new lead gets a `ref` like `REG-000001`.

---

## Phase 2 — SaaS: staff authentication (REUSE existing)

**Goal:** staff log into the SaaS; unauthenticated users are bounced. **Already done — keep it.**

**Tasks**
1. **Keep** the existing HMAC-cookie auth (`src/lib/auth.ts`, `src/middleware.ts`, 3 roles). Do **not** replace with Supabase Auth — the demo logins already work (`demo@gepromed.com` / `gepromed-demo`, etc.).
2. Use `getSessionUser()` to stamp `lead_comments.author` and `skill_runs.run_by`.
3. (Optional) map roles → visibility later; not needed for the demo.

**Acceptance:** unchanged — logged-out → login screen; logging in → console loads. (Already passing.)

---

## Phase 3 — SaaS: Skill Catalog (DB-backed → Claude API)

**Goal:** dynamic, DB-driven skill catalog that actually runs against Claude. **Top client-impress feature.**

**Tasks**
1. **Seed skills (sample now):** the existing `src/lib/seed/skills.ts` already holds real Gepromed skills — **use these as the samples**. Write a one-time script that maps each into the `skills` table (`key`=id, `name`, `description`=summary, `category`, `system_prompt`, `inputs` jsonb from `SkillField[]`, `model`). When Maneesh's `.skill.md` zip arrives, extend the same importer to read the `.md` bodies — same table, just re-seed. (`.md` files are editable → DB stays runtime source of truth.)
   - Note: `system_prompt` isn't in the current seed (skills use a `demo()` fn). For samples, add a short system prompt per skill in the importer; the real prompts come from the `.md` bodies later.
2. **Catalog UI:** point `SkillCatalog` at Supabase `skills` (grouped by `category`) instead of the seed import.
3. **Dynamic form:** `SkillRunner` already renders from `inputs` — feed it the DB `inputs` jsonb.
4. **Wire the run to Claude — the seam already exists:** in `src/app/(app)/skills/[id]/actions.ts`, replace `const output = skill.demo(values)` with a **Claude API** call (`ANTHROPIC_API_KEY`, model from the skill row) using the skill's `system_prompt` + the input values. Keep `skill.demo()` as the **fallback when the key is blank** (preserves offline demo mode). Keep `recordRun()` → also insert into `skill_runs`.
5. **(Stretch, the "wow"):** an **Add/Edit skill** form (writes to `skills`) so a new skill appears live in the catalog. `skill_runs` history tab.

**Acceptance:** pick a skill → fill inputs → Run → **real Claude output** (or deterministic mock if no key). Catalog reflects DB rows; adding a skill in-app shows it live.

---

## Phase 4 — SaaS: Lead Management dashboard (NEW section)

**Goal:** the pipeline Nicole manages, on live Supabase data with Realtime. **This section does not exist in the SaaS yet** — build it fresh (new route under `src/app/(app)/leads/`), using the website's mock `/dashboard` as the visual reference and the SaaS's own component/layout style.

**Tasks**
0. **Add a "Leads" nav item** in `src/components/Sidebar.tsx` + a new `leads` route.
1. **Read leads** from Supabase (join `trainings` for title/deposit) via a server component using the **service_role** key. Realtime updates client-side via the anon/authed client.
2. **4 pipeline columns** — Lead à suivre · Acompte payé · Contrat signé · Confirmé — + metrics (Demandes, Leads à suivre, Confirmés, Acomptes potentiels €).
3. **Per-lead actions:**
   - **Mark deposit paid** (demo button) → `stage=deposit_paid`, set `deposit_paid_at`, write `lead_events`.
   - **View document / Confirm seat** (popup) → `stage=confirmed`, `confirmed_at`.
   - **Interest badge** dropdown (highly_interested → unreachable). Setting `not_interested` → also set `reminders_active=false` (hard stop).
   - **Comment box** → insert `lead_comments` (author = logged-in staff).
   - **Reminders on/off** toggle → `reminders_active`.
4. **Realtime:** subscribe to `leads` (+ `lead_comments`) so the board updates live.

**Acceptance:** all actions persist to Supabase and reflect instantly; `not_interested` stops reminders.

---

## Phase 5 — SaaS: Course Management (trainings CRUD)

**Goal:** staff create/edit/delete trainings → website picks them up (makes the demo look "full").
**Note:** this manages the vascular/ophthalmology **course sessions** (`trainings` table) — distinct from the existing SaaS `training` page, which is enablement *modules*. New route under `src/app/(app)/`.

**Tasks**
1. **List trainings** from Supabase (upcoming/past).
2. **Create/Edit form** — bilingual fields (fr + en) for title/venue/summary/objectives/program/supervisors, plus specialty/level/audience/city/dates/price/deposit/capacity/qualiopi.
   - Optional helper: **"Auto-translate draft"** button → Claude API fills EN from FR for human review (reuses the skills API; never auto-publishes).
3. **Delete / set status** (open/full is auto from the seat trigger; allow manual override).

**Acceptance:** create a course in the SaaS → it exists in `trainings` → appears on the website (Phase 7).

---

## Phase 6 — SaaS: signing + documents (both paths) + LMS handoff (mock)

**Goal:** the document lifecycle and the confirmation → LMS credential email.

**Tasks**
1. **Option A (online):** "Send engagement doc" → Documenso hosted signing link (Phase 8 wires the webhook). On `document.signed`: `documents.signed=true`, `stage=contract_signed`, auto-confirm.
2. **Option B (upload):** an **upload page** (can live on the SaaS or a tokenized link) → file to Storage `documents` bucket → `documents.verified=false` ("pending verification") → Nicole reviews → **Confirm seat**.
3. **LMS handoff (mock):** on `confirmed` → set `lms_provisioned_at`, generate a mock `lms_user_id`, trigger the "Gepromed LMS credentials" email (Phase 8).
4. Store every signed PDF in **our** Storage bucket (both paths).

**Acceptance:** both paths move a lead to `contract_signed`/`confirmed`; PDF lands in Storage; unsigned upload stays "pending".

---

## Phase 7 — Website: functional wiring (KEEP current UI)

**Goal:** the existing website talks to Supabase. **No visual changes yet** — pure plumbing.

**Tasks**
1. **Trainings read:** replace hardcoded `lib/trainings.ts` data with a Supabase fetch (same `TrainingSession`/`L` shape → components unchanged). Keep the label maps.
2. **Lead insert:** repoint `lib/api.ts` `postRegistration()` → **insert into `leads`** via the anon key (map form fields → columns; store `training_id` + `training_title_snapshot`). Retire the file-backed `store.ts` / `/api/registrations` routes (or leave dormant).
3. **Freeze the field contract:** the `<RegisterPanel>` payload = the locked lead schema. Do not change field names after this.
4. **Footer link → SaaS** (separate subdomain/URL).
5. **Drop the website's mock `/dashboard`** (lead management now lives only in the SaaS). Remove or hide it.

**Acceptance:** submit the real form on the website → a row appears in Supabase `leads` → shows in the SaaS dashboard. Cards render from DB.

---

## Phase 8 — n8n automation

**Goal:** the emails/reminders/webhooks that make it hands-off. Triggered by Supabase **Database Webhooks** → n8n production URLs.

**Workflows** (build 1, 2, 4 first; then 3, 5 if time)
1. **New-lead welcome** — Supabase insert webhook → deposit-request email → write `email_log`.
2. **Daily reminder sweep** — Schedule → fetch unpaid/unsigned leads where `reminders_active=true` **and** `interest <> 'not_interested'` → send email → log.
3. **Signing webhook** — Documenso `document.signed` → update Supabase (`contract_signed`) → auto-confirm (Path A).
4. **Confirm + LMS handoff** — on `confirmed` → confirmation email + mock **Gepromed LMS** credentials email (user ID + password).
5. **Pre-course welcome** — Schedule → confirmed leads starting in 1–2 days → welcome note.

**Acceptance:** each workflow validated + verified (connections checked); `not_interested`/reminders-off leads receive nothing.

---

## Phase 9 — Documenso e-signing (Option A end-to-end)

**Goal:** real click-to-sign online path.

**Tasks:** Documenso free cloud account → create the engagement-doc template → generate a signing link per lead → configure the `document.signed` webhook → n8n workflow 3 → auto-confirm → pull signed PDF into Storage.

**Acceptance:** click the signing link → sign → lead auto-advances to `confirmed`; PDF stored.

---

## Phase 10 — End-to-end demo pass

**Goal:** prove the whole loop before the client demo.

**Flow to verify:** submit lead on website → appears in SaaS dashboard → deposit reminder email → **Mark paid** → engagement email → sign (A) **or** upload (B) → **Confirm seat** → confirmation + **Gepromed LMS credentials** email. Also: run a skill against Claude; create a course in the SaaS and see it on the website; set a lead to `not_interested` and confirm all automation stops.

**Acceptance:** the full path works on the deployed demo (both Render URLs live).

---

## Phase 11 — Website UI rebuild (V2) — **FINAL TASK**

**Goal:** complete/polish the public site's visuals with the V2 design + existing content. Done **last** because the `<RegisterPanel>` contract and Supabase wiring are frozen — the UI can be re-skinned with zero functional risk.

**Tasks**
1. Apply the V2 visual design across pages (home, trainings, detail, about, contact).
2. Fill in the **existing old-site content** (implant cycle, explant, etc.) — swap to Maneesh's SEO-optimized content when he delivers it.
3. Keep the same `<RegisterPanel>` component mounted (functionality untouched).
4. Responsive + bilingual QA.

**Acceptance:** site looks V2-final, all content present, form + trainings still fully functional against Supabase.

---

## Waiting on Maneesh (blockers to flag)
- Skills **zip** (`.skill.md`) + repo link → needed for Phase 3 seed.
- **LMS name/details** (demo = "Gepromed LMS").
- Per-course **deposit amount** (~€400–600; already have plausible values seeded).
- SEO website content (using existing old-site content until then — confirmed OK).

---

# Appendix A — `schema.sql` (the contract)

> Draft to run in Phase 1. Review before applying to Supabase.

```sql
-- ---------- 1. ENUMS ----------
create type lead_stage     as enum ('lead','deposit_paid','contract_signed','confirmed');
create type interest_level as enum ('highly_interested','interested','neutral','not_interested','unreachable');
create type sign_channel   as enum ('online','manual');

-- ---------- 2. TABLES ----------
create table trainings (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  title          jsonb not null,              -- {fr,en}
  specialty      text not null,               -- vascular | ophthalmology | simulation
  level          text not null,               -- Initiation | Advanced | Expert
  audience       text not null,               -- France | Europe
  city           text not null,
  venue          jsonb not null,              -- {fr,en}
  start_date     date not null,
  end_date       date not null,
  duration_days  int  not null default 1,
  price_eur      numeric not null default 0,
  deposit_eur    numeric not null default 0,
  capacity       int  not null default 0,
  enrolled       int  not null default 0,
  qualiopi       boolean not null default true,
  summary        jsonb not null,              -- {fr,en}
  objectives     jsonb not null default '[]', -- [{fr,en}]
  program        jsonb not null default '[]', -- [{day:{fr,en}, items:[{fr,en}]}]
  supervisors    jsonb not null default '[]', -- [{name, role:{fr,en}}]
  satisfaction   int,                          -- past sessions only
  pass_rate      int,
  photos         int,
  status         text not null default 'open', -- open | full  (auto via trigger)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table leads (
  id                      uuid primary key default gen_random_uuid(),
  ref                     text unique,          -- REG-000123 (trigger)
  training_id             uuid references trainings(id) on delete set null,
  training_title_snapshot text,                 -- frozen at signup
  first_name text not null,
  last_name  text not null,
  email      text not null,
  phone        text default '',
  profession   text default '',
  institution  text default '',
  country      text default '',
  dietary      text default '',
  arrival      text default '',
  needs_accommodation boolean not null default false,
  elearning_access    boolean not null default true,
  notes        text default '',                 -- participant's own message
  stage             lead_stage     not null default 'lead',
  interest          interest_level not null default 'interested',
  reminders_active  boolean        not null default true,
  sign_channel      sign_channel,
  deposit_paid_at     timestamptz,
  contract_signed_at  timestamptz,
  confirmed_at        timestamptz,
  lms_provisioned_at  timestamptz,
  lms_user_id         text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lead_comments (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads(id) on delete cascade,
  author     text,                              -- logged-in staff name/email
  body       text not null,
  created_at timestamptz not null default now()
);

create table documents (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references leads(id) on delete cascade,
  file_url     text,
  sign_channel sign_channel,
  signed       boolean not null default false,
  verified     boolean not null default false,
  verified_at  timestamptz,
  created_at   timestamptz not null default now()
);

create table lead_events (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads(id) on delete cascade,
  type       text not null,
  payload    jsonb,
  created_at timestamptz not null default now()
);

create table email_log (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid references leads(id) on delete set null,
  template   text,
  to_email   text,
  status     text,
  sent_at    timestamptz not null default now()
);

create table skills (
  id            uuid primary key default gen_random_uuid(),
  key           text unique not null,
  name          text not null,
  description   text default '',
  category      text default 'general',
  system_prompt text not null,                  -- the .md body
  inputs        jsonb not null default '[]',    -- [{label,type,placeholder}]
  model         text not null default 'claude-opus-4-8',
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table skill_runs (                       -- optional history tab
  id         uuid primary key default gen_random_uuid(),
  skill_id   uuid references skills(id) on delete set null,
  inputs     jsonb,
  output     text,
  run_by     text,
  created_at timestamptz not null default now()
);

-- ---------- 3. TRIGGERS ----------
-- human ref
create sequence if not exists lead_ref_seq;
create or replace function set_lead_ref() returns trigger as $$
begin
  if new.ref is null then
    new.ref := 'REG-' || to_char(nextval('lead_ref_seq'), 'FM000000');
  end if;
  return new;
end; $$ language plpgsql;
create trigger trg_set_lead_ref before insert on leads
  for each row execute function set_lead_ref();

-- updated_at
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
create trigger trg_touch_trainings before update on trainings
  for each row execute function touch_updated_at();
create trigger trg_touch_leads before update on leads
  for each row execute function touch_updated_at();
create trigger trg_touch_skills before update on skills
  for each row execute function touch_updated_at();

-- seat counting + open/full status
create or replace function bump_enrolled() returns trigger as $$
begin
  if new.stage = 'confirmed' and old.stage is distinct from 'confirmed' then
    update trainings set enrolled = enrolled + 1 where id = new.training_id;
  elsif old.stage = 'confirmed' and new.stage is distinct from 'confirmed' then
    update trainings set enrolled = greatest(0, enrolled - 1) where id = new.training_id;
  end if;
  update trainings
    set status = case when enrolled >= capacity then 'full' else 'open' end
    where id = new.training_id;
  return new;
end; $$ language plpgsql;
create trigger trg_bump_enrolled after update of stage on leads
  for each row execute function bump_enrolled();

-- ---------- 4. RLS ----------
alter table trainings     enable row level security;
alter table leads         enable row level security;
alter table lead_comments enable row level security;
alter table documents     enable row level security;
alter table lead_events   enable row level security;
alter table email_log     enable row level security;
alter table skills        enable row level security;
alter table skill_runs    enable row level security;

-- trainings: public read, staff manage
create policy trainings_public_read on trainings for select using (true);
create policy trainings_staff_all   on trainings for all to authenticated using (true) with check (true);

-- leads: anon can only INSERT; staff full read/update/delete
create policy leads_anon_insert on leads for insert to anon with check (true);
create policy leads_staff_read   on leads for select to authenticated using (true);
create policy leads_staff_update on leads for update to authenticated using (true) with check (true);
create policy leads_staff_delete on leads for delete to authenticated using (true);

-- staff-only tables
create policy comments_staff on lead_comments for all to authenticated using (true) with check (true);
create policy documents_staff on documents   for all to authenticated using (true) with check (true);
create policy events_staff    on lead_events  for all to authenticated using (true) with check (true);
create policy emails_staff     on email_log    for all to authenticated using (true) with check (true);
create policy skills_staff      on skills       for all to authenticated using (true) with check (true);
create policy skillruns_staff   on skill_runs   for all to authenticated using (true) with check (true);
-- (service_role bypasses RLS — used by n8n + SaaS backend.)

-- ---------- 5. REALTIME ----------
alter publication supabase_realtime add table leads;
alter publication supabase_realtime add table lead_comments;
```

> **Seeds** (Phase 1 step 6–7): insert the 5 existing trainings from `lib/trainings.ts` (values map
> 1:1 to the columns above — JSONB fields take the `{fr,en}` objects verbatim), and run the Phase 3
> skills seed script for the 16 `.md` files.

---

## Build-order quick reference
`0 Setup → 1 Schema → 2 Auth → 3 Skills → 4 Lead dashboard → 5 Course mgmt → 6 Signing/LMS → 7 Website wiring → 8 n8n → 9 Documenso → 10 E2E → 11 Website UI (LAST)`
