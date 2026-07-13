import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { ContractTemplates } from "@/components/ContractTemplates";
import { getContractTemplates } from "@/lib/contracts-data";
import { getCourses } from "@/lib/courses-data";

export const dynamic = "force-dynamic";

/** Roles allowed to manage contract templates (Gepromed staff + AI Makers admin). */
const CONTRACT_ROLES = ["admin", "gepromed", "manager"];

export default async function ContractsPage() {
  const user = await getSessionUser();
  if (!user || !CONTRACT_ROLES.includes(user.role)) redirect("/trainees");

  const [templates, courses] = await Promise.all([
    getContractTemplates(),
    getCourses(),
  ]);
  const courseOptions = courses.map((c) => ({ id: c.id, title: c.title.fr }));

  return (
    <>
      <PageHeader
        eyebrow="Documents · Admin"
        title="Contract templates"
        description="Les contrats d'engagement envoyés aux Trainees. Attachez chaque contrat à un ou plusieurs cours : le système sélectionne alors automatiquement le bon contrat selon le cours du Trainee (sinon le contrat par défaut)."
      />
      <ContractTemplates
        templates={templates}
        courses={courseOptions}
        publicBase={process.env.NEXT_PUBLIC_SUPABASE_URL ?? null}
      />
    </>
  );
}
