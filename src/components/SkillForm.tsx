"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveSkill,
  deleteSkill,
  type SkillFormState,
} from "@/app/(app)/skills/actions";
import type { Skill } from "@/lib/types";

const CATEGORIES = [
  "Regulatory & Compliance",
  "Clinical & Quality",
  "Project & Funding",
  "Communication",
  "Training & Enablement",
  "Operations",
];
const STATUSES = ["Live", "Beta", "Planned"];

export function SkillForm({ skill }: { skill?: Omit<Skill, "demo"> }) {
  const [state, action, pending] = useActionState<SkillFormState, FormData>(
    saveSkill,
    {},
  );
  const [deleting, startDelete] = useTransition();
  const router = useRouter();
  const editing = Boolean(skill);

  return (
    <form action={action} className="card space-y-5 p-6">
      {skill ? <input type="hidden" name="__key" value={skill.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name *">
          <input name="name" defaultValue={skill?.name} required className="input" />
        </Field>
        <Field label="Owner (team)">
          <input name="owner" defaultValue={skill?.owner} className="input" />
        </Field>
      </div>

      <Field label="Summary">
        <input name="description" defaultValue={skill?.summary} className="input" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Category">
          <select name="category" defaultValue={skill?.category} className="input">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={skill?.status ?? "Live"} className="input">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Model (display)">
          <input
            name="model"
            defaultValue={skill?.model ?? "Claude Sonnet 5"}
            className="input"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Icon" hint="shield-check · activity · clipboard-check · sparkles · alert-triangle · message-square · list-checks · graduation-cap · mail · users">
          <input
            name="icon"
            defaultValue={skill?.icon ?? "sparkles"}
            className="input"
          />
        </Field>
        <Field label="Tags (comma-separated)">
          <input
            name="tags"
            defaultValue={skill?.tags?.join(", ")}
            className="input"
          />
        </Field>
      </div>

      <Field label="System prompt *" hint="Sent to Claude as the system message.">
        <textarea
          name="system_prompt"
          defaultValue={skill?.systemPrompt}
          required
          rows={6}
          className="input resize-y"
        />
      </Field>

      <Field
        label="Inputs (JSON array)"
        hint='e.g. [{"name":"device","label":"Device","type":"text","sample":"..."}] · type = text | textarea | select (add "options":[...])'
      >
        <textarea
          name="inputs"
          defaultValue={JSON.stringify(skill?.inputs ?? [], null, 2)}
          rows={8}
          className="input resize-y font-mono text-xs"
        />
      </Field>

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : editing ? "Save changes" : "Create skill"}
        </button>
        {editing ? (
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (confirm(`Delete skill "${skill!.name}"? This cannot be undone.`)) {
                startDelete(() => deleteSkill(skill!.id).then(() => router.push("/skills")));
              }
            }}
            className="rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            {deleting ? "Deleting…" : "Delete skill"}
          </button>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-ink-400">{hint}</p> : null}
    </div>
  );
}
