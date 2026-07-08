# Branded Template Library — intake questions (FULL tier)

This skill runs a **structured intake** before generating, because a template is
only useful if its type, purpose, audience, and outline are right. Ask the batched
set below (skip anything the user already gave or `MEMORY.md` covers). **Cap: 2
rounds.** Always offer the escape hatch.

> Never invent facts, figures, or proof points to fill a template. If the user
> replies `go`, generate the chosen type with a clean GEPROMED skeleton and
> bracket every content slot for the author.

---

## Round 1 — the 5 high-leverage questions (ask all at once)

1. **Document type** — which template do you need?
   *Options:* `letter` (courrier .docx) · `report` (rapport/note .docx) ·
   `presentation` (deck .pptx) · `email` (text scaffold). *Default:* infer from the
   request; if unclear, `letter`.

2. **Purpose** — what is this document for, in one line?
   *Default:* infer a neutral purpose from the request and bracket the specifics.

3. **Audience** — who is it for?
   *Options:* `hcp` (surgeon/clinician) · `industry` (manufacturer) · `researcher` ·
   `institution`/funder · `participant` · `internal`. *Default:* `default`
   (neutral-professional, peer register). This sets the salutation/closing.

4. **Sections / outline** — what are the main sections or points? (titles, and a
   line or bullets each)
   *Default:* generate a sensible skeleton for the type (e.g. report → Synthèse,
   Activité, Faits marquants, Perspectives) with bracketed content for the author.

5. **Language** — FR or EN?
   *Default:* mirror the user's language (FR if unclear).

---

## Escape hatch (always show)

> Reply `go` and I'll generate the template with a clean GEPROMED skeleton,
> bracketing every fact, figure, name, and date for you to fill in.

## Round 2 (only if type or outline is still unworkable)

If after Round 1 the document type is still ambiguous, or the outline is empty for
a report/presentation that needs structure, ask **only** for those, then generate
with a bracketed skeleton. Never exceed 2 rounds.

## Notes

- This skill produces **templates/scaffolds**, not finished copy. It never invents
  proof points or statistics — those are bracketed for the author, who validates
  before the document is published or sent.
- For a full email *rewrite* (not a template), route to the
  `gepromed-email-reformulation` skill instead.
