# GEPROMED Stats Chart Skill — MEMORY

Self-updating analysis-convention memory. The skill **loads this first** and
applies everything below. It **appends** here (via `scripts/memory_update.py` or a
`📝 MEMORY UPDATE` block) whenever a GEPROMED team member teaches it something
durable. Priority: explicit user instruction > this file > references.

> This is a **company** memory, shared across all team members. Do not store
> dataset values, patient-identifying data, secrets, or one-off facts. Store only
> durable conventions: default methods, chart styling, recurring column schemes
> and units.

How entries are formatted: each line is one durable rule, prefixed with `FR:`,
`EN:`, or `BOTH:` where language-specific. The script keeps them de-duplicated and
dated in the Correction log.

---

## Glossary additions
<!-- Approved variable names, units, and terms. Seeded; extend on use. -->
- BOTH: Brand name is "GEPROMED" in figure stamps/wordmarks, "Gepromed" in running text.
- BOTH: Report mean ± SD for normal data; median [Q1–Q3] (IQR) for skewed data.

## House-style decisions
<!-- Durable choices about method, chart styling, reporting. Seeded; extend on use. -->
- BOTH: Default two-group test is `auto` — Welch t-test if both groups pass Shapiro normality, else Mann-Whitney U.
- BOTH: Default correlation reports both Pearson and Spearman (`--corr auto`).
- BOTH: Always show n for every group on the chart and in the summary.
- BOTH: Primary series blue #007AC2; orange #EC6C17 only as a rare accent (mean marker / fit line), ≤10%.
- BOTH: Never state clinical significance or a publication conclusion — present statistics; route interpretation to the Scientific role.

## Recurring recipients & context
<!-- Recurring datasets, column schemes, units. Empty until learned. -->
- (none yet)

## Approved phrasings / snippets
<!-- Reusable, pre-approved method notes / captions. Empty until learned. -->
- (none yet)

## Do / Don't learned
<!-- Specific things to do or avoid, learned from corrections. Empty until learned. -->
- (none yet)

## Correction log
<!-- Dated record of what changed and why. Appended automatically. -->
- 2026-06-20 — Seed file created with initial statistical and styling defaults.
