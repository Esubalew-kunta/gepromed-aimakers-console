#!/usr/bin/env python3
"""Append a learned preference to the skill's MEMORY.md, deterministically.

Keeps the company memory tidy: inserts the entry under the right section,
de-duplicates (case-insensitive), and records a dated line in the Correction log.
This is how the skill "gets closer to correct over time".

Usage:
    python memory_update.py --section "House-style decisions" \
        --entry "EN: job titles use an inclusive form (M/F or neutral)."
    python memory_update.py --section "Approved company facts" \
        --entry "Applicable CCN: [name / IDCC] — confirmed by RAF." \
        --reason "RAF confirmation on 2026-06-20"

Sections (must match a heading in MEMORY.md):
    Approved company facts | House-style decisions | Recurring recipients & context |
    Approved phrasings / snippets | Do / Don't learned

The Correction log is always updated. Exit 0 on success, 2 on bad input.
"""
from __future__ import annotations

import argparse
import datetime as _dt
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_MEMORY = SCRIPT_DIR.parent / "memory" / "MEMORY.md"

VALID_SECTIONS = [
    "Approved company facts",
    "House-style decisions",
    "Recurring recipients & context",
    "Approved phrasings / snippets",
    "Do / Don't learned",
]
LOG_SECTION = "Correction log"
PLACEHOLDER = "- (none yet)"


def load(path: Path) -> list[str]:
    if not path.exists():
        raise FileNotFoundError(f"MEMORY.md not found at {path}")
    return path.read_text(encoding="utf-8").splitlines()


def find_section_bounds(lines: list[str], heading: str) -> tuple[int, int]:
    """Return (start_index_after_heading, end_index_exclusive) for a '## heading'."""
    start = None
    for i, line in enumerate(lines):
        if line.strip() == f"## {heading}":
            start = i + 1
            break
    if start is None:
        raise ValueError(f"Section '## {heading}' not found in MEMORY.md")
    end = len(lines)
    for j in range(start, len(lines)):
        if lines[j].startswith("## "):
            end = j
            break
    return start, end


def already_present(lines: list[str], start: int, end: int, entry: str) -> bool:
    needle = entry.strip().lower().lstrip("- ").strip()
    for line in lines[start:end]:
        existing = line.strip().lower().lstrip("- ").strip()
        if existing and existing == needle:
            return True
    return False


def insert_entry(lines: list[str], heading: str, entry: str) -> bool:
    start, end = find_section_bounds(lines, heading)
    if already_present(lines, start, end, entry):
        return False
    bullet = entry.strip()
    if not bullet.startswith("- "):
        bullet = f"- {bullet}"
    # Drop a "(none yet)" placeholder if present.
    insert_at = end
    for k in range(start, end):
        if lines[k].strip() == PLACEHOLDER:
            lines.pop(k)
            insert_at = k
            break
    else:
        # insert after the last non-empty content line in the section
        insert_at = start
        for k in range(end - 1, start - 1, -1):
            if lines[k].strip():
                insert_at = k + 1
                break
    lines.insert(insert_at, bullet)
    return True


def append_log(lines: list[str], message: str) -> None:
    start, end = find_section_bounds(lines, LOG_SECTION)
    today = _dt.date.today().isoformat()
    entry = f"- {today} — {message}"
    insert_at = end
    for k in range(end - 1, start - 1, -1):
        if lines[k].strip():
            insert_at = k + 1
            break
    lines.insert(insert_at, entry)


def main() -> int:
    parser = argparse.ArgumentParser(description="Append a learned preference to MEMORY.md.")
    parser.add_argument("--section", required=True, help=f"One of: {VALID_SECTIONS}")
    parser.add_argument("--entry", required=True, help="The durable rule to remember.")
    parser.add_argument("--reason", default="", help="Optional context for the correction log.")
    parser.add_argument("--memory", default=str(DEFAULT_MEMORY), help="Path to MEMORY.md.")
    args = parser.parse_args()

    if args.section not in VALID_SECTIONS:
        print(f"ERROR: --section must be one of {VALID_SECTIONS}")
        return 2

    path = Path(args.memory)
    lines = load(path)

    added = insert_entry(lines, args.section, args.entry)
    if added:
        reason = args.reason or f"Added to '{args.section}': {args.entry}"
        append_log(lines, reason)
        path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        print(f"MEMORY updated → [{args.section}] {args.entry}")
    else:
        print(f"No change — already present in [{args.section}]: {args.entry}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
