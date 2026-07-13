import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { FileExtractionSchema, type FileExtraction, type DepositContext } from "./types";

/**
 * Receipt extraction via a vision LLM. Provider is chosen from the environment:
 * by default Anthropic (Claude) when ANTHROPIC_API_KEY is set, else OpenAI
 * (GPT-4o family) when OPENAI_API_KEY is set. Set EXTRACTION_PROVIDER=openai to
 * force OpenAI (or =anthropic to force Claude). Both read PDFs and images
 * natively (multilingual OCR + layout), return ONE object per distinct receipt
 * in a file, and MUST NOT invent: missing/unclear => null + low confidence + alert.
 */

const openaiKey = process.env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL || "gpt-4o";
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const anthropicModel = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

/**
 * EXTRACTION_PROVIDER (if set and its key is present) wins; otherwise prefer
 * Anthropic (Claude) when its key is set, else OpenAI; else nothing.
 */
const preferred = (process.env.EXTRACTION_PROVIDER || "").toLowerCase();
const provider: "openai" | "anthropic" | null =
  preferred === "openai" && openaiKey
    ? "openai"
    : preferred === "anthropic" && anthropicKey
      ? "anthropic"
      : anthropicKey
        ? "anthropic"
        : openaiKey
          ? "openai"
          : null;

export function isExtractionConfigured(): boolean {
  return provider !== null;
}

let _openai: OpenAI | null = null;
function openai(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: openaiKey });
  return _openai;
}
let _anthropic: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: anthropicKey });
  return _anthropic;
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
- MILEAGE (indemnités kilométriques) : si le document indique une DISTANCE réellement parcourue en km (ex : relevé de trajet, note manuscrite "120 km") plutôt qu'un montant déjà calculé, renseigne distanceKm avec ce nombre. Ne l'invente jamais et ne le déduis pas d'une adresse — uniquement si le chiffre est explicitement écrit. Si le document indique déjà un montant en euros, laisse distanceKm à null et renseigne amountTTC normalement.
- Si le fichier n'est pas un justificatif (spam, document illisible, non-reçu) → isReceipt=false avec la raison.

Tu réponds UNIQUEMENT via l'outil "return_extraction". Aucune donnée inventée.`;

/** JSON Schema for the extraction output — shared by both providers. */
const EXTRACTION_SCHEMA = {
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
          distanceKm: { type: ["number", "null"], description: "distance en km, uniquement si un chiffre de distance réel est imprimé (mileage)" },
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
} as const;

function isPdf(mt: string) {
  return mt === "application/pdf";
}

function contextLine(deposit: DepositContext): string {
  return (
    `Contexte fourni par Nathalie pour ce lot : "${deposit.description || "(aucun)"}".` +
    (deposit.traveler ? ` Voyageur probable : ${deposit.traveler}.` : "") +
    (deposit.purpose ? ` Objet : ${deposit.purpose}.` : "") +
    ` Utilise ce contexte uniquement pour l'objet/le voyageur si absent du document ; n'invente rien d'autre.`
  );
}

/** Extract every receipt from one uploaded file (provider auto-selected). */
export async function extractFile(
  file: UploadedFile,
  deposit: DepositContext,
): Promise<FileExtraction> {
  if (provider === "openai") return extractWithOpenAI(file, deposit);
  if (provider === "anthropic") return extractWithAnthropic(file, deposit);
  return { isReceipt: false, reasonIfNot: "Aucun fournisseur IA configuré.", receipts: [] };
}

function parseOrFail(raw: unknown): FileExtraction {
  const parsed = FileExtractionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      isReceipt: false,
      reasonIfNot: `Extraction non conforme (${parsed.error.issues[0]?.message ?? "schéma"}).`,
      receipts: [],
    };
  }
  return parsed.data;
}

// ---- OpenAI (GPT-4o family) ------------------------------------------------

async function extractWithOpenAI(file: UploadedFile, deposit: DepositContext): Promise<FileExtraction> {
  const docPart = isPdf(file.mediaType)
    ? {
        type: "file" as const,
        file: { filename: file.name, file_data: `data:application/pdf;base64,${file.base64}` },
      }
    : {
        type: "image_url" as const,
        image_url: { url: `data:${file.mediaType};base64,${file.base64}` },
      };

  const res = await openai().chat.completions.create({
    model: openaiModel,
    max_tokens: 4000,
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: [
          docPart,
          { type: "text", text: `Fichier : ${file.name}\n${contextLine(deposit)}\n\nExtrais tous les justificatifs de ce fichier.` },
        ],
      },
    ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    tools: [
      {
        type: "function",
        function: {
          name: "return_extraction",
          description: "Renvoie les justificatifs extraits du fichier.",
          parameters: EXTRACTION_SCHEMA as unknown as Record<string, unknown>,
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "return_extraction" } },
  });

  const call = res.choices[0]?.message?.tool_calls?.[0];
  if (!call || call.type !== "function") {
    return { isReceipt: false, reasonIfNot: "Le modèle n'a renvoyé aucune extraction.", receipts: [] };
  }
  let args: unknown;
  try {
    args = JSON.parse(call.function.arguments);
  } catch {
    return { isReceipt: false, reasonIfNot: "Réponse du modèle illisible (JSON invalide).", receipts: [] };
  }
  return parseOrFail(args);
}

// ---- Anthropic (Claude) — fallback ----------------------------------------

async function extractWithAnthropic(file: UploadedFile, deposit: DepositContext): Promise<FileExtraction> {
  const c = anthropic();
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
    model: anthropicModel,
    max_tokens: 4000,
    system: SYSTEM,
    tools: [
      {
        name: "return_extraction",
        description: "Renvoie les justificatifs extraits du fichier.",
        input_schema: EXTRACTION_SCHEMA as unknown as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: "return_extraction" },
    messages: [
      {
        role: "user",
        content: [
          docBlock,
          { type: "text", text: `Fichier : ${file.name}\n${contextLine(deposit)}\n\nExtrais tous les justificatifs de ce fichier.` },
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
  return parseOrFail(toolUse.input);
}
