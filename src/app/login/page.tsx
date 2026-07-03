import { redirect } from "next/navigation";
import { demoUsers, getSessionUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const existing = await getSessionUser();
  if (existing) redirect("/dashboard");

  const { from } = await searchParams;
  const creds = demoUsers().map((u) => ({
    label: u.name,
    email: u.email,
    password: u.password,
    role: u.role,
  }));

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand / value panel */}
      <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-12 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold backdrop-blur">
              G
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-white/70">
                AI MAKERS × GEPROMED
              </p>
              <p className="text-lg font-bold">Gepromed AI Console</p>
            </div>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-bold leading-tight">
            AI that speaks the language of medical devices.
          </h1>
          <p className="mt-4 text-white/80">
            Regulatory gap analyses, clinical evidence summaries, CAPA drafts,
            vigilance triage and automated post-market surveillance — all in one
            secure console, with humans firmly in the loop.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-white/80">
            <li>✓ 8 ready-to-use Gepromed skills</li>
            <li>✓ Event-driven automations &amp; PMS digests</li>
            <li>✓ One-click LMS handoff for enablement</li>
          </ul>
        </div>

        <p className="text-xs text-white/50">
          Private demo environment · No production data · No external APIs
        </p>
      </div>

      {/* Login form */}
      <div className="flex items-center justify-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="text-sm font-semibold text-brand-600">
              AI MAKERS × GEPROMED
            </p>
            <h1 className="text-2xl font-bold text-ink-900">Gepromed AI Console</h1>
          </div>
          <h2 className="text-xl font-bold text-ink-900">Welcome back</h2>
          <p className="mb-6 mt-1 text-sm text-ink-500">
            Sign in to explore the AI Console demo.
          </p>
          <LoginForm from={from ?? "/dashboard"} creds={creds} />
        </div>
      </div>
    </main>
  );
}
