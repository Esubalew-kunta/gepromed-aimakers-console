import "server-only";
/**
 * Notification templates data-access (Master Plan Decision 2).
 * Copy lives in the `notification_templates` DB table so staff edit wording
 * without touching automations; this module just reads them for the app / n8n
 * to render. Returns [] when Supabase or the table isn't present yet, so the
 * console degrades gracefully before the migration is applied.
 */
import { supabaseServer } from "../supabase";

export type NotificationTrigger = "stage_enter" | "reminder" | "manual";

export interface NotificationTemplate {
  key: string;
  pipeline: string;
  variant: string | null;
  stage: string | null;
  trigger: NotificationTrigger;
  sender: string;
  lang: string;
  subject: string;
  body: string;
  attachments: string[];
  active: boolean;
}

/** Templates for a pipeline (all pipelines if omitted). Active-only by default. */
export async function getNotificationTemplates(
  pipeline?: string,
  opts: { includeInactive?: boolean } = {},
): Promise<NotificationTemplate[]> {
  const sb = supabaseServer();
  if (!sb) return [];
  let sel = sb.from("notification_templates").select("*");
  if (pipeline) sel = sel.eq("pipeline", pipeline);
  if (!opts.includeInactive) sel = sel.eq("active", true);
  const { data, error } = await sel.order("key");
  if (error || !data) return [];
  return data as NotificationTemplate[];
}
