# Qualiopi Program Generator — worked examples

Target-quality programs showing the moves: every RNQ block present, objectives
written as assessable action verbs, evaluation aligned to objectives, accessibility
as a *process*, zero invented figures (everything unknown bracketed). These are
illustrative content blocks the script renders into a brand-styled `.docx`.

---

## 1 — FR · simulation clinical action (intake → JSON → program)

**User request:** "Programme Qualiopi pour un bootcamp d'anastomose vasculaire sur
simulateur, 2 jours, pour chirurgiens et internes."

**Intake (Round 1):** user replies `go`.

**Generated content (rendered blocks):**

- **Intitulé:** Bootcamp Vasculaire — abord et anastomose sur simulateur
- **Public visé:** Chirurgiens vasculaires en exercice ; internes en chirurgie
  vasculaire (à partir de la 3e année).
- **Prérequis:** Statut de praticien ou d'interne en chirurgie vasculaire. Aucun
  prérequis académique supplémentaire.
- **Objectifs pédagogiques:**
  - Réaliser une anastomose termino-latérale sur simulateur dans le temps imparti.
  - Identifier et corriger les défauts de suture vasculaire les plus fréquents.
  - Appliquer les principes d'exposition et de préparation du champ opératoire.
  - Évaluer la qualité d'une anastomose à l'aide d'une grille standardisée.
- **Durée:** 2 jours — 14 heures (4 demi-journées).
- **Modalités pédagogiques:** Présentiel au René Kieny Education Center
  (Strasbourg) ; formation par simulation (dry-lab) ; démonstrations, mises en
  situation, débriefing individualisé.
- **Modalités d'évaluation:** Pré-test et post-test ; évaluation pratique sur
  grille standardisée ; questionnaire de satisfaction à chaud et à froid.
- **Sanction:** Attestation de fin de formation + Certificat de réalisation.
- **Accessibilité handicap:** [standard GEPROMED process paragraph — référent
  handicap, étude au cas par cas, contact `[à confirmer]`].
- **Délais d'accès:** Inscription jusqu'à `[N]` jours avant la session, selon les
  places disponibles.
- **Tarifs:** `[montant]` € net de taxe par participant ; prises en charge OPCO /
  employeur / personnel.
- **Inscription:** Formulaire en ligne ou email auprès du référent pédagogique,
  jusqu'au `[date limite]`.

**Moves:** objectives are all assessable; evaluation maps to them; accessibility
is a process; price/dates bracketed for the RQ; no superlatives in the intitulé.

---

## 2 — EN · blended (distanciel + présentiel) program

**User request:** "Qualiopi programme, English, for a device-vigilance training:
half e-learning, half on-site workshop, for clinical research associates."

**Generated content (rendered blocks):**

- **Course title:** Medical-Device Vigilance & Incident Reporting — Blended
- **Target audience:** Clinical research associates; quality and vigilance staff
  in healthcare or industry settings.
- **Prerequisites:** Professional involvement in clinical research or device
  quality. No additional academic prerequisite.
- **Learning objectives:**
  - Identify a reportable device incident against the regulatory criteria.
  - Apply the incident-reporting workflow within the required timeframe.
  - Analyse a case to distinguish device-related from non-device-related events.
  - Produce a compliant incident report using the standard template.
- **Duration:** 10 hours — 5 h asynchronous e-learning + 5 h on-site workshop.
- **Delivery methods:** Blended. Asynchronous distance learning on `[platform]`
  (self-paced modules + quizzes) followed by an on-site workshop with case-based
  exercises and debriefing.
- **Assessment methods:** Platform quizzes per module; final case-based
  assessment scored on a rubric; satisfaction survey (immediate and follow-up).
- **Certificate / proof:** Certificate of completion; certificate of attendance
  for the relevant actions.
- **Accessibility (disability):** [standard GEPROMED process paragraph — disability
  referent, case-by-case review, contact `[to confirm]`].
- **Access lead time:** Enrolment open until `[N]` days before the on-site session,
  subject to availability.
- **Pricing:** `[amount]` net of tax per participant; funding via `[OPCO / employer
  / self-funded]`.
- **Enrolment process:** Online form or email to the pedagogical referent until
  `[deadline]`.

**Moves:** distanciel block names platform + async/sync split (RNQ Ind. 19);
objectives assessable; the workshop assessment maps to them.

---

## 3 — Anti-pattern gallery (never generate)

- Objectives like "Comprendre la vigilance" / "Connaître les anastomoses" — not
  measurable. Rewrite with action verbs tied to the assessment.
- "Public : tout public" for a specialised clinical action.
- A blank Prérequis (use "Aucun prérequis").
- A missing Accessibilité handicap or Modalités d'évaluation block.
- Invented satisfaction/success rates ("98 % de réussite"), invented prices, or a
  diploma GEPROMED does not issue.
- Marketing language in the intitulé ("La meilleure formation vasculaire de France").
