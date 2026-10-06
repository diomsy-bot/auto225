"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { DocumentKind } from "@prisma/client";
import { logActivity } from "@/lib/activity";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseForm, zEmail, zInt, zOptionalText, zPhone, zText, type FormState } from "@/lib/form";
import { appUrl, notifyTeam, sendMail } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { makeReference } from "@/lib/reference";
import { UploadError, deletePrivateDocument, savePrivateDocument } from "@/lib/storage";
import { fromZonedTime } from "date-fns-tz";

const inquirySchema = z.object({
  vehicleId: z.string().min(1),
  kind: z.enum(["INFO", "VISIT"]),
  name: zText("Le nom"),
  email: zEmail,
  phone: zPhone,
  preferredDate: z.string().optional(),
  message: zOptionalText(2000),
  accept: z.literal("on", { error: "Vous devez accepter la politique de confidentialité." }),
  website: z.string().max(0).optional(),
});

export async function requestSaleInfo(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(inquirySchema, formData);
  if (!parsed.success) return parsed.state;
  const d = parsed.data;
  if (!(await rateLimit(`sale:${await clientIp()}`, 10, 3600))) return { error: "Trop de demandes envoyées. Réessayez plus tard." };
  const vehicle = await db.vehicle.findFirst({ where: { id: d.vehicleId, forSale: true, status: "PUBLISHED", saleStatus: { not: "SOLD" } } });
  if (!vehicle) return { error: "Ce véhicule n'est plus disponible à la vente." };
  const preferredDate = d.preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(d.preferredDate) ? fromZonedTime(`${d.preferredDate}T00:00`, "Africa/Abidjan") : null;
  const user = await getCurrentUser();
  const reference = makeReference("VTE");
  const inquiry = await db.saleInquiry.create({
    data: { reference, vehicleId: vehicle.id, userId: user?.id, kind: d.kind, name: d.name, email: d.email, phone: d.phone, message: d.message, preferredDate },
  });
  await logActivity({ actorId: user?.id, entity: "SaleInquiry", entityId: inquiry.id, action: "created" });
  const what = d.kind === "VISIT" ? "demande de visite" : "demande de renseignements";
  await sendMail({
    to: d.email,
    subject: `Votre ${what} — ${reference}`,
    text: `Bonjour ${d.name},\n\nNous avons bien reçu votre ${what} pour ${vehicle.brand} ${vehicle.model} ${vehicle.year}. Notre équipe vous recontacte rapidement.\n\nRéférence : ${reference}\n\nL'équipe AUTO225`,
  });
  await notifyTeam(`Achat — ${what} ${reference}`, `${vehicle.brand} ${vehicle.model} — ${d.name} ${d.phone} ${d.email}\n${appUrl(`/admin/vente`)}`);
  return { ok: true, message: `Demande envoyée (référence ${reference}). Notre équipe vous recontacte rapidement.` };
}

const proposalSchema = z.object({
  brand: zText("La marque", 60),
  model: zText("Le modèle", 60),
  year: zInt("L'année", 1980, new Date().getFullYear() + 1),
  mileage: zInt("Le kilométrage", 0, 2_000_000),
  transmission: z.enum(["MANUAL", "AUTOMATIC"], { error: "Choisissez une boîte de vitesses." }),
  fuel: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC"], { error: "Choisissez un carburant." }),
  askingPrice: zInt("Le prix souhaité", 0, 2_000_000_000),
  city: zText("La ville"),
  description: zOptionalText(3000),
});

export async function proposeVehicleForSale(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/achat-vente/proposer");
  const parsed = parseForm(proposalSchema, formData);
  if (!parsed.success) return parsed.state;
  if (!(await rateLimit(`proposal:${user.id}`, 5, 86400))) return { error: "Trop de propositions envoyées aujourd'hui." };

  const fields: [string, DocumentKind][] = [["photos", "VEHICLE_PHOTO"], ["papers", "VEHICLE_PAPERS"]];
  const uploads = fields.flatMap(([f, kind]) => formData.getAll(f).filter((x): x is File => x instanceof File && x.size > 0).map((file) => ({ file, kind })));
  if (!uploads.some((u) => u.kind === "VEHICLE_PHOTO")) return { error: "Ajoutez au moins une photo du véhicule.", values: Object.fromEntries(Object.entries(parsed.data).map(([k, v]) => [k, String(v)])) };
  if (uploads.length > 15) return { error: "15 fichiers maximum." };
  const saved: Awaited<ReturnType<typeof savePrivateDocument>>[] = [];
  try {
    for (const u of uploads) saved.push(await savePrivateDocument(u.file));
  } catch (e) {
    await Promise.all(saved.map((s) => deletePrivateDocument(s.storageKey)));
    if (e instanceof UploadError) return { error: e.message };
    throw e;
  }

  const reference = makeReference("PVV");
  const proposal = await db.saleProposal.create({
    data: {
      ...parsed.data,
      reference,
      userId: user.id,
      documents: { create: saved.map((s, i) => ({ ...s, kind: uploads[i].kind, userId: user.id })) },
    },
  });
  await logActivity({ actorId: user.id, entity: "SaleProposal", entityId: proposal.id, action: "created" });
  await sendMail({
    to: user.email,
    subject: `Proposition de vente reçue — ${reference}`,
    text: `Bonjour ${user.name},\n\nNous avons bien reçu votre proposition pour ${parsed.data.brand} ${parsed.data.model}. Notre équipe l'étudie et vous recontacte. Rien n'est publié sans validation.\n\nRéférence : ${reference}\n\nL'équipe AUTO225`,
  });
  await notifyTeam(`Proposition de vente ${reference}`, `${parsed.data.brand} ${parsed.data.model} ${parsed.data.year} — ${user.name}\n${appUrl("/admin/vente")}`);
  redirect(`/compte?onglet=vente&envoye=${reference}`);
}
