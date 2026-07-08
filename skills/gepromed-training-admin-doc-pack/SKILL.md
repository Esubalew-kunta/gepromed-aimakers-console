---
name: gepromed-training-admin-doc-pack
description: From a participant list and session details, generate a complete GEPROMED training admin pack — printable name badges, a feuille d'émargement (attendance / signing sheet), and an RGPD/GDPR data-protection notice — as brand-styled documents, in French or English. A company-wide GEPROMED asset. Use when asked to create, prepare, or print badges, name tags, an attendance sheet, signing sheet, feuille d'émargement, sign-in sheet, an RGPD notice, GDPR notice, mention RGPD, or a full session admin pack for a training, formation, workshop, bootcamp, or course. The skill preserves participant data exactly, never invents the DPO contact or retention period (it brackets them for the DPO), and stamps the GEPROMED logo and charte on every document. Output is a draft pack — the DPO validates the RGPD notice before it is distributed. Loads and updates a memory file to match GEPROMED layout standards over time.
---

# GEPROMED — Training Admin Doc Pack

Covers GEPROMED AI **need #10** (training-session admin documents: badges,
attendance sheet, RGPD notice). Used by the training/education team for every
session.

This is a **company asset**, not a personal tool. From a roster + session details
it produces a consistent, brand-styled admin pack — no matter which team member
runs it. It **preserves participant data exactly** and **never invents** legal or
contact data. It drafts the pack; the **DPO validates** the RGPD notice before it
is distributed.

## Operating principles
1. **Company voice, not individual voice.** The pack represents GEPROMED the
   organisme de formation; institutional, clean, non-commercial.
2. **Draft / artifact only.** The skill outputs `.docx` documents (and optional
   PNG badges). The **DPO** validates the RGPD notice before distribution.
3. **Memory-driven.** Load `memory/MEMORY.md` first; apply it; update it on durable
   learnings (see Memory protocol). Never store participant or legal data in memory.
4. **Self-scoring.** Score the pack against `references/qa-rubric.md`; if below
   95/100, revise before returning.
5. **Zero invention.** Never alter participant data; never fabricate the DPO email,
   retention period, or address. Unknowns go in `[crochets]` for the DPO.

## Bundled knowledge — load in this order
This skill is self-contained. Before generating, read:
1. `memory/MEMORY.md` — learned layout/house-style, recurring context. **Highest priority after explicit user instructions.**
2. `references/brand-guidelines.md` — who GEPROMED is, palette, do/don't.
3. `references/rgpd-notice-template.md` — the RGPD notice domain text (Art. 13 elements).
4. `references/layout-spec.md` — how each of the three artifacts must look.
5. `references/intake-questions.md` — the LIGHT-tier required fields + the one batched question.
6. `references/examples.md` — worked FR/EN runs + anti-patterns.
7. `references/qa-rubric.md` — the 100-point scoring rubric.
8. `assets/gepromed-logo.png` — bundled logo stamped onto every document.

**Priority order when sources conflict:** explicit user instruction > `MEMORY.md`
> references/brand. Newer beats older; note the change in the memory correction log.

## Memory protocol (makes the skill self-improving)
- **Load:** read `memory/MEMORY.md` first and apply all stored layout preferences.
- **Detect a learning** when the team member: (a) corrects a layout/wording choice,
  (b) states a durable preference ("badges should show the role, not the org",
  "always add an afternoon signature column"), or (c) gives recurring venue/context.
- **Apply now**, then **record it**:
  - In a file-writing environment (Claude Code / agent sandbox), run:
    ```bash
    python scripts/memory_update.py --section "House-style decisions" \
      --entry "BOTH: badges show fonction rather than organisme when both exist."
    ```
  - In a non-writing environment (ChatGPT GPT / Gemini Gem), emit a block:
    ```
    📝 MEMORY UPDATE → memory/MEMORY.md  [section: House-style decisions]
    - BOTH: badges show fonction rather than organisme when both exist.
    ```
    and tell the team member to paste it back into the knowledge file.
- **Confirm** in one short line ("Noted for next time: …").
- **Conflict:** a new instruction overrides memory; log it under "Correction log".
- **Never** store participant names, DPO contacts, retention periods, or one-off
  session data — these are not durable preferences and may be personal data.

## When to use
- "Prépare les badges et la feuille d'émargement pour la session du [date]."
- "Generate the attendance sheet + GDPR notice for this workshop." · "Print name tags."
- "Pack admin complet pour le Bootcamp Vasculaire : voici la liste des participants."
- Whenever a session needs its badges + émargement + notice RGPD.

## Inputs
**Required:** the **participant list** (nom + prénom each; organisme optional). If
absent, the skill asks once. **Strongly useful:** course title, session date.
**Optional (bracketed if absent):** horaires, lieu, formateur; GEPROMED address,
**DPO email**, **retention period** (DPO-owned — never invented). `language`
(FR/EN, default FR). Optional `--badge-png` for crisp Pillow badge images.

## Clarification protocol (ask before half-baked output)
**Intake tier: LIGHT.** Proceed by default; ask **only** for missing *required*
fields (see `references/intake-questions.md`). Follow the company standard
(`skills/CONVENTIONS.md`):
- The only field that cannot be defaulted is the **participant list**. If it is
  missing, ask **one** short batched question for it (and the title/date if handy).
- Everything else is bracketed for the DPO; never block on it.
- Always offer: *"Reply `go` and I'll proceed, bracketing whatever's missing for
  the DPO."* Never exceed one clarifying round. Never run a full intake.

## Routing logic / workflow
1. Load memory + references.
2. Check the required field (participant list). If missing, ask once; else proceed.
3. Detect language (FR default). Transcribe participant data **verbatim**.
4. Map session details into the JSON; bracket unknowns; **bracket DPO email +
   retention** (never invent).
5. Run the generator to produce `feuille_emargement.docx`, `badges.docx`,
   `notice_rgpd.docx` (and optional PNG badges).
6. Self-score with the QA rubric; if < 95, revise (most often: a bracketed field
   was accidentally invented, or a badge carried a bracket).
7. Detect any durable layout learnings; apply + record + confirm.
8. Return the output format with the pack file paths and the DPO validation note.

## Deterministic helpers
```bash
# Show the session JSON schema the generator expects
python scripts/generate_admin_pack.py --print-schema

# Generate the full pack into ./pack (attendance + badges + RGPD notice)
python scripts/generate_admin_pack.py --in session.json --outdir ./pack

# Also emit crisp PNG badges via Pillow
python scripts/generate_admin_pack.py --in session.json --outdir ./pack --badge-png

# Sanity-check styling end-to-end with the bundled demo
python scripts/generate_admin_pack.py --demo --outdir ./pack

# Append a learned layout preference to memory
python scripts/memory_update.py --section "House-style decisions" \
  --entry "BOTH: default venue label is 'René Kieny Education Center, Strasbourg'."
```
The model writes `session.json` (keys per the schema) from the supplied roster +
details, then calls the generator.

## Output format
```
Assumptions: <language / bracketed DPO fields — only if inferred>   ← omit if all given

Pack: <course title / date>
Files:
- <path>/feuille_emargement.docx   (<N> participants)
- <path>/badges.docx               (<N> badges)
- <path>/notice_rgpd.docx          ([DPO] / [retention] bracketed)

Notes (for the DPO): <DPO email / retention / address to confirm>   ← always, until supplied
QA: <score>/100                                                     ← internal check, keep ≥95
Noted for next time: <one line>                                     ← only if memory updated
```

## Quality rules (non-negotiable)
- Participant data rendered **exactly** as supplied; never altered or guessed.
- **Zero invention** of DPO email, retention period, or address — always bracketed.
- RGPD notice carries all Art. 13 elements (controller, DPO, purposes, legal basis,
  recipients, retention, rights, CNIL, photo-consent) + the DPO validation footer.
- Attendance sheet: one row per participant, signature columns, session block,
  trainer signature line.
- Badges clean: name prominent, org omitted (not bracketed) when missing.
- On-brand: logo, blue headings/bands, rare orange, charte typography.
- **The DPO validates the RGPD notice before distribution. This skill only drafts.**

## Brand constants (visual elements)
Primary blue `#007AC2` (headings, table header bands, badge borders) · Accent
orange `#EC6C17` (rare, ≤10% — thin accents only) · Dark text `#1F2A33` · Muted
text `#5F6B73`. The bundled logo (`assets/gepromed-logo.png`) carries the orange.
Footers state the validating role (DPO for the notice; quality suivi for the sheet).
