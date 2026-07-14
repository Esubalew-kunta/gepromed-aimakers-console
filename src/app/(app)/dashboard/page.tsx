import { getSessionUser } from "@/lib/auth";
import { activity, metrics, quickStart } from "@/lib/seed/dashboard";
import { getSkills } from "@/lib/skills-data";
import { recentRuns } from "@/lib/store";
import { DashboardView } from "@/components/DashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const liveRuns = recentRuns(5);
  const skills = (await getSkills()).map(
    ({ id, name, summary, icon, runsThisMonth }) => ({
      id,
      name,
      summary,
      icon,
      runsThisMonth,
    }),
  );

  return (
    <DashboardView
      userFirstName={user?.name.split(" ")[0] ?? "there"}
      liveRuns={liveRuns}
      skills={skills}
      metrics={metrics}
      quickStart={quickStart}
      activity={activity}
    />
  );
}
