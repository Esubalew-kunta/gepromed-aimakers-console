# PROJECT LOG — Gepromed / J-Promemed Initiative (Session Handoff)

> **Read this first if you are a new session.** For a clean, current snapshot of what's built,
> read **`STATUS.md`** (fastest catch-up). The authoritative build plan is **`IMPLEMENTATION_PLAN.md`**;
> the public website has its own **`DESIGN_HANDOFF.md`** (UI-redesign rules, do-not-touch data wiring).
> `PLAN.md` is the earliest draft. This log is the running *why/context* history.
>
> Last updated: **2026-07-02** (field inventory + transcript review done; final plan written; starting Phase 0/1).

---

## 0. How to resume (new session quick start)

1. Read this file, then read **`PLAN.md`** (same folder).
2. Both project folders are present under the parent `…\tasks\Gepromid\gepromed-os-ai-makers-gepromed-os (1)\`:
   - **SaaS / AI console** = `gepromed-os-ai-makers-gepromed-os\` (this folder) — skills + (new) lead dashboard + staff login.
   - **Website** = `gepromed-ai-makers-claude-sleepy-maxwell-otfodc\` — public site, course cards + lead form
     (code behind `gepromed-ai-makers.vercel.app`).
3. **Planning is DONE.** Field inventory complete, meeting transcript reviewed, all decisions locked,
   and the finalized schema is written in **`IMPLEMENTATION_PLAN.md` Appendix A** (not yet applied to Supabase).
4. **Next action:** execute `IMPLEMENTATION_PLAN.md` **Phase 0 (setup) → Phase 1 (run schema)** → then Phases 2–11.
   Build order is functionality-first; **website UI rebuild is the LAST task (Phase 11)**.

---

## 1. What this project is

**AI Makers × Gepromed.** Client is **J-Promemed / Gepromed**, a French **medtech** company that
runs professional training for doctors & nurses (surgical simulators — vascular & ophthalmology)
plus a research/simulation-data business. Team members incl. Nicole (training/leads), Wissal,
Juliette, Noé, Nathalie, Otman (sales), Maneesh Behera (our project lead), **Eusbalew Kunta = the
developer / user of this session**.

The client has **~46 documented AI needs** (file: `GEPROMED_Besoins_IA.xlsx`, in this folder;
French, "Recensement des Besoins en IA"). Most map to "skills"; a few need software.

**Two active projects for the client:**
1. **Website revamp** (V2 design chosen).
2. **AI transformation** → consolidate everything into **one internal SaaS platform** that
   AI Makers owns & maintains (recurring revenue; client keeps needing us). This SaaS is the
   demo in this folder (currently a v0.5 mock).

---

## 2. The goal we are building

A **unified internal SaaS** with, for this pass, **two sections only**:
- **Skill Catalog** — pick a skill, fill inputs, run → output (currently offline mocks; must be
  wired to the **Claude API** using the client's `.skill.md` files as system prompts).
- **Lead Management** — automate Nicole's manual, Excel-based training-lead process.

Deferred (NOT this pass): finance module, deep LMS integration, SEO-optimized content.

---

## 3. Architecture (LOCKED)

**Two apps, one backend, separate repos & deployments.**

```
Public website (frontend)            SaaS platform (this folder)
  courses + lead form                  skills + lead dashboard + staff login
  → GitHub repo A → Render A            → GitHub repo B → Render B
        \                                   /
         \____ ONE Supabase project ______/           n8n (paid) — automation layer
              (Postgres + Storage + Realtime)          emails, reminders, signing webhook, LMS handoff
```

- **Two separate GitHub repos**, later **two separate Render frontend deployments**.
- **One shared Supabase** project = the "contract" both apps agree on.
- Public site → Supabase **anon key** (RLS: insert leads only).
- SaaS + n8n → Supabase **service_role key** (backend; never in frontend).
- SaaS reached from the website via a **footer link** (separate URL/subdomain, e.g.
  `app.gepromed.com`). Staff log in on the SaaS (Supabase Auth). Public site has no login.
- **Decoupling principle:** the lead form is a self-contained component with a fixed field
  contract → `createLead(payload)` → Supabase. Website UI can be rebuilt later by re-mounting the
  same component; form functionality never changes. (Build functionality first, UI rebuild last.)

**Cost:** €0 beyond the existing **paid n8n** account. Supabase free tier + Documenso free tier +
Gmail/Resend free email all fit (see PLAN.md §8). Caveat: free Supabase project pauses after 7
days idle.

---

## 4. Lead pipeline (LOCKED)

```
lead → deposit_paid → contract_signed → confirmed → lms_provisioned
(à suivre) (acompte payé) (contrat signé)  (confirmé)   (Gepromed LMS)
```
Rules:
- Strict forward order (no doc before payment, no seat before signature).
- **Deposit is a follow-up step — NEVER a field in the registration form** (Nicole's rule: people
  see "pay €600" and drop off).
- **Reminders:** daily per lead until the stage advances or admin switches off.
- **`interest = not_interested` is a HARD STOP:** reminders off, no progression, no more emails.
  Interest badge values: `highly_interested · interested · neutral · not_interested · unreachable`.
- **Per-lead staff comments** (timeline) + **interest badge** + **reminders on/off** toggle in the
  dashboard.
- **Signing (engagement doc email gives the lead 2 buttons):**
  - **Option A — Sign online:** Documenso hosted link → `document.signed` webhook → n8n
    auto-confirms seat. (Free on Documenso cloud free tier, 25/mo.)
  - **Option B — Download, sign & upload:** upload page (Supabase Storage) → Nicole reviews →
    **Confirm seat (popup)**.
  - **Option C** (embedded signing inside our own UI) = deferred (needs Documenso Teams $40/mo or
    self-hosting). Option A already covers click-and-sign-online.
- Demo mocks (keep the real seam): payment = organizer "Mark paid" button; LMS = mock
  "Gepromed LMS" credentials email. Real Stripe/LMS slot in later.

---

## 5. Build order (LOCKED — functionality first, UI last)

1. **Inventory real fields** (course cards + registration form) — from live site + website code.
2. **Supabase schema** (the contract). *Not written yet.*
3. **SaaS folder:** staff login → Skill catalog (Claude API) → Lead dashboard.
4. **Website folder:** wire existing `<LeadForm>` → `createLead()` → same Supabase. Freeze field
   contract.
5. **n8n:** reminders, welcome email, signing webhook, confirm→LMS handoff, pre-course welcome.
6. **End-to-end test** the full loop.
7. **Website UI rebuild LAST** — same form component, no functional risk.

Draft schema (tables: trainings, leads, lead_comments, documents, lead_events, email_log; enums:
lead_stage, sign_channel, interest_level) is in **PLAN.md §3** — treat as a DRAFT to be reconciled
against the real fields in step 1 before running it.

---

## 6. Status (as of 2026-07-02)

- ✅ Understood the business, the meeting, and the client's AI-needs Excel.
- ✅ Ran the current SaaS demo locally (`npm run dev`, http://localhost:3000, Demo Mode healthy).
- ✅ Architecture, pipeline, signing options, free-tier fit — all decided.
- ✅ **Field inventory DONE** — from the website source (trainings + registration form + tracking).
- ✅ **Meeting transcript reviewed** — decisions cross-checked, gaps closed.
- ✅ **SaaS console inventoried** — existing auth (HMAC cookie, 3 roles) + skill catalog reused; lead
  pipeline is NEW work (doesn't exist in the SaaS yet).
- ✅ **All decisions locked** (see `IMPLEMENTATION_PLAN.md` §0): DB-backed skills, bilingual JSONB,
  4-stage pipeline + `not_interested` hard-stop, both signing paths, auto seat-count, keep existing auth.
- ✅ **`IMPLEMENTATION_PLAN.md` written** (11 phases + `schema.sql` in Appendix A).
- ✅ **Phase 0/1 DONE:** Supabase project live, `db/schema.sql` + `db/seed_trainings.sql` applied,
  RLS verified end-to-end (anon reads trainings + inserts leads; anon CANNOT read leads; secret = full),
  `@supabase/supabase-js` + `@anthropic-ai/sdk` + `ws` installed, `src/lib/supabase.ts` server client wired,
  both apps' `.env.local` set.
- ✅ **Phase 3 DONE:** skills are DB-backed (`db/skills.sql`, 8 skills seeded) and run **live on Claude**
  (`claude-sonnet-5`, verified) via `src/lib/claude.ts` + the run seam in `skills/[id]/actions.ts`;
  offline `demo()` is the automatic fallback. Data layer `src/lib/skills-data.ts` (DB → seed fallback).
- ✅ **Phase 4 DONE (code):** Lead Management dashboard — new `/leads` route + Sidebar item;
  `src/lib/leads-shared.ts` (types/labels), `src/lib/leads-data.ts` (server fetch w/ training+comments join),
  `src/app/(app)/leads/actions.ts` (advance stage + timestamps + mock LMS handoff, interest badge w/
  not_interested hard-stop, reminders toggle, comments, delete), `src/components/LeadBoard.tsx` (tabs, cards, actions).
  `db/seed_leads.sql` = 4 demo leads. **Realtime:** used server-action + `router.refresh()` instead of Supabase
  Realtime, because the SaaS uses its own cookie auth (no Supabase JWT) so RLS-protected realtime can't reach the browser.
- ✅ **Role-based views** (additive, nothing removed): **admin** (`admin@aimakers.ai`) can author skills
  (New/Edit/Delete via `/skills/new`, `/skills/[id]/edit`, `src/app/(app)/skills/actions.ts` + `SkillForm`)
  and delete leads; **gepromed/manager** run skills + operational lead actions only (advance, interest,
  reminders, comments). Admin checks are server-side (`getSessionUser().role === 'admin'`).
- ✅ **Skill run output**: resizable/scrollable box, Export menu (md/Word/PDF), richer Markdown renderer
  (h1–h4, hr, links, code fences). **"Runs this month" is real** (skill_runs.skill_key counts).
- ✅ **Lead Management v2** (mockup approved → built): `src/components/LeadBoard.tsx` rewritten as a
  **thin clickable-row list + right-side detail drawer**. Toolbar = live search + session filter +
  interest filter + stage tabs. Drawer = workflow stepper (timestamps + LMS id), primary advance action
  + interest + reminders, session & logistics, Documents section (contextual per stage; "View signed
  doc" placeholder until Phase 6), and **chat-style comments with a pinned composer**. Rows view-only.
  Widened the training join in `leads-data.ts` (dates/price). Fixed a client-serialization 500 on the
  skill edit page (strip `demo()` before passing to `SkillForm`).
- ✅ **Phase 5 DONE — Course Management** (staff, not admin-gated; Nicole manages courses): new `/courses`
  route + sidebar item. `src/lib/courses-shared.ts` (types/labels), `src/lib/courses-data.ts` (getCourses/getCourse),
  `src/app/(app)/courses/actions.ts` (saveCourse/deleteCourse → `trainings` table), `src/components/CourseForm.tsx`
  (bilingual FR/EN title/summary/venue, specialty/level/audience, dates/price/deposit/capacity/qualiopi/status,
  objectives + supervisors repeaters, program as JSON, past-session proof). List page splits upcoming/past.
  DB insert shape validated (201). **Program is a structured day/session editor** (not JSON); **cover image
  upload** → Supabase Storage `course-images` bucket (public) + `trainings.image_url` (run `db/course_images.sql`).
  Storage upload + public read verified. NOTE: website still reads hardcoded `lib/trainings.ts` → courses
  (incl. images) become visible on the site only after **Phase 7** wiring.
- ✅ **Phase 7 (website wiring) — mostly done:** website (Next 14 app, folder `gepromed-ai-makers-claude-sleepy-maxwell-otfodc`)
  now **reads trainings from Supabase** — `lib/data.ts` (plain REST fetch w/ anon key), `lib/trainings-context.tsx`
  (`TrainingsProvider` w/ seed fallback) feeds `TrainingsExplorer` + `RegisterPanel`; detail page is dynamic
  server-fetch (`getTrainingBySlug`) — **verified rendering DB data**. Cards use `imageUrl ?? SPECIALTY_IMAGE`.
  Lead form → **`createLead()` → `create_lead` RPC** (RegisterPanel shows returned `ref`). Footer link → SaaS
  console (`NEXT_PUBLIC_CONSOLE_URL`); `/dashboard` removed from header nav + mock page replaced with a redirect
  notice. Website deps installed; typecheck clean; dev server on **:3001** (SaaS on :3000).
  `db/create_lead_rpc.sql` applied ✓.
- ✅ **Phase 7 VERIFIED end-to-end (browser test via gstack `browse`):** submitted the public register form on
  the website (:3001) → got real ref (REG-000008) → the lead appears in the SaaS Lead board (:3000) → advancing
  its stage works + counts update live. Trainings load from Supabase on the register dropdown.
- ✅ **Bug fixed (was the user-visible Next.js error badge):** `components/ui/Sheet.tsx` had a
  **hydration mismatch** — it `createPortal`'d on the client but returned null on the server. Added a `mounted`
  gate (render null until mounted) → console clean. Pre-existing issue, not from Phase 7.
- ⚠️ **Dev-process hygiene note:** duplicate/orphaned `next dev` processes kept grabbing ports (3000→3002 etc.)
  and holding `.next` locks; `rm -rf .next` on a still-running server causes `_next/static` 404s. Kill ALL
  project node processes before restarting. Correct ports: **SaaS :3000, website :3001**.
- ✅ **Phase 6 (document signing — manual path) DONE & browser-verified:** lead drawer Documents section is
  live. `leads-data` embeds `documents`; `leads/actions.ts` adds `uploadDocument` (→ private `documents`
  Storage bucket + documents row + lead→contract_signed), `verifyAndConfirm` (→ verified + lead→confirmed + mock
  LMS `GLMS-…`), `getDocumentUrl` (signed URL to view). `LeadBoard` DocState: upload file → "pending
  verification" → View / Verify & confirm. E2E tested: upload PDF → Contrat signé → verify → Confirmé + LMS;
  file confirmed in Storage + documents row. **Deferred to Phase 8** (needs email links + Documenso/n8n):
  the **online e-signing (Option A)** and the **public end-user upload page** (lead uploads via emailed link) —
  UI seam noted in the drawer.
- ⏳ **Phase 8 (n8n automation) — built, awaiting import + test:** no n8n MCP connected → chose the
  **importable-JSON** path. Deliverables in `db/phase8_email.sql` (`log_email_once` idempotency RPC returns
  `{send:bool}`; `leads_due_reminders` view honoring the hard-stop) and `n8n/` (`01-new-lead-welcome`,
  `02-daily-reminder-sweep`, `03-confirm-lms-handoff` + `SETUP.md`). Email = user's own n8n Gmail credential
  (sender) → lead's email. Supabase HTTP auth = single `apikey` header (=service_role, verified). Idempotency
  via `email_log`; bilingual FR/EN templates embedded. **BLOCKER:** user runs `db/phase8_email.sql`, then
  imports workflows + creates the two Supabase Database Webhooks (INSERT→WF1, UPDATE→WF3) per SETUP.md; we
  test together (I can't validate against their n8n). Deferred: engagement-doc email, Documenso (Option A),
  pre-course welcome, error workflow, public upload page.
- ✅ **Phase 8 emails verified working** (registration welcome email sent). Then reworked per feedback:
  **professional table-based HTML** (branded header, deposit/LMS highlight boxes, contact footer), **no em
  dashes anywhere** (saved as a memory), **deposit amount** in the welcome email (needs `db/lead_deposit_snapshot.sql`
  which adds `leads.deposit_eur` + updates create_lead). Phone in footer is a placeholder to replace.
- ✅ **Contract templates feature** (one default + optional per-course; admin-managed): `db/contract_templates.sql`
  (contract_templates table, public `contracts` bucket, `trainings/leads.contract_template_id`, BEFORE-UPDATE
  trigger auto-attaches template on deposit_paid). New admin `/contracts` page (`ContractTemplates` + actions,
  upload/set-default/remove) + sidebar item. Lead drawer now shows the **auto-attached engagement contract**
  (view + change dropdown), and the file-upload section is reframed as the **returned "Signed document"**.
  `getLeads` falls back gracefully if `contract_templates` isn't created yet.
- ⏳ **USER TODO:** run `db/lead_deposit_snapshot.sql` + `db/contract_templates.sql`; re-paste the updated n8n
  workflow JSON (same webhook paths) + re-map creds; set the real phone in email footers; upload a contract template.
- ⏳ **NEXT:** verify the two new SQL files after user runs them; joint n8n retest.
- ⏳ **NOT DONE:** Phase 5–6, Phase 7 website wiring, n8n (8), Documenso (9), website UI rebuild (11).

**Supabase ops facts (important):**
- **ACTIVE project URL: `https://aablleekwyjqdxsscyeo.supabase.co`** (new-format keys: `sb_publishable_…` = anon, `sb_secret_…` = service_role). Keys are in each app's gitignored `.env.local`. This is the project the **user can access in their dashboard** and where `db/all.sql` was run (schema + trainings + skills + leads + skill_key). Verified: 5 trainings, 8 skills, 4 leads, RLS contract holds.
- **ABANDONED:** `hdvqiiprylrrzrkydtpa` — an earlier project on a DIFFERENT account the user later couldn't access. Do not use its keys. We migrated everything to `aablleekwyjqdxsscyeo`.
- For a fresh project, run **`db/all.sql`** (one-paste bundle of schema + all seeds + skill_key column).
- This project is on a Supabase account the **MCP cannot see** → all DDL/migrations run **manually in the SQL editor** (hand the user a `db/*.sql` file to paste). ⚠️ Always confirm the SQL editor's project ref = `aablleekwyjqdxsscyeo` before running (the user has multiple projects/accounts; wrong-project runs caused churn).
- ⚠️ **Never touch the `addictest` project (`ccravysrkjfuxiocvxmx`)** and do **nothing in Supabase without the user's explicit request** — user's explicit instruction.
- **Restart `npm run dev` after any `.env.local` change** — Next does not hot-reload env vars.
- Node 20 + supabase-js needs the `ws` transport (already wired in `src/lib/supabase.ts`); client-side realtime uses the browser's native WebSocket.
- Anon can't read `leads`, so returning the `ref` to the website needs a `create_lead()` SECURITY DEFINER RPC (add in Phase 7).

---

## 7. Next steps (do these in order when resuming)

Follow **`IMPLEMENTATION_PLAN.md`** phase by phase:
1. **Phase 0** — create the one Supabase project; set env in both repos; add Supabase client.
2. **Phase 1** — run `schema.sql` (Appendix A) + seed the 5 trainings + sample skills.
3. **Phases 2–6** — SaaS: keep auth, wire skills→Claude, build Lead dashboard + Course Management, signing.
4. **Phase 7** — website: wire form→Supabase + trainings←Supabase (keep current UI).
5. **Phases 8–10** — n8n, Documenso, end-to-end demo pass.
6. **Phase 11 (LAST)** — website V2 UI rebuild.

---

## 8. Deadline & waiting-on

- **Deadline:** first SaaS version + website by **end of 2026-07-03**; Maneesh demos at the
  bi-weekly client meeting **Wed 2026-07-08** (bi-weekly).
- **Waiting on Maneesh:** SEO website content (using existing old-site content for now — confirmed
  OK), skills **zip** (`.skill.md` files) + repo link, LMS name/details (demo name = **Gepromed
  LMS**), per-course refundable **deposit amount** (~€400–600; course prices are €1,750–2,950).

---

## 9. Key facts / reference

- This folder = **SaaS / AI console**. Next.js 15 + React 19 + TS + Tailwind. Seeded offline demo,
  no external APIs yet. Local demo creds: `demo@gepromed.com` / `gepromed-demo` (+ manager/admin —
  see README.md).
- Live website demo: **https://gepromed-ai-makers.vercel.app** (course cards + `/trainings` form +
  `/dashboard` organizer space with the 4 pipeline columns, currently mock).
- Client AI-needs file: **`GEPROMED_Besoins_IA.xlsx`** (this folder).
- Meeting transcript: **`Meeting started 2026_07_02 15_25 CEST – Notes by Gemini.docx`** (this
  folder).
- Tools chosen: **Supabase** (free) + **n8n** (paid, already have) + **Documenso** (free) +
  Gmail/Resend (free email).
