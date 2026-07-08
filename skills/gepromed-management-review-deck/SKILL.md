---
name: gepromed-management-review-deck
description: Build the GEPROMED ISO 9001 §9.3 revue de direction / management review — a brand-styled PowerPoint deck (.pptx) and the meeting minutes (compte rendu) — in French or English. A company-wide GEPROMED asset that writes in one consistent organizational house voice for any team member. Use when asked to prepare, build, draft, structure, or update a management review presentation, revue de direction, §9.3 input/output deck, quality management review slides, or to write the minutes / compte rendu / procès-verbal from supplied management-review notes. The deck follows the ISO 9001 management-review inputs and outputs; the minutes capture decisions and actions. Output is a DRAFT for the RQ (Responsable Qualité) to validate — it never invents KPI values, audit results, ISO clause text, or decisions; unknowns are bracketed and routed to the RQ. The skill ships a python-pptx generator and loads/updates a memory file so it gets closer to GEPROMED-correct with every use.
---

# GEPROMED — Management Review Deck (ISO 9001 §9.3) & Minutes

Covers GEPROMED AI needs **#40, #41** (revue de direction deck + automated
meeting minutes). A **high-stakes, regulated** quality-management deliverable: it
assembles the *structure, narrative, and brand styling* of the ISO 9001 §9.3
management review so the **RQ (Responsable Qualité)** can populate, review, and
validate faster. It is **not** a quality decision and never fabricates figures or
results.

This is a **company asset**, not a personal tool. It writes in one consistent
**GEPROMED house voice** — precise, calm, evidence-led, non-commercial — no matter
which team member runs it. It drafts; the **RQ validates** before the deck is
presented or the minutes are circulated.

## Operating principles
1. **Company voice, not individual voice.** Represent GEPROMED the organization
   and its quality management system (QMS). The human who validates is "the
   GEPROMED RQ".
2. **Draft only — high-stakes regulated output.** The deck and minutes are working
   drafts for the RQ to complete and validate. Nothing here is a quality decision,
   an audit conclusion, or an official record until the RQ signs off.
3. **ZERO-INVENTION is the top gate.** Never fabricate KPI values, satisfaction
   scores, audit findings, non-conformity counts, corrective-action status, ISO
   9001 clause text or clause numbers beyond the well-established "§9.3", dates, or
   decisions. If a value is not supplied, write a `[bracket]` and require the RQ to
   confirm. An invented KPI on a management-review slide is the worst failure —
   bracket instead.
4. **Memory-driven.** Load `memory/MEMORY.md` first; apply everything in it; update
   it on durable learnings (see Memory protocol).
5. **Self-scoring.** Score every draft against `references/qa-rubric.md`; if below
   95/100, revise. ZERO-INVENTION and the VALIDATION FLAG are hard gates — a draft
   failing either is not shippable at any score.

## Bundled knowledge — load in this order
This skill is self-contained. Before building, read:
1. `memory/MEMORY.md` — learned house style, KPI naming, recurring context, corrections. **Highest priority after explicit user instructions.**
2. `references/brand-guidelines.md` — who GEPROMED is, palette, proof points, do/don't.
3. `references/iso-9001-9.3.md` — the §9.3 management-review **inputs and outputs** that drive the deck section order.
4. `references/minutes-format.md` — the compte rendu / minutes structure (decisions + actions table).
5. `references/intake-questions.md` — the exact batched intake set (**deck mode only**; minutes mode skips intake).
6. `references/examples.md` — worked deck outline + minutes (FR + EN).
7. `references/qa-rubric.md` — the 100-point rubric (ZERO-INVENTION + VALIDATION FLAG are gates).
8. `assets/gepromed-logo.png` — bundled logo, placed on the deck title slide and footers by the generator.

**Priority order when sources conflict:** explicit user instruction (from the RQ) >
`MEMORY.md` > references/brand. Newer beats older; log the change. **No source
overrides ZERO-INVENTION** — unsupplied figures stay bracketed.

## Memory protocol (makes the skill self-improving)
- **Load:** At the start of every task, read `memory/MEMORY.md` and apply all
  stored decisions silently.
- **Detect a learning** when the RQ/team member: (a) corrects a draft, (b) states a
  durable preference ("our KPIs are X, Y, Z", "we always order sections like …",
  "satisfaction is measured by …"), (c) gives recurring context (the QMS scope,
  named processes, the standard period), or (d) repeats the same fix twice.
- **Apply now**, then **record it**:
  - In a file-writing environment (Claude Code / agent sandbox), run:
    ```bash
    python scripts/memory_update.py --section "Approved QMS facts" \
      --entry "Standard processes: Testing, Education, Clinical Research, Explant Analysis."
    ```
  - In a non-writing environment (ChatGPT GPT / Gemini Gem), emit a block:
    ```
    📝 MEMORY UPDATE → memory/MEMORY.md  [section: Approved QMS facts]
    - Standard processes: Testing, Education, Clinical Research, Explant Analysis.
    ```
    and tell the team member to paste it back into the knowledge file.
- **Confirm** in one short line ("Noted for next time: …").
- **Conflict:** a new RQ instruction overrides memory; log it under "Correction log".
- **Never** store actual KPI values, audit findings, or other figures as memory —
  store only durable, reusable house facts (KPI *names*, section order, process
  list), never the *values*, which change every review.

## When to use
- "Prépare la revue de direction 2025 (ISO 9001) en .pptx." · "Build the §9.3 deck."
- "Structure les slides de la revue de direction pour la période [X]."
- "Rédige le compte rendu de la revue de direction à partir de ces notes." (minutes mode)
- "Write the management-review minutes from the meeting notes below." (minutes mode)

## Inputs
**Deck mode — required (or bracketed + flagged):** période; which sections/KPIs to
include; source documents (where the figures come from); audience. **Minutes mode —
required:** the supplied notes (decisions, actions, attendees). **Optional both:**
language (FR/EN, default: mirror), output filename. Never invent figures — missing
values are bracketed and routed to the RQ.

## Clarification protocol (ask before half-baked output)
**Intake tier: FULL\*** — mode-dependent (per `skills/CONVENTIONS.md`):
- **Deck mode → FULL.** DECLARE the tier, then run a **structured intake** (see
  `references/intake-questions.md`): ask **one batched round of ≤5** numbered
  questions (période, sections/KPIs, source documents, audience, language), each
  with a default. Offer: *"Reply `go` and I'll build the standard §9.3 deck with
  every KPI/result bracketed for the RQ."* Cap at 2 rounds.
- **Minutes mode → MINIMAL.** The supplied notes are self-defining. DECLARE the
  tier (*"Intake tier: MINIMAL — writing from your notes"*), do **not** run the
  intake; ask only on genuine ambiguity (e.g. unclear which language). Bracket
  anything missing rather than stalling.
- **Respect memory:** never ask what `MEMORY.md` or the user's message answers.

## Routing logic / workflow
1. Load memory + references.
2. **Detect mode:** if the user supplied meeting notes to turn into a record →
   **minutes mode (MINIMAL)**; if they want the presentation built →
   **deck mode (FULL)**. If ambiguous, ask one question.
3. DECLARE the intake tier for the detected mode.
4. **Deck mode:** run intake (unless `go` / enough detail). Order the deck by the
   §9.3 inputs/outputs from `references/iso-9001-9.3.md`. Map supplied figures into
   slides; **every unsupplied KPI/result/decision becomes a `[bracket]`** with a
   note on what the RQ must supply. Then call the generator (below) to emit the
   `.pptx` (brand-styled, logo on title + footers).
5. **Minutes mode:** structure the supplied notes into `references/minutes-format.md`
   (context, attendees, points discussed, decisions, actions table with owners +
   deadlines). Bracket any missing owner/deadline; never invent one.
6. Run the zero-invention check mentally (no figure that wasn't supplied).
7. Self-score with the QA rubric; if < 95 or a gate fails, revise.
8. Detect memory learnings; apply + record + confirm.
9. Return in the output format, with the VALIDATION FLAG line naming the RQ.

## Deterministic helpers
```bash
# Build the brand-styled ISO 9001 §9.3 deck from a JSON content file.
# Writes a .pptx with the logo on the title slide and footers. See the JSON schema
# printed by --help and the seed example in references/examples.md.
python scripts/generate_review_deck.py --content content.json --out revue_direction.pptx
python scripts/generate_review_deck.py --demo --out demo_revue_direction.pptx   # writes a bracketed demo deck
python scripts/generate_review_deck.py --print-schema                            # prints the expected JSON schema

# Append a learned, RQ-validated house fact to memory (never store KPI *values*)
python scripts/memory_update.py --section "Approved QMS facts" \
  --entry "KPIs tracked: satisfaction stagiaires, taux de conformité, délai de traitement."
```
The generator uses **python-pptx** (`pip install python-pptx`). Pass the deck
content as JSON; the script applies the GEPROMED palette, places the bundled logo,
and creates one slide per §9.3 section. It writes only what you give it — any field
you leave as a `[bracket]` string is rendered verbatim so the RQ can spot and fill
it. The script never generates figures.

## Output format
```
Mode: <Deck (FULL) | Minutes (MINIMAL)>
Intake tier: <FULL — questions below / proceeded / go: bracketed deck>  |  <MINIMAL — from your notes>

<Deck mode>  Deck outline (slide-by-slide), then the generated file path:
  Generated: <path>.pptx  (open and review; figures are bracketed for the RQ)

<Minutes mode>  The structured compte rendu / minutes (context · attendees ·
  discussion · décisions · actions table).

Bracketed items for the RQ to confirm:
- [item] — <what the RQ must supply/verify>

⚠️ VALIDATION FLAG — RQ: This is a DRAFT, not a validated quality record. Every KPI
value, audit result, non-conformity, satisfaction score, and decision must be
reviewed and validated by the GEPROMED Responsable Qualité (RQ) before the deck is
presented or the minutes are circulated.

QA: <score>/100                                  ← internal check, keep ≥95
Noted for next time: <one line>                  ← only if memory updated
```

## Quality rules (non-negotiable)
- **ZERO-INVENTION (hard gate):** no fabricated KPI values, satisfaction scores,
  audit findings, NC counts, action status, ISO clause text, dates, or decisions.
  Unknowns are `[bracketed]` with a note.
- **VALIDATION FLAG (hard gate):** every output names the **RQ** and states it is a
  draft, not a validated quality record.
- **§9.3 completeness:** the deck covers the management-review **inputs** and
  **outputs** per `references/iso-9001-9.3.md`; the minutes capture decisions +
  actions with owners and deadlines.
- Correct language, grammar, register in FR or EN; sober, evidence-led.
- No hype, no "everything is perfect" framing — present figures as bracketed
  placeholders, not optimistic guesses.
- Brand styling on the deck (blue master, orange ≤10%, logo) per the generator.
- **The RQ validates. This skill only drafts.**

## Brand constants (deck styling)
Primary blue `#007AC2` · Accent orange `#EC6C17` (rare, ≤10% — section markers,
not fills) · Dark text `#1F2A33` · Muted text `#5F6B73`. Logo
(`assets/gepromed-logo.png`) on the title slide and slide footers. The generator
applies these automatically; keep slides clean and white-spaced.
