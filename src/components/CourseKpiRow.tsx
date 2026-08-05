"use client";

import { Icon } from "@/components/Icon";
import { isUpcoming, type Course } from "@/lib/courses-shared";

/** Stats row for the course catalog, mirrors TraineeKpiRow's card style.
 * Fed whichever subset the board's search/filters currently show, so the
 * numbers track what's actually visible, not always the global total. */
export function CourseKpiRow({ courses }: { courses: Course[] }) {
  const total = courses.length;
  const draft = courses.filter((c) => !c.is_published).length;
  const published = total - draft;
  const upcoming = courses.filter((c) => isUpcoming(c)).length;
  const past = total - upcoming;
  const sponsored = courses.filter((c) => c.is_sponsored).length;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Total courses" value={total} icon="grid" iconBg="bg-ink-100" iconColor="text-ink-600" />
      <Kpi
        label="Drafts"
        value={draft}
        icon="clock"
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        sub={`${pct(draft)}% of total`}
      />
      <Kpi
        label="Published"
        value={published}
        icon="check"
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        sub={`${pct(published)}% of total`}
      />
      <Kpi
        label="Upcoming"
        value={upcoming}
        icon="graduation-cap"
        iconBg="bg-brand-50"
        iconColor="text-brand-700"
        sub={`${pct(upcoming)}% of total`}
      />
      <Kpi
        label="Past"
        value={past}
        icon="archive"
        iconBg="bg-ink-100"
        iconColor="text-ink-600"
        sub={`${pct(past)}% of total`}
      />
      <Kpi
        label="Sponsored"
        value={sponsored}
        icon="shield-check"
        iconBg="bg-violet-50"
        iconColor="text-violet-700"
        sub={`${pct(sponsored)}% of total`}
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
