# GEPROMED website content — QA rubric (score before returning)

Self-score every page draft against this 100-point rubric. **Do not return a
draft that scores below 95.** If below 95, fix the failing criteria and re-score.
Keep the final score in the `QA:` line of the output.

| # | Criterion | Pts | Fail = 0 unless… |
|---|---|---:|---|
| 1 | **Intent fidelity** — the page delivers the briefed purpose, audience, and key messages | 12 | All key messages present; page type correct |
| 2 | **Zero invented proof** — no added numbers, certifications, dates, partners, names, or claims | 15 | Every specific traces to the brief/brand kit or is `[bracketed]` |
| 3 | **Pillar anchor + stake** — anchored to a pillar; patient-safety stake explicit | 8 | One clear pillar; the "why it matters" is present |
| 4 | **Storytelling** — leads with the reader's stake; proof replaces adjectives; not org-chart copy | 10 | Reader-first; no hype substituting for proof |
| 5 | **Heading hierarchy** — exactly one H1; logical H2/H3; descriptive, scannable headings | 8 | One H1; no skipped levels |
| 6 | **SEO** — primary keyword in H1 + intro + meta title + meta description; correct char limits | 10 | Keyword placed; title ≤60; description 120–158 |
| 7 | **GEO** — intro answers the core question in 1–2 sentences; ≥1 extractable structured passage | 8 | Self-contained quotable opening + a list/steps/definition |
| 8 | **Language quality** — native-quality FR or EN; not translated-sounding; varied rhythm | 8 | No errors; reads human |
| 9 | **Right language** — matches the brief/request; bilingual parity respected | 4 | Output language correct |
| 10 | **CTA** — one specific, action-led primary CTA with a destination | 4 | Concrete CTA + destination |
| 11 | **Qualiopi completeness** (training pages only; else auto-award) — all required fields present or bracketed | 5 | Objectives, public, prerequisites, duration, modalities, accessibility, price/financing, indicators, registration |
| 12 | **House voice & brand** — no hype/superlatives/emojis; neutral, independent; brand naming correct | 5 | Passes the voice check; "Gepromed"/"GEPROMED" correct |
| 13 | **Memory applied** — all `MEMORY.md` rules honored | 3 | No stored rule violated |

**Scoring guidance**
- Treat criteria **1, 2, and 4** as **gates**: any failing = the draft is not
  shippable regardless of total. Criterion 2 (zero invented proof) is the hardest
  gate — an unverified number on a public page is a credibility/compliance failure.
- For training pages, criterion 11 is also a gate: a Qualiopi page missing required
  fields cannot ship.
- Round honestly. The goal is genuinely close to 100% house-correct output.
- When you revise after a low score, briefly note internally what you fixed; do not
  expose the iteration to the user beyond the final `QA:` line.
