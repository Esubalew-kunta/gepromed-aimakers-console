import { TraineesPageHeader } from "@/components/TraineesPageHeader";
import { TraineeViews } from "@/components/TraineeViews";
import { getLeads } from "@/lib/leads-data";
import { getContractTemplates } from "@/lib/contracts-data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const configured = isSupabaseConfigured();
  const user = await getSessionUser();
  const isAdmin = user?.role === "admin";
  const leads = await getLeads();
  const templates = await getContractTemplates();
  const publicBase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;

  return (
    <>
      <TraineesPageHeader configured={configured} />

      <div className="mt-8">
        <TraineeViews leads={leads} isAdmin={isAdmin} templates={templates} publicBase={publicBase} />
      </div>
    </>
  );
}
