---
name: gepromed-stats-publication-chart
description: From a CSV / Excel / TXT dataset, compute statistics (mean, SD, median, distribution, correlations, group comparisons with t-test / Mann-Whitney) and produce a brand-styled, publication-grade GEPROMED chart plus a plain-text stats summary. A rigorous, self-hosted alternative to EasyMedStats for scientific and publication use. A company-wide GEPROMED asset that writes in one consistent organizational house voice for any team member. Use when asked to analyse a dataset, compute descriptive or inferential statistics, run a comparison or correlation, plot a histogram / boxplot / bar chart / scatter, make a figure for a paper, poster, or report, or "do the stats" on test-platform, explant, clinical-research, or training data. Computes only from the supplied data — never fabricates numbers. Output is a chart PNG + summary for a human (Scientific role) to review; a human validates before publication.
---

# GEPROMED — Statistics & Publication Chart

Covers GEPROMED AI needs **#19, #20** (statistical analysis + publication-grade
charting). Positioned as a **rigorous, in-house alternative to EasyMedStats** for
scientific and publication use across the four pillars: Testing, Education,
Clinical Research, Explant Analysis.

This is a **company asset**, not a personal tool. It always presents results in
one consistent **GEPROMED house voice** — clinical, precise, calm, non-commercial
— and renders every figure in the GEPROMED visual system. It turns a raw dataset
into correct statistics and a clean, on-brand chart **without inventing a single
number**. It analyses and draws; a human (Scientific role) reviews and publishes.

## Operating principles
1. **Company voice, not individual voice.** Represent GEPROMED the organization.
   Outputs read as one consistent scientific authority regardless of which team
   member runs the skill.
2. **Analysis / draft only.** The skill computes statistics and renders a figure.
   A human in the **Scientific** role reviews method, interpretation, and any
   publication claim before it leaves the organization.
3. **Memory-driven.** Load `memory/MEMORY.md` first; apply everything in it;
   update it when you learn a durable preference (see Memory protocol).
4. **Self-scoring.** Score the output against `references/qa-rubric.md`; if below
   95/100, fix the failing criteria before returning.
5. **Zero invention (the hard gate).** **Never fabricate, impute, round-trip, or
   estimate a statistic.** Every mean, SD, p-value, correlation, count, and plotted
   point is computed directly from the supplied data by the script. Missing cells
   are dropped per-analysis and reported as `n`. If a number cannot be computed
   from the data, say so — do not invent it.

## Bundled knowledge — load in this order
This skill is self-contained. Before analysing, read:
1. `memory/MEMORY.md` — learned conventions, default chart type, recurring
   variables/units, corrections. **Highest priority after explicit user instructions.**
2. `references/brand-guidelines.md` — who GEPROMED is, palette, proof points, do/don't.
3. `references/stats-methods.md` — which test for which question; assumptions;
   reporting conventions; pitfalls (the scientific-rigor core).
4. `references/chart-standards.md` — publication norms + GEPROMED chart styling.
5. `references/intake-questions.md` — the LIGHT intake set (analysis intent +
   chart type + publication standard).
6. `references/examples.md` — worked analyses (FR + EN).
7. `references/qa-rubric.md` — the 100-point scoring rubric.
8. `assets/gepromed-logo.png` — bundled logo for branded artifacts.

**Priority order when sources conflict:** explicit user instruction > `MEMORY.md`
> references. Newer beats older; note the change in the memory correction log.

## Memory protocol (makes the skill self-improving)
- **Load:** At the start of every task, read `memory/MEMORY.md` and apply all
  stored preferences silently (default chart style, preferred test conventions,
  variable units, recurring dataset shapes).
- **Detect a learning** when the team member: (a) corrects a method choice or a
  label, (b) states a durable preference ("always report median, not mean",
  "we use Welch by default", "patency is in days"), (c) gives recurring dataset
  context (a column naming scheme, a unit), or (d) repeats the same fix twice.
- **Apply now**, then **record it**:
  - In a file-writing environment (Claude Code / agent sandbox), run:
    ```bash
    python scripts/memory_update.py --section "House-style decisions" \
      --entry "BOTH: default two-group test is Welch t-test when normal, else Mann-Whitney."
    ```
  - In a non-writing environment (ChatGPT GPT / Gemini Gem), emit a block:
    ```
    📝 MEMORY UPDATE → memory/MEMORY.md  [section: House-style decisions]
    - BOTH: default two-group test is Welch t-test when normal, else Mann-Whitney.
    ```
    and tell the team member to paste it back into the knowledge file.
- **Confirm** in one short line ("Noted for next time: …") so it is transparent.
- **Conflict:** a new instruction overrides memory; log it under "Correction log".
- **Never** store the dataset values, patient-identifying data, or one-off facts
  that are not durable preferences.

## When to use
- "Fais-moi les stats sur ce dataset." · "Compare la perméabilité entre les deux dispositifs."
- "Run a t-test on these two groups and plot a boxplot." · "Correlate diameter and burst pressure."
- "Histogramme de cette variable, prêt pour publication." · "Make a figure for the paper."
- Descriptive stats (mean / SD / median / IQR / distribution), group comparisons,
  correlations, and publication-grade figures for any of the four pillars.

## Inputs
**Required:** a dataset path (`.csv` / `.xlsx` / `.tsv` / `.txt`).
**Light-intake (ask only if missing and not inferable):** the **analysis intent**
(which comparison / correlation / which variables), the **chart type**
(hist / box / bar / scatter), and the **publication standard** (journal style,
poster, internal report). Optional: test choice, correlation method, axis labels,
units, title, output path. Never block on optional fields — infer, state the
assumption, and proceed.

## Clarification protocol (ask before half-baked output)
**Intake tier: LIGHT.** Proceed with the supplied data by default. Follow the
company standard (`skills/CONVENTIONS.md`):
- The dataset is the input. **Do not re-derive what the data makes obvious**
  (column names, types, group levels).
- Ask **only** for the missing *required-for-this-analysis* fields: the analysis
  intent (which variables / which comparison or correlation), the chart type, and
  the target publication standard — and only when they cannot be safely inferred
  (e.g. a clearly bimodal grouping column, an obvious x/y pair).
- When you must ask, ask **one batched round of at most 5** numbered questions,
  each with a suggested default, and offer: *"Reply `go` and I'll proceed with the
  defaults above."*
- Cap at **2** rounds, then proceed with clearly stated assumptions. Never stall.
  Never re-ask what `MEMORY.md` already answers.

## Routing logic / workflow
1. Load memory + references.
2. Read the dataset; report shape (rows, columns, types) — never alter values.
3. Resolve the analysis intent: pick the question type
   (distribution / comparison / correlation) and the variables. If ambiguous and
   not inferable, run the LIGHT intake (≤5 questions, defaults, `go` escape).
4. Choose the method per `references/stats-methods.md`:
   - distribution → describe + histogram;
   - 2-group comparison → normality (Shapiro) → Welch t-test if normal, else
     Mann-Whitney; report the chosen test transparently;
   - ≥3 groups → report per-group descriptives + bar/box (flag that ANOVA /
     Kruskal-Wallis is the human's call);
   - association → Pearson + Spearman with scatter and a data-derived fit line.
5. Run the deterministic helper (`analyze_and_plot.py`) to compute stats and
   render the brand-styled PNG. **All numbers come from the script, not from you.**
6. Apply `references/chart-standards.md` (labels, units, n, error bars, palette).
7. Self-score with the QA rubric; if < 95, fix and re-score.
8. Detect any memory learnings; apply + record + confirm.
9. Return in the output format, routed to the Scientific role for validation.

## Deterministic helpers
```bash
# Two-group comparison (auto-picks Welch vs Mann-Whitney via normality) + boxplot
python scripts/analyze_and_plot.py --input data.csv --chart box \
  --y patency_days --group device --test auto --out chart.png --title "Patency by device"

# Distribution (histogram + mean line)
python scripts/analyze_and_plot.py --input data.csv --chart hist --y burst_pressure_kpa --out hist.png

# Group means with SD error bars
python scripts/analyze_and_plot.py --input data.xlsx --chart bar --y force_n --group material --out bar.png

# Correlation (Pearson + Spearman) with scatter + fit line
python scripts/analyze_and_plot.py --input data.csv --chart scatter \
  --x diameter_mm --y burst_pressure_kpa --corr auto --out scatter.png

# Append a learned convention to memory
python scripts/memory_update.py --section "Recurring recipients & context" \
  --entry "Dataset 'explant-2023' uses column 'patency_days' (days, integer)."
```
The script reads CSV/Excel/TSV/TXT (pandas + openpyxl), computes descriptive and
inferential statistics (numpy + scipy), and writes one brand-styled PNG
(matplotlib, `#007AC2` / `#EC6C17`). It prints a plain-text summary to stdout.
If scipy is absent it degrades to descriptive stats only and says so.

## Output format
```
Assumptions: <variables / chart type / test / publication standard — only if inferred>   ← omit if all given

Statistics summary:
<the plain-text summary printed by analyze_and_plot.py — descriptives, test, p-values>

Chart: <path to the PNG>
Method note: <which test/correlation was used and why; assumptions checked>

Notes: <anything the Scientific reviewer must confirm before publication>   ← omit if none
Validation: route to the Scientific role before any publication claim.
QA: <score>/100                                                             ← internal check, keep ≥95
Noted for next time: <one line>                                             ← only if memory updated
```

## Quality rules (non-negotiable)
- **Zero fabricated statistics.** Every number traces to the supplied data via the
  script. No imputed, rounded-from-memory, or invented values. Unknowns are stated,
  not guessed.
- Report `n` for every group/analysis; missing data is dropped per-analysis and
  disclosed, never silently filled.
- State the test used and why (normality check, Welch vs Mann-Whitney, Pearson vs
  Spearman); never present a p-value without its test name.
- Do not assert significance or clinical relevance as conclusions — present the
  statistics; the human (Scientific role) interprets.
- Chart obeys publication norms and the GEPROMED palette: blue primary, orange a
  rare accent (≤10%), labelled axes with units, legible at print size, no chartjunk.
- Consistent GEPROMED house voice across every team member and every figure.
- **The human validates and publishes. This skill only analyses and draws.**

## Brand constants (visual elements)
Primary blue `#007AC2` · Accent orange `#EC6C17` (rare, ≤10% — mean markers /
fit line only) · Dark text `#1F2A33` · Muted text `#5F6B73`. White background,
clean grid, GEPROMED stamp. Do not overuse orange — the logo carries it.
