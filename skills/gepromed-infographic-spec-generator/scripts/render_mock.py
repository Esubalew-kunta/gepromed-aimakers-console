#!/usr/bin/env python3
"""GEPROMED infographic mock renderer — a brand-colored layout proof (PNG).

Renders a quick, on-charte MOCK of a figure spec so the team can see the layout
before a designer produces the final asset. It draws only what the spec contains;
it never invents data (bracketed placeholders are drawn literally).

Supported types: stat_card, bar, process, cycle.
Brand: blue #007AC2 master, orange #EC6C17 accent (<=10%), text #1F2A33, white bg.

Requires Pillow. If Pillow is not installed, the mock step is optional — deliver
the text spec instead and a designer executes it.

Usage:
    python render_mock.py --spec figure.json --out mock.png
    python render_mock.py --template > figure.json
Exit 0 on success, 2 on bad input, 3 if Pillow is missing.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Brand tokens
BLUE = (0, 122, 194)
ORANGE = (236, 108, 23)
DARK = (31, 42, 51)
MUTED = (95, 107, 115)
TINT = (225, 240, 249)
WHITE = (255, 255, 255)


def template() -> dict:
    return {
        "title": "Vascular explants received",
        "type": "stat_card",
        "size": [1080, 1080],
        "headline": "Each explant is evidence",
        "hero": "[+150]",
        "hero_unit": "explants in [2023]",
        "support": "World's largest vascular explant database",
        "source": "Source: [internal — confirm]",
        "bars": [{"label": "2021", "value": "[N]"}, {"label": "2022", "value": "[N]"}],
        "lang": "en",
    }


def load_spec(args) -> dict:
    raw = Path(args.spec).read_text(encoding="utf-8") if args.spec else sys.stdin.read()
    return json.loads(raw)


def _font(size: int, bold: bool = False):
    from PIL import ImageFont
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
    ]
    for c in candidates:
        try:
            return ImageFont.truetype(c, size)
        except Exception:
            continue
    return ImageFont.load_default()


def _text_w(draw, text, font) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]


def _logo_box(draw, W, H):
    # Simple on-brand logo stand-in: GEPROMED wordmark with an orange "O".
    f = _font(34, bold=True)
    label_left, label_right = "GEPR", "MED"
    y = H - 70
    x = 60
    draw.text((x, y), label_left, fill=BLUE, font=f)
    x += _text_w(draw, label_left, f)
    draw.text((x, y), "O", fill=ORANGE, font=f)
    x += _text_w(draw, "O", f)
    draw.text((x, y), label_right, fill=BLUE, font=f)


def render(spec: dict, out: Path) -> None:
    from PIL import Image, ImageDraw
    W, H = spec.get("size", [1080, 1080])
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    margin = int(W * 0.08)

    # Top blue rule (header band, thin)
    d.rectangle([0, 0, W, 14], fill=BLUE)

    headline = spec.get("headline", "")
    d.text((margin, margin), headline, fill=DARK, font=_font(46, bold=True))

    ftype = spec.get("type", "stat_card")

    if ftype == "stat_card":
        hero = str(spec.get("hero", ""))
        unit = str(spec.get("hero_unit", ""))
        # Orange accent ring (the "O" motif) behind/near the hero number.
        cx, cy = W // 2, int(H * 0.46)
        r = int(W * 0.30)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=ORANGE, width=10)
        hf = _font(150, bold=True)
        d.text((cx - _text_w(d, hero, hf) // 2, cy - 110), hero, fill=ORANGE, font=hf)
        uf = _font(40)
        d.text((cx - _text_w(d, unit, uf) // 2, cy + 70), unit, fill=DARK, font=uf)

    elif ftype == "bar":
        bars = spec.get("bars", []) or []
        # numeric values only; bracketed -> draw a placeholder stub
        plot_x0, plot_x1 = margin, W - margin
        plot_y0, plot_y1 = int(H * 0.30), int(H * 0.78)
        d.line([plot_x0, plot_y1, plot_x1, plot_y1], fill=MUTED, width=3)
        nums = []
        for b in bars:
            v = b.get("value")
            nums.append(v if isinstance(v, (int, float)) else None)
        max_v = max([n for n in nums if n is not None], default=1) or 1
        n = max(len(bars), 1)
        slot = (plot_x1 - plot_x0) / n
        bw = slot * 0.5
        bf = _font(30)
        for i, b in enumerate(bars):
            x = plot_x0 + slot * i + (slot - bw) / 2
            v = nums[i]
            color = ORANGE if b.get("highlight") else BLUE
            if v is None:
                # bracketed/unknown -> dashed stub + literal label
                d.rectangle([x, plot_y1 - 40, x + bw, plot_y1], outline=BLUE, width=3)
                d.text((x, plot_y1 - 80), str(b.get("value", "[N]")), fill=MUTED, font=bf)
            else:
                bh = (v / max_v) * (plot_y1 - plot_y0)
                d.rectangle([x, plot_y1 - bh, x + bw, plot_y1], fill=color)
                d.text((x, plot_y1 - bh - 36), str(v), fill=DARK, font=bf)
            d.text((x, plot_y1 + 10), str(b.get("label", "")), fill=DARK, font=bf)

    elif ftype in ("process", "cycle"):
        steps = spec.get("steps") or spec.get("bars") or []
        sf = _font(30, bold=True)
        n = max(len(steps), 1)
        y = int(H * 0.45)
        box_w = (W - 2 * margin - (n - 1) * 30) / n
        x = margin
        for i, s in enumerate(steps):
            label = s.get("label", str(s)) if isinstance(s, dict) else str(s)
            color = ORANGE if (isinstance(s, dict) and s.get("highlight")) else BLUE
            d.rectangle([x, y - 70, x + box_w, y + 70], outline=color, width=6)
            d.text((x + 16, y - 12), label[:14], fill=DARK, font=sf)
            if i < n - 1:
                ax = x + box_w
                d.line([ax, y, ax + 30, y], fill=MUTED, width=4)
            x += box_w + 30
        if ftype == "cycle":
            # orange "O" loop marker top-right
            d.ellipse([W - margin - 90, margin + 60, W - margin - 20, margin + 130],
                      outline=ORANGE, width=8)

    # Support + source
    support = spec.get("support", "")
    if support:
        d.text((margin, int(H * 0.82)), support, fill=DARK, font=_font(34))
    source = spec.get("source", "")
    if source:
        d.text((margin, int(H * 0.88)), source, fill=MUTED, font=_font(26))

    _logo_box(d, W, H)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, "PNG")


def main() -> int:
    p = argparse.ArgumentParser(description="GEPROMED infographic mock renderer.")
    p.add_argument("--spec", help="Path to a JSON spec. If omitted (and not --template), reads stdin.")
    p.add_argument("--out", default="mock.png", help="Output PNG path.")
    p.add_argument("--template", action="store_true", help="Print a starter JSON spec and exit.")
    args = p.parse_args()

    if args.template:
        print(json.dumps(template(), ensure_ascii=False, indent=2))
        return 0

    try:
        import PIL  # noqa: F401
    except ImportError:
        print("Pillow not installed — the mock step is optional. Deliver the text "
              "spec; a designer executes it. (pip install Pillow to enable mocks.)")
        return 3

    try:
        spec = load_spec(args)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        print(f"ERROR: could not load spec: {e}")
        return 2

    out = Path(args.out)
    render(spec, out)
    print(f"Wrote {out} ({spec.get('type','?')}, {spec.get('size')})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
