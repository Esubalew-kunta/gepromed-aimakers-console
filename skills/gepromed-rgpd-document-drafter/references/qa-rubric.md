# RGPD / GDPR drafter — QA rubric (score before returning)

Self-score every draft against this 100-point rubric. **Do not return a draft that
scores below 95.** Two criteria are **hard gates**: failing either means the draft
is **not shippable at any score** — fix and re-score. Keep the final score in the
`QA:` line.

| # | Criterion | Pts | Hard gate? | Pass condition |
|---|---|---|---|---|
| 1 | **ZERO-INVENTION** — no fabricated legal text, article/clause numbers, CNIL/EDPB references, legal bases, retention periods, or processing facts | 25 | **YES — gate** | Every legal/factual specific is either user-supplied / from MEMORY, or `[bracketed]` with a confirmation note. One invented value = automatic fail |
| 2 | **VALIDATION FLAG (DPO)** — output names the DPO as validator and states it is a draft, not legal advice | 15 | **YES — gate** | The ⚠️ VALIDATION FLAG line is present and names the DPO |
| 3 | **Right document + complete structure** — uses the correct skeleton; all required information items present or bracketed | 12 | no | Matches `rgpd-templates.md`; nothing silently omitted |
| 4 | **Special-category data handled** — health/research/sensitive data flagged, never treated as ordinary | 10 | no | Flag + DPO note present when applicable |
| 5 | **Data-subject rights present** — access, rectification, erasure, restriction, objection, portability + how to exercise + complaint route | 8 | no | Listed or bracketed (for notice/policy types) |
| 6 | **Bracketed-items list** — a clear "for the DPO to confirm" list mirrors every bracket | 8 | no | List present and complete |
| 7 | **Language correctness** — native-quality FR or EN, plain compliance register | 7 | no | No errors; not translated-sounding |
| 8 | **Right language** — matches input or explicit request | 3 | no | Output language correct |
| 9 | **House voice** — precise, calm, non-commercial; no hype, no "100% compliant" theatre | 5 | no | Sober, factual |
| 10 | **Controller/processor role correct** — GEPROMED's role stated or bracketed | 4 | no | Stated/`[to confirm]` |
| 11 | **Memory applied** — all `MEMORY.md` rules honored | 3 | no | No stored rule violated |

**Scoring guidance**
- Criteria 1 and 2 are **absolute gates**. If either fails, the draft scores as
  unshippable regardless of the arithmetic total — fix it and re-score. A
  confident invented article number or a missing DPO flag is the worst outcome.
- When unsure whether something is a fact you can state or a guess, **bracket it**.
  Bracketing never costs points; inventing always fails the gate.
- Round honestly. The goal is a genuinely DPO-ready draft, not a flattering number.
- When you revise after a low score, note internally what you fixed; expose only
  the final `QA:` line to the user.
