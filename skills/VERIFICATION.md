# GEPROMED Skills — verification report

All 16 skills audited and pressure-tested on 2026-06-20. Every gate green.

## 1. Completeness (16/16 ✅)
Each package has: `SKILL.md`, `agents/openai.yaml`, `memory/MEMORY.md`,
`instructions-portable.md`, `references/*` (5–7 files), `scripts/memory_update.py`,
and `references/intake-questions.md` for every Full/Light-intake skill
(`gepromed-email-reformulation` is Minimal tier, so no intake file — by design).
`assets/gepromed-logo.png` is byte-identical across all skills (single md5).

## 2. Structure & naming (16/16 ✅)
- Frontmatter `name:` == folder == `agents/openai.yaml` display_name (all start "GEPROMED").
- All `SKILL.md` frontmatter and `openai.yaml` parse as valid YAML.
- All descriptions are rich/trigger-rich (not thin).
- Every `.py` script compiles cleanly.

## 3. Scripts executed end-to-end (12/12 ✅)
| Script | Result |
|---|---|
| `gepromed-qualiopi-program-generator` → `generate_program_docx.py --demo` | ✅ 52 KB .docx |
| `gepromed-training-admin-doc-pack` → `generate_admin_pack.py --demo --badge-png` | ✅ attendance + badges + RGPD notice + PNGs |
| `gepromed-branded-template-library` → `generate_template.py --type {letter,report,presentation,email} --demo` | ✅ .docx/.pptx/.txt (4 types) |
| `gepromed-elearning-module-structurer` → `outline_to_docx.py --in outline --out` | ✅ 48 KB .docx |
| `gepromed-management-review-deck` → `generate_review_deck.py --demo` | ✅ 16-slide .pptx |
| `gepromed-stats-publication-chart` → `analyze_and_plot.py --chart box --group` | ✅ chart .png + stats summary |
| `gepromed-infographic-spec-generator` → `render_mock.py --template`→`--spec --out` | ✅ 1080×1080 .png |
| `gepromed-editorial-calendar-builder` → `build_calendar.py --template`→`--spec` | ✅ .csv + .md |
| `gepromed-email-reformulation` → `brand_voice_check.py` | ✅ clean=PASS · hype=caught |
| `gepromed-linkedin-post-drafter` → `post_format_check.py` | ✅ clean=PASS · hype=caught · length-warn works |
| `gepromed-rgpd-document-drafter` → `zero_invention_check.py` | ✅ flags asserted articles/durations/guarantees |
| `gepromed-iso-gap-analysis` → `iso_diff.py --old --new` | ✅ clause-level diff |

Note on invocation: the script-backed generators require their content flags —
`generate_template.py` needs `--type` + (`--demo`/`--in`); `outline_to_docx.py`
needs an outline `--in`; `build_calendar.py` / `render_mock.py` build from a
`--spec` (use `--template` to emit a starter spec). Documented in each `SKILL.md`.

## 4. Guardrails present in every SKILL.md (16/16 ✅)
Clarification protocol + intake tier · memory protocol · QA self-score ≥95 ·
human-validation gate · zero-invention/bracketing · brand constants (#007AC2).

## 5. Pressure tests (adversarial)
- **Anti-hype**: hype-bomb inputs ("world-class", "🚀", "don't miss out") are
  caught as errors by `brand_voice_check.py` and `post_format_check.py`; clean,
  on-brand inputs PASS.
- **Zero-invention**: `zero_invention_check.py` flags asserted RGPD article
  numbers, concrete retention durations, and "compliant/lawful" guarantees.
- **Compute-only-from-data**: `analyze_and_plot.py` derives every statistic
  (mean/SD/median/Shapiro/Welch or Mann-Whitney/Pearson/Spearman) from the
  supplied dataset only — no model-invented numbers.
- **Format discipline**: `post_format_check.py` enforces per-format length
  windows, hashtag count (3–6), emoji discipline, and AI-look tells.
- **Brand fidelity**: rendered artifacts (charts, mocks, decks, docs) use blue
  `#007AC2` master + orange `#EC6C17` accent (≤10%) + bundled logo.

## How to re-run
From `skills/`: the completeness, structure, and guardrail audits plus the
script suite can be re-executed against any package; each generator/checker
supports `--help`.
