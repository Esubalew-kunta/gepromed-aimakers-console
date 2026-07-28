"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { ContactMessage, ContactReply } from "@/lib/contacts-data";
import {
  markContactStatus,
  deleteContactMessage,
  sendContactReply,
  clearContactReplies,
  getContactReplies,
} from "@/app/(app)/contacts/actions";
import { Icon } from "./Icon";

const STATUS_DOT: Record<ContactMessage["status"], string> = {
  new: "bg-brand-500",
  read: "bg-ink-300",
  archived: "bg-ink-200",
};

const STATUS_BADGE: Record<ContactMessage["status"], string> = {
  new: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100",
  read: "bg-ink-100 text-ink-600",
  archived: "bg-ink-50 text-ink-400",
};

const AVATAR_HUES = [
  "from-brand-400 to-brand-600",
  "from-violet-400 to-violet-600",
  "from-emerald-400 to-emerald-600",
  "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600",
  "from-sky-400 to-sky-600",
];

function hueFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_HUES[h % AVATAR_HUES.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ContactsList({ messages }: { messages: ContactMessage[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "new" | "archived">("all");
  const [replyVersion, setReplyVersion] = useState(0);

  const counts = useMemo(
    () => ({
      total: messages.length,
      new: messages.filter((m) => m.status === "new").length,
      archived: messages.filter((m) => m.status === "archived").length,
    }),
    [messages],
  );

  // Keep the currently-open message visible even if it no longer matches the
  // active filter — e.g. opening a "New" message marks it read, which would
  // otherwise make it vanish out from under the user while they're reading it.
  const visible = messages.filter((m) => {
    if (m.id === openId) return true;
    if (filter === "all") return m.status !== "archived";
    if (filter === "new") return m.status === "new";
    return m.status === "archived";
  });

  if (messages.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 p-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          <Icon name="inbox" className="h-7 w-7" />
        </div>
        <div>
          <p className="font-semibold text-ink-900">No messages yet</p>
          <p className="mt-1 max-w-sm text-sm text-ink-400">
            Submissions from the website&apos;s Contact page will land here in
            real time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Summary strip */}
      <div className="mb-5 grid grid-cols-3 gap-3 sm:max-w-md">
        <StatChip label="Total" value={counts.total} tone="text-ink-900" />
        <StatChip label="New" value={counts.new} tone="text-brand-600" dot="bg-brand-500" />
        <StatChip label="Archived" value={counts.archived} tone="text-ink-500" dot="bg-ink-300" />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="inline-flex items-center gap-0.5 rounded-full border border-ink-200 bg-white p-0.5 text-xs font-medium shadow-sm">
          {(["all", "new", "archived"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`relative rounded-full px-3.5 py-1.5 capitalize transition-all duration-200 ${
                filter === f
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
              }`}
            >
              {f}
              {f === "new" && counts.new > 0 && filter !== "new" && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                  {counts.new}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {visible.map((m) => {
          const open = openId === m.id;
          const unread = m.status === "new";
          return (
            <div
              key={m.id}
              className={`group overflow-hidden rounded-2xl border bg-white shadow-card transition-all duration-300 ${
                open
                  ? "border-brand-200 ring-1 ring-brand-100"
                  : "border-ink-100 hover:border-brand-100 hover:shadow-lg hover:shadow-brand-900/5"
              }`}
            >
              <button
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                onClick={() => {
                  setOpenId(open ? null : m.id);
                  if (m.status === "new") {
                    startTransition(() => markContactStatus(m.id, "read"));
                  }
                }}
              >
                <div className="relative shrink-0">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${hueFor(
                      m.email,
                    )} text-sm font-semibold text-white shadow-sm`}
                  >
                    {initials(m.name)}
                  </div>
                  {unread && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`truncate ${unread ? "font-semibold text-ink-900" : "font-medium text-ink-800"}`}
                    >
                      {m.name}
                    </span>
                    <span className={`badge shrink-0 ${STATUS_BADGE[m.status]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[m.status]}`} />
                      {m.status}
                    </span>
                    {m.replied_at && (
                      <span className="badge shrink-0 bg-emerald-50 text-emerald-700">
                        <Icon name="check" className="h-3 w-3" />
                        Replied
                      </span>
                    )}
                  </div>
                  <p className={`truncate text-sm ${unread ? "text-ink-700" : "text-ink-400"}`}>
                    {m.subject ? (
                      <span className="font-medium text-ink-600">{m.subject}</span>
                    ) : null}
                    {m.subject ? " — " : ""}
                    {m.message}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3 pl-2">
                  <div className="text-right">
                    {m.ref && (
                      <p className="font-mono text-[11px] text-ink-300">{m.ref}</p>
                    )}
                    <p className="text-xs text-ink-400">{formatDate(m.created_at)}</p>
                  </div>
                  <Icon
                    name="chevron-down"
                    className={`h-4 w-4 text-ink-300 transition-transform duration-300 ${
                      open ? "rotate-180 text-brand-500" : ""
                    }`}
                  />
                </div>
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-ink-100 bg-ink-50/60 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <a
                        href={`mailto:${m.email}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition hover:text-brand-700 hover:underline"
                      >
                        <Icon name="mail" className="h-4 w-4" />
                        {m.email}
                      </a>
                      <button
                        onClick={() =>
                          setReplyingId(replyingId === m.id ? null : m.id)
                        }
                        className="btn-primary shrink-0 px-3.5 py-1.5 text-xs shadow-sm shadow-brand-600/20 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-brand-600/30"
                      >
                        <Icon name="reply" className="h-3.5 w-3.5" />
                        {m.replied_at ? "Reply again" : "Reply"}
                      </button>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap rounded-xl border border-ink-100 bg-white p-3.5 text-sm leading-relaxed text-ink-700 shadow-sm">
                      {m.message}
                    </p>

                    {open && m.replied_at && (
                      <RepliesThread
                        messageId={m.id}
                        refreshToken={replyVersion}
                        pending={pending}
                        startTransition={startTransition}
                      />
                    )}

                    {replyingId === m.id && (
                      <ReplyComposer
                        message={m}
                        onClose={() => setReplyingId(null)}
                        onSent={() => setReplyVersion((v) => v + 1)}
                      />
                    )}

                    <div className="mt-3 flex gap-2">
                      {m.status !== "archived" ? (
                        <ActionButton
                          icon="archive"
                          label="Archive"
                          disabled={pending}
                          onClick={() =>
                            startTransition(() => markContactStatus(m.id, "archived"))
                          }
                        />
                      ) : (
                        <ActionButton
                          icon="archive-restore"
                          label="Unarchive"
                          disabled={pending}
                          onClick={() => startTransition(() => markContactStatus(m.id, "read"))}
                        />
                      )}
                      <ActionButton
                        icon="trash"
                        label="Delete"
                        danger
                        disabled={pending}
                        onClick={() => {
                          if (confirm("Delete this message permanently?")) {
                            startTransition(() => deleteContactMessage(m.id));
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  tone,
  dot,
}: {
  label: string;
  value: number;
  tone: string;
  dot?: string;
}) {
  return (
    <div className="card px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-ink-400">
        {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
        {label}
      </p>
      <p className={`mt-0.5 text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

/**
 * Inline reply composer: subject/body prefilled from the original message,
 * editable, with three ways to send — Copy to clipboard, Open in the staff
 * member's own mail client, or Send directly (backed by an email-sending
 * webhook; inert with a note until CONTACT_EMAIL_WEBHOOK_URL is configured).
 */
function ReplyComposer({
  message: m,
  onClose,
  onSent,
}: {
  message: ContactMessage;
  onClose: () => void;
  onSent: () => void;
}) {
  const [subject, setSubject] = useState(`Re: ${m.subject || "your message to Gepromed"}`);
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [sendState, setSendState] = useState<"idle" | "sent" | "failed" | "not_configured">(
    "idle",
  );
  const [sending, startSend] = useTransition();

  const copy = () => {
    navigator.clipboard?.writeText(`${subject}\n\n${body}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const mailto = `mailto:${m.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const send = () =>
    startSend(async () => {
      const res = await sendContactReply({
        messageId: m.id,
        ref: m.ref,
        to: m.email,
        subject,
        body,
      });
      setSendState(res.ok ? "sent" : res.reason === "not_configured" ? "not_configured" : "failed");
      if (res.ok) onSent();
    });

  return (
    <div className="mt-3 space-y-2.5 rounded-xl border border-brand-100 bg-white p-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          Reply to {m.name}
        </p>
        <button onClick={onClose} className="text-xs text-ink-400 hover:text-ink-600">
          Cancel
        </button>
      </div>
      <div>
        <label className="text-xs font-medium text-ink-500">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-0.5 w-full rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-ink-500">Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="Write your reply…"
          className="mt-0.5 w-full resize-y rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm leading-relaxed focus:border-brand-400 focus:outline-none"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={copy} className="btn-ghost !py-1.5 !text-xs">
          {copied ? "Copied" : "Copy"}
        </button>
        <a href={mailto} className="btn-ghost !py-1.5 !text-xs">
          Open in mail
        </a>
        <button
          onClick={send}
          disabled={sending || !body.trim()}
          className="btn-primary !py-1.5 !text-xs disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send reply"}
        </button>
      </div>
      {sendState === "sent" ? (
        <p className="text-xs font-medium text-emerald-600">Reply sent.</p>
      ) : sendState === "failed" ? (
        <p className="text-xs font-medium text-red-600">Send failed. Try again or open in mail.</p>
      ) : sendState === "not_configured" ? (
        <p className="text-xs text-amber-600">
          Direct sending isn&apos;t set up yet — use Copy or Open in mail for now.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Full reply history for a message. Fetches on mount/refresh (the list page
 * doesn't preload replies) and offers "Clear all replies" to wipe the thread
 * and undo the "Replied" indicator — safe since nothing else depends on it.
 */
function RepliesThread({
  messageId,
  refreshToken,
  pending,
  startTransition,
}: {
  messageId: string;
  refreshToken: number;
  pending: boolean;
  startTransition: (fn: () => void | Promise<void>) => void;
}) {
  const [replies, setReplies] = useState<ContactReply[] | null>(null);

  useEffect(() => {
    let active = true;
    getContactReplies(messageId).then((r) => {
      if (active) setReplies(r);
    });
    return () => {
      active = false;
    };
  }, [messageId, refreshToken]);

  if (replies === null) {
    return <p className="mt-3 text-xs text-ink-400">Loading replies…</p>;
  }
  if (replies.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {replies.map((r) => (
        <div key={r.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <Icon name="check" className="h-3.5 w-3.5" />
            Your reply · {formatDate(r.sent_at)}
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
            {r.body}
          </p>
        </div>
      ))}
      <button
        disabled={pending}
        onClick={() => {
          if (confirm("Clear all replies for this message?")) {
            startTransition(() => clearContactReplies(messageId));
          }
        }}
        className="text-xs font-medium text-ink-400 hover:text-red-600 disabled:opacity-50"
      >
        Clear all replies
      </button>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-ink-600 hover:bg-ink-100"
      }`}
    >
      <Icon name={icon} className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
