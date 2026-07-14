"use client";

import { useEffect, useState, useTransition } from "react";
import type { EngineeringRequest } from "@/lib/engineering-data";
import {
  type PipelineDef,
  type Lang,
  getVariant,
  stageIdsFor,
  stageShortOf,
  stageLabelOf,
  stageToneOf,
  advanceLabelOf,
  variantLabelOf,
} from "@/lib/pipeline/core";
import { getStageEmail, fillEmail } from "@/lib/pipeline/engineering-emails";
import { useT, useLang } from "@/lib/i18n";
import {
  advanceEngStage,
  setEngVariant,
  setEngExit,
  reopenEng,
  getEngComments,
  addEngComment,
  sendEngEmail,
  type EngComment,
} from "@/app/(app)/engineering/actions";

const fmtDate = (iso: string | null | undefined, lang: Lang) =>
  iso
    ? new Date(iso).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

/**
 * Engineering request detail + action drawer. Read detail (contact, notes,
 * meta, pipeline stepper, timeline) plus the mutating actions moved out of the
 * row (advance / set case / exit / reopen) — mirrors the trainee action drawer.
 */
export function EngineeringDrawer({
  r,
  def,
  run,
  onClose,
}: {
  r: EngineeringRequest;
  def: PipelineDef;
  run: (fn: () => Promise<unknown>) => void;
  onClose: () => void;
}) {
  const t = useT();
  const { lang } = useLang();

  const variantKey = r.variant ?? def.defaultVariantKey;
  const exited = Boolean(r.exited_at);
  const adv = advanceLabelOf(def, variantKey, r.stage, lang);
  const needsVariant = r.kind === "explant" && !r.variant && !exited;
  const stageIds = stageIdsFor(def, variantKey);
  const currentIdx = stageIds.indexOf(r.stage);
  const metaEntries = Object.entries(r.meta ?? {});

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-ink-400">{r.ref}</p>
          <h2 className="truncate text-lg font-bold text-ink-900">{r.requester_name}</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg px-2 py-0.5 text-xl leading-none text-ink-400 hover:bg-ink-50 hover:text-ink-700"
          aria-label={t("engineering.drawer.close")}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {r.variant ? (
            <span className={`badge ${getVariant(def, variantKey).tone}`}>
              {variantLabelOf(def, variantKey, lang)}
            </span>
          ) : null}
          {exited ? (
            <span className="badge bg-red-50 text-red-700">{r.exit_reason}</span>
          ) : (
            <span className={`badge ${stageToneOf(def, variantKey, r.stage)}`}>
              {stageLabelOf(def, variantKey, r.stage, lang)}
            </span>
          )}
        </div>

        {/* Contact */}
        <Section title={t("engineering.drawer.contact")}>
          <Field label="Email" value={r.requester_email} />
          {r.institution ? (
            <Field label={t("engineering.drawer.institution")} value={r.institution} />
          ) : null}
          {r.org_type ? (
            <Field label={t("engineering.drawer.orgType")} value={r.org_type} />
          ) : null}
          {r.desired_date ? (
            <Field
              label={t("engineering.drawer.desiredDate")}
              value={fmtDate(r.desired_date, lang)}
            />
          ) : null}
        </Section>

        {/* Details */}
        <Section title={t("engineering.drawer.details")}>
          <div>
            <p className="text-xs font-medium text-ink-400">{t("engineering.drawer.notes")}</p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-700">
              {r.notes?.trim() ? r.notes : t("engineering.drawer.noNotes")}
            </p>
          </div>
          {metaEntries.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-ink-400">{t("engineering.drawer.meta")}</p>
              <dl className="mt-0.5 space-y-0.5">
                {metaEntries.map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-sm">
                    <dt className="text-ink-500">{k}</dt>
                    <dd className="text-ink-800">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </Section>

        {/* Pipeline stepper */}
        <Section title={t("engineering.drawer.progress")}>
          <ol className="space-y-1.5">
            {stageIds.map((id, i) => {
              const done = currentIdx >= 0 && i < currentIdx;
              const current = i === currentIdx && !exited;
              return (
                <li key={id} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      current
                        ? "bg-brand-600 text-white"
                        : done
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-ink-100 text-ink-400"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className={current ? "font-semibold text-ink-900" : "text-ink-500"}>
                    {stageShortOf(def, variantKey, id, lang)}
                  </span>
                </li>
              );
            })}
          </ol>
        </Section>

        {/* Timeline */}
        <Section title={t("engineering.drawer.timeline")}>
          <Field label={t("engineering.drawer.created")} value={fmtDate(r.created_at, lang)} />
          <Field label={t("engineering.drawer.updated")} value={fmtDate(r.updated_at, lang)} />
          {exited ? (
            <Field label={t("engineering.drawer.exitedOn")} value={fmtDate(r.exited_at, lang)} />
          ) : null}
          <Field
            label={t("engineering.drawer.reminders")}
            value={
              r.reminders_active
                ? t("engineering.drawer.remindersOn")
                : t("engineering.drawer.remindersOff")
            }
          />
        </Section>

        {/* Suggested email for this stage */}
        <Section title={t("engineering.drawer.email")}>
          <StageEmail r={r} lang={lang} t={t} />
        </Section>

        {/* Comments */}
        <Section title={t("engineering.drawer.comments")}>
          <Comments requestId={r.id} lang={lang} t={t} />
        </Section>
      </div>

      {/* Footer actions */}
      <div className="border-t border-ink-100 px-5 py-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
          {t("engineering.drawer.actions")}
        </p>
        {exited ? (
          <button
            onClick={() => run(() => reopenEng(r.id))}
            className="btn-ghost w-full !py-2 !text-sm"
          >
            {t("engineering.reopen")}
          </button>
        ) : needsVariant ? (
          <div>
            <p className="mb-2 text-sm text-ink-500">{t("engineering.drawer.pickCase")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => run(() => setEngVariant(r.id, "hospital"))}
                className="btn-ghost flex-1 !py-2 !text-sm"
              >
                {t("engineering.caseInstitution")}
              </button>
              <button
                onClick={() => run(() => setEngVariant(r.id, "industrial"))}
                className="btn-ghost flex-1 !py-2 !text-sm"
              >
                {t("engineering.caseIndustrial")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {adv ? (
              <button
                onClick={() => run(() => advanceEngStage(r.id, r.kind, r.variant, r.stage))}
                className="btn-primary flex-1 !py-2 !text-sm"
              >
                {adv} →
              </button>
            ) : (
              <span className="badge flex-1 justify-center bg-emerald-50 py-2 text-emerald-700">
                {t("engineering.finished")}
              </span>
            )}
            <button
              onClick={() =>
                run(() => setEngExit(r.id, def.exitStatus === "declined" ? "décliné" : "sans suite"))
              }
              className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
              title={t("engineering.exitTitle")}
            >
              {t("engineering.exit")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="text-right font-medium text-ink-800">{value}</span>
    </div>
  );
}

/** Suggested, polished FR/EN email for the request's CURRENT stage (per the
 * SOP audit). Prefilled + editable; Copy puts "Subject … / body" on the
 * clipboard, and "Open in mail" launches the staff member's own client with the
 * requester, subject and body prefilled. Re-syncs when the stage or language
 * changes. Stages with no template show a short note instead. */
function StageEmail({
  r,
  lang,
  t,
}: {
  r: EngineeringRequest;
  lang: Lang;
  t: ReturnType<typeof useT>;
}) {
  const tpl = getStageEmail(r.kind, r.stage);
  const filled = tpl
    ? fillEmail(tpl, lang, {
        name: r.requester_name,
        ref: r.ref ?? "",
        institution: r.institution,
      })
    : null;

  const [subject, setSubject] = useState(filled?.subject ?? "");
  const [body, setBody] = useState(filled?.body ?? "");
  const [copied, setCopied] = useState(false);
  const [sendState, setSendState] = useState<"idle" | "sent" | "failed" | "not_configured">("idle");
  const [sending, startSend] = useTransition();

  // Re-sync when the resolved template changes (stage/language switch).
  const sig = `${r.stage}|${lang}|${filled?.subject ?? ""}`;
  useEffect(() => {
    setSubject(filled?.subject ?? "");
    setBody(filled?.body ?? "");
    setCopied(false);
    setSendState("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  if (!tpl) return <p className="text-sm text-ink-400">{t("engineering.drawer.emailNone")}</p>;

  const copy = () => {
    navigator.clipboard?.writeText(`${subject}\n\n${body}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  const mailto = `mailto:${encodeURIComponent(r.requester_email)}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;

  const send = () =>
    startSend(async () => {
      const res = await sendEngEmail({
        requestId: r.id,
        ref: r.ref,
        to: r.requester_email,
        subject,
        body,
      });
      setSendState(res.ok ? "sent" : res.reason === "not_configured" ? "not_configured" : "failed");
    });

  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-400">{t("engineering.drawer.emailHint")}</p>
      <div>
        <label className="text-xs font-medium text-ink-500">
          {t("engineering.drawer.emailSubject")}
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-0.5 w-full rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-ink-500">
          {t("engineering.drawer.emailBody")}
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="mt-0.5 w-full resize-y rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm leading-relaxed focus:border-brand-400 focus:outline-none"
        />
      </div>
      <p className="truncate text-xs text-ink-400">
        {t("engineering.drawer.emailOpen")} · {r.requester_email}
      </p>
      <div className="flex flex-wrap gap-2">
        <button onClick={copy} className="btn-ghost !py-2 !text-sm">
          {copied ? t("engineering.drawer.emailCopied") : t("engineering.drawer.emailCopy")}
        </button>
        <a href={mailto} className="btn-ghost !py-2 !text-sm">
          {t("engineering.drawer.emailOpen")}
        </a>
        <button
          onClick={send}
          disabled={sending}
          className="btn-primary !py-2 !text-sm disabled:opacity-50"
        >
          {sending ? t("engineering.drawer.emailSending") : t("engineering.drawer.emailSend")}
        </button>
      </div>
      {sendState === "sent" ? (
        <p className="text-xs font-medium text-emerald-600">{t("engineering.drawer.emailSent")}</p>
      ) : sendState === "failed" ? (
        <p className="text-xs font-medium text-red-600">{t("engineering.drawer.emailFailed")}</p>
      ) : sendState === "not_configured" ? (
        <p className="text-xs text-amber-600">{t("engineering.drawer.emailNotConfigured")}</p>
      ) : null}
    </div>
  );
}

/** Lazy-loaded staff comments thread + composer. Fetches on mount (the list
 * page doesn't preload comments); posting reloads the thread. Degrades to an
 * empty thread until the `engineering_comments` table migration is applied. */
function Comments({
  requestId,
  lang,
  t,
}: {
  requestId: string;
  lang: Lang;
  t: ReturnType<typeof useT>;
}) {
  const [comments, setComments] = useState<EngComment[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, start] = useTransition();

  const load = () => getEngComments(requestId).then(setComments);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const post = () => {
    const body = draft.trim();
    if (!body) return;
    start(async () => {
      await addEngComment(requestId, body);
      setDraft("");
      await load();
    });
  };

  return (
    <div className="space-y-3">
      {comments.length === 0 ? (
        <p className="text-sm text-ink-400">{t("engineering.drawer.noComments")}</p>
      ) : (
        <ul className="space-y-2.5">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg bg-ink-50 px-3 py-2">
              <div className="flex items-center justify-between text-xs text-ink-400">
                <span className="font-medium text-ink-600">{c.author ?? "Staff"}</span>
                <span>
                  {new Date(c.created_at).toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-800">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder={t("engineering.drawer.commentPlaceholder")}
          className="flex-1 resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
        />
        <button
          onClick={post}
          disabled={pending || !draft.trim()}
          className="btn-primary !py-2 !text-sm disabled:opacity-50"
        >
          {t("engineering.drawer.commentSend")}
        </button>
      </div>
    </div>
  );
}
