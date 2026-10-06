import Link from "next/link";
import { getContact, whatsappLink } from "@/lib/settings";

export async function SiteFooter() {
  const contact = await getContact();
  return (
    <footer className="mt-16 bg-green-950 text-white">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xl font-extrabold">
            AUTO<span className="text-brand-orange">225</span>.COM
          </p>
          <p className="mt-3 text-sm text-white/80">Location, gestion et vente de véhicules à Abidjan.</p>
        </div>
        <div>
          <p className="font-semibold">Nos services</p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li><Link href="/location" className="hover:text-white">Louez un véhicule</Link></li>
            <li><Link href="/proprietaires" className="hover:text-white">Mettez votre voiture en location</Link></li>
            <li><Link href="/service-particulier" className="hover:text-white">Service particulier</Link></li>
            <li><Link href="/achat-vente" className="hover:text-white">Achat &amp; vente</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Informations</p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li><Link href="/a-propos" className="hover:text-white">À propos</Link></li>
            <li><Link href="/faq" className="hover:text-white">Questions fréquentes</Link></li>
            <li><Link href="/conditions" className="hover:text-white">Conditions générales</Link></li>
            <li><Link href="/confidentialite" className="hover:text-white">Confidentialité</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>{contact.address}</li>
            <li><a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="hover:text-white">{contact.phone}</a></li>
            <li><a href={`mailto:${contact.email}`} className="hover:text-white">{contact.email}</a></li>
            <li><a href={whatsappLink(contact.whatsapp)} className="hover:text-white" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
          </ul>
          {!contact.confirmed && (
            <p className="mt-3 text-xs text-white/60">Coordonnées en cours de confirmation.</p>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="container-page py-4 text-xs text-white/60">© {new Date().getFullYear()} AUTO225.COM — Tous droits réservés.</p>
      </div>
    </footer>
  );
}
