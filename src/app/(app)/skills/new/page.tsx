import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { SkillForm } from "@/components/SkillForm";

export const dynamic = "force-dynamic";

export default async function NewSkillPage() {
  const user = await getSessionUser();
  if (user?.role !== "admin") redirect("/skills");

  return (
    <>
      <Link
        href="/skills"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-brand-600"
      >
        ← All skills
      </Link>
      <PageHeader
        eyebrow="Skill management · Admin"
        title="New skill"
        description="Add a skill to the catalog. Once saved it's available to all Gepromed staff to run."
      />
      <SkillForm />
    </>
  );
}
