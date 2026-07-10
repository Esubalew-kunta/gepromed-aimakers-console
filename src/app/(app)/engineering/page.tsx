import { PageHeader } from "@/components/PageHeader";
import { getEngineeringRequests } from "@/lib/engineering-data";
import { EngineeringBoards } from "@/components/EngineeringBoards";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function EngineeringPage() {
  const configured = isSupabaseConfigured();
  const requests = await getEngineeringRequests();

  return (
    <>
      <PageHeader
        eyebrow="Engineering"
        title="Engineering requests"
        description="Explant analysis, testing platform and equipment rental: each request is tracked through its own pipeline (explant has a hospital and an industrial case), mirroring the trainee board."
      />

      {!configured ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Supabase isn&apos;t configured, set the keys in <code>.env.local</code> to load live requests.
        </div>
      ) : null}

      <EngineeringBoards requests={requests} />
    </>
  );
}
