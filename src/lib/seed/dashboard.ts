import type { ActivityItem, DashboardMetric } from "@/lib/types";

export const metrics: DashboardMetric[] = [
  {
    label: "Skill runs this month",
    value: "344",
    change: "+18%",
    positive: true,
    hint: "Across 8 live skills",
  },
  {
    label: "Est. hours saved",
    value: "412 h",
    change: "+24%",
    positive: true,
    hint: "Based on avg. minutes-saved per skill",
  },
  {
    label: "Active automations",
    value: "3 / 5",
    change: "2 in draft/paused",
    positive: true,
    hint: "Complaint intake, PMS digest, literature watch",
  },
  {
    label: "Open quality flags",
    value: "2",
    change: "-3",
    positive: true,
    hint: "Seal-integrity cluster under review",
  },
];

export const activity: ActivityItem[] = [
  {
    actor: "Camille Roussel",
    action: "ran",
    target: "MDR Technical File Gap Analysis · NeoDerm",
    when: "12 min ago",
  },
  {
    actor: "Automation",
    action: "filed",
    target: "Draft complaint CMP-2026-0311 (Lot 24-118)",
    when: "12 min ago",
  },
  {
    actor: "Étienne Marchand",
    action: "approved",
    target: "CAPA-2026-0142",
    when: "1 h ago",
  },
  {
    actor: "CER Literature Watch",
    action: "flagged",
    target: "2 high-relevance references · bioresorbable scaffold",
    when: "6 h ago",
  },
  {
    actor: "Camille Roussel",
    action: "generated",
    target: "Programme Qualiopi : Bootcamp vasculaire",
    when: "Yesterday",
  },
  {
    actor: "PMS Digest",
    action: "generated",
    target: "Weekly post-market surveillance digest",
    when: "3 days ago",
  },
];

export const quickStart = [
  {
    title: "Run the MDR Gap Analysis",
    body: "See a regulatory skill produce a structured technical-file review in seconds, no API needed.",
    href: "/skills/mdr-gap-analysis",
    cta: "Open skill",
  },
  {
    title: "Fire the Complaint Intake automation",
    body: "Watch a mock event-driven workflow classify a complaint and file it for QA.",
    href: "/automations",
    cta: "View automations",
  },
  {
    title: "Track engineering requests",
    body: "Follow explant analysis, testing and equipment rental requests through their pipelines.",
    href: "/engineering",
    cta: "Open engineering",
  },
];

export type EditorialItem = {
  date: string;
  channel: "LinkedIn" | "Blog" | "Newsletter" | "Congrès";
  title: string;
  status: "planned" | "draft" | "scheduled" | "published";
};

export const editorialCalendar: EditorialItem[] = [
  { date: "2026-07-14", channel: "LinkedIn", title: "Retour sur le Bootcamp vasculaire de mars", status: "scheduled" },
  { date: "2026-07-16", channel: "Blog", title: "Analyse d'explants : ce que révèlent 1 800 dispositifs", status: "draft" },
  { date: "2026-07-21", channel: "Newsletter", title: "Programme des formations du 2e semestre", status: "planned" },
  { date: "2026-07-24", channel: "LinkedIn", title: "Plateforme de tests : essais ISO 7198 en images", status: "planned" },
  { date: "2026-09-03", channel: "Congrès", title: "ISVB 2026 : ouverture des inscriptions", status: "planned" },
];
