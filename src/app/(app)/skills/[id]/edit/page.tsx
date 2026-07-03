import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { SkillForm } from "@/components/SkillForm";
import { getSkillByKey } from "@/lib/skills-data";

export const dynamic = "force-dynamic";

export default async function EditSkillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (user?.role !== "admin") redirect("/skills");

  const { id } = await params;
  const skill = await getSkillByKey(id);
  if (!skill) notFound();

  // Strip the non-serializable demo() fn before handing to the client form.
  const { demo: _demo, ...formSkill } = skill;

  return (
    <>
      <Link
        href={`/skills/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-brand-600"
      >
        ← Back to skill
      </Link>
      <PageHeader
        eyebrow="Skill management · Admin"
        title={`Edit: ${skill.name}`}
        description="Update the prompt, inputs and metadata. Changes apply to everyone immediately."
      />
      <SkillForm skill={formSkill} />
    </>
  );
}
