import type { Automation } from "@/lib/types";

/**
 * Mock automations. `simulate()` returns a deterministic run log so the
 * "Run now" button produces a believable trace with NO n8n webhook,
 * scheduler, or external service involved.
 */
export const automations: Automation[] = [
  {
    id: "complaint-intake",
    name: "Complaint Intake → QA Router",
    description:
      "Watches the shared support inbox, classifies incoming complaints, extracts lot numbers, and files a draft record for QA review.",
    trigger: "New email in support@gepromed",
    schedule: "Event-driven (mocked)",
    status: "Active",
    lastRun: "12 minutes ago",
    runsThisMonth: 214,
    steps: [
      "Poll inbox (mock connector)",
      "Classify: complaint vs. general enquiry",
      "Extract device, lot number, harm signal",
      "Create draft complaint record",
      "Notify QA channel",
    ],
    simulate: () => [
      { line: "▶ Trigger fired: 1 new message in support@gepromed (mock)", kind: "info" },
      { line: "Classifying message… → COMPLAINT (confidence 0.94)", kind: "ok" },
      { line: "Extracted: device=NeoDerm, lot=24-118, harm=none reported", kind: "ok" },
      { line: "Created draft complaint record CMP-2026-0311", kind: "ok" },
      { line: "Posted summary to #qa-triage (mock Slack)", kind: "ok" },
      { line: "✔ Automation complete, 0 external calls (demo mode)", kind: "info" },
    ],
  },
  {
    id: "pms-digest",
    name: "Weekly Post-Market Surveillance Digest",
    description:
      "Aggregates the week's complaints, vigilance triage results, and field feedback into a one-page PMS digest for the quality review meeting.",
    trigger: "Schedule",
    schedule: "Mondays 08:00 (mocked)",
    status: "Active",
    lastRun: "3 days ago",
    runsThisMonth: 4,
    steps: [
      "Collect week's complaint records",
      "Summarise vigilance triage outcomes",
      "Compute trend indicators",
      "Render one-page digest",
      "Email to quality committee",
    ],
    simulate: () => [
      { line: "▶ Scheduled run started (mock scheduler)", kind: "info" },
      { line: "Collected 9 complaint records, 2 vigilance triages", kind: "ok" },
      { line: "Trend check: seal-integrity cluster on Lot 24-118 ⚠", kind: "warn" },
      { line: "Rendered digest (1 page, PDF mock)", kind: "ok" },
      { line: "Queued email to quality-committee@gepromed (mock)", kind: "ok" },
      { line: "✔ Digest ready, see Dashboard activity", kind: "info" },
    ],
  },
  {
    id: "cer-literature-watch",
    name: "CER Literature Watch",
    description:
      "Monitors selected journals/keywords for new evidence relevant to active clinical evaluations and flags anything requiring a CER update.",
    trigger: "Schedule",
    schedule: "Daily 06:00 (mocked)",
    status: "Active",
    lastRun: "Today, 06:00",
    runsThisMonth: 30,
    steps: [
      "Query saved literature searches (mock)",
      "Deduplicate against known references",
      "Score relevance to active CERs",
      "Flag high-relevance hits",
    ],
    simulate: () => [
      { line: "▶ Daily literature watch started (mock source)", kind: "info" },
      { line: "Fetched 18 candidate references", kind: "ok" },
      { line: "12 duplicates removed", kind: "info" },
      { line: "2 high-relevance hits flagged for bioresorbable scaffold CER", kind: "warn" },
      { line: "✔ Flags added to Clinical review queue", kind: "info" },
    ],
  },
  {
    id: "onboarding-training",
    name: "New-Hire Compliance Onboarding",
    description:
      "When a new employee is added, auto-enrols them in the required compliance micro-trainings and tracks completion.",
    trigger: "New employee record",
    schedule: "Event-driven (mocked)",
    status: "Paused",
    lastRun: "9 days ago",
    runsThisMonth: 3,
    steps: [
      "Detect new employee (mock HRIS)",
      "Map role → required trainings",
      "Enrol in LMS (mock handoff)",
      "Schedule reminders",
    ],
    simulate: () => [
      { line: "▶ New employee detected: role=Customer Support (mock)", kind: "info" },
      { line: "Mapped 3 required modules for role", kind: "ok" },
      { line: "LMS handoff (mock): enrolment payload prepared", kind: "ok" },
      { line: "⚠ Automation is PAUSED, enrolment not sent", kind: "warn" },
      { line: "Resume from Automations page to activate", kind: "info" },
    ],
  },
  {
    id: "nb-deadline-tracker",
    name: "Notified Body Deadline Tracker",
    description:
      "Tracks submission and response deadlines across active projects and nudges owners before due dates.",
    trigger: "Schedule",
    schedule: "Daily 07:30 (mocked)",
    status: "Draft",
    lastRun: "–",
    runsThisMonth: 0,
    steps: [
      "Read project milestones",
      "Compute days-to-deadline",
      "Draft reminder messages",
      "Send to owners",
    ],
    simulate: () => [
      { line: "▶ Dry run (automation is a DRAFT)", kind: "info" },
      { line: "Found 5 tracked milestones", kind: "ok" },
      { line: "2 deadlines within 7 days → reminders drafted", kind: "warn" },
      { line: "No messages sent (draft mode)", kind: "info" },
      { line: "✔ Dry run complete", kind: "info" },
    ],
  },
];

export function getAutomation(id: string): Automation | undefined {
  return automations.find((a) => a.id === id);
}
