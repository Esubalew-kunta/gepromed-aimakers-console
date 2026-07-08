# GEPROMED statistics methods — which test, which assumption, how to report

The scientific-rigor core of the skill. This is what makes the output a credible
**EasyMedStats alternative** rather than a chart toy. Choose the method from the
*question*, check the *assumptions*, and report transparently. **Every number
comes from the supplied data — never invent one.**

---

## 1. Match the method to the question

| The question is… | Use | Chart |
|---|---|---|
| "What does this variable look like?" | mean, SD, median, IQR, min/max, n | histogram |
| "Do two groups differ on a numeric outcome?" | Welch t-test (normal) or Mann-Whitney U (non-normal) | boxplot |
| "Do ≥3 groups differ?" | one-way ANOVA (normal) or Kruskal-Wallis (non-normal) — flag as human's call | box / bar |
| "Are two numeric variables associated?" | Pearson r (linear, normal) + Spearman ρ (monotonic/robust) | scatter + fit |
| "Compare proportions / counts across categories?" | chi-square / Fisher (small cells) — flag as human's call | bar |
| "Compare a paired before/after?" | paired t-test or Wilcoxon signed-rank — flag as human's call | box / scatter |

The script natively covers the bold daily cases (distribution, two-group
comparison, correlation). For ANOVA / chi-square / paired designs, report the
descriptives and **state plainly that the inferential test is the analyst's
decision** — do not silently run or fabricate one.

## 2. Check assumptions before any p-value
- **Normality:** the script runs the **Shapiro-Wilk** test per group (3 ≤ n ≤ 5000)
  and reports W and p. p < 0.05 ⇒ treat as non-normal.
- **Variance:** prefer **Welch's t-test** (does not assume equal variances) as the
  default two-group test — it is robust and the safer default for device/biology data.
- **Independence:** the script assumes independent observations. Paired/repeated
  measures need a paired test — flag, do not force the unpaired one.
- **Sample size:** report `n` for every group. With very small n (< ~8) prefer the
  non-parametric test and say the result is exploratory.

## 3. Two-group comparison — the default decision path
1. Shapiro-Wilk on each group.
2. Both normal ⇒ **Welch t-test**. Either non-normal (or large n) ⇒ **Mann-Whitney U**.
3. `--test auto` applies exactly this logic and prints which test it chose and why.
4. Report: test name, statistic, two-sided p-value, and the n of each group.
5. State significance at α = 0.05 as a *statistical* statement only. **Clinical /
   publication relevance is the human's judgment**, never asserted by the skill.

## 4. Correlation — report both
- **Pearson r** measures linear association (assumes roughly bivariate normal).
- **Spearman ρ** measures monotonic association and is robust to outliers/skew.
- `--corr auto` reports both with p-values. Always show the paired n.
- A correlation is **not** causation; the fit line is descriptive (least squares
  on the supplied points), not a predictive model. Say so.

## 5. Reporting conventions (publication-grade)
- Report central tendency **and** dispersion: `mean ± SD` for normal data,
  `median [Q1–Q3]` (IQR) for skewed data. The summary prints both.
- p-values: report the actual value (e.g. `p = 0.013`), not just `p < 0.05`; for
  very small values use scientific notation (e.g. `p = 5.9e-06`). Never round a
  non-significant p down to look significant.
- Always state the test name beside its p-value.
- Disclose missing data: the script drops NaN per-analysis and reports the
  resulting n; never impute silently.
- Round consistently and sensibly to the precision of the measurement — never add
  false precision and never fabricate digits.

## 6. Pitfalls to avoid (and how the skill avoids them)
- **Fabricating numbers** — banned. The script computes everything; the model only
  narrates what the script returns.
- **p-hacking / fishing** — run the comparison the analyst asked for; do not sweep
  every pair and report only the significant one. If multiple comparisons are made,
  note that correction (e.g. Bonferroni) is the analyst's call.
- **Mean on skewed data** — report median/IQR too; the boxplot shows the shape.
- **Hiding n** — every group/analysis shows its n on the chart and in the summary.
- **Overclaiming** — the skill presents statistics; it does not conclude
  "device A is safer". Interpretation is routed to the Scientific role.
- **Ignoring units** — carry units into axis labels and the summary; ask if unknown.

## 7. Validation
This skill **drafts an analysis**. A human in the **Scientific** role validates the
method choice, the assumptions, and any interpretation **before publication,
poster, or external report**. Flag explicitly when a result will be used in a
regulated or published context.
