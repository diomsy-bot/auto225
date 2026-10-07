import Link from "next/link";
import { db } from "@/lib/db";
import { formatFcfa } from "@/lib/format";
import { SALE_STATUS_LABELS, VEHICLE_STATUS_LABELS } from "@/lib/labels";
import { Badge, StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Véhicules" };

export default async function VehiclesAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const vehicles = await db.vehicle.findMany({
    where: q ? { OR: [{ brand: { contains: q, mode: "insensitive" } }, { model: { contains: q, mode: "insensitive" } }, { plate: { contains: q, mode: "insensitive" } }] } : undefined,
    include: { owner: true, _count: { select: { bookings: { where: { status: "PENDING" } } } } },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Véhicules</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/vehicules/importer" className="btn-green btn-sm">Saisie assistée (IA)</Link>
          <Link href="/admin/vehicules/nouveau" className="btn-primary btn-sm">Ajouter un véhicule</Link>
        </div>
      </div>
      <form className="mt-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Marque, modèle, immatriculation" className="input max-w-xs" />
        <button className="btn-green">Rechercher</button>
      </form>
      <div className="card mt-4 overflow-x-auto">
        <table className="table">
          <thead><tr><th>Véhicule</th><th>Usage</th><th>Prix</th><th>Statut</th><th>Propriétaire</th><th>Demandes</th></tr></thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td>
                  <Link href={`/admin/vehicules/${v.id}`} className="font-semibold text-brand-green underline">{v.brand} {v.model} {v.year}</Link>
                  {v.isDemo && <span className="ml-2"><Badge tone="orange">Démo</Badge></span>}
                  {v.plate && <p className="text-xs text-muted">{v.plate}</p>}
                </td>
                <td className="space-x-1">{v.forRent && <Badge tone="green">Location</Badge>}{v.forSale && <Badge tone="blue">Vente</Badge>}</td>
                <td className="whitespace-nowrap text-xs">{v.forRent && <>{formatFcfa(v.dailyPrice)}/j<br /></>}{v.forSale && formatFcfa(v.salePrice)}</td>
                <td className="space-y-1"><StatusBadge status={v.status} labels={VEHICLE_STATUS_LABELS} />{v.forSale && <> <StatusBadge status={v.saleStatus} labels={SALE_STATUS_LABELS} /></>}</td>
                <td className="text-xs">{v.owner?.name ?? "AUTO225"}</td>
                <td>{v._count.bookings > 0 ? <Badge tone="orange">{v._count.bookings} en attente</Badge> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
