# GEPROMED gap-analysis format — table, severity scale, transition plan

The house format for every ISO gap analysis. Consistent structure makes the output
auditable and easy for the **RQ** to validate. **Every row traces to a real,
supplied textual difference — never a fabricated change or invented clause text.**

---

## 1. The gap-analysis table (one row per change)
| Column | Content |
|---|---|
| **Clause** | The clause/sub-clause number (e.g. `7.1.6`). |
| **Change** | Added · Removed · Changed · Reworded/Editorial. |
| **What changed** | A factual description, quoting/paraphrasing **only the supplied text**. For "Changed", point to the specific difference. |
| **Impact on GEPROMED QMS** | Concrete effect on GEPROMED's processes, documents, records, or certifications (testing, explant analysis, clinical research, training). |
| **Required action** | The concrete step to close the gap (update procedure X, add a record, train role Y, revise the audit checklist). |
| **Severity** | Critical / Major / Minor / Editorial (scale below). |
| **Owner** | The responsible role (default RQ; may delegate). |
| **Status** | Open / In progress / Done. |

Render as a Markdown table. Keep "What changed" anchored to supplied wording; if the
wording was not supplied, write "(wording not supplied — clause referenced by number)".

## 2. Severity scale (use consistently)
| Severity | Meaning | Typical example |
|---|---|---|
| **Critical** | A new/changed **auditable requirement** that GEPROMED does not currently meet; risk to certification or to device/patient safety. | A new mandatory record or control with no existing process. |
| **Major** | A substantive requirement change needing a real process/document update. | Reworked design-control or risk requirement affecting an existing procedure. |
| **Minor** | A requirement clarified or tightened; small update to a document. | Added evaluation-of-effectiveness wording on an existing action. |
| **Editorial** | Wording/renumbering only; no requirement change. | Heading reworded, clause renumbered, terminology aligned. |

Mark **Critical** rows visibly (the orange accent is reserved for these). Never
inflate or deflate severity to fit a narrative — the RQ relies on it.

## 3. Narrative summary (2–4 sentences, above the table)
State the **direction** of the changes (e.g. "stronger risk-based thinking; explicit
organizational-knowledge and effectiveness-evaluation requirements") and the **net
impact** on GEPROMED's QMS. No hype, no conformity conclusion.

## 4. Transition plan (only if requested)
An ordered, owner-assigned action list to move from the old to the new version:
1. Address **Critical** gaps first (process/record creation), then Major, then Minor.
2. For each: action · owner (role) · target document/record · suggested sequence.
3. Note dependencies (e.g. a new record needs a procedure update first).
4. End with: internal-audit checklist update + management-review item + RQ sign-off.

Do **not** invent dates or commitments — leave `[target date]` for the RQ.

## 5. Validation flag (always present)
Every output ends with:
> ⚠ **RQ validation required** before any conformity decision, transition commitment,
> or audit submission. This is an analysis draft, not a conformity statement.

## 6. What never appears in a gap analysis
- Invented or paraphrased **standard clause wording** presented as authoritative.
- A "change" that does not trace to a real supplied textual difference.
- A conformity / non-conformity **conclusion** (the RQ decides).
- Fabricated dates, owners, or document references.
- Hype, marketing tone, or emojis.
