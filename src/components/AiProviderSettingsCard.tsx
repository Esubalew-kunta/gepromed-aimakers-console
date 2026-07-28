"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

interface ProviderStatus {
  configured: boolean;
  overridden: boolean;
  masked: string | null;
  model: string | null;
  envKeySet: boolean;
}

interface SettingsResponse {
  anthropic: ProviderStatus;
  openai: ProviderStatus;
  updatedAt: string | null;
}

/**
 * Admin-only card on the Expenses page: paste/rotate the Anthropic and
 * OpenAI API keys used for receipt extraction, stored in Supabase so a
 * rotated key takes effect immediately with no redeploy. Keys are never
 * echoed back — only a masked preview ("sk-proj-••••8Aye") once saved.
 */
export function AiProviderSettingsCard() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/expenses/ai-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  const anyIssue = !data.anthropic.configured && !data.openai.configured;

  return (
    <div className="card mb-6 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              anyIssue ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <Icon name="key" className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-ink-900">AI provider keys</p>
            <p className="text-xs text-ink-400">
              {anyIssue
                ? "No working key — receipt extraction will skip every file."
                : `Anthropic ${data.anthropic.configured ? "✓" : "—"} · OpenAI ${data.openai.configured ? "✓" : "—"}`}
            </p>
          </div>
        </div>
        <Icon
          name="chevron-down"
          className={`h-4 w-4 text-ink-300 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-ink-100 px-5 py-4">
          <ProviderRow
            label="Anthropic (Claude)"
            provider="anthropic"
            status={data.anthropic}
            onSaved={setData}
          />
          <div className="my-4 border-t border-ink-100" />
          <ProviderRow label="OpenAI (GPT-4o)" provider="openai" status={data.openai} onSaved={setData} />
          <p className="mt-4 text-xs text-ink-400">
            Keys are stored in the database and used immediately — no redeploy
            needed. Leave a field as-is to keep the current key; save an empty
            field to fall back to the server&apos;s default configuration.
          </p>
        </div>
      )}
    </div>
  );
}

function ProviderRow({
  label,
  provider,
  status,
  onSaved,
}: {
  label: string;
  provider: "anthropic" | "openai";
  status: ProviderStatus;
  onSaved: (data: SettingsResponse) => void;
}) {
  const [key, setKey] = useState("");
  const [model, setModel] = useState(status.model ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keyField = provider === "anthropic" ? "anthropicApiKey" : "openaiApiKey";
  const modelField = provider === "anthropic" ? "anthropicModel" : "openaiModel";

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/expenses/ai-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [keyField]: key, [modelField]: model }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Save failed.");
      const refreshed = await fetch("/api/expenses/ai-settings").then((r) => r.json());
      onSaved(refreshed);
      setKey("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-800">{label}</p>
        <span
          className={`badge ${
            status.configured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {status.configured ? "Working" : "Not configured"}
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-400">
        {status.overridden
          ? `Console override: ${status.masked}`
          : status.envKeySet
            ? "Using the server's default key (.env)."
            : "No key set anywhere."}
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={status.overridden ? "Paste a new key to replace it…" : "Paste API key…"}
          className="input"
        />
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Model (optional)"
          className="input sm:w-40"
        />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary !py-1.5 !text-xs disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-xs font-medium text-emerald-600">Saved ✓</span>}
        {error && <span className="text-xs font-medium text-red-600">{error}</span>}
      </div>
    </div>
  );
}
