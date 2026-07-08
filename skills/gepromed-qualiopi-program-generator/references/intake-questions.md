# Qualiopi Program Generator — intake questions (FULL tier)

This skill runs a **structured intake** before generating, because a Qualiopi
program is only compliant if its required blocks are filled from real inputs.
Ask the batched set below (skip any the user already answered or that `MEMORY.md`
covers). **Cap: 2 rounds.** Always offer the escape hatch.

> Never invent regulatory content. If the user replies `go`, generate with the
> safe GEPROMED defaults below and put every unconfirmed value in `[crochets]`
> for the Responsable Qualité (RQ) to validate.

---

## Round 1 — the 5 high-leverage questions (ask all at once)

1. **Intitulé + public visé + prérequis** — What is the exact course title, who
   is it for (profession/level), and what are the prerequisites?
   *Default:* infer a clear, non-promotional title from the request; public =
   the clinical profession named; prérequis = "Aucun prérequis" if none stated.

2. **Objectifs pédagogiques** — What should a participant be able to *do* after
   the action? (3–6 operational, assessable objectives.)
   *Default:* draft objectives with action verbs (réaliser, identifier, appliquer,
   évaluer) tied to the topic, each checkable by the assessment. No "comprendre".

3. **Durée + modalités pédagogiques** — How long (hours / days), and how is it
   delivered?
   *Options:* `présentiel` · `distanciel` (synchrone/asynchrone) · `mixte` ·
   `simulation` (René Kieny Education Center). *Default:* présentiel + simulation,
   duration bracketed `[N heures]` if unstated.

4. **Modalités d'évaluation + sanction** — How is acquisition measured, and what
   does the participant receive?
   *Default:* pré/post-test + évaluation pratique sur grille + questionnaire de
   satisfaction; sanction = "Attestation de fin de formation" + "Certificat de
   réalisation".

5. **Tarifs + délais d'accès + inscription** — Price and conditions, access
   lead time, and how/when to register?
   *Default:* tarif bracketed `[montant]`, financing routes listed (OPCO /
   employeur / personnel); access "jusqu'à [N] jours avant la session";
   inscription par formulaire/email jusqu'à `[date limite]`.

**Planning / schedule (Excel).** The detailed timetable is supplied as an
**Excel `Planning` sheet** — one row per créneau (`Jour, Heure début, Heure fin,
Intitulé du créneau, Type, Groupe, Salle, Encadrant(s), Évalué`). Ask whether the
action splits attendees into **parallel sub-groups** (A, B, …) rotating between
rooms/ateliers at the same time — those rows share a `Jour + Heure` and differ
only by `Groupe`, and render as **parallel columns**. `Groupe` vide/`Tous` = a
single full-width slot. If no schedule is provided yet, generate the fiche blocks
and leave the Planning to be imported (see `excel-schedule-template.md`).

**Accessibilité handicap** is *not* asked — the skill always inserts the standard
GEPROMED process paragraph (names a référent handicap role, contact bracketed).
The RQ confirms the contact.

---

## Escape hatch (always show)

> Reply `go` and I'll generate the program with the GEPROMED defaults above,
> bracketing every value the Responsable Qualité still needs to confirm.

## Round 2 (only if a gate block is still empty)

If after Round 1 an RNQ-required block (objectifs, évaluation, durée, modalités,
tarifs, délais, inscription, public, prérequis) is still missing and cannot be
safely defaulted, ask **only** for those, then generate with clearly bracketed
placeholders. Never exceed 2 rounds.

## Language

Mirror the user's language. FR by default for programs aimed at the French public;
produce an EN version for international actions when requested.
