import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "À propos", description: "AUTO225, votre partenaire en mobilité à Abidjan : location, gestion et vente de véhicules." };

export default function AboutPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <p className="eyebrow">À propos</p>
      <h1 className="heading-section mt-1">AUTO225, votre partenaire en mobilité</h1>
      <div className="mt-6 space-y-4 text-muted">
        <p>AUTO225 propose à Abidjan la location de véhicules avec ou sans chauffeur, la mise en location de voitures de particuliers, des services de transport sur mesure et l&apos;achat-vente de véhicules.</p>
        <p>Chaque véhicule est vérifié par notre équipe avant d&apos;être publié, et chaque demande est suivie par un interlocuteur dédié.</p>
        <p className="rounded-xl bg-surface p-4 text-sm">Texte de présentation à compléter par AUTO225 (historique, équipe, informations légales de l&apos;entreprise).</p>
      </div>
      <Link href="/contact" className="btn-green mt-8">Nous contacter</Link>
    </div>
  );
}
