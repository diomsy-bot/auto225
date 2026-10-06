import Image from "next/image";
import Link from "next/link";
import { getCurrentUser, isStaff } from "@/lib/auth";

export const NAV_LINKS = [
  { href: "/location", label: "Louez un véhicule" },
  { href: "/proprietaires", label: "Mettez votre voiture en location" },
  { href: "/service-particulier", label: "Service particulier" },
  { href: "/achat-vente", label: "Achat & vente" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="AUTO225.COM, accueil">
          <Image src="/brand/logo-auto225.png" alt="" width={44} height={44} priority />
          <span className="text-lg font-extrabold tracking-tight text-brand-green">
            AUTO<span className="text-brand-orange">225</span>.COM
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-green-50 hover:text-brand-green">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isStaff(user) && (
            <Link href="/admin" className="btn-outline btn-sm">
              Administration
            </Link>
          )}
          <Link href={user ? "/compte" : "/connexion"} className="btn-green btn-sm">
            {user ? "Mon compte" : "Se connecter"}
          </Link>
        </div>

        <details className="group relative lg:hidden">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-line [&::-webkit-details-marker]:hidden" aria-label="Ouvrir le menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>
          <nav aria-label="Menu mobile" className="absolute right-0 top-14 w-72 rounded-2xl border border-line bg-white p-2 shadow-xl">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="block rounded-lg px-3 py-3 text-sm font-medium hover:bg-green-50">
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-line" />
            <Link href="/faq" className="block rounded-lg px-3 py-3 text-sm hover:bg-green-50">Questions fréquentes</Link>
            <Link href="/contact" className="block rounded-lg px-3 py-3 text-sm hover:bg-green-50">Contact</Link>
            {isStaff(user) && (
              <Link href="/admin" className="block rounded-lg px-3 py-3 text-sm hover:bg-green-50">Administration</Link>
            )}
            <Link href={user ? "/compte" : "/connexion"} className="btn-green mt-2 w-full">
              {user ? "Mon compte" : "Se connecter"}
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
