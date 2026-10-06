import type { Metadata } from "next";
import Link from "next/link";
import { OwnerUnavailabilityForm } from "@/components/account/forms";
import { StatusBadge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, formatFcfa } from "@/lib/format";
import { APPLICATION_STATUS_LABELS, BOOKING_STATUS_LABELS, VEHICLE_STATUS_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Espace propriétaire", robots: { index: false } };

export default async function OwnerSpace({ searchParams }: { searchParams: Promise<{ soumis?: string; brouillon?: string }> }) {
  const user = await requireUser("/compte/proprietaire");
  const { soumis, brouillon } = await searchParams;
  const [applications, vehicles] = await Promise.all([
    db.ownerApplication.findMany({ where: { userId: user.id }, include: { history: { orderBy: { createdAt: "asc" } }, documents: true }, orderBy: { createdAt: "desc" } }),
    db.vehicle.findMany({
      where: { ownerId: user.id },
      include: {
        unavailabilities: { where: { endAt: { gte: new Date() } }, orderBy: { startAt: "asc" } },
        // Le propriétaire voit les périodes et montants, pas les coordonnées des clients.
        bookings: { where: { status: { in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"] } }, select: { id: true, reference: true, startAt: true, endAt: true, status: true, rentalTotal: true }, orderBy: { startAt: "desc" } },
      },
    }),
  ]);

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="heading-section">Espace propriétaire</h1>
        <Link href="/proprietaires/dossier" className="btn-primary btn-sm">Nouveau dossier</Link>
      </div>
      {soumis && <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-brand-green">Dossier {soumis} soumis. Notre équipe va le vérifier.</p>}
      {brouillon && <p role="status" className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm">Brouillon {brouillon} enregistré.</p>}

      <h2 className="mt-8 text-xl font-bold">Mes dossiers</h2>
      {applications.length === 0 ? (
        <div className="card mt-3 p-6 text-sm text-muted">Aucun dossier. <Link href="/proprietaires/dossier" className="text-brand-green underline">Déposer un dossier</Link></div>
      ) : (
        <ul className="mt-3 space-y-4">
          {applications.map((a) => (
            <li key={a.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{a.brand} {a.model} {a.year} <span className="ml-2 font-mono text-xs text-muted">{a.reference}</span></p>
                <StatusBadge status={a.status} labels={APPLICATION_STATUS_LABELS} />
              </div>
              {a.adminNote && <p className="mt-2 rounded-lg bg-orange-50 px-3 py-2 text-sm">Message de l&apos;équipe : {a.adminNote}</p>}
              <p className="mt-2 text-xs text-muted">{a.documents.length} fichier(s) déposé(s)</p>
              <ol className="mt-3 space-y-1 border-l-2 border-line pl-4 text-xs text-muted">
                {a.history.map((h) => (
                  <li key={h.id}>{formatDateTime(h.createdAt)} — {APPLICATION_STATUS_LABELS[h.status]}{h.note ? ` : ${h.note}` : ""}</li>
                ))}
              </ol>
              {["DRAFT", "INCOMPLETE"].includes(a.status) && (
                <Link href={`/proprietaires/dossier?id=${a.id}`} className="btn-green btn-sm mt-4">{a.status === "DRAFT" ? "Compléter et soumettre" : "Envoyer les compléments"}</Link>
              )}
            </li>
          ))}
        </ul>
      )}

      {vehicles.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-bold">Mes véhicules</h2>
          <ul className="mt-3 space-y-4">
            {vehicles.map((v) => {
              const validated = v.bookings.filter((b) => b.status === "COMPLETED").reduce((s, b) => s + b.rentalTotal, 0);
              return (
                <li key={v.id} className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">{v.brand} {v.model} {v.year}</p>
                    <StatusBadge status={v.status} labels={VEHICLE_STATUS_LABELS} />
                  </div>
                  <p className="mt-1 text-sm">Locations terminées : <strong>{formatFcfa(validated)}</strong> <span className="text-xs text-muted">(montant brut, avant commission et frais selon votre accord de gestion)</span></p>
                  {v.bookings.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm">
                      {v.bookings.slice(0, 8).map((b) => (
                        <li key={b.id} className="flex justify-between gap-2 border-b border-line py-1">
                          <span>{formatDate(b.startAt)} → {formatDate(b.endAt)}</span>
                          <StatusBadge status={b.status} labels={BOOKING_STATUS_LABELS} />
                        </li>
                      ))}
                    </ul>
                  )}
                  <h3 className="mt-4 text-sm font-semibold">Mes indisponibilités</h3>
                  {v.unavailabilities.length === 0 ? <p className="text-xs text-muted">Aucune.</p> : (
                    <ul className="mt-1 text-sm">
                      {v.unavailabilities.map((u) => <li key={u.id}>{formatDateTime(u.startAt)} → {formatDateTime(u.endAt)} {u.note && `· ${u.note}`}</li>)}
                    </ul>
                  )}
                  <OwnerUnavailabilityForm vehicleId={v.id} />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
