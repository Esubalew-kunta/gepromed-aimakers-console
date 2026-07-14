# Engineering section — parity build-out plan

> **Goal:** bring the Engineering section (`/engineering`) up to the same richness as
> Trainee management (which was completed in Session 2). Scope decision (locked with user
> 2026-07-14): **FULL PARITY — all 4 phases.**

## 0. Current state (as read 2026-07-14)

- **Route:** `src/app/(app)/engineering/page.tsx` (server) → `EngineeringBoards.tsx` (client).
- **Board:** 3 kind pills (Explant / Test / Equipment), flat row list, inline actions:
  advance stage, set explant variant (hospital/industrial), exit ("sortie"), reopen.
- **Backend (good, no rework):** shared pipeline engine `src/lib/pipeline/core.ts` +
  `src/lib/pipeline/engineering.ts` (3 pipelines: explant w/ 2 variants, test, equipment).
  Table `engineering_requests` (`db/engineering_requests.sql`): anon-intake RPC
  `create_engineering_request`, human ref `ENG-000001`, `reminders_active`, `exit_reason`/
  `exited_at`, `notes` (text), `meta` (jsonb).
- **Actions:** `src/app/(app)/engineering/actions.ts` — `advanceEngStage`, `setEngVariant`,
  `setEngExit`, `reopenEng`.

### The gaps (vs. Trainee management)
1. **i18n: 100% French-hardcoded.** Only `nav.engineering` key exists in `i18n.tsx`. The
   pipeline stage `label`/`short`/`advanceLabel`, variant labels, KIND labels, all buttons
   ("Sortie", "Rouvrir", "Terminé", "Cas :"), and the empty state are inline French.
2. **No detail drawer.** Rows are inline-only; `notes`, `meta`, `org_type`, `desired_date`,
   timeline (created/updated), reminders state are barely surfaced or not at all.
3. **No KPI row, no stats charts.**
4. **No search / filters** beyond the 3 kind pills (no stage filter, no active/exited filter,
   no date filter).
5. **No comments / activity log.** `engineering_requests` has only free-text `notes`; there is
   no `engineering_comments` / `engineering_events` analog to `lead_comments` / `lead_events`.
6. Exit/reopen already exists — the analog of trainee cancel/reinstate. ✅ keep.

---

## 1. Phase 1 — i18n parity  *(self-contained, lowest risk, ship first)*

Make Engineering respect the FR/EN toggle like the rest of the app.

- **Pipeline defs → bilingual.** Convert `label`/`short`/`advanceLabel` (in `StageDef`) and
  variant `label` from single French strings to `{fr,en}` — mirroring how `STAGE_HELP` was
  made bilingual in `LeadBoard.tsx`. Two viable shapes:
  - (a) Change `StageDef`/`VariantDef` fields to `{fr,en}` and update `core.ts` helpers
    (`stageLabelOf`, etc.) to take a `lang` arg. **Preferred** — keeps translations next to
    the stage definitions, and `core.ts` is engineering-only-ish for these fields (trainees
    build their own label maps). *Must verify no trainee code depends on the single-string
    shape of these helpers before changing them* — if it does, add lang-aware overloads
    rather than break callers.
  - (b) Leave defs as stable keys, add an `engineering.stage.*` dict block in `i18n.tsx`.
    More churn in `i18n.tsx`, decouples labels from defs.
  Decide at build time after grepping `core.ts` helper callers.
- **Board/page → `useT()`.** `EngineeringBoards.tsx` + `page.tsx` header: KIND labels, all
  buttons, empty-state, "Cas :", "Terminé", the not-configured banner.
- **New dict keys:** `engineering.*` namespace (kinds, actions, empty, drawer later).
- **Gate:** `npx tsc --noEmit` clean; FR/EN toggle flips every visible string.

## 2. Phase 2 — Detail drawer

Click a row → drawer (mirror trainee drawer pattern, but engineering fields).

- New `EngineeringDrawer.tsx`: ref, requester name/email, institution, org_type, desired_date,
  full stage timeline/stepper (reuse pipeline stage list), notes, `meta` (rendered as a small
  key/value list), reminders state, created/updated, exit reason if exited.
- Move the advance/variant/exit/reopen actions into the drawer (declutter rows → rows become
  clickable summaries with just a stage badge), OR keep inline + add drawer as read-detail.
  **Recommend:** actions live in the drawer (like the trainee action drawer), rows show a
  compact summary + stage badge.
- Fully i18n'd from the start (`engineering.drawer.*`).
- **Gate:** `tsc` clean; drawer opens, shows all fields, actions work from inside it.

## 3. Phase 3 — KPIs + search/filters

- **KPI row** `EngineeringKpiRow.tsx`: total, per-kind counts, active vs. exited, done/terminal.
  Reactive to the current filter set (mirror `TraineeKpiRow` + `onVisibleChange` pattern).
- **Search + filters** in the board toolbar: text search (ref, name, email, institution),
  stage filter (grouped by kind via optgroup like the Summary tab fix), active/exited toggle,
  date-range on `created_at` (reuse the pill-style date control from `TraineeSummaryTable`).
- **Gate:** `tsc` clean; filters narrow correctly, KPIs react.

## 4. Phase 4 — Stats + comments/activity

- **Stats** `EngineeringStatsChart.tsx`: by kind (bars), by stage (bars), by month (line) —
  reuse the dependency-free inline-SVG `Bar`/`LineChart`/`Donut` components from
  `TraineeStatsChart.tsx` (extract/share if clean, else copy the tiny components).
- **Comments/activity (schema addition):** new `db/engineering_comments.sql` mirroring
  `lead_comments` (`engineering_request_id`, `author`, `body`, `created_at`) + optional
  `engineering_events` mirroring `lead_events` for stage-change history. Server actions
  `addEngComment` + read in the drawer. **Open question for user:** do we want a full comments
  table, or is appending to the free-text `notes` field enough? Plan assumes a real
  `engineering_comments` table (consistent with trainees). Requires running the migration on
  Supabase.
- **Gate:** `tsc` clean; charts render, comment add/read works after migration.

---

## Cross-cutting decisions (locked)
- Reuse the shared pipeline engine — do NOT fork per-kind boards.
- Every new string i18n'd from the start (don't repeat the trainee "translate later" debt).
- Admin-gating: match whatever gating the trainee actions use (check `LeadBoard` action-drawer
  admin checks and apply the same to engineering mutating actions).
- Charts stay dependency-free (inline SVG), consistent with the rest of the codebase.

## Deploy steps this plan introduces
- Phase 4 only: run `db/engineering_comments.sql` on Supabase (project `hdvqiiprylrrzrkydtpa`).
- Phases 1–3 are app-only, no DB changes.

## Build order
Phase 1 → verify → Phase 2 → verify → Phase 3 → verify → Phase 4 (schema last).
Each phase ends `tsc` clean and is independently shippable.

> **Status 2026-07-14:** Phases 1–4 BUILT (UI parity + comments). The section below
> (Phase 5) is the remaining *real-need* work from the master plan — what makes it
> professional, not just a tidy tracker. NOT yet built; some items gated on client answers.

---

# Phase 5 — real-need completion (client SOP)

> Cross-refs: `GEPROMED_MASTER_PLAN.md` **Phase 5** (lines ~246-251) + **Part VIII Open
> Questions Q5-Q7**. Phases 1-4 above gave the Engineering board trainee-level *UI parity*;
> this phase delivers the *functional* behaviour the client's SOP actually requires.

## 5.1 Tiered scope

**Tier 1 — turns the tracker into a real system**
- **Notifications/emails via the shared engine** (MP Phase 5; Q6): 48h acknowledgement of
  receipt (test), 15-day satisfaction relance (test), annual satisfaction sweep (explant),
  stage-change notices. Reuse trainee `notification_templates` + `email_log` + notify fns.
  - **✅ BUILT (2026-07-14) — staff-assist tier:** polished **bilingual (FR/EN)** templates for
    every 📧 stage in `src/lib/pipeline/engineering-emails.ts` (explant: prospection/reception/
    first_report/follow_up · test: request/report/done · equipment: request/scheduled), surfaced
    in the drawer as an editable "Email to requester" panel (prefilled subject+body, Copy,
    open-in-mail to the requester). Sends from the staff mailbox today — **no infra needed.**
  - **✅ BUILT (2026-07-14) — real send:** "Send via n8n" button in the drawer → `sendEngEmail`
    server action → `ENG_EMAIL_WEBHOOK_URL` (n8n workflow `12-engineering-stage-email.json`,
    Gmail node). Manual, review-then-send. Inert + hinted until the webhook URL + Gmail cred are
    set (see `n8n/SETUP.md` PART E).
  - **⏳ Still deferred (needs Q6 + Q4 mailbox/n8n):** *auto*-send + the timed sweeps (48h AR,
    15-day / annual relances). The SAME template strings feed the notification engine when
    greenlit — only the trigger/scheduler is added.
- **In-app documents** (Q5): hospital convention, industrial contract/NDA, quotes/devis,
  reports, invoices — mirror the trainee `documents` table + upload flow (attach/version/audit).

**Tier 2 — correctness & compliance**
- **Business gates** (MP Phase 5): industrial explant report **gated on active contract**;
  invoice-on-delivery; devis 30-day validity; protocol-after-order (test). Board currently
  advances freely with no guardrails.
- **Roles / ownership + admin gating** (Q5): assign a "Responsable de plateforme" owner;
  admin-gate mutating actions (mirror trainee admin gating).

**Tier 3 — data richness & polish**
- Per-report entries + sample traceability (MP Phase 5) — add related `engineering_reports`/
  traceability rather than re-splitting the unified table.
- Wire the dormant `reminders_active` sweep + realtime updates (trainees have both).
- Requester status-lookup page (`ENG-000042` → progress).
- Website intake real content (MP Phase 4, 🔴): explant instructions (10% formol + fiche →
  4 rue Kirschleger, `explant@gepromed.com`) + two-form test split (prestation vs machine slot).
- Equipment-rental payment decision (Q7): invoiced or free/internal?

## 5.2 Client decisions that GATE this phase (MP Part VIII)
- **Q5** — documents tracked in-app? single platform owner?
- **Q6** — auto-send acknowledgement/satisfaction emails now, or later?
- **Q7** — is equipment rental invoiced?

## 5.3 Per-stage remainder audit

For each stage, "remainder" = what's still missing to make *that step* professional per SOP.
Legend: 📧 email · 📎 document · 🚦 gate · 🔬 traceability · none = stage is complete as-is.

### Explant Analysis (hospital / industrial)
| Stage | Remainder to add |
|---|---|
| prospection | 📧 auto-acknowledge the enquiry |
| formalisation | 📎 upload+track the convention (hospital) / contract+NDA (industrial); this doc becomes the 🚦 for the industrial report |
| reception | 📎/🔬 log receipt of the physical specimen (10% formol + fiche) · 📧 "sample received" |
| first_report | 📎 attach the report · 🚦 industrial: block send unless contract active · 📧 "report sent" |
| complementary | 📎 attach complementary report (+ optional quote/invoice) |
| follow_up | 📧 annual satisfaction survey (wire reminder sweep) |
| done | none (optional archive) |

### Test Platform
| Stage | Remainder to add |
|---|---|
| request | 📧 48h acknowledgement of receipt (AR) |
| qualified | none (internal Go/No-Go note) |
| quote | 📎 devis document · 🚦 30-day validity window |
| order | 📎 protocol drawn up after order · 🔬 start sample traceability |
| execution | 🔬 sample traceability records |
| report | 📎 ISO-13485 report · 📎 invoice-on-delivery · 📧 "report delivered" |
| done | 📧 15-day satisfaction relance (wire reminder sweep) |

### Equipment Rental
| Stage | Remainder to add |
|---|---|
| request | 📧 acknowledge (desired_date already captured) |
| qualified | none (feasibility note) |
| scheduled | 📧 booking confirmation · 📎 invoice if paid (Q7) |
| habilitation | 📎 certification/habilitation proof |
| completed | 🔬 usage/assistance log · 📎 invoice if paid (Q7) |
| done | none |

## 5.4 Build order for Phase 5
Answer Q5-Q7 → **5a** documents table + upload (Tier 1) → **5b** notification templates +
stage-change/AR/satisfaction sends (Tier 1) → **5c** business gates + admin/owner (Tier 2) →
**5d** per-report/traceability, reminder sweep, realtime, status-lookup, website content (Tier 3).
Each sub-phase ends `tsc` clean and independently shippable. New migrations
(`engineering_documents.sql`, `engineering_reports.sql`) run on Supabase as introduced.
