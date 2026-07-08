# Instructional design reference (GEPROMED e-learning)

The pedagogical engine of the skill: how to write objectives, decompose a course,
sequence it, and place assessment. Everything here serves **constructive
alignment** — objectives, learning activities, and assessment must point at the
same target.

## 1. The hierarchy
```
COURSE
└─ MODULE          a coherent unit of learning (one major competency)
   └─ CHAPTER      a sub-competency / theme within the module
      └─ SECTION   a single teaching point (one idea, one screen/segment)
   ✓ ASSESSMENT    checkpoints that verify the objectives
```
Rule of thumb: 1 module = 1 module-level objective (sometimes 2). 3–5 chapters per
module. 2–5 sections per chapter. Adjust to the topic, not to a quota.

## 2. Learning objectives — Bloom-aligned, action-verb
Write objectives as: **"By the end of this [module/chapter], the learner will be
able to <action verb> <object> <condition/standard>."** Always observable and
measurable. Never use "understand", "know", "learn about", or "be familiar with"
as the verb — they are not assessable; use a Bloom verb instead.

| Bloom level | Cognitive goal | Sample action verbs | Typical learner |
|---|---|---|---|
| Remember | recall facts | list, name, identify, label, recall, define | foundational / all |
| Understand | explain meaning | describe, explain, summarise, classify, differentiate | foundational |
| Apply | use in a new situation | perform, calculate, demonstrate, apply, implement, select | intermediate |
| Analyze | break down, relate | compare, analyse, diagnose, distinguish, attribute, troubleshoot | intermediate / advanced |
| Evaluate | judge against criteria | assess, justify, prioritise, critique, decide, recommend | advanced / clinicians |
| Create | produce something new | design, formulate, plan, construct, devise | advanced |

**Match the level to the learner.** Residents: weight toward Remember →
Understand → Apply. Qualified surgeons/HCPs: weight toward Apply → Analyze →
Evaluate (they don't need recall drills; they need decision and judgment practice).

**Good vs. weak objective**
- Weak: "Understand vascular access." (not measurable, no level)
- Good: "Select the appropriate vascular access site for [scenario], justifying the choice against [criteria]." (Evaluate, observable)

## 3. Module / chapter patterns
A reliable module shape:
1. **Orient** — why this matters (patient-safety stake), objectives, prerequisites.
2. **Foundations** — the concepts/anatomy/principles needed (Remember/Understand).
3. **Application** — procedure/technique/decision-making (Apply/Analyze).
4. **Integration** — cases, edge cases, complications, judgment (Analyze/Evaluate).
5. **Verify** — assessment checkpoint(s) mapped to the objectives.

Chapters within a module follow the same arc at smaller scale: each opens with its
objective, teaches in sections, and closes with a quick knowledge check where useful.

## 4. Sequencing principles
- **Prerequisite before dependent**: never teach a step that needs an untaught concept.
- **Simple → complex; known → unknown; concrete → abstract.**
- **Spaced retrieval**: revisit earlier points in later checkpoints, not just at the end.
- **Cognitive load**: keep sections single-idea; a chapter heavy with new terms needs
  more, shorter sections, not one dense one.
- **Worked example → faded practice → independent practice** for procedural skills.

## 5. Assessment placement (constructive alignment)
- **Formative knowledge check** at the end of a chapter where it aids retention
  (1–3 items): low stakes, immediate feedback, mapped to the chapter objective.
- **Summative module assessment** at the end of each module: verifies the
  module-level objective(s). Match the requested type:
  - **MCQ** — efficient for Remember/Understand; write plausible distractors.
  - **Case-based quiz** — best for Apply/Analyze/Evaluate; a clinical vignette + decision items.
  - **Practical / simulation checklist** — for psychomotor skills (blended courses);
    observable criteria, pass/fail per item.
  - **Mixed** — knowledge MCQs + a case scenario.
- **Every assessment item maps to an objective.** If an item tests something no
  objective named, either add the objective or cut the item.
- **Pass conditions** (e.g. "[N]% to pass") are a placeholder `[bracketed]` for the
  Education team — never invent a threshold.

## 6. Duration estimation (rough, for planning)
- Express durations as estimates (`~`), distributed across modules/chapters.
- A self-paced e-learning chapter of reading + a short check is often ~15–30 min;
  a case-heavy chapter more. Treat these as planning guides, not promises.
- If `total_duration` is given, distribute it and flag if the scope looks too large
  for the time (a load check in `Notes:`). If not given, bracket it.

## 7. Accessibility & quality cues (note for the builder)
- Suggest captions/transcripts for any video, alt text for diagrams, and plain
  language — note these in `Notes:` for the course builder (also supports Qualiopi).
- Prefer GEPROMED's strength: real device/anatomy/technical diagrams over stock.
