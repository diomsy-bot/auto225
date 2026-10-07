import { z } from "zod";

/**
 * Saisie assistée par IA : transforme l'annonce d'un vendeur (texte collé + photos)
 * en fiche véhicule. Ce module ne contient que la partie pure (schéma, nettoyage, conversion),
 * l'appel à l'IA est dans listing-ai.ts.
 */

const CATEGORIES = ["CITADINE", "BERLINE", "SUV", "QUATRE_QUATRE", "PICKUP", "MINIBUS", "PRESTIGE", "UTILITAIRE"] as const;

// Schéma demandé à l'IA. Pas de bornes numériques : les sorties structurées ne les acceptent pas,
// on borne nous-mêmes dans toVehicleDraft.
export const extractedListingSchema = z.object({
  brand: z.string().describe("Marque, ex. Toyota"),
  model: z.string().describe("Modèle, ex. RAV4"),
  year: z.number().nullable().describe("Année du modèle, null si inconnue"),
  category: z.enum(CATEGORIES),
  transmission: z.enum(["MANUAL", "AUTOMATIC"]).nullable(),
  fuel: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC"]).nullable(),
  seats: z.number().nullable(),
  forRent: z.boolean().describe("true si l'annonce propose une location"),
  forSale: z.boolean().describe("true si l'annonce propose une vente"),
  dailyPrice: z.number().nullable().describe("Prix de location par jour en FCFA"),
  salePrice: z.number().nullable().describe("Prix de vente en FCFA"),
  mileage: z.number().nullable().describe("Kilométrage en km"),
  city: z.string().nullable(),
  zone: z.string().nullable().describe("Quartier ou commune, ex. Cocody"),
  features: z.array(z.string()).describe("Équipements courts, ex. Climatisation"),
  description: z.string().describe("Description réécrite en français, sans nom, téléphone, email ni lien"),
  saleCondition: z.string().describe("État du véhicule décrit par le vendeur, vide si non précisé"),
  warnings: z.array(z.string()).describe("Points à vérifier par l'équipe : informations manquantes, incohérentes ou devinées"),
});

export type ExtractedListing = z.infer<typeof extractedListingSchema>;

// Numéros de téléphone (ivoiriens : 10 chiffres, ou préfixe +225 / 00225), emails, liens.
// Un prix comme « 12 500 000 » (8 chiffres) n'est pas un numéro et doit rester.
const PHONE = /(?:\+|00)?\d[\d\s.\-()]{7,}\d/g;
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const URL = /\b(?:https?:\/\/|www\.)\S+/gi;
const CONTACT_WORDS = /\b(?:whats\s?app|wa\.me|appel(?:ez|er)?|contact(?:ez|er)?)\b[^\n.]*[:]?/gi;

/** Retire téléphones, emails et liens : le contact passe toujours par AUTO225. */
export function stripContactInfo(text: string): string {
  return text
    .replace(URL, "")
    .replace(EMAIL, "")
    .replace(PHONE, (m) => (/^(?:\+|00)/.test(m) || m.replace(/\D/g, "").length >= 10 ? "" : m))
    .replace(CONTACT_WORDS, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const clampInt = (n: number | null, min: number, max: number): number | null => {
  if (n == null || !Number.isFinite(n)) return null;
  const r = Math.round(n);
  return r < min || r > max ? null : r;
};

const cleanLine = (s: string | null | undefined, max: number) => stripContactInfo(s ?? "").replace(/\s+/g, " ").slice(0, max).trim();

/** Convertit l'extraction en données de véhicule, toujours en brouillon. */
export function toVehicleDraft(e: ExtractedListing) {
  const warnings = [...e.warnings];
  const thisYear = new Date().getFullYear();
  let year = clampInt(e.year, 1980, thisYear + 1);
  if (year == null) {
    year = thisYear;
    warnings.push("Année inconnue : remplacée par l'année en cours, à corriger.");
  }
  let forRent = e.forRent;
  const forSale = e.forSale;
  if (!forRent && !forSale) {
    forRent = true;
    warnings.push("L'annonce ne dit pas si c'est une location ou une vente : marquée location par défaut.");
  }
  if (!e.transmission) warnings.push("Boîte de vitesses non précisée : manuelle par défaut.");
  if (!e.fuel) warnings.push("Carburant non précisé : essence par défaut.");

  return {
    data: {
      brand: cleanLine(e.brand, 60) || "À compléter",
      model: cleanLine(e.model, 60) || "À compléter",
      year,
      category: e.category,
      transmission: e.transmission ?? ("MANUAL" as const),
      fuel: e.fuel ?? ("PETROL" as const),
      seats: clampInt(e.seats, 1, 60) ?? 5,
      features: e.features.map((f) => cleanLine(f, 60)).filter(Boolean).slice(0, 20),
      description: stripContactInfo(e.description).slice(0, 5000),
      city: cleanLine(e.city, 100) || "Abidjan",
      zone: cleanLine(e.zone, 200),
      status: "DRAFT" as const,
      forRent,
      dailyPrice: forRent ? clampInt(e.dailyPrice, 0, 50_000_000) : null,
      withoutDriver: true,
      forSale,
      salePrice: forSale ? clampInt(e.salePrice, 0, 5_000_000_000) : null,
      mileage: clampInt(e.mileage, 0, 5_000_000),
      saleCondition: stripContactInfo(e.saleCondition).slice(0, 5000),
    },
    warnings,
  };
}
