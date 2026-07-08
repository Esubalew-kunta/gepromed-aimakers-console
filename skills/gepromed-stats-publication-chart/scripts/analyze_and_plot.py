#!/usr/bin/env python3
"""GEPROMED statistics + publication chart generator.

Reads a dataset (CSV / Excel / TSV / whitespace-delimited TXT), computes
descriptive and (optionally) inferential statistics, and renders a single
brand-styled, publication-grade chart as PNG. It also prints a plain-text
statistics summary to stdout.

Hard rule (zero invention): every number printed and plotted is computed
directly from the supplied data. The script never fabricates, imputes, or
estimates values. Missing cells are dropped per-analysis and reported as N.

Brand: primary blue #007AC2, accent orange #EC6C17 (used sparingly), dark
text #1F2A33, muted #5F6B73. Clean white background, no chartjunk.

Usage examples
--------------
# Descriptive distribution of one numeric column
python analyze_and_plot.py --input data.csv --chart hist --y patency_days \
    --out chart.png --title "Patency at follow-up"

# Two-group comparison (t-test / Mann-Whitney chosen by --test)
python analyze_and_plot.py --input data.csv --chart box --y patency_days \
    --group device --test auto --out compare.png

# Bar of group means with SD error bars
python analyze_and_plot.py --input data.csv --chart bar --y force_n --group material

# Correlation of two numeric columns (Pearson + Spearman)
python analyze_and_plot.py --input data.csv --chart scatter --x diameter_mm \
    --y burst_pressure --corr auto

Dependencies: pandas, matplotlib, numpy, scipy (scipy optional; the script
degrades gracefully to descriptive stats only if scipy is absent), openpyxl
for .xlsx input.

Exit codes: 0 success, 2 bad input/usage.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd

import matplotlib
matplotlib.use("Agg")  # headless / deterministic
import matplotlib.pyplot as plt
from matplotlib import font_manager  # noqa: F401  (ensures font cache built)

try:
    from scipy import stats as scipy_stats  # type: ignore
    HAVE_SCIPY = True
except Exception:  # pragma: no cover - scipy is optional
    HAVE_SCIPY = False

# --- Brand constants -------------------------------------------------------
BLUE = "#007AC2"
ORANGE = "#EC6C17"
DARK = "#1F2A33"
MUTED = "#5F6B73"
GRID = "#D9DEE2"
# A small categorical palette: blue first, orange as the rare accent, then
# muted/desaturated tints so a single chart never looks like a rainbow.
PALETTE = [BLUE, ORANGE, "#4F9BCB", "#9AA7AE", "#2A5D77", "#C99A6B"]


def _apply_brand_style() -> None:
    plt.rcParams.update({
        "figure.facecolor": "white",
        "axes.facecolor": "white",
        "axes.edgecolor": MUTED,
        "axes.labelcolor": DARK,
        "axes.titlecolor": DARK,
        "text.color": DARK,
        "xtick.color": MUTED,
        "ytick.color": MUTED,
        "axes.grid": True,
        "grid.color": GRID,
        "grid.linewidth": 0.8,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "font.size": 11,
        "axes.titlesize": 14,
        "axes.titleweight": "bold",
        "figure.dpi": 150,
    })


# --- IO --------------------------------------------------------------------
def read_dataset(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Input not found: {path}")
    suffix = path.suffix.lower()
    if suffix in {".xlsx", ".xls"}:
        return pd.read_excel(path)  # needs openpyxl for .xlsx
    if suffix in {".csv"}:
        return pd.read_csv(path)
    if suffix in {".tsv"}:
        return pd.read_csv(path, sep="\t")
    if suffix in {".txt"}:
        # Sniff: comma -> csv, tab -> tsv, else whitespace.
        sample = path.read_text(encoding="utf-8", errors="replace")[:4096]
        if "," in sample:
            return pd.read_csv(path)
        if "\t" in sample:
            return pd.read_csv(path, sep="\t")
        return pd.read_csv(path, sep=r"\s+", engine="python")
    raise ValueError(f"Unsupported file type: {suffix}")


# --- Descriptive stats -----------------------------------------------------
def describe_series(s: pd.Series) -> dict:
    s = pd.to_numeric(s, errors="coerce").dropna()
    n = int(s.shape[0])
    if n == 0:
        return {"n": 0}
    return {
        "n": n,
        "mean": float(s.mean()),
        "sd": float(s.std(ddof=1)) if n > 1 else float("nan"),
        "median": float(s.median()),
        "min": float(s.min()),
        "max": float(s.max()),
        "q1": float(s.quantile(0.25)),
        "q3": float(s.quantile(0.75)),
    }


def fmt(x: float) -> str:
    if x is None or (isinstance(x, float) and np.isnan(x)):
        return "n/a"
    if abs(x) >= 1000 or (x != 0 and abs(x) < 0.01):
        return f"{x:.3g}"
    return f"{x:.3f}".rstrip("0").rstrip(".")


def desc_line(label: str, d: dict) -> str:
    if d.get("n", 0) == 0:
        return f"  {label}: no numeric data"
    return (f"  {label}: n={d['n']}, mean={fmt(d['mean'])}, SD={fmt(d['sd'])}, "
            f"median={fmt(d['median'])} [Q1 {fmt(d['q1'])}–Q3 {fmt(d['q3'])}], "
            f"min={fmt(d['min'])}, max={fmt(d['max'])}")


# --- Inferential helpers ---------------------------------------------------
def two_group_test(a: pd.Series, b: pd.Series, which: str) -> str:
    a = pd.to_numeric(a, errors="coerce").dropna()
    b = pd.to_numeric(b, errors="coerce").dropna()
    if a.shape[0] < 2 or b.shape[0] < 2:
        return "  Comparison: not enough data in one group (need n>=2 each)."
    if not HAVE_SCIPY:
        return ("  Comparison: scipy not installed — install scipy to compute "
                "t-test / Mann-Whitney p-values.")
    lines = []
    # Normality (Shapiro) informs an 'auto' choice.
    norm_ok = True
    for label, g in (("A", a), ("B", b)):
        if 3 <= g.shape[0] <= 5000:
            w, p = scipy_stats.shapiro(g)
            lines.append(f"  Shapiro (group {label}): W={fmt(w)}, p={fmt(p)}")
            if p < 0.05:
                norm_ok = False
        else:
            norm_ok = False
    chosen = which
    if which == "auto":
        chosen = "ttest" if norm_ok else "mannwhitney"
        lines.append(f"  Test chosen (auto): {chosen} "
                     f"({'normal' if norm_ok else 'non-normal/large'} distribution).")
    if chosen == "ttest":
        t, p = scipy_stats.ttest_ind(a, b, equal_var=False)  # Welch
        lines.append(f"  Welch t-test: t={fmt(t)}, p={fmt(p)}")
    else:
        u, p = scipy_stats.mannwhitneyu(a, b, alternative="two-sided")
        lines.append(f"  Mann-Whitney U: U={fmt(u)}, p={fmt(p)}")
    lines.append(f"  Interpretation: difference is "
                 f"{'statistically significant' if p < 0.05 else 'not statistically significant'} "
                 f"at alpha=0.05 (p={fmt(p)}). Effect direction and clinical relevance "
                 f"are for the human analyst to judge.")
    return "\n".join(lines)


def correlation(x: pd.Series, y: pd.Series, which: str) -> str:
    df = pd.DataFrame({"x": pd.to_numeric(x, errors="coerce"),
                       "y": pd.to_numeric(y, errors="coerce")}).dropna()
    if df.shape[0] < 3:
        return "  Correlation: not enough paired observations (need n>=3)."
    if not HAVE_SCIPY:
        r = float(np.corrcoef(df["x"], df["y"])[0, 1])
        return f"  Pearson r={fmt(r)} (install scipy for p-values & Spearman)."
    lines = [f"  Paired n={df.shape[0]}"]
    if which in ("pearson", "auto"):
        r, p = scipy_stats.pearsonr(df["x"], df["y"])
        lines.append(f"  Pearson r={fmt(r)}, p={fmt(p)}")
    if which in ("spearman", "auto"):
        rho, p = scipy_stats.spearmanr(df["x"], df["y"])
        lines.append(f"  Spearman rho={fmt(rho)}, p={fmt(p)}")
    return "\n".join(lines)


# --- Plotting --------------------------------------------------------------
def _stamp(fig) -> None:
    fig.text(0.99, 0.01, "GEPROMED", ha="right", va="bottom",
             fontsize=8, color=MUTED, alpha=0.8)


def plot_hist(df, args, ax):
    s = pd.to_numeric(df[args.y], errors="coerce").dropna()
    ax.hist(s, bins=args.bins, color=BLUE, edgecolor="white", alpha=0.95)
    ax.axvline(s.mean(), color=ORANGE, linewidth=2, linestyle="--",
               label=f"mean = {fmt(float(s.mean()))}")
    ax.set_xlabel(args.xlabel or args.y)
    ax.set_ylabel(args.ylabel or "Count")
    ax.legend(frameon=False)


def plot_box(df, args, ax):
    if not args.group:
        raise ValueError("--chart box requires --group")
    groups, labels = [], []
    for name, sub in df.groupby(args.group):
        vals = pd.to_numeric(sub[args.y], errors="coerce").dropna()
        if vals.shape[0] > 0:
            groups.append(vals)
            labels.append(f"{name}\n(n={vals.shape[0]})")
    bp = ax.boxplot(groups, tick_labels=labels, patch_artist=True,
                    medianprops=dict(color=DARK, linewidth=1.5),
                    showmeans=True,
                    meanprops=dict(marker="D", markerfacecolor=ORANGE,
                                   markeredgecolor=ORANGE, markersize=5))
    for i, box in enumerate(bp["boxes"]):
        box.set(facecolor=PALETTE[i % len(PALETTE)], alpha=0.55,
                edgecolor=MUTED)
    ax.set_ylabel(args.ylabel or args.y)
    ax.set_xlabel(args.xlabel or args.group)


def plot_bar(df, args, ax):
    if not args.group:
        raise ValueError("--chart bar requires --group")
    means, sds, labels = [], [], []
    for name, sub in df.groupby(args.group):
        vals = pd.to_numeric(sub[args.y], errors="coerce").dropna()
        if vals.shape[0] > 0:
            means.append(float(vals.mean()))
            sds.append(float(vals.std(ddof=1)) if vals.shape[0] > 1 else 0.0)
            labels.append(f"{name}\n(n={vals.shape[0]})")
    xpos = np.arange(len(labels))
    colors = [PALETTE[i % len(PALETTE)] for i in range(len(labels))]
    ax.bar(xpos, means, yerr=sds, capsize=5, color=colors, edgecolor="white",
           error_kw=dict(ecolor=MUTED, lw=1.2))
    ax.set_xticks(xpos)
    ax.set_xticklabels(labels)
    ax.set_ylabel(args.ylabel or f"{args.y} (mean ± SD)")
    ax.set_xlabel(args.xlabel or args.group)


def plot_scatter(df, args, ax):
    if not args.x:
        raise ValueError("--chart scatter requires --x")
    sub = pd.DataFrame({"x": pd.to_numeric(df[args.x], errors="coerce"),
                        "y": pd.to_numeric(df[args.y], errors="coerce")}).dropna()
    ax.scatter(sub["x"], sub["y"], color=BLUE, alpha=0.8, edgecolor="white",
               s=45, zorder=3)
    if sub.shape[0] >= 2:
        # Least-squares fit line, computed from data (not invented).
        coef = np.polyfit(sub["x"], sub["y"], 1)
        xline = np.linspace(sub["x"].min(), sub["x"].max(), 100)
        ax.plot(xline, np.polyval(coef, xline), color=ORANGE, linewidth=2,
                label=f"fit: y={fmt(coef[0])}x+{fmt(coef[1])}")
        ax.legend(frameon=False)
    ax.set_xlabel(args.xlabel or args.x)
    ax.set_ylabel(args.ylabel or args.y)


CHARTS = {"hist": plot_hist, "box": plot_box, "bar": plot_bar,
          "scatter": plot_scatter}


def render(df: pd.DataFrame, args) -> None:
    _apply_brand_style()
    fig, ax = plt.subplots(figsize=(7.2, 4.8))
    CHARTS[args.chart](df, args, ax)
    title = args.title or f"GEPROMED — {args.chart} of {args.y}"
    ax.set_title(title, pad=14, loc="left")
    _stamp(fig)
    fig.tight_layout()
    fig.savefig(args.out, bbox_inches="tight", facecolor="white")
    plt.close(fig)


# --- Summary ---------------------------------------------------------------
def build_summary(df: pd.DataFrame, args) -> str:
    out = ["GEPROMED — statistics summary",
           "=" * 32,
           f"Dataset: {args.input}",
           f"Rows: {df.shape[0]} | Columns: {df.shape[1]}",
           f"Columns: {', '.join(map(str, df.columns))}",
           ""]
    # Per-analysis descriptive block.
    if args.chart in ("hist",) and args.y:
        out.append(f"Distribution of '{args.y}':")
        out.append(desc_line(args.y, describe_series(df[args.y])))
    if args.chart in ("box", "bar") and args.group and args.y:
        out.append(f"'{args.y}' by '{args.group}':")
        for name, sub in df.groupby(args.group):
            out.append(desc_line(str(name), describe_series(sub[args.y])))
        if df[args.group].nunique() == 2 and args.test:
            vals = [pd.to_numeric(s[args.y], errors="coerce").dropna()
                    for _, s in df.groupby(args.group)]
            out.append("")
            out.append(two_group_test(vals[0], vals[1], args.test))
    if args.chart == "scatter" and args.x and args.y:
        out.append(f"'{args.x}' vs '{args.y}':")
        out.append(desc_line(args.x, describe_series(df[args.x])))
        out.append(desc_line(args.y, describe_series(df[args.y])))
        if args.corr:
            out.append("")
            out.append(correlation(df[args.x], df[args.y], args.corr))
    out.append("")
    out.append(f"Chart saved: {args.out}")
    out.append("Note: all values computed from the supplied data only. "
               "Interpretation and publication claims require human (Scientific) review.")
    return "\n".join(out)


def main() -> int:
    p = argparse.ArgumentParser(description="GEPROMED stats + publication chart.")
    p.add_argument("--input", required=True, help="CSV / XLSX / TSV / TXT path.")
    p.add_argument("--chart", required=True, choices=list(CHARTS),
                   help="hist | box | bar | scatter")
    p.add_argument("--y", help="Numeric column to analyse / plot.")
    p.add_argument("--x", help="Second numeric column (scatter).")
    p.add_argument("--group", help="Categorical column for box/bar comparison.")
    p.add_argument("--test", choices=["auto", "ttest", "mannwhitney"],
                   help="Two-group comparison test (box/bar, 2 groups).")
    p.add_argument("--corr", choices=["auto", "pearson", "spearman"],
                   help="Correlation method (scatter).")
    p.add_argument("--bins", type=int, default=12, help="Histogram bins.")
    p.add_argument("--title", help="Chart title.")
    p.add_argument("--xlabel", help="X axis label override.")
    p.add_argument("--ylabel", help="Y axis label override.")
    p.add_argument("--out", default="gepromed_chart.png", help="Output PNG path.")
    args = p.parse_args()

    try:
        df = read_dataset(Path(args.input))
    except Exception as e:  # noqa: BLE001
        print(f"ERROR reading input: {e}", file=sys.stderr)
        return 2

    needed = {"hist": ["y"], "box": ["y", "group"], "bar": ["y", "group"],
              "scatter": ["x", "y"]}[args.chart]
    for col in needed:
        val = getattr(args, col)
        if not val:
            print(f"ERROR: --{col} is required for --chart {args.chart}",
                  file=sys.stderr)
            return 2
        if val not in df.columns:
            print(f"ERROR: column '{val}' not in dataset "
                  f"(have: {list(df.columns)})", file=sys.stderr)
            return 2

    try:
        render(df, args)
    except Exception as e:  # noqa: BLE001
        print(f"ERROR rendering chart: {e}", file=sys.stderr)
        return 2

    print(build_summary(df, args))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
