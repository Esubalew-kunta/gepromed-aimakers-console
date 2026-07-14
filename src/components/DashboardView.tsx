"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { EditorialCalendar } from "@/components/EditorialCalendar";
import { useT } from "@/lib/i18n";
import type { activity as ActivityType, metrics as MetricsType, quickStart as QuickStartType } from "@/lib/seed/dashboard";
import type { recentRuns } from "@/lib/store";

type Skill = {
  id: string;
  name: string;
  summary: string;
  icon: string;
  runsThisMonth: number;
};
type LiveRun = ReturnType<typeof recentRuns>[number];

export function DashboardView({
  userFirstName,
  liveRuns,
  skills,
  metrics,
  quickStart,
  activity,
}: {
  userFirstName: string;
  liveRuns: LiveRun[];
  skills: Skill[];
  metrics: typeof MetricsType;
  quickStart: typeof QuickStartType;
  activity: typeof ActivityType;
}) {
  const t = useT();

  return (
    <>
      <PageHeader
        eyebrow={t("dashboard.eyebrow")}
        title={t("dashboard.welcome", { name: userFirstName })}
        description={t("dashboard.description")}
        action={
          <Link href="/skills" className="btn-primary">
            <Icon name="grid" className="h-4 w-4" /> {t("dashboard.browseSkills")}
          </Link>
        }
      />

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="card p-5">
            <p className="text-sm text-ink-500">{m.label}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-ink-900">{m.value}</span>
              <span
                className={`text-xs font-semibold ${
                  m.positive ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {m.change}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-400">{m.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Quick start */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
            {t("dashboard.startHere")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {quickStart.map((q) => (
              <Link
                key={q.title}
                href={q.href}
                className="card group flex flex-col p-5 transition hover:border-brand-200 hover:shadow-lg"
              >
                <p className="font-semibold text-ink-900">{q.title}</p>
                <p className="mt-1 flex-1 text-sm text-ink-500">{q.body}</p>
                <span className="mt-3 text-sm font-semibold text-brand-600 group-hover:underline">
                  {q.cta} →
                </span>
              </Link>
            ))}
          </div>

          {/* Popular skills */}
          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-ink-500">
            {t("dashboard.popularSkills")}
          </h2>
          <div className="card divide-y divide-ink-100">
            {skills
              .slice()
              .sort((a, b) => b.runsThisMonth - a.runsThisMonth)
              .slice(0, 4)
              .map((s) => (
                <Link
                  key={s.id}
                  href={`/skills/${s.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-ink-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon name={s.icon} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink-900">{s.name}</p>
                    <p className="truncate text-sm text-ink-500">{s.summary}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-semibold text-ink-900">
                      {s.runsThisMonth}
                    </p>
                    <p className="text-xs text-ink-400">{t("dashboard.runsPerMonth")}</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>

        {/* Activity */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
            {t("dashboard.recentActivity")}
          </h2>
          <div className="card p-5">
            {liveRuns.length > 0 ? (
              <div className="mb-4 rounded-xl bg-brand-50 p-3">
                <p className="mb-2 text-xs font-semibold text-brand-700">
                  {t("dashboard.yourSession")}
                </p>
                <ul className="space-y-1.5">
                  {liveRuns.map((r) => (
                    <li key={r.id} className="text-sm text-ink-700">
                      {t("dashboard.ran")}{" "}
                      <span className="font-medium">{r.skillName}</span>{" "}
                      <span className="text-ink-400">
                        (~{r.minutesSaved} {t("dashboard.minutesSaved")})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <ul className="space-y-4">
              {activity.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                  <div className="text-sm">
                    <span className="font-medium text-ink-900">{a.actor}</span>{" "}
                    <span className="text-ink-500">{a.action}</span>{" "}
                    <span className="text-ink-700">{a.target}</span>
                    <p className="text-xs text-ink-400">{a.when}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <EditorialCalendar />
      </div>
    </>
  );
}
