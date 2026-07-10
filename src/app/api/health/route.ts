import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Health check for Render (healthCheckPath: /api/health).
 * Reports demo-mode status and which optional integrations are configured
 *, without ever leaking secret values.
 */
export async function GET() {
  const optional = {
    supabase: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    database: Boolean(process.env.DATABASE_URL),
    openai: Boolean(process.env.OPENAI_API_KEY),
    lms: Boolean(process.env.LMS_API_URL),
    gmail: Boolean(process.env.GMAIL_CLIENT_ID),
    n8n: Boolean(process.env.N8N_WEBHOOK_SECRET),
    googleSso: Boolean(process.env.GOOGLE_CLIENT_ID),
  };

  const anyOptional = Object.values(optional).some(Boolean);

  return NextResponse.json(
    {
      status: "healthy",
      service: "gepromed-ai-console",
      version: "1.0.0",
      demoMode: !anyOptional,
      time: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      integrations: optional,
    },
    { status: 200 },
  );
}
