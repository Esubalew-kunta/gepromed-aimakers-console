---
name: gepromed-branded-template-library
description: Generate GEPROMED-branded document templates — a letter (.docx), a report or note (.docx), a presentation deck (.pptx), or an email scaffold (text) — applying the GEPROMED charte (master blue #007AC2, rare orange #EC6C17, logo, geometric sans-serif) in French or English. A company-wide GEPROMED asset that turns a type + purpose + audience + outline into a clean, on-brand, ready-to-fill template. Use when asked to create, make, build, or set up a template, modèle, branded document, letter, courrier, report, rapport, note, slide deck, presentation, PowerPoint, pptx, or email template/scaffold for GEPROMED. The skill applies the right register per audience, anchors the voice to patient safety and the four pillars, and never invents facts, figures, proof points, names, or dates — it brackets them for the author. Output is a template the author fills and validates before publishing or sending. Loads and updates a memory file to match GEPROMED template standards over time.
---

# GEPROMED — Branded Template Library

Covers GEPROMED AI **need #7** (GEPROMED-branded document templates). Used across
the organization whenever someone needs an on-brand letter, report, deck, or email
scaffold.

This is a **company asset**, not a personal tool. It produces one consistent
**GEPROMED-branded template family** — applying the charte and house voice — no
matter which team member runs it. It builds the **structure and styling** and
**brackets every fact** for the author. It drafts a template; the **author
validates and fills** it before publishing or sending.

## Operating principles
1. **Company voice, not individual voice.** Templates represent GEPROMED the
   organization; institutional, evidence-led, non-commercial.
2. **Draft / artifact only.** The skill outputs a `.docx` / `.pptx` / `.txt`
   template. The author fills and validates before the document is published/sent.
   (No specific role validator — the author owns it; flag regulated content to the
   relevant role: RQ / DPO / RAF / Direction.)
3. **Memory-driven.** Load `memory/MEMORY.md` first; apply it; update it on durable
   learnings (see Memory protocol).
4. **Self-scoring.** Score the template against `references/qa-rubric.md`; if below
   95/100, revise before returning.
5. **Zero invention.** Never add figures, proof points, names, dates, or
   commitments. Only true proof points (ISO 9001/13485, Qualiopi, real numbers).
   Unknowns go in `[crochets]` for the author.

## Bundled knowledge — load in this order
This skill is self-contained. Before generating, read:
1. `memory/MEMORY.md` — learned template/house-style, recurring context. **Highest priority after explicit user instructions.**
2. `references/brand-guidelines.md` — who GEPROMED is, palette, proof points, do/don't.
3. `references/template-specs.md` — how each template type must look + the recipient register (the domain core).
4. `references/intake-questions.md` — the FULL-tier batched intake set + defaults.
5. `references/examples.md` — worked FR/EN templates + anti-patterns.
6. `references/qa-rubric.md` — the 100-point scoring rubric.
7. `assets/gepromed-logo.png` — bundled logo stamped onto every template.

**Priority order when sources conflict:** explicit user instruction > `MEMORY.md`
> references/brand. Newer beats older; note the change in the memory correction log.

## Memory protocol (makes the skill self-improving)
- **Load:** read `memory/MEMORY.md` first and apply all stored template preferences.
- **Detect a learning** when the team member: (a) corrects a layout/voice choice,
  (b) states a durable preference ("our reports always open with a synthèse",
  "decks use this subtitle format"), or (c) gives recurring audience/theme context.
- **Apply now**, then **record it**:
  - In a file-writing environment (Claude Code / agent sandbox), run:
    ```bash
    python scripts/memory_update.py --section "House-style decisions" \
      --entry "BOTH: reports always open with a 'Synthèse' section."
    ```
  - In a non-writing environment (ChatGPT GPT / Gemini Gem), emit a block:
    ```
    📝 MEMORY UPDATE → memory/MEMORY.md  [section: House-style decisions]
    - BOTH: reports always open with a 'Synthèse' section.
    ```
    and tell the team member to paste it back into the knowledge file.
- **Confirm** in one short line ("Noted for next time: …").
- **Conflict:** a new instruction overrides memory; log it under "Correction log".
- **Never** store secrets, draft content, or one-off facts.

## When to use
- "Crée un modèle de courrier / rapport / présentation / email GEPROMED pour [objet]."
- "Make a branded GEPROMED letter / report / slide deck / email template."
- "Build a pptx template introducing our test platform to a manufacturer."
- Whenever an on-brand, ready-to-fill template is needed. (For a full email
  *rewrite*, use `gepromed-email-reformulation` instead.)

## Inputs
**Required (gathered via intake):** `type` (letter | report | presentation | email),
`purpose`, `audience`, `sections`/outline, `language`. **Optional (bracketed if
absent):** recipient block, date, reference/version/author, author name/role,
subtitle, contact. The skill never blocks on optional fields.

## Clarification protocol (ask before half-baked output)
**Intake tier: FULL.** Run a structured intake before generating; the exact set is
in `references/intake-questions.md`. Follow the company standard (`skills/CONVENTIONS.md`):
- Ask **one batched round of ≤5** numbered questions, each with a **default** or
  2–3 options. Skip anything the user already gave or `MEMORY.md` answers.
- Always offer: *"Reply `go` and I'll proceed with the defaults above."*
- **Cap: 2 rounds.** Then generate a clean GEPROMED skeleton with every content
  slot bracketed for the author. Never stall.

## Routing logic / workflow
1. Load memory + references (`template-specs.md` is the domain core).
2. Run the FULL-tier intake unless the brief is already complete or the user says `go`.
3. Resolve `type` → choose the builder; resolve `audience` → salutation/closing.
4. Map the outline to the type's structure (headings / slides / blocks). Apply the
   house voice; anchor to patient safety + a pillar where relevant.
5. Bracket every fact/figure/name/date; use only **true** proof points.
6. Run the generator for the chosen `--type` to produce the file.
7. Self-score with the QA rubric; if < 95, revise (most often: invented figures,
   or orange overused).
8. Detect any memory learnings; apply + record + confirm.
9. Return the output format with the template file path.

## Deterministic helpers
```bash
# Show the document JSON schema the generator expects
python scripts/generate_template.py --print-schema

# Generate each template type from a JSON outline
python scripts/generate_template.py --type letter       --in doc.json --out letter.docx
python scripts/generate_template.py --type report       --in doc.json --out report.docx
python scripts/generate_template.py --type presentation --in doc.json --out deck.pptx
python scripts/generate_template.py --type email        --in doc.json --out email.txt

# Sanity-check styling end-to-end with the bundled demos
python scripts/generate_template.py --type report --demo --out demo_report.docx
python scripts/generate_template.py --type presentation --demo --out demo_deck.pptx

# Append a learned template preference to memory
python scripts/memory_update.py --section "House-style decisions" \
  --entry "BOTH: decks use 'GEPROMED — <Pillar>' as the title-slice format."
```
The model writes `doc.json` (keys per the schema) from the validated intake, then
calls the generator with the matching `--type`.

## Output format
```
Assumptions: <type / audience / language / defaults — only if inferred>   ← omit if all given

Template: <type> — <purpose>
File: <path/to/file>

Outline rendered:
- <one line per section/slide/block, noting any [bracketed] slot for the author>

Notes: <facts/figures the author must fill and validate>   ← omit if none
QA: <score>/100                                            ← internal check, keep ≥95
Noted for next time: <one line>                            ← only if memory updated
```

## Quality rules (non-negotiable)
- Right type + purpose; outline rendered correctly per type.
- **Zero invented** figures/proof points/names/dates — bracketed; only true proof
  points (ISO 9001/13485, Qualiopi, real numbers).
- On-brand: logo on every document/slide, blue master colour, **orange ≤10%** (one
  focal element/page), charte typography.
- House voice: expert, calm, non-commercial; anchored to patient safety + a pillar.
- Register fit for letters/emails; email is **plain text** (no HTML/colour).
- Correct, native FR or EN.
- **The author fills and validates before publishing/sending. This skill only
  drafts the template.**

## Brand constants (visual elements)
Primary blue `#007AC2` (titles, headings, bands, rules) · Accent orange `#EC6C17`
(rare, ≤10% — the doc-type tag, one accent rule, or one key number per page) ·
Dark text `#1F2A33` · Muted text `#5F6B73` · white background. The bundled logo
(`assets/gepromed-logo.png`) carries the orange; do not overuse it. Prefer clean
technical layout over decorative imagery.
