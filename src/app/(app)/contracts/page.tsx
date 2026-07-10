import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { ContractTemplates } from "@/components/ContractTemplates";
import { getContractTemplates } from "@/lib/contracts-data";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const user = await getSessionUser();
  if (user?.role !== "admin") redirect("/trainees");

  const templates = await getContractTemplates();

  return (
    <>
      <PageHeader
        eyebrow="Documents · Admin"
        title="Contract templates"
        description="The engagement contracts staff send to leads. When a lead is marked deposit-paid, the course's template (or the default) is attached automatically; staff can change it per lead."
      />
      <ContractTemplates
        templates={templates}
        publicBase={process.env.NEXT_PUBLIC_SUPABASE_URL ?? null}
      />
    </>
  );
}
