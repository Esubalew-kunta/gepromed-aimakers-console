import "server-only";
/**
 * Stage communications — the "background action" that fires when a lead moves
 * to a new stage. Each transition produces a participant-facing email whose
 * content is specific to that stage (and, for the Bootcamp practical-info step,
 * follows Rule 1: show the sponsor's name/logo when the seat is sponsored,
 * otherwise show the price).
 *
 * We record every message in `email_log` (+ an entry in `lead_events`) so the
 * console shows exactly what was sent at each step. Actual delivery is handed
 * to n8n when N8N_STAGE_WEBHOOK_URL is configured; otherwise the message is
 * queued/logged and ready to send. This module never throws — a comms failure
 * must not break advancing a lead.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Parcours, Stage } from "./leads-shared";

/** Minimal lead shape needed to render a stage email. */
export interface CommsLead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  funding?: "self" | "sponsored" | null;
  sponsor_name?: string | null;
  trainings?: {
    title?: { fr?: string; en?: string } | null;
    price_eur?: number | null;
    is_sponsored?: boolean | null;
    sponsors?: { name: string; logo_url?: string }[] | null;
  } | null;
}

const euro = (n?: number | null) => "€" + (n ?? 0).toLocaleString("fr-FR");

/** Sponsor label for a lead: per-lead sponsor wins, else the training's. */
function sponsorLabel(lead: CommsLead): string | null {
  if (lead.funding === "sponsored" && lead.sponsor_name) return lead.sponsor_name;
  const t = lead.trainings;
  if (t?.is_sponsored) {
    const names = (t.sponsors ?? []).map((s) => s.name).filter(Boolean);
    return names.length ? names.join(", ") : "votre sponsor";
  }
  return null;
}

export interface StageEmail {
  template: string;
  subject: string;
  body: string;
}

/**
 * The email for a given stage of a parcours (null = no email at this step).
 * French, since the participant-facing comms are in French.
 */
export function stageEmail(
  parcours: Parcours,
  stage: Stage,
  lead: CommsLead,
): StageEmail | null {
  const who = lead.first_name || "Docteur";
  const course = lead.trainings?.title?.fr ?? "votre formation";

  if (parcours === "helpmesee") {
    const map: Partial<Record<Stage, StageEmail>> = {
      enrollment_form: {
        template: "hms_enrollment_form",
        subject: "HelpMeSee — complétez votre formulaire d'inscription",
        body: `Bonjour ${who}, merci pour votre demande. Merci de compléter le formulaire d'inscription HelpMeSee pour « ${course} ».`,
      },
      dates_validation: {
        template: "hms_dates",
        subject: "HelpMeSee — validation de vos dates",
        body: `Bonjour ${who}, nous validons vos dates de formation avec un instructeur pour « ${course} ».`,
      },
      invoice: {
        template: "hms_invoice",
        subject: "HelpMeSee — votre facture",
        body: `Bonjour ${who}, votre facture pour « ${course} » est disponible (paiement en une ou plusieurs fois).`,
      },
      elearning_check: {
        template: "hms_elearning",
        subject: "HelpMeSee — modules e-learning obligatoires",
        body: `Bonjour ${who}, merci de terminer les modules e-learning de la fondation avant l'accès au simulateur.`,
      },
      simulator_access: {
        template: "hms_simulator",
        subject: "HelpMeSee — accès simulateur + infos pratiques",
        body: `Bonjour ${who}, voici vos identifiants d'accès simulateur et les informations pratiques (lieu, horaires, logistique).`,
      },
      confirmed: {
        template: "hms_confirmed",
        subject: "HelpMeSee — votre place est confirmée",
        body: `Bonjour ${who}, votre place est confirmée. La formation « ${course} » est planifiée.`,
      },
      done: {
        template: "hms_done",
        subject: "HelpMeSee — questionnaire de satisfaction",
        body: `Bonjour ${who}, merci d'avoir suivi « ${course} ». Voici le lien vers le questionnaire de satisfaction.`,
      },
    };
    return map[stage] ?? null;
  }

  // Bootcamp / Workshop
  const price = euro(lead.trainings?.price_eur);
  const sponsor = sponsorLabel(lead);
  const map: Partial<Record<Stage, StageEmail>> = {
    pre_registration: {
      template: "bc_pre_registration",
      subject: "Pré-inscription — caution 200 € + contrat d'engagement",
      body: `Bonjour ${who}, pour confirmer votre pré-inscription à « ${course} », merci de régler la caution de 200 € et de signer le contrat d'engagement (ci-joint).`,
    },
    deposit_contract: {
      template: "bc_deposit_contract",
      subject: "Caution et contrat bien reçus",
      body: `Bonjour ${who}, nous confirmons la bonne réception de votre caution et de votre contrat d'engagement pour « ${course} ».`,
    },
    // Rule 1: sponsor logo/name vs. participant price.
    practical_info: {
      template: "bc_practical_info",
      subject: "Informations pratiques — J-30",
      body: sponsor
        ? `Bonjour ${who}, voici le programme et les informations pratiques de « ${course} », sponsorisée par ${sponsor} (logo affiché sur cette communication).`
        : `Bonjour ${who}, voici le programme et les informations pratiques de « ${course} ». Tarif participant : ${price}.`,
    },
    elearning_sent: {
      template: "bc_elearning",
      subject: "Vos accès e-learning (LMS Gepromed)",
      body: `Bonjour ${who}, voici vos accès aux modules e-learning sur le LMS Gepromed pour « ${course} ».`,
    },
    confirmed: {
      template: "bc_confirmed",
      subject: "Votre place est confirmée",
      body: `Bonjour ${who}, votre place pour « ${course} » est confirmée. À très bientôt !`,
    },
    deposit_refunded: {
      template: "bc_deposit_refunded",
      subject: "Caution remboursée",
      body: `Bonjour ${who}, votre caution de 200 € a été remboursée (formation suivie en intégralité).`,
    },
    done: {
      template: "bc_done",
      subject: "Terminé — modules finaux + satisfaction",
      body: `Bonjour ${who}, merci d'avoir suivi « ${course} ». Voici vos modules finaux LMS et le questionnaire de satisfaction.`,
    },
  };
  return map[stage] ?? null;
}

/**
 * Fire-and-record the stage email: writes email_log + a lead_events entry, and
 * best-effort hands delivery to n8n. Swallows all errors.
 */
export async function recordStageComms(
  sb: SupabaseClient,
  lead: CommsLead,
  parcours: Parcours,
  stage: Stage,
): Promise<void> {
  try {
    const mail = stageEmail(parcours, stage, lead);
    if (!mail) return;

    const webhook = process.env.N8N_STAGE_WEBHOOK_URL;
    let status = webhook ? "sent" : "queued";
    if (webhook) {
      try {
        const res = await fetch(webhook, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET ?? "",
          },
          body: JSON.stringify({
            leadId: lead.id,
            to: lead.email,
            parcours,
            stage,
            template: mail.template,
            subject: mail.subject,
            body: mail.body,
          }),
        });
        if (!res.ok) status = "failed";
      } catch {
        status = "failed";
      }
    }

    await sb.from("email_log").insert({
      lead_id: lead.id,
      template: mail.template,
      to_email: lead.email,
      status,
    });
    await sb.from("lead_events").insert({
      lead_id: lead.id,
      type: "email",
      payload: { template: mail.template, subject: mail.subject, stage, status },
    });
  } catch {
    // Comms must never block the pipeline.
  }
}
