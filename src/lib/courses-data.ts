import "server-only";
/**
 * Course (trainings) data access for the SaaS Course Management section.
 * Reads via the service_role client. Returns []/null when unconfigured.
 * Types/constants live in courses-shared.ts (client-safe).
 */
import { supabaseServer } from "./supabase";
import type { Bi, Course } from "./courses-shared";

export * from "./courses-shared";

/**
 * Map a raw `trainings` row to a Course, defaulting the Qualiopi fields
 * gracefully. The DB columns may not exist yet, so read with nullish defaults
 * so mapping never crashes on rows returned without these columns.
 */
function rowToCourse(row: Record<string, unknown>): Course {
  const bi = (v: unknown): Bi | undefined =>
    v && typeof v === "object" ? (v as Bi) : undefined;
  return {
    ...(row as unknown as Course),
    target_audience: Array.isArray(row.target_audience)
      ? (row.target_audience as string[])
      : [],
    prerequisites: bi(row.prerequisites),
    pedagogical_resources: bi(row.pedagogical_resources),
    teaching_methods: bi(row.teaching_methods),
    evaluation_methods: bi(row.evaluation_methods),
    supervision_organization: bi(row.supervision_organization),
  };
}

export async function getCourses(): Promise<Course[]> {
  const sb = supabaseServer();
  if (!sb) return [];
  const { data, error } = await sb
    .from("trainings")
    .select("*")
    .order("start_date", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToCourse);
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
  return rowToCourse(data as Record<string, unknown>);
}
