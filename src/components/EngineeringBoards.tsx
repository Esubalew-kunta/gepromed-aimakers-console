"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EngineeringRequest } from "@/lib/engineering-data";
import { ENGINEERING_PIPELINES } from "@/lib/pipeline/engineering";
import {
  type PipelineDef,
  getVariant,
  stageLabelOf,
  stageToneOf,
  advanceLabelOf,
} from "@/lib/pipeline/core";
import {
  advanceEngStage,
  setEngVariant,
  setEngExit,
  reopenEng,
} from "@/app/(app)/engineering/actions";

type Kind = "explant" | "test" | "equipment";
const KINDS: { key: Kind; label: string }[] = [
  { key: "explant", label: "Analyse d'explants" },
  { key: "test", label: "Plateforme de tests" },
  { key: "equipment", label: "Location d'équipement" },
];

export function EngineeringBoards({ requests }: { requests: EngineeringRequest[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<Kind>("explant");

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  const rows = useMemo(() => requests.filter((r) => r.kind === kind), [requests, kind]);
  const def = ENGINEERING_PIPELINES[kind];

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {KINDS.map((k) => {
          const n = requests.filter((r) => r.kind === k.key).length;
          const active = kind === k.key;
          return (
            <button
              key={k.key}
              onClick={() => setKind(k.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-brand-600 text-white"
                  : "border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
              }`}
            >
              {k.label}
              <span className={`ml-1.5 ${active ? "text-white/80" : "text-ink-400"}`}>{n}</span>
            </button>
          );
        })}
      </div>

      <div className={`card divide-y divide-ink-100 ${pending ? "opacity-60" : ""}`}>
        {rows.length === 0 ? (
          <p className="p-10 text-center text-ink-400">
            Aucune demande pour ce parcours. Les demandes du site web apparaissent ici.
          </p>
        ) : (
          rows.map((r) => <Row key={r.id} r={r} def={def} run={run} />)
        )}
      </div>
    </>
  );
}

function Row({
  r,
  def,
  run,
}: {
  r: EngineeringRequest;
  def: PipelineDef;
  run: (fn: () => Promise<unknown>) => void;
}) {
  const variantKey = r.variant ?? def.defaultVariantKey;
  const exited = Boolean(r.exited_at);
  const adv = advanceLabelOf(def, variantKey, r.stage);
  const needsVariant = r.kind === "explant" && !r.variant && !exited;

  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-ink-400">{r.ref}</span>
          <span className="font-semibold text-ink-900">{r.requester_name}</span>
          {r.variant ? (
            <span className={`badge ${getVariant(def, variantKey).tone}`}>
              {getVariant(def, variantKey).label}
            </span>
          ) : null}
          {exited ? (
            <span className="badge bg-red-50 text-red-700">{r.exit_reason}</span>
          ) : (
            <span className={`badge ${stageToneOf(def, variantKey, r.stage)}`}>
              {stageLabelOf(def, variantKey, r.stage)}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-500">
          {r.requester_email}
          {r.institution ? ` · ${r.institution}` : ""}
          {r.org_type ? ` · ${r.org_type}` : ""}
          {r.desired_date ? ` · créneau souhaité ${r.desired_date}` : ""}
        </p>
      </div>

      {exited ? (
        <button onClick={() => run(() => reopenEng(r.id))} className="btn-ghost !py-1.5 !text-xs">
          Rouvrir
        </button>
      ) : needsVariant ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-400">Cas :</span>
          <button
            onClick={() => run(() => setEngVariant(r.id, "hospital"))}
            className="btn-ghost !py-1.5 !text-xs"
          >
            Institution
          </button>
          <button
            onClick={() => run(() => setEngVariant(r.id, "industrial"))}
            className="btn-ghost !py-1.5 !text-xs"
          >
            Industriel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {adv ? (
            <button
              onClick={() => run(() => advanceEngStage(r.id, r.kind, r.variant, r.stage))}
              className="btn-primary !py-1.5 !text-xs"
            >
              {adv} →
            </button>
          ) : (
            <span className="badge bg-emerald-50 text-emerald-700">Terminé</span>
          )}
          <button
            onClick={() =>
              run(() => setEngExit(r.id, def.exitStatus === "declined" ? "décliné" : "sans suite"))
            }
            className="rounded-full bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
            title="Sortie du parcours"
          >
            Sortie
          </button>
        </div>
      )}
    </div>
  );
}
