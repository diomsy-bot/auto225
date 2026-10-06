import Link from "next/link";
import { updateLeadStatus, updateProposalStatus } from "@/actions/admin/requests";
import { StatusBadge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { formatDate, formatFcfa } from "@/lib/format";
import { APPLICATION_STATUS_LABELS, DOCUMENT_KIND_LABELS, LEAD_STATUS_LABELS } from "@/lib/labels";

export const metadata = { title: "Achat & vente" };

export default async function SaleAdmin() {
  const [inquiries, proposals] = await Promise.all([
    db.saleInquiry.findMany({ include: { vehicle: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.saleProposal.findMany({ include: { user: true, documents: true }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold">Achat &amp; vente</h1>
      <section>
        <h2 className="text-lg font-bold">Demandes des acheteurs</h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="table">
            <thead><tr><th>Référence</th><th>Véhicule</th><th>Demande</th><th>Contact</th><th>Statut</th></tr></thead>
            <tbody>
              {inquiries.map((i) => (
                <tr key={i.id}>
                  <td className="font-mono text-xs">{i.reference}<br /><span className="text-muted">{formatDate(i.createdAt)}</span></td>
                  <td><Link href={`/admin/vehicules/${i.vehicleId}`} className="text-brand-green underline">{i.vehicle.brand} {i.vehicle.model}</Link></td>
                  <td className="text-xs">{i.kind === "VISIT" ? `Visite${i.preferredDate ? ` le ${formatDate(i.preferredDate)}` : ""}` : "Renseignements"}{i.message && <p className="mt-1 text-muted">{i.message}</p>}</td>
                  <td className="text-xs">{i.name}<br />{i.phone}<br />{i.email}</td>
                  <td>
                    <form action={updateLeadStatus} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={i.id} />
                      <select name="status" defaultValue={i.status} className="input min-h-9 py-1 text-xs">{Object.entries(LEAD_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                      <button className="btn-outline btn-sm">OK</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {inquiries.length === 0 && <p className="p-6 text-center text-sm text-muted">Aucune demande.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">Véhicules proposés à la vente (modération)</h2>
        <ul className="mt-3 space-y-4">
          {proposals.map((p) => (
            <li key={p.id} className="card p-5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{p.brand} {p.model} {p.year} · {formatFcfa(p.askingPrice)} <span className="font-mono text-xs text-muted">{p.reference}</span></p>
                <StatusBadge status={p.status} labels={APPLICATION_STATUS_LABELS} />
              </div>
              <p className="mt-1 text-muted">{p.mileage.toLocaleString("fr-FR")} km · {p.city} · {p.user.name} ({p.user.email}{p.user.phone ? `, ${p.user.phone}` : ""})</p>
              {p.description && <p className="mt-2">{p.description}</p>}
              <ul className="mt-2 flex flex-wrap gap-3 text-xs">
                {p.documents.map((d) => <li key={d.id}><a href={`/api/documents/${d.id}`} target="_blank" className="text-brand-green underline">{DOCUMENT_KIND_LABELS[d.kind]} — {d.originalName}</a></li>)}
              </ul>
              <form action={updateProposalStatus} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={p.id} />
                <select name="status" defaultValue={p.status === "SUBMITTED" ? "IN_REVIEW" : p.status} className="input max-w-[200px]">
                  {["IN_REVIEW", "INCOMPLETE", "APPROVED", "REJECTED", "SUSPENDED"].map((s) => <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s as keyof typeof APPLICATION_STATUS_LABELS]}</option>)}
                </select>
                <input name="note" defaultValue={p.adminNote} placeholder="Message au vendeur" className="input max-w-sm" />
                <button className="btn-outline">Mettre à jour et informer</button>
              </form>
              {p.status === "APPROVED" && <p className="mt-2 text-xs text-muted">Pour publier l&apos;annonce, <Link href="/admin/vehicules/nouveau" className="text-brand-green underline">créez la fiche véhicule</Link> (cochez « Proposé à la vente »).</p>}
            </li>
          ))}
        </ul>
        {proposals.length === 0 && <p className="mt-3 text-sm text-muted">Aucune proposition.</p>}
      </section>
    </div>
  );
}
