import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { AutomationRunner } from "@/components/AutomationRunner";
import { automations } from "@/lib/seed/automations";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Paused: "bg-amber-100 text-amber-700",
  Draft: "bg-ink-100 text-ink-600",
};

export default function AutomationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Automations"
        title="Automations & workflows"
        description="Event-driven and scheduled workflows that run Gepromed's routine work. In this demo they execute as deterministic local simulations, no n8n webhook or external service is called."
      />

      <div className="space-y-5">
        {automations.map((a) => (
          <div key={a.id} className="card p-5">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon name="workflow" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900">{a.name}</p>
                    <span
                      className={`badge ${STATUS_STYLES[a.status] ?? "bg-ink-100 text-ink-600"}`}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-ink-500">{a.description}</p>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-ink-400">Trigger</dt>
                    <dd className="font-medium text-ink-700">{a.trigger}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-400">Schedule</dt>
                    <dd className="font-medium text-ink-700">{a.schedule}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-400">Last run</dt>
                    <dd className="font-medium text-ink-700">{a.lastRun}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-400">Runs / month</dt>
                    <dd className="font-medium text-ink-700">{a.runsThisMonth}</dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                    Steps
                  </p>
                  <ol className="space-y-1.5">
                    {a.steps.map((step, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-ink-600">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-500">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="lg:border-l lg:border-ink-100 lg:pl-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Try it
                </p>
                <AutomationRunner name={a.name} log={a.simulate()} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
