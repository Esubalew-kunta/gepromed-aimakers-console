import "server-only";
/**
 * AI provider keys for expense extraction — DB-backed override on top of the
 * .env values, so an admin can paste/rotate keys from the console without a
 * redeploy. Falls back to env vars when no DB row exists or a field is blank.
 * Cached briefly per server instance to avoid a query on every extraction call.
 */
import { supabaseServer } from "@/lib/supabase";

export interface AiProviderSettings {
  anthropicApiKey: string | null;
  anthropicModel: string | null;
  openaiApiKey: string | null;
  openaiModel: string | null;
  /** True when THAT provider's key is stored in the DB (overriding env) — per provider, not shared. */
  anthropicOverridden: boolean;
  openaiOverridden: boolean;
  updatedAt: string | null;
}

const TTL_MS = 15_000;
let cache: { value: AiProviderSettings; at: number } | null = null;

interface Row {
  anthropic_api_key: string | null;
  anthropic_model: string | null;
  openai_api_key: string | null;
  openai_model: string | null;
  updated_at: string;
}

export async function getAiProviderSettings(): Promise<AiProviderSettings> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

  let row: Row | null = null;
  const sb = supabaseServer();
  if (sb) {
    const { data } = await sb
      .from("ai_provider_settings")
      .select("anthropic_api_key, anthropic_model, openai_api_key, openai_model, updated_at")
      .eq("id", "default")
      .maybeSingle();
    row = (data as Row | null) ?? null;
  }

  const value: AiProviderSettings = {
    anthropicApiKey: row?.anthropic_api_key || process.env.ANTHROPIC_API_KEY || null,
    anthropicModel: row?.anthropic_model || process.env.ANTHROPIC_MODEL || null,
    openaiApiKey: row?.openai_api_key || process.env.OPENAI_API_KEY || null,
    openaiModel: row?.openai_model || process.env.OPENAI_MODEL || null,
    anthropicOverridden: Boolean(row?.anthropic_api_key),
    openaiOverridden: Boolean(row?.openai_api_key),
    updatedAt: row?.updated_at ?? null,
  };
  cache = { value, at: Date.now() };
  return value;
}

/** Which env vars are set, for the settings UI to explain what "Clear" reverts to. */
export function getAiProviderEnvDefaults() {
  return {
    anthropicApiKeySet: Boolean(process.env.ANTHROPIC_API_KEY),
    anthropicModel: process.env.ANTHROPIC_MODEL || null,
    openaiApiKeySet: Boolean(process.env.OPENAI_API_KEY),
    openaiModel: process.env.OPENAI_MODEL || null,
  };
}

export async function saveAiProviderSettings(
  input: Partial<{
    anthropicApiKey: string | null;
    anthropicModel: string | null;
    openaiApiKey: string | null;
    openaiModel: string | null;
  }>,
  updatedBy: string,
): Promise<void> {
  const sb = supabaseServer();
  if (!sb) throw new Error("Supabase not configured");

  const patch: Record<string, unknown> = {
    id: "default",
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  };
  if ("anthropicApiKey" in input) patch.anthropic_api_key = input.anthropicApiKey || null;
  if ("anthropicModel" in input) patch.anthropic_model = input.anthropicModel || null;
  if ("openaiApiKey" in input) patch.openai_api_key = input.openaiApiKey || null;
  if ("openaiModel" in input) patch.openai_model = input.openaiModel || null;

  const { error } = await sb.from("ai_provider_settings").upsert(patch);
  if (error) throw new Error(error.message);
  cache = null;
}
