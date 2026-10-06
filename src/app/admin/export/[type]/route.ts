import type { BookingStatus } from "@prisma/client";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { APPLICATION_STATUS_LABELS, BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS, SERVICE_STATUS_LABELS } from "@/lib/labels";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // Neutralise les formules à l'ouverture dans un tableur.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};
const csv = (rows: unknown[][]) => "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");

export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user)) return new Response("Non autorisé", { status: 403 });
  const { type } = await params;
  const url = new URL(req.url);
  let rows: unknown[][];

  if (type === "reservations") {
    const statut = url.searchParams.get("statut");
    const data = await db.booking.findMany({ where: statut && statut in BOOKING_STATUS_LABELS ? { status: statut as BookingStatus } : undefined, include: { vehicle: true }, orderBy: { createdAt: "desc" } });
    rows = [["Référence", "Créée le", "Client", "Téléphone", "Email", "Véhicule", "Départ", "Retour", "Lieu", "Jours", "Total FCFA", "Caution FCFA", "Statut", "Paiement"],
      ...data.map((b) => [b.reference, formatDateTime(b.createdAt), b.customerName, b.customerPhone, b.customerEmail, `${b.vehicle.brand} ${b.vehicle.model}`, formatDateTime(b.startAt), formatDateTime(b.endAt), b.pickupLocation, b.billedDays, b.total, b.deposit, BOOKING_STATUS_LABELS[b.status], PAYMENT_STATUS_LABELS[b.paymentStatus]])];
  } else if (type === "services") {
    const data = await db.serviceRequest.findMany({ include: { serviceType: true }, orderBy: { createdAt: "desc" } });
    rows = [["Référence", "Créée le", "Service", "Client", "Téléphone", "Email", "Date", "Départ", "Destination", "Devis FCFA", "Statut"],
      ...data.map((s) => [s.reference, formatDateTime(s.createdAt), s.serviceType.name, s.name, s.phone, s.email, `${formatDateTime(s.date).split(" ")[0]} ${s.time}`, s.departure, s.destination, s.quoteAmount, SERVICE_STATUS_LABELS[s.status]])];
  } else if (type === "proprietaires") {
    const data = await db.ownerApplication.findMany({ orderBy: { createdAt: "desc" } });
    rows = [["Référence", "Créé le", "Propriétaire", "Téléphone", "Ville", "Véhicule", "Année", "Tarif souhaité", "Statut"],
      ...data.map((a) => [a.reference, formatDateTime(a.createdAt), a.ownerName, a.ownerPhone, a.city, `${a.brand} ${a.model}`, a.year, a.desiredPrice, APPLICATION_STATUS_LABELS[a.status]])];
  } else {
    return new Response("Export inconnu", { status: 404 });
  }

  return new Response(csv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="auto225-${type}-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
