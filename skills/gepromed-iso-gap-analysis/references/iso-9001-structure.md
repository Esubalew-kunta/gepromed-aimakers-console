# ISO 9001 clause structure (HLS / Annex SL) + ISO 13485 alignment

A navigation map for locating each change correctly in the standard. This file
describes the **clause structure and intent** so the analysis is placed in the right
clause — it does **not** reproduce the standards' copyrighted clause text. Always
quote/diff from the *supplied* version; this map only tells you *where* a change
lives.

GEPROMED operates a QMS certified to **ISO 9001** and **ISO 13485** (plus Qualiopi
for training). Both ISO 9001 and the structure many revisions adopt follow the
**High-Level Structure (Annex SL / Harmonized Structure)** — the 10-clause backbone
shared across modern ISO management-system standards.

---

## High-Level Structure — the 10 clauses (ISO 9001)
| # | Clause | What it governs (intent, not verbatim text) |
|---|---|---|
| 1 | Scope | What the standard applies to. |
| 2 | Normative references | Documents referred to. |
| 3 | Terms and definitions | Vocabulary. |
| **4** | **Context of the organization** | Internal/external issues, interested parties, QMS scope, processes. |
| **5** | **Leadership** | Leadership & commitment, customer focus, policy, roles/responsibilities/authorities. |
| **6** | **Planning** | Actions to address risks & opportunities, quality objectives, planning of changes. |
| **7** | **Support** | Resources, people, infrastructure, environment, monitoring resources, organizational knowledge, competence, awareness, communication, documented information. |
| **8** | **Operation** | Operational planning/control, requirements for products/services, design & development, control of external providers, production & service provision, release, nonconforming outputs. |
| **9** | **Performance evaluation** | Monitoring/measurement/analysis/evaluation, customer satisfaction, internal audit, management review. |
| **10** | **Improvement** | Nonconformity & corrective action, continual improvement. |

Clauses **4–10** carry the auditable requirements. Clauses 1–3 are framing.

## Frequently-referenced sub-clauses (intent only)
- **4.1 / 4.2** — context, interested parties (drives risk thinking).
- **4.4** — the QMS and its processes (process approach).
- **5.2** — quality policy. **5.3** — roles, responsibilities, authorities.
- **6.1** — risks and opportunities (risk-based thinking, central to modern ISO 9001).
- **7.1.6** — organizational knowledge (notable addition in the 2015 structure).
- **7.5** — documented information (replaces older "documents + records" wording).
- **8.3** — design and development. **8.4** — externally provided processes/products.
- **8.5.1 / 8.7** — production/service control; nonconforming outputs.
- **9.1.2** — customer satisfaction. **9.2** — internal audit. **9.3** — management review.
- **10.2** — nonconformity and corrective action. **10.3** — continual improvement.

## ISO 9001 vs ISO 13485 — alignment note
ISO 13485 (medical devices) is **based on ISO 9001 but does not follow the HLS** and
keeps its own clause numbering, with device-specific requirements (regulatory
requirements, risk management across the product realization, design controls,
sterilization, traceability, advisory notices, complaint handling, post-market). When
comparing across the two, map by **intent**, not by clause number, and flag where a
13485 requirement has no ISO 9001 equivalent (e.g. regulatory-specific obligations).
For GEPROMED (testing, explant analysis, clinical research, training), 13485's
device focus is central — treat its device-specific clauses as high-impact.

## How to use this map in a gap analysis
1. Take each detected change (from the supplied diff).
2. Find its clause number; locate it in the table above to confirm the area.
3. Note whether the change touches an **auditable requirement** (clauses 4–10) — those
   carry higher impact than editorial/framing changes.
4. For 13485 comparisons, check whether the change is **device-/regulatory-specific**
   (usually higher severity for GEPROMED).
5. Record the location and intent in the gap-analysis row; **never paste invented
   clause wording** — quote the supplied text or reference the clause number.

## Copyright note
ISO standards are copyrighted. This skill does **not** store or reproduce their text.
The user supplies the version text to compare. Outputs reference clause numbers and
quote only the user-supplied wording.
