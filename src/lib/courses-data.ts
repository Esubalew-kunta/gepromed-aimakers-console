import "server-only";
/**
 * Course (trainings) data access for the SaaS Course Management section.
 * Reads via the service_role client. Returns []/null when unconfigured.
 * Types/constants live in courses-shared.ts (client-safe).
 */
import { supabaseServer } from "./supabase";
import type { Course } from "./courses-shared";

export * from "./courses-shared";

export async function getCourses(): Promise<Course[]> {
  const sb = supabaseServer();
  if (!sb) return [];
  const { data, error } = await sb
    .from("trainings")
    .select("*")
    .order("start_date", { ascending: false });
  if (error || !data) return [];
  return data as Course[];
}

export async function getCourse(slug: string): Promise<Course | null> {
  const sb = supabaseServer();
  if (!sb) return null;
  const { data, error } = await sb
    .from("trainings")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as Course;
}
