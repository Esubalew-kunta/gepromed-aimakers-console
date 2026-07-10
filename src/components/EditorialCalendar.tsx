import { editorialCalendar, type EditorialItem } from "@/lib/seed/dashboard";
import { Icon } from "./Icon";

const CHANNEL_TONE: Record<EditorialItem["channel"], string> = {
  LinkedIn: "bg-sky-50 text-sky-700",
  Blog: "bg-violet-50 text-violet-700",
  Newsletter: "bg-amber-50 text-amber-700",
  "Congrès": "bg-emerald-50 text-emerald-700",
};

const STATUS_TONE: Record<EditorialItem["status"], string> = {
  planned: "bg-ink-100 text-ink-500",
  draft: "bg-amber-100 text-amber-700",
  scheduled: "bg-sky-100 text-sky-700",
  published: "bg-emerald-100 text-emerald-700",
};

const STATUS_LABEL: Record<EditorialItem["status"], string> = {
  planned: "Prévu",
  draft: "Brouillon",
  scheduled: "Programmé",
  published: "Publié",
};

function fmtDay(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("fr-FR", { day: "2-digit" }),
    mon: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
  };
}

export function EditorialCalendar() {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Icon name="map" className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold text-ink-900">Editorial calendar</h2>
        </div>
        <span className="text-xs text-ink-400">{editorialCalendar.length} à venir</span>
      </div>

      <ul className="divide-y divide-ink-100">
        {editorialCalendar.map((it, i) => {
          const { day, mon } = fmtDay(it.date);
          return (
            <li
              key={i}
              className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-ink-50"
            >
              <div className="flex w-11 shrink-0 flex-col items-center rounded-lg bg-ink-50 py-1.5">
                <span className="text-sm font-bold leading-none text-ink-900">{day}</span>
                <span className="text-[10px] uppercase tracking-wide text-ink-400">{mon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">{it.title}</p>
                <span className={`badge mt-1 ${CHANNEL_TONE[it.channel]}`}>{it.channel}</span>
              </div>
              <span className={`badge shrink-0 ${STATUS_TONE[it.status]}`}>
                {STATUS_LABEL[it.status]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
