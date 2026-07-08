# GEPROMED outreach — intake questions (FULL tier)

**FULL intake.** A generic outreach message is worse than none, so this skill runs
a structured intake before drafting — unless the prompt already supplies everything.
One batched round, ≤5 questions, each with a default, plus the `go` escape hatch.
Cap at 2 rounds. Respect `MEMORY.md` (never re-ask what it answers).

If the prompt already gives target + objective + angle + channel + tone, **skip the
questions** and draft, stating any inferred field on the `Assumptions:` line.

---

## The question set (the five)

1. **Target** — who is the person/company? Paste their profile / company info / any
   real hook (recent work, role, device line, talk, shared event).
   - Default: *use only what you've given me; I will bracket any missing
     personalization hook rather than invent one.*

2. **Objective** — what is the outreach for?
   - Options: (a) test-platform client, (b) training, (c) partnership,
     (d) research collaboration.
   - Default: *infer from the target's ICP (see `icp.md`).*

3. **Value angle** — which GEPROMED pillar / proof point is most relevant to *them*?
   - Options: Testing · Education · Clinical Research · Explant Analysis · Mission.
   - Default: *the ICP's recommended lead angle from `icp.md`.*

4. **Channel** — where will this be sent?
   - Options: LinkedIn connection note · LinkedIn DM · Email.
   - Default: *LinkedIn DM for individuals, email for companies/institutions.*

5. **Tone** — how should it read?
   - Options: peer-to-peer · professional-independent · collegial-technical ·
     formal-mission.
   - Default: *the ICP-appropriate tone from `icp.md`.*

**Escape hatch:** *"Reply `go` and I'll proceed with the defaults above:
[state the concrete inferred objective / angle / channel / tone]."*

---

## When to skip intake entirely
- The prompt names the target, the objective, and the channel, and gives a real hook.
- `MEMORY.md` already holds the account's context and the working angle.

In these cases, **do not ask** — infer the rest, state assumptions, and draft.

## Personalization-hook note
The target info in question 1 is what makes the message non-generic. If the user
gives little, draft the best evidence-led message possible and **bracket the hook**
(`[reference their recent work on …]`) for the sender to complete — never fabricate
a hook to fill the gap.
