# RGPD / GDPR drafter — worked examples

These show the target quality and the **discipline**: structure from the
skeletons, house voice, and — above all — **every unsupplied legal/factual element
bracketed for the DPO**, never invented. Study the moves: no asserted article
numbers, no invented retention periods, special-category data flagged, VALIDATION
FLAG always present.

---

## 1 — FR · Mention d'information (privacy notice) for a training-registration form

**Request:** "Prépare une mention d'information RGPD pour le formulaire
d'inscription aux formations. On collecte nom, email, profession. Base : exécution
du contrat de formation. Conservation : à confirmer."

**Draft:**
```
Document: Mention d'information / Privacy notice  ·  GEPROMED role: controller

Vos données personnelles

Les informations recueillies via ce formulaire (nom, adresse e-mail, profession)
sont traitées par [GEPROMED — raison sociale et adresse exactes à confirmer par le
DPO] afin de gérer votre inscription et le suivi de la formation.

Base légale : exécution du contrat de formation (base indiquée par le service —
à confirmer par le DPO).
Destinataires : [équipes internes en charge des formations / sous-traitants
éventuels — à confirmer].
Durée de conservation : [durée — à confirmer par le DPO].

Conformément à la réglementation applicable, vous disposez d'un droit d'accès, de
rectification, d'effacement, de limitation, d'opposition et de portabilité de vos
données. Pour les exercer : [contact / e-mail DPO — à confirmer].
Vous pouvez introduire une réclamation auprès de l'autorité de contrôle [CNIL —
coordonnées à confirmer].

Bracketed items for the DPO to confirm:
- [raison sociale + adresse] — exact legal entity details
- legal basis "exécution du contrat" — confirm and cite the applicable provision
- [durée de conservation] — set the retention period
- [destinataires / sous-traitants] — list recipients/processors
- [contact DPO] and [coordonnées CNIL]

⚠️ VALIDATION FLAG — DPO: DRAFT, not legal advice. Every legal wording, basis and
retention must be reviewed and validated by the GEPROMED DPO before any use.

QA: 97/100
```
**Moves:** basis is attributed to the service and still flagged; retention left
bracketed (never invented); rights listed plainly; no article number asserted.

---

## 2 — EN · Record-of-processing entry (registre) for the donor database

**Request (after intake):** "Registre entry for our donor database. Identity +
financial data. Purpose: managing donations and tax receipts. Basis: unsure.
Kept: unsure."

**Draft:**
```
Document: Record of processing activities (one entry)  ·  GEPROMED role: controller

Processing name: Donor management
Purpose(s): manage donations and issue tax receipts
Legal basis: [to confirm by the DPO — possibly "legal obligation" for tax records
and/or "contract"/"legitimate interest" for donor relations; the DPO decides]
Categories of data subjects: donors
Categories of personal data: identity (name, contact), financial (donation details)
Recipients: [internal finance team / accountant / authorities — to confirm]
Processors: [named processors, e.g. payment/CRM provider — to confirm]
Transfers outside the EU: [yes/no + mechanism — to confirm]
Retention: [to confirm by the DPO — note: accounting records often have a statutory
minimum the DPO will set]
Security measures: [general description — to confirm with DPO/IT]
DPIA required? [to be assessed by the DPO]

Bracketed items for the DPO to confirm:
- legal basis (likely a mix — DPO decides and cites)
- retention period (subject to accounting/tax rules — DPO sets)
- recipients and processors
- transfers and security measures
- DPIA assessment

⚠️ VALIDATION FLAG — DPO: DRAFT, not legal advice. The DPO validates the basis,
retention, and DPIA assessment before this entry is added to the register.

QA: 96/100
```
**Moves:** offers candidate bases as a *question to the DPO*, never a ruling;
flags statutory retention without inventing a number; DPIA left to the DPO.

---

## 3 — FR · Recueil de consentement (consent form) for a clinical-research study

**Request:** "Formulaire de consentement pour une étude de recherche. Données de
santé. Finalité : analyse des explants et suivi clinique."

**Draft (excerpt):**
```
Document: Recueil de consentement / Consent form  ·  GEPROMED role: controller

⚠️ Données de santé / données sensibles : ce traitement porte sur des données de
santé. Une base légale ET une condition d'exception spécifiques (et possiblement
une AIPD/DPIA) doivent être déterminées et validées par le DPO. La formulation
ci-dessous est un PROJET de structure, pas un texte juridique définitif.

Consentement à la participation

Responsable de traitement : [GEPROMED — entité et adresse à confirmer par le DPO].
Finalité : [analyse des explants et suivi clinique — finalité précise à confirmer].
Données concernées : [données de santé et identité — détail à confirmer].

☐ J'accepte que mes données soient traitées pour la finalité décrite ci-dessus.
   (Case non pré-cochée — opt-in explicite requis.)

Vous pouvez retirer votre consentement à tout moment, aussi facilement que vous
l'avez donné, sans que cela affecte la licéité du traitement effectué avant le
retrait. Pour en savoir plus : [lien vers la politique de confidentialité — à
confirmer]. Contact : [e-mail DPO — à confirmer].

Bracketed items for the DPO to confirm:
- [entité GEPROMED], [finalité précise], [détail des données de santé]
- legal basis AND the special-category exception (explicit consent / research
  safeguards — DPO determines)
- whether an AIPD/DPIA is required
- [lien politique], [contact DPO], consent-logging method

⚠️ VALIDATION FLAG — DPO: DRAFT, not legal advice. Health-data processing — the DPO
must validate the basis, the exception, the DPIA decision, and the exact wording.

QA: 97/100
```
**Moves:** special-category data flagged at the top; explicit unticked opt-in;
withdrawal clause; the exception and DPIA are DPO decisions, not assertions.

---

## 4 — EN · Reviewing a supplied DPA clause (no invention, only structure + flags)

**Request:** "Review this processor clause for our cloud hosting provider." (user
pastes a draft clause)

**Response shape:**
```
Document: DPA / processor clause review  ·  GEPROMED role: controller

What the clause already covers: subject-matter, documented instructions,
confidentiality. [quote/summarise only what the user supplied]

Structural items that appear MISSING or unclear (check against the skeleton):
- breach-notification timeframe — [not found — DPO/legal to add and set the delay]
- sub-processing authorisation regime — [unclear — DPO to confirm]
- end-of-contract data return/deletion — [not found — DPO to add]
- audit rights — [not found — DPO to add]

I did NOT add or rewrite legal wording: the exact contractual language is for the
DPO / legal counsel.

⚠️ VALIDATION FLAG — DPO: DRAFT review, not legal advice. The DPO / legal counsel
validates all contractual wording before signature.

QA: 96/100
```
**Moves:** the skill reviews structure and gaps but **does not write or assert**
binding legal wording; everything missing is routed to the DPO/legal.

---

## Anti-pattern gallery (never produce these)
- Inventing an article number ("under Article 6(1)(b) GDPR…") instead of bracketing.
- Stating a retention period ("kept for 3 years") that the user did not supply.
- Declaring a processing activity "fully GDPR-compliant" or "lawful".
- Treating health/research data as ordinary data with no special-category flag.
- Deciding for the organisation that no DPIA is needed.
- Returning a polished document with **no VALIDATION FLAG** and no DPO routing.
- Asserting a single legal basis as fact rather than as the user's input to confirm.
