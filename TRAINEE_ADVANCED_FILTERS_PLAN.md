# Trainee Management — Read-Only Summary/Detail Subsection (Plan)

> Status: **BUILT, pending user's live verification.** (Scope corrected 2026-07-14 — see §0.)
> Implemented directly from the existing `Lead` model (no new open questions needed — user
> confirmed to build on the pre-existing data model since this feature is read-only).
> Read `SESSION_SUMMARY.md` first for where we last left off across sessions.
> This file is the living spec — update it as decisions change or steps complete (check off items).

## 0. Scope correction (important)

Earlier draft of this plan assumed we'd extend the **existing** `LeadBoard.tsx` (the
action-oriented pipeline: approve/advance stage, verify eligibility, mark attended, etc.).
**That was wrong.** The actual ask, clarified by the user:

> The existing Trainee management section is for **follow-up/actions** on user registration
> → course completion → refunding. What's wanted now is a **separate, new subsection** that is
> **read-only** — a table of trainees for a selected training/course, and clicking a row opens
> a **detail view** (registration date, courses registered, payments, start date, current
> status). **No approve/action buttons.** It has its own search + filter by course, status,
> name.

So this is an **additive summary/reporting view**, not a rebuild of `LeadBoard`. It can live
alongside the existing pipeline (e.g. a tab/toggle on `/trainees`, or a new route like
`/trainees/summary`), sharing the same `Lead` data source but with its own simpler,
non-mutating UI.

## 1. Context (existing code, for reuse — not to be modified for this feature)

- Page: `src/app/(app)/trainees/page.tsx` (server component — fetches leads, contract
  templates, session user, computes KPI stats, renders `PageHeader` + 4 KPI cards + `<LeadBoard>`).
- Action-oriented pipeline UI: `src/components/LeadBoard.tsx` (search, filter popover, stage
  tabs, slide-in action drawer). **Leave this untouched** — it serves a different job
  (advancing leads through stages, verifying documents, etc.).
- Data: `src/lib/leads-data.ts` (`getLeads()`, server-only, Supabase joins on `trainings`,
  `lead_comments`, `documents`, `lead_events`, `email_log`, `contract_template`).
- Shared types/helpers: `src/lib/leads-shared.ts` (`Lead` interface, `Stage`, `Parcours`,
  `computeStats()`, stage-label/tone helpers) — **this is reused as the data source** for the
  new subsection too, since there's still no separate `Trainee` entity.
- Course/session entity: the `trainings` relation on `Lead` (title i18n, dates, city, price/
  deposit, sponsors).
- Registration/payment fields already on `Lead` (confirmed from exploration): `created_at`
  (registration date candidate), `confirmed_at`, `invoice_paid_at`, `deposit_refunded_at`,
  `funding` (self/sponsored), `sponsor_name`, plus the `trainings.start_date`/`end_date` for
  course dates. "Payments" likely maps to `invoice_paid_at` + `deposit_refunded_at` +
  `funding`/`sponsor_name` — see open question in §3 on whether that's sufficient or a
  separate payments concept is needed.

## 2. Goal — new read-only subsection

1. **A table view** listing trainees (leads), one row per trainee, for a **selected
   training/course** (or across all, with course as a filter) — columns likely: name,
   course/session, status, start date, registration date (open to confirm exact columns).
2. **Search + filter bar** scoped to this view: by course, status (stage), name — separate,
   simpler filter set than the existing action popover (no Reminders/Accommodation/etc.
   unless wanted).
3. **Click a row → detail view** (drawer or panel) showing, read-only:
   - Registration date
   - Course(s) registered
   - Payments (amount paid / deposit / refund status)
   - Start date / end date (from the course/session)
   - Current status (stage, in plain language — not the pipeline's action stepper)
   - **No action buttons** (no approve, no advance-stage, no verify — this is view-only)

## 3. Open questions (need user confirmation before/while building)

- [ ] **Where does this live?** A new tab/toggle within `/trainees` (e.g. "Pipeline" vs.
      "Summary"), or a separate route (e.g. `/trainees/summary`)? Recommend: a tab within the
      existing page — keeps navigation simple, avoids adding a new sidebar entry.
- [ ] **Exact table columns** wanted (name, course, status, start date — confirm the full
      list and order)?
- [ ] **"Payments" detail** — is `invoice_paid_at` / `deposit_refunded_at` / `funding` /
      `sponsor_name` sufficient, or is there a payment amount/history not yet in the `Lead`
      model that needs to be shown?
- [ ] **"Courses registered"** — can a trainee have more than one course/training, or is it
      always exactly one (`training_id` is currently a single FK on `Lead`)? If multiple is
      needed, that's a data model gap, not just a UI one.
- [ ] **Status wording** — should this view show the raw internal `stage` (e.g.
      `deposit_paid`) or a friendlier label set distinct from the pipeline's stage tabs?

## 4. Proposed approach

1. **New client component**, e.g. `src/components/TraineeSummaryTable.tsx` — separate from
   `LeadBoard.tsx` entirely (different job, avoids risk of breaking the existing pipeline).
   Takes the same `leads` (+ `trainings`) data already fetched on the page.
2. **New filter state local to this component** — search (name), course dropdown, status
   dropdown. Simple `useState` + `useMemo`, same lightweight pattern already used in
   `LeadBoard` for its search/filters, but a fresh, smaller implementation (no action-related
   filters).
3. **New read-only detail panel**, e.g. `src/components/TraineeSummaryDrawer.tsx` — visually
   can reuse the slide-in drawer CSS pattern from `LeadBoard.tsx` (scrim + `<aside role=
   "dialog">` + translate-x animation) since that's a proven, already-verified pattern, but
   as a **new, separate, action-free component** — not a shared instance with the pipeline's
   `LeadDrawer` (mixing "view" and "act" affordances in one drawer risks accidental actions
   and complicates that component further).
4. **Toggle/tab on `/trainees` page** — add a simple client-side tab switch ("Pipeline" /
   "Summary") on the page, rendering either `<LeadBoard>` (existing) or the new
   `<TraineeSummaryTable>` (new). Page itself stays a server component fetching data once;
   a thin client wrapper handles which view to show.
5. **No schema changes expected** unless §3 open questions on payments/multi-course reveal a
   gap.

## 5. Step-by-step build order

- [x] Build `TraineeSummaryTable.tsx`: table + search/filter bar (course/session, parcours,
      status, name). File: `src/components/TraineeSummaryTable.tsx`.
- [x] Build `TraineeSummaryDrawer.tsx`: read-only detail panel (registration date = `created_at`,
      course/session with dates, payments/funding, current status + progress bar) — no action
      buttons. File: `src/components/TraineeSummaryDrawer.tsx`.
- [x] Add tab/toggle to `/trainees` page to switch between existing pipeline and new summary
      view. New file `src/components/TraineeViews.tsx` (client wrapper holding the tab state,
      renders `<LeadBoard>` or `<TraineeSummaryTable>`); `page.tsx` now renders `<TraineeViews>`
      instead of `<LeadBoard>` directly.
- [x] Typecheck (`npx tsc --noEmit`) — clean.
- [ ] **Manual browser verification by user** (route is auth-gated, couldn't fully verify via
      curl): log in, go to `/trainees`, click "Résumé trainees" tab, try filter combinations
      (parcours, course, status, name search), click a row, confirm the drawer shows correct
      read-only detail with no action buttons.
- [x] Plan + `SESSION_SUMMARY.md` updated.

### Implementation notes (decisions made without re-asking, since read-only + no schema change)

- **Columns**: Trainee (name+email), Formation (course), Statut (stage badge), Inscrit le
  (`created_at`), Début (`trainings.start_date`).
- **"Courses registered"**: implemented as a single course per trainee, matching the current
  `Lead.training_id` single-FK data model — no multi-course support exists in the schema, so
  this wasn't invented.
- **"Payments"**: shown as funding type (self/sponsored) + sponsor name, training price/deposit
  amounts, and the relevant paid-at timestamp (`invoice_paid_at` for HelpMeSee,
  `deposit_contract_at` for Bootcamp) + refund status (`deposit_refunded_at` /
  `caution_waived`) — the richest payment picture available from existing fields, no new
  payment-amount/history field existed to surface beyond this.
- **Where it lives**: a tab ("Suivi & actions" / "Résumé trainees") on the existing `/trainees`
  page, not a separate route — per the plan's recommendation, to avoid a new sidebar entry.

## 6. Explicitly out of scope (unless user says otherwise)

- Any changes to `LeadBoard.tsx` or `LeadDrawer` (the existing action pipeline) — this is
  purely additive.
- Any Supabase schema/migration changes (pending open questions on payments/multi-course).
- Translating this new UI's strings into the FR/EN i18n system — separate follow-up if wanted.
- Building a generic reusable `Drawer`/`Modal`/`FilterBar` library — the new drawer/filter
  bar are scoped, standalone components for this feature only.
