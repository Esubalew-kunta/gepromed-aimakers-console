# GEPROMED scientific writing — QA rubric (score before returning)

Self-score every output against this 100-point rubric. **Do not return anything
below 95.** If below 95, fix the failing criteria and re-score. Keep the final
score in the `QA:` line. The integrity gates here are stricter than any other
GEPROMED skill — scientific text is published under GEPROMED's name and credibility.

| # | Criterion | Pts | Fail = 0 unless… |
|---|---|---:|---|
| 1 | **No fabricated citations** (GATE) — every reference slot is `[CITATION NEEDED]`; no invented author/year/journal/DOI | 15 | Not a single generated reference anywhere |
| 2 | **No fabricated data** (GATE) — no invented statistic, p-value, n, effect size, finding, or quote | 15 | Every number traces to source/brief or is `[bracketed]` |
| 3 | **Faithfulness / within-data** (GATE) — summary says only what the source says; draft stays within supplied findings | 15 | No added interpretation; hedging/scope preserved |
| 4 | **Correct mode** — summarize vs. draft handled with the right intake tier | 6 | Mode detected; intake run only where due |
| 5 | **IMRAD/section correctness** (draft) or **format correctness** (summary) | 10 | Right structure, register, and tense for the section/format |
| 6 | **Appropriate hedging** — claims match the evidence; association ≠ causation; no over-generalization | 10 | Measured language proportional to the data |
| 7 | **Limitations carried** (summary) / **scope respected** (draft) | 6 | Stated limitations preserved; no over-claim |
| 8 | **Terminology & abbreviations** — accurate in both languages; defined on first use | 6 | Correct, consistent terms |
| 9 | **Neutral, non-promotional** — no hype, no marketing proof points as data | 6 | Independent scientific tone |
| 10 | **Language quality** — native-quality FR or EN; precise; reads human | 5 | No errors |
| 11 | **Right language** — matches source/request | 3 | Output language correct |
| 12 | **Integrity notes + validation routing** — citation/value flags listed; routed to Author / RQ | 3 | Notes present and accurate |

**Scoring guidance**
- Criteria **1, 2, and 3 are hard gates.** Any one failing = the output is not
  shippable regardless of total. A single fabricated citation or statistic fails
  the whole output — there is no partial credit for "mostly honest". Re-do it.
- Round honestly. The goal is a genuinely trustworthy scientific draft, not a
  flattering number.
- When you revise after a low score, note internally what you fixed; do not expose
  the iteration to the user beyond the final `QA:` line.
