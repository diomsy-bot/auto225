"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/admin", "Tableau de bord"],
  ["/admin/reservations", "Réservations"],
  ["/admin/vehicules", "Véhicules"],
  ["/admin/proprietaires", "Propriétaires"],
  ["/admin/services", "Services particuliers"],
  ["/admin/vente", "Achat & vente"],
  ["/admin/contenus", "Contenus"],
  ["/admin/journal", "Journal"],
] as const;

const ADMIN_LINKS = [
  ["/admin/utilisateurs", "Utilisateurs"],
  ["/admin/parametres", "Paramètres"],
] as const;

export function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  const links = isAdmin ? [...LINKS, ...ADMIN_LINKS] : LINKS;
  return (
    <nav aria-label="Administration" className="flex gap-1 overflow-x-auto lg:flex-col">
      {links.map(([href, label]) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-brand-green text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
