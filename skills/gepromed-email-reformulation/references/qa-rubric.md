# GEPROMED email — QA rubric (score before returning)

Self-score every draft against this 100-point rubric. **Do not return a draft
that scores below 95.** If below 95, fix the failing criteria and re-score. Keep
the final score in the `QA:` line of the output.

| # | Criterion | Pts | Fail = 0 unless… |
|---|---|---:|---|
| 1 | **Intent fidelity** — the rewrite carries the exact original purpose | 15 | Every point of the original is represented; nothing important dropped |
| 2 | **Zero invented facts** — no added numbers, names, dates, prices, certs, commitments | 15 | All specifics trace to the source or are `[bracketed]` |
| 3 | **Language correctness** — grammar, spelling, native-quality FR or EN | 10 | No errors; not translated-sounding |
| 4 | **Right language** — matches input or explicit request | 5 | Output language correct |
| 5 | **Recipient register** — salutation, tone, closing fit the audience | 10 | Per `recipient-playbook.md` |
| 6 | **Structure** — clear subject + greeting + body + one explicit ask + closing | 10 | All present |
| 7 | **House voice** — expert, calm, non-commercial; no hype/superlatives/emojis | 10 | Passes the brand-voice lint (0 errors) |
| 8 | **Human rhythm** — varied sentence length; does not read AI-generated | 5 | Mixed cadence |
| 9 | **Terminology** — GEPROMED/medical terms per `glossary-fr-en.md` | 5 | Approved terms used |
| 10 | **Memory applied** — all `MEMORY.md` rules honored | 5 | No stored rule violated |
| 11 | **Signature correctness** — only if requested; company-framed, no invented contact info | 5 | Matches `signature-blocks.md` |
| 12 | **Safety flag** — regulated/sensitive content routed to the right role | 5 | Flagged when applicable |

**Scoring guidance**
- Treat criteria 1, 2, and 7 as **gates**: any of them failing = the draft is not
  shippable regardless of total. Fix and re-score.
- Round honestly. The goal is genuinely close to 100% house-correct output, not a
  flattering number.
- When you revise after a low score, briefly note internally what you fixed; do
  not expose the iteration to the user beyond the final `QA:` line.
