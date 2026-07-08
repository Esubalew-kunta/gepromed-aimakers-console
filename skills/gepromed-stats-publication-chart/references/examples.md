# GEPROMED stats chart — worked examples

Real worked analyses showing target quality and the **GEPROMED house voice**
(company-wide, not personal). Study the *moves*: method matched to the question,
assumptions checked, the chosen test stated, every number from the data, n shown,
no overclaiming, routed to the Scientific role. FR + EN.

The sample dataset (`references/sample-data.csv`) has columns: `device`,
`material`, `diameter_mm`, `burst_pressure_kpa`, `patency_days` (18 rows).

---

## 1 — EN · two-group comparison (test platform)
**Prompt:** "Compare patency between the two devices and give me a publication boxplot."

**Command:**
```bash
python scripts/analyze_and_plot.py --input references/sample-data.csv \
  --chart box --y patency_days --group device --test auto \
  --out patency_by_device.png --title "Patency by device"
```
**Output:**
```
Assumptions: outcome = patency_days, group = device, chart = boxplot, test = auto.

Statistics summary:
  StentA: n=9, mean=382, SD=29.18, median=388 [Q1 365–Q3 402]
  StentB: n=9, mean=299.33, SD=20.54, median=301 [Q1 288–Q3 312]
  Shapiro (A): W=0.967, p=0.867 ; Shapiro (B): W=0.984, p=0.981 → both normal
  Test chosen (auto): Welch t-test → t=6.949, p=5.89e-06

Chart: patency_by_device.png
Method note: both groups passed Shapiro normality, so a Welch t-test (unequal
variances) was used. Difference is statistically significant at α=0.05.
Notes: clinical relevance and any publication claim are for Scientific review.
Validation: route to the Scientific role.
QA: 98/100
```
**Moves:** test chosen transparently from the normality check; p reported exactly;
n on every group; significance stated as statistical, not clinical.

---

## 2 — FR · corrélation (plateforme de test)
**Prompt :** « Y a-t-il un lien entre le diamètre et la pression d'éclatement ? Nuage de points pour l'article. »

**Commande :**
```bash
python scripts/analyze_and_plot.py --input references/sample-data.csv \
  --chart scatter --x diameter_mm --y burst_pressure_kpa --corr auto \
  --out diametre_pression.png --title "Diamètre vs pression d'éclatement"
```
**Sortie :**
```
Hypothèses : x = diameter_mm, y = burst_pressure_kpa, graphique = nuage, corrélation = auto.

Résumé statistique :
  diameter_mm : n=18, moyenne=6.07, ET=0.17
  burst_pressure_kpa : n=18, moyenne=207.5, ET=26.18
  n appariés = 18 ; Pearson r=0.318, p=0.199 ; Spearman rho=0.331, p=0.18

Graphique : diametre_pression.png
Note de méthode : association linéaire faible et non significative (p=0.199) ;
Spearman confirme (rho=0.331). La droite d'ajustement est descriptive, pas prédictive.
Notes : corrélation n'est pas causalité ; interprétation à valider (rôle Scientifique).
Validation : transmettre au rôle Scientifique.
QA : 97/100
```
**Moves :** Pearson + Spearman tous deux rapportés ; non-significativité énoncée
honnêtement ; rappel corrélation ≠ causalité.

---

## 3 — EN · distribution (explant analysis)
**Prompt:** "Show the distribution of burst pressure with the mean."

**Command:**
```bash
python scripts/analyze_and_plot.py --input references/sample-data.csv \
  --chart hist --y burst_pressure_kpa --out burst_distribution.png \
  --title "Burst pressure distribution"
```
**Output:**
```
Assumptions: variable = burst_pressure_kpa, chart = histogram (mean line).

Statistics summary:
  burst_pressure_kpa: n=18, mean=207.5, SD=26.18, median=205 [Q1 186.25–Q3 230.25],
  min=168, max=250

Chart: burst_distribution.png
Method note: descriptive only; the orange dashed line marks the mean. The spread
suggests two sub-populations — consider grouping by material before inferring.
Notes: no test run (single distribution). Validation: Scientific role.
QA: 96/100
```
**Moves:** describes shape, flags a likely subgroup structure, does not invent a test.

---

## 4 — FR · comparaison de moyennes par matériau (barres + ET)
**Prompt :** « Moyenne de la pression d'éclatement par matériau, en barres avec écart-type. »

**Commande :**
```bash
python scripts/analyze_and_plot.py --input references/sample-data.csv \
  --chart bar --y burst_pressure_kpa --group material \
  --out pression_par_materiau.png --title "Pression d'éclatement par matériau"
```
**Sortie :**
```
Hypothèses : variable = burst_pressure_kpa, groupe = material, graphique = barres (moyenne ± ET).

Résumé statistique :
  cobalt-chrome : n=9, moyenne=229.22, ET=15.11
  nitinol : n=9, moyenne=185.78, ET=12.90

Graphique : pression_par_materiau.png
Note de méthode : barres = moyennes, moustaches = ET. Pour conclure à une
différence, lancer une comparaison à deux groupes (auto : t de Welch / Mann-Whitney).
Notes : ne pas conclure sans test ; validation rôle Scientifique.
QA : 96/100
```
**Moves :** barres avec ET, et invite explicite à faire le test avant de conclure
— pas de p-value inventée.

---

## Anti-pattern gallery (never produce these)
- **Inventing a statistic** ("p ≈ 0.04") instead of computing it from the data.
- A bar of means with **no error bars** and **no n**.
- Reporting a p-value **without naming the test** that produced it.
- Concluding "device A is safer / better" — that is clinical interpretation, the
  human's call, not the skill's.
- Truncating the y-axis to make a small difference look large.
- A rainbow chart, 3-D bars, or orange used as decoration across whole series.
- Silently dropping missing rows without reporting the resulting n.
- Imputing or "filling in" missing values to make the dataset look complete.
