# Branded template library — template specifications (domain reference)

How each GEPROMED-branded template must look and what blocks it contains. The
generator (`scripts/generate_template.py`) implements this spec. The skill fills
the template with the user's outline/sections; it **never invents** facts, figures,
or proof points — unknowns are bracketed for the author.

> Visual charte: master blue `#007AC2`, rare orange accent `#EC6C17` (≤10%), dark
> text `#1F2A33`, muted `#5F6B73`, white background, bundled logo, geometric
> sans-serif feel (Calibri in the rendered files). No hype, no decorative stock.

---

## Common header / footer (all document types)

- **Header band:** GEPROMED logo (left) + tagline line "The medical device hub for
  patient safety" in muted text.
- **Footer:** "GEPROMED — [adresse / gepromed.com]" in muted text + page context.
  Documents say "Document de travail — relire avant diffusion" / "Working document
  — review before release" where appropriate.
- **Type accent:** a single thin blue rule under each section heading; orange is
  used only for one focal element per page (a key number, the doc-type tag).

---

## 1. Letter (`--type letter`) → `.docx`

A formal GEPROMED letter ("courrier").

- Logo header + sender block (GEPROMED + author role, bracketed if unknown).
- **Recipient block** (right or left): name, organisation, address — bracketed if
  not supplied.
- **Place + date line:** "Strasbourg, le [date]" / "Strasbourg, [date]".
- **Objet / Subject line** in bold blue.
- **Salutation** appropriate to the audience (see the recipient register below).
- **Body:** the user's paragraphs/sections, clean and tight, house voice.
- **Closing formula** + signature block (author role; name bracketed if unknown).
- Margins generous; one page where possible.

## 2. Report (`--type report`) → `.docx`

A structured GEPROMED report / note.

- **Cover area:** logo, report **title** (large dark), a blue "Rapport" / "Report"
  tag in orange, and a meta line (réf · version · date · auteur — bracketed if
  unknown).
- **Table of sections** is optional; the report renders the supplied outline as
  numbered **Heading sections** (blue, ruled) with body text/bullets under each.
- **Executive summary / synthèse** block first if the outline includes one.
- **Body sections:** each from the outline; bullets where the content is a list.
- **Closing:** an optional "Conclusion" + a footer flagging it as a working
  document to review before release.

## 3. Presentation (`--type presentation`) → `.pptx`

A GEPROMED slide deck.

- **Title slide:** blue background band, logo, deck **title** (white/dark),
  subtitle, and a muted meta line. Orange accent rule.
- **Agenda slide** (if the outline lists sections): the section titles as bullets.
- **Content slides:** one per outline section — section title in blue, bullets in
  dark text. Keep ≤6 bullets/slide; the model splits long sections.
- **Closing slide:** "Merci" / "Thank you" + contact line (bracketed) + tagline.
- Consistent master colours; logo on every slide footer; no clip-art.

## 4. Email (`--type email`) → text (`.txt`)

A GEPROMED email scaffold (not a full rewrite — that is the email-reformulation
skill's job; here we produce a branded *template* the author fills).

- **Subject:** concise, specific (bracketed topic if unknown).
- **Greeting** appropriate to the audience.
- **Body skeleton:** purpose line, 1–3 supporting points/bullets, one explicit ask.
- **Closing** + the standard GEPROMED text signature block (role bracketed).
- No HTML/colour — plain text, house voice, no hype.

---

## Recipient register (applied to letter / email salutations + closings)

| Audience | FR salutation / closing | EN salutation / closing |
|---|---|---|
| Surgeon / HCP | « Cher Docteur, » / « Bien cordialement, » | "Dear Dr [Name]," / "Kind regards," |
| Manufacturer / industry | « Bonjour [Prénom Nom], » / « Cordialement, » | "Dear [First name]," / "Best regards," |
| Researcher / academic | « Cher [Prénom], » / « Bien cordialement, » | "Dear [First name]," / "With best regards," |
| Institution / funder | « Madame, Monsieur, » / « Je vous prie d'agréer… » | "Dear Sir or Madam," / "Yours faithfully," |
| Training participant | « Bonjour [Prénom], » / « Bien cordialement, » | "Hello [First name]," / "Kind regards," |
| Internal | « Bonjour [Prénom], » / « Merci, » | "Hi [First name]," / "Thanks," |

Default to neutral-professional + peer register when the audience is unclear.

---

## House voice for template content

- Expert, evidence-led, calm, non-commercial. Anchor to patient safety + one of
  the four pillars (Testing · Education · Clinical Research · Explant Analysis).
- Lead with evidence/proof before claims; vary sentence length.
- **No hype** ("world-class", "révolutionnaire", "🚀"), no salesy CTAs, no emojis
  in formal documents.
- Bracket every unknown fact/figure/name/date for the author; never invent.

## Anti-patterns (never produce)

- A deck/letter/report padded with invented statistics or proof points.
- Marketing superlatives in titles or headings.
- Orange used as a fill colour or for more than one focal element per page.
- A "template" so generic it carries no GEPROMED voice or structure.
- HTML or coloured email (email type is plain text).
