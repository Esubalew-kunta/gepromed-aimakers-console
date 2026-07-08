# Training admin pack — layout specification (domain reference)

How the three artifacts in the pack must look. The generator
(`scripts/generate_admin_pack.py`) implements this spec; this file documents the
intent so a human can review the output against the GEPROMED charte.

> Visual brand: master blue `#007AC2`, rare orange accent `#EC6C17` (≤10%), dark
> text `#1F2A33`, muted `#5F6B73`, white background, bundled logo. No hype, no
> decorative imagery.

---

## 1. Feuille d'émargement (attendance sheet) — `.docx`

A formal attendance/signing sheet, one per session (or per half-day).

- **Header band:** GEPROMED logo (left), tagline line, then the title
  "Feuille d'émargement" / "Attendance sheet" in blue.
- **Session block:** intitulé de la formation, date(s), horaires, lieu, formateur,
  and a half-day/session label. Unknown values bracketed.
- **Table:** one row per participant, columns:
  `#` · `Nom` · `Prénom` · `Organisme/Fonction` · `Signature matin` · `Signature après-midi`.
  (EN: `#` · `Last name` · `First name` · `Organisation/Role` · `Signature AM` · `Signature PM`.)
  Header row filled blue, white text. Signature cells left empty with generous row height.
- **Trainer signature line** at the foot, plus a place/date line.
- **Footer:** "Document de présence — GEPROMED, organisme de formation certifié
  Qualiopi" and a discreet "À conserver pour le suivi qualité."
- The émargement is a **physical signing document**: it is printed and signed on
  paper. The skill produces the blank, correctly-populated sheet.

## 2. Badges — `.docx` (grid of cards) by default

Printable name badges, one per participant, laid out as a grid on A4.

- **Card size:** ~90 × 55 mm (standard badge), 2 columns × 5 rows per A4 page
  (10 badges/page), with a thin blue border per card.
- **Card content (centered):**
  - GEPROMED logo (small, top).
  - Participant **Prénom NOM** in bold dark text (largest element).
  - Organisme / fonction in muted text (smaller), if supplied.
  - A thin orange rule or the course intitulé in small blue text at the bottom.
- **No invented data:** if organisation is missing, the line is omitted (not bracketed
  on a badge — a badge must look clean).
- Pillow is used to render crisp badge cards if available; otherwise a `.docx`
  table grid is produced. Both are acceptable; the `.docx` grid is the default so
  the pack is a single editable file family.

## 3. RGPD notice — `.docx`

The data-protection notice from `rgpd-notice-template.md`, rendered as a clean
one-page document.

- **Header:** logo + title "Information sur le traitement de vos données
  personnelles" / "Information on the processing of your personal data" in blue.
- **Body:** the standard notice text (FR or EN), with `[bracketed]` placeholders
  for the DPO email, retention period, and address where not supplied.
- **Footer:** "À valider par le DPO avant diffusion" / "To be validated by the DPO
  before release."

## 4. File outputs

The generator writes, into the chosen output directory:
- `feuille_emargement.docx`
- `badges.docx`
- `notice_rgpd.docx`

A short `README` of the pack contents is optional. Filenames mirror the language
where useful but stay stable for tooling.

## 5. Brand rules applied to every artifact

- Blue headings and table header bands; orange used only as a thin accent.
- Logo on every document.
- Dark body text, muted secondary text.
- Every document footer states the validating role (DPO for the notice; quality
  suivi for the émargement) — a human validates before use.
