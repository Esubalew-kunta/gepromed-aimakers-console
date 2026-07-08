#!/usr/bin/env python3
"""GEPROMED ISO text-diff helper (optional).

A deterministic helper that diffs two supplied standard/document versions
(`.txt` / `.md`) and reports, clause by clause where headings are detectable,
what changed. It is a *mechanical* aid for the clause-by-clause gap analysis —
it surfaces real textual differences so the analyst never has to invent them.

Hard rule (no invented clause text): this script only reports text that is
present in the supplied files. It never generates standard wording. The
GEPROMED ISO standards themselves are copyrighted and are NOT bundled — the user
supplies the two text versions to compare.

What it does
------------
- Splits each file into clauses using heading patterns (e.g. "7.1.4", "9.1",
  "Clause 8", Markdown "## 8.1 ...").
- Aligns clauses by their number/heading key.
- Reports per clause: ADDED (only in v2), REMOVED (only in v1), CHANGED
  (text differs), UNCHANGED. For CHANGED clauses it prints a unified line diff.
- Prints a summary count and a gap-analysis scaffold (one row per changed/added/
  removed clause) for the analyst to complete with impact + required action.

Usage
-----
    python iso_diff.py --old v2008.txt --new v2015.txt
    python iso_diff.py --old old.md --new new.md --context 1 --scaffold

Exit codes: 0 = success (diff produced), 2 = bad input/usage.
"""
from __future__ import annotations

import argparse
import difflib
import re
import sys
from pathlib import Path

# Matches "4", "4.1", "7.1.4", optionally prefixed by "Clause"/"Article" and
# markdown hashes. Captures the dotted number as the alignment key.
HEADING_RE = re.compile(
    r"^\s*#{0,6}\s*(?:clause|article|section)?\s*"
    r"(?P<num>\d+(?:\.\d+){0,3})\b[\.\)\:]?\s*(?P<title>.*)$",
    flags=re.IGNORECASE,
)


def read(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"Not found: {path}")
    if path.suffix.lower() not in {".txt", ".md"}:
        raise ValueError(f"Unsupported file type (use .txt/.md): {path.suffix}")
    return path.read_text(encoding="utf-8", errors="replace")


def split_clauses(text: str) -> dict[str, dict]:
    """Return {clause_key: {'title': str, 'body': str, 'order': int}}.

    A clause runs from one detected heading to the next. Text before the first
    heading is stored under the key '_preamble'.
    """
    lines = text.splitlines()
    clauses: dict[str, dict] = {}
    current_key = "_preamble"
    current_title = ""
    buf: list[str] = []
    order = 0

    def flush(key: str, title: str, body_lines: list[str], idx: int) -> None:
        body = "\n".join(body_lines).strip()
        if key in clauses:
            # Duplicate heading key: append to keep all supplied text.
            clauses[key]["body"] += "\n" + body
        else:
            clauses[key] = {"title": title, "body": body, "order": idx}

    for line in lines:
        m = HEADING_RE.match(line)
        if m and m.group("num"):
            flush(current_key, current_title, buf, order)
            order += 1
            current_key = m.group("num")
            current_title = (m.group("title") or "").strip()
            buf = []
        else:
            buf.append(line)
    flush(current_key, current_title, buf, order)

    if "_preamble" in clauses and not clauses["_preamble"]["body"]:
        del clauses["_preamble"]
    return clauses


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def clause_diff(a: str, b: str, context: int) -> str:
    a_lines = a.splitlines() or [""]
    b_lines = b.splitlines() or [""]
    diff = difflib.unified_diff(
        a_lines, b_lines, lineterm="", n=context,
        fromfile="old", tofile="new",
    )
    return "\n".join(diff)


def sort_key(item) -> list[int]:
    key = item
    if key in ("_preamble",):
        return [-1]
    try:
        return [int(p) for p in key.split(".")]
    except ValueError:
        return [9999]


def main() -> int:
    p = argparse.ArgumentParser(description="GEPROMED ISO text-diff helper.")
    p.add_argument("--old", required=True, help="Older version (.txt/.md).")
    p.add_argument("--new", required=True, help="Newer version (.txt/.md).")
    p.add_argument("--context", type=int, default=1, help="Diff context lines.")
    p.add_argument("--scaffold", action="store_true",
                   help="Also print a gap-analysis table scaffold.")
    args = p.parse_args()

    try:
        old = split_clauses(read(Path(args.old)))
        new = split_clauses(read(Path(args.new)))
    except Exception as e:  # noqa: BLE001
        print(f"ERROR: {e}", file=sys.stderr)
        return 2

    keys = sorted(set(old) | set(new), key=sort_key)
    added, removed, changed, unchanged = [], [], [], []

    print("GEPROMED — ISO clause diff")
    print("=" * 30)
    print(f"Old: {args.old}  ({len(old)} clauses detected)")
    print(f"New: {args.new}  ({len(new)} clauses detected)")
    print("Note: only text present in the supplied files is reported; "
          "no clause wording is generated.\n")

    for k in keys:
        if k == "_preamble":
            continue
        in_old, in_new = k in old, k in new
        if in_old and not in_new:
            removed.append(k)
            print(f"[REMOVED] {k} {old[k]['title']}")
        elif in_new and not in_old:
            added.append(k)
            print(f"[ADDED]   {k} {new[k]['title']}")
        else:
            if norm(old[k]["body"]) == norm(new[k]["body"]) and \
               norm(old[k]["title"]) == norm(new[k]["title"]):
                unchanged.append(k)
            else:
                changed.append(k)
                title = new[k]["title"] or old[k]["title"]
                print(f"[CHANGED] {k} {title}")
                d = clause_diff(old[k]["body"], new[k]["body"], args.context)
                if d:
                    for dl in d.splitlines():
                        print(f"    {dl}")
                print()

    print("-" * 30)
    print(f"Summary: {len(added)} added, {len(removed)} removed, "
          f"{len(changed)} changed, {len(unchanged)} unchanged.")

    if args.scaffold:
        print("\nGap-analysis scaffold (complete impact + required action; RQ validates):")
        print("| Clause | Change type | What changed | Impact on GEPROMED QMS | Required action | Owner | Status |")
        print("|---|---|---|---|---|---|---|")
        for k in added:
            print(f"| {k} | Added | (new clause — see file) |  |  | RQ |  |")
        for k in removed:
            print(f"| {k} | Removed | (clause no longer present) |  |  | RQ |  |")
        for k in changed:
            print(f"| {k} | Changed | (see diff above) |  |  | RQ |  |")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
