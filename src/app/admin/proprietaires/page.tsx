import Link from "next/link";
import type { ApplicationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { APPLICATION_STATUS_LABELS } from "@/lib/labels";
import { StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Dossiers propriétaires" };

export default async function ApplicationsAdmin({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const apps = await db.ownerApplication.findMany({
    where: statut && statut in APPLICATION_STATUS_LABELS ? { status: statut as ApplicationStatus } : { status: { not: "DRAFT" } },
    include: { _count: { select: { documents: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Dossiers propriétaires</h1>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- route de téléchargement CSV */}
        <a href="/admin/export/proprietaires" className="btn-outline btn-sm">Exporter (CSV)</a>
      </div>
      <form className="mt-4 flex gap-2">
        <select name="statut" defaultValue={statut ?? ""} className="input max-w-[220px]">
          <option value="">Tous (hors brouillons)</option>
          {Object.entries(APPLICATION_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="btn-green">Filtrer</button>
      </form>
      <div className="card mt-4 overflow-x-auto">
        <table className="table">
          <thead><tr><th>Référence</th><th>Propriétaire</th><th>Véhicule</th><th>Fichiers</th><th>Mis à jour</th><th>Statut</th></tr></thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id}>
                <td><Link href={`/admin/proprietaires/${a.id}`} className="font-mono font-semibold text-brand-green underline">{a.reference}</Link></td>
                <td>{a.ownerName}<br /><span className="text-xs text-muted">{a.ownerPhone}</span></td>
                <td>{a.brand} {a.model} {a.year}</td>
                <td>{a._count.documents}</td>
                <td className="text-xs">{formatDate(a.updatedAt)}</td>
                <td><StatusBadge status={a.status} labels={APPLICATION_STATUS_LABELS} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {apps.length === 0 && <p className="p-6 text-center text-sm text-muted">Aucun dossier.</p>}
      </div>
    </div>
  );
}
