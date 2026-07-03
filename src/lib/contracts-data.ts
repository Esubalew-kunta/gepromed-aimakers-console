import "server-only";
import { supabaseServer } from "./supabase";
import type { ContractTemplate } from "./contracts-shared";

export * from "./contracts-shared";

/** Active contract templates (default first). */
export async function getContractTemplates(): Promise<ContractTemplate[]> {
  const sb = supabaseServer();
  if (!sb) return [];
  const { data, error } = await sb
    .from("contract_templates")
    .select("*")
    .eq("active", true)
    .order("is_default", { ascending: false })
    .order("created_at");
  if (error || !data) return [];
  return data as ContractTemplate[];
}

/** Public URL for a stored template file (bucket is public). */
export function templatePublicUrl(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/contracts/${path}` : null;
}
