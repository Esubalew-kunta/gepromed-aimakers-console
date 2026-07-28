import { ExpensesHeader } from "@/components/ExpensesHeader";
import { ExpenseRunner } from "@/components/ExpenseRunner";
import { AiProviderSettingsCard } from "@/components/AiProviderSettingsCard";

export const dynamic = "force-dynamic";

export default function ExpensesPage() {
  return (
    <>
      <ExpensesHeader />
      <AiProviderSettingsCard />
      <ExpenseRunner />
    </>
  );
}
