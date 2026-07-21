// One-off seed script: builds a Fiche+Planning .xlsx per new training (client
// response 2026-07-16) and uploads it to the private `program-workbooks`
// bucket, then stamps trainings.program_workbook_path so
// GET /api/programs?session=<slug> can render/download the PDF program.
// Run: node scripts/seed-program-workbooks.mjs
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnv() {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) process.env[m[1]] ??= m[2].trim();
  }
}
loadEnv();

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function ficheRows(pairs) {
  const rows = [["Champ", "Valeur"]];
  for (const [champ, valeur] of pairs) {
    if (Array.isArray(valeur)) {
      for (const v of valeur) rows.push([champ, v]);
    } else {
      rows.push([champ, valeur]);
    }
  }
  return rows;
}

function planningRows(slots) {
  const header = [
    "Jour",
    "Heure début",
    "Heure fin",
    "Intitulé du créneau",
    "Type",
    "Groupe",
    "Salle",
    "Encadrant(s)",
    "Évalué",
  ];
  return [header, ...slots];
}

function buildWorkbook(fichePairs, slots) {
  const wb = XLSX.utils.book_new();
  const fiche = XLSX.utils.aoa_to_sheet(ficheRows(fichePairs));
  const planning = XLSX.utils.aoa_to_sheet(planningRows(slots));
  XLSX.utils.book_append_sheet(wb, fiche, "Fiche");
  XLSX.utils.book_append_sheet(wb, planning, "Planning");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

const trainings = [
  {
    slug: "bootcamp-vasculaire-avance-2026-11",
    fiche: [
      ["Intitulé", "Bootcamp Vasculaire Avancé — anastomoses complexes"],
      ["Référence", "GEP-FORM-VASC-02"],
      ["Version", "1.0"],
      ["Date", "2026-07-16"],
      ["Public visé", ["Chirurgiens vasculaires en exercice", "Internes en fin de cursus"]],
      ["Prérequis", "Statut de praticien ou d'interne en chirurgie vasculaire (à partir de la 3e année)."],
      [
        "Objectifs",
        [
          "Réaliser une anastomose termino-terminale sur simulateur dans le temps imparti.",
          "Gérer les complications hémorragiques peropératoires.",
        ],
      ],
      ["Durée", "2 jours — 14 heures."],
      ["Effectif maximum", "12 participants."],
      ["Formateurs", "Dr. Amélie Martin, chirurgienne vasculaire — responsable pédagogique."],
      ["Modalités pédagogiques", "Présentiel, ateliers pratiques sur simulateur, débriefing individualisé."],
      ["Moyens", "Simulateurs vasculaires haute-fidélité et consommables fournis."],
      ["Évaluation", "Pré-test et post-test ; évaluation pratique sur grille standardisée."],
      ["Délais d'accès", "Inscription jusqu'à 15 jours avant la session."],
      ["Tarifs", "2 400 € net de taxe par participant. Hébergement en supplément. Remise de 10% dès 3 inscriptions groupées."],
      ["Inscription", "Formulaire en ligne jusqu'à 15 jours avant la session, dans la limite des places disponibles."],
      ["Référent handicap", "Claire Dubois (referent.handicap@gepromed.fr)"],
      ["Contact", "Référent pédagogique GEPROMED, Institut Gepromed (Strasbourg)."],
    ],
    slots: [
      ["Jour 1", "09:00", "12:30", "Rappels d'anatomie et principes d'exposition", "Cours", "Tous", "Amphi A", "Dr. Martin", "Non"],
      ["Jour 1", "14:00", "17:00", "Atelier anastomoses termino-terminales", "Atelier pratique", "Tous", "Sim-Lab 1", "Dr. Martin", "Non"],
      ["Jour 2", "09:00", "12:00", "Gestion des complications hémorragiques", "Atelier pratique", "Tous", "Sim-Lab 1", "Dr. Martin", "Non"],
      ["Jour 2", "13:30", "16:00", "Évaluation pratique sur grille et synthèse", "Cours", "Tous", "Amphi A", "Dr. Martin", "Oui"],
    ],
  },
  {
    slug: "workshop-simulation-innovation-2026-12",
    fiche: [
      ["Intitulé", "Workshop Simulation & Innovation — nouveaux dispositifs"],
      ["Référence", "GEP-FORM-SIM-01"],
      ["Version", "1.0"],
      ["Date", "2026-07-16"],
      ["Public visé", ["IBODE", "Infirmiers de bloc", "Techniciens biomédicaux"]],
      ["Prérequis", "Aucun prérequis académique. Ouvert aux professionnels de bloc opératoire et techniciens biomédicaux."],
      [
        "Objectifs",
        [
          "Manipuler les nouveaux dispositifs en conditions simulées.",
          "Identifier les points de vigilance liés à leur mise en oeuvre clinique.",
        ],
      ],
      ["Durée", "2 jours — 12 heures."],
      ["Effectif maximum", "16 participants."],
      ["Formateurs", "Dr. Karim Nguyen, référent innovation — responsable pédagogique."],
      ["Modalités pédagogiques", "Présentiel, ateliers de manipulation guidée, mises en situation clinique simulées."],
      ["Moyens", "Plateforme de simulation et dispositifs fournis par le sponsor."],
      ["Évaluation", "Évaluation pratique sur grille standardisée ; questionnaire de satisfaction à chaud."],
      ["Délais d'accès", "Inscription jusqu'à 10 jours avant la session."],
      ["Tarifs", "Formation prise en charge par MedTech Solutions (financement tiers). Aucun frais pour le participant."],
      ["Inscription", "Formulaire en ligne jusqu'à 10 jours avant la session, dans la limite des places disponibles."],
      ["Référent handicap", "Claire Dubois (referent.handicap@gepromed.fr)"],
      ["Contact", "Référent pédagogique GEPROMED, Institut Gepromed (Strasbourg)."],
    ],
    slots: [
      ["Jour 1", "09:00", "12:30", "Présentation des dispositifs et principes de fonctionnement", "Cours", "Tous", "Amphi B", "Dr. Nguyen", "Non"],
      ["Jour 1", "14:00", "17:00", "Atelier de manipulation guidée", "Atelier pratique", "Tous", "Sim-Lab 2", "Dr. Nguyen", "Non"],
      ["Jour 2", "09:00", "12:00", "Mises en situation clinique simulées", "Atelier pratique", "Tous", "Sim-Lab 2", "Dr. Nguyen", "Non"],
      ["Jour 2", "13:30", "16:00", "Évaluation pratique et synthèse", "Cours", "Tous", "Amphi B", "Dr. Nguyen", "Oui"],
    ],
  },
  {
    slug: "phaco-initiation-helpmesee-2026-10",
    fiche: [
      ["Intitulé", "Initiation à la phacoémulsification — parcours HelpMeSee"],
      ["Référence", "GEP-FORM-OPHT-HMS-01"],
      ["Version", "1.0"],
      ["Date", "2026-07-16"],
      ["Public visé", ["Ophtalmologistes en formation", "Chirurgiens référés par la fondation HelpMeSee"]],
      ["Prérequis", "Référence par la fondation HelpMeSee. Formulaire d'inscription HelpMeSee complété et retourné à Gepromed."],
      [
        "Objectifs",
        [
          "Réaliser les étapes clés d'une phacoémulsification sur simulateur.",
          "Gérer les complications peropératoires courantes.",
        ],
      ],
      ["Durée", "3 jours — 21 heures."],
      ["Effectif maximum", "10 participants."],
      ["Formateurs", "Dr. Hélène Faye, ophtalmologiste — responsable pédagogique HelpMeSee."],
      [
        "Modalités pédagogiques",
        "Présentiel, ateliers pratiques encadrés, modules e-learning de la fondation HelpMeSee (externes, vérifiés avant l'accès simulateur).",
      ],
      ["Moyens", "Simulateurs de phacoémulsification et consommables fournis."],
      ["Évaluation", "Évaluation pratique sur grille standardisée ; vérification préalable des modules e-learning de la fondation."],
      ["Délais d'accès", "Sur référence de la fondation HelpMeSee uniquement."],
      ["Tarifs", "À partir de 1 750 €. Le montant facturé dépend du statut du participant (prise en charge fondation ou individuelle)."],
      [
        "Inscription",
        "Sur référence de la fondation HelpMeSee uniquement. Gepromed transmet et réceptionne le formulaire d'inscription pour chaque participant.",
      ],
      ["Référent handicap", "Claire Dubois (referent.handicap@gepromed.fr)"],
      ["Contact", "Référent pédagogique HelpMeSee, Institut Gepromed (Strasbourg)."],
    ],
    slots: [
      ["Jour 1", "09:00", "12:30", "Principes de la phacoémulsification et prise en main du simulateur", "Cours", "Tous", "Sim-Lab Ophta", "Dr. Faye", "Non"],
      ["Jour 2", "09:00", "17:00", "Ateliers pratiques encadrés", "Atelier pratique", "Tous", "Sim-Lab Ophta", "Dr. Faye", "Non"],
      ["Jour 3", "09:00", "12:00", "Mises en situation et évaluation pratique", "Cours", "Tous", "Sim-Lab Ophta", "Dr. Faye", "Oui"],
    ],
  },
];

for (const t of trainings) {
  const buf = buildWorkbook(t.fiche, t.slots);
  const path = `${t.slug}.xlsx`;
  const { error: upErr } = await sb.storage.from("program-workbooks").upload(path, buf, {
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    upsert: true,
  });
  if (upErr) {
    console.error(`upload failed for ${t.slug}:`, upErr.message);
    continue;
  }
  const { error: updErr } = await sb
    .from("trainings")
    .update({ program_workbook_path: path })
    .eq("slug", t.slug);
  if (updErr) {
    console.error(`db update failed for ${t.slug}:`, updErr.message);
    continue;
  }
  console.log(`OK ${t.slug} -> ${path}`);
}
