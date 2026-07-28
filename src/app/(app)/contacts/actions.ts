"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase";

export async function markContactStatus(
  id: string,
  status: "new" | "read" | "archived",
) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb.from("contact_messages").update({ status }).eq("id", id);
  revalidatePath("/contacts");
}

export async function deleteContactMessage(id: string) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb.from("contact_messages").delete().eq("id", id);
  revalidatePath("/contacts");
}
