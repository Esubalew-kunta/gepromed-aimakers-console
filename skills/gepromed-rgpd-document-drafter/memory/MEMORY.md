# GEPROMED RGPD / GDPR Drafter — MEMORY

Self-updating house memory. The skill **loads this first** and applies everything
below. It **appends** here (via `scripts/memory_update.py` or a `📝 MEMORY UPDATE`
block) whenever the DPO/team member teaches it something durable. Priority:
explicit user instruction (DPO) > this file > references. **No memory entry ever
overrides ZERO-INVENTION** — store only DPO-validated, reusable facts.

> This is a **company** memory, shared across all team members. Do **not** store
> personal data content, secrets, or unconfirmed draft legal text. Store only
> durable, DPO-validated facts and house decisions that are safe to reuse.

How entries are formatted: each line is one durable rule, prefixed with `FR:`,
`EN:`, or `BOTH:` where language-specific. The script keeps them de-duplicated and
dated in the Correction log.

---

## Approved processing facts
<!-- DPO-validated, reusable facts (controller identity, standard retentions, named processors). Empty until confirmed. -->
- BOTH: GEPROMED acts as **data controller** (responsable de traitement) by default; flag explicitly when it acts as processor.
- BOTH: The exact legal entity name, address, and DPO contact are NOT yet confirmed — keep `[à confirmer par le DPO]` until the DPO supplies them.

## House-style decisions
<!-- Durable choices about structure, wording, formatting. Seeded; extend on use. -->
- BOTH: Every output ends with the ⚠️ VALIDATION FLAG line naming the DPO.
- BOTH: Never assert an RGPD/GDPR article number — write `[réf. — à confirmer par le DPO]`.
- BOTH: Never invent a retention period — bracket it.
- FR: Use "données à caractère personnel", "responsable de traitement", "sous-traitant", "personne concernée".
- EN: Use "personal data", "data controller", "processor", "data subject".

## Recurring recipients & processors
<!-- Named processors/recipients once DPO-confirmed. Empty until learned. -->
- (none yet)

## Approved phrasings / snippets
<!-- Reusable, DPO-approved sentences (e.g. a standard rights paragraph). Empty until learned. -->
- (none yet)

## Do / Don't learned
<!-- Specific things to do or avoid, learned from DPO corrections. Empty until learned. -->
- BOTH: Always flag possible special-category / health data; never treat it as ordinary data.

## Correction log
<!-- Dated record of what changed and why. Appended automatically. -->
- 2026-06-20 — Seed file created with initial RGPD house defaults and zero-invention guardrails.
