import type { Metadata } from "next";
import Link from "next/link";
import { getContact, whatsappLink } from "@/lib/settings";

export const metadata: Metadata = { title: "Contact", description: "Contactez AUTO225 à Abidjan par téléphone, email ou WhatsApp." };

export default async function ContactPage() {
  const c = await getContact();
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="heading-section">Contact</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card p-5"><p className="text-sm text-muted">Adresse</p><p className="mt-1 font-semibold">{c.address}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">Téléphone</p><a href={`tel:${c.phone.replace(/\s/g, "")}`} className="mt-1 block font-semibold text-brand-green">{c.phone}</a></div>
        <div className="card p-5"><p className="text-sm text-muted">Email</p><a href={`mailto:${c.email}`} className="mt-1 block font-semibold text-brand-green">{c.email}</a></div>
        <div className="card p-5"><p className="text-sm text-muted">Horaires</p><p className="mt-1 font-semibold">{c.hours}</p></div>
      </div>
      {!c.confirmed && <p className="mt-4 text-xs text-muted">Coordonnées en cours de confirmation.</p>}
      <div className="mt-8 flex flex-wrap gap-3">
        <a href={whatsappLink(c.whatsapp)} target="_blank" rel="noopener noreferrer" className="btn-green">Écrire sur WhatsApp</a>
        <Link href="/service-particulier" className="btn-outline">Demander un devis</Link>
        <Link href="/suivi" className="btn-outline">Suivre une demande</Link>
      </div>
    </div>
  );
}
