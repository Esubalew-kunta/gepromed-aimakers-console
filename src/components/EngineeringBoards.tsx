"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EngineeringRequest } from "@/lib/engineering-data";
import { ENGINEERING_PIPELINES } from "@/lib/pipeline/engineering";
import {
  type PipelineDef,
  type Lang,
  loc,
  getVariant,
  stageIdsFor,
  stageLabelOf,
  stageToneOf,
  variantLabelOf,
} from "@/lib/pipeline/core";
import { useT, useLang } from "@/lib/i18n";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "./Icon";
import { deleteEngRequest } from "@/app/(app)/engineering/actions";
import { EngineeringDrawer } from "./EngineeringDrawer";
import { EngineeringKpiRow, engStatus } from "./EngineeringKpiRow";
import { EngineeringStatsChart } from "./EngineeringStatsChart";
import { TableExportMenu } from "./TableExportMenu";
import { ConfirmDialog } from "./ConfirmDialog";
import type { ExportColumn } from "@/lib/export-table";

type Kind = "explant" | "test" | "equipment";
const KIND_ORDER: Kind[] = ["explant", "test", "equipment"];

type StatusFilter = "all" | "active" | "done" | "exited";

const fmtDateISO = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR") : "";

function buildExportColumns(def: PipelineDef, lang: Lang): ExportColumn<EngineeringRequest>[] {
  return [
    { label: "Réf.", value: (r) => r.ref ?? r.id.slice(0, 8) },
    { label: "Type", value: (r) => loc(def.label, lang) },
    {
      label: "Cas",
      value: (r) => (r.variant ? variantLabelOf(def, r.variant ?? def.defaultVariantKey, lang) : ""),
    },
    {
      label: "Statut",
      value: (r) => (r.exited_at ? (r.exit_reason ?? "Sorti") : stageLabelOf(def, r.variant ?? def.defaultVariantKey, r.stage, lang)),
    },
    { label: "Demandeur", value: (r) => r.requester_name },
    { label: "E-mail", value: (r) => r.requester_email },
    { label: "Institution", value: (r) => r.institution },
    { label: "Type d'organisation", value: (r) => r.org_type },
    { label: "Créneau souhaité", value: (r) => fmtDateISO(r.desired_date) },
    { label: "Notes", value: (r) => r.notes },
    { label: "Créée le", value: (r) => fmtDateISO(r.created_at) },
    { label: "Mise à jour le", value: (r) => fmtDateISO(r.updated_at) },
  ];
}

const FILTER_SELECT =
  "rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 focus:border-brand-400 focus:outline-none";

export function EngineeringBoards({
  requests,
  configured,
  canDelete,
}: {
  requests: EngineeringRequest[];
  configured: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const { lang } = useLang();
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<Kind>("explant");
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EngineeringRequest | null>(null);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  const def = ENGINEERING_PIPELINES[kind];
  const kindRows = useMemo(() => requests.filter((r) => r.kind === kind), [requests, kind]);

  // Stage options for the current kind (default variant's stage ids; the two
  // explant cases share the same stage ids, only labels differ).
  const stageOptions = stageIdsFor(def, def.defaultVariantKey);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
    // `to` is inclusive of the whole day → compare against next midnight.
    const toMs = dateTo ? new Date(dateTo).getTime() + 86_400_000 : null;
    return kindRows.filter((r) => {
      if (statusFilter !== "all" && engStatus(r) !== statusFilter) return false;
      if (stageFilter !== "all" && r.stage !== stageFilter) return false;
      if (q) {
        const hay = `${r.ref ?? ""} ${r.requester_name} ${r.requester_email} ${r.institution}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (fromMs != null || toMs != null) {
        const ts = new Date(r.created_at).getTime();
        if (fromMs != null && ts < fromMs) return false;
        if (toMs != null && ts >= toMs) return false;
      }
      return true;
    });
  }, [kindRows, query, stageFilter, statusFilter, dateFrom, dateTo]);

  const selected = openId ? requests.find((r) => r.id === openId) ?? null : null;
  const open = Boolean(selected);
  const filtersActive =
    Boolean(query || dateFrom || dateTo) || stageFilter !== "all" || statusFilter !== "all";
  const exportColumns = useMemo(() => buildExportColumns(def, lang), [def, lang]);

  const setKindReset = (k: Kind) => {
    setKind(k);
    setStageFilter("all"); // stage ids differ per kind
  };

  return (
    <>
      <PageHeader
        eyebrow={t("engineering.eyebrow")}
        title={t("engineering.title")}
        description={t("engineering.description")}
      />

      {!configured ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("engineering.notConfigured")}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        {KIND_ORDER.map((k) => {
          const n = requests.filter((r) => r.kind === k).length;
          const active = kind === k;
          return (
            <button
              key={k}
              onClick={() => setKindReset(k)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-brand-600 text-white"
                  : "border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
              }`}
            >
              {loc(ENGINEERING_PIPELINES[k].label, lang)}
              <span className={`ml-1.5 ${active ? "text-white/80" : "text-ink-400"}`}>{n}</span>
            </button>
          );
        })}
      </div>

      <EngineeringKpiRow rows={rows} />

      {/* Toolbar: search + filters */}
      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("engineering.search")}
            className="min-w-[220px] flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
          <TableExportMenu
            rows={rows}
            columns={exportColumns}
            filenameBase={`gepromed-${kind}-requests`}
            sheetName={loc(def.label, lang)}
            labelFr="demande(s)"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className={FILTER_SELECT}
          >
            <option value="all">{t("engineering.allStages")}</option>
            {stageOptions.map((id) => (
              <option key={id} value={id}>
                {stageLabelOf(def, def.defaultVariantKey, id, lang)}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={FILTER_SELECT}
          >
            <option value="all">{t("engineering.allStatuses")}</option>
            <option value="active">{t("engineering.status.active")}</option>
            <option value="done">{t("engineering.status.done")}</option>
            <option value="exited">{t("engineering.status.exited")}</option>
          </select>
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1">
            <span className="text-xs text-ink-400">{t("engineering.dateFrom")}</span>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[124px] border-0 bg-transparent p-0 text-xs text-ink-700 focus:outline-none"
            />
            <span className="text-ink-300">→</span>
            <span className="text-xs text-ink-400">{t("engineering.dateTo")}</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[124px] border-0 bg-transparent p-0 text-xs text-ink-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <EngineeringStatsChart rows={rows} def={def} />

      <div className={`card divide-y divide-ink-100 ${pending ? "opacity-60" : ""}`}>
        {rows.length === 0 ? (
          <p className="p-10 text-center text-ink-400">
            {filtersActive ? t("engineering.noMatch") : t("engineering.empty")}
          </p>
        ) : (
          rows.map((r) => (
            <Row
              key={r.id}
              r={r}
              def={def}
              onOpen={() => setOpenId(r.id)}
              t={t}
              lang={lang}
              canDelete={canDelete}
              onRequestDelete={() => setDeleteTarget(r)}
            />
          ))
        )}
      </div>

      {/* Scrim + detail/action drawer */}
      <div
        onClick={() => setOpenId(null)}
        className={`fixed inset-0 z-40 bg-ink-900/35 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("engineering.title")}
        className={`fixed right-0 top-0 z-50 flex h-screen w-[480px] max-w-[94vw] flex-col bg-white shadow-2xl transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        } motion-reduce:transition-none`}
      >
        {selected ? (
          <EngineeringDrawer
            key={selected.id}
            r={selected}
            def={ENGINEERING_PIPELINES[selected.kind]}
            run={run}
            canDelete={canDelete}
            onClose={() => setOpenId(null)}
            onRequestDelete={() => setDeleteTarget(selected)}
          />
        ) : null}
      </aside>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={lang === "fr" ? "Supprimer la demande" : "Delete request"}
        message={
          deleteTarget
            ? lang === "fr"
              ? `Supprimer définitivement la demande ${deleteTarget.ref ?? deleteTarget.id.slice(0, 8)} de ${deleteTarget.requester_name} ? Cette action est irréversible.`
              : `Permanently delete request ${deleteTarget.ref ?? deleteTarget.id.slice(0, 8)} from ${deleteTarget.requester_name}? This cannot be undone.`
            : ""
        }
        confirmLabel={lang === "fr" ? "Supprimer" : "Delete"}
        cancelLabel={lang === "fr" ? "Annuler" : "Cancel"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) run(() => deleteEngRequest(deleteTarget.id));
          setOpenId(null);
          setDeleteTarget(null);
        }}
      />
    </>
  );
}

function Row({
  r,
  def,
  onOpen,
  t,
  lang,
  canDelete,
  onRequestDelete,
}: {
  r: EngineeringRequest;
  def: PipelineDef;
  onOpen: () => void;
  t: ReturnType<typeof useT>;
  lang: Lang;
  canDelete: boolean;
  onRequestDelete: () => void;
}) {
  const variantKey = r.variant ?? def.defaultVariantKey;
  const exited = Boolean(r.exited_at);
  const needsVariant = r.kind === "explant" && !r.variant && !exited;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
      className="group flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left transition hover:bg-ink-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-ink-400">{r.ref}</span>
          <span className="font-semibold text-ink-900">{r.requester_name}</span>
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
          {needsVariant ? (
            <span className="badge bg-amber-50 text-amber-700">{t("engineering.case")}</span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-ink-500">
          {r.requester_email}
          {r.institution ? ` · ${r.institution}` : ""}
          {r.org_type ? ` · ${r.org_type}` : ""}
          {r.desired_date ? ` · ${t("engineering.slotWanted")} ${r.desired_date}` : ""}
        </p>
      </div>
      {canDelete ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRequestDelete();
          }}
          className="shrink-0 rounded-lg p-1.5 text-ink-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 focus-visible:opacity-100"
          title={lang === "fr" ? "Supprimer la demande" : "Delete request"}
          aria-label={lang === "fr" ? "Supprimer la demande" : "Delete request"}
        >
          <Icon name="trash" className="h-4 w-4" />
        </button>
      ) : null}
      <span className="shrink-0 text-xs font-medium text-brand-600">
        {t("engineering.viewDetail")} →
      </span>
    </div>
  );
}
