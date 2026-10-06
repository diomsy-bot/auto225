"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { parseForm, zEmail, zInt, zOptionalText, zPhone, zText, type FormState } from "@/lib/form";
import { appUrl, notifyTeam, sendMail } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { makeReference } from "@/lib/reference";
import { fromZonedTime } from "date-fns-tz";

const schema = z.object({
  serviceTypeId: z.string({ error: "Choisissez un type de service." }).min(1, "Choisissez un type de service."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Horaire invalide."),
  departure: zText("Le lieu de départ"),
  destination: zOptionalText(200),
  passengers: zInt("Le nombre de passagers", 1, 100),
  duration: zOptionalText(100),
  category: zOptionalText(100),
  name: zText("Le nom"),
  email: zEmail,
  phone: zPhone,
  message: zOptionalText(2000),
  accept: z.literal("on", { error: "Vous devez accepter la politique de confidentialité." }),
  website: z.string().max(0).optional(),
});

export async function requestService(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(schema, formData);
  if (!parsed.success) return parsed.state;
  const d = parsed.data;
  if (!(await rateLimit(`service:${await clientIp()}`, 10, 3600))) return { error: "Trop de demandes envoyées. Réessayez plus tard." };
  const serviceType = await db.serviceType.findFirst({ where: { id: d.serviceTypeId, active: true } });
  if (!serviceType) return { error: "Merci de corriger les champs indiqués.", fieldErrors: { serviceTypeId: "Service indisponible." } };
  const date = fromZonedTime(`${d.date}T00:00`, "Africa/Abidjan");
  if (date.getTime() < Date.now() - 86400_000) return { error: "Merci de corriger les champs indiqués.", fieldErrors: { date: "La date est passée." } };

  const user = await getCurrentUser();
  const reference = makeReference("SRV");
  const { accept: _a, website: _w, serviceTypeId, ...rest } = d;
  void _a;
  void _w;
  const request = await db.serviceRequest.create({ data: { ...rest, date, reference, serviceTypeId, userId: user?.id } });
  await logActivity({ actorId: user?.id, entity: "ServiceRequest", entityId: request.id, action: "created" });

  const summary = `Référence : ${reference}\nService : ${serviceType.name}\nDate : ${formatDate(date)} à ${d.time}\nDépart : ${d.departure}${d.destination ? `\nDestination : ${d.destination}` : ""}\nPassagers : ${d.passengers}`;
  await sendMail({
    to: d.email,
    subject: `Demande de service reçue — ${reference}`,
    text: `Bonjour ${d.name},\n\nNous avons bien reçu votre demande. Notre équipe l'étudie et vous enverra un devis.\n\n${summary}\n\nSuivi : ${appUrl(`/suivi?ref=${reference}`)}\n\nL'équipe AUTO225`,
  });
  await notifyTeam(`Service particulier ${reference}`, `${summary}\nClient : ${d.name} — ${d.phone} — ${d.email}\n${appUrl(`/admin/services/${request.id}`)}`);
  redirect(`/service-particulier/merci?ref=${reference}`);
}

export async function acceptQuote(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  const id = String(formData.get("id") ?? "");
  const request = await db.serviceRequest.findFirst({ where: { id, userId: user.id, status: "QUOTED" } });
  if (!request) return;
  await db.serviceRequest.update({ where: { id }, data: { status: "ACCEPTED" } });
  await logActivity({ actorId: user.id, entity: "ServiceRequest", entityId: id, action: "status:ACCEPTED", data: { by: "client" } });
  await notifyTeam(`Devis accepté ${request.reference}`, appUrl(`/admin/services/${id}`));
  redirect("/compte?onglet=services");
}
