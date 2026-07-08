# RGPD / GDPR document skeletons (STRUCTURE + placeholders)

These are **structural skeletons**, not legal text. They tell the skill *what
sections a compliant document contains* and *what must be filled in*. Every
square-bracketed item is a **placeholder the DPO must confirm or supply** — the
skill must never replace a bracket with an invented value (article number,
retention period, legal basis, recipient, entity name).

> Authoritative structure follows the RGPD (Règlement (UE) 2016/679) information
> obligations. The exact article numbering and final wording are **for the DPO to
> verify** — this file deliberately names *information items*, not citations, to
> avoid asserting article numbers the skill cannot guarantee. Where an article is
> needed, write `[réf. article — à confirmer par le DPO]`.

Bilingual labels are given FR / EN. Mirror the requested language in output.

---

## 1. Mention d'information / Privacy notice (short)
Used on a form, registration page, or short collection point. Information items:

1. **Responsable de traitement / Data controller** — `[GEPROMED — raison sociale, adresse exactes à confirmer par le DPO]`.
2. **Finalité(s) / Purpose(s)** — `[purpose of the processing]`.
3. **Base légale / Legal basis** — `[consent | contract | legal obligation | legitimate interest | … — à confirmer par le DPO]`.
4. **Données collectées / Data collected** — `[categories: identity, professional, …]`; flag if `[special-category/health data]` may be involved.
5. **Destinataires / Recipients** — `[internal teams / named processors / authorities — à confirmer]`.
6. **Durée de conservation / Retention period** — `[retention — à confirmer par le DPO]`.
7. **Droits des personnes / Data-subject rights** — accès, rectification, effacement, limitation, opposition, portabilité; how to exercise: `[contact / DPO email — à confirmer]`.
8. **Réclamation / Complaint** — right to lodge a complaint with the supervisory authority `[CNIL — coordonnées à confirmer]`.
9. **Transferts hors UE / Transfers outside the EU** — `[only if applicable — à confirmer]`.

> Keep it short and plain. A privacy notice points to the full **politique de
> confidentialité** for detail.

---

## 2. Politique de confidentialité / Privacy policy (full)
The full website/policy document. Sections:

1. **Préambule / Introduction** — who GEPROMED is and the scope of the policy.
2. **Identité du responsable / Controller identity & contact** — `[entity, address]` + `[DPO contact, if a DPO is designated — à confirmer]`.
3. **Données collectées et sources / Data collected & sources** — per category, with source (form, cookies, third party).
4. **Finalités et bases légales / Purposes & legal bases** — a table: each purpose → `[legal basis — à confirmer par le DPO]`.
5. **Destinataires et sous-traitants / Recipients & processors** — `[list of processors — à confirmer]`.
6. **Transferts internationaux / International transfers** — mechanism if any `[à confirmer]`.
7. **Durées de conservation / Retention periods** — per category `[à confirmer]`.
8. **Cookies et traceurs / Cookies & trackers** — `[refer to a separate cookie policy if one exists — à confirmer]`.
9. **Droits des personnes / Your rights** — full list + how to exercise + response timeframe `[à confirmer]`.
10. **Réclamation / Complaint** — supervisory authority `[CNIL — à confirmer]`.
11. **Sécurité / Security measures** — described in general, non-revealing terms `[à confirmer with RSSI/DPO]`.
12. **Mise à jour / Updates** — version + date `[à confirmer]`.

---

## 3. Registre des traitements / Record of processing activities (one entry)
A single line/record for the controller's register. Fields:

- **Intitulé du traitement / Processing name** — `[name]`.
- **Finalité(s) / Purpose(s)** — `[purpose]`.
- **Base légale / Legal basis** — `[à confirmer par le DPO]`.
- **Catégories de personnes / Categories of data subjects** — `[participants / donors / employees / …]`.
- **Catégories de données / Categories of personal data** — `[identity, professional, financial, special-category? …]`.
- **Destinataires / Recipients** — `[internal / processors / third parties — à confirmer]`.
- **Sous-traitants / Processors** — `[named processors — à confirmer]`.
- **Transferts hors UE / Transfers outside EU** — `[yes/no + mechanism — à confirmer]`.
- **Durée de conservation / Retention** — `[à confirmer par le DPO]`.
- **Mesures de sécurité / Security measures** — `[general description — à confirmer]`.
- **Analyse d'impact (AIPD/DPIA) requise ?** — `[à évaluer par le DPO; obligatoire pour certains traitements à risque élevé, ex. données de santé à grande échelle — décision DPO]`.

---

## 4. Clause de sous-traitance / DPA (data-processing agreement)
When GEPROMED engages a processor (or is engaged as one). The contract must define
the processing and the parties' obligations. Information items the clause sets out
(exact contractual wording is **for the DPO / legal counsel**):

- **Objet, durée, nature et finalité / Subject-matter, duration, nature, purpose** — `[à compléter]`.
- **Type de données et catégories de personnes / Data types & data subjects** — `[à compléter]`.
- **Obligations et droits du responsable / Controller's obligations & rights** — `[à compléter]`.
- **Instructions documentées / Documented instructions** — processor acts only on the controller's documented instructions.
- **Confidentialité / Confidentiality** — staff bound by confidentiality.
- **Sécurité / Security measures** — appropriate technical & organisational measures `[à préciser]`.
- **Sous-traitance ultérieure / Sub-processing** — authorisation regime `[à confirmer]`.
- **Assistance / Assistance** — for data-subject requests, breaches, DPIAs.
- **Notification de violation / Breach notification** — timeframe `[à confirmer]`.
- **Sort des données en fin de contrat / End-of-contract data fate** — return or deletion `[à confirmer]`.
- **Audits / Audits** — controller's audit rights.

> Mark clearly: **"Projet de clause — formulation contractuelle exacte à valider
> par le DPO / le conseil juridique."** Never assert standard-contractual-clause
> identifiers or article numbers; bracket them.

---

## 5. Recueil de consentement / Consent form
When consent is the chosen basis. Valid consent is **free, specific, informed,
unambiguous**, and as easy to withdraw as to give. Items:

- **Identité du responsable / Controller** — `[à confirmer]`.
- **Finalité précise / Specific purpose** — one clear purpose per consent (granular if several) `[à compléter]`.
- **Données concernées / Data concerned** — `[categories]`.
- **Action positive / Affirmative action** — unticked box / explicit opt-in (no pre-ticked boxes).
- **Information sur le retrait / Withdrawal** — how to withdraw, and that withdrawal does not affect prior lawful processing.
- **Lien vers la politique / Link to the policy** — `[link — à confirmer]`.
- **Mention pour les données de santé / Special-category note** — if health/research data, an **explicit** consent statement and a DPO note `[à confirmer]`.
- **Date / horodatage du consentement** — to be logged by the system `[à confirmer how it is stored]`.

---

## Cross-cutting rules for every skeleton
- Replace a placeholder **only** with a value the user supplied or `MEMORY.md`
  confirmed. Otherwise keep the bracket and list it for the DPO.
- Never assert an RGPD/GDPR **article number**, a **CNIL/EDPB reference**, a
  **retention duration**, or a **legal basis** that was not supplied — bracket it.
- Always end the output with the **VALIDATION FLAG (DPO)** and the "Bracketed items
  for the DPO" list.
