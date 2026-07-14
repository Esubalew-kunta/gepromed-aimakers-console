/**
 * Polished bilingual (FR/EN) email templates for the engineering pipelines.
 *
 * One template per stage that the SOP says should trigger a message to the
 * requester (see ENGINEERING_PARITY_PLAN.md §5.3 — the 📧 rows):
 *   • Explant : prospection (ack) · reception (sample received) ·
 *               first_report (report sent) · follow_up (annual satisfaction)
 *   • Test    : request (48h AR) · report (delivered + invoice) ·
 *               done (15-day satisfaction relance)
 *   • Equipment: request (ack) · scheduled (booking confirmed)
 *
 * These are staff-assist templates: the drawer renders the resolved subject +
 * body in the active language with Copy / open-in-mail, so staff send from their
 * own mailbox today. When the client greenlights auto-send (Master Plan Q6), the
 * same strings feed the notification engine unchanged.
 *
 * Pure + client-safe: no server-only imports, no side effects.
 */

import type { Lang } from "./core";

export interface EmailTemplate {
  subject: { fr: string; en: string };
  body: { fr: string; en: string };
}

/** Values interpolated into `{name}`, `{ref}`, `{institution}` placeholders. */
export interface EmailVars {
  name: string;
  ref: string;
  institution?: string;
}

const SIGN_FR = "Cordialement,\nL'équipe GEPROMED";
const SIGN_EN = "Kind regards,\nThe GEPROMED team";

/** kind → stage → template. Missing stages simply have no email. */
export const ENGINEERING_EMAILS: Record<string, Record<string, EmailTemplate>> = {
  explant: {
    prospection: {
      subject: {
        fr: "Votre demande d'analyse d'explant — {ref}",
        en: "Your explant analysis request — {ref}",
      },
      body: {
        fr: `Bonjour {name},

Merci d'avoir contacté GEPROMED pour une analyse d'explant. Nous avons bien reçu votre demande (référence {ref}) et notre équipe reviendra vers vous très prochainement pour confirmer les prochaines étapes : la convention (ou le contrat) ainsi que les modalités d'envoi de l'explant.

${SIGN_FR}`,
        en: `Dear {name},

Thank you for contacting GEPROMED regarding an explant analysis. We have received your request (reference {ref}) and our team will get back to you shortly to confirm the next steps: the framework agreement (or contract) and the explant shipment instructions.

${SIGN_EN}`,
      },
    },
    reception: {
      subject: { fr: "Explant bien reçu — {ref}", en: "Explant received — {ref}" },
      body: {
        fr: `Bonjour {name},

Nous confirmons la bonne réception de l'explant correspondant à la référence {ref}. Notre laboratoire va à présent procéder à l'analyse macroscopique. Vous recevrez le premier rapport dès la fin de cette étape.

${SIGN_FR}`,
        en: `Dear {name},

We confirm receipt of the explant for reference {ref}. Our laboratory will now proceed with the macroscopic analysis. You will receive the first report once this stage is complete.

${SIGN_EN}`,
      },
    },
    first_report: {
      subject: {
        fr: "Votre rapport d'analyse d'explant — {ref}",
        en: "Your explant analysis report — {ref}",
      },
      body: {
        fr: `Bonjour {name},

Veuillez trouver ci-joint le premier rapport de votre analyse d'explant (référence {ref}). Si vous souhaitez des analyses complémentaires, notre équipe reste à votre entière disposition.

${SIGN_FR}`,
        en: `Dear {name},

Please find attached the first report for your explant analysis (reference {ref}). Should you require complementary analyses, our team remains at your disposal.

${SIGN_EN}`,
      },
    },
    follow_up: {
      subject: {
        fr: "Votre avis sur notre service d'analyse d'explants — {ref}",
        en: "Your feedback on our explant analysis service — {ref}",
      },
      body: {
        fr: `Bonjour {name},

Quelque temps s'est écoulé depuis la remise de l'analyse correspondant à la référence {ref}. Votre retour sur notre service nous serait très précieux. Auriez-vous quelques minutes pour partager votre expérience avec nous ?

${SIGN_FR}`,
        en: `Dear {name},

Some time has now passed since we delivered the analysis for reference {ref}. Your feedback on our service would be greatly valued. Would you have a few minutes to share your experience with us?

${SIGN_EN}`,
      },
    },
  },

  test: {
    request: {
      subject: {
        fr: "Nous avons bien reçu votre demande de test — {ref}",
        en: "We received your test request — {ref}",
      },
      body: {
        fr: `Bonjour {name},

Merci pour votre demande de test adressée à GEPROMED (référence {ref}). Ce message confirme sa bonne réception sous 48 heures, conformément à notre engagement. Notre équipe étudie votre projet et vous transmettra un devis très prochainement.

${SIGN_FR}`,
        en: `Dear {name},

Thank you for your testing request submitted to GEPROMED (reference {ref}). This message confirms receipt within 48 hours, as per our commitment. Our team is reviewing your project and will send you a quote shortly.

${SIGN_EN}`,
      },
    },
    report: {
      subject: { fr: "Votre rapport de test — {ref}", en: "Your test report — {ref}" },
      body: {
        fr: `Bonjour {name},

Veuillez trouver ci-joint votre rapport de test (référence {ref}), établi conformément à notre système qualité ISO 13485. La facture correspondante est jointe. Nous vous remercions de votre confiance.

${SIGN_FR}`,
        en: `Dear {name},

Please find attached your test report (reference {ref}), issued in accordance with our ISO 13485 quality system. The corresponding invoice is enclosed. Thank you for your trust.

${SIGN_EN}`,
      },
    },
    done: {
      subject: {
        fr: "Comment s'est passée votre expérience avec GEPROMED ? — {ref}",
        en: "How was your experience with GEPROMED? — {ref}",
      },
      body: {
        fr: `Bonjour {name},

Il y a deux semaines, nous vous remettions le rapport de test correspondant à la référence {ref}. Nous espérons qu'il a pleinement répondu à vos attentes. Votre retour nous aide à progresser — accepteriez-vous de nous faire part de votre avis ?

${SIGN_FR}`,
        en: `Dear {name},

Two weeks ago we delivered the test report for reference {ref}. We hope it fully met your expectations. Your feedback helps us improve — would you take a moment to let us know how we did?

${SIGN_EN}`,
      },
    },
  },

  equipment: {
    request: {
      subject: {
        fr: "Votre demande de créneau machine — {ref}",
        en: "Your machine slot request — {ref}",
      },
      body: {
        fr: `Bonjour {name},

Merci pour votre demande d'accès à un équipement (référence {ref}). Nous l'avons bien reçue et vérifions la disponibilité ainsi que la faisabilité pour la date souhaitée. Nous vous confirmerons le créneau très prochainement.

${SIGN_FR}`,
        en: `Dear {name},

Thank you for your equipment access request (reference {ref}). We have received it and are checking availability and feasibility for your preferred date. We will confirm the slot with you shortly.

${SIGN_EN}`,
      },
    },
    scheduled: {
      subject: {
        fr: "Votre créneau machine est confirmé — {ref}",
        en: "Your machine slot is confirmed — {ref}",
      },
      body: {
        fr: `Bonjour {name},

Votre créneau d'accès à l'équipement est désormais confirmé (référence {ref}). Avant votre session, une brève étape de prise en main / habilitation est nécessaire afin de garantir une utilisation sûre de la machine. Nous serons heureux de vous accueillir.

${SIGN_FR}`,
        en: `Dear {name},

Your equipment access slot is now confirmed (reference {ref}). Before your session, a short onboarding / certification step is required to ensure safe use of the machine. We look forward to welcoming you.

${SIGN_EN}`,
      },
    },
  },
};

/** Template for a request's current stage, or null if that stage sends no email. */
export function getStageEmail(kind: string, stage: string): EmailTemplate | null {
  return ENGINEERING_EMAILS[kind]?.[stage] ?? null;
}

function interpolate(s: string, vars: EmailVars): string {
  return s
    .replace(/\{name\}/g, vars.name || "")
    .replace(/\{ref\}/g, vars.ref || "")
    .replace(/\{institution\}/g, vars.institution || "");
}

/** Resolve a template to concrete subject + body for a language. */
export function fillEmail(
  tpl: EmailTemplate,
  lang: Lang,
  vars: EmailVars,
): { subject: string; body: string } {
  return {
    subject: interpolate(tpl.subject[lang], vars),
    body: interpolate(tpl.body[lang], vars),
  };
}
