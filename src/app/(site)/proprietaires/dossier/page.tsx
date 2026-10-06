import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { OwnerApplicationForm } from "@/components/owner/application-form";

export const metadata: Metadata = { title: "Dossier propriétaire", robots: { index: false } };

export default async function OwnerApplicationPage({ searchParams }: { searchParams: Promise<{ id?: string; manque?: string }> }) {
  const { id, manque } = await searchParams;
  const user = await requireUser(`/proprietaires/dossier${id ? `?id=${id}` : ""}`);
  const application = id ? await db.ownerApplication.findFirst({ where: { id, userId: user.id }, include: { documents: true } }) : null;
  if (id && !application) notFound();
  const locked = application && !["DRAFT", "INCOMPLETE"].includes(application.status);

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="heading-section">{application ? `Dossier ${application.reference}` : "Mettre ma voiture en location"}</h1>
      <p className="mt-2 text-muted">Les champs marqués d&apos;un * sont obligatoires. Vous pouvez enregistrer un brouillon et revenir plus tard.</p>
      {manque && (
        <p role="alert" className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-cta">
          Dossier enregistré en brouillon. Pour le soumettre, ajoutez {manque}.
        </p>
      )}
      {application?.status === "INCOMPLETE" && application.adminNote && (
        <p className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm">
          <strong>Compléments demandés :</strong> {application.adminNote}
        </p>
      )}
      {locked ? (
        <p className="card mt-6 p-5 text-sm">Ce dossier est en cours de traitement. Suivez son avancement depuis votre espace propriétaire.</p>
      ) : (
        <div className="card mt-6 p-5 sm:p-6">
          <OwnerApplicationForm
            application={application ? { ...application, documents: application.documents.map((d) => ({ id: d.id, kind: d.kind, originalName: d.originalName })) } : null}
            defaults={{ ownerName: user.name, ownerPhone: user.phone ?? "" }}
          />
        </div>
      )}
    </div>
  );
}
