"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  uploadTemplate,
  setDefaultTemplate,
  deleteTemplate,
  type ContractFormState,
} from "@/app/(app)/contracts/actions";
import type { ContractTemplate } from "@/lib/contracts-shared";

export function ContractTemplates({
  templates,
  publicBase,
}: {
  templates: ContractTemplate[];
  publicBase: string | null;
}) {
  const [state, action, pending] = useActionState<ContractFormState, FormData>(
    uploadTemplate,
    {},
  );
  const [busy, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div className="space-y-6">
      {/* Upload */}
      <form action={action} className="card space-y-4 p-6">
        <h2 className="text-sm font-semibold text-ink-900">Add a contract template</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input name="name" required className="input" placeholder="Contrat d'engagement standard" />
          </div>
          <div>
            <label className="label">File (PDF)</label>
            <input
              type="file"
              name="file"
              accept="application/pdf,image/*"
              required
              className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input type="checkbox" name="is_default" className="h-4 w-4" /> Set as the global default
        </label>
        {state.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        ) : null}
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Uploading…" : "Upload template"}
        </button>
      </form>

      {/* List */}
      <div className={`card overflow-hidden ${busy ? "opacity-60" : ""}`}>
        {templates.length === 0 ? (
          <p className="p-8 text-center text-ink-400">
            No templates yet. Upload the engagement contract above.
          </p>
        ) : (
          templates.map((t, i) => (
            <div
              key={t.id}
              className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 ${
                i > 0 ? "border-t border-ink-100" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink-900">{t.name}</span>
                  {t.is_default ? (
                    <span className="badge bg-brand-50 text-brand-700">Default</span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {publicBase && t.file_url ? (
                  <a
                    href={`${publicBase}/storage/v1/object/public/contracts/${t.file_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost !py-1.5 !text-xs"
                  >
                    View
                  </a>
                ) : null}
                {!t.is_default ? (
                  <button
                    onClick={() => run(() => setDefaultTemplate(t.id))}
                    className="btn-ghost !py-1.5 !text-xs"
                  >
                    Make default
                  </button>
                ) : null}
                <button
                  onClick={() => {
                    if (confirm(`Remove "${t.name}"?`)) run(() => deleteTemplate(t.id));
                  }}
                  className="rounded-lg px-2 py-1.5 text-xs text-red-500 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
