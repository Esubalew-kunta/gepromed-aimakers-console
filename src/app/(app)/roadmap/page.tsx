import { PageHeader } from "@/components/PageHeader";
import { roadmap } from "@/lib/seed/roadmap";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  Shipped: "bg-emerald-100 text-emerald-700",
  "In progress": "bg-brand-100 text-brand-700",
  Next: "bg-amber-100 text-amber-700",
  Exploring: "bg-ink-100 text-ink-600",
};

const ORDER = ["Shipped", "In progress", "Next", "Exploring"];

export default function RoadmapPage() {
  const columns = ORDER.map((status) => ({
    status,
    items: roadmap.filter((r) => r.status === status),
  }));

  return (
    <>
      <PageHeader
        eyebrow="Roadmap"
        title="Product roadmap"
        description="Where the Gepromed AI Console is today and where it's headed. The demo you're using is the Q2 2026 milestone."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        {columns.map((col) => (
          <div key={col.status}>
            <div className="mb-3 flex items-center justify-between">
              <span
                className={`badge ${STATUS_STYLES[col.status]}`}
              >
                {col.status}
              </span>
              <span className="text-xs text-ink-400">{col.items.length}</span>
            </div>
            <div className="space-y-3">
              {col.items.map((item) => (
                <div key={item.id} className="card p-4">
                  <p className="text-xs font-medium text-ink-400">{item.quarter}</p>
                  <p className="mt-1 font-semibold text-ink-900">{item.title}</p>
                  <p className="mt-1 text-sm text-ink-500">{item.description}</p>
                  <p className="mt-3 border-t border-ink-100 pt-2 text-xs text-ink-400">
                    <span className="font-medium text-ink-500">Impact:</span>{" "}
                    {item.impact}
                  </p>
                </div>
              ))}
              {col.items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-ink-200 p-4 text-center text-xs text-ink-400">
                  Nothing here yet
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
