import type { Skill } from "@/lib/types";

/**
 * Gepromed-specific AI skills. Every `demo()` is a deterministic,
 * offline template — NO OpenAI or external API is ever called. This is
 * what makes the skill catalog fully demoable straight from a Render URL.
 */
export const skills: Skill[] = [
  {
    id: "mdr-gap-analysis",
    name: "MDR Technical File Gap Analysis",
    summary:
      "Reviews a device's technical documentation summary against EU MDR 2017/745 Annex II/III and flags missing evidence.",
    category: "Regulatory & Compliance",
    icon: "shield-check",
    tags: ["MDR", "Annex II", "Technical file", "CE marking"],
    owner: "Regulatory Affairs",
    model: "Gepromed Reg-LLM (demo)",
    status: "Live",
    runsThisMonth: 42,
    avgMinutesSaved: 95,
    systemPrompt:
      "You are a senior EU MDR regulatory affairs expert at Gepromed, a medtech company. Given a device description and a summary of its technical documentation, produce a structured Technical File gap analysis against EU MDR 2017/745 (Annex II Technical Documentation and Annex III PMS). Output GitHub-flavored Markdown with clear sections: what is present & adequate, gaps requiring action (numbered, each tagged Priority: High/Medium/Low), and recommended next steps. Reference the relevant annexes/standards (ISO 14971, MEDDEV 2.7/1 rev 4, ISO 15223-1, GSPR) where appropriate. End with a one-line disclaimer that this is a drafting aid, not regulatory advice.",
    inputs: [
      {
        name: "device",
        label: "Device name & class",
        type: "text",
        placeholder: "e.g. Class IIa wound-care dressing",
        sample: "NeoDerm Advanced Wound Dressing — Class IIa",
      },
      {
        name: "documentation",
        label: "Documentation summary provided",
        type: "textarea",
        placeholder: "List the sections currently in the technical file…",
        sample:
          "General description, intended purpose, risk management file (ISO 14971), biocompatibility summary, labelling drafts, clinical evaluation plan (no report yet).",
      },
    ],
    demo: (v) => {
      const device = v.device || "the submitted device";
      return [
        `## MDR Technical File Gap Analysis — ${device}`,
        "",
        "**Scope:** EU MDR 2017/745, Annex II (Technical Documentation) & Annex III (PMS).",
        "",
        "### ✅ Present & adequate",
        "- General device description and intended purpose",
        "- Risk management file referencing ISO 14971",
        "- Biocompatibility evaluation summary",
        "",
        "### ⚠️ Gaps requiring action",
        "1. **Clinical Evaluation Report (CER) missing** — a plan exists but no MDR-compliant CER per MEDDEV 2.7/1 rev 4. *Priority: High.*",
        "2. **Post-Market Surveillance (PMS) plan incomplete** — Annex III PMS plan and PMCF plan not evidenced.",
        "3. **Labelling** — drafts present but no verification against Annex I Ch. III symbols (ISO 15223-1). *Priority: Medium.*",
        "4. **GSPR checklist** — no explicit Annex I General Safety & Performance Requirements matrix mapping evidence to each requirement.",
        "",
        "### Recommended next steps",
        "- Commission the CER using existing clinical literature + equivalence rationale.",
        "- Draft the GSPR conformity matrix (Gepromed template available in Training Hub).",
        "- Schedule labelling review with QA before Notified Body submission.",
        "",
        "_Demo output generated offline by the Gepromed AI Console. Not regulatory advice._",
      ].join("\n");
    },
  },
  {
    id: "clinical-eval-summary",
    name: "Clinical Evaluation Literature Summary",
    summary:
      "Turns a batch of study abstracts into a structured clinical evidence summary with a benefit/risk narrative.",
    category: "Clinical & Quality",
    icon: "activity",
    tags: ["CER", "Literature", "Benefit-risk", "MEDDEV"],
    owner: "Clinical Affairs",
    model: "Gepromed Clin-LLM (demo)",
    status: "Live",
    runsThisMonth: 28,
    avgMinutesSaved: 70,
    systemPrompt:
      "You are a clinical affairs expert at Gepromed. Given a device/therapy and pasted study abstracts or findings, synthesize them into a structured clinical evidence summary suitable for a Clinical Evaluation Report (CER) per MEDDEV 2.7/1 rev 4. Output GitHub-flavored Markdown with: evidence base (sources, pooled N, appraisal method), a synthesis table (Outcome | Finding | Confidence), a benefit-risk narrative, and identified gaps with PMCF pointers. Stay objective and evidence-grounded; do not overstate. End with a one-line note that clinician review is required.",
    inputs: [
      {
        name: "device",
        label: "Device / therapy",
        type: "text",
        sample: "Bioresorbable coronary scaffold",
      },
      {
        name: "abstracts",
        label: "Pasted abstracts / findings",
        type: "textarea",
        placeholder: "Paste 2–5 study abstracts or key findings…",
        sample:
          "Study A (n=210): non-inferior MACE vs metallic stent at 12 months. Study B (n=95): higher late lumen loss. Study C registry (n=1,400): 1.8% scaffold thrombosis at 24 months.",
      },
    ],
    demo: (v) => {
      const device = v.device || "the device";
      return [
        `## Clinical Evidence Summary — ${device}`,
        "",
        "### Evidence base",
        "- 3 sources appraised (2 RCTs, 1 registry). Total pooled N ≈ 1,705.",
        "- Appraisal method: MEDDEV 2.7/1 rev 4 weighting by data contribution & quality.",
        "",
        "### Synthesis",
        "| Outcome | Finding | Confidence |",
        "| --- | --- | --- |",
        "| Efficacy (MACE) | Non-inferior to comparator at 12 months | Moderate |",
        "| Late lumen loss | Numerically higher, clinically monitored | Moderate |",
        "| Safety (thrombosis) | 1.8% at 24 months — within expected range | Moderate |",
        "",
        "### Benefit–risk narrative",
        "Current evidence supports a **favourable benefit–risk profile** under the stated intended use, contingent on adherence to the implantation technique IFU. Residual uncertainty around long-term lumen loss should be addressed through **PMCF**.",
        "",
        "### Identified gaps",
        "- No data beyond 24 months → specify in PMCF plan.",
        "- Limited data in diabetic sub-population.",
        "",
        "_Demo output generated offline. Structured for CER Section 9/10 drafting._",
      ].join("\n");
    },
  },
  {
    id: "capa-drafter",
    name: "CAPA Investigation Drafter",
    summary:
      "Generates a structured Corrective & Preventive Action record from a complaint or nonconformity description.",
    category: "Clinical & Quality",
    icon: "clipboard-check",
    tags: ["CAPA", "ISO 13485", "Root cause", "QMS"],
    owner: "Quality Management",
    model: "Gepromed Clin-LLM (demo)",
    status: "Live",
    runsThisMonth: 51,
    avgMinutesSaved: 40,
    systemPrompt:
      "You are a quality management expert at Gepromed working to ISO 13485:2016. Given a nonconformity or complaint description, draft a structured CAPA record. Output GitHub-flavored Markdown with numbered sections: Problem statement, Immediate containment, Root cause (include a brief 5-Why chain), Corrective actions, Preventive actions, and Effectiveness check. Reference ISO 13485 clauses (§8.5.2/§8.5.3) where relevant and consider vigilance/FSCA reportability. End with a one-line note to route to QA for approval.",
    inputs: [
      {
        name: "issue",
        label: "Nonconformity / complaint",
        type: "textarea",
        placeholder: "Describe what happened…",
        sample:
          "Three field complaints of packaging seal failure on Lot 24-118 detected on arrival; sterile barrier potentially compromised.",
      },
    ],
    demo: () =>
      [
        "## CAPA-2026-0142 — Draft",
        "",
        "**Source:** Field complaint cluster · **Standard:** ISO 13485:2016 §8.5.2 / §8.5.3",
        "",
        "### 1. Problem statement",
        "Packaging seal integrity failures reported on Lot 24-118 (3 units), risking sterile barrier compromise on a Class IIa device.",
        "",
        "### 2. Immediate containment",
        "- Quarantine remaining Lot 24-118 inventory.",
        "- Notify distribution partners; assess field stock.",
        "- Risk assessment for potential FSCA / vigilance reportability.",
        "",
        "### 3. Root cause (5-Why summary)",
        "Seal failure → inconsistent sealing temperature → sealer calibration drift → calibration interval too long → PM schedule not risk-based. **Root cause: preventive-maintenance interval inadequate.**",
        "",
        "### 4. Corrective actions",
        "- Recalibrate and re-validate the sealing process (IQ/OQ/PQ).",
        "- 100% seal inspection on affected and adjacent lots.",
        "",
        "### 5. Preventive actions",
        "- Move sealer PM to a risk-based interval with in-process seal-strength monitoring.",
        "- Update work instruction WI-PKG-07.",
        "",
        "### 6. Effectiveness check",
        "Zero seal nonconformities over next 5 production lots; review at 90 days.",
        "",
        "_Demo output generated offline. Route to QA lead for approval._",
      ].join("\n"),
  },
  {
    id: "grant-proposal",
    name: "Funding & Grant Proposal Assistant",
    summary:
      "Drafts a structured proposal section for medical-device innovation grants (Horizon Europe / regional funds).",
    category: "Project & Funding",
    icon: "sparkles",
    tags: ["Horizon Europe", "Funding", "Innovation", "Proposal"],
    owner: "Project Office",
    model: "Gepromed Reg-LLM (demo)",
    status: "Live",
    runsThisMonth: 17,
    avgMinutesSaved: 120,
    systemPrompt:
      "You are a grant-writing specialist for medical-device innovation at Gepromed. Given a project idea and a target funding call/programme (e.g. Horizon Europe), draft a compelling proposal section. Output GitHub-flavored Markdown structured as Excellence, Impact (clinical, economic, societal — with plausible quantified estimates), Implementation (work packages & timeline), and Consortium fit (Gepromed's regulatory/clinical role). Be persuasive but credible and grounded. End with a one-line note that this is an editable draft for grant writers.",
    inputs: [
      {
        name: "project",
        label: "Project idea",
        type: "textarea",
        placeholder: "Describe the innovation and its clinical need…",
        sample:
          "AI-assisted early detection of surgical site infection using a low-cost wearable temperature/impedance patch for post-op patients.",
      },
      {
        name: "call",
        label: "Target call / programme",
        type: "text",
        sample: "Horizon Europe — Cluster 1 Health, digital & data-driven care",
      },
    ],
    demo: (v) => {
      const call = v.call || "the targeted programme";
      return [
        `## Proposal draft — Impact section (for ${call})`,
        "",
        "### Excellence",
        "The project advances the state of the art by combining a low-cost wearable sensing patch with an explainable AI model for early surgical-site-infection (SSI) detection, addressing a well-documented gap in post-discharge monitoring.",
        "",
        "### Impact",
        "- **Clinical:** earlier SSI detection → reduced readmissions (SSI affects ~2–5% of surgical patients).",
        "- **Economic:** each avoided readmission saves an estimated €7–12k to health systems.",
        "- **Societal:** supports remote follow-up and equitable post-op care.",
        "",
        "### Implementation",
        "18-month work plan across 4 work packages: (WP1) sensor integration, (WP2) model development & validation, (WP3) clinical pilot, (WP4) regulatory pathway & dissemination. Gepromed leads WP4 (MDR strategy, clinical evaluation).",
        "",
        "### Consortium fit",
        "Gepromed contributes regulatory, clinical-evaluation and medical-device engineering expertise, de-risking the route to CE marking.",
        "",
        "_Demo output generated offline. Editable draft for grant writers._",
      ].join("\n");
    },
  },
  {
    id: "vigilance-triage",
    name: "Vigilance & Incident Triage",
    summary:
      "Classifies an incident report for reportability and drafts a manufacturer incident summary.",
    category: "Regulatory & Compliance",
    icon: "alert-triangle",
    tags: ["Vigilance", "MIR", "Reportability", "Post-market"],
    owner: "Regulatory Affairs",
    model: "Gepromed Reg-LLM (demo)",
    status: "Beta",
    runsThisMonth: 23,
    avgMinutesSaved: 35,
    systemPrompt:
      "You are a vigilance and post-market surveillance expert at Gepromed. Given an incident description, classify it and assess reportability under EU MDR Article 87. Output GitHub-flavored Markdown with: Classification (event type, harm level), a Reportability decision with reasoning and applicable timelines (2/10/15-day), Recommended actions, and a short draft manufacturer incident (MIR) summary as a blockquote. Be cautious; explicitly flag where qualified RA sign-off is needed. End with a one-line disclaimer that the final reportability decision requires qualified RA review.",
    inputs: [
      {
        name: "incident",
        label: "Incident description",
        type: "textarea",
        placeholder: "What happened, to whom, and what was the outcome?",
        sample:
          "Infusion pump displayed occlusion alarm delay of ~40s during a home-care session; no patient harm, therapy paused by caregiver.",
      },
    ],
    demo: () =>
      [
        "## Vigilance Triage — Result",
        "",
        "### Classification",
        "- **Event type:** Device malfunction (alarm latency).",
        "- **Harm:** None reported (near-miss).",
        "- **Reportability (EU MDR Art. 87):** *Potentially reportable* — malfunction that, were it to recur, **might lead to** serious deterioration in health. Recommend serious-incident assessment.",
        "",
        "### Recommended action",
        "- Log in complaint-handling system within 24h.",
        "- Perform reportability decision with RA sign-off (2-day / 10-day / 15-day timelines).",
        "- Open trend check: is alarm latency recurring across the fleet?",
        "",
        "### Draft MIR summary",
        "> A user reported delayed occlusion-alarm activation (~40s) on an infusion pump during home care. Therapy was paused by the caregiver; no patient harm occurred. Manufacturer is assessing whether the latency constitutes a reportable serious incident and is reviewing fleet trend data.",
        "",
        "_Demo output generated offline. Final reportability decision requires qualified RA review._",
      ].join("\n"),
  },
  {
    id: "patient-comm",
    name: "Plain-Language Patient Communication",
    summary:
      "Rewrites clinical or technical text into clear, reassuring patient-facing language (with reading-level target).",
    category: "Communication",
    icon: "message-square",
    tags: ["Health literacy", "IFU", "Patient", "Plain language"],
    owner: "Medical Communication",
    model: "Gepromed Clin-LLM (demo)",
    status: "Live",
    runsThisMonth: 64,
    avgMinutesSaved: 25,
    systemPrompt:
      "You are a health-literacy and medical communication expert at Gepromed. Rewrite the provided clinical or technical text into clear, reassuring, patient-facing plain language at roughly a grade 7 reading level. Output GitHub-flavored Markdown: a short 'What to do' explanation, then a bulleted 'Please remember' list of practical instructions. Keep it warm and non-alarming without losing accuracy; do NOT add any medical claim not present in the source. End with a one-line note to review with a clinician before patient use.",
    inputs: [
      {
        name: "text",
        label: "Clinical text to simplify",
        type: "textarea",
        placeholder: "Paste the technical text…",
        sample:
          "Following implantation, patients should undergo dual antiplatelet therapy for a minimum of 6 months to mitigate the risk of scaffold thrombosis.",
      },
    ],
    demo: () =>
      [
        "## Plain-language version (target: ~grade 7 reading level)",
        "",
        "**What to do after your procedure:**",
        "",
        "For at least 6 months, you'll need to take two medicines that help stop blood clots from forming. This is important because it lowers the chance of a clot developing where your device was placed.",
        "",
        "**Please remember:**",
        "- Take both medicines every day, exactly as your doctor tells you.",
        "- Don't stop them on your own — even if you feel fine.",
        "- If you have any bleeding that won't stop, contact your care team.",
        "",
        "_Demo output generated offline. Review with a clinician before patient use._",
      ].join("\n"),
  },
  {
    id: "meeting-actions",
    name: "Meeting Notes → Action Tracker",
    summary:
      "Converts raw meeting notes into a clean summary, decisions log, and assigned action items.",
    category: "Operations",
    icon: "list-checks",
    tags: ["Meetings", "Actions", "Productivity"],
    owner: "Project Office",
    model: "Gepromed Ops-LLM (demo)",
    status: "Live",
    runsThisMonth: 88,
    avgMinutesSaved: 20,
    systemPrompt:
      "You are an executive assistant for Gepromed's project office. Convert raw meeting notes into a clean structured record. Output GitHub-flavored Markdown with: a one-line topic, Decisions (bulleted), Action items as a table (Owner | Action | Due), and Blockers. Infer owners and due dates ONLY from the notes provided; never invent commitments. End with a one-line note.",
    inputs: [
      {
        name: "notes",
        label: "Raw meeting notes",
        type: "textarea",
        placeholder: "Paste your notes…",
        sample:
          "Reviewed NeoDerm timeline. CER still blocking. Camille to commission CER by 15/07. Étienne wants NB pre-submission call. Budget for pilot approved. Labelling review next week.",
      },
    ],
    demo: () =>
      [
        "## Meeting Summary",
        "",
        "**Topic:** NeoDerm project review",
        "",
        "### Decisions",
        "- Pilot budget **approved**.",
        "- Proceed with Notified Body pre-submission call.",
        "",
        "### Action items",
        "| Owner | Action | Due |",
        "| --- | --- | --- |",
        "| Camille | Commission the Clinical Evaluation Report (CER) | 15 Jul |",
        "| Étienne | Schedule NB pre-submission call | This week |",
        "| QA team | Labelling review | Next week |",
        "",
        "### Blockers",
        "- CER is on the critical path for the NB submission.",
        "",
        "_Demo output generated offline. Export to your task tool of choice._",
      ].join("\n"),
  },
  {
    id: "training-generator",
    name: "Micro-Training Generator",
    summary:
      "Creates a short internal training module (objectives, script, and a quick quiz) on any compliance topic.",
    category: "Training & Enablement",
    icon: "graduation-cap",
    tags: ["Training", "LMS", "Enablement", "Quiz"],
    owner: "People & Enablement",
    model: "Gepromed Ops-LLM (demo)",
    status: "Beta",
    runsThisMonth: 31,
    avgMinutesSaved: 60,
    systemPrompt:
      "You are an instructional designer at Gepromed. Given a training topic and audience, create a short (~8 minute) internal micro-training. Output GitHub-flavored Markdown with: a title plus an audience/duration line, 3 Learning objectives, a Script excerpt as a blockquote, and a 3-question Quick quiz with the answer in parentheses after each question. Keep it practical and compliance-oriented. End with a one-line note that it can be published to the LMS.",
    inputs: [
      {
        name: "topic",
        label: "Training topic",
        type: "text",
        sample: "How to log a product complaint correctly",
      },
      {
        name: "audience",
        label: "Audience",
        type: "select",
        options: ["Customer support", "Sales", "Production", "All staff"],
        sample: "Customer support",
      },
    ],
    demo: (v) => {
      const topic = v.topic || "the selected topic";
      const audience = v.audience || "the target team";
      return [
        `## Micro-training: ${topic}`,
        `**Audience:** ${audience} · **Duration:** ~8 minutes`,
        "",
        "### Learning objectives",
        "1. Recognise what qualifies as a reportable product complaint.",
        "2. Capture the mandatory data fields at first contact.",
        "3. Route the complaint to QA within the required timeframe.",
        "",
        "### Script (excerpt)",
        "> Every complaint is a signal. When a customer reports a problem, your job isn't to solve the device issue — it's to capture it accurately and fast. Record who, what, when, the lot number, and whether anyone was harmed…",
        "",
        "### Quick quiz",
        "1. A customer says a dressing 'felt different' but works fine. Is this a complaint? *(Yes — log it; trends matter.)*",
        "2. Which field is mandatory for traceability? *(Lot/batch number.)*",
        "3. What's the first question if harm is possible? *(Was anyone injured? → escalate immediately.)*",
        "",
        "_Demo output generated offline. One click from here → **LMS Handoff** (mock) to publish._",
      ].join("\n");
    },
  },
];

export function getSkill(id: string): Skill | undefined {
  return skills.find((s) => s.id === id);
}
