"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  submitFeedbackAction,
  type FeedbackState,
} from "@/app/(app)/feedback/actions";

const AREAS = [
  "General",
  "Skills catalog",
  "Automations",
  "LMS handoff",
  "Integrations",
  "Roadmap",
];

const SENTIMENTS: { value: string; label: string; emoji: string }[] = [
  { value: "positive", label: "Love it", emoji: "😍" },
  { value: "neutral", label: "It's ok", emoji: "🙂" },
  { value: "negative", label: "Needs work", emoji: "🤔" },
];

export function FeedbackForm() {
  const [state, action, pending] = useActionState<FeedbackState, FormData>(
    submitFeedbackAction,
    {},
  );
  const [sentiment, setSentiment] = useState("positive");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="card p-5">
      <input type="hidden" name="sentiment" value={sentiment} />

      <div className="mb-4">
        <span className="label">How's the console?</span>
        <div className="flex gap-2">
          {SENTIMENTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSentiment(s.value)}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                sentiment === s.value
                  ? "border-brand-400 bg-brand-50 text-brand-700"
                  : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
              }`}
            >
              <span className="mr-1">{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="label" htmlFor="page">
          Area
        </label>
        <select id="page" name="page" className="input">
          {AREAS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="label" htmlFor="message">
          Your feedback
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="input resize-y"
          placeholder="What worked well? What would you change?"
        />
      </div>

      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Sending…" : "Send feedback"}
      </button>

      {state.ok ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Thanks! Your feedback was recorded for this demo session.
        </p>
      ) : null}
      {state.error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
