import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as XLSX from "xlsx";

/**
 * Public, auth-free endpoint that renders a branded, print-ready GEPROMED
 * Qualiopi training program (HTML the browser can "Print → Save as PDF").
 *
 * GET  /api/programs?session=<slug>
 *      → returns the branded HTML program for a seed/demo session.
 * POST /api/programs   (multipart form-data with an uploaded `.xlsx` under
 *      the field `file`; a raw `.xlsx` body is also accepted)
 *      → parses the workbook (Fiche + Planning sheets) with the `xlsx`
 *        package and returns the same branded HTML program.
 *
 * AUTH: this route reads ONLY public program data and never touches the
 * session cookie, so it is safe to expose unauthenticated. The website's
 * "Download program PDF" button calls it cross-origin. HOWEVER the app's
 * middleware (src/middleware.ts) currently gates everything except a fixed
 * PUBLIC_PREFIXES list, a maintainer MUST add "/api/programs" to that list
 * (exactly like "/api/health") for anonymous callers to reach this route.
 * See SKILL.md → "Middleware note".
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// --- Brand constants ---------------------------------------------------------
const NAVY = "#0A2540";
const BLUE = "#007AC2";
const ORANGE = "#ED6D1B";
const DARK = "#1F2A33";
const MUTED = "#5F6B73";
const TINT = "#E1F0F9";
const HAIR = "#D9E2E8";

// Exact schedule columns (documented in the skill's excel-schedule-template.md).
type Slot = {
  jour: string;
  debut: string;
  fin: string;
  intitule: string;
  type: string;
  groupe: string;
  salle: string;
  encadrants: string;
  evalue: string;
};

type Metadata = Record<string, string | string[]>;

const BLOCKS: Array<[keyof Metadata & string, string, boolean]> = [
  ["public_vise", "Public visé", true],
  ["prerequis", "Prérequis", true],
  ["objectifs", "Objectifs pédagogiques", true],
  ["duree", "Durée", true],
  ["modalites_pedagogiques", "Modalités pédagogiques", true],
  ["moyens", "Moyens techniques et encadrement", false],
  ["evaluation", "Modalités d'évaluation", true],
  ["sanction", "Sanction / validation", false],
  ["accessibilite", "Accessibilité handicap", true],
  ["delais_acces", "Délais d'accès", true],
  ["tarifs", "Tarifs", true],
  ["inscription", "Modalités et délais d'inscription", true],
  ["contact", "Contact / référent pédagogique", false],
  ["indicateurs", "Indicateurs de résultats", false],
];

const FICHE_ALIASES: Record<string, string> = {
  intitulé: "intitule",
  intitule: "intitule",
  référence: "reference",
  reference: "reference",
  version: "version",
  date: "date",
  "public visé": "public_vise",
  "public vise": "public_vise",
  prérequis: "prerequis",
  prerequis: "prerequis",
  objectifs: "objectifs",
  "objectifs pédagogiques": "objectifs",
  durée: "duree",
  duree: "duree",
  "modalités pédagogiques": "modalites_pedagogiques",
  "modalites pedagogiques": "modalites_pedagogiques",
  moyens: "moyens",
  évaluation: "evaluation",
  evaluation: "evaluation",
  "modalités d'évaluation": "evaluation",
  sanction: "sanction",
  accessibilité: "accessibilite",
  accessibilite: "accessibilite",
  "accessibilité handicap": "accessibilite",
  "délais d'accès": "delais_acces",
  "delais d'acces": "delais_acces",
  tarifs: "tarifs",
  tarif: "tarifs",
  inscription: "inscription",
  contact: "contact",
  "référent pédagogique": "contact",
  indicateurs: "indicateurs",
  "indicateurs de résultats": "indicateurs",
};

const DEFAULT_ACCESSIBILITE =
  "GEPROMED s'engage à étudier toute situation de handicap afin d'envisager l'adaptation de la formation et des modalités d'accueil. Un référent handicap est à votre disposition pour analyser votre demande au cas par cas et déterminer les aménagements possibles. Contact référent handicap : [email / téléphone à confirmer].";
const DEFAULT_SANCTION =
  "Attestation de fin de formation remise à chaque participant. Certificat de réalisation établi pour les actions concernées.";
const PLACEHOLDER = "[À compléter, valider par le RQ]";

// --- Helpers -----------------------------------------------------------------
function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normGroup(v: string): string {
  const s = (v || "").trim();
  if (!s || ["tous", "toutes", "all", "commun"].includes(s.toLowerCase())) return "Tous";
  return s;
}

function cellStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number" && Number.isInteger(v)) return String(v);
  // Excel time serials come through as strings via sheet_to_json({raw:false}).
  return String(v).trim();
}

function normKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9à-ÿ]/gi, "");
}

// --- Workbook parsing --------------------------------------------------------
function parseWorkbook(buf: Buffer): { metadata: Metadata; slots: Slot[] } {
  const wb = XLSX.read(buf, { type: "buffer" });
  const names = wb.SheetNames;

  const ficheName = names.find((n) => n.trim().toLowerCase() === "fiche");
  let planningName = names.find((n) =>
    ["planning", "programme", "schedule"].includes(n.trim().toLowerCase()),
  );
  if (!planningName) planningName = names.find((n) => n !== ficheName);
  if (!planningName) throw new Error("Le classeur ne contient pas de feuille de planning.");

  const metadata: Metadata = ficheName ? parseFiche(wb.Sheets[ficheName]) : {};
  const slots = parsePlanning(wb.Sheets[planningName]);
  return { metadata, slots };
}

function parseFiche(sheet: XLSX.WorkSheet): Metadata {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, blankrows: false });
  const meta: Metadata = {};
  for (const r of rows) {
    const field = cellStr(r?.[0]);
    const value = cellStr(r?.[1]);
    if (!field) continue;
    const low = field.trim().toLowerCase().replace(/:$/, "");
    if (["champ", "field", "clé", "cle", "key"].includes(low)) continue;
    const key = FICHE_ALIASES[low];
    if (!key || !value) continue;
    const existing = meta[key];
    if (existing === undefined) {
      const multi = splitMulti(value);
      meta[key] = multi.length > 1 ? multi : value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      meta[key] = [existing, value];
    }
  }
  return meta;
}

function splitMulti(value: string): string[] {
  const parts: string[] = [];
  for (const chunk of value.replace(/\r/g, "\n").split("\n")) {
    for (const sub of chunk.split(" | ")) {
      const s = sub.replace(/^[-•\s]+|[\s]+$/g, "").trim();
      if (s) parts.push(s);
    }
  }
  return parts;
}

function parsePlanning(sheet: XLSX.WorkSheet): Slot[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, blankrows: false });
  if (!rows.length) return [];

  const canonical: Record<string, keyof Slot> = {
    [normKey("Jour")]: "jour",
    [normKey("Heure début")]: "debut",
    [normKey("Heure fin")]: "fin",
    [normKey("Intitulé du créneau")]: "intitule",
    [normKey("Type")]: "type",
    [normKey("Groupe")]: "groupe",
    [normKey("Salle")]: "salle",
    [normKey("Encadrant(s)")]: "encadrants",
    [normKey("Encadrant")]: "encadrants",
    [normKey("Évalué")]: "evalue",
  };
  // Prefix-match longer headers like "Type (Cours / Atelier pratique)".
  function matchHeader(cell: string): keyof Slot | undefined {
    const nk = normKey(cell);
    if (canonical[nk]) return canonical[nk];
    if (nk.startsWith(normKey("Type"))) return "type";
    if (nk.startsWith(normKey("Groupe"))) return "groupe";
    if (nk.startsWith(normKey("Intitulé"))) return "intitule";
    if (nk.startsWith(normKey("Évalué")) || nk.startsWith(normKey("Evalue"))) return "evalue";
    if (nk.startsWith(normKey("Encadrant"))) return "encadrants";
    return undefined;
  }

  const header = rows[0] as unknown[];
  const colMap = new Map<number, keyof Slot>();
  header.forEach((c, i) => {
    const k = matchHeader(cellStr(c));
    if (k) colMap.set(i, k);
  });

  let dataRows: unknown[][];
  if (colMap.size >= 3) {
    dataRows = rows.slice(1) as unknown[][];
  } else {
    const positional: (keyof Slot)[] = [
      "jour", "debut", "fin", "intitule", "type", "groupe", "salle", "encadrants", "evalue",
    ];
    colMap.clear();
    positional.forEach((k, i) => colMap.set(i, k));
    dataRows = rows as unknown[][];
  }

  const slots: Slot[] = [];
  for (const r of dataRows) {
    const rec: Slot = {
      jour: "", debut: "", fin: "", intitule: "", type: "",
      groupe: "", salle: "", encadrants: "", evalue: "",
    };
    colMap.forEach((key, i) => {
      rec[key] = cellStr(r?.[i]);
    });
    if (!rec.jour && !rec.debut && !rec.intitule) continue;
    slots.push(rec);
  }
  return slots;
}

// --- Timetable grouping (parallel sub-group columns) -------------------------
type TimeBlock = {
  debut: string;
  fin: string;
  common: Slot[];
  groups: Map<string, Slot[]>;
  groupNames: string[];
  parallel: boolean;
};
type Day = { jour: string; blocks: TimeBlock[] };

function buildTimetable(slots: Slot[]): Day[] {
  const dayOrder: string[] = [];
  const dayMap = new Map<string, Map<string, TimeBlock>>();
  const dayBlockOrder = new Map<string, string[]>();

  for (const s of slots) {
    const jour = s.jour || "Jour";
    if (!dayMap.has(jour)) {
      dayMap.set(jour, new Map());
      dayBlockOrder.set(jour, []);
      dayOrder.push(jour);
    }
    const blocks = dayMap.get(jour)!;
    const tkey = `${s.debut}__${s.fin}`;
    if (!blocks.has(tkey)) {
      blocks.set(tkey, {
        debut: s.debut, fin: s.fin, common: [], groups: new Map(),
        groupNames: [], parallel: false,
      });
      dayBlockOrder.get(jour)!.push(tkey);
    }
    const block = blocks.get(tkey)!;
    const g = normGroup(s.groupe);
    if (g === "Tous") block.common.push(s);
    else {
      if (!block.groups.has(g)) block.groups.set(g, []);
      block.groups.get(g)!.push(s);
    }
  }

  const out: Day[] = [];
  for (const jour of dayOrder) {
    const blocks = dayMap.get(jour)!;
    const ordered = dayBlockOrder
      .get(jour)!
      .map((k) => blocks.get(k)!)
      .sort((a, b) => (a.debut || "").localeCompare(b.debut || "") || (a.fin || "").localeCompare(b.fin || ""));
    for (const b of ordered) {
      b.groupNames = [...b.groups.keys()].sort();
      b.parallel = b.groupNames.length > 0;
    }
    out.push({ jour, blocks: ordered });
  }
  return out;
}

// --- HTML rendering ----------------------------------------------------------
function renderBlockValue(value: string | string[] | undefined): string {
  if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
    return `<p class="ph">${esc(PLACEHOLDER)}</p>`;
  }
  if (Array.isArray(value)) {
    const items = value.filter((v) => String(v).trim()).map((v) => `<li>${esc(v)}</li>`).join("");
    return items ? `<ul>${items}</ul>` : `<p class="ph">${esc(PLACEHOLDER)}</p>`;
  }
  return `<p>${esc(value)}</p>`;
}

function slotCard(s: Slot): string {
  const isAtelier = s.type.toLowerCase().includes("atelier");
  const kind = isAtelier ? "atelier" : "cours";
  const evalue = ["oui", "yes", "o", "x", "true", "1"].includes(s.evalue.trim().toLowerCase());
  const meta: string[] = [];
  if (s.salle) meta.push(`<span class="meta"><b>Salle :</b> ${esc(s.salle)}</span>`);
  if (s.encadrants) meta.push(`<span class="meta"><b>Encadrant(s) :</b> ${esc(s.encadrants)}</span>`);
  if (s.type) meta.push(`<span class="tag ${kind}">${esc(s.type)}</span>`);
  if (evalue) meta.push(`<span class="tag evalue">Évalué</span>`);
  return `<div class="slot ${kind}"><div class="slot-title">${esc(s.intitule || "–")}</div><div class="slot-meta">${meta.join(" ")}</div></div>`;
}

function timeBlockHtml(b: TimeBlock): string {
  let label = esc(b.debut);
  if (b.fin) label += " – " + esc(b.fin);
  const parts: string[] = [`<div class="trow"><div class="tcell time"><span>${label}</span></div><div class="tcell body">`];
  for (const s of b.common) parts.push(slotCard(s));
  if (b.parallel) {
    const cols = b.groupNames
      .map((g) => `<div class="gcol"><div class="ghead">Groupe ${esc(g)}</div>${b.groups.get(g)!.map(slotCard).join("")}</div>`)
      .join("");
    parts.push(`<div class="parallel cols-${b.groupNames.length}">${cols}</div>`);
  }
  parts.push("</div></div>");
  return parts.join("");
}

function timetableHtml(timetable: Day[]): string {
  if (!timetable.length) return '<p class="ph">[Planning à compléter, importer un fichier Excel]</p>';
  const out = ['<section class="block"><h2>Contenu / planning détaillé</h2>'];
  for (const day of timetable) {
    out.push(`<div class="day"><div class="day-head">${esc(day.jour)}</div>`);
    for (const b of day.blocks) out.push(timeBlockHtml(b));
    out.push("</div>");
  }
  out.push("</section>");
  return out.join("");
}

function css(): string {
  return `
:root{--navy:${NAVY};--blue:${BLUE};--orange:${ORANGE};--dark:${DARK};--muted:${MUTED};--tint:${TINT};--hair:${HAIR};}
*{box-sizing:border-box;}html,body{margin:0;padding:0;}
body{font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif;color:var(--dark);font-size:10.8pt;line-height:1.5;background:#f4f6f8;}
.sheet{background:#fff;max-width:210mm;margin:12px auto;padding:16mm 18mm;box-shadow:0 1px 6px rgba(10,37,64,.12);}
header.masthead{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border-bottom:3px solid var(--blue);padding-bottom:12px;}
header.masthead .wordmark{font-weight:800;color:var(--navy);font-size:18pt;letter-spacing:.02em;}
header.masthead .brandline{font-size:8.2pt;color:var(--muted);font-style:italic;margin-top:4px;}
.doc-tag{display:inline-block;background:var(--orange);color:#fff;font-weight:700;font-size:8.5pt;letter-spacing:.04em;text-transform:uppercase;padding:3px 9px;border-radius:3px;}
h1.title{color:var(--navy);font-size:20pt;line-height:1.15;margin:14px 0 4px;}
.refline{color:var(--muted);font-size:8.6pt;margin:0 0 6px;}
.block{margin-top:16px;break-inside:avoid;}
.block h2{color:var(--blue);font-size:12.5pt;margin:0 0 6px;border-bottom:1px solid var(--blue);padding-bottom:3px;}
.block p{margin:3px 0;}.block ul{margin:4px 0 4px 18px;padding:0;}.block li{margin:2px 0;}
.ph{color:var(--muted);font-style:italic;}
.day{margin-top:12px;break-inside:avoid;}
.day-head{background:var(--navy);color:#fff;font-weight:700;font-size:10.5pt;padding:5px 10px;border-radius:3px 3px 0 0;}
.trow{display:flex;border:1px solid var(--hair);border-top:none;}
.tcell.time{flex:0 0 78px;background:var(--tint);color:var(--navy);font-weight:700;font-size:8.8pt;padding:8px;display:flex;align-items:flex-start;}
.tcell.body{flex:1 1 auto;padding:8px;min-width:0;}
.slot{border-left:3px solid var(--blue);background:#fbfdff;padding:6px 9px;margin:0 0 6px;border-radius:0 3px 3px 0;}
.slot:last-child{margin-bottom:0;}
.slot.atelier{border-left-color:var(--orange);background:#fff7f0;}
.slot-title{font-weight:600;color:var(--dark);font-size:10pt;}
.slot-meta{margin-top:3px;font-size:8.3pt;color:var(--muted);}
.slot-meta .meta{margin-right:10px;}
.tag{display:inline-block;font-size:7.6pt;font-weight:700;text-transform:uppercase;letter-spacing:.03em;padding:1px 6px;border-radius:8px;margin-right:5px;}
.tag.cours{background:var(--tint);color:var(--blue);}
.tag.atelier{background:#fde6d3;color:var(--orange);}
.tag.evalue{background:#e7f6ec;color:#1a7f43;}
.parallel{display:flex;gap:8px;}
.gcol{flex:1 1 0;min-width:0;border:1px solid var(--hair);border-radius:3px;padding:6px;background:#fff;}
.ghead{font-size:8.4pt;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;border-bottom:1px dashed var(--hair);padding-bottom:3px;}
.compliance{margin-top:18px;padding:9px 12px;background:var(--tint);border-radius:4px;font-size:8.4pt;color:var(--muted);font-style:italic;}
.printbar{position:sticky;top:0;z-index:10;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 16px;font-size:9.5pt;}
.printbar button{background:var(--orange);color:#fff;border:0;font-weight:700;padding:7px 16px;border-radius:4px;cursor:pointer;font-size:9.5pt;}
.footer{margin-top:16px;border-top:1px solid var(--hair);padding-top:6px;font-size:7.6pt;color:var(--muted);text-align:center;}
@page{size:A4;margin:14mm 15mm;}
@media print{body{background:#fff;}.sheet{box-shadow:none;margin:0;max-width:none;padding:0;}.printbar{display:none!important;}.day,.block,.trow{break-inside:avoid;}}
`.trim();
}

function renderProgramHtml(metadataIn: Metadata, slots: Slot[]): string {
  const meta: Metadata = { ...metadataIn };
  if (!meta.accessibilite) meta.accessibilite = DEFAULT_ACCESSIBILITE;
  if (!meta.sanction) meta.sanction = DEFAULT_SANCTION;

  const timetable = buildTimetable(slots);
  const title = esc((meta.intitule as string) || "[Intitulé de la formation]");

  const refBits: string[] = [];
  if (meta.reference) refBits.push(`Réf. ${esc(meta.reference)}`);
  refBits.push(`Version ${esc((meta.version as string) || "[v.]")}`);
  refBits.push(`Mise à jour : ${esc((meta.date as string) || "[date]")}`);

  const blockHtml: string[] = [];
  for (const [key, label, required] of BLOCKS) {
    const value = meta[key];
    const empty = value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
    if (!required && empty && ["moyens", "sanction", "contact", "indicateurs"].includes(key)) continue;
    blockHtml.push(`<section class="block"><h2>${esc(label)}</h2>${renderBlockValue(value)}</section>`);
  }

  const compliance =
    "Note de conformité : ce programme suit les exigences du Référentiel National Qualité (Qualiopi). Vérifier que chaque objectif est évaluable et couvert par les modalités d'évaluation. Toute valeur entre crochets doit être confirmée par le Responsable Qualité avant diffusion publique.";

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}, Programme de formation GEPROMED</title><style>${css()}</style></head>
<body>
<div class="printbar"><span>Programme de formation GEPROMED, document prêt à imprimer</span><button onclick="window.print()">Imprimer / Enregistrer en PDF</button></div>
<div class="sheet">
<header class="masthead"><div><div class="wordmark">GEPROMED</div><div class="brandline">The medical device hub for patient safety</div></div><div class="doc-tag">Programme de formation</div></header>
<h1 class="title">${title}</h1>
<p class="refline">${refBits.join("  ·  ")}</p>
${blockHtml.join("")}
${timetableHtml(timetable)}
<div class="compliance">${esc(compliance)}</div>
<div class="footer">GEPROMED, organisme de formation certifié Qualiopi · ISO 9001 · ISO 13485 &nbsp;|&nbsp; Document de travail, à valider par le Responsable Qualité avant diffusion</div>
</div></body></html>`;
}

// --- Seed / demo sessions (public, no DB dependency) -------------------------
const DEMO_SESSIONS: Record<string, { metadata: Metadata; slots: Slot[] }> = {
  "bootcamp-vasculaire": {
    metadata: {
      intitule: "Bootcamp Vasculaire, abord et anastomose sur simulateur",
      reference: "GEP-FORM-VASC-01",
      version: "1.0",
      date: "2026-06-20",
      public_vise: [
        "Chirurgiens vasculaires en exercice",
        "Internes en chirurgie vasculaire (à partir de la 3e année)",
      ],
      prerequis:
        "Statut de praticien ou d'interne en chirurgie vasculaire. Aucun prérequis académique supplémentaire.",
      objectifs: [
        "Réaliser une anastomose termino-latérale sur simulateur dans le temps imparti.",
        "Identifier et corriger les défauts de suture vasculaire les plus fréquents.",
        "Appliquer les principes d'exposition et de préparation du champ opératoire.",
        "Évaluer la qualité d'une anastomose à l'aide d'une grille standardisée.",
      ],
      duree: "2 jours, 14 heures (4 demi-journées).",
      modalites_pedagogiques: [
        "Présentiel au René Kieny Education Center (Strasbourg).",
        "Formation par simulation : ateliers pratiques sur simulateurs vasculaires (dry-lab).",
        "Pédagogie active : démonstrations, mises en situation, débriefing individualisé.",
      ],
      moyens: [
        "Simulateurs vasculaires et consommables d'entraînement fournis.",
        "Encadrement par des chirurgiens vasculaires formateurs.",
      ],
      evaluation: [
        "Pré-test et post-test de connaissances.",
        "Évaluation pratique sur simulateur à l'aide d'une grille standardisée.",
        "Questionnaire de satisfaction à chaud ; questionnaire à froid à [N] semaines.",
      ],
      delais_acces:
        "Inscription possible jusqu'à [N] jours avant la session, dans la limite des places disponibles.",
      tarifs:
        "[montant] € net de taxe par participant. Prises en charge possibles : OPCO, employeur, financement personnel.",
      inscription:
        "Inscription par formulaire en ligne ou par email auprès du référent pédagogique, jusqu'au [date limite].",
      contact:
        "Référent pédagogique GEPROMED, René Kieny Education Center : [email / téléphone à confirmer].",
    },
    slots: [
      { jour: "Jour 1, Lundi", debut: "09:00", fin: "10:30", intitule: "Accueil, rappels d'anatomie chirurgicale et principes d'abord", type: "Cours", groupe: "Tous", salle: "Amphi A", encadrants: "Dr. Martin", evalue: "Non" },
      { jour: "Jour 1, Lundi", debut: "10:45", fin: "12:30", intitule: "Atelier suture vasculaire, dry-lab", type: "Atelier pratique", groupe: "A", salle: "Sim-Lab 1", encadrants: "Dr. Martin", evalue: "Non" },
      { jour: "Jour 1, Lundi", debut: "10:45", fin: "12:30", intitule: "Atelier exposition du champ opératoire", type: "Atelier pratique", groupe: "B", salle: "Sim-Lab 2", encadrants: "Dr. Nguyen", evalue: "Non" },
      { jour: "Jour 1, Lundi", debut: "14:00", fin: "17:00", intitule: "Anastomoses termino-latérales, mise en situation", type: "Atelier pratique", groupe: "Tous", salle: "Sim-Lab 1+2", encadrants: "Équipe formatrice", evalue: "Non" },
      { jour: "Jour 2, Mardi", debut: "09:00", fin: "12:00", intitule: "Débriefing individualisé et perfectionnement du geste", type: "Atelier pratique", groupe: "A", salle: "Sim-Lab 1", encadrants: "Dr. Martin", evalue: "Non" },
      { jour: "Jour 2, Mardi", debut: "09:00", fin: "12:00", intitule: "Débriefing individualisé et perfectionnement du geste", type: "Atelier pratique", groupe: "B", salle: "Sim-Lab 2", encadrants: "Dr. Nguyen", evalue: "Non" },
      { jour: "Jour 2, Mardi", debut: "13:30", fin: "16:00", intitule: "Évaluation pratique sur grille et synthèse des axes de progression", type: "Cours", groupe: "Tous", salle: "Amphi A", encadrants: "Équipe formatrice", evalue: "Oui" },
    ],
  },
};

function errorHtml(message: string, status: number): NextResponse {
  const body = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Erreur, Programme GEPROMED</title>
<style>body{font-family:"Segoe UI",Arial,sans-serif;color:${DARK};background:#f4f6f8;padding:40px;}
.box{max-width:520px;margin:40px auto;background:#fff;border-top:4px solid ${ORANGE};border-radius:6px;padding:28px 32px;box-shadow:0 1px 6px rgba(10,37,64,.12);}
h1{color:${NAVY};font-size:16pt;margin:0 0 8px;}p{color:${MUTED};}</style></head>
<body><div class="box"><h1>Programme indisponible</h1><p>${esc(message)}</p></div></body></html>`;
  return new NextResponse(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// --- Handlers ----------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse> {
  const slug = (req.nextUrl.searchParams.get("session") || "").trim();
  if (!slug) {
    return errorHtml(
      "Précisez une session : /api/programs?session=bootcamp-vasculaire, ou envoyez un fichier .xlsx en POST.",
      400,
    );
  }
  const session = DEMO_SESSIONS[slug];
  if (!session) {
    return errorHtml(`Aucune session « ${slug} » trouvée dans les données de démonstration.`, 404);
  }
  const html = renderProgramHtml(session.metadata, session.slots);
  return new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let buf: Buffer | null = null;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = (form.get("file") || form.get("xlsx") || form.get("schedule")) as unknown;
      if (file && typeof (file as Blob).arrayBuffer === "function") {
        buf = Buffer.from(await (file as Blob).arrayBuffer());
      }
    } else {
      // Raw .xlsx body.
      const ab = await req.arrayBuffer();
      if (ab.byteLength > 0) buf = Buffer.from(ab);
    }

    if (!buf || buf.length === 0) {
      return errorHtml(
        "Aucun fichier reçu. Envoyez un classeur .xlsx (champ « file » en multipart/form-data).",
        400,
      );
    }

    let parsed: { metadata: Metadata; slots: Slot[] };
    try {
      parsed = parseWorkbook(buf);
    } catch (e) {
      return errorHtml(
        `Impossible de lire le classeur Excel : ${e instanceof Error ? e.message : "format invalide"}.`,
        422,
      );
    }

    if (!parsed.slots.length) {
      return errorHtml(
        "Le planning est vide : vérifiez la feuille « Planning » et ses colonnes.",
        422,
      );
    }

    const html = renderProgramHtml(parsed.metadata, parsed.slots);
    return new NextResponse(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  } catch (e) {
    return errorHtml(
      `Erreur inattendue lors de la génération : ${e instanceof Error ? e.message : "inconnue"}.`,
      500,
    );
  }
}
