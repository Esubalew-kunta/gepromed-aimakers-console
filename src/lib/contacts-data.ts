import "server-only";
/**
 * Contact-message data access. Reads via the service_role client (sees all
 * rows regardless of RLS). Returns [] when Supabase isn't configured.
 */
import { supabaseServer } from "./supabase";

export interface ContactMessage {
  id: string;
  ref: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "archived";
  replied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactReply {
  id: string;
  contact_message_id: string;
  body: string;
  sent_at: string;
}

/** All contact messages, newest first (empty when Supabase absent). */
export async function getContactMessages(): Promise<ContactMessage[]> {
  const sb = supabaseServer();
  if (!sb) return [];
  const { data, error } = await sb
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as ContactMessage[];
}
