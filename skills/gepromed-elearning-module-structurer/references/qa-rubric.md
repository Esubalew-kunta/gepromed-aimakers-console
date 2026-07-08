# GEPROMED e-learning structure — QA rubric (score before returning)

Self-score every course structure against this 100-point rubric. **Do not return
a structure that scores below 95.** If below 95, fix the failing criteria and
re-score. Keep the final score in the `QA:` line of the output.

| # | Criterion | Pts | Fail = 0 unless… |
|---|---|---:|---|
| 1 | **Intent fidelity** — delivers the briefed specialty, level, scope, and assessment type | 12 | Specialty/level/module count/assessment match the brief |
| 2 | **Zero invented clinical content** — no fabricated facts, steps, doses, devices, rates, thresholds, durations-as-fact | 15 | Every clinical specific is `[SME]`/`[bracketed]` |
| 3 | **Objective quality** — Bloom-aligned, action-verb, observable; no "understand/know" | 12 | Every objective is measurable and uses a Bloom verb |
| 4 | **Level match** — objective difficulty fits the learner (recall for residents, judgment for clinicians) | 8 | Bloom levels appropriate to the stated learner |
| 5 | **Constructive alignment** — objective → section → assessment all point at the same target | 12 | No orphan section/objective; assessments map to objectives |
| 6 | **Hierarchy** — clear modules → chapters → sections; sensible counts | 8 | Full hierarchy present; not a flat topic list |
| 7 | **Sequencing** — prerequisite-before-dependent; simple→complex; spaced retrieval | 8 | Logical progression; no forward references |
| 8 | **Assessment placement** — formative checks + summative per module; type matches request | 8 | Checkpoints present and purposeful |
| 9 | **Duration realism** — total distributed sensibly; over-scope flagged; values `~`/bracketed | 5 | Durations estimated, not invented as fact |
| 10 | **Pillar & safety framing** — anchored to Education; patient-safety stake explicit where clinical | 5 | Education anchor + safety framing present |
| 11 | **Language quality** — native-quality FR or EN; clear, scannable | 4 | No errors; reads human |
| 12 | **Right language** — matches the brief/request | 3 | Output language correct |
| 13 | **Memory applied** — all `MEMORY.md` rules honored | 3 | No stored rule violated |

**Scoring guidance**
- Treat criteria **2, 3, and 5** as **gates**: any failing = the structure is not
  shippable regardless of total. Criterion 2 (zero invented clinical content) is the
  hardest gate — a fabricated dose or step in a course outline is a patient-safety risk.
- Round honestly. The goal is genuinely close to 100% pedagogically-sound output.
- When you revise after a low score, briefly note internally what you fixed; do not
  expose the iteration to the user beyond the final `QA:` line.
