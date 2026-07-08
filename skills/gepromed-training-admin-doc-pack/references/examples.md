# Training Admin Doc Pack — worked examples

Target-quality runs showing the moves: minimal intake (LIGHT tier), participant
data preserved exactly, session details bracketed where unknown, RGPD notice
complete and flagged for the DPO, no invented contact or retention.

---

## 1 — FR · full pack from a pasted roster (the common case)

**User:** "Pack admin pour le Bootcamp Vasculaire des 12-13 octobre au René Kieny
Education Center. Participants :
Claire Martin (CHU Strasbourg), Hugo Dubois (interne, CHU Lyon), Aïcha Bernard
(Clinique Pasteur), Lucas Petit."

**Skill action:** has the required fields → no questions. Builds the JSON and runs
the generator.

**Output:**
```
Assumptions: language = FR · DPO email + retention bracketed for the DPO.

Pack: Bootcamp Vasculaire — 12-13 octobre
Files:
- ./pack/feuille_emargement.docx  (4 participants, signature matin/après-midi)
- ./pack/badges.docx              (4 badges, logo + nom + organisme)
- ./pack/notice_rgpd.docx         (RGPD notice — [email DPO] and [retention] bracketed)

Notes (for the DPO): confirm DPO email, retention period, and GEPROMED address in
notice_rgpd.docx before distribution.
QA: 97/100
```

**Moves:** roster transcribed exactly (Lucas Petit kept with no organisme — clean
badge); DPO-owned fields bracketed, not invented; notice flagged for the DPO.

---

## 2 — EN · attendance sheet only, roster missing

**User:** "I need an attendance sheet for the device-vigilance workshop on
[date TBD]."

**Skill action:** required participant list is missing → one batched question:

> To build the pack I need the participant list (Last name, First name,
> Organisation, one per line). I'll bracket the date and DPO fields. Reply `go`
> with just the course title for a blank-roster template.

**User:** "go"

**Output:** a blank-roster attendance sheet for "Device-vigilance workshop", date
bracketed `[date]`, plus the RGPD notice and an empty badge grid the user can fill.
```
QA: 96/100
Notes (for the DPO): confirm DPO email + retention in notice_rgpd.docx.
```

**Moves:** one clarifying round only; proceeds with a usable template rather than
stalling; DPO validation flagged.

---

## 3 — Anti-pattern gallery (never produce)

- Inventing a DPO email or a retention period ("5 ans") to "complete" the notice.
- Altering or guessing a participant's name/organisation.
- Dropping the CNIL complaint right or the list of data-subject rights from the notice.
- A badge with a bracketed `[organisme]` (badges must look clean — omit instead).
- Distributing the notice without the DPO validation footer.
- Interrogating the user with a full intake — this is a LIGHT-tier skill.
