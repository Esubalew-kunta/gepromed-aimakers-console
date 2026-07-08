# GEPROMED ISO gap analysis — worked examples

Worked examples showing target quality and the **GEPROMED house voice** (company-
wide, not personal). The clause *text* shown here is **illustrative placeholder
wording supplied by the user**, not authoritative ISO text — the skill never invents
standard wording. Study the *moves*: changes trace to supplied text, located in the
clause structure, concrete GEPROMED impact, severity applied consistently, RQ flag.
FR + EN.

---

## 1 — EN · MINIMAL diff of two supplied document versions (Testing procedure)
**Input:** two `.md` files supplied (v1, v2 of an internal control extract). Mode =
MINIMAL → diff, no intake. Helper:
```bash
python scripts/iso_diff.py --old v1.md --new v2.md --context 1 --scaffold
```
**Output:**
```
Mode: Version diff (MINIMAL)
Standard: supplied documents (internal control extract, v1 → v2)

Summary: Two clauses tightened (4.1 adds "strategic direction"; 6.1 adds
"evaluate their effectiveness"); one clause added (7.1.6 organizational knowledge);
one removed (8.3 design and development). Direction: stronger context and
effectiveness requirements.

Gap analysis (clause by clause):
| Clause | Change | What changed | Impact on GEPROMED QMS | Required action | Severity | Owner | Status |
|---|---|---|---|---|---|---|---|
| 4.1 | Changed | Adds "and strategic direction" to context determination (supplied text) | Context analysis must reference strategic direction | Update context-analysis record to cover strategic direction | Minor | RQ | Open |
| 6.1 | Changed | Adds "and evaluate their effectiveness" to risk actions (supplied text) | Risk actions now need an effectiveness check | Add effectiveness-evaluation step to risk register | Major | RQ | Open |
| 7.1.6 | Added | New clause on organizational knowledge (supplied text) | No current procedure for capturing/maintaining org knowledge | Create a procedure to identify & maintain organizational knowledge | Critical | RQ | Open |
| 8.3 | Removed | Clause no longer present in v2 (supplied text) | Confirm whether design-control requirements moved or were dropped | RQ to confirm relocation before removing controls | Major | RQ | Open |

Notes: comparison is verbatim against the two supplied files only.
Validation: ⚠ RQ validation required before any conformity decision or audit use.
QA: 98/100
```
**Moves:** every row anchored to the supplied diff; concrete GEPROMED impact;
severity applied; no conformity conclusion; RQ flag.

---

## 2 — FR · résumé de mise à jour (mode LIGHT, périmètre demandé)
**Demande :** « Résume les changements de structure de l'ISO 9001 par rapport à
l'ancienne structure. » (Pas de texte fourni → LIGHT, intake périmètre.)
**Hypothèses (après `go`) :** ISO 9001, clauses auditables 4–10, niveau structurel,
FR.
**Output :**
```
Mode: Résumé de mise à jour (LIGHT)
Standard: ISO 9001 (structure HLS / Annexe SL)
Hypothèses : périmètre = clauses 4–10 ; niveau structurel (texte non fourni).

Résumé : la structure haut niveau organise la norme en 10 clauses ; les exigences
auditables se concentrent sur les clauses 4 à 10. Points structurants : pensée
fondée sur les risques (6.1), connaissances organisationnelles (7.1.6), information
documentée (7.5, remplaçant l'ancienne distinction documents/enregistrements).

Analyse (au niveau structurel — formulation exacte non fournie) :
| Clause | Type | Élément structurant | Impact QMS GEPROMED | Action requise | Sévérité | Responsable | Statut |
|---|---|---|---|---|---|---|---|
| 6.1 | Renforcé | Pensée fondée sur les risques | Risques/opportunités à formaliser | Vérifier le registre des risques | Major | RQ | Ouvert |
| 7.1.6 | Ajouté | Connaissances organisationnelles | Procédure dédiée à créer/maintenir | Créer une procédure | Major | RQ | Ouvert |
| 7.5 | Reformulé | Information documentée | Aligner la terminologie documents/enregistrements | Mettre à jour la nomenclature documentaire | Minor | RQ | Ouvert |

Notes : formulation exacte des clauses non fournie ; clauses référencées par numéro,
non reconstituées. Pour un diff verbatim, fournir le texte des deux versions.
Validation : ⚠ Validation RQ requise avant toute décision de conformité.
QA : 96/100
```
**Moves :** travail au niveau structurel sans inventer le texte normatif ; invite à
fournir le texte pour un diff verbatim ; référence par numéro de clause.

---

## 3 — EN · ISO 13485 alignment note (mapping by intent, not number)
**Prompt:** "We compared a 9001 procedure to a 13485 requirement — flag the gaps."
**Output (excerpt):**
```
Mode: Version diff (MINIMAL — supplied documents)
Standard: ISO 9001 procedure vs ISO 13485 requirement (supplied extracts)

Summary: ISO 13485 carries device-/regulatory-specific obligations with no direct
ISO 9001 equivalent; mapped by intent, not clause number.

| Clause (13485) | Change | What changed (supplied) | Impact on GEPROMED QMS | Required action | Severity | Owner | Status |
|---|---|---|---|---|---|---|---|
| (regulatory req.) | Added vs 9001 | Explicit regulatory-requirement obligation | GEPROMED device work must evidence regulatory mapping | Add regulatory-requirements register | Critical | RQ | Open |

Notes: mapped by intent; 13485 keeps its own numbering (not HLS).
Validation: ⚠ RQ validation required before any conformity decision or audit use.
QA: 97/100
```
**Moves:** maps 9001↔13485 by intent; flags device/regulatory gaps as Critical for
GEPROMED; no invented clause text.

---

## Anti-pattern gallery (never produce these)
- **Inventing or paraphrasing standard clause text** as if it were authoritative.
- A "change" row that does not trace to a real supplied textual difference.
- Concluding "GEPROMED is conformant / non-conformant" — that is the RQ's decision.
- Mapping ISO 13485 to ISO 9001 by clause number instead of by intent.
- Inflating or deflating severity to fit a story.
- Fabricated dates, owners, or document references.
- Omitting the RQ-validation flag.
