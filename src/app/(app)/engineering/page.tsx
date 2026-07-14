import { getEngineeringRequests } from "@/lib/engineering-data";
import { EngineeringBoards } from "@/components/EngineeringBoards";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function EngineeringPage() {
  const configured = isSupabaseConfigured();
  const requests = await getEngineeringRequests();

  return <EngineeringBoards requests={requests} configured={configured} />;
}
