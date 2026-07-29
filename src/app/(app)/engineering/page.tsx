import { getEngineeringRequests } from "@/lib/engineering-data";
import { EngineeringBoards } from "@/components/EngineeringBoards";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EngineeringPage() {
  const configured = isSupabaseConfigured();
  const user = await getSessionUser();
  // Delete: admin + manager, per the client's explicit call (not the
  // "gepromed" ops role).
  const canDelete = user?.role === "admin" || user?.role === "manager";
  const requests = await getEngineeringRequests();

  return <EngineeringBoards requests={requests} configured={configured} canDelete={canDelete} />;
}
