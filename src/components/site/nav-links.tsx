"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "./nav-config";


function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Navigation principale (ordinateur) avec le trait orange sous la page active. */
export function MainNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation principale" className="hidden items-center gap-4 text-[12px] font-semibold lg:flex xl:gap-7 xl:text-[13px]">
      {NAV_LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`relative py-8 transition-colors hover:text-brand-green ${active ? "text-brand-green after:absolute after:bottom-5 after:left-1/2 after:h-[3px] after:w-4 after:-translate-x-1/2 after:bg-brand-orange" : "text-ink"}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
