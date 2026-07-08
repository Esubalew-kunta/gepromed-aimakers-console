# GEPROMED ISO gap analysis — intake questions (LIGHT\*, mode-dependent)

This skill's intake depends on the mode (see `skills/CONVENTIONS.md`):

- **MINIMAL — two versions/documents supplied:** the input is self-defining. **Diff
  them; do not run an intake.** Ask only on genuine ambiguity (e.g. which file is the
  newer version). No question set applies.
- **LIGHT — summarize ISO updates, no text supplied:** ask **only the scope**, in one
  batched round of ≤5 questions with defaults and a `go` escape hatch. Cap at 2 rounds.

The questions below apply to the **LIGHT (summarize-updates)** mode only.

---

## The scope question set (LIGHT mode)

1. **Which standard?**
   - Options: ISO 9001 · ISO 13485 · (other supplied standard).
   - Default: *ISO 9001* (GEPROMED's core management-system standard).

2. **Which versions / release?**
   - Default: *the most recent published revision vs. the one GEPROMED is certified to.*
   - Note: if you have the actual clause text, paste it — that switches to MINIMAL
     diff mode and gives a more precise result.

3. **Which clauses / scope?**
   - Options: whole standard · clauses 4–10 (auditable) · a specific clause/area.
   - Default: *the auditable clauses (4–10), highlighting changed requirements.*

4. **Depth?**
   - Options: high-level summary · full clause-by-clause gap table · + transition plan.
   - Default: *clause-by-clause gap table.*

5. **Output language?**
   - Default: *mirror the request (FR/EN).*

**Escape hatch:** *"Reply `go` and I'll proceed with the defaults above:
[ISO 9001, auditable clauses 4–10, clause-by-clause table, mirror language]."*

---

## When to skip intake entirely
- **Two versions or documents are supplied** → MINIMAL diff, no intake.
- The prompt already names the standard, the versions, and the scope.
- `MEMORY.md` already holds the relevant QMS scope/conventions.

## Hard rule for both modes
Never fabricate clause wording to fill a gap in the scope. If the actual text is
needed and not supplied, **reference the clause by number** and ask for the wording,
or proceed at the structural level and flag what could not be compared verbatim.
