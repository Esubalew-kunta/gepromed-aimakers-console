"use client";

import { PageHeader } from "@/components/PageHeader";
import { useT } from "@/lib/i18n";

export function ExpensesHeader() {
  const t = useT();
  return (
    <PageHeader
      eyebrow={t("expenses.eyebrow")}
      title={t("expenses.title")}
      description={t("expenses.description")}
    />
  );
}
