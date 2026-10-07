import Link from "next/link";
import { ArrowUpRight, MapPin, Menu, UserRound } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { BrandLogo } from "./brand";
import { NAV_LINKS } from "./nav-config";
import { MainNav } from "./nav-links";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const accountHref = user ? "/compte" : "/connexion";
  return (
    <>
      <div className="bg-brand-green text-[10px] tracking-[0.04em] text-[#e5eee8] sm:text-[11px]">
        <div className="container-page flex items-center justify-between py-2">
          <span className="flex items-center gap-2"><MapPin size={12} aria-hidden="true" /> Côte d&apos;Ivoire · Abidjan</span>
          <Link href="/location" className="hidden items-center gap-2 hover:text-white sm:flex">
            Votre prochain trajet commence ici <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-transparent bg-white/95 backdrop-blur">
        <div className="container-page flex h-[74px] items-center justify-between gap-4 lg:h-[91px] lg:gap-7">
          <Link href="/" className="shrink-0" aria-label="AUTO225.COM, accueil">
            <BrandLogo />
          </Link>

          <MainNav />

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            {isStaff(user) && (
              <Link href="/admin" className="hidden rounded-md border border-line px-3 py-3 text-xs font-semibold text-brand-green hover:border-brand-green lg:inline-flex">
                Administration
              </Link>
            )}
            <Link href={accountHref} className="flex items-center gap-2 rounded-[7px] border border-[#e5eae4] bg-surface px-3 py-3 text-xs font-semibold text-ink hover:border-brand-green sm:px-4" aria-label={user ? "Mon espace" : "Se connecter"}>
              <UserRound size={17} aria-hidden="true" />
              <span className="hidden sm:inline">{user ? "Mon espace" : "Se connecter"}</span>
            </Link>

            <details className="group lg:hidden">
              <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-md text-brand-green [&::-webkit-details-marker]:hidden" aria-label="Ouvrir le menu">
                <Menu size={24} aria-hidden="true" />
              </summary>
              <nav aria-label="Menu mobile" className="absolute inset-x-0 top-full border-t border-line bg-white px-[6%] py-3 shadow-[0_12px_25px_#14332519]">
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className="block border-b border-line/70 px-2 py-4 text-sm font-semibold last:border-0">
                    {link.label}
                  </Link>
                ))}
                <Link href="/faq" className="block px-2 py-4 text-sm">Questions fréquentes</Link>
                <Link href="/contact" className="block px-2 py-4 text-sm">Contact</Link>
                {isStaff(user) && (
                  <Link href="/admin" className="block px-2 py-4 text-sm">Administration</Link>
                )}
                <Link href={accountHref} className="btn-green mt-2 mb-2 w-full">
                  {user ? "Mon espace" : "Se connecter"}
                </Link>
              </nav>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
