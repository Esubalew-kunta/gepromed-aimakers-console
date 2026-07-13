import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { LeadBoard } from "@/components/LeadBoard";
import { getLeads, computeStats } from "@/lib/leads-data";
import { getContractTemplates } from "@/lib/contracts-data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

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
        eyebrow="Pipeline de formation"
        title="Gestion des Trainees"
        description="Deux parcours Trainee, chacun avec ses propres étapes. HelpMeSee (fondation, 7 étapes) : trainee → dates → facture → e-learning (verrou) → accès simulateur → confirmé → terminé. Bootcamps & Workshops (Gepromed, 9 étapes) : trainee → prérequis → pré-inscription → caution/contrat → infos pratiques → e-learning → confirmé → caution remboursée → terminé. Automatise le suivi manuel basé sur Excel."
      />

      {!configured ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Supabase n&apos;est pas configuré : renseignez les clés dans <code>.env.local</code> pour charger les Trainees en direct.
        </div>
      ) : null}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Trainees" value={`${stats.total}`} icon="users" />
        <Kpi label="En cours" value={`${stats.active}`} icon="clock" tone="text-amber-600" />
        <Kpi label="Confirmés" value={`${stats.confirmed}`} icon="check" tone="text-emerald-600" />
        <Kpi label="Terminés" value={`${stats.completed}`} icon="clipboard-check" tone="text-brand-700" />
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
