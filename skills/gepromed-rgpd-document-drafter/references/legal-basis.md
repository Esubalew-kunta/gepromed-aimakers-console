# RGPD / GDPR legal bases — a prompt for the DPO (NOT a ruling)

The RGPD recognises **six** lawful bases for processing personal data. This file
helps the skill **ask the right question** and *prompt* the DPO toward the likely
basis — it is **not** a legal determination. The skill must **never assert a basis
on its own**; the chosen basis is `[à confirmer par le DPO]` unless the DPO (or
`MEMORY.md`) supplies it.

> The exact article references for each basis are deliberately written as
> `[réf. — à confirmer par le DPO]`. The skill does not cite article numbers it
> cannot guarantee. The DPO confirms the citation and the applicability.

## The six bases (plain summary + typical GEPROMED context)

| Basis (FR / EN) | Plain meaning | Typical GEPROMED situations to *consider* (DPO decides) |
|---|---|---|
| **Consentement / Consent** | The person gave clear, specific, informed, freely-given, unambiguous agreement. | Newsletters, optional research participation, some photo/video, marketing. Must be withdrawable. |
| **Exécution d'un contrat / Contract** | Processing is necessary to perform a contract with the person (or pre-contract steps). | Managing a training enrolment, a supplier order, a service the person requested. |
| **Obligation légale / Legal obligation** | Processing is required by law. | Accounting/tax records, mandatory employment records, some health/safety obligations. |
| **Intérêt légitime / Legitimate interest** | Necessary for GEPROMED's (or a third party's) legitimate interests, balanced against the person's rights. | Some B2B contact management, network/IT security, internal administration. Requires a **balancing test** the DPO documents. |
| **Mission d'intérêt public / Public interest** | Necessary for a task in the public interest or official authority. | Possibly some public-health surveillance/research roles — **DPO assesses**. |
| **Intérêt vital / Vital interest** | Necessary to protect someone's life. | Rare; emergency situations only. |

## Special-category data (incl. health data) — extra caution
Health data, and data revealing certain sensitive attributes, are **special
categories**. Processing them is in principle restricted and needs **both** a
lawful basis **and** a specific exception (e.g. explicit consent, scientific
research with safeguards, public-health grounds). For GEPROMED this is common in
**clinical research** and **explant analysis**.

- The skill must **never** silently treat health/research data as ordinary data.
- When the processing may involve special-category data, add a clear note:
  *"⚠️ Données de santé / données sensibles possibles — base ET condition
  d'exception spécifiques, et éventuelle AIPD/DPIA, à déterminer par le DPO."*
- Do **not** assert which exception applies — bracket it for the DPO.

## How the skill uses this file
1. In intake, offer the six bases as options (plus "DPO to confirm").
2. If the user picks one, record it as **their** stated basis and still flag it for
   DPO validation — the skill does not endorse legal correctness.
3. If the user is unsure, default the basis to `[à confirmer par le DPO]` and, where
   helpful, name the **one or two** bases the DPO might consider, framed as a
   question, never as a conclusion.
4. Always pair a special-category-data flag with the warning above.

## What the skill must never do
- Never write "the legal basis is consent/contract/…" as a statement of fact.
- Never cite a specific RGPD/GDPR article number as authority — bracket it.
- Never claim a processing activity is "compliant", "lawful", or "exempt".
- Never decide that a DPIA/AIPD is or is not required — that is a DPO decision.
