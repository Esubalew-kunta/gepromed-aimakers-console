import { ExpensesHeader } from "@/components/ExpensesHeader";
import { ExpenseRunner } from "@/components/ExpenseRunner";

export const dynamic = "force-dynamic";

export default function ExpensesPage() {
  return (
    <>
      <ExpensesHeader />
      <ExpenseRunner />
    </>
  );
}
