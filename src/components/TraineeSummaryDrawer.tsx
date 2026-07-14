"use client";

import { useEffect, useState } from "react";
import {
  type Lead,
  normalizeParcours,
  stagesFor,
  stageLabel,
  stageTone,
} from "@/lib/leads-shared";
import { useT, useLang } from "@/lib/i18n";
import { getDocumentUrl } from "@/app/(app)/trainees/actions";
import { Icon } from "./Icon";

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const euro = (n?: number | null) =>
  n == null ? "—" : "€" + n.toLocaleString("fr-FR");

const isImageFile = (path?: string | null) =>
  !!path && /\.(png|jpe?g|webp|gif|svg)$/i.test(path);

/**
 * Read-only trainee detail panel — registration, course (incl. description),
 * payments, dates, status. No mutation affordances (approve/advance/verify
 * live in LeadDrawer, the action-oriented pipeline drawer; this is a
 * separate, view-only panel).
 */
export function TraineeSummaryDrawer({
  lead,
  onClose,
  publicBase = null,
}: {
  lead: Lead;
  onClose: () => void;
  /** Supabase storage base URL, needed to build the contract file view link. */
  publicBase?: string | null;
}) {
  const t = useT();
  const { lang } = useLang();
  const parcours = normalizeParcours(lead);
  const stages = stagesFor(parcours);
  const idx = stages.indexOf(lead.stage);
  const last = stages.length - 1;
  const pct = idx <= 0 ? 0 : idx >= last ? 100 : (idx / last) * 100;
  const training = lead.trainings;

  const paidAt =
    parcours === "helpmesee" ? lead.invoice_paid_at : lead.deposit_contract_at;
  const refundedAt = lead.deposit_refunded_at ?? null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            {t("traineeSummary.drawerTitle")}
          </p>
          <h2 className="text-lg font-bold text-ink-900">
            {lead.first_name} {lead.last_name}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg px-2 py-0.5 text-xl leading-none text-ink-400 hover:bg-ink-50 hover:text-ink-700"
          aria-label={t("traineeSummary.close")}
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Status */}
        <section>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">
            {t("traineeSummary.currentStatus")}
          </p>
          <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${stageTone(parcours, lead.stage)}`}>
            {stageLabel(parcours, lead.stage)}
          </span>
          <div className="mt-3 h-1.5 w-full rounded-full bg-ink-100">
            <div
              className="h-1.5 rounded-full bg-brand-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </section>

        {/* Course / session */}
        <section>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">
            {t("traineeSummary.courseRegistered")}
          </p>
          <div className="rounded-xl border border-ink-100 p-3">
            <p className="font-semibold text-ink-900">
              {training?.title?.[lang] ?? training?.title?.fr ?? lead.training_title_snapshot ?? "—"}
            </p>
            {training ? (
              <p className="mt-1 text-sm text-ink-500">
                {training.city} · {fmtDate(training.start_date)} –{" "}
                {fmtDate(training.end_date)} ({training.duration_days} j)
              </p>
            ) : null}
            {training?.summary?.[lang] ?? training?.summary?.fr ? (
              <p className="mt-2 text-sm text-ink-600">
                <span className="font-medium text-ink-500">{t("traineeSummary.description")}: </span>
                {training?.summary?.[lang] ?? training?.summary?.fr}
              </p>
            ) : null}
          </div>
        </section>

        {/* Dates */}
        <section className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
              {t("traineeSummary.registrationDate")}
            </p>
            <p className="mt-1 text-sm font-medium text-ink-900">
              {fmtDate(lead.created_at)}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
              {t("traineeSummary.courseStart")}
            </p>
            <p className="mt-1 text-sm font-medium text-ink-900">
              {fmtDate(training?.start_date)}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
              {t("traineeSummary.courseEnd")}
            </p>
            <p className="mt-1 text-sm font-medium text-ink-900">
              {fmtDate(training?.end_date)}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
              {t("traineeSummary.confirmedOn")}
            </p>
            <p className="mt-1 text-sm font-medium text-ink-900">
              {fmtDate(lead.confirmed_at)}
            </p>
          </div>
        </section>

        {/* Payments / subscription */}
        <section>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">
            {t("traineeSummary.paymentSection")}
          </p>
          <div className="space-y-2 rounded-xl border border-ink-100 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">{t("traineeSummary.funding")}</span>
              <span className="font-medium text-ink-900">
                {lead.funding === "sponsored" ? t("traineeSummary.fundingSponsored") : t("traineeSummary.fundingSelf")}
              </span>
            </div>
            {lead.funding === "sponsored" && lead.sponsor_name ? (
              <div className="flex justify-between">
                <span className="text-ink-500">{t("traineeSummary.sponsor")}</span>
                <span className="font-medium text-ink-900">{lead.sponsor_name}</span>
              </div>
            ) : null}
            {training ? (
              <div className="flex justify-between">
                <span className="text-ink-500">{t("traineeSummary.amountDeposit")}</span>
                <span className="font-medium text-ink-900">
                  {euro(training.price_eur)} / {euro(training.deposit_eur)}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-ink-500">
                {parcours === "helpmesee" ? t("traineeSummary.invoicePaidOn") : t("traineeSummary.depositContractOn")}
              </span>
              <span className="font-medium text-ink-900">{fmtDate(paidAt)}</span>
            </div>
            {parcours === "bootcamp" ? (
              <div className="flex justify-between">
                <span className="text-ink-500">
                  {lead.caution_waived ? t("traineeSummary.depositLabel") : t("traineeSummary.depositRefundedOn")}
                </span>
                <span className="font-medium text-ink-900">
                  {lead.caution_waived ? t("traineeSummary.depositWaived") : fmtDate(refundedAt)}
                </span>
              </div>
            ) : null}
          </div>
        </section>

        {/* Sponsor — name, email, logo, shown whenever this trainee is sponsored */}
        {lead.funding === "sponsored" ? (
          <section>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">
              {t("traineeSummary.sponsorSection")}
            </p>
            <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50 px-3.5 py-3">
              {lead.sponsor_logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lead.sponsor_logo_url}
                  alt={lead.sponsor_name ?? "Sponsor"}
                  className="h-10 w-10 rounded-lg border border-violet-200 bg-white object-contain"
                />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-lg border border-violet-200 bg-white text-xs font-bold text-violet-700">
                  {(lead.sponsor_name ?? "SP").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">
                  {lead.sponsor_name ?? t("traineeSummary.fundingSponsored")}
                </p>
                {lead.sponsor_contact ? (
                  <p className="truncate text-xs text-violet-700">
                    {t("traineeSummary.sponsorEmail")}: {lead.sponsor_contact}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {/* Contract — read-only: thumbnail (if an image) + name + view link,
            no upload/approve controls */}
        <section>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">
            {t("traineeSummary.contractSection")}
          </p>
          {(() => {
            const contractUrl =
              lead.contract_template?.file_url && publicBase
                ? `${publicBase}/storage/v1/object/public/contracts/${lead.contract_template.file_url}`
                : null;
            const showThumb = contractUrl && isImageFile(lead.contract_template?.file_url);
            return (
              <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 px-3.5 py-3">
                {showThumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={contractUrl}
                    alt={lead.contract_template?.name ?? "Contract"}
                    className="h-14 w-14 shrink-0 rounded-lg border border-ink-200 bg-white object-cover"
                  />
                ) : (
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-ink-200 bg-white text-ink-500">
                    <Icon name="clipboard-check" className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {lead.contract_template?.name ?? t("traineeSummary.contractNone")}
                  </p>
                </div>
                {contractUrl ? (
                  <a
                    href={contractUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost shrink-0 !py-1.5 !text-xs"
                  >
                    {t("traineeSummary.contractView")}
                  </a>
                ) : null}
              </div>
            );
          })()}
        </section>

        {/* Signed document — read-only: status + view link, no upload/verify controls */}
        <section>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">
            {t("traineeSummary.documentSection")}
          </p>
          <SignedDocumentView lead={lead} />
        </section>
      </div>
    </div>
  );
}

/** Read-only signed-document status + thumbnail (if an image) + view link —
 * no upload/verify controls (those are pipeline actions, this panel never
 * mutates anything). The file lives in a private bucket, so a signed URL is
 * resolved once up front (for both the thumbnail and the link) rather than
 * on click. */
function SignedDocumentView({ lead }: { lead: Lead }) {
  const t = useT();
  const doc = lead.documents?.[0] ?? null;
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!doc?.file_url) {
      setUrl(null);
      return;
    }
    setLoading(true);
    getDocumentUrl(doc.file_url).then((u) => {
      setUrl(u);
      setLoading(false);
    });
  }, [doc?.file_url]);

  const showThumb = url && isImageFile(doc?.file_url);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 px-3.5 py-3">
      {showThumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={t("traineeSummary.documentSection")}
          className="h-14 w-14 shrink-0 rounded-lg border border-ink-200 bg-white object-cover"
        />
      ) : (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-ink-200 bg-white text-ink-500">
          <Icon name="clipboard-check" className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900">
          {doc ? t("traineeSummary.documentSection") : t("traineeSummary.documentNone")}
        </p>
        {doc ? (
          <p className="text-xs text-ink-500">
            {doc.verified ? t("traineeSummary.documentVerified") : t("traineeSummary.documentPending")}
          </p>
        ) : null}
      </div>
      {doc?.file_url ? (
        url ? (
          <a href={url} target="_blank" rel="noreferrer" className="btn-ghost shrink-0 !py-1.5 !text-xs">
            {t("traineeSummary.documentView")}
          </a>
        ) : (
          <span className="shrink-0 text-xs text-ink-400">{loading ? "…" : ""}</span>
        )
      ) : null}
    </div>
  );
}
