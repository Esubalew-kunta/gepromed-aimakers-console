import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { FileExtractionSchema, type FileExtraction, type DepositContext } from "./types";

/**
 * Receipt extraction via Claude vision (Opus 4.8 by default).
 *
 * Claude reads PDFs (document blocks) and images (image blocks) natively —
 * multilingual OCR + layout understanding, no Tesseract. One call per file;
 * the model returns ONE object per distinct receipt found (handles a file
 * that contains several receipts — PRD §J1).
 *
 * Golden rule enforced in the prompt: never invent. Missing/unclear => null,
 * with a low confidence and an alert, so Nathalie can verify.
 */

const apiKey = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");
  if (!_client) _client = new Anthropic({ apiKey });
  return _client;
}

export function isExtractionConfigured(): boolean {
  return Boolean(apiKey);
}

export interface UploadedFile {
  name: string;
  mediaType: string; // application/pdf, image/png, image/jpeg, image/webp
  base64: string;
  hash: string;
}

const SYSTEM = `Tu es un expert-comptable qui saisit des notes de frais pour GEPROMED (dispositifs médicaux, Strasbourg). Tu lis des justificatifs (factures, billets, reçus d'hôtel, taxis, restaurants, péages, parkings) en français, anglais, italien ou allemand, y compris des photos/scans de mauvaise qualité.

Tu dois extraire des données STRICTEMENT présentes sur le document. RÈGLE D'OR : ne jamais inventer. Si une donnée est absente, illisible ou incertaine → mets null, baisse la confiance, et ajoute une alerte. Nathalie vérifiera tout.

Règles métier (non négociables) :
- MONTANT = total réellement PAYÉ, TTC (jamais le HT). S'il y a plusieurs montants candidats (tarif + assurance, brut vs net, total vs débit banque), prends le total effectivement payé et signale l'ambiguïté.
- TVA = seulement si explicitement détaillée sur le document. Sinon null. Ne jamais recalculer une TVA absente (ex : vol international exonéré → TVA null, pas 0).
- DATE = date d'émission du justificatif (format ISO yyyy-mm-dd). S'il y a plusieurs dates (émission / prestation / voyage), prends l'émission et signale.
- DEVISE = code ISO 4217 de la devise réellement payée (EUR, USD, JPY, DKK, AED...).
- CATÉGORIE : flight (billet d'avion), hotel (hébergement), train (train, métro, tram, bus), taxi (taxi/VTC), toll (péage autoroute), parking, meals (repas et pourboires), conference (conférences/séminaires), mileage (indemnités kilométriques), misc (divers). Bus et tram → train. Si indéterminable → null.
- NATURE : invoice (facture), receipt (reçu/ticket), booking (réservation/confirmation), other.
- paymentProofPresent : true s'il y a une preuve de paiement (mention payé par carte, reçu de paiement, relevé bancaire, facture acquittée, billet émis).
- Un fichier peut contenir PLUSIEURS justificatifs (ex : deux tickets de bus) → renvoie un objet par justificatif distinct.
- Plusieurs passagers sur un billet → renseigne passengers[] et ajoute une alerte.
- Numéro de document (facture/billet/réservation) → docNumber (sert à la déduplication).
- Si le fichier n'est pas un justificatif (spam, document illisible, non-reçu) → isReceipt=false avec la raison.

Tu réponds UNIQUEMENT via l'outil "return_extraction". Aucune donnée inventée.`;

const TOOL: Anthropic.Tool = {
  name: "return_extraction",
  description: "Renvoie les justificatifs extraits du fichier.",
  input_schema: {
    type: "object",
    properties: {
      isReceipt: { type: "boolean", description: "false si le fichier n'est pas un justificatif exploitable" },
      reasonIfNot: { type: ["string", "null"] },
      receipts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            issueDate: { type: ["string", "null"], description: "date d'émission ISO yyyy-mm-dd" },
            issueDateRaw: { type: ["string", "null"], description: "date telle qu'imprimée" },
            amountTTC: { type: ["number", "null"], description: "total payé TTC" },
            currency: { type: ["string", "null"], description: "code ISO 4217" },
            vendor: { type: ["string", "null"] },
            category: { type: ["string", "null"], enum: ["flight", "hotel", "train", "taxi", "toll", "parking", "meals", "conference", "mileage", "misc", null] },
            vatRecoverable: { type: ["number", "null"], description: "TVA seulement si détaillée" },
            docNature: { type: ["string", "null"], enum: ["invoice", "receipt", "booking", "other", null] },
            paymentProofPresent: { type: "boolean" },
            docNumber: { type: ["string", "null"] },
            location: { type: ["string", "null"], description: "ville ou trajet" },
            passengers: { type: "array", items: { type: "string" } },
            purpose: { type: ["string", "null"] },
            confidence: {
              type: "object",
              properties: {
                issueDate: { type: "number" },
                amountTTC: { type: "number" },
                currency: { type: "number" },
                vendor: { type: "number" },
                category: { type: "number" },
              },
              required: ["issueDate", "amountTTC", "currency", "vendor", "category"],
            },
            alerts: { type: "array", items: { type: "string" } },
          },
          required: ["issueDate", "amountTTC", "currency", "vendor", "category", "paymentProofPresent", "confidence"],
        },
      },
    },
    required: ["isReceipt", "receipts"],
  },
};

function isPdf(mt: string) {
  return mt === "application/pdf";
}

/** Extract every receipt from one uploaded file. */
export async function extractFile(
  file: UploadedFile,
  deposit: DepositContext,
): Promise<FileExtraction> {
  const c = client();

  const contextLine =
    `Contexte fourni par Nathalie pour ce lot : "${deposit.description || "(aucun)"}".` +
    (deposit.traveler ? ` Voyageur probable : ${deposit.traveler}.` : "") +
    (deposit.purpose ? ` Objet : ${deposit.purpose}.` : "") +
    ` Utilise ce contexte uniquement pour l'objet/le voyageur si absent du document ; n'invente rien d'autre.`;

  const docBlock: Anthropic.ContentBlockParam = isPdf(file.mediaType)
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: file.base64 } }
    : {
        type: "image",
        source: {
          type: "base64",
          media_type: file.mediaType as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
          data: file.base64,
        },
      };

  const msg = await c.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "return_extraction" },
    messages: [
      {
        role: "user",
        content: [
          docBlock,
          { type: "text", text: `Fichier : ${file.name}\n${contextLine}\n\nExtrais tous les justificatifs de ce fichier.` },
        ],
      },
    ],
  });

  const toolUse = msg.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "return_extraction",
  );
  if (!toolUse) {
    return { isReceipt: false, reasonIfNot: "Le modèle n'a renvoyé aucune extraction.", receipts: [] };
  }

  const parsed = FileExtractionSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    // Be resilient: surface a controlled result rather than throwing on a shape hiccup.
    return {
      isReceipt: false,
      reasonIfNot: `Extraction non conforme (${parsed.error.issues[0]?.message ?? "schéma"}).`,
      receipts: [],
    };
  }
  return parsed.data;
}
