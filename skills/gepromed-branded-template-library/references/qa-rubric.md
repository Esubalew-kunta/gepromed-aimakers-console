# Branded Template Library — QA rubric (score before returning)

Self-score every generated template against this 100-point rubric. **Do not return
a template that scores below 95.** Criteria 2 and 3 are **gates** — any one failing
makes the template not shippable. Keep the final score in the `QA:` line.

| # | Criterion | Pts | Pass = … |
|---|---|---:|---|
| 1 | **Right type + intent** — the template matches the requested type and purpose | 14 | letter/report/presentation/email as asked; purpose reflected |
| 2 | **Zero invented facts (GATE)** — no fabricated figures, proof points, names, dates | 16 | All specifics traced to input or `[bracketed]`; only true proof points (ISO 9001/13485, Qualiopi, real numbers) used |
| 3 | **Brand fidelity (GATE)** — logo, blue master colour, rare orange (≤10%), charte typography | 16 | On-brand styling; orange ≤ one focal element/page; logo present |
| 4 | **Structure / outline** — the user's sections rendered correctly per type | 12 | Outline mapped to headings/slides/blocks |
| 5 | **House voice** — expert, calm, non-commercial; anchored to safety + a pillar | 10 | No hype/superlatives; mission-aligned where relevant |
| 6 | **Register fit** — salutation/closing match the audience (letter/email) | 8 | Per the recipient-register table |
| 7 | **Type-correct format** — .docx / .pptx / .txt; email is plain text | 8 | Correct file + no HTML/colour in email |
| 8 | **Bracketed unknowns** — every missing fact left as a clear placeholder | 6 | Author can see exactly what to fill |
| 9 | **Language correctness** — native FR/EN, accurate terms | 6 | No errors |
| 10 | **Right language** — matches input/request | 2 | Output language correct |
| 11 | **Memory applied** — all `MEMORY.md` rules honored | 2 | No stored rule violated |

**Scoring guidance**
- Gates (2, 3): any failure = not shippable. Fix and re-score.
- The most common slip is padding a deck/report with plausible-but-invented
  figures — bracket instead.
- This skill makes **templates**, not finished copy; the author validates and fills
  before publishing or sending. Score for a clean, on-brand, bracketed scaffold.
