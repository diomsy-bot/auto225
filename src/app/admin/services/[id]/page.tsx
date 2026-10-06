import Link from "next/link";
import { notFound } from "next/navigation";
import { updateServiceRequest } from "@/actions/admin/requests";
import { ActionForm } from "@/components/admin/action-form";
import { StatusBadge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, toLocalInputValue } from "@/lib/format";
import { SERVICE_STATUS_LABELS } from "@/lib/labels";

export const metadata = { title: "Service particulier" };

export default async function ServiceAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await db.serviceRequest.findUnique({ where: { id }, include: { serviceType: true } });
  if (!r) notFound();
  const history = await db.activityLog.findMany({ where: { entity: "ServiceRequest", entityId: id }, include: { actor: true }, orderBy: { createdAt: "asc" } });
  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/services" className="text-sm text-muted hover:underline">← Services</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-extrabold">{r.reference}</h1>
        <StatusBadge status={r.status} labels={SERVICE_STATUS_LABELS} />
      </div>
      <section className="card grid gap-4 p-5 text-sm sm:grid-cols-2">
        <div>
          <h2 className="mb-2 font-bold">{r.serviceType.name}</h2>
          <p>{formatDate(r.date)} à {r.time}</p>
          <p>Départ : {r.departure}</p>
          {r.destination && <p>Destination : {r.destination}</p>}
          <p>Passagers : {r.passengers}{r.duration && ` · Durée : ${r.duration}`}{r.category && ` · Catégorie : ${r.category}`}</p>
        </div>
        <div>
          <h2 className="mb-2 font-bold">Client</h2>
          <p className="font-semibold">{r.name}</p>
          <p><a href={`tel:${r.phone}`} className="text-brand-green underline">{r.phone}</a> · <a href={`mailto:${r.email}`} className="text-brand-green underline">{r.email}</a></p>
          {r.message && <p className="mt-2 rounded bg-surface p-2">{r.message}</p>}
        </div>
      </section>
      <section className="card p-5">
        <h2 className="mb-3 font-bold">Traitement</h2>
        <ActionForm action={updateServiceRequest} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={r.id} />
          <div><label className="label" htmlFor="st">Statut</label>
            <select id="st" name="status" defaultValue={r.status} className="input">{Object.entries(SERVICE_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label className="label" htmlFor="qa">Montant du devis (FCFA)</label><input id="qa" name="quoteAmount" type="number" defaultValue={r.quoteAmount ?? ""} className="input" /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="qn">Détail du devis (envoyé au client)</label><textarea id="qn" name="quoteNote" rows={2} defaultValue={r.quoteNote} className="input" /></div>
          <div><label className="label" htmlFor="sc">Prestation planifiée le</label><input id="sc" name="scheduledAt" type="datetime-local" defaultValue={r.scheduledAt ? toLocalInputValue(r.scheduledAt) : ""} className="input" /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="cm">Message au client (précisions demandées…)</label><textarea id="cm" name="clientMessage" rows={2} className="input" /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="in">Note interne</label><textarea id="in" name="internalNote" rows={2} defaultValue={r.internalNote} className="input" /></div>
          <div><button className="btn-green">Enregistrer</button></div>
        </ActionForm>
      </section>
      <section className="card p-5 text-sm">
        <h2 className="mb-3 font-bold">Historique</h2>
        <ol className="space-y-1">{history.map((h) => <li key={h.id}>{formatDateTime(h.createdAt)} — {h.action} — {h.actor?.name ?? "Client"}</li>)}</ol>
      </section>
    </div>
  );
}
