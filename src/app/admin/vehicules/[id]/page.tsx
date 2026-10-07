import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addUnavailability, deleteUnavailability, photoAction, uploadVehiclePhotos } from "@/actions/admin/vehicles";
import { ActionForm } from "@/components/admin/action-form";
import { VehicleCalendar } from "@/components/admin/calendar";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { StatusBadge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { BOOKING_STATUS_LABELS, UNAVAILABILITY_LABELS } from "@/lib/labels";

export const metadata = { title: "Véhicule" };

export default async function VehicleAdmin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ cree?: string; importe?: string }> }) {
  const [{ id }, { cree, importe }] = await Promise.all([params, searchParams]);
  const importLog = importe ? await db.activityLog.findFirst({ where: { entity: "Vehicle", entityId: id, action: "imported_ai" }, orderBy: { createdAt: "desc" } }) : null;
  const importWarnings = ((importLog?.data as { warnings?: unknown } | null)?.warnings ?? []) as string[];
  const vehicle = await db.vehicle.findUnique({
    where: { id },
    include: {
      owner: true,
      application: true,
      photos: { orderBy: { position: "asc" } },
      unavailabilities: { where: { endAt: { gte: new Date(Date.now() - 30 * 86400_000) } }, orderBy: { startAt: "asc" } },
      bookings: { where: { status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] }, endAt: { gte: new Date() } }, orderBy: { startAt: "asc" } },
    },
  });
  if (!vehicle) notFound();
  const history = await db.activityLog.findMany({ where: { entity: "Vehicle", entityId: id }, include: { actor: true }, orderBy: { createdAt: "desc" }, take: 20 });
  const periods = [
    ...vehicle.bookings.map((b) => ({ startAt: b.startAt, endAt: b.endAt, kind: b.status === "PENDING" ? ("pending" as const) : ("booking" as const) })),
    ...vehicle.unavailabilities.map((u) => ({ startAt: u.startAt, endAt: u.endAt, kind: "unavailable" as const })),
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/admin/vehicules" className="text-sm text-muted hover:underline">← Véhicules</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{vehicle.brand} {vehicle.model} {vehicle.year}</h1>
        <div className="flex gap-2">
          {vehicle.forRent && <Link href={`/location/${vehicle.slug}`} target="_blank" className="btn-outline btn-sm">Voir (location)</Link>}
          {vehicle.forSale && <Link href={`/achat-vente/${vehicle.slug}`} target="_blank" className="btn-outline btn-sm">Voir (vente)</Link>}
        </div>
      </div>
      {cree && <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-brand-green">Véhicule créé. Ajoutez des photos puis publiez-le.</p>}
      {importe && (
        <div role="status" className="rounded-xl bg-orange-50 px-4 py-3 text-sm">
          <p className="font-semibold">Fiche pré-remplie par l&apos;IA, en brouillon. Relisez chaque champ et les photos avant de publier.</p>
          {importWarnings.length > 0 && <ul className="mt-2 list-disc pl-5">{importWarnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}
        </div>
      )}
      {vehicle.application && <p className="text-sm">Issu du dossier <Link href={`/admin/proprietaires/${vehicle.application.id}`} className="font-mono text-brand-green underline">{vehicle.application.reference}</Link></p>}

      <section className="card p-5">
        <h2 className="mb-3 font-bold">Calendrier</h2>
        <VehicleCalendar periods={periods} />
        {vehicle.bookings.length > 0 && (
          <ul className="mt-4 divide-y divide-line text-sm">
            {vehicle.bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2 py-2">
                <Link href={`/admin/reservations/${b.id}`} className="font-mono text-brand-green underline">{b.reference}</Link>
                <span className="text-xs">{formatDateTime(b.startAt)} → {formatDateTime(b.endAt)}</span>
                <StatusBadge status={b.status} labels={BOOKING_STATUS_LABELS} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-bold">Indisponibilités (entretien, propriétaire…)</h2>
        <ul className="mb-4 divide-y divide-line text-sm">
          {vehicle.unavailabilities.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-2 py-2">
              <span>{formatDateTime(u.startAt)} → {formatDateTime(u.endAt)} · {UNAVAILABILITY_LABELS[u.reason]} {u.note && `· ${u.note}`}</span>
              <form action={deleteUnavailability}><input type="hidden" name="id" value={u.id} /><button className="text-xs text-red-700 underline">Supprimer</button></form>
            </li>
          ))}
        </ul>
        <ActionForm action={addUnavailability} className="grid gap-3 sm:grid-cols-5 sm:items-end">
          <input type="hidden" name="vehicleId" value={vehicle.id} />
          <div><label className="label" htmlFor="u-start">Du</label><input id="u-start" type="datetime-local" name="startAt" required className="input" /></div>
          <div><label className="label" htmlFor="u-end">Au</label><input id="u-end" type="datetime-local" name="endAt" required className="input" /></div>
          <div><label className="label" htmlFor="u-reason">Motif</label>
            <select id="u-reason" name="reason" className="input">{Object.entries(UNAVAILABILITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label className="label" htmlFor="u-note">Note</label><input id="u-note" name="note" className="input" /></div>
          <button className="btn-outline">Ajouter</button>
        </ActionForm>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-bold">Photos</h2>
        {vehicle.isDemo && <p className="mb-3 text-xs text-orange-cta">Véhicule de démonstration : remplacez les photos par celles du véhicule réel, puis décochez la mention démo en recréant la fiche réelle.</p>}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {vehicle.photos.map((p, i) => (
            <li key={p.id} className="overflow-hidden rounded-xl border border-line">
              <div className="relative aspect-[4/3]"><Image src={p.url} alt={p.alt} fill sizes="200px" className="object-cover" /></div>
              <div className="flex justify-between p-2 text-xs">
                {i === 0 ? <span className="text-muted">Principale</span> : (
                  <form action={photoAction}><input type="hidden" name="photoId" value={p.id} /><button name="op" value="first" className="text-brand-green underline">Mettre en premier</button></form>
                )}
                <form action={photoAction}><input type="hidden" name="photoId" value={p.id} /><button name="op" value="delete" className="text-red-700 underline">Supprimer</button></form>
              </div>
            </li>
          ))}
        </ul>
        <ActionForm action={uploadVehiclePhotos} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={vehicle.id} />
          <div><label className="label" htmlFor="ph">Ajouter des photos (JPG, PNG, WebP — 10 Mo max)</label><input id="ph" type="file" name="photos" multiple accept="image/jpeg,image/png,image/webp" className="input" /></div>
          <button className="btn-green">Envoyer</button>
        </ActionForm>
      </section>

      <VehicleForm vehicle={{ ...vehicle, ownerEmail: vehicle.owner?.email }} />

      <section className="card p-5 text-sm">
        <h2 className="mb-3 font-bold">Journal des modifications</h2>
        <ul className="space-y-1">
          {history.map((h) => (
            <li key={h.id} className="break-words">{formatDateTime(h.createdAt)} — {h.actor?.name ?? "Système"} — {h.action} {h.data ? <code className="text-xs text-muted">{JSON.stringify(h.data)}</code> : null}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
