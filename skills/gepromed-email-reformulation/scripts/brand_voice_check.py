#!/usr/bin/env python3
"""GEPROMED brand-voice linter for reformulated emails (FR/EN).

A deterministic safety net that flags brand-voice slips in a drafted email body:
hype words, salesy CTAs, emojis in formal mail, hype/passive openers, a missing
subject line, a missing explicit ask, and over-long sentences. It reports — it
does not rewrite. The model owns the final judgment; this is the close-to-100%
safety net.

Usage:
    python brand_voice_check.py --file draft.txt --lang fr
    echo "<draft>" | python brand_voice_check.py --lang en
    python brand_voice_check.py --file draft.txt --json
Exit code 0 = PASS (no errors), 1 = errors/warnings present.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, asdict

HYPE_TERMS = [
    # EN
    "excited to announce", "thrilled", "world-class", "world class", "best-in-class",
    "best in class", "game-changer", "game changer", "cutting-edge", "cutting edge",
    "leading", "revolutionary", "amazing", "incredible", "unparalleled", "synergy",
    "leverage", "best in europe", "number one", "top-notch",
    # FR
    "ravi de vous annoncer", "heureux de vous annoncer", "incroyable", "révolutionnaire",
    "leader mondial", "le meilleur", "la meilleure", "unique en son genre",
    "exceptionnel", "incontournable", "à la pointe",
]

SALESY = [
    "don't miss", "dont miss", "act now", "limited time", "hurry",
    "réservez vite", "dépêchez-vous", "ne manquez pas", "à ne pas manquer",
    "offre limitée",
]

# Hype / weak openers that read as templated or AI-generated.
BAD_OPENERS = [
    "i am writing to inform you that", "i am writing to let you know",
    "i hope this email finds you well", "i hope this finds you well",
    "par la présente", "j'espère que ce mail vous trouve",
    "je me permets de vous écrire pour vous informer",
]

# Heuristic markers of an explicit ask / next step.
ASK_MARKERS = [
    "?", "could you", "would you", "please", "kindly", "let me know",
    "would welcome", "would be glad to", "would be happy to", "look forward to",
    "at your convenience", "i would appreciate",
    "pourriez-vous", "pouvez-vous", "merci de", "veuillez", "confirmez",
    "n'hésitez pas", "je reste à votre disposition", "prochaine étape", "next step",
    "à votre convenance", "dans l'attente",
]

EMOJI_RE = re.compile(
    "[" "\U0001F300-\U0001FAFF" "\U00002600-\U000027BF" "\U0001F1E6-\U0001F1FF" "]",
    flags=re.UNICODE,
)

MAX_SENTENCE_WORDS = 35


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


def body_without_subject(text: str) -> str:
    return re.sub(r"(?im)^\s*(subject|objet)\s*:.*$", "", text)


def long_sentences(text: str) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+|\n+", text)
    out = []
    for s in sentences:
        words = [w for w in re.split(r"\s+", s.strip()) if w]
        if len(words) > MAX_SENTENCE_WORDS:
            out.append(f'{len(words)} words: "{s.strip()[:70]}..."')
    return out


def check(text: str) -> list[Finding]:
    findings: list[Finding] = []
    low = text.lower()

    for term in find_terms(low, HYPE_TERMS):
        findings.append(Finding("error", "hype", f'Hype/anti-brand term: "{term}"'))
    for term in find_terms(low, SALESY):
        findings.append(Finding("error", "salesy", f'Salesy CTA: "{term}"'))
    for term in find_terms(low, BAD_OPENERS):
        findings.append(Finding("warn", "opener", f'Weak/templated opener: "{term}"'))

    emojis = EMOJI_RE.findall(text)
    if emojis:
        findings.append(Finding("warn", "emoji", f"Emoji(s) in formal mail: {' '.join(sorted(set(emojis)))}"))

    if not re.search(r"(?im)^\s*(subject|objet)\s*:", text):
        findings.append(Finding("warn", "subject", "No subject line detected ('Subject:' / 'Objet :')."))

    body = body_without_subject(text).lower()
    if not any(m in body for m in ASK_MARKERS):
        findings.append(Finding("warn", "ask", "No explicit ask / next step detected."))

    for ls in long_sentences(text):
        findings.append(Finding("warn", "length", f"Long sentence (>{MAX_SENTENCE_WORDS} words): {ls}"))

    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description="GEPROMED brand-voice linter for emails.")
    parser.add_argument("--file", help="Path to a text file. If omitted, reads stdin.")
    parser.add_argument("--lang", choices=["fr", "en"], default="en", help="Language hint (reporting only).")
    parser.add_argument("--json", action="store_true", help="Emit findings as JSON.")
    args = parser.parse_args()

    findings = check(read_text(args))
    errors = [f for f in findings if f.severity == "error"]
    warns = [f for f in findings if f.severity == "warn"]

    if args.json:
        print(json.dumps({
            "pass": len(errors) == 0,
            "errors": len(errors),
            "warnings": len(warns),
            "findings": [asdict(f) for f in findings],
        }, ensure_ascii=False, indent=2))
        return 0 if not errors else 1

    if not findings:
        print("PASS — no brand-voice issues detected.")
        return 0

    print(f"FINDINGS ({len(errors)} error, {len(warns)} warn):")
    for f in findings:
        tag = "✗" if f.severity == "error" else "•"
        print(f"  {tag} [{f.severity}:{f.code}] {f.message}")
    print("\nFix the errors before sending; review the warnings. The human still sends.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
