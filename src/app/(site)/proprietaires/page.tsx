import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/site/page-intro";
import { ArrowUpRight, KeyRound, ShieldCheck } from "lucide-react";

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
      <PageIntro
        eyebrow="Devenez partenaire AUTO225"
        title={<>Mettez votre voiture en location.<br /><em>De nouvelles possibilités.</em></>}
        art={<KeyRound size={100} />}
        actions={
          <>
            <Link href="/proprietaires/dossier" className="btn-green">Déposer mon dossier <ArrowUpRight size={18} aria-hidden="true" /></Link>
            <Link href="/compte/proprietaire" className="btn-light">Suivre mon dossier</Link>
          </>
        }
      >
        AUTO225 gère la location de votre véhicule à Abidjan. Vous déposez votre dossier, nous vérifions et nous nous occupons des clients.
      </PageIntro>

      <section className="container-page py-14">
        <p className="eyebrow">Simple et encadré</p>
        <h2 className="heading-section mt-3">Comment ça marche</h2>
        <ol className="mt-9 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="relative pl-14 sm:pl-0">
              <span className="absolute top-0 left-0 grid h-9 w-9 place-items-center rounded-full border border-[#dfe9dd] bg-[#f0f5ee] text-xs text-brand-green sm:static sm:mb-5 sm:h-11 sm:w-11" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-[17px] font-bold sm:text-[19px]">{t}</h3>
              <p className="mt-2 max-w-[290px] text-[13px] leading-[1.75] text-[#6a756e]">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="py-6">
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
          <div className="rounded-[10px] border border-[#d9e6d4] bg-surface p-6">
            <ShieldCheck className="text-brand-green" aria-hidden="true" />
            <h3 className="mt-3 font-bold">Documents à prévoir</h3>
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
