"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { logActivity } from "@/lib/activity";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseLocalDateTime, slugify } from "@/lib/format";
import { parseForm, zCheckbox, zInt, zOptionalInt, zOptionalText, zText, type FormState } from "@/lib/form";
import { UploadError, deletePublicMedia, savePublicImage } from "@/lib/storage";

const schema = z.object({
  brand: zText("La marque", 60),
  model: zText("Le modèle", 60),
  year: zInt("L'année", 1980, new Date().getFullYear() + 1),
  category: z.enum(["CITADINE", "BERLINE", "SUV", "QUATRE_QUATRE", "PICKUP", "MINIBUS", "PRESTIGE", "UTILITAIRE"]),
  transmission: z.enum(["MANUAL", "AUTOMATIC"]),
  fuel: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC"]),
  seats: zInt("Le nombre de places", 1, 60),
  features: zOptionalText(500),
  description: zOptionalText(5000),
  city: zText("La ville"),
  zone: zOptionalText(200),
  plate: zOptionalText(30),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: zCheckbox,
  ownerEmail: zOptionalText(200),
  forRent: zCheckbox,
  dailyPrice: zOptionalInt("Le prix", 0, 50_000_000),
  includedKmPerDay: zOptionalInt("Le kilométrage inclus", 0, 10_000),
  extraKmPrice: zOptionalInt("Le prix du km supplémentaire", 0, 1_000_000),
  deposit: zOptionalInt("La caution", 0, 100_000_000),
  withDriver: zCheckbox,
  withoutDriver: zCheckbox,
  driverDailyPrice: zOptionalInt("Le prix du chauffeur", 0, 10_000_000),
  deliveryAvailable: zCheckbox,
  deliveryFee: zOptionalInt("Les frais de livraison", 0, 10_000_000),
  minDays: zInt("La durée minimale", 1, 365),
  rentalConditions: zOptionalText(5000),
  cancellationPolicy: zOptionalText(5000),
  forSale: zCheckbox,
  salePrice: zOptionalInt("Le prix de vente", 0, 5_000_000_000),
  mileage: zOptionalInt("Le kilométrage", 0, 5_000_000),
  saleCondition: zOptionalText(5000),
  visitConditions: zOptionalText(2000),
  saleStatus: z.enum(["AVAILABLE", "RESERVED", "SOLD"]),
});

const TRACKED: (keyof Prisma.VehicleUncheckedCreateInput)[] = ["dailyPrice", "deposit", "driverDailyPrice", "deliveryFee", "salePrice", "status", "saleStatus", "forRent", "forSale"];

export async function saveVehicle(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "") || null;
  const parsed = parseForm(schema, formData);
  if (!parsed.success) return parsed.state;
  const { ownerEmail, features, ...d } = parsed.data;

  if (d.forRent && d.status === "PUBLISHED" && d.dailyPrice == null) return { error: "Indiquez un prix de location avant de publier.", fieldErrors: { dailyPrice: "Prix requis." } };
  if (d.forRent && !d.withDriver && !d.withoutDriver) return { error: "Choisissez au moins une formule : avec ou sans chauffeur." };
  if (d.forSale && d.status === "PUBLISHED" && d.salePrice == null) return { error: "Indiquez un prix de vente avant de publier.", fieldErrors: { salePrice: "Prix requis." } };

  let ownerId: string | null = null;
  if (ownerEmail) {
    const owner = await db.user.findUnique({ where: { email: ownerEmail.toLowerCase() } });
    if (!owner) return { error: "Aucun compte avec cet email propriétaire.", fieldErrors: { ownerEmail: "Compte introuvable." } };
    ownerId = owner.id;
  }

  const data = {
    ...d,
    features: features.split(",").map((f) => f.trim()).filter(Boolean),
    plate: d.plate || null,
    dailyPrice: d.dailyPrice ?? null,
    includedKmPerDay: d.includedKmPerDay ?? null,
    extraKmPrice: d.extraKmPrice ?? null,
    deposit: d.deposit ?? null,
    driverDailyPrice: d.driverDailyPrice ?? null,
    deliveryFee: d.deliveryFee ?? null,
    salePrice: d.salePrice ?? null,
    mileage: d.mileage ?? null,
    ownerId,
  };

  // Un véhicule vendu ou retiré : les réservations existantes doivent d'abord être traitées.
  if (id && (d.saleStatus === "SOLD" || d.status === "ARCHIVED" || !d.forRent)) {
    const future = await db.booking.count({ where: { vehicleId: id, status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] }, endAt: { gt: new Date() } } });
    if (future > 0) return { error: `Ce véhicule a ${future} réservation(s) ou demande(s) à venir. Traitez-les avant de le retirer de la location.` };
  }
  if (d.saleStatus === "SOLD") data.forRent = false;

  if (id) {
    const before = await db.vehicle.findUnique({ where: { id } });
    if (!before) return { error: "Véhicule introuvable." };
    await db.vehicle.update({ where: { id }, data });
    const changes = Object.fromEntries(
      TRACKED.filter((k) => (before as Record<string, unknown>)[k] !== (data as Record<string, unknown>)[k]).map((k) => [k, { avant: (before as Record<string, unknown>)[k] ?? null, après: (data as Record<string, unknown>)[k] ?? null }]),
    );
    await logActivity({ actorId: user.id, entity: "Vehicle", entityId: id, action: "updated", data: changes as Prisma.InputJsonValue });
    revalidatePath(`/admin/vehicules/${id}`);
    return { message: "Véhicule enregistré." };
  }

  let slug = slugify(`${d.brand}-${d.model}-${d.year}`);
  if (await db.vehicle.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  const created = await db.vehicle.create({ data: { ...data, slug } });
  await logActivity({ actorId: user.id, entity: "Vehicle", entityId: created.id, action: "created" });
  redirect(`/admin/vehicules/${created.id}?cree=1`);
}

export async function uploadVehiclePhotos(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const vehicle = await db.vehicle.findUnique({ where: { id }, include: { photos: true } });
  if (!vehicle) return { error: "Véhicule introuvable." };
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Choisissez au moins une photo." };
  const alt = `${vehicle.brand} ${vehicle.model}`;
  try {
    let position = vehicle.photos.length;
    for (const file of files) {
      const url = await savePublicImage(file, `vehicules/${vehicle.id}`);
      await db.vehiclePhoto.create({ data: { vehicleId: id, url, alt, position: position++ } });
    }
  } catch (e) {
    if (e instanceof UploadError) return { error: e.message };
    throw e;
  }
  await logActivity({ actorId: user.id, entity: "Vehicle", entityId: id, action: "photos_added", data: { count: files.length } });
  revalidatePath(`/admin/vehicules/${id}`);
  return { message: `${files.length} photo(s) ajoutée(s).` };
}

export async function photoAction(formData: FormData): Promise<void> {
  await requireStaff();
  const photoId = String(formData.get("photoId") ?? "");
  const op = String(formData.get("op") ?? "");
  const photo = await db.vehiclePhoto.findUnique({ where: { id: photoId } });
  if (!photo) return;
  if (op === "delete") {
    await db.vehiclePhoto.delete({ where: { id: photoId } });
    await deletePublicMedia(photo.url);
  } else if (op === "first") {
    await db.vehiclePhoto.updateMany({ where: { vehicleId: photo.vehicleId }, data: { position: { increment: 1 } } });
    await db.vehiclePhoto.update({ where: { id: photoId }, data: { position: 0 } });
  }
  revalidatePath(`/admin/vehicules/${photo.vehicleId}`);
}

export async function addUnavailability(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireStaff();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const startAt = parseLocalDateTime(String(formData.get("startAt") ?? ""));
  const endAt = parseLocalDateTime(String(formData.get("endAt") ?? ""));
  const reason = String(formData.get("reason") ?? "OTHER") as "MAINTENANCE" | "OWNER" | "OTHER";
  const note = String(formData.get("note") ?? "").slice(0, 300);
  if (!startAt || !endAt || endAt <= startAt) return { error: "Période invalide." };
  const conflicts = await db.booking.count({ where: { vehicleId, status: { in: ["CONFIRMED", "IN_PROGRESS"] }, startAt: { lt: endAt }, blockedUntil: { gt: startAt } } });
  const u = await db.unavailability.create({ data: { vehicleId, startAt, endAt, reason, note } });
  await logActivity({ actorId: user.id, entity: "Vehicle", entityId: vehicleId, action: "unavailability_added", data: { id: u.id, startAt: startAt.toISOString(), endAt: endAt.toISOString(), reason } });
  revalidatePath(`/admin/vehicules/${vehicleId}`);
  return conflicts
    ? { error: `Indisponibilité enregistrée, mais ${conflicts} réservation(s) confirmée(s) chevauchent cette période : à traiter.` }
    : { message: "Indisponibilité enregistrée." };
}

export async function deleteUnavailability(formData: FormData): Promise<void> {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const u = await db.unavailability.delete({ where: { id } }).catch(() => null);
  if (u) {
    await logActivity({ actorId: user.id, entity: "Vehicle", entityId: u.vehicleId, action: "unavailability_removed", data: { startAt: u.startAt.toISOString(), endAt: u.endAt.toISOString() } });
    revalidatePath(`/admin/vehicules/${u.vehicleId}`);
  }
}
