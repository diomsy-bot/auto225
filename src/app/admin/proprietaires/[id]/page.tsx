import Link from "next/link";
import { notFound } from "next/navigation";
import { createVehicleFromApplication, updateApplicationStatus } from "@/actions/admin/requests";
import { ActionForm } from "@/components/admin/action-form";
import { StatusBadge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { formatDateTime, formatFcfa } from "@/lib/format";
import { APPLICATION_STATUS_LABELS, DOCUMENT_KIND_LABELS, FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/labels";

export const metadata = { title: "Dossier propriétaire" };

export default async function ApplicationAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await db.ownerApplication.findUnique({
    where: { id },
    include: { user: true, documents: { orderBy: { createdAt: "asc" } }, history: { orderBy: { createdAt: "asc" } }, vehicle: true },
  });
  if (!app) notFound();
  const actors = new Map((await db.user.findMany({ where: { id: { in: app.history.map((h) => h.actorId).filter((x): x is string => !!x) } }, select: { id: true, name: true } })).map((u) => [u.id, u.name]));

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/proprietaires" className="text-sm text-muted hover:underline">← Dossiers</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-extrabold">{app.reference}</h1>
        <StatusBadge status={app.status} labels={APPLICATION_STATUS_LABELS} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5 text-sm">
          <h2 className="mb-2 font-bold">Propriétaire</h2>
          <p className="font-semibold">{app.ownerName}</p>
          <p>{app.ownerPhone} · {app.user.email}</p>
          <p>{app.city}</p>
        </section>
        <section className="card p-5 text-sm">
          <h2 className="mb-2 font-bold">Véhicule</h2>
          <p className="font-semibold">{app.brand} {app.model} {app.year}</p>
          <p>{app.mileage.toLocaleString("fr-FR")} km · {TRANSMISSION_LABELS[app.transmission]} · {FUEL_LABELS[app.fuel]}</p>
          <p>Tarif souhaité : {app.desiredPrice ? formatFcfa(app.desiredPrice) : "—"}</p>
          {app.availability && <p className="mt-2">Disponibilités : {app.availability}</p>}
          {app.message && <p className="mt-2 rounded bg-surface p-2">{app.message}</p>}
        </section>
      </div>

      <section className="card p-5 text-sm">
        <h2 className="mb-3 font-bold">Justificatifs (accès contrôlé)</h2>
        {app.documents.length === 0 ? <p className="text-muted">Aucun fichier.</p> : (
          <ul className="divide-y divide-line">
            {app.documents.map((d) => (
              <li key={d.id} className="flex justify-between gap-3 py-2">
                <span>{DOCUMENT_KIND_LABELS[d.kind]}</span>
                <a href={`/api/documents/${d.id}`} target="_blank" className="text-brand-green underline">{d.originalName}</a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-bold">Décision</h2>
        <ActionForm action={updateApplicationStatus} className="space-y-3">
          <input type="hidden" name="id" value={app.id} />
          <label htmlFor="note" className="label">Message au propriétaire (compléments demandés, motif…)</label>
          <textarea id="note" name="note" rows={3} className="input" />
          <div className="flex flex-wrap gap-2">
            <button name="status" value="IN_REVIEW" className="btn-outline">Passer en vérification</button>
            <button name="status" value="INCOMPLETE" className="btn-outline">Demander un complément</button>
            <button name="status" value="APPROVED" className="btn-green">Valider</button>
            <button name="status" value="REJECTED" className="btn-outline">Refuser</button>
            <button name="status" value="SUSPENDED" className="btn-outline">Suspendre</button>
          </div>
        </ActionForm>
        {app.status === "APPROVED" && (
          <form action={createVehicleFromApplication} className="mt-4">
            <input type="hidden" name="id" value={app.id} />
            <button className="btn-primary">{app.vehicle ? "Ouvrir la fiche véhicule" : "Créer la fiche véhicule (non publiée)"}</button>
          </form>
        )}
      </section>

      <section className="card p-5 text-sm">
        <h2 className="mb-3 font-bold">Historique</h2>
        <ol className="space-y-1">
          {app.history.map((h) => (
            <li key={h.id}>{formatDateTime(h.createdAt)} — {APPLICATION_STATUS_LABELS[h.status]} — {h.actorId ? actors.get(h.actorId) ?? "?" : "—"}{h.note ? ` : ${h.note}` : ""}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
