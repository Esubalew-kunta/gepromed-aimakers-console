import { PageHeader } from "@/components/PageHeader";
import { FeedbackForm } from "@/components/FeedbackForm";
import { recentFeedback } from "@/lib/store";

export const dynamic = "force-dynamic";

const SENTIMENT_STYLES: Record<string, string> = {
  positive: "bg-emerald-100 text-emerald-700",
  neutral: "bg-ink-100 text-ink-600",
  negative: "bg-amber-100 text-amber-700",
};

const seededFeedback = [
  {
    user: "Camille Roussel",
    page: "Skills catalog",
    sentiment: "positive",
    message:
      "The MDR gap analysis is exactly the structure our RA team uses. Huge time-saver.",
    when: "Yesterday",
  },
  {
    user: "Étienne Marchand",
    page: "Automations",
    sentiment: "positive",
    message: "Love that I can see the run log without wiring up n8n first.",
    when: "2 days ago",
  },
  {
    user: "Quality team",
    page: "LMS handoff",
    sentiment: "neutral",
    message: "Would like to preview the module in the LMS theme before publishing.",
    when: "4 days ago",
  },
];

export default function FeedbackPage() {
  const live = recentFeedback(20);

  return (
    <>
      <PageHeader
        eyebrow="Feedback"
        title="Feedback"
        description="Tell us what's working and what's missing. In the demo, feedback is stored in memory for this session (it resets on redeploy)."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <FeedbackForm />

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
            Recent feedback
          </h2>
          <div className="space-y-3">
            {live.map((f) => (
              <div key={f.id} className="card p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink-900">{f.user}</span>
                  <span className={`badge ${SENTIMENT_STYLES[f.sentiment]}`}>
                    {f.sentiment}
                  </span>
                </div>
                <p className="text-sm text-ink-600">{f.message}</p>
                <p className="mt-1 text-xs text-ink-400">
                  {f.page} · just now (this session)
                </p>
              </div>
            ))}

            {seededFeedback.map((f, i) => (
              <div key={i} className="card p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink-900">{f.user}</span>
                  <span className={`badge ${SENTIMENT_STYLES[f.sentiment]}`}>
                    {f.sentiment}
                  </span>
                </div>
                <p className="text-sm text-ink-600">{f.message}</p>
                <p className="mt-1 text-xs text-ink-400">
                  {f.page} · {f.when}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
