import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { SkillRunner } from "@/components/SkillRunner";
import { getSkillByKey } from "@/lib/skills-data";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  const isAdmin = user?.role === "admin";
  const skill = await getSkillByKey(id);
  if (!skill) notFound();

  return (
    <>
      <Link
        href="/skills"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-brand-600"
      >
        ← All skills
      </Link>

      <PageHeader
        eyebrow={skill.category}
        title={skill.name}
        description={skill.summary}
        action={
          isAdmin ? (
            <Link href={`/skills/${id}/edit`} className="btn-ghost">
              <Icon name="clipboard-check" className="h-4 w-4" /> Edit skill
            </Link>
          ) : undefined
        }
      />

      <div className="mb-6 flex flex-wrap gap-4 text-sm">
        <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-card">
          <Icon name="users" className="h-4 w-4 text-ink-400" /> {skill.owner}
        </span>
        <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-card">
          <Icon name="sparkles" className="h-4 w-4 text-ink-400" /> {skill.model}
        </span>
        <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-card">
          <Icon name="clock" className="h-4 w-4 text-ink-400" /> ~
          {skill.avgMinutesSaved} min/run (est.)
        </span>
        <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-card">
          <Icon name="play" className="h-4 w-4 text-ink-400" />{" "}
          {skill.runsThisMonth} run{skill.runsThisMonth === 1 ? "" : "s"} this month
        </span>
      </div>

      <SkillRunner skillId={skill.id} fields={skill.inputs} title={skill.name} />
    </>
  );
}
