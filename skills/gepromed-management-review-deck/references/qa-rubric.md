# Management Review Deck & Minutes — QA rubric (score before returning)

Self-score every draft against this 100-point rubric. **Do not return a draft that
scores below 95.** Two criteria are **hard gates**: failing either means the draft
is **not shippable at any score** — fix and re-score. Keep the final score in the
`QA:` line.

| # | Criterion | Pts | Hard gate? | Pass condition |
|---|---|---|---|---|
| 1 | **ZERO-INVENTION** — no fabricated KPI values, satisfaction scores, audit findings, NC counts, action status, ISO clause text, dates, or decisions | 25 | **YES — gate** | Every figure/result/decision is user-supplied / from MEMORY, or `[bracketed]` with a note. One invented value = automatic fail |
| 2 | **VALIDATION FLAG (RQ)** — output names the RQ as validator and states it is a draft, not a validated quality record | 15 | **YES — gate** | The ⚠️ VALIDATION FLAG line is present and names the RQ |
| 3 | **§9.3 completeness (deck)** — covers the management-review inputs & outputs in the recommended order; **minutes** capture decisions + actions | 12 | no | Matches `iso-9001-9.3.md` / `minutes-format.md`; nothing silently dropped |
| 4 | **Right mode + tier declared** — deck (FULL) vs minutes (MINIMAL) detected; tier stated | 8 | no | Mode + tier declared in the output |
| 5 | **Actions are actionable** — each action has an owner + deadline, or a bracket where missing | 8 | no | No action without owner/deadline or a bracket |
| 6 | **Bracketed-items list** — a clear "for the RQ to confirm" list mirrors every bracket | 8 | no | List present and complete |
| 7 | **Brand styling (deck)** — blue master, orange ≤10%, logo on title + footers; clean slides | 7 | no | Generator styling applied; bracketed placeholders flagged |
| 8 | **Language correctness** — native-quality FR or EN, sober quality register | 6 | no | No errors; not translated-sounding |
| 9 | **Right language** — matches input or explicit request | 3 | no | Output language correct |
| 10 | **No optimistic spin** — figures shown as bracketed placeholders, not flattering guesses; proof points not used as KPIs | 5 | no | Neutral, evidence-led |
| 11 | **Memory applied** — all `MEMORY.md` rules honored; no KPI *values* stored in memory | 3 | no | No stored rule violated; values never memorised |

**Scoring guidance**
- Criteria 1 and 2 are **absolute gates**. If either fails, the draft is
  unshippable regardless of the total — fix it and re-score. An invented KPI on a
  management-review slide or a missing RQ flag is the worst outcome.
- When unsure whether a number is supplied or guessed, **bracket it**. Bracketing
  never costs points; inventing always fails the gate.
- Round honestly. The goal is a genuinely RQ-ready draft, not a flattering number.
- When you revise after a low score, note internally what you fixed; expose only
  the final `QA:` line to the user.
