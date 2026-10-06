"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import { isAvailable } from "@/lib/availability";
import { db } from "@/lib/db";
import { formatDateTime, formatFcfa, parseLocalDateTime } from "@/lib/format";
import { parseForm, zCheckbox, zEmail, zOptionalText, zPhone, zText, type FormState } from "@/lib/form";
import { appUrl, notifyTeam, sendMail } from "@/lib/mail";
import { PricingError, quote } from "@/lib/pricing";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { makeReference } from "@/lib/reference";
import { getOperations, getPricingRules } from "@/lib/settings";

const schema = z.object({
  vehicleId: z.string().min(1),
  depart: z.string(),
  retour: z.string(),
  lieu: zText("Le lieu de retrait"),
  chauffeur: zCheckbox,
  livraison: zCheckbox,
  name: zText("Le nom"),
  email: zEmail,
  phone: zPhone,
  message: zOptionalText(1000),
  accept: z.literal("on", { error: "Vous devez accepter les conditions de location." }),
  website: z.string().max(0).optional(), // champ piège anti-robots
});

export async function requestBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(schema, formData);
  if (!parsed.success) return parsed.state;
  const input = parsed.data;

  if (!(await rateLimit(`booking:${await clientIp()}`, 10, 3600))) {
    return { error: "Trop de demandes envoyées. Merci de réessayer plus tard ou de nous contacter." };
  }

  const startAt = parseLocalDateTime(input.depart);
  const endAt = parseLocalDateTime(input.retour);
  if (!startAt) return { error: "Merci de corriger les champs indiqués.", fieldErrors: { depart: "Date de départ invalide." } };
  if (!endAt) return { error: "Merci de corriger les champs indiqués.", fieldErrors: { retour: "Date de retour invalide." } };
  if (startAt.getTime() < Date.now() - 5 * 60_000) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: { depart: "La date de départ est passée." } };
  }

  const [vehicle, rules, ops, user] = await Promise.all([
    db.vehicle.findFirst({ where: { id: input.vehicleId, status: "PUBLISHED", forRent: true } }),
    getPricingRules(),
    getOperations(),
    getCurrentUser(),
  ]);
  if (!vehicle) return { error: "Ce véhicule n'est plus proposé à la location." };
  if (!ops.pickupLocations.includes(input.lieu)) return { error: "Lieu de retrait invalide.", fieldErrors: { lieu: "Lieu de retrait invalide." } };

  let priced;
  try {
    // Prix calculé côté serveur uniquement, à partir du tarif en vigueur.
    priced = quote(vehicle, { startAt, endAt, withDriver: input.chauffeur, delivery: input.livraison }, rules);
  } catch (e) {
    if (e instanceof PricingError) return { error: e.message };
    throw e;
  }

  if (!(await isAvailable(vehicle.id, startAt, endAt, rules.bufferHours))) {
    return { error: "Ce véhicule n'est pas disponible sur cette période. Essayez d'autres dates ou un autre véhicule." };
  }

  const reference = makeReference("LOC");
  const booking = await db.booking.create({
    data: {
      reference,
      vehicleId: vehicle.id,
      userId: user?.id,
      customerName: input.name,
      customerEmail: input.email,
      customerPhone: input.phone,
      message: input.message,
      pickupLocation: input.lieu,
      startAt,
      endAt,
      blockedUntil: new Date(endAt.getTime() + rules.bufferHours * 3600_000),
      withDriver: input.chauffeur,
      delivery: input.livraison,
      billedDays: priced.billedDays,
      unitPrice: priced.unitPrice,
      rentalTotal: priced.rentalTotal,
      driverTotal: priced.driverTotal,
      deliveryTotal: priced.deliveryTotal,
      feesTotal: priced.feesTotal,
      taxTotal: priced.taxTotal,
      total: priced.total,
      deposit: priced.deposit,
    },
  });
  await logActivity({ actorId: user?.id, entity: "Booking", entityId: booking.id, action: "created", data: { reference, total: priced.total } });

  const summary = [
    `Référence : ${reference}`,
    `Véhicule : ${vehicle.brand} ${vehicle.model}`,
    `Du ${formatDateTime(startAt)} au ${formatDateTime(endAt)} (heure d'Abidjan)`,
    `Retrait : ${input.lieu}`,
    `Durée facturée : ${priced.billedDays} jour(s)`,
    `Total estimé : ${formatFcfa(priced.total)} — caution séparée : ${formatFcfa(priced.deposit)}`,
  ].join("\n");

  await sendMail({
    to: input.email,
    subject: `Demande reçue — ${reference}`,
    text: `Bonjour ${input.name},\n\nNous avons bien reçu votre demande de réservation. Elle n'est pas encore confirmée : notre équipe vérifie la disponibilité et vous répond rapidement.\n\n${summary}\n\nSuivre votre demande : ${appUrl(`/suivi?ref=${reference}`)}\n\nL'équipe AUTO225`,
  });
  await notifyTeam(`Nouvelle demande de location ${reference}`, `${summary}\nClient : ${input.name} — ${input.phone} — ${input.email}\n\n${appUrl(`/admin/reservations/${booking.id}`)}`);

  redirect(`/location/demande/${reference}?email=${encodeURIComponent(input.email)}`);
}
