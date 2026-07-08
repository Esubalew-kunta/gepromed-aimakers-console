#!/usr/bin/env python3
"""Advisory zero-invention scan for RGPD/GDPR drafts.

This is a HELP, not a proof. It flags text patterns that *often* indicate an
invented legal fact — an asserted article number, a concrete retention duration,
a "compliant/lawful" guarantee — so the drafter can confirm each one is either
user-supplied or wrapped in [brackets] for the DPO.

It cannot know whether a value is true. It only surfaces things to double-check.
A clean run does NOT mean the draft is correct; a flagged run means "review these".

Usage:
    python zero_invention_check.py --file draft.md --lang fr
    echo "<draft text>" | python zero_invention_check.py --lang en

Exit codes: 0 = no advisory flags; 1 = flags found (review them); 2 = bad input.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# Patterns that often signal an asserted (possibly invented) legal/factual value.
PATTERNS = [
    (
        "article-reference",
        re.compile(r"\b(article|art\.?)\s*\d+", re.IGNORECASE),
        "Asserted article number — RGPD/GDPR article refs must be [bracketed] for the DPO.",
    ),
    (
        "gdpr-rgpd-cite",
        re.compile(r"\b(RGPD|GDPR)\s*(art\.?|article)?\s*\d", re.IGNORECASE),
        "Citation to RGPD/GDPR with a number — confirm or bracket for the DPO.",
    ),
    (
        "retention-duration",
        re.compile(
            r"\b\d+\s*(an|ans|année|années|mois|jour|jours|year|years|month|months|day|days)\b",
            re.IGNORECASE,
        ),
        "Concrete duration — confirm this retention/delay was supplied, else bracket it.",
    ),
    (
        "compliance-guarantee",
        re.compile(
            r"\b(100\s*%|fully|entièrement|totalement)?\s*(conforme|compliant|lawful|licite|GDPR-proof|RGPD-proof)\b",
            re.IGNORECASE,
        ),
        "Compliance guarantee — never claim 'compliant/lawful'; describe what the doc does.",
    ),
    (
        "dpia-decision",
        re.compile(r"\b(no|aucune|pas d['e]?)\s*(dpia|aipd)\b", re.IGNORECASE),
        "DPIA/AIPD decision — whether one is required is a DPO decision, not the skill's.",
    ),
]


def scan(text: str) -> list[tuple[int, str, str, str]]:
    findings: list[tuple[int, str, str, str]] = []
    for lineno, line in enumerate(text.splitlines(), start=1):
        for name, rx, msg in PATTERNS:
            m = rx.search(line)
            if not m:
                continue
            # If the match sits inside [brackets], treat it as already flagged -> skip.
            snippet = m.group(0)
            bracketed = re.search(r"\[[^\]]*" + re.escape(snippet) + r"[^\]]*\]", line, re.IGNORECASE)
            if bracketed:
                continue
            findings.append((lineno, name, snippet.strip(), msg))
    return findings


def main() -> int:
    p = argparse.ArgumentParser(description="Advisory zero-invention scan for RGPD drafts.")
    p.add_argument("--file", help="Path to the draft file. If omitted, reads stdin.")
    p.add_argument("--lang", default="auto", help="fr | en | auto (advisory only).")
    args = p.parse_args()

    if args.file:
        path = Path(args.file)
        if not path.exists():
            print(f"ERROR: file not found: {path}", file=sys.stderr)
            return 2
        text = path.read_text(encoding="utf-8")
    else:
        text = sys.stdin.read()
    if not text.strip():
        print("ERROR: no input text.", file=sys.stderr)
        return 2

    findings = scan(text)
    if not findings:
        print("zero-invention scan: no advisory flags. (Still confirm facts are sourced or bracketed.)")
        return 0

    print(f"zero-invention scan: {len(findings)} item(s) to review —")
    for lineno, name, snippet, msg in findings:
        print(f"  line {lineno} [{name}] '{snippet}' → {msg}")
    print("\nFor each: confirm it was supplied by the user/DPO, or wrap it in [brackets].")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
