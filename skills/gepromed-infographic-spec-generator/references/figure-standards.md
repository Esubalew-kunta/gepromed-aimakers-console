# GEPROMED figure standards — types, data-viz, hierarchy, dimensions

How to choose and structure a GEPROMED figure so it is clear, honest, and
on-charte. This is the design logic the skill and `render_mock.py` follow.

## One message per figure
Every figure says **one** thing. Decide the core message first, then choose the
viz that proves it most directly. If you have two messages, you have two figures.

## Figure types & when to use each
| Type | Use when… | Default format |
|---|---|---|
| **Stat card** | one number is the whole story (e.g. "+150 explants in 2023") | square 1080×1080 |
| **Bar chart** | comparing categories / counts | square or report |
| **Line chart** | a trend over time | square or report |
| **Comparison** | before/after, A vs B, expected vs observed | square or report |
| **Process diagram** | a sequence of steps (e.g. an explant's journey) | square / portrait |
| **Implant-cycle loop** | the four pillars as a closed safety loop (uses the "O" motif) | square / portrait |
| **Publication figure** | a results figure for a paper/report | per journal spec |

## Data-viz choice (honesty rules)
- **Bar** for categories; **line** for time trends; **single stat** for one number;
  **comparison** for two values. Do **not** force a pie chart on a trend, or a
  3-D chart on anything.
- Start bar axes at **zero**; never truncate to exaggerate a difference.
- Label units; show the **N** and the period; cite the **source**.
- Chart **only data the user provided.** If a value is missing, place a
  `[bracketed]` placeholder — never invent or estimate a number.
- If the data can mislead (small N, no baseline), say so in the caption rather
  than dramatize the visual.

## Visual hierarchy (the eye's path)
1. **Headline** — the message in plain words (top).
2. **Hero number / main visual** — the chart or the one big number.
3. **Support** — labels, secondary values, a short note.
4. **Source line** — where the data comes from (muted text).
5. **Logo** — `assets/gepromed-logo.png`, a corner, with clear space.

Keep generous white space between zones. The point should be readable in 3 seconds.

## Dimensions
| Use | Size / spec |
|---|---|
| LinkedIn square | 1080 × 1080 px |
| LinkedIn portrait | 1080 × 1350 px |
| LinkedIn / IG story | 1080 × 1920 px |
| Report figure (inline) | ~1600 px wide @ 150 DPI, or half/full page |
| Publication figure | **300 DPI**, column width per journal (single ≈ 85 mm, double ≈ 180 mm), greyscale-safe, caption per journal |

## Publication-figure standard (#15)
For a paper or formal report figure:
- **300 DPI** minimum; vector (PDF/EPS/SVG) preferred where the journal allows.
- **Greyscale-safe:** distinguish series by shape/pattern/label, not color alone
  (blue and orange must still read when printed in greyscale).
- **Caption below** the figure; define every abbreviation; state N, units, source.
- Type size legible at print column width (≥ ~7 pt at final size).
- No GEPROMED logo inside a journal figure unless the journal allows branding;
  for internal reports the corner logo is fine.

## The spec schema (read by render_mock.py)
The mock renderer reads a small JSON spec:
```json
{
  "title": "Vascular explants received",
  "type": "stat_card",            // stat_card | bar | process | cycle
  "size": [1080, 1080],
  "headline": "Each explant is evidence",
  "hero": "[+150]",               // the one big number (bracket if unconfirmed)
  "hero_unit": "explants in [2023]",
  "support": "World's largest vascular explant database",
  "source": "Source: [internal / confirm]",
  "bars": [ {"label": "2021", "value": 90}, {"label": "2022", "value": 120} ],
  "lang": "en"
}
```
- `type: stat_card` → renders a hero number card (orange hero number).
- `type: bar` → renders blue bars from `bars[]` (one bar may be orange-highlighted).
- `type: process` / `cycle` → renders labeled steps / a loop with the "O" motif.
- Any unconfirmed value should be `[bracketed]` in the spec — the renderer prints
  it literally; it never fabricates data.

The mock is a **layout proof on the charte**, not the final asset. A designer
produces the finished figure; a human validates before publishing.
