# Trainee Management — Staff Actions Plan (Phase 3)

> Status: **CORE BUILT (2026-07-14)** — `cancelRegistration` + `reinstateLead` shipped.
> Deferred items (step-back, reassign, archive) remain unbuilt by design. Revised after
> reading the Gepromed docs + user clarification — see §0. All actions live on the
> **Pipeline tab** (`LeadBoard.tsx` / `actions.ts`); Summary/Courses stay read-only.
>
> **Requires migration:** run `db/trainee_cancel.sql` on Supabase (adds `leads.cancelled_at`)
> before the cancel/reinstate buttons work against a live DB. Until then the column is
> absent and cancel is a no-op / errors on the update — the migration is the one deploy step.

## 0. Guiding principle (confirmed from the docs + user)

**This platform tracks and communicates; it does NOT move money or auto-decide outcomes.**
Confirmed from `db/notification_templates_bodies.sql` and user:

- The €200 Bootcamp deposit is *"fully refundable at the end of the training"* — a **manual,
  email-driven** process. Staff advance a trainee to `deposit_refunded` / `done` only **after
  they've actually refunded it outside** the platform. The stage is a record of a manual act,
  not a trigger for one.
- **Attendance is judged manually.** If Gepromed decides a trainee didn't attend, staff
  simply **don't advance** them to completed/refunded. `setAttended(false)` already exists as
  that manual flag.
- **On cancel / not-interested, the deposit is NOT refunded to the trainee** — forfeiture is
  implicit (they exited before the `deposit_refunded` stage) and, like all money here, handled
  outside the app. **No refund/forfeit logic belongs in the platform.**

This *removes* the money-modelling complexity from the earlier draft of this plan. The new
actions are purely **operational/tracking**: record the right state, release the seat, log an
event, optionally fire an existing email template. That's it.

## 1. What already exists (do not rebuild)

Server actions in `src/app/(app)/trainees/actions.ts` (all `"use server"`, each ends with
`revalidatePath("/trainees")`): `advanceStage` (forward only), `setInterest`,
`setNotInterested` (soft exit → `not_interested_at`, reminders off), `toggleReminders`,
`setCautionWaived`, `setAttended` (manual attendance flag), `verifyEligibility`,
`setElearningCompleted`, `addComment`, `uploadDocument`, `verifyAndConfirm`,
`setLeadContractTemplate`, `getDocumentUrl`, `deleteLead` (hard delete, admin-only).

**Mechanism to respect:** `trainings.enrolled` is maintained by a DB trigger `bump_enrolled`
(`db/schema.sql`): **+1 entering `confirmed`, −1 leaving `confirmed`**, and recomputes
`status` (open/full). So moving a confirmed trainee out of `confirmed` **auto-frees the seat**
— don't decrement in app code, and route a cancel *through* a stage change so the trigger fires.

## 2. Actions to add (revised — tracking only, no money logic)

### 2a. Cancel / withdraw registration — the real gap
Distinct from "not interested" (a lead who never engaged) and from delete (destroys the
record). A **registered trainee who pulls out**. What the action does — and *only* this:

- Set a **new `cancelled` exit status + `cancelled_at`** (kept distinct from `not_interested`
  so reports can separate "never engaged" from "registered then withdrew" — operationally
  very different). Turn reminders off.
- **Release the seat**: because `cancelled` ≠ `confirmed`, the stage change fires
  `bump_enrolled` → `enrolled` decrements automatically. Nothing to compute.
- **No deposit/refund handling** — per §0, forfeiture is implicit and external. We just
  record the cancellation; whatever happens to the €200 happens outside.
- Capture a **reason** for reporting (recommend a small enum: personal / medical / employer /
  schedule / other — the drawer's comment box can hold free-text detail alongside).
- Optionally fire an existing/soon-added **cancellation-acknowledgement email** template
  (staff-triggered, logged in the Communications timeline like every other stage email).

### 2b. Step back / undo a mistaken advance
`advanceStage` is forward-only. Add a guarded **"move back one stage"** (admin-only, logs an
event). Stepping back out of `confirmed` re-releases the seat via `bump_enrolled` — correct
behaviour, just needs to be understood. Pure operational correction, no money.

### 2c. Reinstate an exited trainee
Clean **"reactivate"** clearing `not_interested_at` / `cancelled_at`, putting them back in
the pipeline — for mistaken exits or genuine change-of-mind. Small.

### 2d. Reassign to another session/course
`training_id` is fixed at signup (+ `training_title_snapshot`). Admin action to move a
trainee to a different `training` (e.g. their session was cancelled). **Trickiest** because
of `bump_enrolled`: reassigning a *confirmed* trainee must decrement the old course and
increment the new one — do it explicitly or via a brief stage round-trip. Build last.

### 2e. Archive vs. hard-delete (compliance)
`deleteLead` is a permanent hard delete that destroys audit history. Given medical training +
GDPR (skills docs discuss consent/withdrawal), split into: **Archive** (soft-delete via an
`archived_at` flag, hidden from default lists, history retained) for everyday cleanup, and
keep the existing hard delete as a reserved, explicitly-confirmed **GDPR-erasure** path.

## 3. Decisions (resolved from the docs — "what is supposed to be done")

Made these calls from the SOP + platform nature rather than asking further; flagged so they
can be overridden:

- **Cancel exit state → new dedicated `cancelled` + `cancelled_at`.** The SOP lifecycle
  already separates every meaningful state; conflating "registered then withdrew" with
  "never engaged" (`not_interested`) would break the reporting the Summary/Courses tabs now
  provide. Dedicated state.
- **Cancellation reason → free-text via the existing comment box, NOT a new enum.** The
  platform is deliberately lightweight and staff-driven; the docs model no structured
  cancellation taxonomy. A comment on cancel is enough; skip the migration/UI an enum needs.
- **Cancellation email → none; communicated manually.** Every existing email template maps to
  a *forward* SOP step; there is no cancellation template, and the user confirmed cancellation
  handling is manual. Record the state only.
- **Archive layer → DEFER.** Not required for the core need and adds scope; keep the existing
  hard `deleteLead` (admin-only) as the single removal path for now. Revisit if a GDPR
  erasure vs. audit-retention need becomes concrete.
- **Admin gating → cancel / step-back / reassign / delete are admin-only.** Reinstate (undo a
  mistaken exit) also admin-only since it reverses a destructive state change.

## 3b. Resulting scope — CORE (build now) vs. deferred

**CORE (the thing actually supposed to be done):**
1. **`cancelRegistration(leadId, reason?)`** — dedicated `cancelled` state, seat auto-released
   via `bump_enrolled`, reminders off, optional comment reason, event logged. No email, no
   money logic.
2. **`reinstateLead(leadId)`** — because once you can cancel, you need to undo a mistaken
   cancel/exit cleanly (clears `cancelled_at`/`not_interested_at`, returns to pipeline).

**DEFER (valuable but not the ask; revisit later):** step-back a stage (2b), reassign session
(2d, trigger-fiddly), archive vs. hard-delete (2e).

## 4. Proposed build order (after §3)

1. **Migration** (small): add `cancelled` to the stage/exit CHECK constraint + `cancelled_at`
   (+ `cancel_reason` if enum chosen) (+ `archived_at` if 2e confirmed). `bump_enrolled`
   unchanged — it already frees the seat on any move out of `confirmed`.
2. **`cancelRegistration(leadId, reason)`** — set `cancelled` + timestamp + reason, reminders
   off, log event, (optional) send ack email. Seat release is automatic via the trigger.
3. **`stepBackStage(leadId)`** — admin, logs event (2b).
4. **`reinstateLead(leadId)`** (2c).
5. **`archiveLead(leadId)`** + keep `deleteLead` as GDPR-erasure (2e) — if confirmed.
6. **`reassignTraining(leadId, newTrainingId)`** (2d) — last, handle the enrolled-trigger
   interaction explicitly.
7. **UI** in `LeadDrawer` action area (Pipeline tab only): each action with the right
   confirmation + admin gating, fully i18n'd (`pipeline.action.*`), event-logged so the
   Communications/history reflects them.

## 5. Out of scope (explicitly, per §0)
- Any refund/forfeit **money logic or execution** — the platform records states; all deposit
  handling is manual/external.
- Any automated attendance decision — attendance is a manual staff judgement
  (`setAttended`), and non-attendance is expressed simply by *not advancing* to done/refunded.
- Any change to the read-only Summary/Courses tabs.
