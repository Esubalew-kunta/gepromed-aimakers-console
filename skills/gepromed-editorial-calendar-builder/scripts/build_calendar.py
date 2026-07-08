#!/usr/bin/env python3
"""GEPROMED editorial calendar builder — emit .csv and .md from a JSON spec.

Deterministic exporter for the two-layer content calendar:
  - FIXED layer  = the immediate week (locked, concrete items)
  - ADJUSTABLE layer = the rest of the month (themes, can move)

The model builds the spec (inventing nothing — unknowns stay [bracketed]); this
script renders consistent, on-brand exports the team can open in a sheet or paste
into a doc. It does not invent content; it formats what the spec contains.

Usage:
    python build_calendar.py --spec calendar.json --out-prefix out/june
    cat calendar.json | python build_calendar.py --stdout
    python build_calendar.py --template > calendar.json
Exit 0 on success, 2 on bad input.
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

FIXED_COLS = ["date", "day", "channel", "format", "pillar", "audience",
              "title", "cta", "owner", "status"]
FIXED_HEAD = ["Date", "Day", "Channel", "Format", "Pillar", "Audience",
              "Title/Angle", "CTA", "Owner", "Status"]
ADJ_COLS = ["week", "theme", "topics", "channels", "pillar", "status"]
ADJ_HEAD = ["Week", "Theme", "Candidate topics", "Channel(s)", "Pillar focus", "Status"]


def template() -> dict:
    return {
        "title": "GEPROMED content calendar — [month year]",
        "language": "en",
        "fixed_week": {
            "label": "Week of [start date] (FIXED)",
            "items": [
                {
                    "date": "[YYYY-MM-DD]", "day": "Tue", "channel": "LinkedIn",
                    "format": "text", "pillar": "Explant Analysis",
                    "audience": "manufacturers",
                    "title": "[working title / angle]", "cta": "none",
                    "owner": "Comms", "status": "Fixed",
                },
                {
                    "date": "[YYYY-MM-DD]", "day": "Thu", "channel": "LinkedIn",
                    "format": "carousel", "pillar": "Education",
                    "audience": "participants",
                    "title": "[working title / angle]", "cta": "register [link]",
                    "owner": "Comms", "status": "Fixed",
                },
            ],
        },
        "adjustable_weeks": [
            {
                "week": "Week of [date]", "theme": "[pillar / topic]",
                "topics": "[candidate topics]", "channels": "LinkedIn",
                "pillar": "Clinical Research", "status": "Adjustable",
            },
        ],
    }


def load_spec(args) -> dict:
    if args.spec:
        raw = Path(args.spec).read_text(encoding="utf-8")
    else:
        raw = sys.stdin.read()
    return json.loads(raw)


def cell(row: dict, key: str) -> str:
    return str(row.get(key, "")).strip()


def md_table(headers: list[str], rows: list[list[str]]) -> str:
    out = ["| " + " | ".join(headers) + " |",
           "|" + "|".join(["---"] * len(headers)) + "|"]
    for r in rows:
        out.append("| " + " | ".join(c if c else "—" for c in r) + " |")
    return "\n".join(out)


def render_md(spec: dict) -> str:
    title = spec.get("title", "GEPROMED content calendar")
    fixed = spec.get("fixed_week", {}) or {}
    adj = spec.get("adjustable_weeks", []) or []

    parts = [f"# {title}", ""]
    parts.append(f"## FIXED — immediate week ({fixed.get('label', 'this week')})")
    parts.append("_Locked, ready to brief._\n")
    f_rows = [[cell(it, k) for k in FIXED_COLS] for it in fixed.get("items", [])]
    parts.append(md_table(FIXED_HEAD, f_rows) if f_rows else "_(no fixed items)_")
    parts.append("")
    parts.append("## ADJUSTABLE — rest of the month")
    parts.append("_Themes and placeholders; can move._\n")
    a_rows = [[cell(w, k) for k in ADJ_COLS] for w in adj]
    parts.append(md_table(ADJ_HEAD, a_rows) if a_rows else "_(no adjustable weeks)_")
    parts.append("")
    parts.append("> Draft plan — a GEPROMED communication-function member validates "
                 "before anything is scheduled. Bracketed values must be confirmed.")
    return "\n".join(parts) + "\n"


def render_csv(spec: dict, path: Path) -> None:
    fixed = (spec.get("fixed_week", {}) or {}).get("items", [])
    adj = spec.get("adjustable_weeks", []) or []
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["Layer"] + FIXED_HEAD + ["Theme", "Candidate topics"])
        for it in fixed:
            w.writerow(["Fixed"] + [cell(it, k) for k in FIXED_COLS] + ["", ""])
        for wk in adj:
            # adjustable rows reuse Week->Date col, Pillar, Status; theme/topics at end
            w.writerow([
                "Adjustable", cell(wk, "week"), "", cell(wk, "channels"), "",
                cell(wk, "pillar"), "", "", "", "", cell(wk, "status"),
                cell(wk, "theme"), cell(wk, "topics"),
            ])


def validate(spec: dict) -> list[str]:
    errs = []
    if "fixed_week" not in spec:
        errs.append("missing 'fixed_week'")
    if "adjustable_weeks" not in spec:
        errs.append("missing 'adjustable_weeks'")
    return errs


def main() -> int:
    p = argparse.ArgumentParser(description="GEPROMED editorial calendar builder.")
    p.add_argument("--spec", help="Path to a JSON spec. If omitted (and not --template), reads stdin.")
    p.add_argument("--out-prefix", help="Write <prefix>.csv and <prefix>.md.")
    p.add_argument("--stdout", action="store_true", help="Print the markdown table to stdout.")
    p.add_argument("--template", action="store_true", help="Print a starter JSON spec and exit.")
    args = p.parse_args()

    if args.template:
        print(json.dumps(template(), ensure_ascii=False, indent=2))
        return 0

    try:
        spec = load_spec(args)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        print(f"ERROR: could not load spec: {e}")
        return 2

    errs = validate(spec)
    if errs:
        print("ERROR: invalid spec: " + "; ".join(errs))
        return 2

    md = render_md(spec)

    if args.out_prefix:
        prefix = Path(args.out_prefix)
        prefix.parent.mkdir(parents=True, exist_ok=True)
        md_path = prefix.with_suffix(".md")
        csv_path = prefix.with_suffix(".csv")
        md_path.write_text(md, encoding="utf-8")
        render_csv(spec, csv_path)
        print(f"Wrote {md_path}")
        print(f"Wrote {csv_path}")

    if args.stdout or not args.out_prefix:
        print(md)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
