import type { Integration } from "@/lib/types";

/**
 * Integrations shown with honest DEMO statuses. Nothing here calls a
 * real API, statuses are "Connected (mock)", "Manual", "Planned", or
 * "Available" so the demo is transparent about what is simulated.
 */
export const integrations: Integration[] = [
  {
    id: "openai",
    name: "OpenAI / LLM provider",
    category: "AI models",
    description: "Large language model backend for skill generation.",
    status: "Manual",
    icon: "sparkles",
    detail:
      "In this demo the console uses built-in offline templates (Gepromed demo models). Add OPENAI_API_KEY later to route skills to a live model, the app runs fully without it.",
  },
  {
    id: "gmail",
    name: "Gmail / Email inbox",
    category: "Communication",
    description: "Source for the complaint-intake automation.",
    status: "Planned",
    icon: "mail",
    detail:
      "Connector stubbed with mock messages. Provide GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET to enable real inbox polling in a future phase.",
  },
  {
    id: "lms",
    name: "Learning Management System",
    category: "Training",
    description: "Publishes generated micro-trainings to staff.",
    status: "Manual",
    icon: "graduation-cap",
    detail:
      "LMS Handoff is demonstrated with a mock payload and export. Set LMS_API_URL / LMS_API_KEY to push enrolments to a real LMS.",
  },
  {
    id: "n8n",
    name: "n8n Automation Engine",
    category: "Automation",
    description: "Orchestrates event-driven and scheduled automations.",
    status: "Manual",
    icon: "workflow",
    detail:
      "Automations run as deterministic local simulations in the demo. N8N_WEBHOOK_SECRET wires the same steps to a live n8n instance later.",
  },
  {
    id: "notion",
    name: "Notion Workspace",
    category: "Knowledge",
    description: "Stores procedures, templates and the CER knowledge base.",
    status: "Planned",
    icon: "book",
    detail: "Read-only knowledge sync planned. Not required for the demo.",
  },
  {
    id: "google",
    name: "Google Workspace SSO",
    category: "Identity",
    description: "Single sign-on for staff.",
    status: "Planned",
    icon: "key",
    detail:
      "Demo uses seeded credential login. GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET enable SSO in production.",
  },
  {
    id: "postgres",
    name: "PostgreSQL Database",
    category: "Data",
    description: "Durable storage for run history and feedback.",
    status: "Available",
    icon: "database",
    detail:
      "Demo keeps run history in memory (resets on restart). Attach a Render PostgreSQL and set DATABASE_URL to persist, see README.",
  },
  {
    id: "slack",
    name: "Slack / Teams alerts",
    category: "Communication",
    description: "Delivers automation notifications to channels.",
    status: "Connected (mock)",
    icon: "message-square",
    detail:
      "Notifications are printed to the automation run log in the demo instead of being posted to a real channel.",
  },
];
