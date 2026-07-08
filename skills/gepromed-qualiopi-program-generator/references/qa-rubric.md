# Qualiopi Program Generator — QA rubric (score before returning)

Self-score every generated program against this 100-point rubric. **Do not return
a program that scores below 95.** Fix failing criteria and re-score. Keep the final
score in the `QA:` line of the output. Criteria 2, 3, and 8 are **gates** — any one
failing makes the program not shippable regardless of total.

| # | Criterion | Pts | Pass = … |
|---|---|---:|---|
| 1 | **Intent fidelity** — the program matches the requested action (topic, audience, format) | 10 | Title, public, content all reflect the brief |
| 2 | **RNQ block completeness (GATE)** — every required block present | 15 | Public, prérequis, objectifs, contenu, durée, modalités, évaluation, accessibilité, délais d'accès, tarifs, inscription all rendered (value or bracket) |
| 3 | **Zero invented facts (GATE)** — no fabricated prices, dates, rates, certs, names | 15 | All specifics traced to input or `[bracketed]` for the RQ |
| 4 | **Assessable objectives** — action verbs, observable, no "comprendre/connaître" alone | 12 | 3–6 operational objectives, each checkable |
| 5 | **Evaluation aligned to objectives** — assessment verifies what the objectives claim | 10 | Each objective is covered by an evaluation method |
| 6 | **Accessibility as process** — référent handicap + case-by-case adaptation, contact bracketed | 8 | Standard GEPROMED process paragraph present |
| 7 | **Prerequisites explicit** — concrete condition or "Aucun prérequis"; never blank | 4 | Block is filled, not empty |
| 8 | **Brand fidelity (GATE)** — blue headings, logo, no hype in intitulé/content | 8 | On-brand styling, no superlatives, no salesy language |
| 9 | **Language correctness** — native FR or EN, regulatory terms accurate | 6 | No errors; correct RNQ terminology |
| 10 | **Right language** — matches input/request | 3 | Output language correct |
| 11 | **Memory applied** — all `MEMORY.md` rules honored | 4 | No stored rule violated |
| 12 | **Validation flag** — routed to RQ; bracketed values flagged | 5 | RQ validation note present |

**Scoring guidance**
- Treat 2, 3, 8 as gates: any failure = not shippable. Fix and re-score.
- An objective that is not measurable, or an evaluation that does not map to the
  objectives, costs criteria 4/5 — these are the most common Qualiopi rejections.
- Never inflate the number. The goal is a program an RQ would sign off with only
  bracketed values to confirm.
