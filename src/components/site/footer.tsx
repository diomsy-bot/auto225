import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getContact, whatsappLink } from "@/lib/settings";
import { BrandLogo } from "./brand";

const linkClass = "flex items-center gap-2 text-[13px] text-[#aebfb2] hover:text-white";

export async function SiteFooter() {
  const contact = await getContact();
  return (
    <footer className="mt-16 bg-green-950 text-[#d3e0d5]">
      <div className="container-page grid grid-cols-2 gap-x-5 gap-y-8 pt-12 pb-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">
        <div className="col-span-2 lg:col-span-1">
          <BrandLogo tone="dark" />
          <p className="mt-4 text-[13px] leading-relaxed text-[#94ad9c]">Votre mobilité, simplement.<br />Abidjan · Côte d&apos;Ivoire</p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <p className="mb-1 text-sm font-semibold text-white">Explorez</p>
          <Link href="/location" className={linkClass}>Louez un véhicule</Link>
          <Link href="/proprietaires" className={linkClass}>Mettez votre voiture en location</Link>
          <Link href="/service-particulier" className={linkClass}>Service particulier</Link>
          <Link href="/achat-vente" className={linkClass}>Achat &amp; vente</Link>
        </div>
        <div className="flex flex-col items-start gap-3">
          <p className="mb-1 text-sm font-semibold text-white">Avec AUTO225</p>
          <Link href="/a-propos" className={linkClass}>À propos</Link>
          <Link href="/faq" className={linkClass}>Questions fréquentes</Link>
          <Link href="/suivi" className={linkClass}>Suivre une demande</Link>
          <Link href="/compte" className={linkClass}>Mon espace</Link>
        </div>
        <div className="col-span-2 flex flex-col items-start gap-3 sm:col-span-1">
          <p className="mb-1 text-sm font-semibold text-white">Restons en contact</p>
          <span className="text-[13px] text-[#aebfb2]">{contact.address}</span>
          <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className={linkClass}>{contact.phone}</a>
          <a href={`mailto:${contact.email}`} className={linkClass}>{contact.email}</a>
          <a href={whatsappLink(contact.whatsapp)} className={linkClass} target="_blank" rel="noopener noreferrer">WhatsApp <ArrowUpRight size={15} aria-hidden="true" /></a>
          <Link href="/contact" className={linkClass}>Nous écrire <ArrowUpRight size={15} aria-hidden="true" /></Link>
          {!contact.confirmed && <span className="text-[11px] text-[#88a391]">Coordonnées en cours de confirmation.</span>}
          <span className="mt-1 rounded-full border border-[#44654e] px-3 py-2 text-[9px] tracking-[0.1em] text-[#a8c0ae]">CONÇU POUR LA CÔTE D&apos;IVOIRE</span>
        </div>
      </div>
      <div className="container-page">
        <div className="flex flex-col gap-4 border-t border-white/10 py-5 text-[11px] text-[#88a391] sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} AUTO225.COM · Tous droits réservés</span>
          <div className="flex gap-5">
            <Link href="/conditions" className="hover:text-white">Conditions générales</Link>
            <Link href="/confidentialite" className="hover:text-white">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
