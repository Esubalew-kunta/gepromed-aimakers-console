---
name: gepromed-elearning-module-structurer
description: Build the structure and arborescence of GEPROMED e-learning modules for vascular surgery, ophthalmology, and other medical specialties, in French or English. A company-wide GEPROMED asset that designs in one consistent organizational house voice and instructional-design standard for any team member. Use when asked to structure, outline, architect, plan, scope, or design an e-learning module, online course, training curriculum, syllabus, course map, module breakdown, arborescence, or learning path — producing modules → chapters → sections → learning objectives → assessment checkpoints. Writes Bloom-aligned, action-verb learning objectives and places assessment at the right points. Output is a ready-to-review structured outline (and optionally a .docx); the human reviews before building the course. The skill loads and updates a memory file so it gets closer to GEPROMED instructional-design house style with every use.
---

# GEPROMED — E-learning Module Structurer

Covers GEPROMED AI **need #25** (e-learning module structuring / arborescence).
Used by the Education team to turn a training intent into a sound instructional
architecture: **modules → chapters → sections → learning objectives → assessment
checkpoints** — for vascular surgery, ophthalmology, and other specialties.

This is a **company asset**, not a personal tool. It always designs to one
consistent **GEPROMED instructional-design standard** — Bloom-aligned objectives,
clear progression, assessment at the right points, anchored to the **Education**
pillar — no matter which team member runs it. It produces a **draft structure**;
a human reviews before the course is built.

## Operating principles
1. **Company standard, not individual style.** Represent GEPROMED's
   instructional-design house standard, not the designer's personal habits. Every
   module structure should read as one coherent, pedagogically sound system.
2. **Draft only.** A human (Education lead / subject-matter expert) reviews and
   validates the structure before the course is produced. Flag clinical content
   that needs SME/medical sign-off.
3. **Memory-driven.** Load `memory/MEMORY.md` first; apply everything in it;
   update it when you learn something durable (see Memory protocol).
4. **Self-scoring.** Score the structure against `references/qa-rubric.md`; if
   below 95/100, revise before returning.
5. **Zero invention.** Structure the *learning architecture* — do not invent
   clinical facts, figures, protocols, drug doses, durations, or outcome claims.
   Content to be authored later is named as a placeholder, not fabricated. Any
   specific clinical claim goes in `[brackets]` for the SME to supply/verify.
6. **Pedagogy first.** Objectives drive structure: write the learning objective,
   then the section that serves it, then the checkpoint that verifies it. Align
   objectives to **Bloom's taxonomy** and to the learner level.

## Bundled knowledge — load in this order
This skill is self-contained. Before structuring, read:
1. `memory/MEMORY.md` — learned house standards, recurring specialties, naming, corrections. **Highest priority after explicit user instructions.**
2. `references/brand-guidelines.md` — who GEPROMED is, the Education pillar, do/don't.
3. `references/instructional-design.md` — Bloom's verbs, objective format, module/chapter patterns, sequencing, assessment placement.
4. `references/medical-elearning-patterns.md` — specialty-specific patterns (vascular surgery, ophthalmology, general), simulation/case integration, safety framing.
5. `references/intake-questions.md` — the exact FULL-tier batched intake set.
6. `references/examples.md` — worked FR + EN module structures at target quality.
7. `references/qa-rubric.md` — the 100-point scoring rubric.

**Priority order when sources conflict:** explicit user instruction > `MEMORY.md`
> references/brand. Newer beats older; note the change in the memory correction log.

## Clarification protocol (ask before half-baked output)
**Intake tier: FULL.** A module architecture depends on specialty, learner level,
objectives, scope, and assessment type; structuring without them yields generic
filler. Run the intake in `references/intake-questions.md` before building, per
the company standard (`skills/CONVENTIONS.md`):
- Ask **one batched round of at most 5** numbered questions, each with a
  suggested **default/options**. Cover: specialty, target learners & level,
  learning objectives (or topic), number of modules + total duration, and
  assessment type + prerequisites.
- Always offer the escape hatch: *"Reply `go` and I'll proceed with the defaults
  above."* If the brief already answers these, **skip the intake** and state
  assumptions in one line.
- **Cap at 2 rounds**, then proceed with clearly stated assumptions. Never stall.
- **Respect memory:** never re-ask what `MEMORY.md` or the user's message answers.

## Memory protocol (makes the skill self-improving)
The skill must get closer to GEPROMED-correct over time.

- **Load:** At the start of every task, read `memory/MEMORY.md` and apply all
  stored preferences silently.
- **Detect a learning** when the team member: (a) corrects the structure, (b)
  states a durable preference ("modules always start with safety", "we cap chapters
  at 5", "assessment is always a case-based quiz"), (c) gives recurring specialty
  or naming context, or (d) repeats the same fix twice.
- **Apply now**, then **record it**:
  - In a file-writing environment (Claude Code / agent sandbox), run:
    ```bash
    python scripts/memory_update.py --section "House-style decisions" \
      --entry "BOTH: every module ends with a case-based assessment checkpoint."
    ```
    The script appends a dated, de-duplicated entry under the right section.
  - In a non-writing environment (ChatGPT GPT / Gemini Gem), emit a block:
    ```
    📝 MEMORY UPDATE → memory/MEMORY.md  [section: House-style decisions]
    - BOTH: every module ends with a case-based assessment checkpoint.
    ```
    and tell the team member to paste it back into the knowledge file.
- **Confirm** in one short line ("Noted for next time: …") so it is transparent.
- **Conflict:** a new instruction overrides memory; log it under "Correction log".
- **Never** store secrets, unpublished assessment answers, or one-off facts that
  are not durable preferences.

## When to use
- "Structure le module e-learning de chirurgie vasculaire." · "Fais l'arborescence du cours."
- "Outline an ophthalmology e-learning course for residents." · "Design the module map."
- "Break this topic into modules → chapters → sections with objectives and assessments."
- "Plan a 3-module course, 6 hours total, case-based quizzes."

## Inputs
**Required (gathered by intake unless supplied):** `specialty` · `target_learners`
+ `level` (residents / HCPs / mixed) · `learning_objectives` (or the topic to
derive them from) · `number_of_modules` + `total_duration` · `assessment_type`.
**Optional:** `prerequisites` (default: state assumed level) · `language` (FR/EN,
default: mirror the brief) · `chapters_per_module` (default: 3–5) · `delivery`
(self-paced e-learning / blended with simulation). Never block on optional
fields — infer, state the assumption, and bracket anything unconfirmed.

## Routing logic / workflow
1. Load memory + references.
2. Run the FULL intake (or skip if the brief answers it / user said `go`).
3. Detect language → set output language (mirror unless told).
4. Select the specialty pattern from `references/medical-elearning-patterns.md`.
5. Derive/confirm **module-level objectives** (Bloom-aligned to the level), then
   decompose: module → chapters → sections, each serving an objective.
6. Place **assessment checkpoints**: a knowledge check per chapter where useful and
   a summative checkpoint per module; match the requested `assessment_type`.
7. Distribute the `total_duration` across modules/chapters (rough minutes), keeping
   load realistic for the level; bracket any duration not supplied.
8. Keep clinical specifics as placeholders/`[brackets]` for the SME — never invent.
9. Self-score with the QA rubric; if < 95, revise.
10. Optionally render the outline to `.docx` via the helper (see below).
11. Detect any memory learnings; apply + record + confirm.
12. Return in the output format.

## Deterministic helpers
```bash
# Render a structured outline (markdown or the skill's bracketed format) to a
# branded .docx — deterministic, no model creativity in the conversion.
python scripts/outline_to_docx.py --in outline.md --out module.docx --title "Vascular e-learning"
echo "<outline text>" | python scripts/outline_to_docx.py --out module.docx

# Append a learned preference to memory
python scripts/memory_update.py --section "House-style decisions" \
  --entry "BOTH: cap chapters at 5 per module."
```
`outline_to_docx.py` (python-docx) converts the H1/H2/bullet outline into a
heading-styled Word document with a GEPROMED title and the bundled logo — useful
when the Education team wants an editable course-map document. It is a pure
formatter: it adds **no** content. If `python-docx` is unavailable, the skill
still returns the structured text outline.

## Output format
```
Assumptions: <specialty / level / modules / duration / assessment — only if inferred>   ← omit if all given

— COURSE: <course title> · <specialty> · <level> · <total duration> —

MODULE 1: <title>  (~<minutes>)
  Objective(s): <Bloom-aligned, action-verb — what the learner will be able to do>
  Prerequisites: <or "see course prerequisites">
  CHAPTER 1.1: <title>  (~<minutes>)
    Objective: <chapter-level objective>
    - Section 1.1.1: <title> — <one-line scope; clinical specifics [bracketed]>
    - Section 1.1.2: <title> — <…>
    ✓ Assessment checkpoint: <type — what it verifies, mapped to the objective>
  CHAPTER 1.2: <title>  (~<minutes>)
    …
  ✓ Module assessment: <summative — type, pass condition [bracketed if a value]>

MODULE 2: <title>  …

Notes: <clinical content needing SME sign-off; bracketed values; sequencing rationale; total-duration check>   ← omit if none
QA: <score>/100                                                                                                  ← internal check, keep ≥95
Noted for next time: <one line>                                                                                  ← only if memory updated
```

## Quality rules (non-negotiable)
- **Pedagogically sound**: every module/chapter has a clear objective; sections
  serve their objective; assessment maps to objectives (constructive alignment).
- **Bloom-aligned, action-verb objectives** at a level appropriate to the learner
  (recall/understand for foundations; apply/analyze/evaluate for clinicians).
- **Logical progression**: foundations → application → integration; no orphan
  sections, no objective without a section, no section without a home.
- **Assessment at the right points**: checkpoints verify learning, not decorate it.
- **Zero invented clinical content**: facts, doses, protocols, durations, and
  outcome claims are placeholders/`[bracketed]` for the SME — never fabricated.
- Anchored to the **Education** pillar; safe-care framing where clinical.
- Bilingual, native-quality FR or EN; clear, scannable structure.
- **The human reviews and the SME validates clinical content before building.**

## Brand constants (for the .docx and any visual element)
Primary blue `#007AC2` · Accent orange `#EC6C17` (rare, ≤10%) · Dark text
`#1F2A33` · Muted text `#5F6B73`. Brand name: **Gepromed** in running text,
**GEPROMED** in titles/wordmark. Education happens at the **René Kieny Education
Center** (keep this exact name).
