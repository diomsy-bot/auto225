import "server-only";
import { cache } from "react";
import { db } from "./db";
import { DEFAULT_PRICING_RULES, type PricingRules } from "./pricing";

export type ContactSettings = {
  companyName: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours: string;
  // Les coordonnées de l'affiche doivent être confirmées avant publication.
  confirmed: boolean;
};

export const DEFAULT_CONTACT: ContactSettings = {
  companyName: "AUTO225",
  address: "Treichville, Gare de Bassam — Abidjan, Côte d'Ivoire",
  phone: "+225 07 57 86 83 69",
  whatsapp: "2250757868369",
  email: "contact@auto225.com",
  hours: "Horaires à confirmer",
  confirmed: false,
};

export type OperationsSettings = {
  pickupLocations: string[];
  cities: string[];
};

export const DEFAULT_OPERATIONS: OperationsSettings = {
  pickupLocations: ["Agence Treichville", "Aéroport FHB (Port-Bouët)", "Plateau", "Cocody", "Marcory", "Yopougon"],
  cities: ["Abidjan"],
};

async function readSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.setting.findUnique({ where: { key } });
  return row ? { ...fallback, ...(row.value as object) } : fallback;
}

export const getContact = cache(() => readSetting("contact", DEFAULT_CONTACT));
export const getPricingRules = cache(() => readSetting<PricingRules>("pricing", DEFAULT_PRICING_RULES));
export const getOperations = cache(() => readSetting("operations", DEFAULT_OPERATIONS));

export function whatsappLink(number: string, reference?: string): string {
  const text = reference
    ? `Bonjour AUTO225, je vous contacte au sujet de ma demande ${reference}.`
    : "Bonjour AUTO225, j'aimerais avoir des informations.";
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
