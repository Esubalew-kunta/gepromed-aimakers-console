"use client";

import { useEffect, useMemo, useState } from "react";
import { LeadBoard } from "./LeadBoard";
import { TraineeSummaryTable } from "./TraineeSummaryTable";
import { CourseRollupTable } from "./CourseRollupTable";
import { TraineeKpiRow } from "./TraineeKpiRow";
import { type Lead, computeStats } from "@/lib/leads-shared";
import type { ContractTemplate } from "@/lib/contracts-shared";
import { useT } from "@/lib/i18n";

type View = "pipeline" | "summary" | "courses";

/** Tab switch between the action-oriented pipeline (LeadBoard), the read-only
 * summary/reporting table (TraineeSummaryTable), and the course rollup
 * (CourseRollupTable). Also owns the KPI row (Phase B): each tab's filtered
 * "visible" leads are reported up via onVisibleChange, so the KPI row reflects
 * whichever tab/filters are currently active instead of always showing global
 * totals. Courses has no trainee-level filters of its own, so it falls back to
 * the full leads set. Kept as a thin client wrapper so the page itself can
 * stay a server component. */
export function TraineeViews({
  leads,
  isAdmin,
  templates,
  publicBase,
}: {
  leads: Lead[];
  isAdmin: boolean;
  templates: ContractTemplate[];
  publicBase: string | null;
}) {
  const [view, setView] = useState<View>("pipeline");
  const [visibleLeads, setVisibleLeads] = useState<Lead[]>(leads);
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(undefined);
  const t = useT();

  // Courses has no filter state of its own to report visibility, so reset the
  // KPI-backing set to the full leads list whenever it becomes active.
  useEffect(() => {
    if (view === "courses") setVisibleLeads(leads);
  }, [view, leads]);

  const stats = useMemo(() => computeStats(visibleLeads), [visibleLeads]);

  return (
    <div>
      <TraineeKpiRow stats={stats} />

      <div className="mb-4 inline-flex rounded-xl border border-ink-200 bg-white p-0.5">
        <button
          onClick={() => setView("pipeline")}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
            view === "pipeline"
              ? "bg-brand-600 text-white"
              : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
          }`}
        >
          {t("traineeViews.pipelineTab")}
        </button>
        <button
          onClick={() => setView("summary")}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
            view === "summary"
              ? "bg-brand-600 text-white"
              : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
          }`}
        >
          {t("traineeViews.summaryTab")}
        </button>
        <button
          onClick={() => setView("courses")}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
            view === "courses"
              ? "bg-brand-600 text-white"
              : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
          }`}
        >
          {t("traineeViews.coursesTab")}
        </button>
      </div>

      {view === "pipeline" ? (
        <LeadBoard
          leads={leads}
          isAdmin={isAdmin}
          templates={templates}
          publicBase={publicBase}
          onVisibleChange={setVisibleLeads}
        />
      ) : view === "summary" ? (
        <TraineeSummaryTable
          key={selectedCourseId}
          leads={leads}
          onVisibleChange={setVisibleLeads}
          initialCourseFilter={selectedCourseId}
          publicBase={publicBase}
        />
      ) : (
        <CourseRollupTable
          leads={leads}
          onSelectCourse={(trainingId) => {
            setSelectedCourseId(trainingId);
            setView("summary");
          }}
        />
      )}
    </div>
  );
}
