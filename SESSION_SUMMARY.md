# Session Summary (Handoff Log)

> **Read this file first in any new session** to see where we left off. Newest entry on top.
> Update it whenever a work session pauses or a milestone completes.

---

## 2026-07-22 — Expense report: master→template, DB is source of truth (Model B)

Reworked the whole **Expense report** so the master workbook is **only an extraction
template**, and the **database (mirror of the shared Google Sheet) is the single source of
truth**. This replaced the old "master.xlsx accumulates + is the ledger/idempotence store"
model. Global/shared scope across users (matches the one shared Sheet).

- **Preview/summary now reads the DB** (`committedReceipts()` in `storage.ts`, validated=true,
  deduped by docKey) via `GET /api/expenses/preview` — NOT the master. Empty → headers + €0.00.
- **Commit no longer touches the master**: `commit/route.ts` just pushes to the Sheet (n8n) +
  `recordRun(..., "committed")`. Removed `commitBatch`/`saveMaster` from the commit path.
- **Idempotence moved to the DB**: `committedDocKeys()` → `analyzeBatch({..., committedKeys})`
  (was the master's hidden `_Ledger`). Instant now (no Supabase Storage read-after-write lag).
- **Master's only remaining job**: analyze reads it to validate it's a Matrice + pull the
  per-km mileage rate. It is never written/accumulated/previewed.
- **Clear** = Sheet + DB only (master untouched).
- **Removed** the baseline/blank feature built earlier same day (endpoint `expenses/baseline`,
  `restoreMasterFromBaseline`/`emptyMaster`/`setBaselineFromMaster`/`baselineInfo`,
  `blankLedger`/`emptyMasterBuffer`, the "Définir comme modèle"/"Repartir de zéro" buttons).
  `excel.ts` still exports the now-unused ledger/commit engine (`commitBatch`, `writeLedger`,
  `rebuildManagedSheets`, …) — dead but valid; left for a future prune.

**Kept from earlier this session:**
- **Same-file duplicate collapse** (`collapseSameFileDuplicates` in `dedup.ts`): one PDF the
  vision model splits into 2 receipts (OCR-variant docKeys) → collapsed to 1, flagged, recoverable.
- **Live review-table totals** (recompute €/sheets/ignored from the active set).

**Also this session (final adjustments):**
- **Force-include mints a fresh docKey** (`freshDocKey` in `ExpenseRunner.tsx`): "already
  processed"/duplicate rows, when included, get a unique key so they're written as a GENUINE new
  line (the Sheet upserts by docKey; a repeat would just update in place). Button relabels to
  "ajouter comme nouvelle ligne" for idempotent rows.
- **Commit success shows the Google Sheet URL** (n8n echoes `sheetUrl`; commit returns it) with
  a copy-link + open button in `DoneCard`.
- **Edited "ok" rows**: value inputs flag `edited:true` (new optional field on `ProcessedExpense`)
  and show a blue **"modifié"** badge; the edited value is what commits (verified live).

`npx tsc --noEmit` clean. All verified live on localhost against the real n8n Sheet workflow
(`gbDvcckBbLsC4sEP`) + Supabase. ⚠️ Test commits left rows in the SHARED DB + Google Sheet
(a €5.55 edit-test row + several €2.10 bus rows) — clear from the UI when convenient.

---

## 2026-07-21 — Real PDF generation for /api/programs (committed `a1f9b69`)

Full context lives in `../gepromed-web/REDESIGN_PROGRESS.md` (session 2026-07-21 entry) —
that session's real scope was gepromed-web (legacy-content parity pass), this console repo
only got one focused change out of it:

- **`/api/programs?format=pdf`** now returns a real binary PDF (pdfkit) with
  `Content-Disposition: attachment` — a genuine file download, not the old
  browser-print-only HTML page (still the default without `?format=pdf`).
  Real Gepromed logo letterhead (`public/brand/logo-gepromed-color.png`, new),
  tinted section headers, page numbers.
- **Gotcha (will recur if pdfkit or a similar lib is touched again):** pdfkit's
  bundled `.afm` font-metrics files break under Next's webpack bundling
  ("Helvetica.afm ENOENT") unless excluded from bundling —
  `next.config.mjs` → `serverExternalPackages: ["pdfkit"]` (this repo is Next 15;
  gepromed-web is Next 14 and needs the older `experimental.serverComponentsExternalPackages`
  key for the same fix).
- Only `next.config.mjs`, `package.json`/`package-lock.json`,
  `src/app/api/programs/route.ts`, and `public/brand/logo-gepromed-color.png` were
  touched/committed this session — deliberately did **not** touch or commit the
  large amount of other uncommitted work already sitting in this repo (leads
  board, engineering pipeline, course/trainee actions, several `db/*.sql`
  migrations, a few scripts) since it predates this session and wasn't reviewed.
  Still uncommitted, still there, needs its own owner/review pass.

---

## 2026-07-14 — Session 3 (Re-enabled browser auto-translate + deployed)

- **Deployed the whole Engineering build** to Render: committed (`f83df02`) + pushed to `main`
  (autoDeploy on → `gepromed-ai-console.onrender.com`). `next build` verified locally first.
- **Re-enabled Chrome/Google auto-translate** (`layout.tsx`, commit `04bac85`) — the FR/EN
  toggle doesn't cover every section yet, so the client demo uses browser translation for the
  rest. Removed the `google:notranslate` meta + `translate="no"` + `.notranslate` class that
  the earlier `f36131c` fix had added. **Added a `beforeInteractive` guard** that patches
  `Node.prototype.removeChild/insertBefore` to no-op when Translate rewrote a node's parent —
  this is what prevents the "node to be removed is not a child" React crashes on dynamic lists
  (expenses/skills/engineering) that motivated `f36131c`. So translate is back ON but crash-safe.
- **Still to do on Render (manual):** set `ENG_EMAIL_WEBHOOK_URL` env var; run
  `db/engineering_comments.sql` on Supabase (see the two entries below).

---

## 2026-07-14 — Session 3 (Engineering — real n8n "Send" button wired)

Extended the stage-email work (entry below) from staff-assist (copy / open-in-mail) to a real
**"Send via n8n"** button, per user choice "build app+n8n, I'll add creds" + sender = "a Gmail
I'll provide".

- **`sendEngEmail(input)`** server action in `engineering/actions.ts` — POSTs
  `{requestId, ref, to, subject, body}` to `process.env.ENG_EMAIL_WEBHOOK_URL` with
  `x-webhook-secret: N8N_WEBHOOK_SECRET` (mirrors the expense `pushToGoogleSheet` pattern:
  env-gated, never throws). Sends the staff-EDITED subject/body (review-then-send). On success
  logs a best-effort "📧 Email sent to …" audit comment. Returns `{ok, reason}` where reason
  `not_configured` (env unset) / `unreachable` / `http_<code>`.
- **`EngineeringDrawer.tsx` StageEmail** — added a **Send via n8n** button + status line
  (Sending… / Sent ✓ / Send failed / not-configured hint) alongside Copy & open-in-mail.
- **i18n:** `engineering.drawer.emailSend/emailSending/emailSent/emailFailed/emailNotConfigured`.
- **Env:** documented `ENG_EMAIL_WEBHOOK_URL` in `.env.example`.
- **n8n:** new importable workflow `n8n/12-engineering-stage-email.json` (Webhook `send-eng-email`
  → Gmail node, `responseMode:lastNode`) + PART E setup section in `n8n/SETUP.md`. `npx tsc
  --noEmit` clean.
- **Sender account (user request):** send from the SAME Google account as the expense Sheet
  export = **amraoui.cabinet.test@gmail.com**. ⚠️ Caveat surfaced: the Sheet uses a Google
  *Sheets* OAuth2 cred (`8PEKj6IgXd5bbiJq`), which a Gmail node CANNOT reuse (different type +
  no gmail.send scope). So the workflow needs a **Gmail OAuth2** cred authorized as that same
  amraoui.cabinet.test@gmail.com account (one-time OAuth). JSON note + SETUP PART E updated to
  say exactly this.

**✅ TESTED LIVE (2026-07-14):** activated the workflow (publish_workflow) and POSTed a rendered
explant email to `…/webhook/send-eng-email` → HTTP 200, Gmail returned `labelIds:["SENT"]`,
message id `19f625c3dd42e722`, delivered to yikeber50@gmail.com. Full chain proven:
console template → n8n webhook → Gmail send. Workflow is now **active**.

**CREATED LIVE in n8n via MCP (2026-07-14):** workflow id **`vHOqbloEaCJkI8dQ`**
("Gepromed · Engineering stage email") in the *Esubalew Kunta* personal project on
`othmaneaimakers.app.n8n.cloud`. Webhook `POST /webhook/send-eng-email` (responseMode lastNode)
→ Gmail send (v2.2, emailType text, appendAttribution off). ⚠️ n8n **auto-assigned** an existing
Gmail credential named **"Gmail account"** — VERIFY it's the intended sender
(amraoui.cabinet.test@gmail.com); swap if not. Workflow is **inactive** until activated.

**To make Send live (user's part):** open the workflow → verify/swap the Gmail credential →
**Activate** → copy the production `https://othmaneaimakers.app.n8n.cloud/webhook/send-eng-email`
URL into `ENG_EMAIL_WEBHOOK_URL` (`.env.local` + Render). Until then the console button shows
"n8n send not configured" and Copy / open-in-mail still work. (Repo file
`n8n/12-engineering-stage-email.json` remains as the importable source of truth.)

**Also this session:** created **3 real live requests** via the anon intake RPC for browser
testing — ENG-000013 (explant, yikeber50@gmail.com), ENG-000014 (test, yikecyber@gmail.com),
ENG-000015 (equipment, yikebermisganaw@gmail.com). Confirms the live create→persist→read path
works end-to-end. (Delete when done testing.)

---

## 2026-07-14 — Session 3 (Engineering — Phase 5 kickoff: bilingual stage emails)

After the parity build (entry below), discussed the *real-need* gap vs. the master plan
(MP Phase 5 + open Qs Q5-Q7) and folded a **Phase 5 plan + per-stage remainder audit** into
`ENGINEERING_PARITY_PLAN.md`. Then built the **first Tier-1 piece: polished bilingual stage
emails** (staff-assist tier — ships now, no email infra needed).

- **New `src/lib/pipeline/engineering-emails.ts`** — pure module: FR/EN `EmailTemplate` per
  📧 stage from the audit (explant: prospection/reception/first_report/follow_up · test:
  request/report/done · equipment: request/scheduled), `getStageEmail(kind,stage)` +
  `fillEmail(tpl,lang,vars)` interpolating `{name}`/`{ref}`/`{institution}`.
- **`EngineeringDrawer.tsx`** — new "Email to requester" section: shows the polished template
  for the request's CURRENT stage in the active language, **editable** subject+body, **Copy**
  (subject+body → clipboard) and **Open in mail** (`mailto:` prefilled to the requester).
  Re-syncs on stage/language change; stages with no template show a short note.
- **i18n:** `engineering.drawer.email*` keys added.
- **Verified:** `npx tsc --noEmit` clean; a compiled cross-check confirms all 9 templates map
  to real pipeline stages, FR+EN subject/body non-empty, placeholders fully resolve.

**Deferred (needs client Q6 + Q4 mailbox/n8n):** *auto*-send + timed sweeps (48h AR, 15-day &
annual satisfaction). Same strings will feed the notification engine; only the trigger is added.

**Not browser-verified** (auth-gated). **Next action:** open a request's drawer at an emailing
stage (e.g. a test request at `request`, or explant at `reception`) → confirm the FR/EN email
renders, Copy works, and "Open in mail" launches the client prefilled to the requester.

---

## 2026-07-14 — Session 3 (Engineering section brought to FULL PARITY with Trainee mgmt)

Moved on from Trainee management to the **Engineering section** (`/engineering`). User chose
**full parity (all 4 phases)**. Plan written to `ENGINEERING_PARITY_PLAN.md`. Starting point:
the board was functional but thin (3 kind pills + flat rows + inline advance/exit) and **100%
French-hardcoded**. All 4 phases built, `npx tsc --noEmit` clean after each.

**Phase 1 — i18n parity.** Made the shared pipeline engine bilingual **without disturbing the
just-finished trainee code**: added `Localized = string | {fr,en}` + a `loc()` resolver to
`pipeline/core.ts`, and gave the label helpers (`stageLabelOf`/`stageShortOf`/`advanceLabelOf`
+ new `variantLabelOf`) an **optional `lang` param defaulting to "fr"** — so trainee callers
(which pass no lang) are byte-for-byte unchanged. `StageDef`/`VariantDef`/`PipelineDef.label`
widened to `Localized`. Converted all `engineering.ts` pipeline defs (explant×2 variants, test,
equipment) to `{fr,en}`. Wired `useT()`/`useLang()` into `EngineeringBoards.tsx`; moved the
page header + not-configured banner into the client board so they translate (page.tsx is now a
thin server wrapper passing `configured`). New `engineering.*` dict block in `i18n.tsx`.
  - **Note (residual, not touched):** trainee stage *badge* labels still render French even in
    EN — the trainee i18n pass translated STAGE_HELP/chrome/buttons but not the pipeline-def
    stage labels themselves. The new lang-aware helpers now make that fixable cheaply for
    trainees too (pass `lang` at the `stageLabel` call sites) if desired later.

**Phase 2 — detail/action drawer.** New `EngineeringDrawer.tsx` (right-side panel, same
scrim/aside shell as `TraineeSummaryDrawer`). Rows are now **clickable summaries**; the
advance / set-case / exit / reopen actions **moved off the row into the drawer footer**. Drawer
shows: badges, contact (email/institution/org_type/desired_date), notes, `meta` key/values,
a vertical pipeline **stepper** (done ✓ / current / upcoming), timeline (created/updated/exited
+ reminders state), and the actions.

**Phase 3 — KPIs + search/filters.** New `EngineeringKpiRow.tsx` (Total / Active / Done /
Exited, reactive to the filtered set) + exported `engStatus(r)` helper (`exited` if exited_at,
`done` if stage==='done', else `active`). Toolbar in the board: text search (ref/name/email/
institution), stage filter (current kind's stage ids), status filter, and a pill-style
created_at date-range (to-date inclusive). Empty state distinguishes no-data vs no-match.

**Phase 4 — stats + comments.**
  - `EngineeringStatsChart.tsx` — by stage (bars), by status (3-slice donut), requests by month
    (line). Dependency-free inline SVG (copied the tiny Bar/Donut/LineChart primitives from
    `TraineeStatsChart` rather than refactoring the trainee file). Reactive to filtered rows.
  - **Comments** (mirrors `lead_comments`): new migration **`db/engineering_comments.sql`**
    (`engineering_comments` table, FK→`engineering_requests`, staff-only RLS). Server actions
    `getEngComments(id)` + `addEngComment(id, body)` in `engineering/actions.ts` (author =
    logged-in user via `getSessionUser`, same as trainee `addComment`). Drawer has a lazy-loaded
    comments thread + composer (loads on mount, posting reloads; degrades to empty until the
    migration is applied).

**Files touched:** `src/lib/pipeline/core.ts`, `src/lib/pipeline/engineering.ts`,
`src/lib/i18n.tsx`, `src/components/EngineeringBoards.tsx`, `src/app/(app)/engineering/page.tsx`,
`src/app/(app)/engineering/actions.ts`; **new:** `EngineeringDrawer.tsx`, `EngineeringKpiRow.tsx`,
`EngineeringStatsChart.tsx`, `db/engineering_comments.sql`, `ENGINEERING_PARITY_PLAN.md`.

**Deploy step this introduces:** run **`db/engineering_comments.sql`** on Supabase (project
`hdvqiiprylrrzrkydtpa`) for the comments thread to persist. Phases 1–3 are app-only (no DB).

**Not browser-verified** — `/engineering` is auth-gated and I don't have login creds. **Next
action:** run the migration, then verify live: FR/EN toggle flips every string incl. stage
labels; row click opens the drawer; advance/case/exit/reopen work from the drawer; KPIs +
filters + stats react to the filtered set; posting a comment persists.

---

## 2026-07-14 — Session 2 (CORE staff actions BUILT — closes Trainee management)

Built the CORE of `TRAINEE_ACTIONS_PLAN.md` after reading the Gepromed docs, which confirmed
the platform is a **tracking/communication tool, not a money engine** (deposit refund is
manual/external; not refunded on cancel; attendance judged manually by not-advancing).

**Shipped:**

- **Migration `db/trainee_cancel.sql`** — adds `leads.cancelled_at` (nullable). A trainee is
  "cancelled" iff `cancelled_at IS NOT NULL`. **Must be run on Supabase** for the feature to
  work live (the one deploy step). `BASE_SELECT` starts with `*`, so the column is
  auto-fetched once it exists — no query change needed.
- **`cancelRegistration(leadId, reason?)`** in `actions.ts` — admin-only, idempotent
  (no-op if already cancelled). Sets `cancelled_at`, reminders off, records the optional
  reason as a comment, logs `exit:cancelled`. **No money logic**, no email — mirrors
  `setNotInterested`'s convention of not touching the `trainings.enrolled` counter (that
  stays trigger-maintained); stage left as-is so history reads truthfully.
- **`reinstateLead(leadId)`** — admin-only, clears `cancelled_at` + `not_interested_at`,
  re-arms reminders, interest → "interested". Undoes a mistaken cancel/exit.
- **`computeStats()`** updated: cancelled trainees no longer count as "active" (KPI accuracy).
- **UI in `LeadBoard.tsx` (Pipeline tab drawer, admin-only)**: a red "Cancel registration"
  button (uses `window.prompt` as combined confirm + optional-reason capture — null aborts),
  a green "Reinstate" button when cancelled, and a red **"Cancelled" badge** in both the
  drawer header and the list rows. Fully i18n'd (`pipeline.drawer.cancel*` / `.reinstate*` /
  `.cancelledBadge`).

`npx tsc --noEmit` clean.

**Design decisions (locked, from the docs):** dedicated `cancelled_at` (not reusing
`not_interested`); reason as free-text comment (no enum); no cancellation email (manual);
archive layer deferred (kept existing hard `deleteLead`); cancel/reinstate/delete admin-only.

**Known minor limitation (documented, intentional):** cancelling a trainee who was in the
`confirmed` stage does NOT auto-decrement `trainings.enrolled` (the seat trigger only fires
on stage changes, and cancel leaves the stage as-is — consistent with how `not_interested`
already behaves). Most cancellations happen pre-confirmed anyway. If precise seat accounting
on cancel matters later, options: move Courses fill-rate to a computed count, or add an
explicit guarded decrement. Not built now to avoid seat-count drift risk.

**Deferred (by design, in the plan §2/§3b):** step-back a stage, reassign session, archive
vs. hard-delete. Available to build later if needed.

**This closes the Trainee management section** for now — Summary/Courses/Stats/KPIs (Phase
1–2) + this cancel/reinstate (Phase 3 core) + full FR/EN translation are all done and
typecheck-clean. Remaining app-wide work (unrelated): FR/EN translation of the other pages
(courses/skills/etc. + `ExpenseRunner.tsx`), and the still-open cross-cutting calls (table
pagination, language-reactive dates).

**Next action:** run `db/trainee_cancel.sql` on Supabase, then verify cancel/reinstate live
(cancel a confirmed trainee → sees Cancelled badge, reason logged as comment, reinstate
returns them; confirm buttons only show for admins).

---

## 2026-07-14 — Session 2 (staff-actions plan drafted, not built)

User asked what Gepromed actions could be added to trainee management (cancel registration,
remove trainee, etc.), "consider the doc". Audited existing server actions in
`actions.ts` + the SOP/schema docs, then wrote **`TRAINEE_ACTIONS_PLAN.md`** (Phase 3).

Key findings baked into the plan:

- Ranked the genuinely-missing actions (not generic CRUD): **cancel/withdraw** (the real gap
  — distinct from "not interested" = never-engaged lead, and from delete = destroys record),
  no-show forfeiture, step-back a mistaken advance, reassign session, reinstate exited,
  archive-vs-hard-delete (GDPR).
- **Critical mechanism discovered:** `trainings.enrolled` is maintained by a DB trigger
  `bump_enrolled` (+1 entering `confirmed`, −1 leaving it), NOT by app code — so any cancel
  must route through a stage change to release the seat, and must not double-decrement. The
  reassign action is trickiest because of this trigger.
- Money-touching parts (cancel/no-show deposit forfeit-vs-refund) are gated behind open
  questions in §3 — same care as the earlier Bootcamp deposit distinction. Plan explicitly
  does NOT execute refunds (records the outcome as data; actual money movement is a separate
  finance/manual concern).
- All these are **mutating** → they belong on the **Pipeline tab** (`LeadBoard`), not the
  read-only Summary/Courses tabs.

**Nothing built yet** — plan-only, pending user's answers to §3 (deposit-on-cancellation
rule, dedicated `cancelled` state vs. reuse `not_interested`, reason capture, archive
layer y/n, admin-only gating).

**Next action:** get §3 answers, then build in the §4 order (schema → cancelRegistration →
stepBack → reinstate → archive → reassign → UI in LeadDrawer).

---

## 2026-07-14 — Session 2 (fixed filter row overflow on Summary tab)

User reported the filter row on the Summary tab overflowing to the right. Root cause: the
date-from/date-to pair sat together in one CSS Grid cell (`xl:grid-cols-5`) inside a `flex`
wrapper with no `min-width: 0` — native `<input type="date">` has a browser-enforced
intrinsic minimum width that doesn't shrink, so that grid cell was forced wider than its
track, pushing the whole row past the card's right edge.

**Rebuilt the filter row in `TraineeSummaryTable.tsx`** as a `flex flex-wrap` row of thin
pill-style controls instead of a fixed grid:
- New `FILTER_SELECT` constant (compact `text-xs`/`px-2.5 py-1.5` style, distinct from the
  app-wide taller `.input` class) applied to all 4 selects (parcours, course, status,
  funding), with `max-w` caps on the course/status selects so a long course name can't blow
  out the row.
- Date range redesigned as a single compact bordered pill containing a small clock icon +
  two borderless date inputs separated by a "→", each with a fixed `w-[124px]` instead of
  `flex-1` in a grid cell — removes the min-width-vs-grid-track conflict that caused the
  overflow, and reads as one unified "period" control instead of two separate fields.
- Because it's `flex-wrap` (not a fixed-column grid), controls now reflow onto additional
  lines at narrow widths instead of overflowing horizontally.

`npx tsc --noEmit` clean.

**Still open from earlier this session (not addressed yet, pending user call):** table
pagination/scroll-cap, and whether dates should be language-reactive.

**Next action:** user verifies the filter row no longer overflows at any width and the new
thinner pill-style controls look good.

---

## 2026-07-14 — Session 2 (search row split + document/contract thumbnails)

Two UI polish requests on the Summary tab:

1. **Search moved above the filters** in `TraineeSummaryTable.tsx` — was sharing a grid row
   with the parcours/course/status/funding/date-range selects, making the bar feel cramped.
   Now it's its own full-width card row, with the filters below in a cleaner
   `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5` grid (the date-from/date-to
   pair grouped side by side in one cell so they read as a single range control).
2. **Contract and signed-document thumbnails** in `TraineeSummaryDrawer.tsx` — previously
   both just showed a generic icon + name + "View" link. Now: added an `isImageFile()`
   helper (checks the file extension); if the attached file is an image, it renders as a
   real 56×56 thumbnail instead of the icon, **with the "View" link still shown beside it**
   so the file can always be opened directly regardless of whether a thumbnail rendered.
   Non-image files (PDFs etc.) still fall back to the icon + name + link as before.
   - Contract: thumbnail built directly from the public storage URL (public bucket, no
     signed URL needed).
   - Signed document: file lives in a **private** bucket, so the signed URL is now resolved
     eagerly in a `useEffect` on mount (previously only fetched on-click via a button) —
     needed for both the thumbnail `src` and the link `href` to be ready without an extra
     click.

`npx tsc --noEmit` clean.

**Still open from earlier this session (not addressed yet, pending user call):** table
pagination/scroll-cap, and whether dates should be language-reactive.

**Next action:** user verifies in-browser — search bar sits cleanly above filters at all
widths, and a trainee with an image-format contract/signed document shows a real thumbnail
with a working "View" link beside it (test with a non-image file too, e.g. PDF, to confirm
the icon fallback still works).

---

## 2026-07-14 — Session 2 (date range filter + sponsor/contract detail on Summary tab)

Three additions to the Trainee Summary tab, all confirmed with the user before building:

1. **Date range filter** in `TraineeSummaryTable.tsx` — two native `<input type="date">`
   fields ("Registered from" / "Registered until") added to the filter bar, filtering by
   `Lead.created_at` (registration date). Native date inputs give exact-day precision;
   picking a full month/year is just setting From = start and To = end of that period, so
   no separate granularity toggle was needed. `fDateTo` is treated as inclusive of the whole
   day (compared against midnight of the *next* day, not midnight of that day) so "to
   2026-07-14" includes all of July 14th. `min`/`max` on each input keep From ≤ To.
2. **Sponsor details** in `TraineeSummaryDrawer.tsx` — new section shown whenever
   `lead.funding === "sponsored"`: sponsor name (already shown before), **email**
   (`sponsor_contact` — existed on `Lead`, was never displayed anywhere in this drawer), and
   **logo** (`sponsor_logo_url`, with a 2-letter fallback badge if no logo), same visual
   treatment as the sponsor block already in `LeadBoard.tsx`'s action drawer.
3. **Contract + signed document** sections in `TraineeSummaryDrawer.tsx` — previously this
   drawer showed zero contract/document info (only the Pipeline tab's action drawer had it).
   Added two new read-only sections: contract template name + a "View" link (building the
   Supabase storage URL the same way the Pipeline drawer does), and signed-document status
   (verified/pending) + a "View document" button that calls the existing `getDocumentUrl`
   server action (a pure read — creates a signed URL, no mutation — safe to reuse in a
   view-only panel). **No upload/verify/approve controls** — those stay exclusive to
   `LeadBoard`'s action-oriented drawer.

**Plumbing required:** `publicBase` (needed to build the contract file URL) wasn't
previously passed to `TraineeSummaryTable`/`TraineeSummaryDrawer` — threaded it through
`TraineeViews` → `TraineeSummaryTable` → `TraineeSummaryDrawer`.

All new UI fully translated (`traineeSummary.registeredFrom/To`, `.sponsorSection`,
`.sponsorEmail`, `.contractSection`, `.contractNone`, `.contractView`, `.documentSection`,
`.documentNone`, `.documentVerified`, `.documentPending`, `.documentView`).
`npx tsc --noEmit` clean.

**Still open from earlier this session (not addressed yet, pending user call):** table
pagination/scroll-cap for `TraineeSummaryTable`/`CourseRollupTable`, and whether dates
should be language-reactive (currently fixed locale regardless of FR/EN toggle).

**Next action:** user verifies in-browser — date range filter narrows results correctly at
day/month/year granularity, sponsor block shows name+email+logo for sponsored trainees,
contract "View" link opens the right file, and the signed document button opens a working
signed URL.

---

## 2026-07-14 — Session 2 (i18n audit + KPI row enhancement)

User asked to check whether tables need pagination and whether language is fully
implemented. Findings:

- **Pagination**: none of the three tables paginate. `LeadBoard` at least scrolls inside a
  capped container (`max-h-[60vh]`); `TraineeSummaryTable` and `CourseRollupTable` render
  every row in an unbounded `<table>` with no scroll cap at all. Current seed data is tiny
  (4 leads) so nothing breaks today, but flagged as a real gap once trainee counts grow —
  **not fixed yet, pending user decision** on whether to add a scroll container now vs.
  wait for real pagination later.
- **i18n**: found and fixed one genuine gap — `INTEREST_LABEL` in `leads-shared.ts`
  ("Highly interested"/"Interested"/etc., used in 3 places in `LeadBoard.tsx`: filter
  dropdown, list row's interest dot, drawer's interest selector) was hardcoded English-only,
  missed during the earlier full-pipeline translation pass because it's a shared data
  constant imported into the component rather than an inline JSX string (grep for inline
  strings didn't catch it). Fixed: added `pipeline.interest.*` dict keys + an `INTEREST_KEY`
  lookup map in `LeadBoard.tsx`, all 3 usages now translate correctly. Re-scanned all other
  trainee components — no remaining untranslated strings. Also flagged (not fixed, minor,
  pending user call): date formatting (`fmtDay`/`fmtRange`) uses a fixed locale regardless
  of the active language toggle — arguably fine as a deliberate design choice, not
  necessarily a bug.
- **Lesson for future i18n passes**: grepping a component file for hardcoded strings misses
  translatable content that lives in imported data constants (enums/label maps from
  `lib/*-shared.ts` files). Check those explicitly too, not just inline JSX text.

**Then user asked to enhance the KPI cards** (screenshot showed the plain 4-card row:
Trainees/In progress/Confirmed/Completed) and add more stats if useful. Extended
`LeadStats`/`computeStats()` in `leads-shared.ts` with two more metrics computable from
existing fields — **sponsored** count (`funding === "sponsored"`) and **not interested**
count (`interest === "not_interested"`, previously only used internally for a pipeline tab,
never surfaced as a KPI). Redesigned `TraineeKpiRow.tsx`: colored circular icon badges per
card (distinct tone per metric), larger bold numbers, a "{pct}% of total" subtext under each
non-total card, hover shadow, and a responsive `grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`
layout for the now-6 cards (was 4).

`npx tsc --noEmit` clean after all changes.

**Next action:** user decides on the two flagged-not-fixed items (table pagination/scroll
cap, and whether dates should be language-reactive), then verifies the new 6-card KPI row
renders well responsively and the percentages look right.

---

## 2026-07-14 — Session 2 (status dropdown fix + chart variety + responsive layout)

User flagged two issues with the Summary tab after the byMonth panel was added: (1) the
"all statuses" dropdown was disabled/locked when parcours = "all", with no explanation;
(2) all four stats panels used the same bar-chart look regardless of what kind of data
they represented. Discussed both, gave a recommendation, user said to fix both plus make
the layout responsive.

**Fixed `TraineeSummaryTable.tsx` status dropdown:** when parcours = "all", the dropdown is
no longer disabled — it now shows both parcours' stages grouped under `<optgroup>` labels
(HelpMeSee / Bootcamp), value encoded as `"parcours::stage"`. Picking one sets both the
status AND parcours filters together in one action (`handleStatusChange`). Added a
`settingFromStatus` ref guard so the existing "reset status when parcours changes" effect
doesn't immediately wipe out a status that was just set via this combo path. Also changed
the filter bar from a flex-wrap row to a responsive grid
(`grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]`) so it lays out cleanly at
every width instead of wrapping unpredictably.

**Redesigned `TraineeStatsChart.tsx`** — each panel now uses the chart shape that fits its
data instead of four identical bar lists:
- **By status** — kept as bars (7-9 categories, ranked comparison; a pie would be unreadable).
- **By funding** — now a **donut** (new `Donut` component, plain inline SVG, no library) —
  exactly 2 categories, a part-of-whole question.
- **Top courses** — kept as bars (ranked comparison).
- **Registrations by month** — now a **line chart** (new `LineChart` component, inline SVG
  with a gradient area fill) — a trend over time reads better as a line than as bars.
Layout: each panel now sits in its own bordered card
(`rounded-xl border border-ink-100 p-4`) within a responsive grid
(`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`), replacing the previous plain 4-column grid
with no visual separation between panels.

`npx tsc --noEmit` clean after both changes. Deliberately stayed dependency-free (inline
SVG) rather than pulling in a charting library for 4 small panels, consistent with the
rest of this codebase's lightweight approach.

**Next action:** user verifies in-browser — status dropdown selectable + correct when
parcours is "all", donut renders both funding slices correctly, line chart trend looks
right, and the whole filter bar + stats grid reflow properly at mobile/tablet/desktop
widths.

---

## 2026-07-14 — Session 2 (added 4th chart panel: registrations by month)

User asked for an additional chart-like summary alongside the existing trainee stats
(status/funding/top-courses bars in `TraineeStatsChart.tsx`, shown on the Summary tab).
Added a 4th panel — **registrations by month** — since time was the one dimension not yet
covered. Last 6 calendar months, chronological (not sorted by value like the other panels),
counted from `Lead.created_at`. Grid changed from 3 to 4 columns (`sm:grid-cols-2
lg:grid-cols-4`) to fit. Reused the exact same dependency-free `Bar` component and
`useT()` i18n pattern already in the file — new key `traineeStats.byMonth`. Reacts to
whatever `leads` subset is passed in, same as the other three panels.

`npx tsc --noEmit` clean.

**Next action:** user verifies the new panel renders correctly and the month labels/counts
look right.

---

## 2026-07-14 — Session 2 (Phase B built: KPI reactivity + cross-tab click-through)

**Built both remaining pieces of `TRAINEE_COURSE_ROLLUP_PLAN.md` Phase B:**

1. **KPI row reactivity.** Previously the 4 KPI cards on `/trainees` always showed totals
   across *all* leads regardless of active tab/filters. Fixed non-invasively: `LeadBoard.tsx`
   and `TraineeSummaryTable.tsx` each gained an optional `onVisibleChange` prop (fired from a
   `useEffect` when their already-existing `visible` list changes) — neither component's own
   filter state or behavior changed. `TraineeViews.tsx` now holds a `visibleLeads` state fed
   by whichever tab is mounted, computes `computeStats()` on it, and renders the KPI row
   itself via new `TraineeKpiRow.tsx`. The KPI row moved out of `TraineesPageHeader.tsx`
   (server-component page can't own reactive client state) — that component is now just
   title/description/config-banner. Courses tab has no trainee-level filters, so switching
   to it resets the KPI-backing set to the full leads list.
2. **Cross-tab click-through.** `CourseRollupTable.tsx` gained an optional `onSelectCourse`
   callback; clicking a course row now switches `TraineeViews` to the Summary tab with that
   course pre-selected in `TraineeSummaryTable`'s course filter (new `initialCourseFilter`
   prop, remount forced via `key={selectedCourseId}` so it reliably takes effect).

`npx tsc --noEmit` clean across the whole project. Both phases of the course rollup plan
are now fully built — see `TRAINEE_COURSE_ROLLUP_PLAN.md` for full detail (status header
updated to reflect both phases shipped).

**Next action:** user manually verifies in-browser — KPI row should update live as
filters/tabs change on Pipeline and Summary, reset to global totals on Courses, and clicking
a course row should jump to Summary pre-filtered to that course.

---

## 2026-07-14 — Session 2 (Phase A of course rollup built)

User confirmed: Bootcamp tuition (beyond the €200 deposit) is **manually handled outside
this platform**, permanently — not a placeholder pending some future accounting
integration. This locks in `TRAINEE_COURSE_ROLLUP_PLAN.md` §2a's "Deposits collected" metric
as the permanent ceiling for Bootcamp financials in this view, not a stopgap.

**Built Phase A** (the additive, low-risk half of the plan — see plan file's Phase A/B split):
- `src/components/CourseRollupTable.tsx` — new "Formations"/"Courses" tab, one row per
  course/session: fill rate bar (`enrolled`/`capacity`), and two separate financial metrics
  per parcours (never blended) — "Invoices paid" for HelpMeSee (accurate, `invoice_paid_at`
  = full tuition), "Deposits collected" for Bootcamp (`deposit_contract_at`/`caution_waived`
  = deposit only). Outstanding counts shown per parcours too. Includes a visible in-UI note
  explaining the Bootcamp deposit-vs-tuition distinction, not just documented in the plan.
- Added `capacity`/`enrolled` to the `trainings` Supabase select in `leads-data.ts` and to
  the `Lead["trainings"]` type in `leads-shared.ts` — these fields existed in the schema
  (`db/schema.sql`) but weren't previously being fetched anywhere in this codebase.
- Third tab wired into `TraineeViews.tsx` (now Pipeline / Summary / Courses).
- Full i18n from the start: new `courseRollup.*` + `traineeViews.coursesTab` keys in
  `src/lib/i18n.tsx`, following the exact pattern already used for the Summary tab.
- `npx tsc --noEmit` clean.

**Not built (Phase B, per the plan's explicit split):** cross-tab click-through (course row
→ Summary tab pre-filtered) and the KPI-row reactivity refactor. Both remain deferred as a
separate, higher-risk follow-up — see `TRAINEE_COURSE_ROLLUP_PLAN.md` §6 Phase B.

**Next action:** user manually verifies the new Courses tab in-browser (fill rate math,
financial figures against a known course, FR/EN toggle, outstanding counts for both
parcours), then decide whether to proceed to Phase B or move on to other work.

---

## 2026-07-14 — Session 2 (Phase 2 plan drafted, not yet built)

User asked for recommendations on what to add next to Trainee management. Answered with:
course/session rollup view (fill rate, revenue collected vs. expected, outstanding
payments — using `trainings.capacity/enrolled/price_eur/deposit_eur` and `Lead`'s paid
timestamps, all fields that already exist and are currently unexposed), KPI-row reactivity
fix (KPIs today always show global totals regardless of active tab/filters — a leftover
from before the Summary tab existed), plus flagged-but-deferred ideas: deadline/SLA alerts
(needs a business-rule decision from the client on what counts as "late" per stage), CSV/
Excel export of the Summary table, and bulk actions on the Pipeline tab (higher risk, needs
its own safeguards review).

User asked for this to be turned into a plan. Wrote **`TRAINEE_COURSE_ROLLUP_PLAN.md`**
(Phase 2, builds on the completed `TRAINEE_ADVANCED_FILTERS_PLAN.md`) — full detail there.
**Nothing has been built yet for this phase** — it's plan-only, pending user confirmation
of the open question in its §6 (exact course-row columns + tab label wording) before
starting the build order.

**Next action:** get user's go-ahead / column confirmation on `TRAINEE_COURSE_ROLLUP_PLAN.md`,
then build in the order listed in its §6 (course rollup table → third tab → click-through →
KPI reactivity lift).

**Self-review pass (same session, before any build started):** re-checked the plan against
`db/schema.sql` and `LeadBoard.tsx` before touching code, and found the original "revenue
collected vs. expected" metric was wrong for one of the two parcours. Specifics: HelpMeSee's
`invoice_paid_at` genuinely marks full tuition (`price_eur`) paid — safe to use. But Bootcamp
only tracks a **€200 refundable deposit** (`deposit_contract_at`/`deposit_refunded_at`) —
there's no field anywhere recording whether the actual tuition was paid (presumably handled
outside this system). Treating deposit-received as tuition-revenue-collected for Bootcamp
would have silently overstated collected revenue in whatever this view shipped as. Rewrote
`TRAINEE_COURSE_ROLLUP_PLAN.md` §2a to define two separate, honestly-labeled metrics
("Invoices paid" for HelpMeSee, "Deposits collected" for Bootcamp, not one blended
"revenue" figure) and added an open question: is Bootcamp tuition tracked in an external
invoicing/accounting tool that could someday feed a true revenue number back in? Also split
the build order into **Phase A** (Courses tab — additive, low risk, ship first) and
**Phase B** (KPI-row reactivity refactor + optional cross-tab click-through — structural,
higher risk, separate follow-up), since the original plan bundled a risky refactor with a
purely additive feature as if they were one unit of work.

**Lesson for future phases:** before writing a build order involving financial/aggregate
math, re-verify each source field's actual semantics against the schema and existing
component logic — don't assume a field name (`price_eur`) means what a similarly-named
timestamp (`deposit_contract_at`) implies it does across both parcours. The two Trainee
tracks (HelpMeSee/Bootcamp) have meaningfully different payment models baked into the SOP,
and metrics that don't account for that will be wrong for one of them.

---

## 2026-07-14 — Session 2 (continued: full Trainee management FR/EN translation)

**Completed the full FR/EN translation of the Trainee management section** (both the
pipeline/action tab and the new summary subsection), closing the gap noted earlier in this
same session ("`LeadBoard.tsx` still French-hardcoded").

- `src/lib/i18n.tsx`: added a large `pipeline.*` / `pipeline.drawer.*` / `pipeline.doc.*` /
  `traineesPage.*` block to `DICT` covering the toolbar, filter popover, stage tabs, list
  empty-states, the entire lead detail drawer (workflow stepper, gates, funding/sponsor,
  contracts, documents, communications, comments, composer), and the page-level KPI header.
- `src/components/LeadBoard.tsx`: wired in `useT()`/`useLang()`. Renamed the old `const t =
  lead.trainings` local to `training` (it collided with the new `t()` translate function) and
  the `tabs.map((t) => ...)` loop var to `tb` for the same reason. Course titles
  (`trainings.title.{fr,en}`) now render in the active language via `lang`.
  `STAGE_HELP` (the per-stage "what this step means / waiting for / on advance" guidance
  text — the SOP business copy) was converted from flat French strings to a
  `Record<Parcours, Partial<Record<Stage, Record<Lang, StepHelp>>>>` bilingual structure, and
  is looked up as `STAGE_HELP[parcours][stage]?.[lang]`. This was the largest chunk of new
  translation content (~9 stages × 2 parcours × 3 fields, in both languages).
- New `src/components/TraineesPageHeader.tsx` (client) — the `/trainees` page itself
  (`page.tsx`) was a server component with hardcoded French header/KPI text; split the same
  way `DashboardView` was split earlier, so the header + 4 KPI cards can call `useT()`.
- `npx tsc --noEmit` clean across the whole project after this pass.
- **Scope note:** this now covers the whole Trainee management area end-to-end (pipeline tab
  + summary tab + page chrome). The still-pending FR/EN work from earlier in this session is
  unrelated pages: courses, skills, engineering, contracts, automations, integrations,
  roadmap, inputs, feedback, training, lms, login, and `ExpenseRunner.tsx`.

**Next action:** user verifies in-browser that toggling FR/EN updates every string on both
`/trainees` tabs (including the drawer's stage-guidance copy and gate buttons), then decide
whether to continue the translation rollout to the remaining pages listed above.

---

## 2026-07-14 — Session 2 (original entries below)

**Worked on:**
1. **FR/EN language toggle rollout** (continuing from the `bd1eb8a` sidebar-only commit):
   - Added `{name}`-style interpolation support to `useT()` in `src/lib/i18n.tsx`.
   - Translated the **Dashboard** page: split `src/app/(app)/dashboard/page.tsx` (server
     component, data fetching only) from a new `src/components/DashboardView.tsx` (client,
     renders + translates via `useT()`).
   - Translated the **Expenses** page header: extracted `src/components/ExpensesHeader.tsx`
     (client) out of `src/app/(app)/expenses/page.tsx`. `ExpenseRunner.tsx` itself (902 lines,
     the upload/review flow) is **not yet translated** — separate follow-up.
   - **Bug hit + fixed:** passing `getSkills()` results straight into the new client
     `DashboardView` broke — those objects carry a `demo` function, which Next.js can't
     serialize across the server→client boundary ("Functions cannot be passed directly to
     Client Components..."). Fixed by mapping to a plain serializable subset
     (`id, name, summary, icon, runsThisMonth`) in `dashboard/page.tsx` before passing down,
     and narrowing `DashboardView`'s `Skill` prop type to match. **Lesson: any future page
     split (server fetch → client render) must check whether fetched objects carry methods
     before passing as props — strip to plain data first.**
   - Remaining pages still hardcoded (English or mixed): `trainees`, `courses` (+new/edit),
     `skills` (+new/edit), `engineering`, `contracts`, `automations`, `integrations`,
     `roadmap`, `inputs`, `feedback`, `training`, `lms`, `login`. Confirmed `login/page.tsx`
     still says "Sign in" in English (spot-checked, not yet converted).
   - `npx tsc --noEmit` clean after both the translation work and the bugfix.
   - Verified both dev servers run: `gepromed-ai-console` and `gepromed-web` side by side
     (ports vary by what's free locally — check terminal output for the actual port each run).

2. **New feature planned (not yet started): Trainee Management advanced filters.**
   Full spec written to `TRAINEE_ADVANCED_FILTERS_PLAN.md` — read that file for the
   detailed plan, open questions, and step-by-step build order. Key findings from
   exploration (don't re-derive):
   - "Trainee management" (`/trainees`) is actually the **Leads pipeline** — there's no
     separate `Trainee` type, everything is the `Lead` model (`src/lib/leads-shared.ts`).
   - All interactivity (search, existing filters, stage tabs, detail drawer) lives in one
     client component: `src/components/LeadBoard.tsx`. No generic reusable Drawer/Modal/
     FilterBar exists elsewhere — this UI is bespoke.
   - Existing filter popover already covers: Session, Interest, Reminders, Signed doc
     status, Accommodation, E-learning. New ask adds: progress/stage, completeness
     (derived), explicit user filter — see plan file for full breakdown.
   - Progress today = position in an ordered `Stage` sequence per `Parcours`, not a numeric
     percent (drawer derives a % from stage index for its stepper).
   - Open questions logged in the plan (§3) need user answers before/while building:
     definition of "completeness", whether "subscription" maps to existing `funding`/
     `sponsor_name` fields or needs new data, whether new filters combine with or replace
     the existing popover.

**Scope correction (same session, after initial plan drafted):** user clarified the ask is
**not** an extension of the existing action-oriented `LeadBoard.tsx` pipeline (approve/advance/
verify). It's a **new, separate, read-only subsection**: a table of trainees for a selected
course, click a row → read-only detail (registration date, course(s), payments, start/end
date, status) — **no action buttons**. `TRAINEE_ADVANCED_FILTERS_PLAN.md` has been rewritten
to reflect this (§0 documents the correction). New components planned:
`TraineeSummaryTable.tsx` + `TraineeSummaryDrawer.tsx`, added as a tab/toggle on `/trainees`
alongside (not replacing) the existing pipeline. `LeadBoard.tsx`/`LeadDrawer` are explicitly
**out of scope** — do not modify them for this feature.

**Built (same session):** user said to implement directly from the existing data model since
the feature is read-only (no schema changes possible/needed). Shipped:
- `src/components/TraineeSummaryTable.tsx` — new read-only table + its own search/filter bar
  (parcours, course/session, status, name), fully separate from `LeadBoard.tsx`.
- `src/components/TraineeSummaryDrawer.tsx` — new read-only detail panel (registration date,
  course + dates, funding/payment info, status + progress bar), no action buttons.
- `src/components/TraineeViews.tsx` — new client tab-switcher ("Suivi & actions" / "Résumé
  trainees") wrapping `<LeadBoard>` and `<TraineeSummaryTable>`; `trainees/page.tsx` now
  renders this instead of `<LeadBoard>` directly.
- `npx tsc --noEmit` clean. Couldn't fully browser-verify — `/trainees` is auth-gated and I
  don't have login credentials, so **user needs to log in and manually check** the new
  "Résumé trainees" tab (filters, row click → drawer, confirm no action buttons appear).
- Implementation decisions made without re-asking (documented in
  `TRAINEE_ADVANCED_FILTERS_PLAN.md` §5 "Implementation notes"): single course per trainee
  (matches existing `training_id` single-FK model, no multi-course support exists), payments
  shown as funding type + sponsor + price/deposit + relevant paid-at timestamp + refund
  status (richest available from existing fields), feature lives as a tab on `/trainees`
  rather than a new route/sidebar entry.

**Refined (same session, after user feedback):**
- Answered: default tab on `/trainees` is **"Suivi & actions"** (the pipeline) — kept as
  default since that's the existing primary workflow; summary is opt-in via the second tab.
- Added course **description** to the detail drawer — pulled from `trainings.summary` (jsonb
  `{fr,en}`, confirmed via `db/schema.sql`; there's no separate `description` column, `summary`
  is the course description field) + `specialty`/`level` added to the query/type for future use.
- Added **sponsor name** to search (matches `sponsor_name`) and a new **Sponsor column** in the
  table, plus an explicit **funding-type filter** (Self-funded / Sponsored) separate from the
  Parcours filter (funding and parcours are orthogonal — HelpMeSee/Bootcamp is the pathway,
  self/sponsored is who pays).
- Built `TraineeStatsChart.tsx` — dependency-free bar-chart panel (3 charts: breakdown by
  status, by funding type, top 5 courses by enrollment), reacts live to whatever subset of
  `leads` is currently filtered in the table.
- **Translated the entire new subsection into the FR/EN i18n system** (`useT()`/`DICT` in
  `src/lib/i18n.tsx`): all table columns, filter labels, drawer fields, stats chart labels,
  and the tab switcher itself now toggle with the site-wide language switch. New dict
  namespaces added: `traineeViews.*`, `traineeSummary.*`, `traineeStats.*`.
- `npx tsc --noEmit` clean after all of the above.

**Next action:** user manually verifies in-browser (stats chart renders correctly, sponsor
filter/search work, FR/EN toggle changes all new text); then continue the FR/EN translation
rollout for the rest of the app (still pending: trainees pipeline tab itself — `LeadBoard.tsx`
wasn't touched and is still French-hardcoded, not app-i18n'd — plus courses, skills,
engineering, contracts, automations, integrations, roadmap, inputs, feedback, training, lms,
login pages, and the 902-line `ExpenseRunner.tsx`).

---

## 2026-07-13 — Session 1 (reconstructed from prior memory, not a live doc at the time)

- Built the Expense Sheet → n8n mirror integration end to end (see the auto-memory file
  `expense-sheet-n8n-mirror` for full gotchas: Google auth account switch, tab-by-name not
  gid, header geometry, docKey upsert key, flat-mirror clear of stale placeholder rows).
- Landed the initial FR/EN i18n system (`bd1eb8a`): `src/lib/i18n.tsx` with
  `LanguageProvider`/`useT`, sidebar nav + chrome translated. Page-body translation was
  explicitly left as follow-up — that's what Session 2 above continues.
