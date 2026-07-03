import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { demoUsers } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dataSources = [
  {
    name: "Complaint & vigilance records",
    access: "Mock dataset",
    used: "Complaint intake, CAPA drafter, vigilance triage",
    icon: "clipboard-check",
  },
  {
    name: "Technical documentation summaries",
    access: "Provided per-run",
    used: "MDR gap analysis, CER literature summary",
    icon: "shield-check",
  },
  {
    name: "Clinical literature",
    access: "Mock search connector",
    used: "CER literature watch automation",
    icon: "activity",
  },
  {
    name: "Support inbox",
    access: "Mock messages",
    used: "Complaint intake automation",
    icon: "mail",
  },
  {
    name: "Training content library",
    access: "Seeded",
    used: "Training hub, LMS handoff",
    icon: "book",
  },
];

const roleMatrix: Record<string, string[]> = {
  Skills: ["admin", "gepromed", "manager"],
  Automations: ["admin", "manager"],
  "LMS handoff": ["admin", "gepromed", "manager"],
  Integrations: ["admin", "manager"],
  "Feedback (submit)": ["admin", "gepromed", "manager"],
  "User & access admin": ["admin"],
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  gepromed: "Gepromed user",
  manager: "Manager",
};

export default function InputsPage() {
  const users = demoUsers();
  const roles = ["admin", "gepromed", "manager"];

  return (
    <>
      <PageHeader
        eyebrow="Inputs & access"
        title="Inputs & access"
        description="What data feeds the AI Console and who can do what. In the demo, all data sources are mocked or provided per-run — no production data or client credentials are used."
      />

      {/* Data inputs */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
        Data inputs
      </h2>
      <div className="card mb-8 divide-y divide-ink-100">
        {dataSources.map((d) => (
          <div key={d.name} className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon name={d.icon} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink-900">{d.name}</p>
              <p className="text-sm text-ink-500">Used by: {d.used}</p>
            </div>
            <span className="badge bg-amber-100 text-amber-700">{d.access}</span>
          </div>
        ))}
      </div>

      {/* Access matrix */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
        Access by role
      </h2>
      <div className="card mb-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-ink-500">
              <th className="px-5 py-3 font-medium">Capability</th>
              {roles.map((r) => (
                <th key={r} className="px-5 py-3 text-center font-medium">
                  {ROLE_LABELS[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(roleMatrix).map(([cap, allowed]) => (
              <tr key={cap} className="border-b border-ink-50 last:border-0">
                <td className="px-5 py-3 font-medium text-ink-800">{cap}</td>
                {roles.map((r) => (
                  <td key={r} className="px-5 py-3 text-center">
                    {allowed.includes(r) ? (
                      <Icon
                        name="check"
                        className="mx-auto h-4 w-4 text-emerald-600"
                      />
                    ) : (
                      <span className="text-ink-300">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Accounts */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
        Demo accounts
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {users.map((u) => (
          <div key={u.email} className="card p-5">
            <span className="badge bg-brand-100 text-brand-700">
              {ROLE_LABELS[u.role]}
            </span>
            <p className="mt-2 font-semibold text-ink-900">{u.name}</p>
            <p className="text-sm text-ink-500">{u.title}</p>
            <p className="mt-2 truncate text-xs text-ink-400">{u.email}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-5 text-sm text-ink-500">
        <p className="font-semibold text-ink-800">Data-handling posture (demo)</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>No production, patient, or client data is stored.</li>
          <li>Skill outputs are generated offline and are explicitly drafts, not decisions.</li>
          <li>Run history lives in memory and resets on redeploy (no database required).</li>
          <li>Sessions use a signed, http-only cookie; sign-out clears it immediately.</li>
        </ul>
      </div>
    </>
  );
}
