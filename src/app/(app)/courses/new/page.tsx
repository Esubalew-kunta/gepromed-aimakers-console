import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { CourseForm } from "@/components/CourseForm";

export const dynamic = "force-dynamic";

export default function NewCoursePage() {
  return (
    <>
      <Link
        href="/courses"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-brand-600"
      >
        ← All courses
      </Link>
      <PageHeader
        eyebrow="Course management"
        title="New course"
        description="Fill in both French and English, the public website switches language with the toggle. Saved to the shared catalog."
      />
      <CourseForm />
    </>
  );
}
