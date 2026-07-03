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
    action: "published",
    target: "Micro-training → LMS (mock handoff)",
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
    body: "See a regulatory skill produce a structured technical-file review in seconds — no API needed.",
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
    title: "Try the LMS Handoff",
    body: "Generate a micro-training and hand it off to a mock LMS in one click.",
    href: "/lms",
    cta: "Open LMS handoff",
  },
];
