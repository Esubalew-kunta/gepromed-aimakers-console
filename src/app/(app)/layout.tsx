import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Full session verification happens here (middleware only checks presence).
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const demoMode = !process.env.OPENAI_API_KEY && !process.env.LMS_API_URL;

  return (
    <div className="lg:flex">
      <Sidebar user={{ name: user.name, title: user.title }} />
      <div className="min-w-0 flex-1">
        {demoMode ? (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-center text-xs font-medium text-amber-800">
            Demo mode · All AI, automations &amp; integrations are simulated
            offline, no external APIs are called.
          </div>
        ) : null}
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">{children}</div>
      </div>
    </div>
  );
}
