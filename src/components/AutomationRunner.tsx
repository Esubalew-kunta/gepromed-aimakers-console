"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export interface LogLine {
  line: string;
  kind: "info" | "ok" | "warn";
}

const KIND_COLORS: Record<LogLine["kind"], string> = {
  info: "text-ink-400",
  ok: "text-emerald-400",
  warn: "text-amber-400",
};

export function AutomationRunner({
  name,
  log,
}: {
  name: string;
  log: LogLine[];
}) {
  const [running, setRunning] = useState(false);
  const [shown, setShown] = useState<LogLine[]>([]);
  const [done, setDone] = useState(false);

  const run = () => {
    if (running) return;
    setRunning(true);
    setDone(false);
    setShown([]);
    // Reveal one line at a time. Capture each `item` directly (never the
    // shared index) so the state updater can't read a stale/overshot index.
    log.forEach((item, idx) => {
      setTimeout(() => {
        setShown((prev) => [...prev, item]);
        if (idx === log.length - 1) {
          setRunning(false);
          setDone(true);
        }
      }, 200 + idx * 420);
    });
  };

  return (
    <div>
      <button className="btn-primary w-full" onClick={run} disabled={running}>
        {running ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Running…
          </>
        ) : (
          <>
            <Icon name="play" className="h-4 w-4" /> Run now (simulated)
          </>
        )}
      </button>

      {shown.length > 0 ? (
        <div className="mt-3 rounded-xl bg-ink-900 p-4 font-mono text-xs leading-relaxed">
          <p className="mb-2 text-ink-500">
            $ run automation &quot;{name}&quot;
          </p>
          {shown.map((l, i) =>
            l ? (
              <div key={i} className={KIND_COLORS[l.kind]}>
                {l.line}
              </div>
            ) : null,
          )}
          {done ? (
            <p className="mt-2 text-emerald-400">exit code 0 · demo mode</p>
          ) : (
            <span className="inline-block h-3 w-2 animate-pulse bg-ink-500" />
          )}
        </div>
      ) : null}
    </div>
  );
}
