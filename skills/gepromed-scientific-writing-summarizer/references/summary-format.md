# Summary format reference (GEPROMED scientific summarization)

How to summarize a scientific text faithfully. The governing rule is
**faithfulness**: the summary reports only what the source contains — its claims,
its numbers, its hedges, and its limitations — and adds nothing. A summary that
introduces a fact, number, or interpretation not in the source is a failure, not a
"helpful addition".

## Faithfulness rules (read first)
1. **Only what the source says.** No added facts, numbers, mechanisms, or
   interpretations. If the source doesn't state it, the summary doesn't either.
2. **Preserve hedging and scope.** If the authors say "may be associated with",
   the summary must not say "causes". Carry the uncertainty across.
3. **Keep numbers exact.** Sample sizes, percentages, p-values, CIs — verbatim from
   the source, with units and significant figures intact. Never round silently,
   never invent a missing value.
4. **Carry limitations.** A faithful summary of a study includes its stated
   limitations; omitting them overstates the findings.
5. **Distinguish the source's voice from your framing.** Attribute findings to the
   study ("the authors report…"), don't assert them as universal truth.
6. **Flag ambiguity, don't resolve it.** If the source is unclear, say so
   (\`[unclear in source]\`) rather than guessing.
7. **No new citations.** Do not add references the source didn't cite; if you
   mention the source itself, identify it from the supplied text only.

## Output formats (pick per request; default: structured-abstract)

### A. One-line / TL;DR
A single faithful sentence: what was studied, the main finding, the key caveat.
- *"In [N] explanted devices, the study reports [main finding]; the authors note
  [key limitation]."* — numbers only if the source gives them.

### B. Structured-abstract summary (default)
Mirror IMRAD so the reader gets a faithful mini-version:
\`\`\`
Objective:    <the question/aim the source states>
Methods:      <design, sample, what was done — as stated>
Results:      <key findings + the source's numbers, verbatim>
Conclusions:  <the authors' conclusion, with their hedging>
Limitations:  <as stated in the source>
\`\`\`

### C. Detailed structured summary
The structured-abstract plus a short paragraph per IMRAD section, still faithful,
useful for an internal research read-out. Keep interpretation attributed to the
authors.

### D. Lay / institutional summary
Plain-language version for a non-specialist (funder, institution, public). Simplify
*wording*, never the *facts*: keep the finding accurate, drop jargon, define what
remains. Do **not** inflate certainty to make it sound impressive — a lay summary
must stay as hedged as the science.

## Per-audience register
- **Peer / research:** technical terms intact; concise; numbers foregrounded.
- **Lay:** plain language, defined terms, accurate certainty; no jargon dumps.
- **Institutional / funder:** outcome- and relevance-focused, still faithful; tie
  to patient-safety relevance only if the source supports it.

## What a good summary never does
- Add a statistic, mechanism, or comparison the source doesn't contain.
- Upgrade "associated with" to "causes", or "suggests" to "proves".
- Drop the limitations to make the finding look stronger.
- Invent or "complete" a half-stated number.
- Editorialize ("this groundbreaking study…") — stay neutral.
- Introduce GEPROMED marketing framing into a summary of someone else's work.

## Output wrapper
End every summary with the integrity notes from the SKILL output format:
faithfulness confirmation (nothing added beyond the source), any \`[unclear in
source]\` flags, and the routing to Author / RQ for validation.
