"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ApplicationStatus, LeadStatus, ServiceRequestStatus } from "@prisma/client";
import { logActivity } from "@/lib/activity";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatFcfa, parseLocalDateTime, slugify } from "@/lib/format";
import type { FormState } from "@/lib/form";
import { APPLICATION_STATUS_LABELS, SERVICE_STATUS_LABELS } from "@/lib/labels";
import { appUrl, sendMail } from "@/lib/mail";

// ─── Dossiers propriétaires ─────────────────────────────────────────────────

const APP_STATUSES: ApplicationStatus[] = ["INCOMPLETE", "IN_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"];

export async function updateApplicationStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ApplicationStatus;
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);
  if (!APP_STATUSES.includes(status)) return { error: "Statut invalide." };
  if ((status === "INCOMPLETE" || status === "REJECTED") && !note) return { error: "Précisez les compléments demandés ou le motif.", fieldErrors: { note: "Message requis." } };
  const app = await db.ownerApplication.findUnique({ where: { id }, include: { user: true } });
  if (!app) return { error: "Dossier introuvable." };
  await db.ownerApplication.update({
    where: { id },
    data: { status, adminNote: note || app.adminNote, history: { create: { status, note, actorId: user.id } } },
  });
  if (status === "APPROVED" && app.user.role === "CLIENT") await db.user.update({ where: { id: app.userId }, data: { role: "OWNER" } });
  // Suspendre ou refuser retire le véhicule associé du site.
  if (status === "SUSPENDED" || status === "REJECTED") await db.vehicle.updateMany({ where: { applicationId: id, status: "PUBLISHED" }, data: { status: "DRAFT" } });
  await logActivity({ actorId: user.id, entity: "OwnerApplication", entityId: id, action: `status:${status}`, data: note ? { note } : undefined });
  await sendMail({
    to: app.user.email,
    subject: `Votre dossier ${app.reference} : ${APPLICATION_STATUS_LABELS[status]}`,
    text: `Bonjour ${app.user.name},\n\nLe statut de votre dossier pour ${app.brand} ${app.model} est maintenant : ${APPLICATION_STATUS_LABELS[status]}.${note ? `\n\nMessage de l'équipe : ${note}` : ""}\n\nVotre espace : ${appUrl("/compte/proprietaire")}\n\nL'équipe AUTO225`,
  });
  revalidatePath(`/admin/proprietaires/${id}`);
  return { message: "Statut mis à jour. Le propriétaire a été informé." };
}

/** Crée une fiche véhicule (brouillon, non publiée) à partir d'un dossier validé. */
export async function createVehicleFromApplication(formData: FormData): Promise<void> {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const app = await db.ownerApplication.findUnique({ where: { id }, include: { vehicle: true } });
  if (!app || app.status !== "APPROVED") return;
  if (app.vehicle) redirect(`/admin/vehicules/${app.vehicle.id}`);
  const vehicle = await db.vehicle.create({
    data: {
      slug: `${slugify(`${app.brand}-${app.model}-${app.year}`)}-${Date.now().toString(36)}`,
      brand: app.brand,
      model: app.model,
      year: app.year,
      category: "BERLINE",
      transmission: app.transmission,
      fuel: app.fuel,
      seats: 5,
      city: app.city,
      mileage: app.mileage,
      dailyPrice: app.desiredPrice,
      status: "DRAFT",
      ownerId: app.userId,
      applicationId: app.id,
    },
  });
  await logActivity({ actorId: user.id, entity: "Vehicle", entityId: vehicle.id, action: "created_from_application", data: { application: app.reference } });
  redirect(`/admin/vehicules/${vehicle.id}?cree=1`);
}

// ─── Services particuliers ──────────────────────────────────────────────────

export async function updateServiceRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ServiceRequestStatus;
  if (!(status in SERVICE_STATUS_LABELS)) return { error: "Statut invalide." };
  const amountRaw = String(formData.get("quoteAmount") ?? "").trim();
  const quoteAmount = amountRaw ? Number(amountRaw) : null;
  if (quoteAmount != null && (!Number.isInteger(quoteAmount) || quoteAmount < 0)) return { error: "Montant invalide.", fieldErrors: { quoteAmount: "Montant invalide." } };
  if (status === "QUOTED" && quoteAmount == null) return { error: "Indiquez le montant du devis.", fieldErrors: { quoteAmount: "Montant requis." } };
  const quoteNote = String(formData.get("quoteNote") ?? "").slice(0, 2000);
  const internalNote = String(formData.get("internalNote") ?? "").slice(0, 2000);
  const scheduledAt = parseLocalDateTime(String(formData.get("scheduledAt") ?? ""));
  const message = String(formData.get("clientMessage") ?? "").trim().slice(0, 2000);

  const before = await db.serviceRequest.findUnique({ where: { id }, include: { serviceType: true } });
  if (!before) return { error: "Demande introuvable." };
  await db.serviceRequest.update({ where: { id }, data: { status, quoteAmount, quoteNote, internalNote, scheduledAt } });
  await logActivity({ actorId: user.id, entity: "ServiceRequest", entityId: id, action: before.status !== status ? `status:${status}` : "updated", data: { quoteAmount } });

  if (before.status !== status || message) {
    const lines = [`Le statut de votre demande ${before.reference} (${before.serviceType.name}) est : ${SERVICE_STATUS_LABELS[status]}.`];
    if (status === "QUOTED" && quoteAmount != null) lines.push(`Montant du devis : ${formatFcfa(quoteAmount)}${quoteNote ? `\n${quoteNote}` : ""}`, `Pour accepter le devis, connectez-vous à votre compte ou répondez à cet email.`);
    if (message) lines.push(`Message de l'équipe : ${message}`);
    await sendMail({ to: before.email, subject: `Votre demande ${before.reference}`, text: `Bonjour ${before.name},\n\n${lines.join("\n\n")}\n\nVotre compte : ${appUrl("/compte?onglet=services")}\n\nL'équipe AUTO225` });
  }
  revalidatePath(`/admin/services/${id}`);
  return { message: "Demande mise à jour." };
}

// ─── Achat & vente ──────────────────────────────────────────────────────────

export async function updateLeadStatus(formData: FormData): Promise<void> {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as LeadStatus;
  if (!["NEW", "IN_PROGRESS", "CLOSED"].includes(status)) return;
  await db.saleInquiry.update({ where: { id }, data: { status } });
  await logActivity({ actorId: user.id, entity: "SaleInquiry", entityId: id, action: `status:${status}` });
  revalidatePath("/admin/vente");
}

export async function updateProposalStatus(formData: FormData): Promise<void> {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ApplicationStatus;
  const note = String(formData.get("note") ?? "").slice(0, 2000);
  if (!APP_STATUSES.includes(status)) return;
  const p = await db.saleProposal.update({ where: { id }, data: { status, adminNote: note }, include: { user: true } });
  await logActivity({ actorId: user.id, entity: "SaleProposal", entityId: id, action: `status:${status}` });
  await sendMail({
    to: p.user.email,
    subject: `Votre proposition ${p.reference} : ${APPLICATION_STATUS_LABELS[status]}`,
    text: `Bonjour ${p.user.name},\n\nStatut de votre proposition (${p.brand} ${p.model}) : ${APPLICATION_STATUS_LABELS[status]}.${note ? `\n\nMessage : ${note}` : ""}\n\nL'équipe AUTO225`,
  });
  revalidatePath("/admin/vente");
}
