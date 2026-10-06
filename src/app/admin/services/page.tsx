import Link from "next/link";
import type { ServiceRequestStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { SERVICE_STATUS_LABELS } from "@/lib/labels";
import { StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Services particuliers" };

export default async function ServicesAdmin({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const requests = await db.serviceRequest.findMany({
    where: statut && statut in SERVICE_STATUS_LABELS ? { status: statut as ServiceRequestStatus } : undefined,
    include: { serviceType: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Services particuliers</h1>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- route de téléchargement CSV */}
        <a href="/admin/export/services" className="btn-outline btn-sm">Exporter (CSV)</a>
      </div>
      <form className="mt-4 flex gap-2">
        <select name="statut" defaultValue={statut ?? ""} className="input max-w-[220px]">
          <option value="">Tous les statuts</option>
          {Object.entries(SERVICE_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="btn-green">Filtrer</button>
      </form>
      <div className="card mt-4 overflow-x-auto">
        <table className="table">
          <thead><tr><th>Référence</th><th>Service</th><th>Client</th><th>Date</th><th>Statut</th></tr></thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/admin/services/${r.id}`} className="font-mono font-semibold text-brand-green underline">{r.reference}</Link></td>
                <td>{r.serviceType.name}</td>
                <td>{r.name}<br /><span className="text-xs text-muted">{r.phone}</span></td>
                <td className="text-xs">{formatDate(r.date)} {r.time}</td>
                <td><StatusBadge status={r.status} labels={SERVICE_STATUS_LABELS} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && <p className="p-6 text-center text-sm text-muted">Aucune demande.</p>}
      </div>
    </div>
  );
}
