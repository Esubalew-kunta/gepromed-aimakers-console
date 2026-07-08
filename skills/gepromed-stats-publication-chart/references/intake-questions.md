# GEPROMED stats chart — intake questions (LIGHT tier)

**LIGHT intake.** The dataset is the input; proceed with it. Ask **only** the
missing *required-for-this-analysis* fields, and only when they cannot be safely
inferred from the data or `MEMORY.md`. One batched round, ≤5 questions, each with
a default, plus the `go` escape hatch. Cap at 2 rounds.

Infer first: read the columns and types, detect obvious group columns and numeric
pairs, and state assumptions instead of asking when the choice is clear.

---

## The question set (ask only what's missing)

1. **Analysis intent** — what do you want to know?
   - Default: *describe the main numeric variable's distribution.*
   - Options: (a) distribution of `<var>`, (b) compare `<var>` across `<group>`,
     (c) correlate `<var1>` and `<var2>`.

2. **Variables** — which columns?
   - Default: *the first numeric column (and the first categorical column as group,
     if a comparison).* Confirm if several plausible candidates exist.

3. **Chart type** —
   - Default: *box for comparisons, scatter for correlations, histogram for a single
     distribution, bar if you specifically want group means.*

4. **Publication standard** — where will the figure live?
   - Default: *internal scientific report styling.*
   - Options: journal single-column figure · conference poster panel · internal slide.
   (Affects size/label density, not the statistics.)

5. **Test / correlation method** (only if a comparison or correlation) —
   - Default for comparison: *`auto` — Welch t-test if both groups are normal
     (Shapiro), else Mann-Whitney U.*
   - Default for correlation: *`auto` — report both Pearson and Spearman.*

**Escape hatch:** *"Reply `go` and I'll proceed with the defaults above:
[state the concrete inferred variables / chart / test]."*

---

## When to skip intake entirely
- The prompt already names the comparison/correlation and variables
  (e.g. "compare patency_days between devices, boxplot").
- `MEMORY.md` already encodes the default chart, units, or test convention.
- The dataset has one obvious numeric variable and the user asked to "describe" it.

In these cases, **do not ask** — infer, state the assumptions on the `Assumptions:`
line, and produce the analysis + chart.

## Units note
If a variable's unit is needed for the axis label and is not in the column name or
memory, ask for it in question 2 — but never *invent* a unit. A label with a
`[unit?]` placeholder is acceptable if the analysis must proceed.
