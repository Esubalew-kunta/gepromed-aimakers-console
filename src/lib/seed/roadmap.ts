import type { RoadmapItem } from "@/lib/types";

export const roadmap: RoadmapItem[] = [
  {
    id: "r1",
    title: "Skill catalog v1 (8 Gepromed skills)",
    description:
      "Regulatory, clinical, quality, funding and communication skills available with offline demo outputs.",
    quarter: "Q2 2026",
    status: "Shipped",
    category: "Regulatory & Compliance",
    impact: "Core value shown end-to-end without any external API.",
  },
  {
    id: "r2",
    title: "Mock automations & run logs",
    description:
      "Complaint intake, PMS digest and literature watch runnable as deterministic simulations.",
    quarter: "Q2 2026",
    status: "Shipped",
    category: "Operations",
    impact: "Demonstrates event-driven value before wiring n8n.",
  },
  {
    id: "r3",
    title: "LMS Handoff (mock)",
    description:
      "One-click export of generated micro-trainings to a mock LMS payload.",
    quarter: "Q2 2026",
    status: "Shipped",
    category: "Training & Enablement",
    impact: "Closes the loop from AI generation to enablement.",
  },
  {
    id: "r4",
    title: "Live LLM routing (OpenAI opt-in)",
    description:
      "Route selected skills to a real model when an API key is present, keeping offline fallbacks.",
    quarter: "Q3 2026",
    status: "In progress",
    category: "Clinical & Quality",
    impact: "Higher-quality generation without breaking the demo path.",
  },
  {
    id: "r5",
    title: "Persistent history (Render PostgreSQL)",
    description: "Durable run history and feedback via DATABASE_URL.",
    quarter: "Q3 2026",
    status: "Next",
    category: "Operations",
    impact: "History survives restarts; enables analytics.",
  },
  {
    id: "r6",
    title: "Real inbox & n8n connectors",
    description:
      "Gmail polling and live n8n orchestration behind the existing mock steps.",
    quarter: "Q3 2026",
    status: "Next",
    category: "Operations",
    impact: "Automations act on real data.",
  },
  {
    id: "r7",
    title: "Notified Body submission workspace",
    description:
      "Guided technical-file assembly with GSPR matrix and CER drafting.",
    quarter: "Q4 2026",
    status: "Exploring",
    category: "Regulatory & Compliance",
    impact: "Compresses the path to CE marking.",
  },
  {
    id: "r8",
    title: "Role-based analytics & audit trail",
    description:
      "Per-team dashboards, time-saved analytics, and a full audit log.",
    quarter: "Q4 2026",
    status: "Exploring",
    category: "Operations",
    impact: "Quantifies ROI for leadership.",
  },
];
