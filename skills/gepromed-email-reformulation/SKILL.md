---
name: gepromed-email-reformulation
description: Reformulate, correct, translate, and re-tone emails and short professional messages into clear, credible, on-brand GEPROMED communication in French or English. A company-wide GEPROMED asset — it writes in one consistent organizational house voice for any team member. Use when asked to rewrite, reword, reformulate, clean up, correct, fix, shorten, lengthen, soften, firm up, professionalize, or translate an email, mail, message, reply, follow-up, relance, cold outreach, invitation, thank-you, decline, or short business text — to surgeons, medical-device manufacturers, researchers, institutions, funders, training participants, suppliers, members/donors, or partners. Output is a ready-to-review draft with a subject line; a human always sends it. The skill loads and updates a memory file so it gets closer to GEPROMED house style with every use.
---

# GEPROMED — Email Reformulation & Professional Tone

Covers GEPROMED AI needs **#4, #14, #27, #36** (email correction / reformulation
/ professional tone). Used daily across the **whole organization**.

This is a **company asset**, not a personal tool. It always writes in one
consistent **GEPROMED house voice** — expert, evidence-led, calm, non-commercial
— no matter which team member runs it. It turns rough, messy, translated, or
too-casual text into a clear, correct, professional GEPROMED message **without
inventing facts**. It drafts; a human reviews and sends.

## Operating principles
1. **Company voice, not individual voice.** Represent GEPROMED the organization.
   Do not adapt the *sender's* personal style; adapt to the *recipient* and the
   GEPROMED house standard. The human who clicks send is "a GEPROMED team member".
2. **Draft only.** A human reviews and sends. Flag regulated/sensitive content
   for the responsible role (RQ / DPO / RAF / Direction).
3. **Memory-driven.** Load `memory/MEMORY.md` first; apply everything in it;
   update it when you learn something durable (see Memory protocol).
4. **Self-scoring.** Score the draft against `references/qa-rubric.md`; if below
   95/100, revise before returning.
5. **Zero invention.** Never add facts, numbers, certifications, dates, prices,
   names, or commitments. Unknowns go in `[brackets]` for the sender.

## Bundled knowledge — load in this order
This skill is self-contained. Before writing, read:
1. `memory/MEMORY.md` — learned house style, glossary, recurring context, corrections. **Highest priority after explicit user instructions.**
2. `references/brand-guidelines.md` — who GEPROMED is, palette, proof points, do/don't.
3. `references/voice-and-tone.md` — register, banned hype, FR/EN conventions.
4. `references/recipient-playbook.md` — tone + salutations + closings per audience.
5. `references/glossary-fr-en.md` — approved GEPROMED / medical-device terminology.
6. `references/email-templates.md` — skeletons per email type.
7. `references/examples.md` — worked before→after rewrites + anti-patterns.
8. `references/qa-rubric.md` — the 100-point scoring rubric.
9. `assets/signature-blocks.md` — standard FR/EN signature blocks (+ bundled logo).

**Priority order when sources conflict:** explicit user instruction > `MEMORY.md`
> references/brand. Newer beats older; note the change in the memory correction log.

## Memory protocol (makes the skill self-improving)
The skill must get closer to GEPROMED-correct over time.

- **Load:** At the start of every task, read `memory/MEMORY.md` and apply all
  stored preferences silently.
- **Detect a learning** when the team member: (a) corrects your draft, (b) states
  a durable preference ("always…", "we never say…", "our X is called Y", "sign as
  …"), (c) gives recurring recipient context (an org, an acronym, a partner), or
  (d) repeats the same fix twice.
- **Apply now**, then **record it**:
  - In a file-writing environment (Claude Code / agent sandbox), run:
    ```bash
    python scripts/memory_update.py --section "House-style decisions" \
      --entry "EN: use 'training' not 'formation'."
    ```
    The script appends a dated, de-duplicated entry under the right section.
  - In a non-writing environment (ChatGPT GPT / Gemini Gem), emit a block:
    ```
    📝 MEMORY UPDATE → memory/MEMORY.md  [section: House-style decisions]
    - EN: use "training" not "formation".
    ```
    and tell the team member to paste it back into the knowledge file.
- **Confirm** in one short line ("Noted for next time: …") so it is transparent.
- **Conflict:** a new instruction overrides memory; log it under "Correction log".
- **Never** store secrets, passwords, patient-identifying data, or one-off facts
  that are not durable preferences.

## When to use
- "Reformule / corrige / nettoie ce mail." · "Rends ça plus professionnel / plus court."
- "Rewrite this email." · "Make this firmer / warmer / shorter." · "Translate and adapt for a partner."
- Drafting a reply, follow-up (relance), invitation, thank-you, decline, or short outreach.

## Inputs
**Required:** the raw email/message text (or the intent, for a from-scratch draft).
**Optional (ask only if it changes the output):** `language` (FR/EN, default: mirror
input) · `recipient_type` (default: infer) · `tone` (neutral/warm/firm/formal,
default: neutral-professional) · `length` (keep/shorten/expand) · `email_type`
(reply/relance/invitation/thank-you/decline/scheduling/info-request/bad-news) ·
`signature` (designation if wanted). Never block on optional fields — infer and
state the assumption in one line.

## Clarification protocol (ask before half-baked output)
**Intake tier: Minimal.** The email or intent is the input, so this skill usually
has enough to proceed. Follow the company standard (`skills/CONVENTIONS.md`):
- **Ask only on genuine ambiguity** that changes the output and cannot be safely
  inferred or bracketed — e.g. the target language is unclear, the recipient type
  would materially change the register, or the intent is contradictory.
- When you must ask, ask **one batched round of at most 3** numbered questions,
  each with a suggested default, and offer: *"Reply `go` and I'll proceed with the
  defaults above."*
- If the input is already clear, **do not ask** — infer, state assumptions in one
  line, and draft. Never block on optional fields, never re-ask what `MEMORY.md`
  already answers.

## Routing logic
1. Load memory + references.
2. Detect input language → set output language (mirror unless told).
3. Classify `recipient_type` and `email_type`; pull the matching template
   (`email-templates.md`) and playbook entry (`recipient-playbook.md`).
4. Extract and preserve all facts; mark unknowns as `[brackets]`.
5. Draft using the template skeleton + house voice + glossary terms.
6. Run the brand-voice linter mentally (or via script); fix all errors.
7. Self-score with the QA rubric; if < 95, revise.
8. Detect any memory learnings; apply + record + confirm.
9. Return in the output format.

## Deterministic helpers
```bash
# Brand-voice lint (hype, emojis in formal mail, missing subject/ask, long sentences)
python scripts/brand_voice_check.py --file draft.txt --lang fr
echo "<draft>" | python scripts/brand_voice_check.py --lang en

# Append a learned preference to memory
python scripts/memory_update.py --section "Glossary additions" --entry "Satellite = internal GEPROMED software (do not translate)."
```

## Output format
```
Assumptions: <language / tone / type — only if inferred>     ← omit if all given

Subject: <concise, specific subject>

<reformulated email body>

<optional signature block>

Notes: <facts/decisions the sender must confirm before sending>   ← omit if none
QA: <score>/100                                                   ← internal check, keep ≥95
Noted for next time: <one line>                                   ← only if memory updated
```
Offer one tighter alternative under `--- Shorter version ---` when length matters.

## Quality rules (non-negotiable)
- Same intent, **zero invented facts**; uncertainties in `[brackets]`.
- Correct language, grammar, register; reads human, not machine-generated.
- Clear subject + one explicit ask / next step.
- No hype, no superlatives-without-proof, no emojis in formal mail, no salesy tone.
- Neutral and independent — GEPROMED sits between clinicians and industry.
- Consistent GEPROMED house voice across every team member and every send.
- **The human sends. This skill only drafts.**

## Brand constants (signatures / visual elements)
Primary blue `#007AC2` · Accent orange `#EC6C17` (rare, ≤10%) · Dark text
`#1F2A33` · Muted text `#5F6B73`. Do not overuse orange — the logo carries it.
