# GEPROMED ISO gap analysis — QA rubric (score before returning)

Self-score every output against this 100-point rubric. **Do not return an analysis
that scores below 95.** If below 95, fix the failing criteria and re-score. Keep the
final score in the `QA:` line of the output.

| # | Criterion | Pts | Fail = 0 unless… |
|---|---|---:|---|
| 1 | **No invented clause text (GATE)** — wording quoted/diffed only from supplied versions; un-supplied clauses referenced by number, not reconstructed | 20 | Zero fabricated/paraphrased authoritative standard text |
| 2 | **Changes trace to real differences (GATE)** — every row maps to a real supplied textual change or document | 15 | No invented "changes" |
| 3 | **Correct clause location** — each change placed correctly in the structure (HLS / Annex SL; 13485 by intent) | 12 | Per `iso-9001-structure.md` |
| 4 | **Concrete GEPROMED impact** — impact tied to GEPROMED's processes/docs/records, not generic | 12 | Specific, not boilerplate |
| 5 | **Actionable required actions** — concrete, owner-assigned steps to close each gap | 10 | Real actions, role owners |
| 6 | **Consistent severity** — Critical/Major/Minor/Editorial applied correctly and not inflated/deflated | 8 | Scale used per `gap-analysis-format.md` |
| 7 | **No conformity conclusion** — presents the gap; RQ decides conformity | 8 | Skill does not assert conformant/non-conformant |
| 8 | **RQ validation flag** — output carries the ⚠ RQ-validation flag | 5 | Flag present |
| 9 | **Format** — narrative summary + house gap table + (optional) transition plan | 5 | Structure complete |
| 10 | **Right language** — FR/EN matches input or request | 3 | Output language correct |
| 11 | **House voice** — precise, structured, non-commercial; no hype | 2 | Passes voice check |

**Scoring guidance**
- Criteria **1 and 2 are gates**: either failing = the output is not shippable
  regardless of total. Fix and re-score.
- Inventing standard clause wording is an automatic fail — reference by clause number
  instead.
- Round honestly. The goal is an auditable, RQ-ready gap analysis, not a flattering
  number.
- When you revise after a low score, briefly note internally what you fixed; do not
  expose the iteration beyond the final `QA:` line.
