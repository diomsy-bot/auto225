import Link from "next/link";
import { notFound } from "next/navigation";
import { changeBookingStatus, changePaymentStatus } from "@/actions/admin/bookings";
import { ActionForm } from "@/components/admin/action-form";
import { StatusBadge } from "@/components/ui/badge";
import { isAvailable } from "@/lib/availability";
import { db } from "@/lib/db";
import { formatDateTime, formatFcfa } from "@/lib/format";
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/labels";
import { getPricingRules, whatsappLink } from "@/lib/settings";

export const metadata = { title: "Réservation" };

const NEXT: Record<string, [string, string][]> = {
  PENDING: [["CONFIRMED", "Confirmer"], ["REFUSED", "Refuser"], ["CANCELLED", "Annuler"]],
  CONFIRMED: [["IN_PROGRESS", "Véhicule remis (en cours)"], ["CANCELLED", "Annuler"]],
  IN_PROGRESS: [["COMPLETED", "Terminer la location"]],
};

export default async function BookingAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await db.booking.findUnique({ where: { id }, include: { vehicle: true, user: true } });
  if (!booking) notFound();
  const [history, rules] = await Promise.all([
    db.activityLog.findMany({ where: { entity: "Booking", entityId: id }, include: { actor: true }, orderBy: { createdAt: "asc" } }),
    getPricingRules(),
  ]);
  const available = booking.status === "PENDING" ? await isAvailable(booking.vehicleId, booking.startAt, booking.endAt, rules.bufferHours, undefined, booking.id) : null;

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/reservations" className="text-sm text-muted hover:underline">← Réservations</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-extrabold">{booking.reference}</h1>
        <StatusBadge status={booking.status} labels={BOOKING_STATUS_LABELS} />
        <StatusBadge status={booking.paymentStatus} labels={PAYMENT_STATUS_LABELS} />
      </div>
      {available === false && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">Attention : le véhicule n&apos;est plus disponible sur cette période. La confirmation sera refusée.</p>}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5 text-sm">
          <h2 className="mb-3 font-bold">Client</h2>
          <p className="font-semibold">{booking.customerName}</p>
          <p><a href={`tel:${booking.customerPhone}`} className="text-brand-green underline">{booking.customerPhone}</a></p>
          <p><a href={`mailto:${booking.customerEmail}`} className="text-brand-green underline">{booking.customerEmail}</a></p>
          <p className="mt-1 text-xs text-muted">{booking.user ? "Compte client" : "Sans compte"}</p>
          {booking.message && <p className="mt-3 rounded-lg bg-surface p-3">{booking.message}</p>}
          <a href={whatsappLink(booking.customerPhone.replace(/\D/g, "").replace(/^0/, "225"), booking.reference)} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm mt-3">WhatsApp</a>
        </section>
        <section className="card p-5 text-sm">
          <h2 className="mb-3 font-bold">Location</h2>
          <p><Link href={`/admin/vehicules/${booking.vehicleId}`} className="font-semibold text-brand-green underline">{booking.vehicle.brand} {booking.vehicle.model}</Link></p>
          <p>Départ : {formatDateTime(booking.startAt)}</p>
          <p>Retour : {formatDateTime(booking.endAt)}</p>
          <p>Lieu : {booking.pickupLocation}</p>
          <p>Chauffeur : {booking.withDriver ? "Oui" : "Non"} · Livraison : {booking.delivery ? "Oui" : "Non"}</p>
        </section>
      </div>

      <section className="card p-5 text-sm">
        <h2 className="mb-3 font-bold">Montants figés à la demande</h2>
        <dl className="grid gap-1 sm:grid-cols-2">
          <Item k="Durée facturée" v={`${booking.billedDays} jour(s) × ${formatFcfa(booking.unitPrice)}`} />
          <Item k="Location" v={formatFcfa(booking.rentalTotal)} />
          <Item k="Chauffeur" v={formatFcfa(booking.driverTotal)} />
          <Item k="Livraison" v={formatFcfa(booking.deliveryTotal)} />
          <Item k="Frais" v={formatFcfa(booking.feesTotal)} />
          <Item k="Taxes" v={formatFcfa(booking.taxTotal)} />
          <Item k="Total" v={formatFcfa(booking.total)} />
          <Item k="Caution (séparée)" v={formatFcfa(booking.deposit)} />
        </dl>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {NEXT[booking.status] && (
          <section className="card p-5">
            <h2 className="mb-3 font-bold">Traiter la demande</h2>
            <ActionForm action={changeBookingStatus} className="space-y-3">
              <input type="hidden" name="id" value={booking.id} />
              <label htmlFor="reason" className="label">Motif / message au client</label>
              <textarea id="reason" name="reason" rows={3} className="input" placeholder="Obligatoire en cas de refus" />
              <div className="flex flex-wrap gap-2">
                {NEXT[booking.status].map(([s, l]) => (
                  <button key={s} name="status" value={s} className={s === "CONFIRMED" || s === "COMPLETED" || s === "IN_PROGRESS" ? "btn-green" : "btn-outline"}>{l}</button>
                ))}
              </div>
            </ActionForm>
          </section>
        )}
        <section className="card p-5">
          <h2 className="mb-3 font-bold">Paiement (suivi manuel)</h2>
          <form action={changePaymentStatus} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={booking.id} />
            <select name="paymentStatus" defaultValue={booking.paymentStatus} className="input max-w-[220px]">
              {Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button className="btn-outline">Enregistrer</button>
          </form>
        </section>
      </div>

      <section className="card p-5 text-sm">
        <h2 className="mb-3 font-bold">Historique</h2>
        <ol className="space-y-1">
          {history.map((h) => (
            <li key={h.id}>{formatDateTime(h.createdAt)} — {h.action} — {h.actor?.name ?? "Client / visiteur"}{h.data && typeof h.data === "object" && "reason" in h.data ? ` (${String((h.data as { reason: string }).reason)})` : ""}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3 border-b border-line py-1"><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>;
}
