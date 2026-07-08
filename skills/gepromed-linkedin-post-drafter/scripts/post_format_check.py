#!/usr/bin/env python3
"""GEPROMED LinkedIn post format + brand-voice checker (FR/EN).

A deterministic safety net for a drafted LinkedIn post. Adapted from the email
skill's brand_voice_check.py. It flags, per format:
  - hook presence (a real first line, not a templated/hype opener)
  - length window for the chosen format (text/carousel/image/event/publication)
  - hashtag count (must be 3-6)
  - emoji discipline (<=1 functional; none in publication; never first char)
  - hype / salesy terms
  - AI-look tells (templated openers, em-dash overload, triad tic)
It reports — it does not rewrite. The model owns the final judgment.

Usage:
    python post_format_check.py --file draft.txt --format text --lang en
    echo "<draft>" | python post_format_check.py --format event --lang fr
    python post_format_check.py --file draft.txt --format publication --json
Exit code 0 = PASS (no errors), 1 = errors/warnings present.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, asdict

# Word-count windows per format (min, max). From references/formats.md.
LENGTH_WINDOWS = {
    "text": (60, 220),
    "carousel": (40, 120),   # the accompanying caption
    "image": (40, 180),      # the caption
    "event": (70, 200),
    "publication": (80, 220),
}

HYPE_TERMS = [
    # EN
    "world-class", "world class", "best-in-class", "best in class", "game-changer",
    "game changer", "game-changing", "cutting-edge", "cutting edge", "revolutionary",
    "amazing", "incredible", "unparalleled", "synergy", "leverage", "best in europe",
    "number one", "top-notch", "thrilled", "next-level", "groundbreaking",
    # FR
    "incroyable", "révolutionnaire", "leader mondial", "le meilleur", "la meilleure",
    "unique en son genre", "exceptionnel", "incontournable", "à la pointe",
]

SALESY = [
    "don't miss", "dont miss", "act now", "limited time", "hurry", "last chance",
    "réservez vite", "dépêchez-vous", "ne manquez pas", "à ne pas manquer",
    "offre limitée", "places s'envolent",
]

# Templated / AI-ish openers that read as machine-generated or marketing.
BAD_OPENERS = [
    "in today's fast-paced world", "in today's fast paced world",
    "in an ever-evolving", "in an ever evolving", "in the world of",
    "we are excited to announce", "we are excited to share",
    "we are thrilled to announce", "we are proud to announce",
    "we are pleased to share", "we are pleased to announce",
    "did you know that", "it goes without saying", "needless to say",
    "ravi de vous annoncer", "heureux de vous annoncer", "fiers de vous annoncer",
    "nous avons le plaisir de", "nous sommes ravis", "nous sommes fiers",
    "saviez-vous que",
]

# Hook markers: signs the first line is a real, concrete hook.
EMOJI_RE = re.compile(
    "[" "\U0001F300-\U0001FAFF" "\U00002600-\U000027BF" "\U0001F1E6-\U0001F1FF" "←-⇿" "]",
    flags=re.UNICODE,
)

HASHTAG_RE = re.compile(r"(?<!\w)#\w+", flags=re.UNICODE)
MAX_EMOJI = 1


@dataclass
class Finding:
    severity: str   # "error" | "warn"
    code: str
    message: str


def read_text(args) -> str:
    if args.file:
        return open(args.file, "r", encoding="utf-8").read()
    return sys.stdin.read()


def find_terms(text_low: str, terms: list[str]) -> list[str]:
    return [t for t in terms if re.search(r"(?<!\w)" + re.escape(t) + r"(?!\w)", text_low)]


def strip_label(text: str) -> str:
    """Remove a leading '═══ … ═══' banner / 'Caption:' label so we judge the body."""
    out = re.sub(r"(?m)^\s*[═=]{2,}.*[═=]{2,}\s*$", "", text)
    out = re.sub(r"(?im)^\s*(caption|légende)\s*:\s*", "", out)
    return out.strip()


def word_count(text: str) -> int:
    # Count words excluding hashtag block lines.
    body = HASHTAG_RE.sub("", text)
    return len([w for w in re.split(r"\s+", body.strip()) if w])


def first_meaningful_line(text: str) -> str:
    for line in text.splitlines():
        s = line.strip()
        if s:
            return s
    return ""


def check(text: str, fmt: str) -> list[Finding]:
    findings: list[Finding] = []
    body = strip_label(text)
    low = body.lower()

    # --- hype / salesy / templated openers ---
    for term in find_terms(low, HYPE_TERMS):
        findings.append(Finding("error", "hype", f'Hype/anti-brand term: "{term}"'))
    for term in find_terms(low, SALESY):
        findings.append(Finding("error", "salesy", f'Salesy CTA: "{term}"'))
    for term in find_terms(low, BAD_OPENERS):
        findings.append(Finding("error", "opener", f'Templated/AI opener: "{term}"'))

    # --- hook presence ---
    first = first_meaningful_line(body)
    if not first:
        findings.append(Finding("error", "hook", "No hook / first line detected."))
    else:
        first_low = first.lower()
        if any(first_low.startswith(o) for o in BAD_OPENERS):
            findings.append(Finding("error", "hook", "Hook is a templated opener — rewrite."))
        if EMOJI_RE.match(first):
            findings.append(Finding("error", "hook", "Hook starts with an emoji — not allowed."))
        if len(first.split()) < 3:
            findings.append(Finding("warn", "hook", "Hook is very short; confirm it earns the click."))

    # --- length window per format ---
    lo, hi = LENGTH_WINDOWS.get(fmt, LENGTH_WINDOWS["text"])
    wc = word_count(body)
    if wc < lo:
        findings.append(Finding("warn", "length", f"{wc} words — below the {fmt} window ({lo}-{hi})."))
    elif wc > hi:
        findings.append(Finding("warn", "length", f"{wc} words — above the {fmt} window ({lo}-{hi})."))

    # --- hashtags 3-6 ---
    tags = HASHTAG_RE.findall(text)
    n = len(tags)
    if n < 3:
        findings.append(Finding("error", "hashtags", f"{n} hashtag(s) — need 3-6."))
    elif n > 6:
        findings.append(Finding("error", "hashtags", f"{n} hashtags — max is 6."))

    # --- emoji discipline ---
    emojis = [e for e in EMOJI_RE.findall(body) if e not in tags]
    # arrows used as 'swipe' are tolerated but still counted toward the cap
    if fmt == "publication" and emojis:
        findings.append(Finding("error", "emoji", f"Emoji in a publication post: {' '.join(sorted(set(emojis)))}"))
    elif len(emojis) > MAX_EMOJI:
        findings.append(Finding("warn", "emoji", f"{len(emojis)} emojis — keep to <=1 functional."))

    # --- AI-look tells ---
    dashes = body.count("—")
    if dashes > 2:
        findings.append(Finding("warn", "ailook", f"{dashes} em-dashes — reads AI-generated; keep <=2."))
    # triad tic: "a, b, and c" of adjectives is hard to detect reliably; flag the classic empty triad
    if re.search(r"\binnovative,\s+scalable,?\s+and\s+impactful\b", low):
        findings.append(Finding("warn", "ailook", 'Empty adjective triad detected.'))

    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description="GEPROMED LinkedIn post format + brand-voice checker.")
    parser.add_argument("--file", help="Path to a text file. If omitted, reads stdin.")
    parser.add_argument("--format", choices=list(LENGTH_WINDOWS.keys()), default="text",
                        help="Post format (controls the length window + emoji rule).")
    parser.add_argument("--lang", choices=["fr", "en"], default="en", help="Language hint (reporting only).")
    parser.add_argument("--json", action="store_true", help="Emit findings as JSON.")
    args = parser.parse_args()

    findings = check(read_text(args), args.format)
    errors = [f for f in findings if f.severity == "error"]
    warns = [f for f in findings if f.severity == "warn"]

    if args.json:
        print(json.dumps({
            "format": args.format,
            "pass": len(errors) == 0,
            "errors": len(errors),
            "warnings": len(warns),
            "findings": [asdict(f) for f in findings],
        }, ensure_ascii=False, indent=2))
        return 0 if not errors else 1

    if not findings:
        print(f"PASS — no format/brand issues detected ({args.format}).")
        return 0

    print(f"FINDINGS [{args.format}] ({len(errors)} error, {len(warns)} warn):")
    for f in findings:
        tag = "✗" if f.severity == "error" else "•"
        print(f"  {tag} [{f.severity}:{f.code}] {f.message}")
    print("\nFix the errors before publishing; review the warnings. The human still publishes.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
