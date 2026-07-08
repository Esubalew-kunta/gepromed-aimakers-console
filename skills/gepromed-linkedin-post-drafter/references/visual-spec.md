# GEPROMED LinkedIn — visual spec rules (charte graphique)

Every carousel and image post ships a **visual spec** the designer can execute.
These rules keep visuals on the GEPROMED charte and stop them from looking
generic or AI-stock. The visual is **specified here**, then validated and
produced by the communication function — the skill does not publish a visual.

## Master rules
- **Blue is the master color** (`#007AC2`). It carries headers, surfaces, dividers.
- **Orange is a rare accent** (`#EC6C17`, ≤10% of the surface): the **orange "O"
  motif**, one key number, or a single CTA chip — never decoration, never a
  background flood.
- **White space is a feature.** Clean, generous margins read as credible and
  medical. Do not fill every pixel.
- **Technical diagrams over stock imagery.** Prefer schematics of the implant
  cycle, a device, a process, or real session photos over decorative stock.
- **Logo:** use `assets/gepromed-logo.png`. Place bottom-left or bottom-right with
  clear space around it; never stretch, recolor, or add effects.
- **Typography feel:** geometric sans-serif, uppercase for short headers, sentence
  case for body. Engineered, not playful.
- **The orange "O" / cycle motif** is the most ownable device — use it as a section
  marker, an inspection point, or the loop in an implant-cycle diagram.

## Color tokens
| Token | HEX | Use |
|---|---|---|
| Blue (master) | `#007AC2` | Headers, key surfaces, dividers, primary shapes |
| Orange (accent ≤10%) | `#EC6C17` | "O" motif, one hero number, single CTA |
| Dark text | `#1F2A33` | Headlines, body |
| Muted text | `#5F6B73` | Captions, secondary labels, page numbers |
| Blue tint | `#E1F0F9` | Panels, soft backgrounds |
| Blue tint 2 | `#A8D5F2` | Secondary panels, callouts |
| White | `#FFFFFF` | Dominant background |

## Dimensions (px)
| Use | Size | Notes |
|---|---|---|
| LinkedIn square | 1080 × 1080 | Default for image + carousel pages |
| LinkedIn portrait | 1080 × 1350 | Higher feed presence; good for carousels |
| LinkedIn landscape | 1200 × 627 | Link-share / banner |
| Story / vertical | 1080 × 1920 | If repurposed to stories |

## Carousel grid (consistency across slides)
- Same margin on every slide (≈ 80 px on a 1080 canvas).
- Header zone (top), content zone (middle), footer zone (logo + page number 1/7).
- One idea per slide; headline ≤ 8 words; body ≤ 30 words.
- Cover slide: hook headline + subhead + logo. Closing slide: takeaway + CTA +
  orange "O" motif + logo.
- Keep type sizes consistent slide to slide; do not resize per slide.

## What to avoid (anti-charte / anti-AI-stock)
- Orange backgrounds or orange as the dominant color.
- Gradients, drop shadows, neon, or "AI art" textures.
- Generic smiling-stock-doctor imagery; emoji as graphic elements.
- Cluttered slides with no white space.
- Recolored or distorted logo; logo on a busy background without clear space.
- Inventing a chart from numbers that were not provided — bracket missing data.

## Spec template (fill this for each visual)
```
Visual: <one-line description>
Format & size: <square 1080×1080 | portrait 1080×1350 | …>
Background: <white | blue tint #E1F0F9>
Headline: "<text>"  (color #1F2A33 or #007AC2)
Focal element: <diagram / number / photo / "O" motif>
Orange accent (≤10%): <where exactly>
Logo: assets/gepromed-logo.png — <position>
Data shown: <only provided/true data; bracket the rest>
Notes for designer: <grid, page number, any constraint>
```
A quick brand-colored mock can be produced with the LinkedIn drafter's sibling
infographic skill (`gepromed-infographic-spec-generator`, `scripts/render_mock.py`).
