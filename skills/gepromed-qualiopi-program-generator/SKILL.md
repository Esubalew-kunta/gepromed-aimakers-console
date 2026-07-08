---
name: gepromed-qualiopi-program-generator
description: Generate a Qualiopi-compliant GEPROMED training PROGRAM as a branded, print-ready PDF/HTML document, in French or English, from an Excel schedule. A company-wide GEPROMED asset that produces the official "programme de formation" / "fiche programme" with every Référentiel National Qualité (RNQ / Qualiopi) block — intitulé, public visé, prérequis, objectifs pédagogiques (operational, assessable), contenu, durée, modalités pédagogiques (présentiel / distanciel / mixte / simulation), modalités d'évaluation, accessibilité handicap, délais d'accès, tarifs, inscription — plus a day-by-day timetable that renders concurrent sub-groups (A, B, …) as parallel columns. Use when asked to create, write, draft, build, or update a training program, programme de formation, fiche programme, syllabus, course outline, planning, or Qualiopi document for surgeons, clinicians, researchers, or other healthcare professionals. Reads an Excel (.xlsx) schedule + fiche metadata; outputs a blue-headed, logo-stamped, A4 print-ready HTML (Print → Save as PDF) — and a real .pdf when WeasyPrint is available. Output is a draft — the Responsable Qualité (RQ) validates before publication; the skill never invents prices, dates, rates, or certifications. Loads and updates a memory file to get closer to GEPROMED program standards with every use.
---

# GEPROMED — Qualiopi Training Program Generator

Covers GEPROMED AI **need #9** (Qualiopi-compliant training program generation).
Used by the training/education team and the Responsable Qualité.

This is a **company asset**, not a personal tool. It always produces one
consistent **GEPROMED house program** — clinical, precise, RNQ-compliant,
non-promotional — no matter which team member runs it. It turns an **Excel
schedule + fiche metadata** into a complete, brand-styled **print-ready program**
**without inventing facts**. It drafts; the **RQ validates** before the program
is published.

## Deliverable & output format
The automated deliverable is a **branded, A4, print-ready HTML** document
(`scripts/generate_program_pdf.py`): GEPROMED charte (navy `#007AC2` / `#0A2540`,
orange `#ED6D1B` accent, bundled logo, clean typography, `@page` / `@media print`
CSS). Open it and **"Print → Save as PDF"** yields a professional PDF. If the
Python **`weasyprint`** library is importable the script **also emits a real
`.pdf`**; otherwise it emits the print-ready `.html` (graceful fallback, no hard
crash — pass a `.pdf` path and it falls back to `.html` next to it). Final
**Canva / InDesign** polishing on a Gepromed **gabarit** is an *optional*
downstream design step — the generated HTML is the finished automated output.
The old `scripts/generate_program_docx.py` is retained for reference only; **use
`generate_program_pdf.py`**.

## Operating principles
1. **Company voice, not individual voice.** The program represents GEPROMED the
   certified organisme de formation. Tone is institutional and non-commercial.
2. **Draft / artifact only.** The skill produces a print-ready HTML/PDF working
   document. The **Responsable Qualité (RQ)** validates compliance before publication.
3. **Memory-driven.** Load `memory/MEMORY.md` first; apply everything in it;
   update it when you learn something durable (see Memory protocol).
4. **Self-scoring.** Score the program against `references/qa-rubric.md`; if below
   95/100, revise before returning.
5. **Zero invention.** Never add prices, dates, success/satisfaction rates,
   certificate numbers, names, or commitments. Unknowns go in `[crochets]` for
   the RQ.

## Bundled knowledge — load in this order
This skill is self-contained. Before generating, read:
1. `memory/MEMORY.md` — learned house style, glossary, recurring programs, corrections. **Highest priority after explicit user instructions.**
2. `references/brand-guidelines.md` — who GEPROMED is, palette, proof points, do/don't.
3. `references/qualiopi-checklist.md` — the RNQ block-by-block requirements (the domain core).
4. `references/intake-questions.md` — the FULL-tier batched intake set + defaults.
5. `references/excel-schedule-template.md` — the Excel input schema (Fiche + Planning sheets), the parallel sub-group rule, and a sample.
6. `references/examples.md` — worked FR/EN programs + anti-patterns.
7. `references/qa-rubric.md` — the 100-point scoring rubric.
8. `assets/gepromed-logo.png` — bundled logo stamped into the header.

**Priority order when sources conflict:** explicit user instruction > `MEMORY.md`
> references/brand. Newer beats older; note the change in the memory correction log.

## Memory protocol (makes the skill self-improving)
- **Load:** At the start of every task, read `memory/MEMORY.md` and apply all
  stored preferences silently.
- **Detect a learning** when the team member: (a) corrects a generated block,
  (b) states a durable preference ("our objectives always…", "we never write…",
  "default duration is…"), (c) gives recurring program/audience context, or
  (d) repeats the same fix twice.
- **Apply now**, then **record it**:
  - In a file-writing environment (Claude Code / agent sandbox), run:
    ```bash
    python scripts/memory_update.py --section "House-style decisions" \
      --entry "BOTH: default satisfaction survey is sent à froid at 4 weeks."
    ```
    The script appends a dated, de-duplicated entry under the right section.
  - In a non-writing environment (ChatGPT GPT / Gemini Gem), emit a block:
    ```
    📝 MEMORY UPDATE → memory/MEMORY.md  [section: House-style decisions]
    - BOTH: default satisfaction survey is sent à froid at 4 weeks.
    ```
    and tell the team member to paste it back into the knowledge file.
- **Confirm** in one short line ("Noted for next time: …").
- **Conflict:** a new instruction overrides memory; log it under "Correction log".
- **Never** store secrets, certificate numbers, prices, or one-off session facts.

## When to use
- "Crée / rédige un programme de formation Qualiopi pour [action]."
- "Build a Qualiopi training programme / fiche programme / syllabus for [course]."
- "Mets à jour le programme du Bootcamp Vasculaire." · "Add the assessment block."
- Whenever a compliant, brand-styled print-ready program (HTML/PDF) is needed for an action.

## Inputs
The generator reads a single **Excel workbook (`.xlsx`)** — see
`references/excel-schedule-template.md` for the full schema and a sample:
- **`Fiche` sheet (metadata)** — key/value rows for the Qualiopi header blocks
  (intitulé, référence, public visé, prérequis, objectifs, durée, modalités,
  moyens, évaluation, sanction, tarifs, inscription, contact, indicateurs). This
  is the **canonical, self-contained** path so one workbook carries everything.
  A companion **JSON** via `--meta` is also accepted and overrides the sheet.
- **`Planning` sheet (schedule)** — **one row per créneau**, columns exactly:
  `Jour, Heure début, Heure fin, Intitulé du créneau, Type (Cours / Atelier
  pratique), Groupe (vide/"Tous" ou A, B...), Salle, Encadrant(s), Évalué
  (Oui/Non)`. Concurrent rows (same Jour + Heure with different `Groupe`) render
  as **parallel columns**; `Groupe` empty or `Tous` renders full-width.

**Gathered via intake** (to fill the Fiche): topic, public visé, prérequis,
objectifs, durée, modalités pédagogiques, modalités d'évaluation, délais d'accès,
tarifs, inscription. **Always auto-added:** accessibilité handicap (process),
sanction (attestation). **Optional:** `reference`, `version`, `date`, `moyens`,
`contact`, `indicateurs` (only if real). `language` (FR/EN, default FR).

**Dependencies:** the Python script needs **`openpyxl`** (`pip install openpyxl`)
to read `.xlsx`; the optional real-PDF path needs **`weasyprint`**. The web route
uses the **`xlsx`** npm package already bundled in the OS app.

## Clarification protocol (ask before half-baked output)
**Intake tier: FULL.** Run a structured intake before generating; the exact set is
in `references/intake-questions.md`. Follow the company standard (`skills/CONVENTIONS.md`):
- Ask **one batched round of ≤5** numbered questions, each with a **default** or
  2–3 options. Skip anything the user already gave or `MEMORY.md` answers.
- Always offer: *"Reply `go` and I'll proceed with the defaults above."*
- **Cap: 2 rounds.** Then generate with clearly bracketed placeholders for any
  RNQ-required block still missing, flagged for the RQ. Never stall.
- Accessibilité handicap is never asked — it is always inserted as the standard
  GEPROMED process paragraph.

## Routing logic / workflow
1. Load memory + references (`qualiopi-checklist.md` is the domain core).
2. Detect language (FR default). Run the FULL-tier intake unless the brief is
   already complete or the user says `go`.
3. Map each answer to its RNQ block; draft assessable objectives (action verbs);
   align the evaluation block to the objectives.
4. Apply safe GEPROMED defaults (accessibilité, sanction); bracket every unknown
   price/date/rate for the RQ.
5. Assemble the Excel workbook (Fiche + Planning sheets) — or a companion `--meta`
   JSON — then run the generator to produce the print-ready HTML/PDF.
6. Self-score with the QA rubric; if < 95, revise (most often: objectives not
   assessable, or evaluation not mapped to objectives).
7. Detect any memory learnings; apply + record + confirm.
8. Return the output format + the path to the generated HTML/PDF.

## Deterministic helpers
```bash
# Show the Excel schema the generator expects (Fiche + Planning sheets)
python scripts/generate_program_pdf.py --print-schema

# Write a ready-to-fill sample workbook (Fiche + Planning sheets)
python scripts/generate_program_pdf.py --make-sample-xlsx sample_program.xlsx

# Render a program from a workbook → print-ready HTML (Print → Save as PDF)
python scripts/generate_program_pdf.py --in program.xlsx --out program.html

# Render straight to a real PDF (falls back to .html if WeasyPrint is absent)
python scripts/generate_program_pdf.py --in program.xlsx --out program.pdf

# Schedule workbook + companion metadata JSON (JSON overrides the Fiche sheet)
python scripts/generate_program_pdf.py --in schedule.xlsx --meta fiche.json --out program.html

# Render the bundled FR demo (sanity check the styling end-to-end)
python scripts/generate_program_pdf.py --demo --out demo.html

# Append a learned preference to memory
python scripts/memory_update.py --section "House-style decisions" \
  --entry "BOTH: default duration for the vascular bootcamp is 14 h over 2 days."
```
The model fills the workbook (Fiche key/values + one Planning row per créneau)
from the validated intake, then calls the generator. Lists render as bullets;
empty required blocks render a bracketed placeholder so the gap is visible to the
RQ; concurrent sub-groups become parallel columns in the timetable.

## Web service (`/api/programs`) & middleware note
A self-contained Next.js route lives at
`gepromed-os-ai-makers-gepromed-os/src/app/api/programs/route.ts` so the
website's **"Download program PDF"** button can call it:
- **`GET /api/programs?session=<slug>`** → branded print-ready HTML for a
  seed/demo session (e.g. `?session=bootcamp-vasculaire`).
- **`POST /api/programs`** with an uploaded `.xlsx` (multipart field `file`, or a
  raw `.xlsx` body) → the same branded print-ready HTML. Parsing uses the bundled
  **`xlsx`** npm package (no new deps, no Python shell-out); the (Jour, Heure)
  grouping + parallel-columns logic is reimplemented in TypeScript. Invalid or
  missing input returns a clean branded HTML error with the right status code.

**Middleware note (maintainer action required):** the app's `src/middleware.ts`
gates everything except a fixed `PUBLIC_PREFIXES` list. For the public website
(cross-origin, unauthenticated) to reach this route, a maintainer **must add
`"/api/programs"` to `PUBLIC_PREFIXES`** — exactly like the existing
`"/api/health"` entry. The route itself is written defensively: it reads **only
public program data** and never touches the session cookie, so it is safe to
expose publicly once the prefix is added.

## Output format
```
Assumptions: <language / format / defaults applied — only if inferred>   ← omit if all given

Program: <intitulé>
File: <path/to/program.html or program.pdf>

Summary of RNQ blocks rendered:
- <one line per block, noting any [bracketed] value the RQ must confirm>

Notes: <facts/decisions the RQ must validate before publication>   ← omit if none
QA: <score>/100                                                    ← internal check, keep ≥95
Noted for next time: <one line>                                    ← only if memory updated
```

## Quality rules (non-negotiable)
- Every RNQ-required block present (value or bracket); **zero invented** prices,
  dates, rates, certifications.
- Objectives are **operational and assessable** (action verbs); the evaluation
  block **maps to the objectives**.
- Accessibilité handicap is always a **process** (référent handicap, case-by-case).
- Prérequis never blank ("Aucun prérequis" if none).
- No hype/superlatives in the intitulé or content; institutional, non-commercial.
- Correct, native FR or EN with accurate RNQ terminology.
- **The RQ validates before publication. This skill only drafts the document.**

## Brand constants (visual elements)
Primary blue `#007AC2` and deep navy `#0A2540` (headings, rules, day bands) ·
Accent orange `#ED6D1B` (rare, ≤10% — the "Programme de formation" tag, ateliers,
and key markers only) · Dark text `#1F2A33` · Muted text `#5F6B73` · Light tint
`#E1F0F9` (time cells / table bands). The bundled logo
(`assets/gepromed-logo.png`) is embedded as a data URI in the HTML. Cours slots
read blue, Ateliers pratiques read orange. Footer flags the document as a working
draft for the RQ. Optional final polish: import the HTML/PDF into a Gepromed
Canva/InDesign gabarit.
