# GEPROMED chart standards — publication norms + brand styling

How a GEPROMED figure must look to be both **publication-grade** and
**unmistakably GEPROMED**. The script (`analyze_and_plot.py`) encodes these
defaults; this file is the rationale and the checklist for review.

---

## 1. Publication / scientific norms (non-negotiable)
- **Axes labelled, with units.** `Burst pressure (kPa)`, not `y`. Ask for units if
  unknown; never guess them.
- **Show n.** Every group/box/bar shows its sample size; the summary repeats it.
- **Show dispersion, not just central tendency.** Bars use **SD error bars**;
  boxplots show the full distribution (median line, IQR box, whiskers); the mean is
  marked. Never a bare bar of means with no error indication.
- **Honest axes.** Do not truncate the y-axis to exaggerate a difference unless
  scientifically justified and disclosed. Default to a zero-anchored or
  data-driven range that does not mislead.
- **One message per figure.** A figure answers one question (one comparison, one
  correlation, one distribution). No dual-axis tricks.
- **Legible at print size.** ~150 dpi minimum, readable fonts (≥11 pt body),
  no overlapping labels. Suitable for a single-column journal figure or A0 poster
  panel.
- **No chartjunk.** No 3-D, no gradients, no drop shadows, no decorative gridlines.
  Light horizontal grid only; top/right spines removed.
- **Reproducible.** The figure is generated deterministically from the data and the
  command; the command is part of the record.

## 2. GEPROMED brand styling (applied by the script)
| Element | Spec |
|---|---|
| Background | white |
| Primary series | blue `#007AC2` |
| Accent (rare, ≤10%) | orange `#EC6C17` — mean markers, fit line, the one thing to notice |
| Body / title text | dark `#1F2A33`, title bold, left-aligned |
| Axis ticks / secondary text | muted `#5F6B73` |
| Grid | light `#D9DEE2`, horizontal, thin |
| Categorical palette | blue → orange → desaturated blue/grey tints (never a rainbow) |
| Mark | small "GEPROMED" stamp bottom-right |

**Orange discipline:** orange is a *safety/attention* accent, not decoration. Use
it for the single element the reader should look at (the mean, the trend line),
never for whole series unless there are exactly two groups and contrast is needed.
The logo (`assets/gepromed-logo.png`) already carries the orange — do not compete
with it.

## 3. Chart-type guide
- **Histogram (`hist`)** — distribution of one numeric variable; dashed orange mean
  line. Choose sensible bins (`--bins`); default 12.
- **Boxplot (`box`)** — compare a numeric outcome across groups; shows shape,
  median, IQR, outliers, and a mean diamond. Best for two-group comparisons.
- **Bar (`bar`)** — group means with **SD error bars**. Use when the audience
  expects bars; the boxplot is usually more informative for distributions.
- **Scatter (`scatter`)** — association between two numeric variables; includes a
  least-squares fit line labelled with its equation (descriptive, not predictive).

## 4. Labels, titles, captions
- **Title:** short, specific, left-aligned (e.g. "Patency by device"). Avoid hype;
  no "Amazing results".
- **Axis labels:** variable + unit. Override with `--xlabel` / `--ylabel`.
- **Legend:** only when it adds information (mean line, fit equation); frameless.
- **Caption (for the manuscript, written by the human):** state n, test used, and
  what error bars represent. The skill provides the method note to support this.

## 5. Pre-return checklist (figure)
- [ ] Axes labelled with correct units
- [ ] n shown for every group
- [ ] Dispersion shown (SD bars / box / spread)
- [ ] y-axis not misleadingly truncated
- [ ] Brand palette respected; orange ≤10% and purposeful
- [ ] Legible at intended print size; no chartjunk
- [ ] Title specific and non-hype; GEPROMED stamp present
- [ ] Numbers in the figure match the summary exactly (both from the script)
- [ ] Routed to the Scientific role for validation before publication
