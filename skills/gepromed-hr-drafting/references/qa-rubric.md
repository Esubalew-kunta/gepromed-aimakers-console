# HR Drafting — QA rubric (score before returning)

Self-score every draft against this 100-point rubric. **Do not return a draft that
scores below 95.** Two criteria are **hard gates**: failing either means the draft
is **not shippable at any score** — fix and re-score. Keep the final score in the
`QA:` line.

| # | Criterion | Pts | Hard gate? | Pass condition |
|---|---|---|---|---|
| 1 | **ZERO-INVENTION** — no fabricated law, Code du travail article numbers, CCN names/IDCC/clauses, thresholds, notice/trial periods, salary minima, or deadlines | 25 | **YES — gate** | Every legal value is user-supplied / from MEMORY, or `[bracketed]` with the source to verify. One invented value = automatic fail |
| 2 | **VALIDATION FLAG + disclaimer (RAF)** — output names the RAF, states it is a draft not legal advice, and carries the HR-legal disclaimer | 15 | **YES — gate** | The ⚠️ VALIDATION FLAG / disclaimer is present and names the RAF |
| 3 | **Cite-reliable-sources** — legal points are routed to a named source (Code du travail / applicable CCN / official guidance), not asserted | 12 | no | "Sources to verify" list present; no rule stated as fact |
| 4 | **Right deliverable + complete structure** — uses the correct template/structure; nothing required silently omitted | 10 | no | Matches the relevant reference file |
| 5 | **Non-discrimination** — HR text inclusive, free of prohibited criteria; doubts flagged for equality review | 10 | no | No discriminatory criterion; flags present where needed |
| 6 | **HR-legal answer shape** (when applicable) — situation → questions to verify → bracketed options → sources; never concludes the law | 8 | no | Framed as checks, not answers |
| 7 | **Bracketed/sources list** — every legal value and company specific is bracketed and listed with its source | 8 | no | List present and complete |
| 8 | **Language correctness** — native-quality FR or EN, respectful HR register | 6 | no | No errors; not translated-sounding |
| 9 | **Right language** — matches input or explicit request | 3 | no | Output language correct |
| 10 | **House voice** — precise, respectful, non-commercial; no false reassurance ("fully legal", "no risk") | 5 | no | Sober, honest |
| 11 | **Memory applied** — all `MEMORY.md` rules honored; no personal/salary data stored | 3 | no | No stored rule violated |

**Scoring guidance**
- Criteria 1 and 2 are **absolute gates**. If either fails, the draft is
  unshippable regardless of the total — fix it and re-score. A confident invented
  article number or a missing RAF flag is the worst outcome.
- When unsure whether a legal value is supplied or guessed, **bracket it** and name
  the source. Bracketing never costs points; inventing always fails the gate.
- Round honestly. The goal is a genuinely RAF-ready draft, not a flattering number.
- When you revise after a low score, note internally what you fixed; expose only
  the final `QA:` line to the user.
