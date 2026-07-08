# GEPROMED Skills — conventions (ground rules)

Shared standard every skill in this folder must follow.

## 1. Naming
- Every skill is named **`gepromed-<name>`**, lowercase, hyphen-separated
  (e.g. `gepromed-email-reformulation`, `gepromed-linkedin-post-drafter`).
- The folder name, the `name:` field in `SKILL.md`, and the `display_name` in
  `agents/openai.yaml` must all agree.
- Readable and predictable: a reader should guess the folder from the skill name.

## 2. Clarification protocol (ask before half-baked output)
Skills must show judgment: **gather what they need before generating**, instead
of firing a generic, half-baked answer. But they must not interrogate the user.

### Rules
1. **Ask only output-critical questions** — things that materially change the
   result and cannot be safely inferred or bracketed.
2. **One batched round.** Ask up to **5** numbered questions at once (never
   one-by-one). Each question carries a **suggested default** or 2–3 options so
   the user can answer in seconds.
3. **Always offer the escape hatch:** *"Reply `go` and I'll proceed with the
   defaults above."* If the user gives enough detail up front, **skip questions
   entirely** and proceed.
4. **Cap the interaction:** at most **2** rounds, then proceed with clearly
   stated assumptions. Never stall.
5. **Respect memory:** never ask anything already answered in `MEMORY.md` or in
   the user's message.
6. **State assumptions** in the output's `Assumptions:` line whenever you infer
   instead of asking.

### Intake tiers (assigned per skill)
- **Full** — runs a structured intake before generating. Ships a
  `references/intake-questions.md` listing the exact question set + defaults.
- **Light** — proceeds by default; asks **only** for missing *required* fields.
- **Minimal** — input is self-defining (a doc to transform); infers and asks only
  on genuine ambiguity. No intake file.

A skill's `SKILL.md` declares its tier in a `## Clarification protocol` section.
Mode-dependent skills (e.g. summarize vs. write-from-brief) state the tier per mode.

## 3. Other standing rules (recap)
- **Company asset:** one consistent GEPROMED house voice for any team member;
  validators are roles (RQ / DPO / RAF / Direction), not individuals.
- **Self-contained on upload:** each skill bundles its own `references/` brand
  copy; `/brand` is the master source.
- **Bilingual FR/EN**, mirror the user's language unless told otherwise.
- **Self-improving:** load `memory/MEMORY.md` first; update it on durable learnings.
- **Self-scoring:** score ≥ 95/100 on the skill's QA rubric before returning.
- **Human validates** before anything is published or sent; flag regulated content.
