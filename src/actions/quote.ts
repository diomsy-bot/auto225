"use server";

import { isAvailable } from "@/lib/availability";
import { db } from "@/lib/db";
import { parseLocalDateTime } from "@/lib/format";
import { PricingError, quote, type Quote } from "@/lib/pricing";
import { getPricingRules } from "@/lib/settings";

export type QuotePreview = { quote?: Quote; available?: boolean; error?: string };

/** Récapitulatif indicatif affiché pendant la saisie ; le prix final est recalculé à l'envoi. */
export async function previewQuote(input: { vehicleId: string; depart: string; retour: string; withDriver: boolean; delivery: boolean }): Promise<QuotePreview> {
  const startAt = parseLocalDateTime(input.depart);
  const endAt = parseLocalDateTime(input.retour);
  if (!startAt || !endAt) return {};
  const [vehicle, rules] = await Promise.all([
    db.vehicle.findFirst({ where: { id: input.vehicleId, status: "PUBLISHED", forRent: true } }),
    getPricingRules(),
  ]);
  if (!vehicle) return { error: "Véhicule indisponible." };
  try {
    const q = quote(vehicle, { startAt, endAt, withDriver: input.withDriver, delivery: input.delivery }, rules);
    return { quote: q, available: await isAvailable(vehicle.id, startAt, endAt, rules.bufferHours) };
  } catch (e) {
    if (e instanceof PricingError) return { error: e.message };
    throw e;
  }
}
