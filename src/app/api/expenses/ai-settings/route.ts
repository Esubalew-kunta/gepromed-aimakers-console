import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAiProviderSettings,
  getAiProviderEnvDefaults,
  saveAiProviderSettings,
} from "@/lib/expenses/ai-settings";

export const dynamic = "force-dynamic";

function mask(key: string | null): string | null {
  if (!key) return null;
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 6)}••••${key.slice(-4)}`;
}

// Admin-only: view masked status of the AI provider keys (never the raw
// value back) and update them. Extraction itself reads the raw keys directly
// via ai-settings.ts server-side; nothing here exposes them to the browser.
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }
  const settings = await getAiProviderSettings();
  const env = getAiProviderEnvDefaults();
  return NextResponse.json({
    anthropic: {
      configured: Boolean(settings.anthropicApiKey),
      overridden: settings.anthropicOverridden,
      masked: mask(settings.anthropicApiKey),
      model: settings.anthropicModel,
      envKeySet: env.anthropicApiKeySet,
    },
    openai: {
      configured: Boolean(settings.openaiApiKey),
      overridden: settings.openaiOverridden,
      masked: mask(settings.openaiApiKey),
      model: settings.openaiModel,
      envKeySet: env.openaiApiKeySet,
    },
    updatedAt: settings.updatedAt,
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const patch: Parameters<typeof saveAiProviderSettings>[0] = {};
  if ("anthropicApiKey" in body) patch.anthropicApiKey = String(body.anthropicApiKey ?? "").trim() || null;
  if ("anthropicModel" in body) patch.anthropicModel = String(body.anthropicModel ?? "").trim() || null;
  if ("openaiApiKey" in body) patch.openaiApiKey = String(body.openaiApiKey ?? "").trim() || null;
  if ("openaiModel" in body) patch.openaiModel = String(body.openaiModel ?? "").trim() || null;

  try {
    await saveAiProviderSettings(patch, user.email);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
