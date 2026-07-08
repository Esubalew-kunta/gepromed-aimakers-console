# GEPROMED Infographic Spec Generator — intake questions (FULL tier)

Ask **one batched round of at most 5** numbered questions before specifying. Each
carries a suggested **default** or 2–3 options. Always offer the escape hatch.
**Skip any question the brief or `MEMORY.md` already answers.** Cap at 2 rounds,
then proceed on stated assumptions.

---

## The batched set (ask these, ≤5)

> A few quick questions so the figure lands right (reply `go` for defaults):
>
> 1. **Topic & core message?** What is the figure about, and the single sentence it
>    must convey? *(no default — this is required; if missing, I'll ask once more)*
> 2. **Key data points?** Paste the exact numbers, units, labels, and any source.
>    *(default: none — I will spec the layout and bracket every data value; I invent
>    no numbers)*
> 3. **Format & dimensions?** LinkedIn square 1080×1080 · LinkedIn story 1080×1920 ·
>    report figure · publication figure. *(default: LinkedIn square 1080×1080)*
> 4. **Audience?** surgeons / manufacturers / researchers / institutions /
>    participants / general HCP. *(default: general HCP / mixed)*
> 5. **Publication standard & language?** any journal/report rules (greyscale-safe,
>    DPI, caption placement)?; language = FR / EN. *(default: none / social-grade;
>    mirror your message's language)*
>
> Reply `go` and I'll proceed with the defaults above.

---

## Notes for the model
- Question 1 (topic + core message) is the one **required** field — a figure with
  no message has no design. If it is missing, ask once more rather than guess.
- If `format` = **publication**, surface the **publication standard** in Q5: DPI
  (often 300), greyscale-safe colors, caption placement, column width.
- **Never invent data.** If Q2 returns no numbers, spec the layout with
  `[bracketed]` placeholders and tell the user where to drop real values.
- Defaults exist so the skill never stalls. State each inferred choice in the
  `Assumptions:` line.
- Never re-ask anything in the brief or `MEMORY.md` (e.g. a standing stat-card size
  or a journal's figure rules already stored).
