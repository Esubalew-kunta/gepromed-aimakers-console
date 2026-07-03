import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { CourseForm } from "@/components/CourseForm";
import { getCourse } from "@/lib/courses-data";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

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
        title={`Edit: ${course.title.fr}`}
        description="Update this session in the shared catalog. Seat counts update automatically as leads are confirmed."
      />
      <CourseForm course={course} />
    </>
  );
}
