"use client";

import { Icon } from "@/components/Icon";
import { useT } from "@/lib/i18n";
import type { EngineeringRequest } from "@/lib/engineering-data";

/** Status buckets for a set of engineering requests. */
export function engStatus(r: EngineeringRequest): "active" | "done" | "exited" {
  if (r.exited_at) return "exited";
  if (r.stage === "done") return "done";
  return "active";
}

/** KPI row for the Engineering board — reflects whichever rows are currently
 * visible (active kind + filters), mirroring the trainee KPI pattern. */
export function EngineeringKpiRow({ rows }: { rows: EngineeringRequest[] }) {
  const t = useT();
  const total = rows.length;
  const active = rows.filter((r) => engStatus(r) === "active").length;
  const done = rows.filter((r) => engStatus(r) === "done").length;
  const exited = rows.filter((r) => engStatus(r) === "exited").length;

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Kpi label={t("engineering.kpi.total")} value={total} icon="workflow" iconBg="bg-ink-100" iconColor="text-ink-600" />
      <Kpi label={t("engineering.kpi.active")} value={active} icon="clock" iconBg="bg-amber-50" iconColor="text-amber-600" />
      <Kpi label={t("engineering.kpi.done")} value={done} icon="check" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      <Kpi label={t("engineering.kpi.exited")} value={exited} icon="alert-triangle" iconBg="bg-red-50" iconColor="text-red-600" />
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number;
  icon: string;
  iconBg: string;
  iconColor: string;
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
    </div>
  );
}
