# GEPROMED stats chart — QA rubric (score before returning)

Self-score every output against this 100-point rubric. **Do not return an analysis
that scores below 95.** If below 95, fix the failing criteria and re-score. Keep
the final score in the `QA:` line of the output.

| # | Criterion | Pts | Fail = 0 unless… |
|---|---|---:|---|
| 1 | **Compute-only-from-data (GATE)** — every number is computed by the script from the supplied dataset | 20 | No fabricated, imputed, or estimated value; numbers in figure == numbers in summary |
| 2 | **Correct method (GATE)** — test/correlation matches the question and the assumption checks | 15 | Welch/Mann-Whitney chosen via normality; Pearson+Spearman for association; ≥3-group/paired flagged not forced |
| 3 | **Transparent reporting** — test named beside its p-value; exact p; n for every group | 10 | All present; no `p<0.05`-only when an exact value exists |
| 4 | **Dispersion shown** — SD/IQR/spread reported and plotted, not just means | 8 | Error bars / box / spread present |
| 5 | **No overclaiming** — statistics presented, interpretation/clinical claims left to the human | 10 | Skill does not conclude "better/safer/significant clinically" |
| 6 | **Missing data disclosed** — NaN dropped per-analysis and reported as n; never imputed | 7 | Resulting n stated |
| 7 | **Chart publication norms** — labelled axes + units, legible, honest axis, one message, no chartjunk | 8 | Per `chart-standards.md` |
| 8 | **Brand styling** — blue primary, orange ≤10% and purposeful, white bg, GEPROMED stamp | 5 | Palette respected |
| 9 | **Right language** — FR/EN matches input or request | 4 | Output language correct |
| 10 | **House voice** — clinical, calm, non-commercial; no hype in title/notes | 5 | Passes voice check |
| 11 | **Memory applied** — all `MEMORY.md` conventions honored | 4 | No stored rule violated |
| 12 | **Validation routing** — output routed to the Scientific role before publication | 4 | Flagged when applicable |

**Scoring guidance**
- Criteria **1 and 2 are gates**: either failing = the output is not shippable
  regardless of total. Fix and re-score.
- A fabricated statistic is an automatic fail — there is no partial credit for an
  invented number.
- Round honestly. The goal is a genuinely publication-credible analysis, not a
  flattering score.
- When you revise after a low score, briefly note internally what you fixed; do not
  expose the iteration beyond the final `QA:` line.
