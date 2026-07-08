# Training Admin Doc Pack — required fields (LIGHT tier)

This skill is **LIGHT tier**: it **proceeds by default** and asks **only** for
missing *required* fields. It does not run a full structured intake. The inputs
are largely self-defining (a participant list + session details), so the skill
generates as soon as it has the minimum, bracketing the rest for the DPO.

> Never invent personal data, DPO contact, or retention periods. Missing optional
> values render as `[crochets]`.

---

## Required fields (ask only if missing)

| Field | Needed for | If missing |
|---|---|---|
| **Participant list** (nom + prénom each; organisme optional) | badges + attendance sheet | **Ask** — this is the one field that cannot be defaulted. |
| **Course title (intitulé)** | all three documents | Ask, or bracket `[intitulé de la formation]` if the user wants to proceed. |
| **Session date** | attendance sheet, notice | Bracket `[date]` if not given. |

## Optional fields (bracket if absent, never block)

- Horaires, lieu, formateur (attendance sheet) → bracketed.
- GEPROMED address, **DPO email**, **retention period** (RGPD notice) → bracketed
  for the DPO to confirm. The skill must **not** invent a DPO email or retention.
- Language (FR default; mirror the user).
- Whether to also emit PNG badges (`--badge-png`); default is the `.docx` grid.

## The one batched question (only when the participant list is missing)

If no participant list is supplied, ask a single, short batched question:

> To build the pack I need the participant list. Please paste it as
> `Nom, Prénom, Organisme` (one per line). I'll also use the course title and date
> if you have them — otherwise I'll bracket them for the DPO. Reply `go` with just
> a course title and I'll generate a blank-roster template you can fill in.

Offer the escape hatch: *"Reply `go` and I'll proceed, bracketing whatever's
missing for the DPO."* Never exceed one clarifying round for this skill.

## Validation note

The RGPD notice is always flagged **"À valider par le DPO avant diffusion"**. The
DPO confirms the DPO email and retention period before the notice is distributed.
