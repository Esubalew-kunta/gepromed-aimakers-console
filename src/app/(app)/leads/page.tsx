import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { LeadBoard } from "@/components/LeadBoard";
import { getLeads, computeStats } from "@/lib/leads-data";
import { getContractTemplates } from "@/lib/contracts-data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function euro(n: number): string {
  return n.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

export default async function LeadsPage() {
  const configured = isSupabaseConfigured();
  const user = await getSessionUser();
  const isAdmin = user?.role === "admin";
  const leads = await getLeads();
  const templates = await getContractTemplates();
  const publicBase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const stats = computeStats(leads);

  return (
    <>
      <PageHeader
        eyebrow="Training pipeline"
        title="Lead management"
        description="Two participant parcours, each with its own steps. HelpMeSee (foundation): lead → enrollment form → dates → facture → e-learning → accès simulateur → confirmé → terminé. Bootcamps & Workshops (Gepromed): lead → prérequis → pré-inscription → caution/contrat → infos pratiques → e-learning → confirmé → caution remboursée → terminé. Automates Nicole's manual, Excel-based follow-up."
      />

      {!configured ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Supabase isn&apos;t configured — set the keys in <code>.env.local</code> to load live leads.
        </div>
      ) : null}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Requests" value={`${stats.total}`} icon="users" />
        <Kpi label="Leads to follow up" value={`${stats.toFollow}`} icon="clock" tone="text-amber-600" />
        <Kpi label="Confirmed" value={`${stats.confirmed}`} icon="check" tone="text-emerald-600" />
        <Kpi label="Potential deposits" value={euro(stats.potentialDeposits)} icon="database" tone="text-brand-700" />
      </div>

      <div className="mt-8">
        <LeadBoard leads={leads} isAdmin={isAdmin} templates={templates} publicBase={publicBase} />
      </div>
    </>
  );
}

function Kpi({
  label,
  value,
  icon,
  tone = "text-ink-900",
}: {
  label: string;
  value: string;
  icon: string;
  tone?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">{label}</p>
        <Icon name={icon} className="h-4 w-4 text-ink-300" />
      </div>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
