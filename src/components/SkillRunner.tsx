"use client";

import { useActionState, useRef, useState } from "react";
import { runSkillAction, type RunState } from "@/app/(app)/skills/[id]/actions";
import { Icon } from "./Icon";
import { Markdown } from "./Markdown";
import { CopyButton } from "./CopyButton";
import { ExportMenu } from "./ExportMenu";

export interface RunnerField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: string[];
  sample: string;
}

export function SkillRunner({
  skillId,
  fields,
  title = "Skill output",
}: {
  skillId: string;
  fields: RunnerField[];
  title?: string;
}) {
  const [state, action, pending] = useActionState<RunState, FormData>(
    runSkillAction,
    {},
  );
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.name, ""])),
  );
  const outputRef = useRef<HTMLDivElement>(null);

  const fillSample = () =>
    setValues(Object.fromEntries(fields.map((f) => [f.name, f.sample])));

  const set = (name: string, val: string) =>
    setValues((v) => ({ ...v, [name]: val }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input */}
      <form action={action} className="card p-5">
        <input type="hidden" name="__skillId" value={skillId} />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink-900">Inputs</h2>
          <button
            type="button"
            onClick={fillSample}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Fill with sample
          </button>
        </div>

        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="label" htmlFor={f.name}>
                {f.label}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  id={f.name}
                  name={f.name}
                  rows={5}
                  className="input resize-y"
                  placeholder={f.placeholder}
                  value={values[f.name]}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : f.type === "select" ? (
                <select
                  id={f.name}
                  name={f.name}
                  className="input"
                  value={values[f.name]}
                  onChange={(e) => set(f.name, e.target.value)}
                >
                  <option value="">Select…</option>
                  {f.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={f.name}
                  name={f.name}
                  type="text"
                  className="input"
                  placeholder={f.placeholder}
                  value={values[f.name]}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        <button type="submit" className="btn-primary mt-5 w-full" disabled={pending}>
          {pending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Generating…
            </>
          ) : (
            <>
              <Icon name="play" className="h-4 w-4" /> Run skill
            </>
          )}
        </button>
        <p className="mt-2 text-center text-xs text-ink-400">
          Runs live via Claude when configured · falls back to an offline demo
        </p>
      </form>

      {/* Output */}
      <div className="card flex flex-col p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink-900">Output</h2>
          {state.output ? (
            <div className="flex items-center gap-2">
              <CopyButton text={state.output} />
              <ExportMenu
                markdown={state.output}
                title={title}
                getHtml={() => outputRef.current?.innerHTML ?? ""}
              />
            </div>
          ) : null}
        </div>

        {state.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        {!state.output && !pending && !state.error ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-50 text-ink-300">
              <Icon name="sparkles" className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm text-ink-400">
              Fill the inputs and run the skill to see a generated result.
            </p>
          </div>
        ) : null}

        {pending ? (
          <div className="flex-1 space-y-2 py-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-3 animate-pulse rounded bg-ink-100"
                style={{ width: `${90 - i * 8}%` }}
              />
            ))}
          </div>
        ) : null}

        {state.output ? (
          <>
            <div
              ref={outputRef}
              className="h-[460px] max-h-[70vh] min-h-[220px] resize-y overflow-auto rounded-xl border border-ink-100 bg-ink-50/40 p-4"
            >
              <Markdown content={state.output} />
            </div>
            <p className="mt-1.5 text-center text-[11px] text-ink-300">
              Drag the bottom-right corner to resize · scroll for more
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-ink-400">
              <span className="badge bg-emerald-50 text-emerald-700">
                <Icon name="check" className="h-3.5 w-3.5" />{" "}
                {state.usedLiveModel ? "Generated by Claude" : "Generated offline"}
              </span>
              {typeof state.minutesSaved === "number" ? (
                <span>~{state.minutesSaved} min saved vs. manual</span>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
