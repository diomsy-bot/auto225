import Link from "next/link";
import { db } from "@/lib/db";
import { getContact, getOperations, whatsappLink } from "@/lib/settings";
import { HeroScene } from "@/components/home/hero-scene";
import { LogoIntro } from "@/components/home/logo-intro";
import { RentalSearchForm } from "@/components/vehicles/search-form";
import { RentalCard, SaleCard } from "@/components/vehicles/vehicle-card";

export const dynamic = "force-dynamic";

// Les trois accès, avec les libellés exacts du cahier des charges.
const PATHS = [
  {
    n: "1",
    title: "Louez un véhicule",
    text: "Catalogue et recherche par dates, avec ou sans chauffeur.",
    href: "/location",
    icon: "M5 17h14M6 17l1.5-6h9L18 17M8 17v2M16 17v2M7.5 11l1-4h7l1 4",
  },
  {
    n: "2",
    title: "Mettez votre voiture en location",
    text: "Déposez votre dossier, nous vérifions et publions votre véhicule.",
    href: "/proprietaires",
    icon: "M4 20V10l8-6 8 6v10M9 20v-6h6v6",
  },
  {
    n: "3",
    title: "Service particulier",
    text: "Transfert, chauffeur privé, événement : demandez un devis.",
    href: "/service-particulier",
    icon: "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z",
  },
];

const DEFAULT_ORDER = ["search", "featured", "paths", "sale", "steps", "advantages", "reviews", "faq", "contact"];

export default async function HomePage() {
  const [sections, featured, forSale, advantages, faqs, reviews, contact, ops, heroVideo] = await Promise.all([
    db.homeSection.findMany({ orderBy: { position: "asc" } }),
    db.vehicle.findMany({ where: { status: "PUBLISHED", forRent: true, featured: true }, include: { photos: { orderBy: { position: "asc" } } }, take: 6 }),
    db.vehicle.findMany({ where: { status: "PUBLISHED", forSale: true, saleStatus: { not: "SOLD" } }, include: { photos: { orderBy: { position: "asc" } } }, take: 3, orderBy: { createdAt: "desc" } }),
    db.advantage.findMany({ where: { published: true }, orderBy: { position: "asc" } }),
    db.faq.findMany({ where: { published: true }, orderBy: { position: "asc" }, take: 5 }),
    db.review.findMany({ where: { status: "APPROVED" }, include: { vehicle: true }, orderBy: { createdAt: "desc" }, take: 3 }),
    getContact(),
    getOperations(),
    db.setting.findUnique({ where: { key: "heroVideo" } }),
  ]);
  const video = (heroVideo?.value ?? null) as { url?: string; poster?: string } | null;

  const config = new Map(sections.map((s) => [s.key, s]));
  const order = sections.length ? sections.filter((s) => s.enabled).map((s) => s.key) : DEFAULT_ORDER;
  const title = (key: string, fallback: string) => config.get(key)?.title || fallback;
  const subtitle = (key: string, fallback = "") => config.get(key)?.subtitle || fallback;

  const blocks: Record<string, React.ReactNode> = {
    search: (
      <section key="search" aria-labelledby="h-search" className="container-page -mt-6 relative z-10">
        <div className="card p-5 sm:p-6">
          <h2 id="h-search" className="mb-4 text-lg font-bold">{title("search", "Recherche rapide")}</h2>
          <RentalSearchForm locations={ops.pickupLocations} compact />
        </div>
      </section>
    ),
    featured: featured.length > 0 && (
      <section key="featured" aria-labelledby="h-featured" className="container-page py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Location</p>
            <h2 id="h-featured" className="heading-section mt-1">{title("featured", "Nos véhicules à la une")}</h2>
            {subtitle("featured") && <p className="mt-2 text-muted">{subtitle("featured")}</p>}
          </div>
          <Link href="/location" className="btn-outline">Voir tout le catalogue</Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((v) => <RentalCard key={v.id} vehicle={v} />)}
        </div>
      </section>
    ),
    paths: (
      <section key="paths" aria-labelledby="h-paths" className="bg-surface py-14">
        <div className="container-page">
          <h2 id="h-paths" className="heading-section">{title("paths", "Trois façons de rouler avec AUTO225")}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {PATHS.map((p) => (
              <div key={p.n} className="card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 font-bold text-orange-cta">{p.n}</span>
                <h3 className="mt-4 text-lg font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted">{p.text}</p>
                <Link href={p.href} className="mt-4 inline-block text-sm font-semibold text-brand-green hover:underline">
                  Commencer <span aria-hidden="true">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
    sale: (
      <section key="sale" aria-labelledby="h-sale" className="container-page py-14">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow">Achat &amp; vente</p>
            <h2 id="h-sale" className="heading-section mt-1">{title("sale", "Achetez ou vendez votre véhicule")}</h2>
            <p className="mt-3 text-muted">{subtitle("sale", "Consultez les véhicules à vendre, demandez une visite ou proposez votre voiture : notre équipe vous accompagne.")}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/achat-vente" className="btn-green">Voir les véhicules à vendre</Link>
              <Link href="/achat-vente/proposer" className="btn-outline">Proposer mon véhicule</Link>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {forSale.map((v) => <SaleCard key={v.id} vehicle={v} />)}
          </div>
        </div>
      </section>
    ),
    steps: (
      <section key="steps" aria-labelledby="h-steps" className="bg-green-950 py-14 text-white">
        <div className="container-page">
          <h2 id="h-steps" className="text-2xl font-bold sm:text-3xl">{title("steps", "Réserver en 4 étapes")}</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Choisissez", "Sélectionnez un véhicule et vos dates de départ et de retour."],
              ["Envoyez votre demande", "Vous recevez une référence et un accusé de réception."],
              ["Confirmation", "Notre équipe vérifie la disponibilité et confirme votre réservation."],
              ["Prenez la route", "Paiement et remise du véhicule selon les modalités envoyées."],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-2xl bg-white/5 p-5">
                <span className="text-3xl font-extrabold text-brand-orange">{i + 1}</span>
                <p className="mt-2 font-semibold">{t}</p>
                <p className="mt-1 text-sm text-white/75">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    ),
    advantages: advantages.length > 0 && (
      <section key="advantages" aria-labelledby="h-adv" className="container-page py-14">
        <h2 id="h-adv" className="heading-section">{title("advantages", "Pourquoi choisir AUTO225")}</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {advantages.map((a) => (
            <li key={a.id} className="card p-5">
              <span className="block h-1.5 w-10 rounded-full bg-brand-orange" aria-hidden="true" />
              <p className="mt-3 font-semibold">{a.title}</p>
              <p className="mt-1 text-sm text-muted">{a.description}</p>
            </li>
          ))}
        </ul>
      </section>
    ),
    reviews: reviews.length > 0 && (
      <section key="reviews" aria-labelledby="h-reviews" className="bg-surface py-14">
        <div className="container-page">
          <h2 id="h-reviews" className="heading-section">{title("reviews", "Avis de nos clients")}</h2>
          <p className="mt-2 text-sm text-muted">Avis vérifiés, publiés après une location réalisée.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="card p-5">
                <p className="text-brand-orange" aria-label={`${r.rating} sur 5`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                <blockquote className="mt-2 text-sm">{r.comment}</blockquote>
                <figcaption className="mt-3 text-xs text-muted">{r.author} · {r.vehicle.brand} {r.vehicle.model}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    ),
    faq: faqs.length > 0 && (
      <section key="faq" aria-labelledby="h-faq" className="container-page py-14">
        <h2 id="h-faq" className="heading-section">{title("faq", "Questions fréquentes")}</h2>
        <div className="mt-6 divide-y divide-line rounded-2xl border border-line">
          {faqs.map((f) => (
            <details key={f.id} className="group p-5">
              <summary className="cursor-pointer list-none font-semibold [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {f.question}
                  <span className="text-xl text-orange-cta transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted whitespace-pre-line">{f.answer}</p>
            </details>
          ))}
        </div>
        <Link href="/faq" className="mt-4 inline-block text-sm font-semibold text-brand-green hover:underline">Toutes les questions</Link>
      </section>
    ),
    contact: (
      <section key="contact" aria-labelledby="h-contact" className="container-page py-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-brand-green p-8 text-white md:flex-row md:items-center">
          <div>
            <h2 id="h-contact" className="text-2xl font-bold">{title("contact", "Une question ? Parlons-en.")}</h2>
            <p className="mt-2 text-white/85">{subtitle("contact", "Notre équipe vous répond par téléphone, email ou WhatsApp.")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={whatsappLink(contact.whatsapp)} target="_blank" rel="noopener noreferrer" className="btn bg-white text-brand-green hover:bg-green-50">WhatsApp</a>
            <Link href="/contact" className="btn border border-white/40 text-white hover:bg-white/10">Nous contacter</Link>
          </div>
        </div>
      </section>
    ),
  };

  return (
    <>
      <section aria-labelledby="h-hero" className="relative isolate overflow-hidden bg-[#fdf3e7]">
        <div className="absolute inset-x-0 bottom-0 top-[52%] sm:top-[45%] lg:top-[42%]">
          <HeroScene videoUrl={video?.url} posterUrl={video?.poster} />
        </div>
        <div className="container-page relative z-10 pb-44 pt-6 sm:pb-52 lg:pb-44 lg:pt-10">
          <div className="flex items-center gap-4 lg:gap-6">
            <LogoIntro className="w-24 shrink-0 sm:w-32 lg:w-40" />
            <div>
              <h1 id="h-hero" className="text-2xl font-extrabold leading-tight text-brand-green sm:text-4xl lg:text-5xl">
                AUTO225.COM
              </h1>
              <p className="mt-1 text-base font-semibold text-orange-cta sm:text-xl">Votre partenaire en mobilité à Abidjan</p>
              <p className="mt-1 hidden text-sm sm:block">
                Vous cherchez à acheter ou vendre ? <Link href="/achat-vente" className="font-semibold text-brand-green underline">Achat &amp; vente</Link>
              </p>
            </div>
          </div>

          {/* Mobile : trois boutons compacts, visibles sans attendre l'animation */}
          <nav aria-label="Nos services" className="mt-5 grid gap-2 md:hidden">
            {PATHS.map((p) => (
              <Link key={p.n} href={p.href} className="flex min-h-12 items-center gap-3 rounded-xl bg-white px-4 py-2 font-semibold shadow-md ring-1 ring-line">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-orange text-sm text-white">{p.n}</span>
                <span className="text-[15px] leading-tight">{p.title}</span>
              </Link>
            ))}
          </nav>

          {/* Ordinateur et tablette : trois cartes visibles ensemble au premier écran */}
          <nav aria-label="Nos services" className="mt-8 hidden gap-5 md:grid md:grid-cols-3 lg:mt-10 lg:max-w-4xl">
            {PATHS.map((p) => (
              <Link key={p.n} href={p.href} className="group rounded-2xl bg-white/95 p-5 shadow-lg ring-1 ring-line backdrop-blur transition hover:-translate-y-0.5 hover:ring-brand-green">
                <span className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-orange text-white">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={p.icon} /></svg>
                  </span>
                  <span className="text-2xl font-extrabold text-orange-cta">{p.n}</span>
                </span>
                <span className="mt-3 block text-lg font-bold leading-snug text-ink">{p.title}</span>
                <span className="mt-1 block text-sm text-muted">{p.text}</span>
                <span className="mt-3 inline-block text-sm font-semibold text-brand-green group-hover:underline">Accéder <span aria-hidden="true">→</span></span>
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {order.map((key) => blocks[key] ?? null)}
    </>
  );
}
