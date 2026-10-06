"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseForm, zCheckbox, zInt, zPhone, zText, type FormState } from "@/lib/form";
import { appUrl, notifyTeam } from "@/lib/mail";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseForm(z.object({ name: zText("Le nom"), phone: zPhone, marketing: zCheckbox }), formData);
  if (!parsed.success) return parsed.state;
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name, phone: parsed.data.phone, marketingOptIn: parsed.data.marketing } });
  revalidatePath("/compte");
  return { message: "Profil mis à jour." };
}

export async function cancelOwnBooking(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const booking = await db.booking.findFirst({ where: { id, userId: user.id, status: "PENDING" } });
  if (!booking) return;
  await db.booking.update({ where: { id }, data: { status: "CANCELLED", decisionReason: "Annulée par le client", decidedAt: new Date() } });
  await logActivity({ actorId: user.id, entity: "Booking", entityId: id, action: "status:CANCELLED", data: { by: "client" } });
  await notifyTeam(`Demande annulée par le client ${booking.reference}`, appUrl(`/admin/reservations/${id}`));
  revalidatePath("/compte");
}

export async function leaveReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseForm(
    z.object({ bookingId: z.string(), rating: zInt("La note", 1, 5), comment: zText("Le commentaire", 1000) }),
    formData,
  );
  if (!parsed.success) return parsed.state;
  // Un avis n'est possible qu'après une location terminée, une seule fois.
  const booking = await db.booking.findFirst({ where: { id: parsed.data.bookingId, userId: user.id, status: "COMPLETED" }, include: { review: true } });
  if (!booking) return { error: "Avis possible uniquement après une location terminée." };
  if (booking.review) return { error: "Vous avez déjà laissé un avis pour cette location." };
  await db.review.create({
    data: { bookingId: booking.id, vehicleId: booking.vehicleId, author: user.name.split(" ")[0] ?? user.name, rating: parsed.data.rating, comment: parsed.data.comment },
  });
  revalidatePath("/compte");
  return { ok: true, message: "Merci ! Votre avis sera publié après modération." };
}

export async function requestDataDeletion(): Promise<FormState> {
  const user = await requireUser();
  await logActivity({ actorId: user.id, entity: "User", entityId: user.id, action: "data_deletion_requested" });
  await notifyTeam("Demande de suppression de données", `${user.name} (${user.email}) demande l'accès ou la suppression de ses données.\n${appUrl(`/admin/utilisateurs`)}`);
  return { message: "Votre demande a été transmise. Nous vous répondrons par email." };
}
