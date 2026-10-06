import Link from "next/link";
import type { BookingStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatDateTime, formatFcfa } from "@/lib/format";
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/labels";
import { StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Réservations" };

export default async function BookingsAdmin({ searchParams }: { searchParams: Promise<{ statut?: string; q?: string }> }) {
  const { statut, q } = await searchParams;
  const where: Prisma.BookingWhereInput = {};
  if (statut && statut in BOOKING_STATUS_LABELS) where.status = statut as BookingStatus;
  if (q) where.OR = [{ reference: { contains: q, mode: "insensitive" } }, { customerName: { contains: q, mode: "insensitive" } }, { customerEmail: { contains: q, mode: "insensitive" } }, { customerPhone: { contains: q } }];
  const bookings = await db.booking.findMany({ where, include: { vehicle: true }, orderBy: { createdAt: "desc" }, take: 200 });
  const exportQuery = new URLSearchParams({ ...(statut ? { statut } : {}), ...(q ? { q } : {}) });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Réservations</h1>
        <a href={`/admin/export/reservations?${exportQuery}`} className="btn-outline btn-sm">Exporter (CSV)</a>
      </div>
      <form className="mt-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Référence, nom, email, téléphone" className="input max-w-xs" />
        <select name="statut" defaultValue={statut ?? ""} className="input max-w-[200px]">
          <option value="">Tous les statuts</option>
          {Object.entries(BOOKING_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="btn-green">Filtrer</button>
      </form>
      <div className="card mt-4 overflow-x-auto">
        <table className="table">
          <thead><tr><th>Référence</th><th>Client</th><th>Véhicule</th><th>Période</th><th>Total</th><th>Statut</th><th>Paiement</th></tr></thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td><Link href={`/admin/reservations/${b.id}`} className="font-mono font-semibold text-brand-green underline">{b.reference}</Link></td>
                <td>{b.customerName}<br /><span className="text-xs text-muted">{b.customerPhone}</span></td>
                <td>{b.vehicle.brand} {b.vehicle.model}</td>
                <td className="whitespace-nowrap text-xs">{formatDateTime(b.startAt)}<br />{formatDateTime(b.endAt)}</td>
                <td className="whitespace-nowrap">{formatFcfa(b.total)}</td>
                <td><StatusBadge status={b.status} labels={BOOKING_STATUS_LABELS} /></td>
                <td><StatusBadge status={b.paymentStatus} labels={PAYMENT_STATUS_LABELS} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && <p className="p-6 text-center text-sm text-muted">Aucune réservation.</p>}
      </div>
    </div>
  );
}
