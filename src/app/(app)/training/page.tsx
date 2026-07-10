import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { trainingModules } from "@/lib/seed/training";

export const dynamic = "force-dynamic";

const LEVEL_STYLES: Record<string, string> = {
  Intro: "bg-emerald-100 text-emerald-700",
  Core: "bg-brand-100 text-brand-700",
  Advanced: "bg-amber-100 text-amber-700",
};

const FORMAT_ICONS: Record<string, string> = {
  Video: "play",
  Guide: "book",
  Workshop: "users",
  Playbook: "list-checks",
};

export default function TrainingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Training hub"
        title="Training hub"
        description="Learn to get the most out of the AI Console, safely and effectively. Content is seeded for the demo; publish your own via the LMS handoff."
        action={
          <Link href="/lms" className="btn-primary">
            <Icon name="graduation-cap" className="h-4 w-4" /> Create a module
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trainingModules.map((m) => (
          <div key={m.id} className="card flex flex-col p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon name={FORMAT_ICONS[m.format] ?? "book"} />
              </div>
              <span className={`badge ${LEVEL_STYLES[m.level]}`}>{m.level}</span>
            </div>
            <p className="mt-3 font-semibold text-ink-900">{m.title}</p>
            <p className="mt-1 flex-1 text-sm text-ink-500">{m.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-400">
              <span className="badge bg-ink-50 text-ink-500">{m.format}</span>
              <span className="inline-flex items-center gap-1">
                <Icon name="clock" className="h-3.5 w-3.5" /> {m.duration}
              </span>
              <span className="inline-flex items-center gap-1">
                <Icon name="users" className="h-3.5 w-3.5" /> {m.audience}
              </span>
            </div>

            <details className="mt-3 border-t border-ink-100 pt-3">
              <summary className="cursor-pointer text-sm font-medium text-brand-600">
                {m.lessons.length} lessons
              </summary>
              <ol className="mt-2 space-y-1 text-sm text-ink-600">
                {m.lessons.map((l, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-ink-300">{i + 1}.</span> {l}
                  </li>
                ))}
              </ol>
            </details>
          </div>
        ))}
      </div>
    </>
  );
}
