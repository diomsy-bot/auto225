import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Journal" };

export default async function JournalAdmin({ searchParams }: { searchParams: Promise<{ entite?: string }> }) {
  const { entite } = await searchParams;
  const logs = await db.activityLog.findMany({ where: entite ? { entity: entite } : undefined, include: { actor: true }, orderBy: { createdAt: "desc" }, take: 300 });
  const entities = ["Booking", "Vehicle", "OwnerApplication", "ServiceRequest", "SaleInquiry", "SaleProposal", "User", "Settings", "Content", "Review"];
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Journal d&apos;activité</h1>
      <p className="mt-1 text-sm text-muted">Changements de statut, de tarif et de disponibilité, avec auteur et date.</p>
      <form className="mt-4 flex gap-2">
        <select name="entite" defaultValue={entite ?? ""} className="input max-w-[240px]">
          <option value="">Tout</option>
          {entities.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <button className="btn-green">Filtrer</button>
      </form>
      <div className="card mt-4 overflow-x-auto">
        <table className="table">
          <thead><tr><th>Date</th><th>Auteur</th><th>Élément</th><th>Action</th><th>Détails</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap text-xs">{formatDateTime(l.createdAt)}</td>
                <td className="text-xs">{l.actor?.name ?? "Client / visiteur"}</td>
                <td className="text-xs">{l.entity}<br /><span className="font-mono text-muted">{l.entityId.slice(0, 10)}</span></td>
                <td className="text-xs font-semibold">{l.action}</td>
                <td className="max-w-md break-words font-mono text-[11px] text-muted">{l.data ? JSON.stringify(l.data) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
