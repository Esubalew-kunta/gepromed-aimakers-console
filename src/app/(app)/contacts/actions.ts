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

/** Clear the recorded reply (undoes the "Replied" indicator). */
export async function clearContactReply(id: string) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb
    .from("contact_messages")
    .update({ replied_at: null, last_reply: null })
    .eq("id", id);
  revalidatePath("/contacts");
}

/**
 * Send a reply to a contact message via the email-sending webhook (currently
 * backed by n8n, invisible to staff). Env-gated by `CONTACT_EMAIL_WEBHOOK_URL`,
 * authed with `N8N_WEBHOOK_SECRET`, never throws. On success, marks the
 * message read and records the reply (timestamp + body) for the "Replied"
 * indicator in the list.
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
      await sb
        .from("contact_messages")
        .update({ status: "read", replied_at: new Date().toISOString(), last_reply: input.body })
        .eq("id", input.messageId);
    }
    revalidatePath("/contacts");
    return { ok: true };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}
