import type { TrainingModule } from "@/lib/types";

export const trainingModules: TrainingModule[] = [
  {
    id: "t1",
    title: "Getting started with the Gepromed AI Console",
    description:
      "A guided tour of skills, automations and the LMS handoff — everything a new user needs in one sitting.",
    format: "Guide",
    duration: "15 min",
    level: "Intro",
    audience: "All staff",
    lessons: [
      "What the console can (and cannot) do",
      "Running your first skill",
      "Reading and reusing outputs",
      "Where your data goes (demo vs. production)",
    ],
  },
  {
    id: "t2",
    title: "Prompting for regulatory tasks",
    description:
      "How to give the regulatory skills the right context for MDR gap analysis and vigilance triage.",
    format: "Workshop",
    duration: "45 min",
    level: "Core",
    audience: "Regulatory Affairs",
    lessons: [
      "Anatomy of a good input",
      "Providing documentation summaries",
      "Interpreting gap analyses",
      "Human-in-the-loop sign-off",
    ],
  },
  {
    id: "t3",
    title: "From complaint to CAPA",
    description:
      "Use the CAPA drafter and complaint-intake automation together, safely.",
    format: "Playbook",
    duration: "30 min",
    level: "Core",
    audience: "Quality Management",
    lessons: [
      "Capturing complaints correctly",
      "Generating a CAPA draft",
      "Root-cause discipline (5-Why)",
      "Effectiveness checks",
    ],
  },
  {
    id: "t4",
    title: "Clinical evaluation with AI assistance",
    description:
      "Summarise literature and build benefit-risk narratives that map to MEDDEV 2.7/1.",
    format: "Video",
    duration: "22 min",
    level: "Advanced",
    audience: "Clinical Affairs",
    lessons: [
      "Appraising evidence quality",
      "Structuring the synthesis",
      "Writing the benefit-risk narrative",
      "Flagging PMCF gaps",
    ],
  },
  {
    id: "t5",
    title: "Responsible AI & data handling",
    description:
      "What to share, what to keep out, and how the console keeps humans accountable.",
    format: "Guide",
    duration: "18 min",
    level: "Intro",
    audience: "All staff",
    lessons: [
      "Personal & patient data — the golden rules",
      "Why outputs are drafts, not decisions",
      "Bias, hallucination and verification",
      "Escalation and sign-off",
    ],
  },
  {
    id: "t6",
    title: "Building your own micro-trainings",
    description:
      "Generate a training module with AI and publish it via the LMS handoff.",
    format: "Workshop",
    duration: "40 min",
    level: "Core",
    audience: "People & Enablement",
    lessons: [
      "Defining learning objectives",
      "Generating a module",
      "Editing for tone and accuracy",
      "The LMS handoff (mock → live)",
    ],
  },
];
