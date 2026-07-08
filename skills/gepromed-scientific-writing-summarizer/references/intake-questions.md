# Scientific Writing & Summarizer — intake questions

This skill is **mode-dependent**. The intake below is for **DRAFT mode** (FULL
tier). **SUMMARIZE mode skips intake** (MINIMAL tier) — see the note at the end.

---

## DRAFT mode — intake (FULL tier)

Ask these **once, batched, at most 5**, each with a default/options. If the brief
already answers a question, **do not ask it** — infer and state the assumption.
Offer the escape hatch. Cap at 2 rounds.

> Reply `go` and I'll proceed with the defaults below.

1. **Topic / research question?**
   - The subject of the section and its core question.
   - *Default: infer from the brief; if unclear, ask only this one.*

2. **Which section + IMRAD scope?**
   - Introduction · Methods · Results · Discussion · Abstract (structured/unstructured).
   - *Default: the section named in the request; if none, Abstract.*

3. **Key findings / data to use?** (REQUIRED — the skill will not invent these)
   - The actual results, numbers, methods, and outcomes the section may state.
   - *Default: none assumed. If not supplied, the draft uses `[bracketed]`
     placeholders for every datum and `[CITATION NEEDED]` for every claim.*

4. **Target journal / audience + style?**
   - Journal name (drives format/word count/citation style) or audience (peer / lay
     / institutional).
   - *Default: general scientific peer audience; citation style left to the author.*

5. **Language & length?**
   - FR · EN · mirror the brief. Length / word target (e.g. abstract ≤250 words).
   - *Default: language mirrors the brief; length per the section's convention.*

---

## SUMMARIZE mode — no intake (MINIMAL tier)

The supplied text **is** the input. **Do not run the intake.** Infer length,
audience, and language from the request, and proceed. Ask **only** on genuine
ambiguity that changes the output and cannot be inferred — at most 3 questions
with defaults + "Reply `go`":
1. Length? (one-line / structured-abstract / detailed — *default: structured-abstract*)
2. Audience? (peer / lay / institutional — *default: peer*)
3. Output language? (*default: mirror the source or the request*)

---

**Integrity note (both modes):** the skill never fabricates data or citations.
In draft mode, every reference slot is `[CITATION NEEDED]` and every unconfirmed
number is `[bracketed]` — all to be filled and verified by a human author/RQ. In
summarize mode, the summary reports only what the source contains.
