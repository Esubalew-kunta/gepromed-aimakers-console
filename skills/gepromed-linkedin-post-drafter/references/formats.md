# GEPROMED LinkedIn — format specifications

The structural rules per format. Lengths are the windows the format checker
enforces. All formats share the GEPROMED house voice (expert, calm, evidence-led,
non-commercial) and the anti-AI-look rules in `hooks-and-hashtags.md`.

General LinkedIn truths the skill respects:
- The **first 1–2 lines are the hook** — they show before "…see more". Front-load.
- Plain text only. No markdown bold/headers render on LinkedIn; use line breaks
  and, sparingly, a single leading symbol (→, •) for rhythm — never a wall of them.
- One clear idea per post. One CTA, or none for a pure credibility post.
- Anchor to one of the four pillars and to patient safety.

---

## 1. Text post
A short, authoritative reflection, insight, or announcement.

- **Length:** 60–220 words (≈ 400–1,300 characters). Sweet spot ~120 words.
- **Shape:** hook (1–2 lines) → context/insight (2–4 short paragraphs) → takeaway
  → optional CTA → hashtags.
- **Rhythm:** vary sentence length deliberately. Use single-line paragraphs to
  create white space. Never 4 identical-length sentences in a row.
- **Proof:** lead with a concrete fact or observation, not a claim.

## 2. Carousel (slide-by-slide)
A multi-slide document (PDF) that teaches one idea step by step.

- **Slides:** 5–10 (cover + 3–8 content + closing/CTA). Default 7.
- **Per slide:** a short **headline** (≤ 8 words), **body** (≤ 30 words, often a
  single point or stat), and a **visual note** (what the slide shows).
- **Cover slide:** the hook as a headline + a subhead; GEPROMED logo bottom-corner.
- **Closing slide:** one takeaway + one CTA + logo; orange "O" motif allowed here.
- **Caption (the post text accompanying the carousel):** 40–120 words — a hook +
  why it matters + "Swipe →" style nudge + hashtags.
- **Visual:** follow `visual-spec.md`. Blue master, orange accent ≤10%, generous
  white space, consistent grid across slides, page numbers (e.g. 1/7).

## 3. Image post (caption + brand visual spec)
A single visual (figure, photo, or quote card) with a caption.

- **Caption length:** 40–180 words. Hook first, then context, then CTA/hashtags.
- **Visual spec (always provided):** layout, focal element, color usage, the "O"
  motif if relevant, logo placement, and **dimensions** (LinkedIn square
  1080×1080 px default; portrait 1080×1350 for higher feed presence).
- If the visual is a **photo** (e.g. a training session), specify framing and the
  on-brand caption bar (blue band, white text) rather than a heavy filter.
- Never imply a clinical/regulatory outcome from an image; bracket any caption fact.

## 4. Event post
Two sub-types. Both name the event, e.g. the **Vascular Bootcamp**.

### 4a. Announcement (before the event)
- **Length:** 70–200 words.
- **Must contain (bracket if unknown):** event name · date · location/format ·
  who it's for · what they'll gain · registration CTA + link.
- **Shape:** hook → what & why → who should come → logistics line → register CTA → hashtags.
- Tone: inviting but factual. No "Don't miss out!" urgency.

### 4b. Recap (after the event)
- **Length:** 70–200 words.
- **Must contain (bracket if unknown):** event name · what happened · one true
  outcome/number · a thank-you to participants/partners (by role, not by name
  unless cleared) · a forward look or next session.
- Tone: warm, grateful, credible. Lead with a result or a moment, not "What a day!".

## 5. Scientific-publication post
Announcing a paper, study result, or whitepaper.

- **Length:** 80–220 words.
- **Must contain (bracket if unknown):** the **plain-language takeaway** first,
  then the study object, then the **citation / DOI / journal**, then where to read it.
- **Hard rule:** never overstate findings; never imply causation/clinical guidance
  the paper doesn't state. Use the authors' own framing. Flag for RQ if any claim
  is clinical/regulatory.
- Tone: precise, humble, useful. Translate jargon for a mixed audience without
  dumbing down the science.
- Hashtags lean scientific (#MedicalDevices #PatientSafety #ClinicalResearch + topic).

---

## Format → checker mapping
| Format | `--format` value | Length window (words) |
|---|---|---:|
| Text post | `text` | 60–220 |
| Carousel caption | `carousel` | 40–120 |
| Image caption | `image` | 40–180 |
| Event (announce/recap) | `event` | 70–200 |
| Publication | `publication` | 80–220 |

For carousel/image, run the checker on the **caption text**; document the slides /
visual separately per `visual-spec.md`.
