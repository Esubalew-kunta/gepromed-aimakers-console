"use client";

import { useEffect, useMemo, useState } from "react";
import { LeadBoard } from "./LeadBoard";
import { TraineeSummaryTable } from "./TraineeSummaryTable";
import { CourseRollupTable } from "./CourseRollupTable";
import { TraineeKpiRow } from "./TraineeKpiRow";
import { TableExportMenu } from "./TableExportMenu";
import {
  type Lead,
  computeStats,
  PARCOURS_LABEL,
  stageLabel,
  normalizeParcours,
} from "@/lib/leads-shared";
import type { ExportColumn } from "@/lib/export-table";
import type { ContractTemplate } from "@/lib/contracts-shared";
import { useT } from "@/lib/i18n";

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR") : "";

const TRAINEE_EXPORT_COLUMNS: ExportColumn<Lead>[] = [
  { label: "Réf.", value: (l) => l.ref ?? l.id.slice(0, 8) },
  { label: "Prénom", value: (l) => l.first_name },
  { label: "Nom", value: (l) => l.last_name },
  { label: "E-mail", value: (l) => l.email },
  { label: "Téléphone", value: (l) => l.phone },
  { label: "Profession", value: (l) => l.profession },
  { label: "Institution", value: (l) => l.institution },
  { label: "Pays", value: (l) => l.country },
  { label: "Parcours", value: (l) => PARCOURS_LABEL[normalizeParcours(l)] },
  { label: "Financement", value: (l) => (l.funding === "sponsored" ? "Sponsorisé" : "Autofinancé") },
  { label: "Sponsor", value: (l) => l.sponsor_name },
  { label: "Étape", value: (l) => stageLabel(normalizeParcours(l), l.stage) },
  { label: "Intérêt", value: (l) => l.interest },
  { label: "Formation", value: (l) => l.trainings?.title?.fr ?? "" },
  { label: "Début formation", value: (l) => l.trainings?.start_date ?? "" },
  { label: "Fin formation", value: (l) => l.trainings?.end_date ?? "" },
  { label: "Relances actives", value: (l) => (l.reminders_active ? "Oui" : "Non") },
  { label: "Créé le", value: (l) => fmtDate(l.created_at) },
  { label: "Mis à jour le", value: (l) => fmtDate(l.updated_at) },
];

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
  canDelete,
  templates,
  publicBase,
}: {
  leads: Lead[];
  isAdmin: boolean;
  canDelete: boolean;
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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-xl border border-ink-200 bg-white p-0.5">
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

        <TableExportMenu
          rows={visibleLeads}
          columns={TRAINEE_EXPORT_COLUMNS}
          filenameBase="gepromed-trainees"
          sheetName="Trainees"
          labelFr="trainee(s)"
        />
      </div>

      {view === "pipeline" ? (
        <LeadBoard
          leads={leads}
          isAdmin={isAdmin}
          canDelete={canDelete}
          templates={templates}
          publicBase={publicBase}
          onVisibleChange={setVisibleLeads}
        />
      ) : view === "summary" ? (
        <TraineeSummaryTable
          key={selectedCourseId}
          leads={leads}
          canDelete={canDelete}
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
