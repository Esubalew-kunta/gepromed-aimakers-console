"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export interface ContractFormState {
  error?: string;
}

/** Contract templates are managed by Gepromed staff + the AI Makers admin. */
const CONTRACT_ROLES = ["admin", "gepromed", "manager"];

async function requireStaff(): Promise<boolean> {
  const u = await getSessionUser();
  return u != null && CONTRACT_ROLES.includes(u.role);
}

/** Upload a new contract template (admin only). */
export async function uploadTemplate(
  _prev: ContractFormState,
  fd: FormData,
): Promise<ContractFormState> {
  if (!(await requireStaff())) return { error: "Réservé au personnel Gepromed." };
  const sb = supabaseServer();
  if (!sb) return { error: "Supabase not configured." };

  const name = String(fd.get("name") || "").trim();
  if (!name) return { error: "Give the template a name." };
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file." };
  const makeDefault = fd.get("is_default") != null;
  // Courses (training ids) this contract covers → drives the auto-match.
  const courseIds = fd.getAll("course_ids").map(String).filter(Boolean);

  const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
  const path = `${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.${ext}`;
  const { error: upErr } = await sb.storage
    .from("contracts")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (upErr) return { error: `Upload failed: ${upErr.message}` };

  if (makeDefault) {
    await sb.from("contract_templates").update({ is_default: false }).eq("is_default", true);
  }
  const { error } = await sb
    .from("contract_templates")
    .insert({ name, file_url: path, is_default: makeDefault, course_ids: courseIds });
  if (error) return { error: error.message };

  revalidatePath("/contracts");
  return {};
}

/** Make a template the global default (admin only). */
export async function setDefaultTemplate(id: string) {
  if (!(await requireStaff())) return;
  const sb = supabaseServer();
  if (!sb) return;
  await sb.from("contract_templates").update({ is_default: false }).eq("is_default", true);
  await sb.from("contract_templates").update({ is_default: true }).eq("id", id);
  revalidatePath("/contracts");
}

/** Remove a template (admin only). */
export async function deleteTemplate(id: string) {
  if (!(await requireStaff())) return;
  const sb = supabaseServer();
  if (!sb) return;
  await sb.from("contract_templates").update({ active: false }).eq("id", id);
  revalidatePath("/contracts");
}
