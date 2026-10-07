import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import sharp from "sharp";
import { extractedListingSchema, type ExtractedListing } from "./listing-import";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
const MAX_AI_PHOTOS = 4;

const SYSTEM = `Tu aides l'équipe d'AUTO225, site de location et de vente de voitures en Côte d'Ivoire.
On te donne l'annonce qu'un vendeur ou un loueur a transmise à AUTO225 en acceptant qu'elle y soit publiée (texte libre, parfois avec des photos).
Remplis la fiche véhicule à partir de ces informations uniquement. N'invente rien : si une donnée manque, mets null et ajoute un point dans warnings.
Les prix sont en francs CFA (FCFA) : "6 M" ou "6 millions" vaut 6000000, "25 000/jour" est un prix de location par jour.
La description est réécrite en français clair et vendeur, en quelques phrases, sans aucun nom de personne, numéro de téléphone, email, lien ni mention d'un autre site d'annonces : sur AUTO225, le client passe toujours par l'équipe.
Si les photos montrent autre chose que l'annonce décrit (autre modèle, autre couleur), signale-le dans warnings.`;

export class AiImportError extends Error {}

export function aiImportConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

async function toImageBlock(file: File): Promise<Anthropic.ImageBlockParam> {
  // Réduit chaque photo : moins de jetons envoyés, et sous la limite de taille de l'API.
  const data = await sharp(Buffer.from(await file.arrayBuffer()))
    .rotate()
    .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  return { type: "image", source: { type: "base64", media_type: "image/jpeg", data: data.toString("base64") } };
}

export async function extractListing(text: string, photos: File[]): Promise<ExtractedListing> {
  if (!aiImportConfigured()) throw new AiImportError("La saisie assistée n'est pas activée : la clé ANTHROPIC_API_KEY manque dans la configuration du serveur.");
  const client = new Anthropic();

  let images: Anthropic.ImageBlockParam[] = [];
  try {
    images = await Promise.all(photos.slice(0, MAX_AI_PHOTOS).map(toImageBlock));
  } catch {
    throw new AiImportError("Une des photos n'a pas pu être lue. Utilisez des fichiers JPEG, PNG ou WebP.");
  }

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      output_config: { effort: "low", format: zodOutputFormat(extractedListingSchema) },
      system: SYSTEM,
      messages: [{ role: "user", content: [...images, { type: "text", text: `Annonce transmise par le vendeur :\n\n${text}` }] }],
    });
    if (response.stop_reason === "refusal") throw new AiImportError("L'IA n'a pas pu traiter cette annonce. Remplissez la fiche à la main.");
    if (!response.parsed_output) throw new AiImportError("Réponse de l'IA incomplète. Réessayez ou remplissez la fiche à la main.");
    return response.parsed_output;
  } catch (e) {
    if (e instanceof AiImportError) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new AiImportError("Clé ANTHROPIC_API_KEY refusée : vérifiez-la dans la configuration du serveur.");
    if (e instanceof Anthropic.RateLimitError) throw new AiImportError("Trop de demandes à l'IA pour le moment. Réessayez dans une minute.");
    if (e instanceof Anthropic.APIError) throw new AiImportError(`Service d'IA indisponible (erreur ${e.status ?? "réseau"}). Réessayez plus tard.`);
    // Réponse hors schéma (ex. catégorie inconnue) : l'équipe peut réessayer ou saisir à la main.
    console.error("Saisie assistée : réponse de l'IA illisible", e);
    throw new AiImportError("Réponse de l'IA illisible. Réessayez ou remplissez la fiche à la main.");
  }
}
