"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase";
import type { ContactReply } from "@/lib/contacts-data";

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

/** Full reply history for a message, oldest first. Returns [] until sent. */
export async function getContactReplies(messageId: string): Promise<ContactReply[]> {
  const sb = supabaseServer();
  if (!sb) return [];
  const { data, error } = await sb
    .from("contact_replies")
    .select("*")
    .eq("contact_message_id", messageId)
    .order("sent_at", { ascending: true });
  if (error || !data) return [];
  return data as ContactReply[];
}

/** Delete all recorded replies for a message (undoes the "Replied" indicator). */
export async function clearContactReplies(id: string) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb.from("contact_replies").delete().eq("contact_message_id", id);
  await sb.from("contact_messages").update({ replied_at: null }).eq("id", id);
  revalidatePath("/contacts");
}

/**
 * Send a reply to a contact message via the email-sending webhook (currently
 * backed by n8n, invisible to staff). Env-gated by `CONTACT_EMAIL_WEBHOOK_URL`,
 * authed with `N8N_WEBHOOK_SECRET`, never throws. On success, marks the
 * message read and appends the reply to its history.
 */
export async function sendContactReply(input: {
  messageId: string;
  ref: string | null;
  to: string;
  subject: string;
  body: string;
}): Promise<{ ok: boolean; reason?: "not_configured" | "unreachable" | string }> {
  const url = process.env.CONTACT_EMAIL_WEBHOOK_URL;
  if (!url) return { ok: false, reason: "not_configured" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET ?? "",
      },
      body: JSON.stringify({
        messageId: input.messageId,
        ref: input.ref,
        to: input.to,
        subject: input.subject,
        body: input.body,
      }),
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const sb = supabaseServer();
    if (sb) {
      await sb.from("contact_replies").insert({
        contact_message_id: input.messageId,
        body: input.body,
      });
      await sb
        .from("contact_messages")
        .update({ status: "read", replied_at: new Date().toISOString() })
        .eq("id", input.messageId);
    }
    revalidatePath("/contacts");
    return { ok: true };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}
