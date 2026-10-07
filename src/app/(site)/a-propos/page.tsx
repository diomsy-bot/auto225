import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/site/page-intro";

export const metadata: Metadata = { title: "À propos", description: "AUTO225, votre partenaire en mobilité à Abidjan : location, gestion et vente de véhicules." };

export default function AboutPage() {
  return (
    <>
    <PageIntro eyebrow="À propos" title="La mobilité à votre mesure." />
    <div className="container-page max-w-4xl py-12">
      <div className="space-y-4 leading-relaxed text-[#6a756e]">
        <p>AUTO225 propose à Abidjan la location de véhicules avec ou sans chauffeur, la mise en location de voitures de particuliers, des services de transport sur mesure et l&apos;achat-vente de véhicules.</p>
        <p>Chaque véhicule est vérifié par notre équipe avant d&apos;être publié, et chaque demande est suivie par un interlocuteur dédié.</p>
        <p className="rounded-xl bg-surface p-4 text-sm">Texte de présentation à compléter par AUTO225 (historique, équipe, informations légales de l&apos;entreprise).</p>
      </div>
      <Link href="/contact" className="btn-green mt-8">Nous contacter</Link>
    </div>
    </>
  );
}
