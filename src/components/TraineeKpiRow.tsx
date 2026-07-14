"use client";

import { Icon } from "@/components/Icon";
import { useT } from "@/lib/i18n";
import type { LeadStats } from "@/lib/leads-shared";

/** KPI row extracted so it can be fed whichever subset of leads is currently
 * visible in the active tab (Pipeline's filters, Summary's filters, or the
 * full set for Courses, which has no trainee-level filters of its own). */
export function TraineeKpiRow({ stats }: { stats: LeadStats }) {
  const t = useT();
  const pct = (n: number) => (stats.total === 0 ? 0 : Math.round((n / stats.total) * 100));

  return (
    <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Kpi
        label={t("traineesPage.kpiTotal")}
        value={stats.total}
        icon="users"
        iconBg="bg-ink-100"
        iconColor="text-ink-600"
      />
      <Kpi
        label={t("traineesPage.kpiActive")}
        value={stats.active}
        icon="clock"
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        sub={t("traineesPage.kpiOfTotal", { pct: pct(stats.active) })}
      />
      <Kpi
        label={t("traineesPage.kpiConfirmed")}
        value={stats.confirmed}
        icon="check"
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        sub={t("traineesPage.kpiOfTotal", { pct: pct(stats.confirmed) })}
      />
      <Kpi
        label={t("traineesPage.kpiCompleted")}
        value={stats.completed}
        icon="clipboard-check"
        iconBg="bg-brand-50"
        iconColor="text-brand-700"
        sub={t("traineesPage.kpiOfTotal", { pct: pct(stats.completed) })}
      />
      <Kpi
        label={t("traineesPage.kpiSponsored")}
        value={stats.sponsored}
        icon="grid"
        iconBg="bg-violet-50"
        iconColor="text-violet-700"
        sub={t("traineesPage.kpiOfTotal", { pct: pct(stats.sponsored) })}
      />
      <Kpi
        label={t("traineesPage.kpiNotInterested")}
        value={stats.notInterested}
        icon="mail"
        iconBg="bg-red-50"
        iconColor="text-red-600"
        sub={t("traineesPage.kpiOfTotal", { pct: pct(stats.notInterested) })}
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  sub,
}: {
  label: string;
  value: number;
  icon: string;
  iconBg: string;
  iconColor: string;
  sub?: string;
}) {
  return (
    <div className="card p-5 transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">{label}</p>
        <div className={`grid h-8 w-8 place-items-center rounded-full ${iconBg}`}>
          <Icon name={icon} className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      <p className="mt-1.5 text-3xl font-bold text-ink-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-ink-400">{sub}</p> : null}
    </div>
  );
}
