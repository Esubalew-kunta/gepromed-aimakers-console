# Trainee Management — Course Rollup + Follow-up Plan (Phase 2)

> Status: **Phase A BUILT** (Courses tab — `CourseRollupTable.tsx`, i18n'd). **Phase B
> BUILT** (KPI reactivity refactor + cross-tab click-through). Both phases shipped.
> Builds on the completed work in `TRAINEE_ADVANCED_FILTERS_PLAN.md` (Pipeline tab +
> Summary tab, both FR/EN translated). Read `SESSION_SUMMARY.md` for full history.
>
> **Answered:** Bootcamp tuition (beyond the €200 deposit) is confirmed **manually handled
> outside this platform** — not tracked in any external system this app could integrate
> with. So "Deposits collected" is the permanent ceiling for Bootcamp financials in this
> view, not a placeholder pending a future integration.

## 1. Why this phase

The current `/trainees` page has two tabs, both trainee-centric (one row = one trainee):
**Pipeline** (action-oriented, `LeadBoard.tsx`) and **Summary** (read-only reporting,
`TraineeSummaryTable.tsx`). Neither answers course-centric questions: *is this session full?
How much revenue has it collected? Which trainees haven't paid yet?* That data already
exists on `trainings` (`capacity`, `enrolled`, `price_eur`, `deposit_eur`) and on `Lead`
(`invoice_paid_at`, `deposit_refunded_at`, `funding`) but nothing rolls it up per course.

## 2. Goal — new "Courses" tab (third tab alongside Pipeline / Summary)

One row per **course/session** (not per trainee), showing:
- Course name, city, date range (`trainings.title`, `city`, `start_date`, `end_date`)
- **Fill rate**: `enrolled` / `capacity` as a bar, same visual language as
  `TraineeStatsChart.tsx`'s bars
- **Financial rollup — corrected after re-checking the data model (see §2a below):
  reported as two separate, honestly-labeled numbers, not one blended "revenue" figure.**
- **Outstanding count**: precise per-parcours definition in §2a — this is NOT simply
  "unpaid trainees," the two parcours mean different things by it.
- Click a course row → reuses the existing **Summary tab's filter-by-course** (already
  built) rather than a new detail view — i.e. clicking a course row switches to the Summary
  tab pre-filtered to that course. No new drawer needed. (Lower priority than the table
  itself — see §4, item 3 is now marked optional.)

### 2a. Correction: the "revenue collected" metric as originally proposed is wrong

Re-checked `db/schema.sql` and `LeadBoard.tsx` before writing the build order. Finding:

- **HelpMeSee**: `invoice_paid_at` genuinely marks the **full training price** (`price_eur`)
  as paid by the foundation. Safe to use directly as "revenue collected" for this parcours.
- **Bootcamp**: the system only tracks a **€200 refundable deposit** (`caution`,
  `deposit_contract_at` / `deposit_refunded_at`). There is **no field anywhere** recording
  whether the actual tuition (`price_eur`) was paid — that apparently happens outside this
  system (on-site, separate invoicing/accounting). Treating "deposit received" as "tuition
  revenue collected" for Bootcamp would silently overstate collected revenue by conflating
  a €200 deposit with the full course price, which could mislead finance/admin decisions.

**Corrected metric definitions, kept separate per parcours instead of blended:**
- HelpMeSee courses: show **"Invoices paid"** = count/€ sum where `invoice_paid_at` is set,
  vs. `enrolled × price_eur` expected. This is accurate as originally planned.
- Bootcamp courses: show **"Deposits collected"** = count/€ sum where a deposit was
  received (`deposit_contract_at` set or `caution_waived`), vs. `enrolled × deposit_eur`
  (NOT `price_eur` — deposit is the only amount this system actually tracks). Label this
  clearly as deposits, not course revenue, in the UI.
- **Outstanding, per parcours**: HelpMeSee = invoice not yet marked paid. Bootcamp =
  deposit not yet received and not waived. Two different questions; don't merge into one
  "unpaid" count across both parcours without labeling which kind of unpaid it is.

**Open question for the user before building this part:** is Bootcamp tuition payment
tracked anywhere else (separate invoicing/accounting tool) that could eventually feed a true
revenue number back into this system? If yes, that's a future integration, not something to
fake now. If no, "Deposits collected" is the honest ceiling of what this view can show for
Bootcamp financials.

## 3. Two separate pieces of work, not one — split by risk, not bundled

Re-reviewing the sequencing: the original plan bundled an additive, low-risk table
(Courses tab) with a structural refactor (lifting filter state for KPI reactivity) as if
they were one unit of work. They aren't, and shipping them separately means the useful part
(Courses tab) isn't blocked on the riskier part (state refactor). Split into:

**3a. Courses tab (additive, low risk, ship first)**
A new tab reading the same `leads`/`trainings` data already fetched on the page — no change
to `LeadBoard.tsx`, `TraineeSummaryTable.tsx`, or the page's existing data flow. Purely
additive, so it can land and be verified on its own.

**3b. KPI row reactivity (structural, higher risk, separate follow-up)**
Currently the 4 KPI cards on `/trainees` (`TraineesPageHeader.tsx`) always show totals
across *all* leads, regardless of which tab or filter is active — a leftover from before
the Summary tab existed. Fixing this means lifting filter state out of `LeadBoard` and
`TraineeSummaryTable` (today each owns its filters privately) into a shared parent —
realistically promoting `TraineeViews.tsx` from a dumb tab-switcher into a state owner, or
introducing a small context. That's a real refactor of two already-working components, not
a pure addition, so it deserves its own careful pass (and its own verification) rather than
riding along with 3a. Desired end state once done:
- Pipeline tab active → KPIs reflect `LeadBoard`'s current filter/tab selection.
- Summary tab active → KPIs reflect `TraineeSummaryTable`'s current filters.
- Courses tab active → KPIs show course-level aggregates instead of trainee counts.

## 4. Proposed approach

1. **`CourseRollupTable.tsx`** (new client component) — takes the same `leads` array already
   fetched on the page, groups by `training_id`, computes fill rate and the two
   parcours-specific financial metrics from §2a per group using plain `Lead`/`trainings`
   fields (no new queries, no schema changes).
2. **Wire a third tab** in `TraineeViews.tsx`: "Suivi & actions" / "Résumé trainees" /
   "Formations" (FR) — "Follow-up & actions" / "Trainee summary" / "Courses" (EN), following
   the same `useT()` pattern already in place.
3. **Cross-tab click-through** (optional, nice-to-have, not required for 3a to be useful):
   clicking a course row sets a shared "course filter" value that `TraineeViews` passes down
   as an initial filter to `TraineeSummaryTable` when switching to the Summary tab. Adds
   coupling between three components for a convenience feature — do this only after 3a is
   verified useful on its own, not as a blocking requirement.
4. **KPI reactivity** — tracked separately as §3b, not bundled with 3a.
5. **i18n**: new dict keys under `courseRollup.*`, following the exact same pattern as
   `traineeSummary.*`/`traineeStats.*` — built bilingual from the start, not retrofitted.
6. **No schema changes** — everything needed (`capacity`, `enrolled`, `price_eur`,
   `deposit_eur`, paid timestamps) already exists on `trainings`/`Lead`.

## 5. Deferred to a later phase (explicitly out of scope here)

Flagged in the earlier discussion but **not** part of this plan — each is a bigger, separate
decision:

- **Deadline/SLA alerts** ("this trainee has been stuck at this stage for N days past the
  J-30/J-15 SOP window") — needs a decision on what threshold counts as "late" per stage,
  which is a business-rule question for the client, not a UI addition.
- **CSV/Excel export of the Summary table** — mechanically simple (mirrors the Expense
  Sheet export pattern already in the codebase) but deliberately deferred until the Courses
  tab lands, so export covers the final column set instead of being built twice.
- **Bulk actions on the Pipeline tab** (e.g. toggle reminders for a filtered set) — this
  changes the action-oriented pipeline's behavior/risk profile (mass mutations), unlike
  everything else in this plan which is read-only aggregation. Needs its own review on
  safeguards (confirmation step, audit logging) before being scoped.
- **True Bootcamp tuition-revenue tracking** — confirmed not possible; tuition is
  permanently manual/outside this platform (see status note at top of this file). Removed
  as a future possibility, not just deferred.

## 6. Step-by-step build order

**Phase A — BUILT:**
- [x] Confirmed: Bootcamp tuition is manually handled outside this platform (permanent,
      not pending integration).
- [x] Built `CourseRollupTable.tsx` — groups `leads` by `training_id`, computes fill rate
      (`enrolled`/`capacity` from `trainings`, which the schema comment says are
      trigger-maintained) and the two parcours-specific financial metrics from §2a
      ("Invoices paid" for HelpMeSee, "Deposits collected" for Bootcamp — never blended),
      plus per-parcours outstanding counts. Added `capacity`/`enrolled` to the
      `trainings` select in `leads-data.ts` and to the `Lead["trainings"]` type in
      `leads-shared.ts` (weren't previously selected).
- [x] Added third tab ("Formations" / "Courses") to `TraineeViews.tsx`.
- [x] Wired full i18n (`courseRollup.*` in `src/lib/i18n.tsx`), including a visible note
      in the UI itself explaining the Bootcamp deposit-vs-tuition distinction so it isn't
      a silent caveat only documented in this file.
- [x] `npx tsc --noEmit` clean.
- [ ] **User to manually verify in-browser**: fill rate bar renders correctly, financial
      figures match a known course by hand-check, FR/EN toggle updates every string
      including the tuition note, outstanding counts look right for both parcours.
- [ ] Update this plan + `SESSION_SUMMARY.md`.

**Phase B — BUILT:**
- [x] **KPI reactivity refactor.** `LeadBoard.tsx` and `TraineeSummaryTable.tsx` each gained
      an optional `onVisibleChange?: (visible: Lead[]) => void` prop, called from a
      `useEffect` whenever their internally-computed `visible` list changes — a
      non-invasive addition (both components still own their filter state privately;
      nothing about their existing filter behavior changed). `TraineeViews.tsx` now holds
      a `visibleLeads` state fed by whichever child is mounted, computes
      `computeStats(visibleLeads)`, and renders the KPI row itself. The KPI row moved out
      of `TraineesPageHeader.tsx` (now just title/description/config-banner) into new
      `TraineeKpiRow.tsx`, since `page.tsx` is a server component and can't own reactive
      client state. Courses tab has no trainee-level filters of its own, so switching to it
      resets `visibleLeads` back to the full `leads` list (a small `useEffect` keyed on
      `view`).
- [x] **Cross-tab click-through.** `CourseRollupTable.tsx` gained an optional
      `onSelectCourse?: (trainingId: string) => void`, wired so clicking a course row makes
      `TraineeViews` switch to the Summary tab and pass that course's id as
      `TraineeSummaryTable`'s new `initialCourseFilter` prop (pre-selects the course
      dropdown). `TraineeSummaryTable` is remounted via a `key={selectedCourseId}` on
      re-selection so the initial filter reliably takes effect.
- [x] `npx tsc --noEmit` clean across the whole project after both changes.
- [ ] **User to manually verify in-browser**: KPI row updates live as filters/tabs change
      on Pipeline and Summary, resets to global totals on Courses, and clicking a course row
      correctly jumps to Summary pre-filtered to that course.
- [ ] Update `SESSION_SUMMARY.md` once verified.
