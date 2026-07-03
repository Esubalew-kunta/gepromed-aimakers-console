export type Category =
  | "Regulatory & Compliance"
  | "Clinical & Quality"
  | "Project & Funding"
  | "Communication"
  | "Training & Enablement"
  | "Operations";

export interface SkillField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: string[];
  sample: string;
}

export interface Skill {
  id: string;
  name: string;
  summary: string;
  category: Category;
  icon: string;
  tags: string[];
  owner: string;
  model: string;
  status: "Live" | "Beta" | "Planned";
  runsThisMonth: number;
  avgMinutesSaved: number;
  inputs: SkillField[];
  /**
   * System prompt sent to Claude when a live ANTHROPIC_API_KEY is configured.
   * Optional so DB-loaded skills without one still type-check.
   */
  systemPrompt?: string;
  /** Deterministic offline mock — used as the fallback when no live key is set. */
  demo: (values: Record<string, string>) => string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  schedule: string;
  status: "Active" | "Paused" | "Draft";
  lastRun: string;
  runsThisMonth: number;
  steps: string[];
  /** Deterministic mock run log lines. */
  simulate: () => { line: string; kind: "info" | "ok" | "warn" }[];
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "Connected (mock)" | "Manual" | "Planned" | "Available";
  icon: string;
  detail: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  quarter: string;
  status: "Shipped" | "In progress" | "Next" | "Exploring";
  category: Category;
  impact: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  format: "Video" | "Guide" | "Workshop" | "Playbook";
  duration: string;
  level: "Intro" | "Core" | "Advanced";
  audience: string;
  lessons: string[];
}

export interface DashboardMetric {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  hint: string;
}

export interface ActivityItem {
  actor: string;
  action: string;
  target: string;
  when: string;
}
