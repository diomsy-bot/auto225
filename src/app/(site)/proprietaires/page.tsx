import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mettez votre voiture en location",
  description: "Confiez votre véhicule à AUTO225 : dépôt du dossier, vérification, validation et mise en ligne à Abidjan.",
};

const STEPS = [
  ["Dépôt du dossier", "Vous créez votre compte et décrivez votre véhicule, avec photos et justificatifs."],
  ["Vérification", "Notre équipe contrôle les documents et peut vous demander des compléments."],
  ["Inspection éventuelle", "Une inspection du véhicule peut être organisée selon le dossier."],
  ["Validation", "Votre dossier est validé ou refusé avec un motif."],
  ["Accord de gestion", "Nous convenons ensemble des conditions de mise en location."],
  ["Mise en ligne", "Votre véhicule est publié et vous suivez son activité dans votre espace."],
];

export default function OwnersPage() {
  return (
    <>
      <section className="bg-green-950 py-14 text-white">
        <div className="container-page max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-orange">Propriétaires</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Mettez votre voiture en location</h1>
          <p className="mt-4 text-white/85">
            AUTO225 gère la location de votre véhicule à Abidjan. Vous déposez votre dossier, nous vérifions et nous nous occupons des clients.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/proprietaires/dossier" className="btn-primary">Déposer mon dossier</Link>
            <Link href="/compte/proprietaire" className="btn border border-white/30 text-white hover:bg-white/10">Suivre mon dossier</Link>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <h2 className="heading-section">Comment ça marche</h2>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="card p-5">
              <span className="text-2xl font-extrabold text-orange-cta">{i + 1}</span>
              <p className="mt-2 font-semibold">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-surface py-14">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="heading-section">Responsabilités et conditions</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted">
              <li>Aucun véhicule n&apos;est publié avant la validation de votre dossier.</li>
              <li>Les modalités de commission, d&apos;entretien, d&apos;assurance, de sinistres et de versement des revenus vous sont communiquées avant la signature de l&apos;accord de gestion.</li>
              <li>Vos justificatifs sont conservés dans un espace privé et ne sont jamais publiés.</li>
              <li>Vous pouvez déclarer les périodes où votre véhicule n&apos;est pas disponible depuis votre espace propriétaire.</li>
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="font-bold">Documents à prévoir</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>✔ Photos récentes du véhicule (extérieur et intérieur)</li>
              <li>✔ Preuve de propriété (carte grise) ou mandat du propriétaire</li>
              <li>✔ Documents du véhicule (visite technique…)</li>
              <li>✔ Attestation d&apos;assurance</li>
              <li>✔ Pièce d&apos;identité</li>
            </ul>
            <p className="mt-4 text-xs text-muted">La liste définitive des pièces exigées est fixée par l&apos;équipe AUTO225.</p>
            <Link href="/proprietaires/dossier" className="btn-green mt-5">Commencer mon dossier</Link>
          </div>
        </div>
      </section>
    </>
  );
}
