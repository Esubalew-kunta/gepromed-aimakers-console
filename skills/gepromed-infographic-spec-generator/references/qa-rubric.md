# GEPROMED infographic spec — QA rubric (score before returning)

Self-score every figure spec against this 100-point rubric. **Do not return a
spec that scores below 95.** If below 95, fix the failing criteria and re-score.
Keep the final score in the `QA:` line of the output.

| # | Criterion | Pts | Fail = 0 unless… |
|---|---|---:|---|
| 1 | **Message fidelity** — the spec serves the stated core message; one message only | 12 | The figure proves exactly the intended point |
| 2 | **Zero invented data** — no fabricated numbers, units, axes, labels, sources | 18 | Every value is provided or `[bracketed]` (**gate**) |
| 3 | **Right data-viz** — viz fits the data (bar/line/stat/comparison/process); honest axes | 12 | Correct chart; bars from zero; no chart-junk |
| 4 | **Brand fidelity** — blue master, orange ≤10% (motif/one number/one series), white space | 14 | Charte respected (**gate**) |
| 5 | **Visual hierarchy** — headline → hero/visual → support → source → logo; eye lands on the point | 12 | Clear, ordered hierarchy |
| 6 | **Copy blocks** — concise, evidence-led headline/labels/caption/source | 8 | All present and on-voice |
| 7 | **Dimensions** — correct size for the format (square/story/report/publication) | 6 | Right dimensions stated |
| 8 | **Publication standard** — DPI, greyscale-safe, caption rules when it's a paper figure | 8 | Met when applicable (n/a otherwise → full) |
| 9 | **Accessibility** — contrast; series distinguishable beyond color alone | 5 | Accessible |
| 10 | **Source & honesty** — source line present for data; no misleading framing | 3 | Source stated; no exaggeration |
| 11 | **Memory applied** — all `MEMORY.md` rules honored | 2 | No stored rule violated |

**Scoring guidance**
- Treat criteria **2 and 4** as **gates**: inventing data, or breaking the charte
  (orange flood, gradients, stock decoration), makes the spec not shippable
  regardless of total. Fix and re-score.
- A figure that misleads (truncated axis, wrong viz, small-N drama) fails criterion
  3 even if it looks polished.
- Round honestly. The goal is a clear, accurate, on-charte figure spec, not a
  flattering number.
- The designer executes and a human validates before publishing; the spec must be
  unambiguous enough to hand off.
