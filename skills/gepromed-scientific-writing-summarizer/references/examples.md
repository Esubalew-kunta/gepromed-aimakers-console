# Scientific Writing & Summarizer — worked examples

Worked outputs at target quality, across both modes. These represent the
**GEPROMED scientific-author standard**. Study the *moves*: faithfulness in
summaries, within-data discipline in drafts, `[CITATION NEEDED]` everywhere a
reference belongs, `[bracketed]` for every unconfirmed number, measured hedging,
zero fabrication.

---

## 1 — SUMMARIZE · EN · structured-abstract of a (supplied) explant study

**Input (excerpt the user pasted):** *"We analysed 142 explanted vascular grafts
retrieved between 2019–2023. Structural degradation was observed in 38% (n=54).
Degradation was associated with longer implantation time (p=0.02). This
single-centre retrospective analysis is limited by selection bias and absent
clinical correlation."*

```
Mode: Summarize
Assumptions: structured-abstract · peer audience · EN

— SUMMARY of "explanted vascular graft analysis (2019–2023)" —

Objective:    To analyse structural degradation in explanted vascular grafts.
Methods:      Single-centre retrospective analysis of 142 vascular grafts explanted
              between 2019 and 2023.
Results:      Structural degradation was observed in 38% of grafts (n=54). The
              authors report an association between degradation and longer
              implantation time (p=0.02).
Conclusions:  The authors describe an association between degradation and
              implantation time; the analysis is descriptive.
Limitations:  Stated by the authors: single-centre retrospective design,
              selection bias, and absence of clinical correlation.

Integrity notes:
- Source fidelity: nothing added beyond the supplied text; numbers (142, 38%, n=54, p=0.02) reported verbatim; the association is reported as the authors state it (not as causation).
- Validation: route to Author / RQ before any onward use.
QA: 98/100
```

**Moves:** every number verbatim, "association" not "cause", limitations carried,
no invented mechanism or comparison, neutral framing.

---

## 2 — DRAFT · EN · Introduction section from a brief

**Brief:** draft an Introduction on biomaterial degradation in vascular explants;
target a vascular-surgery journal; key data supplied: "GEPROMED database, >150
explants/year"; aim: characterise degradation patterns.

```
Mode: Draft
Assumptions: Introduction · vascular-surgery peer journal · EN

— DRAFT: Introduction — biomaterial degradation in vascular explants —

Implanted vascular devices are exposed to mechanical and biological stresses that
can, over time, alter their structural integrity [CITATION NEEDED]. Understanding
how and when such degradation occurs is central to improving long-term device
safety [CITATION NEEDED]. Explant analysis — the systematic examination of devices
retrieved from patients — offers a direct, real-world window onto these processes,
complementing bench testing and clinical follow-up [CITATION NEEDED].

Despite growing interest, large structured collections of vascular explants remain
scarce, which limits the statistical characterisation of degradation patterns
[CITATION NEEDED]. Drawing on a database receiving more than [150] vascular
explants per year [data to confirm], the present work aims to characterise
patterns of biomaterial degradation across explanted vascular devices.

The objective of this study is to [state the precise aim/hypothesis — to confirm
with the authors].

Integrity notes:
- Citations: 4 [CITATION NEEDED] markers — all references must be human-verified; none generated.
- Unconfirmed values: ">150 explants/year" bracketed pending confirmation; the precise aim to be supplied by the authors.
- Validation: route to Author / RQ before submission.
QA: 96/100
```

**Moves:** every claim that needs support carries `[CITATION NEEDED]`; the one
supplied figure is bracketed pending confirmation; the aim is not invented; tone
measured; no fabricated reference anywhere.

---

## 3 — SUMMARIZE · FR · résumé vulgarisé (lay) pour un financeur

**Entrée (extrait fourni) :** *« Cette étude pilote sur 30 patients montre une
tendance à une meilleure perméabilité à 12 mois, sans atteindre la significativité
statistique (p=0,08). Les auteurs appellent à une étude de plus grande ampleur. »*

```
Mode: Summarize
Hypothèses : résumé vulgarisé · public financeur · FR

— RÉSUMÉ de « étude pilote — perméabilité à 12 mois » —

Cette étude pilote, menée sur 30 patients, observe une tendance à une meilleure
perméabilité à 12 mois. Cette tendance n'atteint pas le seuil de significativité
statistique (p=0,08) : autrement dit, le résultat est encourageant mais non
concluant à ce stade. Les auteurs recommandent une étude de plus grande ampleur
pour confirmer ces observations.

Notes d'intégrité :
- Fidélité à la source : rien n'est ajouté ; les chiffres (30 patients, p=0,08) sont repris tels quels ; la « tendance » non significative est présentée comme telle, sans la surestimer.
- Validation : à transmettre à l'Auteur / RQ avant diffusion.
QA: 97/100
```

**Moves :** vulgarisation du *langage* sans gonfler la *certitude* ; le « non
significatif » est préservé et expliqué ; aucun chiffre inventé ; cadrage neutre.

---

## 4 — DRAFT · EN · Results section — strict no-fabrication demonstration

**Brief:** draft a Results paragraph; user supplies ONLY "primary endpoint met in
the test group" but **no numbers**.

```
Mode: Draft
Assumptions: Results · peer audience · EN · no numeric data supplied

— DRAFT: Results — primary endpoint —

The primary endpoint was met in the test group [primary-endpoint value: to supply].
[Report the corresponding figure for the comparator group and the between-group
comparison, with the test statistic and p-value — values to supply.] Findings for
the secondary endpoints are presented in [Table/Figure — to supply].

Integrity notes:
- Unconfirmed values: ALL numeric results are placeholders ([value: to supply]); no statistic, n, or p-value has been generated.
- Citations: none in Results by convention; comparisons belong in Discussion.
- Validation: the author must insert verified data; route to Author / RQ before submission.
QA: 96/100
```

**Moves:** the skill refuses to invent a single statistic; it builds the sentence
*scaffold* and brackets every value. This is the behaviour that makes the skill
safe — a missing number stays missing, never fabricated.

---

## Anti-pattern gallery (never produce these)
- Generating a citation — any author, year, journal, or DOI — instead of `[CITATION NEEDED]`.
- Inventing a p-value, sample size, effect size, or "98% of patients" to fill a gap.
- Upgrading the source's "associated with / suggests" to "causes / proves".
- Dropping a study's stated limitations to make the summary sound stronger.
- Adding a mechanism, comparison, or interpretation the source never states.
- Promotional framing ("this groundbreaking GEPROMED study…") in a scientific text.
- A "complete-looking" Results paragraph with fabricated numbers instead of brackets.
