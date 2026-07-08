# GEPROMED infographic specs — worked examples

Figure specs at target quality. Study the *moves*: one message per figure, the
right viz for the data, blue master + orange ≤10%, clear hierarchy, source line,
and **nothing invented** — every unconfirmed value is `[bracketed]`. A designer
executes; a human validates before publishing.

---

## 1 — EN · LinkedIn stat card · explant analysis

```
═══ FIGURE SPEC: Vascular explants received ═══
Core message:   The volume of explants we receive is what turns single cases into patterns.
Figure type:    Stat card
Data-viz type:  Single hero number — one figure is the whole story.
Dimensions:     1080 × 1080 px (LinkedIn square)
Hierarchy:      1) headline  2) hero number  3) support  4) source  5) logo
Layout:         Headline top-left; hero number centered inside an orange "O" ring;
                support line below; source bottom-left; logo bottom-left corner.
Colors:         white background · hero number #EC6C17 in the "O" ring · headline
                & support #1F2A33 · source #5F6B73 · thin blue #007AC2 header rule.
Copy blocks:
  - Headline:   "Each explant is evidence"
  - Hero:       "[+150]"  ·  unit: "explants in [2023]"
  - Support:    "World's largest vascular explant database"
  - Source:     "Source: [internal — confirm]"
Logo:           assets/gepromed-logo.png — bottom-left
Accessibility:  high contrast; orange number large enough to read greyscale.
```
**Moves:** one number, one message; orange used only on the hero + "O" ring (≤10%);
the +150 and 2023 bracketed for confirmation; source line present.

---

## 2 — FR · figure de rapport · barres · explants par année

```
═══ FIGURE SPEC : Explants reçus par année ═══
Message clé :   Le volume d'explants reçus augmente et alimente nos analyses.
Type de figure: Diagramme en barres
Data-viz :      Barres (catégories = années) — comparaison de comptages, axe à zéro.
Dimensions :    1080 × 1080 px (ou ~1600 px @150 DPI pour le rapport)
Hiérarchie :    1) titre  2) barres  3) note  4) source  5) logo
Mise en page :  Titre en haut ; barres bleues, l'année la plus récente en orange ;
                note sous l'axe ; source en bas ; logo en bas à gauche.
Couleurs :      barres #007AC2 · barre mise en avant #EC6C17 · texte #1F2A33 ·
                ticks/source #5F6B73 · fond blanc.
Blocs de texte :
  - Titre :     « Explants vasculaires reçus »
  - Étiquettes: 2021 · 2022 · 2023  (valeurs = données fournies uniquement)
  - Note :      « Base de données d'explants vasculaires la plus large au monde »
  - Source :    « Source : [interne — à confirmer] »
Logo :          assets/gepromed-logo.png — en bas à gauche
Accessibilité : axe démarrant à zéro ; barre orange distinguable en niveaux de gris.
```
**Moves:** bar for a count comparison; axis at zero (honest); one orange bar as the
accent; only provided values plotted; source bracketed. (Rendered mock matches
`scripts/render_mock.py --spec bar.json`.)

---

## 3 — EN · publication figure · comparison (expected vs observed)

```
═══ FIGURE SPEC: Expected vs observed service life ═══
Core message:   The device reached end-of-life earlier than its expected threshold.
Figure type:    Comparison (two values)
Data-viz type:  Paired bars (expected vs observed), axis at zero.
Dimensions:     Publication figure — 300 DPI, single-column ≈ 85 mm wide.
Hierarchy:      1) figure  2) labels  3) caption (below)  4) no logo (journal rules)
Layout:         Two bars side by side; expected in blue, observed in orange;
                value labels above each; greyscale-safe via labels + pattern.
Colors:         expected #007AC2 (solid) · observed #EC6C17 (solid, hatched for
                greyscale) · labels #1F2A33 · axis #5F6B73 · white background.
Copy blocks:
  - Headline:   (none on-figure; the caption carries it)
  - Labels:     "Expected: [value] [unit]" · "Observed: [value] [unit]"
  - Caption:    "Fig. [n]. Observed service life vs the expected threshold for
                [device type] (N = [N]). [Source/method]."
  - Source:     stated in the caption.
Logo:           omitted — journal figures carry no branding unless allowed.
Accessibility:  300 DPI; greyscale-safe (hatching + labels); type ≥ 7 pt at size.
```
**Moves:** comparison viz for two values; publication standard (300 DPI,
greyscale-safe, caption below, no logo); every value and N bracketed; no
overstatement — the caption states facts, not conclusions.

---

## 4 — EN · process diagram · the explant's journey (cycle motif)

```
═══ FIGURE SPEC: The journey of an explant ═══
Core message:   A removed device becomes evidence that makes the next one safer.
Figure type:    Process diagram → closing into the implant-cycle loop.
Data-viz type:  Labeled steps connected left-to-right, closing with the orange "O" loop.
Dimensions:     1080 × 1350 px (LinkedIn portrait) or report half-page.
Hierarchy:      1) headline  2) the step sequence  3) closing loop  4) logo
Layout:         5 step boxes: Implantation → Removal → Intake → Analysis → Insight;
                an orange "O" loop top-right signals "the cycle closes".
Colors:         step outlines #007AC2 · the closing loop / final step accent #EC6C17 ·
                labels #1F2A33 · white background, generous white space.
Copy blocks:
  - Headline:   "From the operating room back to the bench"
  - Labels:     Implantation · Removal · Intake · Analysis · Insight
  - Caption:    "Closing the loop between clinicians and engineers."
  - Source:     n/a (conceptual diagram — no data claimed)
Logo:           assets/gepromed-logo.png — bottom-right
Accessibility:  one accent color; steps distinguishable by label, not color alone.
```
**Moves:** process viz for a sequence; the ownable "O" / cycle motif as the accent;
conceptual diagram so no data is claimed; technical clarity over decoration.

---

## Anti-pattern gallery (never produce these)
- Inventing a number to fill a chart instead of `[bracketing]` it.
- A pie chart for a trend, a 3-D bar, or a truncated axis that exaggerates.
- Orange as the dominant color, gradients, glows, or stock-photo decoration.
- A publication figure that is not greyscale-safe or below 300 DPI.
- Two messages crammed into one figure.
- A logo stretched, recolored, or dropped onto a busy background.
