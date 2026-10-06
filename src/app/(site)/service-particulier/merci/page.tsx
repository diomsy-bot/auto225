import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Demande envoyée", robots: { index: false } };

export default async function ServiceThanks({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  return (
    <div className="container-page max-w-xl py-14">
      <div className="card p-8 text-center">
        <h1 className="text-2xl font-extrabold">Demande reçue</h1>
        <p className="mt-3 text-muted">Merci. Notre équipe étudie votre demande et vous enverra un devis.</p>
        {ref && <p className="mt-4">Référence : <span className="font-mono font-bold">{ref}</span></p>}
        <p className="mt-2 text-sm text-muted">Un accusé de réception vous a été envoyé par email.</p>
        <Link href="/" className="btn-green mt-6">Retour à l&apos;accueil</Link>
      </div>
    </div>
  );
}
