import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { APPLICATION_STATUS_LABELS, LEAD_STATUS_LABELS, SERVICE_STATUS_LABELS } from "@/lib/labels";
import { StatusBadge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Suivre une demande", robots: { index: false } };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ ref?: string; email?: string }> }) {
  const { ref, email } = await searchParams;
  const reference = ref?.trim().toUpperCase();
  const mail = email?.trim().toLowerCase();
  let result: { label: string; status: string; labels: Record<string, string> } | null = null;
  let searched = false;

  if (reference && mail) {
    searched = true;
    if (reference.startsWith("LOC-")) {
      const b = await db.booking.findUnique({ where: { reference }, select: { customerEmail: true } });
      if (b?.customerEmail === mail) redirect(`/location/demande/${reference}?email=${encodeURIComponent(mail)}`);
    } else if (reference.startsWith("SRV-")) {
      const s = await db.serviceRequest.findUnique({ where: { reference }, include: { serviceType: true } });
      if (s?.email === mail) result = { label: s.serviceType.name, status: s.status, labels: SERVICE_STATUS_LABELS };
    } else if (reference.startsWith("VTE-")) {
      const s = await db.saleInquiry.findUnique({ where: { reference }, include: { vehicle: true } });
      if (s?.email === mail) result = { label: `Demande sur ${s.vehicle.brand} ${s.vehicle.model}`, status: s.status, labels: LEAD_STATUS_LABELS };
    } else if (reference.startsWith("PVV-") || reference.startsWith("PRO-")) {
      result = { label: "Ce dossier se suit depuis votre espace client.", status: "", labels: APPLICATION_STATUS_LABELS };
    }
  }

  return (
    <div className="container-page max-w-xl py-12">
      <h1 className="heading-section">Suivre une demande</h1>
      <p className="mt-2 text-muted">Saisissez la référence reçue par email et l&apos;adresse utilisée pour la demande.</p>
      <form method="get" className="card mt-6 space-y-4 p-5">
        <div>
          <label htmlFor="ref" className="label">Référence</label>
          <input id="ref" name="ref" required defaultValue={ref} placeholder="LOC-26-XXXXXX" className="input font-mono uppercase" />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" required defaultValue={email} className="input" />
        </div>
        <button className="btn-primary w-full">Afficher le statut</button>
      </form>
      {searched && (
        <div className="card mt-6 p-5" role="status">
          {result ? (
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold">{result.label}</p>
              {result.status && <StatusBadge status={result.status} labels={result.labels} />}
            </div>
          ) : (
            <p className="text-sm text-muted">Aucune demande ne correspond à cette référence et à cet email.</p>
          )}
        </div>
      )}
    </div>
  );
}
