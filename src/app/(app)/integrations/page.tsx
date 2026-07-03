import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { integrations } from "@/lib/seed/integrations";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  "Connected (mock)": "bg-emerald-100 text-emerald-700",
  Manual: "bg-amber-100 text-amber-700",
  Available: "bg-brand-100 text-brand-700",
  Planned: "bg-ink-100 text-ink-600",
};

export default function IntegrationsPage() {
  // Report which optional env vars are actually set, honestly.
  const configured: Record<string, boolean> = {
    openai: Boolean(process.env.OPENAI_API_KEY),
    gmail: Boolean(process.env.GMAIL_CLIENT_ID),
    lms: Boolean(process.env.LMS_API_URL),
    n8n: Boolean(process.env.N8N_WEBHOOK_SECRET),
    google: Boolean(process.env.GOOGLE_CLIENT_ID),
    postgres: Boolean(process.env.DATABASE_URL),
  };

  return (
    <>
      <PageHeader
        eyebrow="Integrations"
        title="Integrations"
        description="How the console connects to the rest of Gepromed's stack. Statuses are shown honestly: the demo runs everything as manual or mock connectors so it works with zero external credentials."
      />

      <div className="mb-6 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-800">
        <strong>Demo posture:</strong> no external API keys are configured, so
        every integration below operates in manual/mock mode. Each card shows
        exactly which environment variable would switch it to live.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((it) => {
          const live = configured[it.id];
          return (
            <div key={it.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-50 text-ink-600">
                    <Icon name={it.icon} />
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900">{it.name}</p>
                    <p className="text-xs text-ink-400">{it.category}</p>
                  </div>
                </div>
                <span
                  className={`badge ${STATUS_STYLES[it.status] ?? "bg-ink-100 text-ink-600"}`}
                >
                  {live ? "Live (env set)" : it.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-ink-500">{it.description}</p>
              <p className="mt-2 text-xs leading-relaxed text-ink-400">{it.detail}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}
