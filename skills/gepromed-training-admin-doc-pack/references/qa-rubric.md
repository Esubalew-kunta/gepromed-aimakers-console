# Training Admin Doc Pack — QA rubric (score before returning)

Self-score every generated pack against this 100-point rubric. **Do not return a
pack that scores below 95.** Criteria 1, 2, and 6 are **gates** — any one failing
makes the pack not shippable. Keep the final score in the `QA:` line.

| # | Criterion | Pts | Pass = … |
|---|---|---:|---|
| 1 | **Participant data fidelity (GATE)** — names/organisations exactly as supplied | 18 | No altered, dropped, or guessed participant data |
| 2 | **No invented personal/legal data (GATE)** — DPO email, retention, address never fabricated | 15 | All such fields traced to input or `[bracketed]` for the DPO |
| 3 | **RGPD notice completeness** — all Art. 13 elements present | 14 | Controller, DPO, purposes, legal basis, recipients, retention, rights, CNIL, photo-consent all present |
| 4 | **Attendance sheet correctness** — one row/participant, signature columns, session block | 12 | Table + session info + trainer signature line present |
| 5 | **Badges correctness** — one/participant, name prominent, clean (no bracketed fields) | 10 | Logo + name + (org if present) + course line; missing org omitted |
| 6 | **Brand fidelity (GATE)** — logo, blue headings/bands, rare orange, charte typography | 10 | On-brand across all three artifacts |
| 7 | **LIGHT-tier behaviour** — proceeds by default; at most one clarifying round | 8 | No over-asking; brackets the rest |
| 8 | **Right language** — FR/EN matches input across all artifacts | 5 | Consistent language |
| 9 | **DPO validation flag** — notice footer routes to the DPO | 5 | "À valider par le DPO" present |
| 10 | **Memory applied** — all `MEMORY.md` rules honored | 3 | No stored rule violated |

**Scoring guidance**
- Gates (1, 2, 6): any failure = not shippable. Fix and re-score.
- The most common rejection is an invented DPO email or retention period — when in
  doubt, bracket it.
- Round honestly; the goal is a pack the DPO signs off with only bracketed values
  to confirm.
