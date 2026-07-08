# GEPROMED editorial cadence & the two-layer model

How GEPROMED plans short-term content. This is the planning logic the skill and
the `build_calendar.py` builder follow.

## The two-layer model (from GEPROMED's own brief)
GEPROMED plans content in **two layers**, and the calendar must keep them visibly
separate:

1. **Fixed content — the immediate week.** The next 7 days are *locked*: concrete,
   ready to brief and produce. Each item has a date, channel, format, pillar,
   audience, a working title/angle, a CTA, and an owner-role. Status = `Fixed`.
   This is what the team commits to *now*.

2. **Adjustable content — the rest of the month.** The remaining weeks are kept
   *flexible*: a theme per week plus candidate topics, lighter detail, easy to
   move as events and priorities shift. Status = `Adjustable`.

Why: the immediate week needs certainty to produce; the rest of the month needs
room to react to events, publications, and opportunities. Locking a whole month
rigidly fails; leaving the current week vague fails. The two-layer split solves both.

> Rule of thumb: only the **current week** is `Fixed`. Everything beyond it is
> `Adjustable` until it becomes the current week, at which point it gets locked.

## Cadence per channel (defaults; override from MEMORY or intake)
| Channel | Sustainable default | Notes |
|---|---|---|
| LinkedIn | **2 posts / week** | Primary driver. 1 is light, 3 is the upper bound. |
| Website / blog | 1–2 / month | Longer pieces, publication landing pages. |
| Newsletter | 1 / month | Digest of the month's posts + an event. |

Pick a cadence the team can sustain. A realistic 2/week beats an aspirational
5/week that collapses.

## Slot pattern (LinkedIn default)
- 2/week → **Tuesday + Thursday** (mid-week reach). Store the agreed pattern in
  `MEMORY.md` under "Cadence & slots" if the team prefers other days.
- 1/week → Tuesday. 3/week → Tuesday + Wednesday/Thursday + Friday.

## Pillar rotation & balance rules
- A **balanced month** touches all four pillars: Testing · Education · Clinical
  Research · Explant Analysis.
- **No two same-pillar posts back-to-back.** Alternate so the feed feels varied.
- A single week may **lead** with one pillar (e.g. an Education week around the
  Vascular Bootcamp) but still vary audience and format.
- Mix **audiences** across the plan; do not aim every post at surgeons.
- Mix **formats** (text / carousel / image / event / publication) — see the
  LinkedIn drafter's `formats.md`.

## Event arcs
When an event (e.g. Vascular Bootcamp) or a publication falls in the window, build
an **arc**, not a single post:
- **Announce** (1–2 weeks before): what, when, who it's for, registration.
- **During / build-up** (the week of): a behind-the-scenes or live moment.
- **Recap** (after): one real outcome + thanks (by role) + next session.
Tie the arc's pillar to the event (Education for the Bootcamp; Clinical Research
for a publication). Bracket the event date if unconfirmed.

## The spec schema (read by build_calendar.py)
The builder reads a JSON spec with this shape:
```json
{
  "title": "GEPROMED content calendar — June 2026",
  "language": "en",
  "fixed_week": {
    "label": "Week of 2026-06-22 (FIXED)",
    "items": [
      {
        "date": "2026-06-23", "day": "Tue", "channel": "LinkedIn",
        "format": "text", "pillar": "Explant Analysis",
        "audience": "manufacturers", "title": "Why an explant is evidence",
        "cta": "none", "owner": "Comms", "status": "Fixed"
      }
    ]
  },
  "adjustable_weeks": [
    {
      "week": "Week of 2026-06-29", "theme": "Education / Vascular Bootcamp recap",
      "topics": "Recap post; participant thanks; next-session teaser",
      "channels": "LinkedIn", "pillar": "Education", "status": "Adjustable"
    }
  ]
}
```
- `fixed_week.items[]` → the FIXED table (columns: Date, Day, Channel, Format,
  Pillar, Audience, Title/Angle, CTA, Owner, Status).
- `adjustable_weeks[]` → the ADJUSTABLE table (columns: Week, Theme, Candidate
  topics, Channel(s), Pillar focus, Status).
- Any missing value should be a `[bracketed]` placeholder in the spec, never invented.

The builder emits a `.csv` (both layers, flat) and a `.md` (two tables) and can
print the markdown to stdout. Generate a starter with `--template`.
