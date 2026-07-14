"use client";

import { PageHeader } from "@/components/PageHeader";
import { useT } from "@/lib/i18n";

/** Static page-level chrome (title/description/config banner). The KPI row
 * moved into TraineeViews so it can react to whichever tab/filter is active —
 * see TraineeKpiRow.tsx and TRAINEE_COURSE_ROLLUP_PLAN.md Phase B. */
export function TraineesPageHeader({ configured }: { configured: boolean }) {
  const t = useT();

  return (
    <>
      <PageHeader
        eyebrow={t("traineesPage.eyebrow")}
        title={t("traineesPage.title")}
        description={t("traineesPage.description")}
      />

      {!configured ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("traineesPage.notConfigured")}
        </div>
      ) : null}
    </>
  );
}
