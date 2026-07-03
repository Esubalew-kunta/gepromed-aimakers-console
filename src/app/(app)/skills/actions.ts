"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export interface SkillFormState {
  error?: string;
}

/** Only the AI Makers admin may author/manage skills. */
async function requireAdmin(): Promise<boolean> {
  const u = await getSessionUser();
  return u?.role === "admin";
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "skill"
  );
}

/** Create or update a skill (admin only). Used by SkillForm via useActionState. */
export async function saveSkill(
  _prev: SkillFormState,
  formData: FormData,
): Promise<SkillFormState> {
  if (!(await requireAdmin())) return { error: "Admins only." };
  const sb = supabaseServer();
  if (!sb) return { error: "Supabase is not configured." };

  const editingKey = String(formData.get("__key") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name is required." };
  const system_prompt = String(formData.get("system_prompt") || "").trim();
  if (!system_prompt) return { error: "System prompt is required." };

  let inputs: unknown;
  try {
    inputs = JSON.parse(String(formData.get("inputs") || "[]"));
    if (!Array.isArray(inputs)) throw new Error();
  } catch {
    return { error: "Inputs must be a valid JSON array." };
  }

  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const row = {
    name,
    description: String(formData.get("description") || ""),
    category: String(formData.get("category") || "Operations"),
    icon: String(formData.get("icon") || "sparkles"),
    owner: String(formData.get("owner") || ""),
    model: String(formData.get("model") || "Claude Sonnet 5"),
    status: String(formData.get("status") || "Live"),
    system_prompt,
    inputs,
    tags,
    active: true,
  };

  if (editingKey) {
    const { error } = await sb.from("skills").update(row).eq("key", editingKey);
    if (error) return { error: error.message };
  } else {
    const { error } = await sb
      .from("skills")
      .insert({ ...row, key: slugify(name) });
    if (error) return { error: error.message };
  }

  revalidatePath("/skills");
  redirect("/skills");
}

/** Delete a skill (admin only). */
export async function deleteSkill(key: string): Promise<void> {
  if (!(await requireAdmin())) return;
  const sb = supabaseServer();
  if (!sb) return;
  await sb.from("skills").delete().eq("key", key);
  revalidatePath("/skills");
  redirect("/skills");
}
