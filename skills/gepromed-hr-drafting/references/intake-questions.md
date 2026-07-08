# HR Drafting — intake questions (Intake tier: FULL)

HR documents and answers are wrong if the legal frame or the company specifics are
off. So this skill runs a **structured intake before drafting**. Declare the tier,
then ask **one batched round of at most 5** numbered questions, each with a default
or 2–3 options. Always offer the `go` escape hatch. **Never** ask anything
`MEMORY.md` (e.g. the confirmed CCN) or the user's message already answers. Cap at
2 rounds.

Open with:

> **Intake tier: FULL — five quick questions so the draft fits the right legal frame
> and our company, then the RAF validates against reliable sources. Reply `go` and
> I'll draft a structured skeleton with every legal value bracketed for the RAF.**

## The batched question set (ask all five at once)

1. **Which deliverable?**
   - a) Offre d'emploi / job posting
   - b) Règlement intérieur / internal rules (structure)
   - c) HR-legal answer (a reasoned response to an HR/labour-law question)
   - d) Other HR document (policy, note, procedure)
   *(default: a — job posting)*

2. **Role / context.** For a job offer: the role, contract type (CDI/CDD…),
   location, pillar/team. For an answer: the situation in one line.
   *(e.g. "Ingénieur d'essais, CDI, Strasbourg, plateforme Test". Default if unsure:
   bracket the specifics for the RAF.)*

3. **Legal basis / convention collective (CCN)?** Which CCN/IDCC applies, and any
   relevant statute. If unknown, the skill will bracket every legal value and name
   the source to check.
   *(default: `[CCN / IDCC — à confirmer par le RAF]`; the skill never asserts a CCN.)*

4. **Company specifics.** Working time, contract duration, salary band (range only),
   trial period, telework, headcount thresholds that change obligations.
   *(default: each bracketed `[… — à confirmer par le RAF]`; the skill never invents
   a duration, salary, or threshold.)*

5. **Language and tone?** FR or EN; neutral-professional by default. Job offers may
   be warmer and mission-forward but stay non-discriminatory.
   *(default: mirror the request, neutral-professional.)*

## On `go`
If the user replies `go`, do **not** stall: produce the chosen (or default)
deliverable from the relevant template/structure with **every** legal value and
company specific bracketed, listed under "Sources to verify (for the RAF)" with the
reliable source to check, plus the VALIDATION FLAG and the HR-legal disclaimer. A
bracketed skeleton the RAF can complete is the goal — never a guessed legal fact.

## Never ask
- For a precise Code du travail article or CCN clause as a blocking question — the
  skill does not assert these; it brackets them and names the source.
- Anything `MEMORY.md` already confirms (e.g. the company's working time or CCN).
