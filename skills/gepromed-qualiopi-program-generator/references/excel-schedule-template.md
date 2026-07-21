# Excel schedule input — schema & sample

The generator (`scripts/generate_program_pdf.py`) and the web route
(`/api/programs`) both read a single **Excel workbook (`.xlsx`)** that carries a
Qualiopi training program. One workbook = one program. It has **two sheets**:

1. **`Fiche`** — the Qualiopi header metadata (key/value).
2. **`Planning`** — the timetable, **one row per créneau (time slot)**.

> **Dependency:** the Python script reads `.xlsx` with **`openpyxl`**
> (`pip install openpyxl`). The web route reads it with the **`xlsx`** npm
> package already bundled in the OS app. No other dependency is required.

Generate a ready-to-fill copy at any time:

```bash
python scripts/generate_program_pdf.py --make-sample-xlsx sample_program.xlsx
python scripts/generate_program_pdf.py --print-schema     # column reference
```

---

## Sheet 1 — `Fiche` (header metadata)

Two columns: **`Champ`** and **`Valeur`**. One RNQ block per row. To build a
**bullet list** (e.g. several objectives), repeat the same `Champ` on several
rows — each row becomes one bullet. A single cell may also hold several bullets
separated by a newline or ` | `.

| Champ | Valeur (example) |
|---|---|
| Intitulé | Bootcamp Vasculaire — abord et anastomose sur simulateur |
| Référence | GEP-FORM-VASC-01 |
| Version | 1.0 |
| Date | 2026-06-20 |
| Public visé | Chirurgiens vasculaires en exercice |
| Public visé | Internes en chirurgie vasculaire (à partir de la 3e année) |
| Prérequis | Statut de praticien ou d'interne. Aucun prérequis académique supplémentaire. |
| Objectifs | Réaliser une anastomose termino-latérale sur simulateur dans le temps imparti. |
| Objectifs | Identifier et corriger les défauts de suture vasculaire les plus fréquents. |
| Durée | 2 jours — 14 heures (4 demi-journées). |
| Effectif maximum | 12 participants. |
| Formateurs | Dr. X, chirurgien vasculaire — responsable pédagogique. |
| Modalités pédagogiques | Présentiel au René Kieny Education Center (Strasbourg). |
| Moyens | Simulateurs vasculaires et consommables d'entraînement fournis. |
| Évaluation | Pré-test et post-test ; évaluation pratique sur grille standardisée. |
| Délais d'accès | Inscription jusqu'à [N] jours avant la session. |
| Tarifs | [montant] € net de taxe par participant, ou nom du financeur si prise en charge tierce. |
| Inscription | Formulaire en ligne ou email au référent pédagogique, jusqu'au [date limite]. |
| Référent handicap | [nom du référent handicap] |
| Contact | Référent pédagogique GEPROMED : [email / téléphone à confirmer]. |

**Recognised `Champ` labels** (accents/case tolerant): Intitulé, Référence,
Version, Date, Public visé, Prérequis, Objectifs, Durée, Effectif maximum,
Formateurs, Modalités pédagogiques, Moyens, Évaluation, Sanction, Accessibilité,
Référent handicap, Délais d'accès, Tarifs, Inscription, Contact, Indicateurs.

**Effectif maximum** and **Formateurs** are now required blocks (client
response 2026-07-16: max participants, and trainer(s) name + title, must
appear on both the PDF and the public detail page). **Référent handicap** is
optional but recommended — when supplied, its value replaces the generic
"[email / téléphone à confirmer]" placeholder inside the auto-filled
Accessibilité block with the named contact. **Tarifs** should read as free
text: the amount plus any extra costs (accommodation/transport, discounts),
or the funder's name when the training is third-party funded.

**Auto-filled if omitted:** `Accessibilité handicap` (standard GEPROMED référent
process paragraph) and `Sanction` (attestation + certificat de réalisation).
Unknown regulatory values should stay in `[crochets]` for the Responsable
Qualité (RQ) to confirm — the generator never invents them.

### Metadata alternative (documented, single choice)

The **canonical** path is the `Fiche` sheet, so one `.xlsx` is fully
self-contained. As an override you may instead pass a companion **JSON** file:

```bash
python scripts/generate_program_pdf.py --in schedule.xlsx --meta fiche.json --out program.pdf
```

`fiche.json` uses the internal keys (`intitule`, `reference`, `version`, `date`,
`public_vise`, `prerequis`, `objectifs`, `duree`, `modalites_pedagogiques`,
`moyens`, `evaluation`, `sanction`, `accessibilite`, `delais_acces`, `tarifs`,
`inscription`, `contact`, `indicateurs`); a value may be a string or a list of
strings. When `--meta` is present it overrides the `Fiche` sheet.

---

## Sheet 2 — `Planning` (timetable — one row per créneau)

The header row must use **exactly these columns, in this order**:

```
Jour | Heure début | Heure fin | Intitulé du créneau | Type (Cours / Atelier pratique) | Groupe (vide/"Tous" ou A, B...) | Salle | Encadrant(s) | Évalué (Oui/Non)
```

| Jour | Heure début | Heure fin | Intitulé du créneau | Type | Groupe | Salle | Encadrant(s) | Évalué |
|---|---|---|---|---|---|---|---|---|
| Jour 1 — Lundi | 09:00 | 10:30 | Accueil, rappels d'anatomie et principes d'abord | Cours | *(vide)* | Amphi A | Dr. Martin | Non |
| Jour 1 — Lundi | 10:45 | 12:30 | Atelier suture vasculaire — dry-lab | Atelier pratique | A | Sim-Lab 1 | Dr. Martin | Non |
| Jour 1 — Lundi | 10:45 | 12:30 | Atelier exposition du champ opératoire | Atelier pratique | B | Sim-Lab 2 | Dr. Nguyen | Non |
| Jour 1 — Lundi | 14:00 | 17:00 | Anastomoses termino-latérales — mise en situation | Atelier pratique | Tous | Sim-Lab 1+2 | Équipe formatrice | Non |
| Jour 2 — Mardi | 09:00 | 12:00 | Débriefing individualisé et perfectionnement | Atelier pratique | A | Sim-Lab 1 | Dr. Martin | Non |
| Jour 2 — Mardi | 09:00 | 12:00 | Débriefing individualisé et perfectionnement | Atelier pratique | B | Sim-Lab 2 | Dr. Nguyen | Non |
| Jour 2 — Mardi | 13:30 | 16:00 | Évaluation pratique sur grille et synthèse | Cours | Tous | Amphi A | Équipe formatrice | Oui |

### Column notes

- **Jour** — free label; rows are grouped by this value, in first-seen order.
- **Heure début / Heure fin** — `HH:MM` text or a real Excel time cell (both are
  normalised to `HH:MM`). Blocks within a day are sorted by start time.
- **Type** — `Cours` renders blue; `Atelier pratique` renders with the orange
  accent. Any other text renders as a plain tag.
- **Groupe** — the parallel-column key (see below).
- **Salle / Encadrant(s)** — shown as slot metadata.
- **Évalué** — `Oui` adds an "Évalué" badge (maps the créneau to an assessment
  moment); anything else is treated as `Non`.

### Parallel sub-group rule (the key behaviour)

Rows sharing the **same `Jour` + `Heure début` + `Heure fin`** but a **different
`Groupe`** render as **parallel columns** — one column per group/room — so the
reader sees concurrent workshops side by side.

- `Groupe` **empty** or **`Tous`** → a single **full-width** slot for that time.
- `Groupe = A`, `B`, … → one **column per distinct group**, sorted A→B→….
- A `Tous` row and grouped rows can coexist in the same time block: the `Tous`
  row renders full-width above the group columns.

In the sample above, the two `10:45–12:30` rows (A / B) become two side-by-side
columns; the `09:00–10:30 (Tous)` row stays full width.

---

## Output

`generate_program_pdf.py` writes a **branded, A4, print-ready HTML** document
(GEPROMED charte, `@page` / `@media print` CSS, "Imprimer / Enregistrer en PDF"
button). If `--out` ends in `.pdf` **and** `weasyprint` is importable it writes a
real PDF; otherwise it writes the `.html` next to it and exits 0 (graceful
fallback). Final Canva / InDesign polish on a Gepromed gabarit is an optional
downstream step — this HTML is the automated deliverable.
