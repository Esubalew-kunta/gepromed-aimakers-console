"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

/**
 * Export the skill output as Markdown, Word (.doc) or PDF (via print).
 * - Markdown: the raw model output.
 * - Word/PDF: the *rendered* HTML (passed via getHtml) wrapped in a styled doc,
 *   so tables, headings and lists carry over. No external library needed.
 */

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "gepromed-skill-output"
  );
}

function styledDoc(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body{font-family:Calibri,Arial,sans-serif;color:#1f2430;line-height:1.5;max-width:800px;margin:32px auto;padding:0 24px;}
  h1{font-size:22px;} h2{font-size:18px;margin-top:1.2em;} h3{font-size:15px;} h4{font-size:14px;}
  table{border-collapse:collapse;width:100%;margin:12px 0;}
  th,td{border:1px solid #c9ced6;padding:6px 10px;text-align:left;font-size:13px;}
  th{background:#f1f4f8;}
  blockquote{border-left:3px solid #c9ced6;margin:8px 0;padding:4px 12px;color:#495060;}
  code{background:#f1f4f8;padding:1px 4px;border-radius:3px;font-size:12px;}
  pre{background:#f1f4f8;padding:10px;border-radius:6px;overflow:auto;}
  hr{border:none;border-top:1px solid #dfe3ea;margin:16px 0;}
  .doc-header{border-bottom:2px solid #2f6df6;padding-bottom:8px;margin-bottom:16px;}
  .doc-header .brand{color:#2f6df6;font-weight:700;font-size:13px;}
</style></head>
<body><div class="doc-header"><div class="brand">Gepromed AI Console</div><div style="font-size:12px;color:#6b7280">${title}</div></div>
${bodyHtml}</body></html>`;
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ExportMenu({
  markdown,
  getHtml,
  title = "Skill output",
}: {
  markdown: string;
  getHtml: () => string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const base = slug(title);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const exportMarkdown = () =>
    download(`${base}.md`, markdown, "text/markdown;charset=utf-8");

  const exportWord = () =>
    download(
      `${base}.doc`,
      styledDoc(title, getHtml()),
      "application/msword",
    );

  const exportPdf = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(styledDoc(title, getHtml()));
    w.document.close();
    w.focus();
    // Give the new window a tick to render before invoking print → Save as PDF.
    setTimeout(() => w.print(), 300);
  };

  const item =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost px-3 py-1.5 text-xs"
      >
        <Icon name="database" className="h-4 w-4" /> Export
        <span className="text-ink-400">▾</span>
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-ink-100 bg-white shadow-lg">
          <button
            className={item}
            onClick={() => {
              exportMarkdown();
              setOpen(false);
            }}
          >
            <Icon name="copy" className="h-4 w-4 text-ink-400" /> Markdown (.md)
          </button>
          <button
            className={item}
            onClick={() => {
              exportWord();
              setOpen(false);
            }}
          >
            <Icon name="book" className="h-4 w-4 text-ink-400" /> Word (.doc)
          </button>
          <button
            className={item}
            onClick={() => {
              exportPdf();
              setOpen(false);
            }}
          >
            <Icon name="clipboard-check" className="h-4 w-4 text-ink-400" /> PDF (print)
          </button>
        </div>
      ) : null}
    </div>
  );
}
