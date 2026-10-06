"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { DocumentKind } from "@prisma/client";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseLocalDateTime } from "@/lib/format";
import { parseForm, zInt, zOptionalInt, zOptionalText, zPhone, zText, type FormState } from "@/lib/form";
import { appUrl, notifyTeam, sendMail } from "@/lib/mail";
import { makeReference } from "@/lib/reference";
import { UploadError, deletePrivateDocument, savePrivateDocument } from "@/lib/storage";

const EDITABLE = ["DRAFT", "INCOMPLETE"] as const;

const schema = z.object({
  id: z.string().optional(),
  intent: z.enum(["draft", "submit"]),
  ownerName: zText("Le nom"),
  ownerPhone: zPhone,
  city: zText("La ville"),
  brand: zText("La marque", 60),
  model: zText("Le modèle", 60),
  year: zInt("L'année", 1990, new Date().getFullYear() + 1),
  mileage: zInt("Le kilométrage", 0, 2_000_000),
  transmission: z.enum(["MANUAL", "AUTOMATIC"], { error: "Choisissez une boîte de vitesses." }),
  fuel: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC"], { error: "Choisissez un carburant." }),
  availability: zOptionalText(1000),
  desiredPrice: zOptionalInt("Le tarif souhaité", 0, 10_000_000),
  message: zOptionalText(2000),
});

const FILE_FIELDS: [string, DocumentKind][] = [
  ["photos", "VEHICLE_PHOTO"],
  ["ownershipProof", "OWNERSHIP_PROOF"],
  ["vehiclePapers", "VEHICLE_PAPERS"],
  ["insurance", "INSURANCE"],
  ["identity", "IDENTITY"],
];

function filesFrom(formData: FormData, name: string): File[] {
  return formData.getAll(name).filter((f): f is File => f instanceof File && f.size > 0);
}

export async function saveOwnerApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/proprietaires/dossier");
  const parsed = parseForm(schema, formData);
  if (!parsed.success) return parsed.state;
  const { id, intent, ...data } = parsed.data;

  let application = id ? await db.ownerApplication.findFirst({ where: { id, userId: user.id }, include: { documents: true } }) : null;
  if (id && !application) return { error: "Dossier introuvable." };
  if (application && !(EDITABLE as readonly string[]).includes(application.status)) {
    return { error: "Ce dossier est en cours de traitement et ne peut plus être modifié." };
  }

  // Enregistrement des justificatifs dans l'espace privé (type réel et taille vérifiés).
  const uploads: { kind: DocumentKind; file: File }[] = FILE_FIELDS.flatMap(([field, kind]) => filesFrom(formData, field).map((file) => ({ kind, file })));
  if (uploads.length > 20) return { error: "20 fichiers maximum par envoi." };
  const saved: Awaited<ReturnType<typeof savePrivateDocument>>[] = [];
  try {
    for (const u of uploads) saved.push(await savePrivateDocument(u.file));
  } catch (e) {
    await Promise.all(saved.map((s) => deletePrivateDocument(s.storageKey)));
    if (e instanceof UploadError) return { error: e.message };
    throw e;
  }

  if (!application) {
    application = await db.ownerApplication.create({
      data: { ...data, reference: makeReference("PRO"), userId: user.id, history: { create: { status: "DRAFT", actorId: user.id, note: "Dossier créé" } } },
      include: { documents: true },
    });
  } else {
    application = await db.ownerApplication.update({ where: { id: application.id }, data, include: { documents: true } });
  }
  if (saved.length) {
    await db.document.createMany({
      data: saved.map((s, i) => ({ ...s, kind: uploads[i].kind, userId: user.id, applicationId: application!.id })),
    });
  }

  if (intent === "submit") {
    const kinds = new Set([...application.documents.map((d) => d.kind), ...uploads.map((u) => u.kind)]);
    const missing = [];
    if (!kinds.has("VEHICLE_PHOTO")) missing.push("au moins une photo du véhicule");
    if (!kinds.has("OWNERSHIP_PROOF")) missing.push("une preuve de propriété ou un mandat");
    if (missing.length) {
      redirect(`/proprietaires/dossier?id=${application.id}&manque=${encodeURIComponent(missing.join(" et "))}`);
    }
    await db.ownerApplication.update({
      where: { id: application.id },
      data: { status: "SUBMITTED", history: { create: { status: "SUBMITTED", actorId: user.id, note: application.status === "INCOMPLETE" ? "Compléments envoyés" : "" } } },
    });
    await logActivity({ actorId: user.id, entity: "OwnerApplication", entityId: application.id, action: "submitted" });
    await sendMail({
      to: user.email,
      subject: `Dossier propriétaire reçu — ${application.reference}`,
      text: `Bonjour ${user.name},\n\nNous avons bien reçu votre dossier pour ${data.brand} ${data.model} (${application.reference}). Notre équipe va le vérifier et vous tiendra informé. Aucun véhicule n'est publié avant validation.\n\nSuivre votre dossier : ${appUrl("/compte/proprietaire")}\n\nL'équipe AUTO225`,
    });
    await notifyTeam(`Dossier propriétaire ${application.reference}`, `${data.ownerName} — ${data.brand} ${data.model} ${data.year}\n${appUrl(`/admin/proprietaires/${application.id}`)}`);
    redirect(`/compte/proprietaire?soumis=${application.reference}`);
  }

  await logActivity({ actorId: user.id, entity: "OwnerApplication", entityId: application.id, action: "draft_saved" });
  redirect(`/compte/proprietaire?brouillon=${application.reference}`);
}

export async function deleteOwnDocument(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("documentId") ?? "");
  const doc = await db.document.findFirst({ where: { id, userId: user.id }, include: { application: true } });
  if (!doc) return;
  if (doc.application && !(EDITABLE as readonly string[]).includes(doc.application.status)) return;
  await db.document.delete({ where: { id: doc.id } });
  await deletePrivateDocument(doc.storageKey);
  revalidatePath("/compte/proprietaire");
  revalidatePath("/proprietaires/dossier");
}

const unavailabilitySchema = z.object({ vehicleId: z.string(), startAt: z.string(), endAt: z.string(), note: zOptionalText(300) });

export async function ownerAddUnavailability(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseForm(unavailabilitySchema, formData);
  if (!parsed.success) return parsed.state;
  const startAt = parseLocalDateTime(parsed.data.startAt);
  const endAt = parseLocalDateTime(parsed.data.endAt);
  if (!startAt || !endAt || endAt <= startAt) return { error: "Période invalide." };
  const vehicle = await db.vehicle.findFirst({ where: { id: parsed.data.vehicleId, ownerId: user.id } });
  if (!vehicle) return { error: "Véhicule introuvable." };
  const created = await db.unavailability.create({ data: { vehicleId: vehicle.id, startAt, endAt, reason: "OWNER", note: parsed.data.note } });
  await logActivity({ actorId: user.id, entity: "Vehicle", entityId: vehicle.id, action: "unavailability_added", data: { id: created.id, startAt: startAt.toISOString(), endAt: endAt.toISOString() } });
  await notifyTeam(`Indisponibilité propriétaire — ${vehicle.brand} ${vehicle.model}`, `Ajoutée par ${user.name}. Vérifiez les réservations existantes sur cette période.\n${appUrl(`/admin/vehicules/${vehicle.id}`)}`);
  revalidatePath("/compte/proprietaire");
  return { message: "Indisponibilité enregistrée. L'équipe AUTO225 en est informée." };
}
