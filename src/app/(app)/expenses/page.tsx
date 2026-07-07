import { PageHeader } from "@/components/PageHeader";
import { ExpenseRunner } from "@/components/ExpenseRunner";

export const dynamic = "force-dynamic";

export default function ExpensesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Expense reports"
        description="Drop in travel receipts and get them read, currency-converted, categorized and filed into a trip workbook — no manual retyping."
      />

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
        Demo mode · Reading the receipts and looking up exchange rates is
        simulated for this walkthrough. The drag-and-drop, the review step and
        the downloaded workbook are real.
      </div>

      <ExpenseRunner />
    </>
  );
}
