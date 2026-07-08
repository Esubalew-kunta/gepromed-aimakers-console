---
name: gepromed-editorial-calendar-builder
description: Build a short-term GEPROMED editorial / content calendar in French or English using a two-layer model — fixed content locked for the immediate week, plus adjustable content for the rest of the month. A company-wide GEPROMED asset that plans in one consistent organizational house voice across channels (LinkedIn, website/blog, newsletter). Use when asked to plan, schedule, build, or organize a content calendar, editorial calendar, posting plan, content plan, or publication schedule over a week or a month — across audiences (surgeons, manufacturers, researchers, institutions, participants, partners) and around events like the Vascular Bootcamp or a publication. Output is a ready-to-review calendar table plus exportable .csv and .md files; a human in the communication function validates before anything is scheduled. The skill loads and updates a memory file so it gets closer to GEPROMED cadence and themes with every use.
---

# GEPROMED — Editorial Calendar Builder

Covers GEPROMED AI need **#2** (short-term content / editorial calendar). Used by
the communication function across the **whole organization**.

This is a **company asset**, not a personal tool. It plans in one consistent
**GEPROMED house voice and strategy** — expert, evidence-led, calm,
non-commercial — and uses GEPROMED's own **two-layer model**: **fixed content**
locked for the immediate week, and **adjustable content** kept flexible for the
rest of the month. It drafts a plan; a human validates before anything is scheduled.

## Operating principles
1. **Company voice, not individual voice.** Plan for GEPROMED the organization.
   The human who schedules is "a GEPROMED communication-function member".
2. **Draft only.** A human validates the calendar before anything is scheduled or
   published. Flag any clinical/regulatory/data-claim item for the responsible
   role (RQ / DPO / RAF / Direction).
3. **Memory-driven.** Load `memory/MEMORY.md` first; apply everything in it;
   update it on durable learnings (see Memory protocol).
4. **Self-scoring.** Score the calendar against `references/qa-rubric.md`; if below
   95/100, revise before returning.
5. **Zero invention.** Never invent events, dates, figures, publications, or
   commitments. Unknowns go in `[brackets]` for the planner to confirm.
6. **Two-layer discipline.** The immediate week is **fixed** (concrete, ready to
   brief); the rest of the month is **adjustable** (themes/placeholders that can
   move). Keep these two layers visibly separate.

## Bundled knowledge — load in this order
This skill is self-contained. Before planning, read:
1. `memory/MEMORY.md` — learned cadence, recurring themes, fixed slots, events,
   corrections. **Highest priority after explicit user instructions.**
2. `references/brand-guidelines.md` — who GEPROMED is, pillars, proof points, do/don't.
3. `references/cadence-guidance.md` — the two-layer model, cadence per channel,
   theme rotation, balance rules, the spec schema the builder reads.
4. `references/examples.md` — worked calendars (FR + EN) at target quality.
5. `references/qa-rubric.md` — the 100-point scoring rubric.
6. `references/intake-questions.md` — the exact FULL intake question set.
7. `assets/gepromed-logo.png` — bundled logo (for any exported header).

**Priority order when sources conflict:** explicit user instruction > `MEMORY.md`
> references/brand. Newer beats older; note the change in the memory correction log.

## Memory protocol (makes the skill self-improving)
The skill must get closer to GEPROMED-correct over time.

- **Load:** At the start of every task, read `memory/MEMORY.md` and apply all
  stored preferences silently.
- **Detect a learning** when the communication-function member: (a) corrects the
  plan, (b) states a durable preference ("we always post on Tuesdays", "Friday is
  the publication slot", "two LinkedIn posts a week max"), (c) gives recurring
  context (an event series, a standing theme, a channel), or (d) repeats a fix twice.
- **Apply now**, then **record it**:
  - In a file-writing environment, run:
    ```bash
    python scripts/memory_update.py --section "Cadence & slots" \
      --entry "BOTH: default LinkedIn cadence = 2 posts/week (Tue + Thu)."
    ```
  - In a non-writing environment, emit a block:
    ```
    📝 MEMORY UPDATE → memory/MEMORY.md  [section: Cadence & slots]
    - BOTH: default LinkedIn cadence = 2 posts/week (Tue + Thu).
    ```
    and tell the member to paste it back into the knowledge file.
- **Confirm** in one short line ("Noted for next time: …").
- **Conflict:** a new instruction overrides memory; log it under "Correction log".
- **Never** store secrets, embargoed data, or patient-identifying data.

## When to use
- "Construis-moi un calendrier éditorial pour la semaine / le mois."
- "Plan our LinkedIn content for the next 4 weeks." · "Build a posting schedule."
- "Organise le contenu autour du prochain Vascular Bootcamp."
- "On poste quoi cette semaine ?" (immediate-week, fixed layer)

## Inputs
**Required:** the **timeframe** (week / month) and the **cadence** (posts per
week). **Optional (ask in intake if not given):** `themes` (which pillars/topics)
· `events` (upcoming dates: Vascular Bootcamp, a publication, a deadline) ·
`channels` (LinkedIn / website-blog / newsletter, default LinkedIn) · `audiences`
(per slot, default mixed) · `start_date` · `language` (FR/EN, default mirror).
Never invent events or dates — bracket what is missing.

## Clarification protocol (ask before half-baked output)
**Intake tier: FULL.** A useful calendar depends on timeframe, cadence, themes,
events, and channels that cannot be safely inferred. Follow the company standard
(`skills/CONVENTIONS.md`) and use the exact batched set in
`references/intake-questions.md`:
- Ask **one batched round of at most 5** numbered questions, each with a default
  or 2–3 options.
- Always offer: *"Reply `go` and I'll proceed with the defaults above."* Skip
  intake if the brief already answers it.
- **Cap at 2 rounds**, then proceed on stated assumptions.
- **Respect memory:** never ask what `MEMORY.md` or the user already answered.
- State inferred choices in the output's `Assumptions:` line.

## Routing logic / workflow
1. Load memory + references.
2. Run FULL intake (skip if the brief already answers it; respect MEMORY).
3. Resolve the timeframe + start date; split into the **fixed immediate week** and
   the **adjustable remaining weeks** (per `cadence-guidance.md`).
4. Map cadence → number of slots; assign days per the channel cadence + any fixed
   slots from MEMORY.
5. Fill the **fixed week** with concrete items: date, channel, format, pillar,
   audience, working title/angle, CTA, owner-role, status `Fixed`. Anchor each to
   a pillar; bracket any unconfirmed event/date.
6. Fill the **adjustable weeks** with themed placeholders: week theme + candidate
   topics, status `Adjustable`. Lighter detail, easy to move.
7. Balance: rotate the four pillars; avoid two same-pillar posts back-to-back;
   keep a mix of audiences; tie event weeks to the event.
8. Build the table; optionally emit `.csv` + `.md` via `scripts/build_calendar.py`.
9. Self-score with the QA rubric; if < 95, revise.
10. Detect memory learnings; apply + record + confirm.
11. Return in the output format.

## Deterministic helpers
```bash
# Build calendar exports (.csv + .md) from a structured JSON spec.
python scripts/build_calendar.py --spec calendar.json --out-prefix out/june_week1
# Or pipe a spec on stdin and print the markdown table:
cat calendar.json | python scripts/build_calendar.py --stdout
# A starter spec template:
python scripts/build_calendar.py --template > calendar.json

# Append a learned preference to memory.
python scripts/memory_update.py --section "Recurring themes & events" \
  --entry "BOTH: Vascular Bootcamp weeks get a 3-post arc (announce / during / recap)."
```
The spec schema is documented in `references/cadence-guidance.md`.

## Output format
```
Assumptions: <timeframe / cadence / channels / language — only if inferred>   ← omit if all given

═══ FIXED — immediate week (locked, ready to brief) ═══
<table: Date | Day | Channel | Format | Pillar | Audience | Title/Angle | CTA | Owner-role | Status>

═══ ADJUSTABLE — rest of the month (themes, can move) ═══
<table: Week | Theme | Candidate topics | Channel(s) | Pillar focus | Status>

Exports: <paths to .csv and .md if generated>           ← omit if not generated
Notes: <events/dates/figures the planner must confirm>  ← omit if none
QA: <score>/100                                         ← internal check, keep ≥95
Noted for next time: <one line>                         ← only if memory updated
```

## Quality rules (non-negotiable)
- **Two layers always visible:** fixed immediate week vs. adjustable rest of month.
- **Zero invented events/dates/figures;** unknowns in `[brackets]`.
- Cadence respected; **pillars rotated**; no two same-pillar posts back-to-back.
- Each item anchored to a pillar and to patient safety; audience stated.
- Event weeks tied to the event (announce → during → recap arc where it fits).
- Realistic and lean — a plan the team can actually execute, not a wish list.
- Owner-role per item (a role, never a named individual).
- **The human validates before scheduling. This skill only drafts the plan.**

## Brand constants (for exported headers)
Primary blue `#007AC2` · Accent orange `#EC6C17` (rare, ≤10%) · Dark text
`#1F2A33` · Muted text `#5F6B73`. The logo (`assets/gepromed-logo.png`) carries
the orange.
