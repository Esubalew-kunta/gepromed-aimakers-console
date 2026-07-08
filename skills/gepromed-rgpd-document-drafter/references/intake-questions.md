# RGPD / GDPR drafter — intake questions (Intake tier: FULL)

Data-protection documents are only useful if the processing facts are correct. So
this skill runs a **structured intake before drafting**. Declare the tier, then ask
**one batched round of at most 5** numbered questions, each with a default or 2–3
options. Always offer the `go` escape hatch. **Never** ask anything `MEMORY.md` or
the user's message already answers. Cap at 2 rounds.

Open with:

> **Intake tier: FULL — five quick questions so the draft matches the real
> processing, then I'll hand a structured draft to the DPO for validation. Reply
> `go` and I'll draft a skeleton with every unknown bracketed for the DPO.**

## The batched question set (ask all five at once)

1. **Which document?**
   - a) Mention d'information / privacy notice (short, on a form/page)
   - b) Politique de confidentialité / privacy policy (full website policy)
   - c) Entrée de registre des traitements / record-of-processing entry
   - d) Clause de sous-traitance / DPA (data-processing agreement)
   - e) Recueil de consentement / consent form
   *(default: a — privacy notice)*

2. **What is the processing activity?** In one line: what personal data is
   collected, from whom, and for what purpose.
   *(e.g. "training registration: name, email, profession of participants, to
   manage enrolment". Default if unsure: leave the purpose bracketed for the DPO.)*

3. **What data categories?** Pick all that apply — identity (name, email),
   professional (profession, institution), financial (for donors/suppliers),
   **special-category / health data** (research subjects, explant context), other.
   *(default: identity + professional. Special-category data triggers an extra DPO
   note — never assume it is absent.)*

4. **Legal basis (which RGPD/GDPR ground)?** consent · contract · legal obligation
   · legitimate interest · public interest · vital interest — **or "DPO to
   confirm"**. See `references/legal-basis.md`. *(default: "DPO to confirm" — the
   skill will not assert a basis on its own.)*

5. **Recipients + retention?** Who receives the data (internal teams, named
   processors, authorities) and how long it is kept.
   *(default: both bracketed `[recipients — DPO to confirm]` /
   `[retention period — DPO to confirm]`; the skill never invents a duration.)*

Optional, only if it changes the output (infer or bracket, don't force a round 2):
- **Language** — FR / EN (default: mirror the request).
- **GEPROMED's role** — controller / processor (default: controller).

## On `go`
If the user replies `go`, do **not** stall: produce the chosen (or default)
document skeleton from `references/rgpd-templates.md` with **every** unknown
bracketed and listed under "Bracketed items for the DPO to confirm", plus the
VALIDATION FLAG. A bracketed skeleton the DPO can complete is the goal — never a
guessed legal fact.
