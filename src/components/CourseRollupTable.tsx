"use client";

import { useMemo } from "react";
import { type Lead, normalizeParcours } from "@/lib/leads-shared";
import { useT, useLang } from "@/lib/i18n";

const fmtDay = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const euro = (n: number) => "€" + Math.round(n).toLocaleString("fr-FR");

type CourseGroup = {
  trainingId: string;
  title: string;
  city: string;
  startDate: string;
  endDate: string;
  capacity: number;
  enrolled: number;
  // HelpMeSee side — invoice_paid_at genuinely marks full tuition paid, safe to use.
  helpmeseeCount: number;
  helpmeseeInvoicesPaid: number;
  helpmeseePriceEur: number;
  // Bootcamp side — the system only tracks the €200 refundable deposit; there is no
  // field recording whether the actual tuition was paid (handled manually outside this
  // platform per the client). Reported as "deposits collected", never as course revenue.
  bootcampCount: number;
  bootcampDepositsCollected: number;
  bootcampDepositEur: number;
};

/**
 * Phase A of the course rollup (see TRAINEE_COURSE_ROLLUP_PLAN.md): one row per
 * course/session instead of per trainee, showing fill rate and financial tracking.
 * Deliberately additive — reads the same `leads` prop already fetched on the page,
 * does not touch LeadBoard or TraineeSummaryTable.
 *
 * Financial metrics are kept separate per parcours rather than blended into one
 * "revenue" figure: HelpMeSee's invoice_paid_at genuinely marks full tuition paid,
 * but Bootcamp only tracks the €200 deposit — actual tuition is handled manually
 * outside this platform, so it is reported as "deposits collected", not revenue.
 */
export function CourseRollupTable({
  leads,
  onSelectCourse,
}: {
  leads: Lead[];
  /** Optional click-through: reports the training_id when a course row is
   * clicked, so a parent can jump to the Summary tab pre-filtered to it. */
  onSelectCourse?: (trainingId: string) => void;
}) {
  const t = useT();
  const { lang } = useLang();

  const courses = useMemo(() => {
    const groups = new Map<string, CourseGroup>();
    for (const l of leads) {
      if (!l.training_id || !l.trainings) continue;
      const tr = l.trainings;
      let g = groups.get(l.training_id);
      if (!g) {
        g = {
          trainingId: l.training_id,
          title: tr.title[lang] ?? tr.title.fr,
          city: tr.city,
          startDate: tr.start_date,
          endDate: tr.end_date,
          capacity: tr.capacity ?? 0,
          enrolled: tr.enrolled ?? 0,
          helpmeseeCount: 0,
          helpmeseeInvoicesPaid: 0,
          helpmeseePriceEur: tr.price_eur,
          bootcampCount: 0,
          bootcampDepositsCollected: 0,
          bootcampDepositEur: tr.deposit_eur,
        };
        groups.set(l.training_id, g);
      }
      const parcours = normalizeParcours(l);
      if (parcours === "helpmesee") {
        g.helpmeseeCount += 1;
        if (l.invoice_paid_at) g.helpmeseeInvoicesPaid += 1;
      } else {
        g.bootcampCount += 1;
        if (l.deposit_contract_at || l.caution_waived) g.bootcampDepositsCollected += 1;
      }
    }
    return Array.from(groups.values()).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [leads, lang]);

  return (
    <div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs font-bold uppercase tracking-wide text-ink-400">
              <th className="px-5 py-3">{t("courseRollup.colCourse")}</th>
              <th className="px-5 py-3">{t("courseRollup.colDates")}</th>
              <th className="px-5 py-3">{t("courseRollup.colFillRate")}</th>
              <th className="px-5 py-3">{t("courseRollup.colFinancials")}</th>
              <th className="px-5 py-3">{t("courseRollup.colOutstanding")}</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-ink-400">
                  {t("courseRollup.empty")}
                </td>
              </tr>
            ) : (
              courses.map((c) => {
                const fillPct = c.capacity > 0 ? Math.round((c.enrolled / c.capacity) * 100) : 0;
                const helpmeseeOutstanding = c.helpmeseeCount - c.helpmeseeInvoicesPaid;
                const bootcampOutstanding = c.bootcampCount - c.bootcampDepositsCollected;

                return (
                  <tr
                    key={c.trainingId}
                    onClick={onSelectCourse ? () => onSelectCourse(c.trainingId) : undefined}
                    className={`border-b border-ink-50 ${onSelectCourse ? "cursor-pointer transition hover:bg-ink-50" : ""}`}
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink-900">{c.title}</p>
                      <p className="text-xs text-ink-400">{c.city}</p>
                    </td>
                    <td className="px-5 py-3 text-ink-700">
                      {fmtDay(c.startDate)} – {fmtDay(c.endDate)}
                    </td>
                    <td className="px-5 py-3">
                      <p className="mb-1 text-xs text-ink-500">
                        {t("courseRollup.seats", { enrolled: c.enrolled, capacity: c.capacity })}
                      </p>
                      <div className="h-2 w-32 rounded-full bg-ink-100">
                        <div
                          className="h-2 rounded-full bg-brand-500"
                          style={{ width: `${Math.min(100, fillPct)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {c.helpmeseeCount > 0 ? (
                        <p className="text-ink-700">
                          {t("courseRollup.invoicesPaid")}: {euro(c.helpmeseeInvoicesPaid * c.helpmeseePriceEur)}{" "}
                          <span className="text-ink-400">
                            {t("courseRollup.ofExpected", { expected: euro(c.helpmeseeCount * c.helpmeseePriceEur) })}
                          </span>
                        </p>
                      ) : null}
                      {c.bootcampCount > 0 ? (
                        <p className="mt-1 text-ink-700">
                          {t("courseRollup.depositsCollected")}: {euro(c.bootcampDepositsCollected * c.bootcampDepositEur)}{" "}
                          <span className="text-ink-400">
                            {t("courseRollup.ofExpected", { expected: euro(c.bootcampCount * c.bootcampDepositEur) })}
                          </span>
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {helpmeseeOutstanding > 0 ? (
                        <p className="text-amber-700">
                          {t("courseRollup.outstandingInvoices", {
                            count: helpmeseeOutstanding,
                            plural: helpmeseeOutstanding === 1 ? "" : "s",
                          })}
                        </p>
                      ) : null}
                      {bootcampOutstanding > 0 ? (
                        <p className="mt-1 text-amber-700">
                          {t("courseRollup.outstandingDeposits", {
                            count: bootcampOutstanding,
                            plural: bootcampOutstanding === 1 ? "" : "s",
                          })}
                        </p>
                      ) : null}
                      {helpmeseeOutstanding <= 0 && bootcampOutstanding <= 0 ? (
                        <span className="text-ink-300">—</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-400">{t("courseRollup.tuitionNote")}</p>
    </div>
  );
}
