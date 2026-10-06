"use server";

import { revalidatePath } from "next/cache";
import type { BookingStatus, PaymentStatus } from "@prisma/client";
import { logActivity } from "@/lib/activity";
import { requireStaff } from "@/lib/auth";
import { ConflictError, confirmBookingById } from "@/lib/booking-ops";
import { db } from "@/lib/db";
import { formatDateTime, formatFcfa } from "@/lib/format";
import type { FormState } from "@/lib/form";
import { appUrl, sendMail } from "@/lib/mail";
import { getContact, getPricingRules } from "@/lib/settings";

async function notifyCustomer(bookingId: string) {
  const b = await db.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { vehicle: true } });
  const contact = await getContact();
  const link = appUrl(`/location/demande/${b.reference}?email=${encodeURIComponent(b.customerEmail)}`);
  const base = `Véhicule : ${b.vehicle.brand} ${b.vehicle.model}\nDu ${formatDateTime(b.startAt)} au ${formatDateTime(b.endAt)}\nRetrait : ${b.pickupLocation}`;
  const messages: Partial<Record<BookingStatus, { subject: string; text: string }>> = {
    CONFIRMED: {
      subject: `Réservation confirmée — ${b.reference}`,
      text: `Votre réservation est confirmée.\n\n${base}\nTotal : ${formatFcfa(b.total)}\nCaution (séparée) : ${formatFcfa(b.deposit)}\n\nModalités de paiement et de remise du véhicule : notre équipe vous contacte au ${b.customerPhone}. Vous pouvez aussi nous joindre au ${contact.phone}.`,
    },
    REFUSED: { subject: `Demande non retenue — ${b.reference}`, text: `Nous ne pouvons pas donner suite à votre demande.\nMotif : ${b.decisionReason || "non précisé"}\n\n${base}` },
    CANCELLED: { subject: `Réservation annulée — ${b.reference}`, text: `Votre réservation a été annulée.\n${b.decisionReason ? `Motif : ${b.decisionReason}\n` : ""}\n${base}` },
  };
  const m = messages[b.status];
  if (m) await sendMail({ to: b.customerEmail, subject: m.subject, text: `Bonjour ${b.customerName},\n\n${m.text}\n\nSuivi : ${link}\n\nL'équipe AUTO225` });
}

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "REFUSED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  REFUSED: [],
};

export async function changeBookingStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as BookingStatus;
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking) return { error: "Réservation introuvable." };
  if (!TRANSITIONS[booking.status].includes(status)) return { error: "Changement de statut non autorisé." };
  if (status === "REFUSED" && !reason) return { error: "Indiquez le motif du refus.", fieldErrors: { reason: "Motif requis." } };

  if (status === "CONFIRMED") {
    try {
      await confirmBookingById(id, user.id, (await getPricingRules()).bufferHours);
    } catch (e) {
      if (e instanceof ConflictError) return { error: e.message };
      throw e;
    }
  } else {
    // Une annulation ou un refus libère la période (seules CONFIRMED / IN_PROGRESS bloquent).
    await db.booking.update({ where: { id }, data: { status, decisionReason: reason || booking.decisionReason, decidedAt: new Date() } });
    await logActivity({ actorId: user.id, entity: "Booking", entityId: id, action: `status:${status}`, data: reason ? { reason } : undefined });
  }
  await notifyCustomer(id);
  revalidatePath(`/admin/reservations/${id}`);
  revalidatePath("/admin");
  return { message: "Statut mis à jour. Le client a été informé par email." };
}

export async function changePaymentStatus(formData: FormData): Promise<void> {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const paymentStatus = String(formData.get("paymentStatus") ?? "") as PaymentStatus;
  if (!["UNPAID", "PARTIAL", "PAID", "REFUNDED"].includes(paymentStatus)) return;
  await db.booking.update({ where: { id }, data: { paymentStatus } });
  await logActivity({ actorId: user.id, entity: "Booking", entityId: id, action: `payment:${paymentStatus}` });
  revalidatePath(`/admin/reservations/${id}`);
}
