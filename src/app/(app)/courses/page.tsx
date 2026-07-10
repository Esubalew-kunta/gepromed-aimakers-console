import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { getCourses, isUpcoming, euro, fmtRange, SPECIALTY_LABEL, type Course } from "@/lib/courses-data";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const configured = isSupabaseConfigured();
  const courses = await getCourses();
  const upcoming = courses.filter((c) => isUpcoming(c));
  const past = courses.filter((c) => !isUpcoming(c));

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Course management"
        description="Create and edit the training sessions for the public website. Saved to the shared catalog; the site's cards read from it once wired (next step)."
        action={
          <Link href="/courses/new" className="btn-primary">
            <Icon name="sparkles" className="h-4 w-4" /> New course
          </Link>
        }
      />

      {!configured ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Supabase isn&apos;t configured, set the keys in <code>.env.local</code> to manage courses.
        </div>
      ) : null}

      <Section title="Upcoming" courses={upcoming} empty="No upcoming courses. Create one to publish it on the website." />
      {past.length > 0 ? <Section title="Past sessions" courses={past} /> : null}
    </>
  );
}

function Section({
  title,
  courses,
  empty,
}: {
  title: string;
  courses: Course[];
  empty?: string;
}) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
        {title}
      </h2>
      {courses.length === 0 ? (
        <div className="card p-8 text-center text-ink-400">{empty}</div>
      ) : (
        <div className="card overflow-hidden">
          {courses.map((c, i) => (
            <Link
              key={c.id}
              href={`/courses/${c.slug}/edit`}
              className={`grid grid-cols-[1.6fr_auto] items-center gap-4 px-5 py-4 transition hover:bg-ink-50 sm:grid-cols-[1.6fr_1fr_auto_auto] ${
                i > 0 ? "border-t border-ink-100" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-ink-900">{c.title.fr}</span>
                  {c.qualiopi ? (
                    <span className="badge bg-brand-50 text-brand-700">Qualiopi</span>
                  ) : null}
                  <span
                    className={`badge ${c.status === "full" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
                  {SPECIALTY_LABEL[c.specialty] ?? c.specialty} · {c.level} · {c.city}
                </p>
              </div>
              <div className="hidden text-sm text-ink-600 sm:block">
                {fmtRange(c.start_date, c.end_date)}
              </div>
              <div className="hidden text-sm tabular-nums text-ink-600 sm:block">
                {c.enrolled}/{c.capacity} · {euro(c.price_eur)}
              </div>
              <span className="text-sm font-semibold text-brand-600">Edit →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
