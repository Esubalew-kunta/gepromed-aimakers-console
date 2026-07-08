# Gepromed — Add-in Skills

Self-contained, uploadable AI skills derived from the Gepromed Quick Wins
("Deliverable as skills"). Each skill is **stateless**, has **no integrations**
(no Brevo / LMS / payment / OneDrive / Jira / machine sync), produces a
document / draft / analysis on demand, and ends with **a human validating
before anything is published or sent**.

Every skill embeds the [Gepromed brand kit](../brand/) guardrails and is
**bilingual (FR/EN)** — it answers in the user's language or follows an explicit
language request. All skills follow the shared [conventions](CONVENTIONS.md):
`gepromed-<name>` naming and a **clarification protocol** (ask focused questions
before producing half-baked output).

## How to install

| Platform | Mechanism | How |
|---|---|---|
| **Claude** | Skills | Upload the skill folder (with `SKILL.md`) at claude.ai → Settings → Capabilities → Skills (or via the API/Agent SDK). |
| **ChatGPT** | Custom GPT | New GPT → paste `instructions-portable.md` into *Instructions*; optionally attach `../brand/` files as Knowledge. |
| **Gemini** | Gem | New Gem → paste `instructions-portable.md` into the instructions; attach brand files as knowledge. |

## Package anatomy (gold standard)

Each skill is a **self-contained, brand-loaded, self-improving package** — not a
thin prompt. Every skill is a **company asset**: it writes in one consistent
GEPROMED house voice for any team member (not a personal tool).

```
gepromed-<name>/             # always named gepromed-<name>, lowercase, hyphenated
├── SKILL.md                 # Claude Agent Skill: trigger-rich description, clarification +
│                            #   memory protocols, routing logic, output spec, brand constants
├── agents/openai.yaml       # cross-platform manifest (ChatGPT/Gemini display + examples)
├── references/              # bundled knowledge: scoped brand guidelines, voice & tone,
│                            #   recipient playbook, FR↔EN glossary, type templates,
│                            #   intake questions (Full-tier), worked FR/EN examples, QA rubric
├── memory/MEMORY.md         # self-updating house-style memory: loaded first, appended
│                            #   to as the team corrects it — converges toward correct
├── assets/                  # real brand assets (logo, fonts, base templates, signatures)
├── scripts/                 # deterministic helpers: brand-voice lint, memory updater,
│                            #   artifact generators (for script-backed skills)
└── instructions-portable.md # paste-able build + knowledge-upload steps for ChatGPT/Gemini
```

Skills are self-contained on upload (each bundles its **own** brand reference;
the repo-root `/brand` kit is the master source, mirrored per skill). Each skill
**self-scores ≥95/100** against its QA rubric before returning output, and
**learns over time** via its memory file.

## The 16 skills

Status: ✅ built · ⬜ specced (build pending). Need #s reference `GEPROMED_Besoins_IA.xlsx`.
**Intake** = clarification tier (see `CONVENTIONS.md`): **Full** = structured intake
before generating · **Light** = ask only for missing required fields · **Minimal**
= input is self-defining, ask only on ambiguity · `*` = mode-dependent.

### Document & template generation
| # | Skill | Needs | Intake | Validator | Status |
|---|---|---|---|---|---|
| 1 | `gepromed-qualiopi-program-generator` | #9 | Full | RQ / Qualiopi | ✅ |
| 2 | `gepromed-training-admin-doc-pack` | #10 | Light | DPO | ✅ |
| 3 | `gepromed-branded-template-library` | #7 | Full | — | ✅ |
| 4 | `gepromed-elearning-module-structurer` | #25 | Full | — | ✅ |

### Communication & content
| # | Skill | Needs | Intake | Validator | Status |
|---|---|---|---|---|---|
| 5 | `gepromed-linkedin-post-drafter` | #1, #8 | Full | Comms | ✅ |
| 6 | `gepromed-editorial-calendar-builder` | #2 | Full | Comms | ✅ |
| 7 | `gepromed-infographic-spec-generator` | #3, #15 | Full | — | ✅ |
| 8 | `gepromed-email-reformulation` | #4, #14, #27, #36 | Minimal | — | ✅ gold standard |
| 9 | `gepromed-website-content-generator` | #24 | Full | Comms | ✅ |
| 10 | `gepromed-scientific-writing-summarizer` | #5, #26, #28 | Full* (summary = Minimal) | Author / RQ | ✅ |

### Prospecting (drafting only, not a CRM)
| # | Skill | Needs | Intake | Validator | Status |
|---|---|---|---|---|---|
| 11 | `gepromed-prospect-outreach-drafter` | #6, #16 | Full | — | ✅ |

### Data analysis
| # | Skill | Needs | Intake | Validator | Status |
|---|---|---|---|---|---|
| 12 | `gepromed-stats-publication-chart` | #19, #20 | Light | Scientific | ✅ |

### Compliance & quality drafting
| # | Skill | Needs | Intake | Validator | Status |
|---|---|---|---|---|---|
| 13 | `gepromed-rgpd-document-drafter` | #22 | Full | DPO | ✅ |
| 14 | `gepromed-iso-gap-analysis` | #38, #39 | Light* (gap = Minimal) | RQ | ✅ |
| 15 | `gepromed-management-review-deck` | #40, #41 | Full* (minutes = Minimal) | RQ | ✅ |
| 16 | `gepromed-hr-drafting` | #43, #44 | Full | RAF | ✅ |

**Status: all 16 built, audited, and pressure-tested** to the
`gepromed-email-reformulation` gold-standard bar. Every package passes the
completeness, structure/naming, script-execution, and guardrail gates — see
[`VERIFICATION.md`](VERIFICATION.md) for the full report.

## Out of scope (section 2 — not skills)

Stateful / integrated needs are intentionally excluded: Vascular Supervisors
Network, registration/lead tracking, quote-to-invoice & treasury anomaly
detection, expense receipt auto-filing to OneDrive (#47), Satellite/Jira
(#21, #30-33), machine connectivity/calibration (#17), Blockwise/MTS parser
(#12), fiscal receipts auto-send (#48), DUERP/expiry tracking (#45), standards
watch (#18, #37). These need a product/integration/persistent state.
