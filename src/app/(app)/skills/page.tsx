import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { SkillCatalog, type SkillCardData } from "@/components/SkillCatalog";
import { getSkills } from "@/lib/skills-data";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const user = await getSessionUser();
  const isAdmin = user?.role === "admin";
  const skills = await getSkills();
  // Project to serializable data (drops the demo() function) for the client.
  const cards: SkillCardData[] = skills.map((s) => ({
    id: s.id,
    name: s.name,
    summary: s.summary,
    category: s.category,
    icon: s.icon,
    tags: s.tags,
    owner: s.owner,
    status: s.status,
    runsThisMonth: s.runsThisMonth,
    avgMinutesSaved: s.avgMinutesSaved,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Skills catalog"
        title="AI skills for Gepromed teams"
        description="Ready-to-run skills across regulatory, clinical, quality, funding, communication and enablement. Each skill runs live on Claude when configured, with an offline fallback."
        action={
          isAdmin ? (
            <Link href="/skills/new" className="btn-primary">
              <Icon name="sparkles" className="h-4 w-4" /> New skill
            </Link>
          ) : undefined
        }
      />
      <SkillCatalog skills={cards} />
    </>
  );
}
