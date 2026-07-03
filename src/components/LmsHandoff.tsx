"use client";

import { useActionState, useState } from "react";
import {
  generateModuleAction,
  publishToLmsAction,
  type LmsState,
} from "@/app/(app)/lms/actions";
import { Icon } from "./Icon";
import { Markdown } from "./Markdown";
import { CopyButton } from "./CopyButton";

const AUDIENCES = ["Customer support", "Sales", "Production", "All staff"];

export function LmsHandoff() {
  const [topic, setTopic] = useState("How to log a product complaint correctly");
  const [audience, setAudience] = useState("Customer support");

  const [genState, generate, generating] = useActionState<LmsState, FormData>(
    generateModuleAction,
    {},
  );
  const [pubState, publish, publishing] = useActionState<LmsState, FormData>(
    publishToLmsAction,
    {},
  );

  const module = pubState.module || genState.module;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Step 1 — generate */}
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
            1
          </span>
          <h2 className="font-semibold text-ink-900">Generate a micro-training</h2>
        </div>

        <form action={generate} className="space-y-4">
          <div>
            <label className="label" htmlFor="topic">
              Training topic
            </label>
            <input
              id="topic"
              name="topic"
              className="input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="audience">
              Audience
            </label>
            <select
              id="audience"
              name="audience"
              className="input"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            >
              {AUDIENCES.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary w-full" disabled={generating}>
            {generating ? "Generating…" : "Generate module"}
          </button>
        </form>

        {genState.error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {genState.error}
          </p>
        ) : null}

        {module ? (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Generated module
              </p>
              <CopyButton text={module} />
            </div>
            <div className="max-h-80 overflow-auto rounded-xl border border-ink-100 bg-ink-50/40 p-4">
              <Markdown content={module} />
            </div>
          </div>
        ) : null}
      </div>

      {/* Step 2 — publish */}
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white ${
              module ? "bg-brand-600" : "bg-ink-300"
            }`}
          >
            2
          </span>
          <h2 className="font-semibold text-ink-900">Hand off to the LMS (mock)</h2>
        </div>

        {!module ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-50 text-ink-300">
              <Icon name="graduation-cap" className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm text-ink-400">
              Generate a module first, then publish it here.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-500">
              This builds the exact enrolment payload that would be sent to your
              LMS. In the demo, nothing is sent — set{" "}
              <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">
                LMS_API_URL
              </code>{" "}
              /{" "}
              <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">
                LMS_API_KEY
              </code>{" "}
              to enable live publishing later.
            </p>

            <form action={publish} className="mt-4">
              <input type="hidden" name="topic" value={topic} />
              <input type="hidden" name="audience" value={audience} />
              <input type="hidden" name="module" value={module} />
              <button className="btn-primary w-full" disabled={publishing}>
                {publishing ? "Publishing…" : "Publish to LMS (mock)"}
              </button>
            </form>

            {pubState.step === "published" ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <Icon name="check" className="h-4 w-4" />
                  Published (mock) · course{" "}
                  <span className="font-semibold">{pubState.courseId}</span>{" "}
                  created &amp; audience enrolled.
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                      Payload (not sent)
                    </p>
                    {pubState.payload ? (
                      <CopyButton text={pubState.payload} label="Copy JSON" />
                    ) : null}
                  </div>
                  <pre className="max-h-64 overflow-auto rounded-xl bg-ink-900 p-4 text-xs leading-relaxed text-ink-100">
                    {pubState.payload}
                  </pre>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
