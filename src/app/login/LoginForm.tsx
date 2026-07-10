"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "./actions";

interface DemoCred {
  label: string;
  email: string;
  password: string;
  role: string;
}

export function LoginForm({
  from,
  creds,
}: {
  from: string;
  creds: DemoCred[];
}) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );
  const [email, setEmail] = useState(creds[1]?.email ?? "");
  const [password, setPassword] = useState(creds[1]?.password ?? "");

  return (
    <div className="w-full">
      <form action={action} className="space-y-4">
        <input type="hidden" name="from" value={from} />
        <div>
          <label className="label" htmlFor="email">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gepromed.com"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {state.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in to the AI Console"}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-ink-200 bg-ink-50 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
          Demo credentials, click to fill
        </p>
        <div className="space-y-1.5">
          {creds.map((c) => (
            <button
              key={c.email}
              type="button"
              onClick={() => {
                setEmail(c.email);
                setPassword(c.password);
              }}
              className="flex w-full items-center justify-between rounded-lg border border-transparent bg-white px-3 py-2 text-left text-sm transition hover:border-brand-200 hover:bg-brand-50"
            >
              <span>
                <span className="font-medium text-ink-900">{c.email}</span>
                <span className="ml-2 text-ink-400">/ {c.password}</span>
              </span>
              <span className="badge bg-brand-100 text-brand-700">{c.role}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
