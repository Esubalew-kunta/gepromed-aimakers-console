# GEPROMED LinkedIn — QA rubric (score before returning)

Self-score every draft against this 100-point rubric. **Do not return a draft
that scores below 95.** If below 95, fix the failing criteria and re-score. Keep
the final score in the `QA:` line of the output.

| # | Criterion | Pts | Fail = 0 unless… |
|---|---|---:|---|
| 1 | **Intent & brief fidelity** — delivers the requested topic, format, voice, goal | 12 | Every brief point honored; right format chosen |
| 2 | **Zero invented facts** — no added numbers, names, dates, DOIs, certs, quotes, outcomes | 15 | All specifics trace to the source or are `[bracketed]` (**gate**) |
| 3 | **Does NOT read AI-generated** — concrete hook, varied rhythm, no templated openers, no triad tic, no em-dash spam | 15 | Passes the format-check AI-look flags; reads human (**gate**) |
| 4 | **Brand fidelity** — house voice + charte; anchored to a pillar & patient safety; visuals on-charte | 12 | Passes brand-voice lint (0 errors); visual spec respects palette (**gate**) |
| 5 | **Hook quality** — first 1–2 lines earn the click, concrete not clickbait | 8 | A real hook present per `hooks-and-hashtags.md` |
| 6 | **Format compliance** — length window, structure, slides/visual spec for the format | 8 | Within the format's length + structure rules |
| 7 | **Hashtags** — 3–6, brand+topic mix, own line | 6 | Count 3–6, placed correctly |
| 8 | **Emoji discipline** — ≤1 functional, none in formal/publication, never first char | 5 | Within policy |
| 9 | **Language correctness** — native FR or EN, right language | 6 | No errors; not translated-sounding |
| 10 | **CTA** — one clear audience-appropriate CTA, or deliberately none | 5 | Single CTA or justified none |
| 11 | **Memory applied** — all `MEMORY.md` rules honored | 4 | No stored rule violated |
| 12 | **Safety flag** — clinical/regulatory/data claims routed to the right role; visual flagged for charte owner | 4 | Flagged when applicable |

**Scoring guidance**
- Treat criteria **2, 3, and 4** as **gates**: any of them failing = the draft is
  not shippable regardless of total. Fix and re-score.
- A post that is correct but reads machine-generated **fails criterion 3** even if
  everything else is perfect. Anti-AI-look is non-negotiable for this skill.
- Round honestly. The goal is genuinely human, on-brand output, not a flattering number.
- When you revise after a low score, briefly note internally what you fixed; do not
  expose the iteration beyond the final `QA:` line.
