import Link from "next/link";
import { db } from "@/lib/db";
import { formatDateTime, formatFcfa } from "@/lib/format";
import { APPLICATION_STATUS_LABELS, BOOKING_STATUS_LABELS, SERVICE_STATUS_LABELS } from "@/lib/labels";
import { StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Tableau de bord" };

export default async function Dashboard() {
  const now = new Date();
  const in14 = new Date(now.getTime() + 14 * 86400_000);
  const [pending, upcoming, unavailable, applications, services, inquiries, proposals, reviews, stats] = await Promise.all([
    db.booking.findMany({ where: { status: "PENDING" }, include: { vehicle: true }, orderBy: { createdAt: "asc" }, take: 10 }),
    db.booking.findMany({ where: { status: "CONFIRMED", startAt: { gte: now, lte: in14 } }, include: { vehicle: true }, orderBy: { startAt: "asc" }, take: 10 }),
    db.unavailability.findMany({ where: { startAt: { lte: in14 }, endAt: { gte: now } }, include: { vehicle: true }, orderBy: { startAt: "asc" }, take: 10 }),
    db.ownerApplication.findMany({ where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } }, orderBy: { updatedAt: "asc" }, take: 10 }),
    db.serviceRequest.findMany({ where: { status: { in: ["NEW", "ACCEPTED"] } }, include: { serviceType: true }, orderBy: { createdAt: "asc" }, take: 10 }),
    db.saleInquiry.count({ where: { status: "NEW" } }),
    db.saleProposal.count({ where: { status: "SUBMITTED" } }),
    db.review.count({ where: { status: "PENDING" } }),
    db.booking.groupBy({ by: ["status"], _count: true, where: { createdAt: { gte: new Date(now.getTime() - 30 * 86400_000) } } }),
  ]);
  const count = (s: string) => stats.find((x) => x.status === s)?._count ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Tableau de bord</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Réservations à confirmer" value={pending.length} href="/admin/reservations?statut=PENDING" />
        <Kpi label="Locations à venir (14 j)" value={upcoming.length} href="/admin/reservations?statut=CONFIRMED" />
        <Kpi label="Dossiers propriétaires à traiter" value={applications.length} href="/admin/proprietaires" />
        <Kpi label="Demandes achat & vente" value={inquiries + proposals} href="/admin/vente" />
      </div>
      <p className="text-sm text-muted">
        30 derniers jours : {count("PENDING") + count("CONFIRMED") + count("IN_PROGRESS") + count("COMPLETED") + count("CANCELLED") + count("REFUSED")} demandes de location,
        {" "}{count("CONFIRMED") + count("IN_PROGRESS") + count("COMPLETED")} confirmées, {count("REFUSED")} refusées.
        {reviews > 0 && <> · <Link href="/admin/contenus#avis" className="text-brand-green underline">{reviews} avis à modérer</Link></>}
      </p>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Réservations à confirmer" href="/admin/reservations?statut=PENDING">
          {pending.map((b) => (
            <Row key={b.id} href={`/admin/reservations/${b.id}`} title={`${b.vehicle.brand} ${b.vehicle.model} — ${b.customerName}`} meta={`${formatDateTime(b.startAt)} → ${formatDateTime(b.endAt)} · ${formatFcfa(b.total)}`} badge={<StatusBadge status={b.status} labels={BOOKING_STATUS_LABELS} />} />
          ))}
        </Panel>
        <Panel title="Locations à venir" href="/admin/reservations?statut=CONFIRMED">
          {upcoming.map((b) => (
            <Row key={b.id} href={`/admin/reservations/${b.id}`} title={`${b.vehicle.brand} ${b.vehicle.model} — ${b.customerName}`} meta={`Départ ${formatDateTime(b.startAt)} · ${b.pickupLocation}`} />
          ))}
        </Panel>
        <Panel title="Véhicules indisponibles" href="/admin/vehicules">
          {unavailable.map((u) => (
            <Row key={u.id} href={`/admin/vehicules/${u.vehicleId}`} title={`${u.vehicle.brand} ${u.vehicle.model}`} meta={`${formatDateTime(u.startAt)} → ${formatDateTime(u.endAt)}${u.note ? ` · ${u.note}` : ""}`} />
          ))}
        </Panel>
        <Panel title="Dossiers propriétaires" href="/admin/proprietaires">
          {applications.map((a) => (
            <Row key={a.id} href={`/admin/proprietaires/${a.id}`} title={`${a.brand} ${a.model} — ${a.ownerName}`} meta={a.reference} badge={<StatusBadge status={a.status} labels={APPLICATION_STATUS_LABELS} />} />
          ))}
        </Panel>
        <Panel title="Services particuliers" href="/admin/services">
          {services.map((s) => (
            <Row key={s.id} href={`/admin/services/${s.id}`} title={`${s.serviceType.name} — ${s.name}`} meta={s.reference} badge={<StatusBadge status={s.status} labels={SERVICE_STATUS_LABELS} />} />
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Kpi({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card block p-5 hover:ring-2 hover:ring-brand-green">
      <p className="text-3xl font-extrabold text-brand-green">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </Link>
  );
}

function Panel({ title, href, children }: { title: string; href: string; children: React.ReactNode[] }) {
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        <Link href={href} className="text-sm text-brand-green underline">Tout voir</Link>
      </div>
      {children.length === 0 ? <p className="mt-3 text-sm text-muted">Rien à traiter.</p> : <ul className="mt-3 divide-y divide-line">{children}</ul>}
    </section>
  );
}

function Row({ href, title, meta, badge }: { href: string; title: string; meta: string; badge?: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <Link href={href} className="block truncate text-sm font-semibold hover:underline">{title}</Link>
        <p className="truncate text-xs text-muted">{meta}</p>
      </div>
      {badge}
    </li>
  );
}
