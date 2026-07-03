"use server";

import { getSessionUser } from "@/lib/auth";
import { getSkillByKey } from "@/lib/skills-data";
import { recordRun } from "@/lib/store";
import { isClaudeConfigured, runClaude } from "@/lib/claude";
import { supabaseServer } from "@/lib/supabase";
import type { Skill } from "@/lib/types";

export interface RunState {
  output?: string;
  minutesSaved?: number;
  usedLiveModel?: boolean;
  error?: string;
}

/** Render the user's field values into a readable prompt for Claude. */
function renderUserPrompt(skill: Skill, values: Record<string, string>): string {
  const body = skill.inputs
    .map((f) => `## ${f.label}\n${values[f.name] || "(not provided)"}`)
    .join("\n\n");
  return `Task: ${skill.name}\n\n${body}`;
}

export async function runSkillAction(
  _prev: RunState,
  formData: FormData,
): Promise<RunState> {
  const user = await getSessionUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const skillId = String(formData.get("__skillId") || "");
  const skill = await getSkillByKey(skillId);
  if (!skill) return { error: "Skill not found." };

  const values: Record<string, string> = {};
  for (const field of skill.inputs) {
    values[field.name] = String(formData.get(field.name) || "").trim();
  }

  // Live Claude when a key is configured; otherwise the deterministic offline
  // demo. Any API error falls back to the mock so the demo never dead-ends.
  let output: string;
  let usedLiveModel = false;
  if (isClaudeConfigured() && skill.systemPrompt) {
    try {
      output = await runClaude({
        system: skill.systemPrompt,
        user: renderUserPrompt(skill, values),
      });
      usedLiveModel = true;
    } catch {
      output = skill.demo(values);
    }
  } else {
    output = skill.demo(values);
  }

  // In-memory record (dashboard "your session" widget).
  recordRun({
    skillId: skill.id,
    skillName: skill.name,
    user: user.email,
    minutesSaved: skill.avgMinutesSaved,
  });

  // Persist to Supabase so "runs this month" is real + survives restarts.
  const sb = supabaseServer();
  if (sb) {
    try {
      await sb.from("skill_runs").insert({
        skill_key: skill.id,
        run_by: user.email,
        inputs: values,
        output,
      });
    } catch {
      // non-fatal — the run already succeeded
    }
  }

  return { output, minutesSaved: skill.avgMinutesSaved, usedLiveModel };
}
