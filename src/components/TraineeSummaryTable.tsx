"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  type Lead,
  type Parcours,
  PARCOURS,
  PARCOURS_LABEL,
  normalizeParcours,
  stagesFor,
  stageLabel,
  stageTone,
} from "@/lib/leads-shared";
import { useT } from "@/lib/i18n";
import { TraineeSummaryDrawer } from "./TraineeSummaryDrawer";
import { TraineeStatsChart } from "./TraineeStatsChart";
import { Icon } from "./Icon";

const fmtDay = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

type FundingFilter = "" | "self" | "sponsored";

/** Thin pill-style select, distinct from the app-wide `.input` (which is
 * taller/wider) — keeps this filter row compact so it doesn't overflow. */
const FILTER_SELECT =
  "rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs text-ink-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

/**
 * Read-only summary/reporting view of trainees: stats chart + table + search/
 * filter by course, status, sponsor and name, with a click-through detail
 * panel. Deliberately separate from LeadBoard (the action-oriented pipeline)
 * — no mutation affordances here, purely for browsing and reporting.
 */
export function TraineeSummaryTable({
  leads,
  onVisibleChange,
  initialCourseFilter,
  publicBase = null,
}: {
  leads: Lead[];
  /** Reports the currently filtered/visible leads upward, so a parent can
   * keep KPI stats in sync with whatever this table is showing right now. */
  onVisibleChange?: (visible: Lead[]) => void;
  /** Pre-selects the course filter — used for the Courses tab's click-through
   * (clicking a course row jumps here pre-filtered to that course). */
  initialCourseFilter?: string;
  /** Supabase storage base URL, needed to build contract/document view links
   * in the detail drawer. */
  publicBase?: string | null;
}) {
  const t = useT();
  const [q, setQ] = useState("");
  const [fParcours, setFParcours] = useState<Parcours | "all">("all");
  const [fCourse, setFCourse] = useState(initialCourseFilter ?? "");
  const [fStatus, setFStatus] = useState("");
  const [fFunding, setFFunding] = useState<FundingFilter>("");
  const [fDateFrom, setFDateFrom] = useState("");
  const [fDateTo, setFDateTo] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const courses = useMemo(() => {
    const seen = new Map<string, string>();
    for (const l of leads)
      if (l.training_id && l.trainings) seen.set(l.training_id, l.trainings.title.fr);
    return Array.from(seen, ([id, title]) => ({ id, title }));
  }, [leads]);

  // Status options depend on the selected parcours (the two pipelines have
  // different stage sets). When "all" parcours is selected, the dropdown stays
  // usable by grouping both parcours' stages under optgroups; picking one sets
  // both the status AND the parcours filter (encoded as "parcours::stage").
  const statusOptions = fParcours === "all" ? [] : stagesFor(fParcours);

  // Guards the auto-reset below from wiping out a status that was just set by
  // handleStatusChange's "all" combo path (which sets parcours + status
  // together in one user action).
  const settingFromStatus = useRef(false);

  const handleStatusChange = (value: string) => {
    if (fParcours === "all" && value.includes("::")) {
      const [p, s] = value.split("::");
      settingFromStatus.current = true;
      setFParcours(p as Parcours);
      setFStatus(s);
    } else {
      setFStatus(value);
    }
  };

  useEffect(() => {
    if (settingFromStatus.current) {
      settingFromStatus.current = false;
      return;
    }
    setFStatus("");
  }, [fParcours]);

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    // fDateTo is a day (YYYY-MM-DD); include the whole day by comparing
    // against the start of the next day rather than midnight of fDateTo.
    const toExclusive = fDateTo ? new Date(`${fDateTo}T00:00:00`) : null;
    if (toExclusive) toExclusive.setDate(toExclusive.getDate() + 1);
    const fromInclusive = fDateFrom ? new Date(`${fDateFrom}T00:00:00`) : null;

    return leads.filter((l) => {
      if (fParcours !== "all" && normalizeParcours(l) !== fParcours) return false;
      if (fCourse && l.training_id !== fCourse) return false;
      if (fStatus && l.stage !== fStatus) return false;
      if (fFunding === "self" && l.funding === "sponsored") return false;
      if (fFunding === "sponsored" && l.funding !== "sponsored") return false;
      if (fromInclusive || toExclusive) {
        const registered = new Date(l.created_at);
        if (fromInclusive && registered < fromInclusive) return false;
        if (toExclusive && registered >= toExclusive) return false;
      }
      if (query) {
        const hay = `${l.first_name} ${l.last_name} ${l.email} ${l.sponsor_name ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [leads, fParcours, fCourse, fStatus, fFunding, fDateFrom, fDateTo, q]);

  useEffect(() => {
    onVisibleChange?.(visible);
  }, [visible, onVisibleChange]);

  const liveLead = leads.find((l) => l.id === openId) ?? null;
  const keepRef = useRef<Lead | null>(null);
  if (liveLead) keepRef.current = liveLead;
  const drawerLead = liveLead ?? keepRef.current;
  const open = Boolean(openId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div>
      <TraineeStatsChart leads={visible} />

      {/* Search — its own row, full width, sits above the filters */}
      <div className="card mb-3 p-4">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("traineeSummary.searchPlaceholder")}
            className="input w-full !pl-9"
          />
        </div>
      </div>

      {/* Filters — thin pill-style controls in a wrapping row, so they reflow
          onto new lines instead of overflowing the card at narrow widths. */}
      <div className="card mb-4 flex flex-wrap items-center gap-2 p-4">
        <select
          value={fParcours}
          onChange={(e) => setFParcours(e.target.value as Parcours | "all")}
          className={`${FILTER_SELECT} w-auto`}
        >
          <option value="all">{t("traineeSummary.allParcours")}</option>
          {PARCOURS.map((p) => (
            <option key={p} value={p}>
              {PARCOURS_LABEL[p]}
            </option>
          ))}
        </select>
        <select
          value={fCourse}
          onChange={(e) => setFCourse(e.target.value)}
          className={`${FILTER_SELECT} w-auto max-w-[180px]`}
        >
          <option value="">{t("traineeSummary.allCourses")}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <select
          value={fParcours === "all" ? "" : fStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={`${FILTER_SELECT} w-auto max-w-[170px]`}
        >
          <option value="">{t("traineeSummary.allStatuses")}</option>
          {fParcours === "all"
            ? PARCOURS.map((p) => (
                <optgroup key={p} label={PARCOURS_LABEL[p]}>
                  {stagesFor(p).map((s) => (
                    <option key={`${p}::${s}`} value={`${p}::${s}`}>
                      {stageLabel(p, s)}
                    </option>
                  ))}
                </optgroup>
              ))
            : statusOptions.map((s) => (
                <option key={s} value={s}>
                  {stageLabel(fParcours as Parcours, s)}
                </option>
              ))}
        </select>
        <select
          value={fFunding}
          onChange={(e) => setFFunding(e.target.value as FundingFilter)}
          className={`${FILTER_SELECT} w-auto`}
        >
          <option value="">{t("traineeSummary.allFunding")}</option>
          <option value="self">{t("traineeSummary.fundingSelf")}</option>
          <option value="sponsored">{t("traineeSummary.fundingSponsored")}</option>
        </select>

        <div className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2 py-1">
          <Icon name="clock" className="h-3.5 w-3.5 shrink-0 text-ink-400" />
          <input
            type="date"
            value={fDateFrom}
            onChange={(e) => setFDateFrom(e.target.value)}
            max={fDateTo || undefined}
            title={t("traineeSummary.registeredFrom")}
            className="w-[124px] border-none bg-transparent p-0 text-xs text-ink-700 outline-none"
          />
          <span className="text-ink-300">→</span>
          <input
            type="date"
            value={fDateTo}
            onChange={(e) => setFDateTo(e.target.value)}
            min={fDateFrom || undefined}
            title={t("traineeSummary.registeredTo")}
            className="w-[124px] border-none bg-transparent p-0 text-xs text-ink-700 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs font-bold uppercase tracking-wide text-ink-400">
              <th className="px-5 py-3">{t("traineeSummary.colTrainee")}</th>
              <th className="px-5 py-3">{t("traineeSummary.colCourse")}</th>
              <th className="px-5 py-3">{t("traineeSummary.colStatus")}</th>
              <th className="px-5 py-3">{t("traineeSummary.colSponsor")}</th>
              <th className="px-5 py-3">{t("traineeSummary.colRegistered")}</th>
              <th className="px-5 py-3">{t("traineeSummary.colStart")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-400">
                  {t("traineeSummary.empty")}
                </td>
              </tr>
            ) : (
              visible.map((l) => {
                const parcours = normalizeParcours(l);
                return (
                  <tr
                    key={l.id}
                    onClick={() => setOpenId(l.id)}
                    className="cursor-pointer border-b border-ink-50 transition hover:bg-ink-50"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink-900">
                        {l.first_name} {l.last_name}
                      </p>
                      <p className="text-xs text-ink-400">{l.email}</p>
                    </td>
                    <td className="px-5 py-3 text-ink-700">
                      {l.trainings?.title.fr ?? l.training_title_snapshot ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge ${stageTone(parcours, l.stage)}`}>
                        {stageLabel(parcours, l.stage)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-700">
                      {l.funding === "sponsored" ? (l.sponsor_name ?? t("traineeSummary.fundingSponsored")) : t("traineeSummary.fundingSelf")}
                    </td>
                    <td className="px-5 py-3 text-ink-700">{fmtDay(l.created_at)}</td>
                    <td className="px-5 py-3 text-ink-700">{fmtDay(l.trainings?.start_date)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Scrim + read-only detail drawer */}
      <div
        onClick={() => setOpenId(null)}
        className={`fixed inset-0 z-40 bg-ink-900/35 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("traineeSummary.drawerTitle")}
        className={`fixed right-0 top-0 z-50 flex h-screen w-[480px] max-w-[94vw] flex-col bg-white shadow-2xl transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        } motion-reduce:transition-none`}
      >
        {drawerLead ? (
          <TraineeSummaryDrawer
            key={drawerLead.id}
            lead={drawerLead}
            onClose={() => setOpenId(null)}
            publicBase={publicBase}
          />
        ) : null}
      </aside>
    </div>
  );
}
