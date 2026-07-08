# Branded Template Library — worked examples

Target-quality runs showing the moves: FULL-tier intake, the charte applied
(blue/orange/logo/Calibri), house voice, and **zero invented** facts/figures
(everything unknown bracketed for the author).

---

## 1 — FR · report skeleton (intake → JSON → .docx)

**User:** "Un modèle de rapport d'activité pour la plateforme de test, structure
synthèse + activité + faits marquants + perspectives."

**Intake:** type=report (given), audience=internal/default, outline given,
language=FR → no further questions.

**Generated content (rendered into report.docx):**
- **Title:** Bilan d'activité — Plateforme de test 2026 · tag "Rapport" (orange)
- **Synthèse:** "Ce rapport présente l'activité de la plateforme de test sur la
  période [période]. Les chiffres ci-dessous sont à confirmer par le responsable
  de plateforme."
- **Activité de test:** "Essais mécaniques réalisés : [N]" · "Dispositifs
  cardiovasculaires évalués : [N]" · "Référentiels : ISO 9001, ISO 13485"
- **Faits marquants:** "[À compléter avec les éléments validés.]"
- **Perspectives:** "[Axe 1]" · "[Axe 2]"

**Moves:** real certifications kept (ISO 9001/13485 are true proof points); all
counts bracketed; no invented figures; blue ruled headings, footer flags a working
document.

---

## 2 — EN · presentation deck (.pptx)

**User:** "Make a GEPROMED slide template introducing our test platform to a
manufacturer — title, mission, capabilities, collaboration. English."

**Generated deck (deck.pptx):**
- **Title slide:** blue band + logo + "GEPROMED — Test Platform" + subtitle
  "Mechanical & biomaterial testing of cardiovascular devices" + orange accent rule.
- **Agenda:** Mission · Testing capabilities · Collaboration.
- **Mission:** "Patient safety across the implant lifecycle" · "Independence and
  scientific rigour".
- **Testing capabilities:** "Mechanical testing" · "Biomaterial testing" ·
  "ISO 9001 · ISO 13485".
- **Collaboration:** "[terms to define]" · "[contact]".
- **Closing:** "Thank you" + "[contact] · gepromed.com" + logo.

**Moves:** ≤6 bullets/slide; logo on every slide; orange only as the accent rule;
collaboration specifics bracketed; no clip-art.

---

## 3 — FR · letter to an institution (.docx)

**User:** "Modèle de courrier de demande de soutien à une institution, ton formel."

**Generated letter (letter.docx):**
- Logo header + recipient block (`[Nom]`, `[Institution]`, `[Adresse]`).
- "Strasbourg, le [date]".
- **Objet :** Demande de soutien — programme de formation par simulation.
- Salutation: "Madame, Monsieur," (institution register).
- Body: mission framing + the specific request, scope bracketed `[périmètre]`.
- Closing: "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes
  salutations distinguées." + signature block (`[Prénom Nom]` / `[Fonction]`).

**Moves:** institutional register/closing applied automatically; scope bracketed;
no invented amounts or commitments.

---

## 4 — FR · email scaffold (text)

**User:** "Un modèle d'email à un fabricant pour proposer l'analyse d'explants."

**Generated email (email.txt):**
```
Objet : Analyse d'explants indépendante — GEPROMED

Bonjour,

Je reviens vers vous au sujet d'une possible collaboration sur l'analyse d'explants.

- Analyse d'explants indépendante
- Essais mécaniques et biomatériaux
- Cadre ISO 9001 / ISO 13485

Seriez-vous disponible pour un court échange dans les prochaines semaines ?

Cordialement,

[Prénom Nom]
[Fonction]
GEPROMED — The medical device hub for patient safety
[téléphone]  ·  [email]  ·  gepromed.com
```

**Moves:** industry register, one explicit ask, plain text (no colour/HTML),
contact bracketed. For a full *rewrite* of an existing email, use the
`gepromed-email-reformulation` skill instead.

---

## 5 — Anti-pattern gallery (never produce)

- A deck padded with invented statistics ("nous avons formé 3000 chirurgiens").
- Marketing superlatives in a title or heading ("La meilleure plateforme d'Europe").
- Orange used as a fill or for more than one focal element per page.
- A coloured/HTML email (email type is plain text).
- A "template" so generic it carries no GEPROMED structure or voice.
- An institutional letter closed with a casual "Cordialement," — match the register.
