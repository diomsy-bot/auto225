import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDateTime, formatFcfa } from "@/lib/format";
import { BOOKING_STATUS_LABELS } from "@/lib/labels";
import { getContact, whatsappLink } from "@/lib/settings";
import { StatusBadge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Demande reçue", robots: { index: false } };

export default async function BookingReceived({ params, searchParams }: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const [{ reference }, { email }] = await Promise.all([params, searchParams]);
  // La référence seule ne suffit pas : l'email de la demande est aussi exigé.
  const booking = await db.booking.findUnique({ where: { reference }, include: { vehicle: true } });
  if (!booking || !email || booking.customerEmail !== email.toLowerCase()) notFound();
  const contact = await getContact();
  const pending = booking.status === "PENDING";

  return (
    <div className="container-page max-w-2xl py-12">
      <div className="card p-6 sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-brand-green" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L20 7" /></svg>
        </div>
        <h1 className="mt-4 text-2xl font-extrabold">{pending ? "Demande reçue — confirmation en attente" : "Suivi de votre demande"}</h1>
        <p className="mt-2 text-muted">
          {pending
            ? "Votre demande n'est pas encore une réservation confirmée. Notre équipe vérifie la disponibilité et les conditions, puis vous envoie la confirmation avec les modalités de paiement et de remise du véhicule."
            : "Voici l'état actuel de votre demande."}
        </p>
        <dl className="mt-6 space-y-2 text-sm">
          <Row k="Référence" v={<span className="font-mono font-bold">{booking.reference}</span>} />
          <Row k="Statut" v={<StatusBadge status={booking.status} labels={BOOKING_STATUS_LABELS} />} />
          <Row k="Véhicule" v={`${booking.vehicle.brand} ${booking.vehicle.model}`} />
          <Row k="Départ" v={formatDateTime(booking.startAt)} />
          <Row k="Retour" v={formatDateTime(booking.endAt)} />
          <Row k="Lieu de retrait" v={booking.pickupLocation} />
          <Row k="Total estimé" v={formatFcfa(booking.total)} />
          <Row k="Caution (séparée)" v={formatFcfa(booking.deposit)} />
          {booking.decisionReason && <Row k="Motif" v={booking.decisionReason} />}
        </dl>
        <p className="mt-6 text-sm text-muted">Un accusé de réception a été envoyé à {booking.customerEmail}.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={whatsappLink(contact.whatsapp, booking.reference)} target="_blank" rel="noopener noreferrer" className="btn-green">Nous écrire sur WhatsApp</a>
          <Link href="/location" className="btn-outline">Retour au catalogue</Link>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
