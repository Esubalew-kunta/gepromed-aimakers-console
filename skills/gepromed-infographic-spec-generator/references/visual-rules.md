# GEPROMED visual rules (charte graphique for figures)

The charte rules that keep every figure unmistakably GEPROMED and stop it looking
generic or "AI-stock". These are enforced in the spec and the mock.

## Color
- **Blue is the master color** (`#007AC2`): bars, lines, headers, key surfaces.
- **Orange is a rare accent** (`#EC6C17`, ≤10% of the surface): the **orange "O"
  motif**, **one hero number**, or **one highlighted data series/point** — never a
  background flood, never decoration.
- **Dark text** `#1F2A33` for headlines/labels; **muted** `#5F6B73` for source
  lines and axis ticks.
- **Backgrounds:** white `#FFFFFF` dominant; blue tints `#E1F0F9` / `#A8D5F2` for
  panels and gridlines.

| Token | HEX |
|---|---|
| Blue (master) | `#007AC2` |
| Orange (accent ≤10%) | `#EC6C17` |
| Dark text | `#1F2A33` |
| Muted text | `#5F6B73` |
| Blue tint | `#E1F0F9` |
| Blue tint 2 | `#A8D5F2` |
| White | `#FFFFFF` |

## The orange "O" / cycle motif
The most ownable brand device. Use it as: the loop in an implant-cycle diagram, an
inspection point, a section marker, or the accent ring around a hero number. One
motif per figure — it is a signature, not a pattern.

## Typography
- Geometric **sans-serif**; uppercase for short headers, sentence case for body.
- Clear size steps: headline > hero number/labels > support > source.
- Left-align body; center only short hero cards. No more than two type sizes
  competing for attention.

## White space
- Generous margins (≈ 8% of the canvas). White space signals credibility and
  medical clarity. Do not fill every pixel; let the figure breathe.

## Accessibility
- Contrast: dark text on white/tints; never light grey on white for key labels.
- **Greyscale-safe** for publication: distinguish series by shape/label/pattern,
  not by color alone, so blue and orange still separate in print.
- Minimum legible type at final size (≥ ~7 pt for publication).

## What to avoid (anti-charte / anti-AI-stock)
- Orange backgrounds or orange as the dominant color.
- Gradients, drop shadows, neon, glows, or "AI art" textures.
- 3-D charts, exploded pies, truncated axes, chart-junk.
- Decorative stock imagery (smiling-stock-doctor); emoji as graphic elements.
- Cluttered layouts with no white space.
- Recolored, stretched, or effect-laden logo.
- **Inventing data** to fill a chart — bracket missing values instead.

## Per-figure checklist (run before returning a spec)
- [ ] One clear message; the eye lands on the point first.
- [ ] Right viz for the data; axes honest (bars from zero).
- [ ] Blue master; orange ≤10% on the motif / one number / one series.
- [ ] Generous white space; geometric sans; two type sizes max.
- [ ] Source line present; units and N stated; nothing invented.
- [ ] Greyscale-safe + correct DPI if it's a publication figure.
- [ ] Logo placed correctly with clear space (or omitted per journal rules).
