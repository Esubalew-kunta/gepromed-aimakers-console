import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { CourseBoard } from "@/components/CourseBoard";
import { getCourses } from "@/lib/courses-data";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const configured = isSupabaseConfigured();
  const courses = await getCourses();

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Course management"
        description="Create and edit the training sessions for the public website. New courses start as drafts — publish them when they're ready to go live."
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

      <CourseBoard courses={courses} />
    </>
  );
}
