# Medical e-learning patterns (specialty-specific)

Reusable structural patterns for GEPROMED's specialties. Use these as starting
arborescences, then adapt to the briefed topic, learner level, and objectives.
They are **structural templates** — the clinical content is authored/validated by
a subject-matter expert (SME); this skill never invents it.

## Cross-specialty principles
- **Safety-first framing**: a medical-device course should make the patient-safety
  stake explicit early and recur in cases. Tie to the implant-cycle idea where
  relevant (a device's behaviour in the body → why the technique/decision matters).
- **Case-anchored learning**: clinicians learn from scenarios. Build toward cases;
  don't leave them as an afterthought.
- **Simulation linkage**: GEPROMED training is simulation-based. For blended
  courses, map e-learning chapters to the simulation/hands-on sessions they prepare.
- **Device awareness**: where a device is involved, include its selection,
  handling, failure modes, and (where relevant) explant findings as a teaching loop.
- **Complications & decision-making**: advanced learners need analysis and judgment,
  not just procedure steps — weight cases toward "what would you do when…".

---

## Pattern A — Vascular surgery module
Anchor pillar: Education (links to Testing & Explant Analysis via device behaviour).

```
MODULE: <e.g. Endovascular access & technique>
  CHAPTER 1: Foundations
    - Relevant anatomy & physiology [SME content]
    - Device/material overview [SME content]
    - Patient-safety stake & indications [SME content]
    ✓ Knowledge check (Understand)
  CHAPTER 2: Technique / procedure
    - Step-by-step technique (worked example) [SME content]
    - Imaging / guidance [SME content]
    - Device selection & handling [SME content]
    ✓ Knowledge check (Apply)
  CHAPTER 3: Complications & decision-making
    - Common complications & management [SME content]
    - Device failure modes (link to explant findings) [SME content]
    - Case vignettes (decision points) [SME content]
    ✓ Module assessment: case-based quiz (Analyze/Evaluate)
```
Typical objective levels: residents → Understand/Apply; surgeons → Apply/Analyze/Evaluate.

---

## Pattern B — Ophthalmology module
Anchor pillar: Education.

```
MODULE: <e.g. Cataract / anterior-segment procedure>
  CHAPTER 1: Foundations
    - Ocular anatomy relevant to the procedure [SME content]
    - Optics / imaging basics [SME content]
    - Indications & patient selection [SME content]
    ✓ Knowledge check (Understand)
  CHAPTER 2: Instrumentation & technique
    - Instruments / device(s) & handling [SME content]
    - Procedure steps (worked example → faded practice) [SME content]
    ✓ Knowledge check (Apply)
  CHAPTER 3: Complications & management
    - Intra-/post-operative complications [SME content]
    - Case-based decision-making [SME content]
    ✓ Module assessment: case-based quiz (Analyze)
```
Ophthalmology often has heavy visual/optical content — favour diagrams and short
single-idea sections; note image/caption needs for the builder.

---

## Pattern C — Generic specialty / device-focused module
Use when the specialty is "other" or device-centred.

```
MODULE: <topic>
  CHAPTER 1: Why it matters (safety stake) + foundations
  CHAPTER 2: Core knowledge / mechanism / anatomy
  CHAPTER 3: Application — technique / use / decision
  CHAPTER 4: Integration — cases, complications, edge cases
  ✓ Module assessment matched to the dominant Bloom level
```

---

## Course-level patterns (assembling modules)
- **Linear progression** (foundations course): Module 1 foundations → 2 core →
  3 application → 4 integration. Best for residents/onboarding.
- **Competency clusters** (CPD for clinicians): each module is a self-contained
  competency; order by priority, allow non-linear access. Best for qualified HCPs.
- **Blended track**: e-learning modules pre-load knowledge before a simulation day;
  map each module to the hands-on session it prepares, and place a readiness check
  before the simulation.

## What stays a placeholder (never invent)
Anatomy specifics, technique steps, device names/models, drug names/doses,
imaging parameters, complication rates, thresholds, durations of clinical effect,
and any outcome figure. Name the section; bracket the specifics; route to the SME.
