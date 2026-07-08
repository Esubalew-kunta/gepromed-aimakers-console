import { PageHeader } from "@/components/PageHeader";
import { ExpenseRunner } from "@/components/ExpenseRunner";

export const dynamic = "force-dynamic";

export default function ExpensesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Finance · Notes de frais"
        title="Notes de frais"
        description="Déposez les justificatifs : lecture IA, conversion des devises au taux officiel de la date d'émission, catégorisation, puis ajout dans le fichier Matrice de Nathalie (une feuille par voyage). Vous vérifiez et validez à la fin."
      />

      <ExpenseRunner />
    </>
  );
}
