"use client";

import { useState, useTransition } from "react";
import type { ContactMessage } from "@/lib/contacts-data";
import { markContactStatus, deleteContactMessage } from "@/app/(app)/contacts/actions";

const STATUS_STYLES: Record<ContactMessage["status"], string> = {
  new: "bg-brand-100 text-brand-700",
  read: "bg-ink-100 text-ink-600",
  archived: "bg-ink-50 text-ink-400",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ContactsList({ messages }: { messages: ContactMessage[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "new" | "archived">("all");

  const visible = messages.filter((m) => {
    if (filter === "all") return m.status !== "archived";
    if (filter === "new") return m.status === "new";
    return m.status === "archived";
  });

  if (messages.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-ink-400">
        No contact messages yet. Submissions from the website&apos;s Contact
        page will show up here.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 inline-flex items-center gap-0.5 rounded-full border border-ink-200 p-0.5 text-xs font-medium">
        {(["all", "new", "archived"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 capitalize transition ${
              filter === f
                ? "bg-brand-600 text-white"
                : "text-ink-500 hover:text-ink-900"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((m) => {
          const open = openId === m.id;
          return (
            <div key={m.id} className="card p-4">
              <button
                className="flex w-full items-start justify-between gap-3 text-left"
                onClick={() => {
                  setOpenId(open ? null : m.id);
                  if (m.status === "new") {
                    startTransition(() => markContactStatus(m.id, "read"));
                  }
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink-900">{m.name}</span>
                    <span className={`badge ${STATUS_STYLES[m.status]}`}>
                      {m.status}
                    </span>
                  </div>
                  <p className="truncate text-sm text-ink-500">
                    {m.subject || m.message}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-ink-400">
                  {m.ref && <p className="font-mono">{m.ref}</p>}
                  <p>{formatDate(m.created_at)}</p>
                </div>
              </button>

              {open && (
                <div className="mt-3 space-y-3 border-t border-ink-100 pt-3">
                  <p className="text-sm text-ink-500">
                    <a
                      href={`mailto:${m.email}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {m.email}
                    </a>
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-ink-700">
                    {m.message}
                  </p>
                  <div className="flex gap-2 pt-1">
                    {m.status !== "archived" ? (
                      <button
                        disabled={pending}
                        onClick={() =>
                          startTransition(() =>
                            markContactStatus(m.id, "archived"),
                          )
                        }
                        className="btn-ghost text-xs"
                      >
                        Archive
                      </button>
                    ) : (
                      <button
                        disabled={pending}
                        onClick={() =>
                          startTransition(() => markContactStatus(m.id, "read"))
                        }
                        className="btn-ghost text-xs"
                      >
                        Unarchive
                      </button>
                    )}
                    <button
                      disabled={pending}
                      onClick={() => {
                        if (confirm("Delete this message permanently?")) {
                          startTransition(() => deleteContactMessage(m.id));
                        }
                      }}
                      className="btn-ghost text-xs text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
