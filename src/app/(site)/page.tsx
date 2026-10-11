import Link from "next/link";
import { ArrowRight, ArrowUpRight, Car, Check, KeyRound, MapPin, Plus, Route } from "lucide-react";
import { db } from "@/lib/db";
import { CATEGORY_LABELS } from "@/lib/labels";
import { getContact, getOperations, whatsappLink } from "@/lib/settings";
import { HeroBooking } from "@/components/home/hero-booking";
import { HeroScene } from "@/components/home/hero-scene";
import { RentalSearchForm } from "@/components/vehicles/search-form";
import { RentalCard } from "@/components/vehicles/vehicle-card";

export const dynamic = "force-dynamic";

// Les trois accès, avec les libellés exacts du cahier des charges.
const PATHS = [
  { n: "01", title: "Louez un véhicule", text: "Le bon véhicule, au bon moment.", href: "/location", Icon: Car },
  { n: "02", title: "Mettez votre voiture en location", text: "Votre véhicule a du potentiel.", href: "/proprietaires", Icon: KeyRound },
  { n: "03", title: "Service particulier", text: "Un besoin unique ? Parlons-en.", href: "/service-particulier", Icon: Route },
];

const DEFAULT_ORDER = ["search", "featured", "paths", "steps", "sale", "advantages", "reviews", "faq", "contact"];

/** Les mots entre *astérisques* sont mis en valeur (orange), comme dans le design. */
function accent(text: string) {
  // Espace insécable avant ? ! : ; (typographie française), pour éviter un signe seul en début de ligne.
  return text.replace(/ ([?!:;])/g, "\u00a0$1").split(/\*([^*]+)\*/g).map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part));
}

const h2Class = "home-h2 mt-3 text-[28px] leading-[1.1] sm:text-[40px]";

/** Numéro lisible : 2250555791610 → +225 05 55 79 16 10. */
function displayPhone(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("225") && d.length === 13) return `+225 ${d.slice(3).replace(/(\d{2})(?=\d)/g, "$1 ")}`;
  return raw;
}

const PROOF = ["Véhicules vérifiés", "Prix clairs en FCFA", "Confirmation par notre équipe"];

export default async function HomePage() {
  const [sections, featured, advantages, faqs, reviews, contact, ops, heroVideo, categories] = await Promise.all([
    db.homeSection.findMany({ orderBy: { position: "asc" } }),
    db.vehicle.findMany({ where: { status: "PUBLISHED", forRent: true, featured: true }, include: { photos: { orderBy: { position: "asc" } } }, take: 6 }),
    db.advantage.findMany({ where: { published: true }, orderBy: { position: "asc" } }),
    db.faq.findMany({ where: { published: true }, orderBy: { position: "asc" }, take: 5 }),
    db.review.findMany({ where: { status: "APPROVED" }, include: { vehicle: true }, orderBy: { createdAt: "desc" }, take: 3 }),
    getContact(),
    getOperations(),
    db.setting.findUnique({ where: { key: "heroVideo" } }),
    db.vehicle.findMany({ where: { status: "PUBLISHED", forRent: true }, distinct: ["category"], select: { category: true } }),
  ]);
  const video = (heroVideo?.value ?? null) as { url?: string; poster?: string } | null;

  const config = new Map(sections.map((s) => [s.key, s]));
  const order = sections.length ? sections.filter((s) => s.enabled).map((s) => s.key) : DEFAULT_ORDER;
  const title = (key: string, fallback: string) => accent(config.get(key)?.title || fallback);
  const subtitle = (key: string, fallback = "") => config.get(key)?.subtitle || fallback;

  const blocks: Record<string, React.ReactNode> = {
    search: (
      <section key="search" aria-labelledby="h-search" className="container-page pt-8 pb-8 lg:hidden">
        <h2 id="h-search" className="eyebrow">{title("search", "Où allons-nous ?")}</h2>
        <div className="mt-4">
          <RentalSearchForm locations={ops.pickupLocations} compact />
        </div>
      </section>
    ),
    featured: featured.length > 0 && (
      <section key="featured" aria-labelledby="h-featured" className="container-page py-10 sm:py-16">
        <div className="mb-6 flex items-start justify-between gap-4 sm:items-center">
          <div>
            <p className="eyebrow">Le véhicule qui vous ressemble</p>
            <h2 id="h-featured" className={h2Class}>{title("featured", "À chacun sa route.")}</h2>
            <p className="mt-2 max-w-xl text-muted">{subtitle("featured", "Des véhicules contrôlés avant chaque mise en ligne. Prix affiché par jour, en FCFA.")}</p>
          </div>
          <Link href="/location" className="flex shrink-0 items-center gap-2 pt-6 text-xs font-semibold text-brand-green hover:underline sm:gap-3 sm:pt-0 sm:text-sm">
            Explorer le catalogue <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <ul className="mb-7 flex flex-wrap gap-2" aria-label="Catégories">
          <li><Link href="/location" className="inline-block rounded-full border border-brand-green bg-brand-green px-4 py-2 text-xs text-white">Tous les véhicules</Link></li>
          {categories.map(({ category }) => (
            <li key={category}>
              <Link href={`/location?categorie=${category}`} className="inline-block rounded-full border border-[#e7eae3] bg-[#f5f7f2] px-4 py-2 text-xs text-[#69766d] hover:border-brand-green hover:text-brand-green">
                {CATEGORY_LABELS[category]}
              </Link>
            </li>
          ))}
        </ul>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((v) => <RentalCard key={v.id} vehicle={v} />)}
        </div>
      </section>
    ),
    paths: (
      <section key="paths" aria-labelledby="h-owner" className="container-page py-3 sm:py-6">
        <div className="flex justify-between overflow-hidden rounded-2xl bg-orange-50 px-7 py-9 text-ink sm:px-14 sm:py-12">
          <div>
            <p className="eyebrow text-orange-cta!">Pour les propriétaires</p>
            <h2 id="h-owner" className="home-h2 mt-3 mb-3 max-w-md text-[30px] leading-[1.08] sm:text-[42px]">{title("paths", "Votre voiture peut aller *plus loin.*")}</h2>
            <p className="text-[14px] leading-[1.75] text-[#5d6a62]">
              {subtitle("paths") || <>Proposez votre véhicule à notre équipe.<br />Nous étudions votre dossier avant toute mise en location.</>}
            </p>
            <Link href="/proprietaires" className="btn-green mt-6 rounded-full">Devenir partenaire <ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>
          <div className="relative hidden h-[210px] w-[40%] place-items-center self-center text-brand-green before:absolute before:h-[250px] before:w-[250px] before:rounded-full before:border-[18px] before:border-brand-orange/25 lg:grid" aria-hidden="true">
            <Car size={150} strokeWidth={0.8} />
            <span className="text-center text-[9px] tracking-[0.25em] text-[#8a6a55]">UN NOUVEAU DÉPART<br />POUR VOTRE VÉHICULE</span>
          </div>
        </div>
      </section>
    ),
    steps: (
      <section key="steps" aria-labelledby="h-steps" className="container-page py-10 sm:py-16">
        <p className="eyebrow">Simple, du départ à l&apos;arrivée</p>
        <h2 id="h-steps" className={h2Class}>{title("steps", "Votre trajet, en trois étapes.")}</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
          {[
            ["Choisissez votre véhicule", "Explorez le catalogue et renseignez vos dates de départ et de retour."],
            ["Envoyez votre demande", "Consultez votre récapitulatif et recevez une référence de suivi."],
            ["Recevez la confirmation", "Notre équipe vérifie la disponibilité, confirme et vous accompagne jusqu'à la remise du véhicule."],
          ].map(([t, d], i) => (
            <li key={t} className={`grid gap-2 border-t-[3px] pt-5 ${i === 2 ? "border-brand-orange" : "border-brand-green"}`}>
              <span className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">Étape {i + 1}</span>
              <h3 className="text-[18px] font-bold sm:text-[19px]">{t}</h3>
              <p className="max-w-[300px] text-[14px] leading-[1.7] text-[#5d6a62]">{d}</p>
            </li>
          ))}
        </ol>
      </section>
    ),
    sale: (
      <section key="sale" aria-labelledby="h-sale" className="container-page py-3 sm:py-6">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[10px] border border-[#e5ecdf] bg-[#f3f6ef] p-6 sm:p-10 md:flex-row md:items-center">
          <div>
            <p className="eyebrow">Achat &amp; vente</p>
            <h2 id="h-sale" className="home-h2 mt-2.5 text-[24px] sm:text-[28px]">{title("sale", "La prochaine est peut-être ici.")}</h2>
            <p className="mt-2 text-[13px] text-[#6a756e]">{subtitle("sale", "Découvrez les annonces ou proposez votre voiture à la vente.")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/achat-vente/proposer" className="btn-light">Proposer mon véhicule</Link>
            <Link href="/achat-vente" className="btn-green rounded-full">Voir les annonces <ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>
    ),
    advantages: advantages.length > 0 && (
      <section key="advantages" aria-labelledby="h-adv" className="container-page py-8 sm:py-14">
        <p className="eyebrow">Avec AUTO225</p>
        <h2 id="h-adv" className={h2Class}>{title("advantages", "Pourquoi choisir AUTO225 ?")}</h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {advantages.map((a) => (
            <li key={a.id} className="rounded-[10px] border border-[#e4eadf] bg-surface p-6">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-green-50 text-brand-green" aria-hidden="true"><Check size={18} strokeWidth={2.6} /></span>
              <h3 className="mt-4 text-[17px] font-bold">{a.title}</h3>
              <p className="mt-2 text-[13px] leading-[1.7] text-[#6a756e]">{a.description}</p>
            </li>
          ))}
        </ul>
      </section>
    ),
    reviews: reviews.length > 0 && (
      <section key="reviews" aria-labelledby="h-reviews" className="container-page py-8 sm:py-14">
        <p className="eyebrow">Ils ont pris la route</p>
        <h2 id="h-reviews" className={h2Class}>{title("reviews", "Avis de nos clients")}</h2>
        <p className="mt-2 text-sm text-muted">Avis vérifiés, publiés après une location réalisée.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.id} className="rounded-[10px] border border-[#e4eadf] bg-surface p-6">
              <p className="text-brand-orange" aria-label={`${r.rating} sur 5`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
              <blockquote className="mt-2 text-sm leading-relaxed">{r.comment}</blockquote>
              <figcaption className="mt-3 text-xs text-muted">{r.author} · {r.vehicle.brand} {r.vehicle.model}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    ),
    faq: faqs.length > 0 && (
      <section key="faq" aria-labelledby="h-faq" className="container-page grid gap-3 py-8 sm:py-14 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <p className="eyebrow">On vous répond</p>
          <h2 id="h-faq" className={`${h2Class} max-w-sm`}>{title("faq", "Avant de prendre la route.")}</h2>
          <Link href="/faq" className="mt-4 hidden items-center gap-2 text-sm font-semibold text-brand-green hover:underline lg:inline-flex">Toutes les questions <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <div>
          {faqs.map((f) => (
            <details key={f.id} className="group mb-3 rounded-xl border border-[#e1e7dc] bg-white px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                {f.question}
                <Plus size={17} className="shrink-0 text-brand-green transition-transform group-open:rotate-45" aria-hidden="true" />
              </summary>
              <p className="mt-3 text-[13px] leading-[1.75] whitespace-pre-line text-[#6a756e]">{f.answer}</p>
            </details>
          ))}
          <Link href="/faq" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-green hover:underline lg:hidden">Toutes les questions <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </section>
    ),
    contact: (
      <section key="contact" aria-labelledby="h-contact" className="container-page py-3 sm:py-6">
        <div className="grid gap-8 rounded-2xl bg-[#0b3d24] p-7 text-white sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow text-[#a8d8b9]!">Restons en contact</p>
            <h2 id="h-contact" className="home-h2 mt-2.5 text-[26px] sm:text-[34px]">{title("contact", "Une question ? Parlons-en.")}</h2>
            <p className="mt-2 text-[14px] text-[#c2d6c9]">{subtitle("contact", "Notre équipe vous répond par téléphone, email ou WhatsApp.")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={whatsappLink(contact.whatsapp)} target="_blank" rel="noopener noreferrer" className="btn rounded-full bg-brand-orange text-[#1a0a02] hover:brightness-105">Écrire sur WhatsApp</a>
              <Link href="/contact" className="btn rounded-full border border-white/40 text-white hover:bg-white/10">Nous écrire <ArrowUpRight size={18} aria-hidden="true" /></Link>
            </div>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ["WhatsApp", displayPhone(contact.whatsapp)],
              ["Téléphone", contact.phone],
              ["Email", contact.email],
              ["Adresse", contact.address],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0 rounded-xl border border-white/15 bg-white/5 p-4">
                <dt className="text-[11px] font-bold tracking-[0.12em] text-[#a8d8b9] uppercase">{k}</dt>
                <dd className="mt-1 font-semibold [overflow-wrap:anywhere] select-all">{v}</dd>
              </div>
            ))}
            {!contact.confirmed && <p className="text-xs text-[#a8d8b9] sm:col-span-2">Coordonnées en cours de confirmation.</p>}
          </dl>
        </div>
      </section>
    ),
  };

  return (
    <>
      <section aria-labelledby="h-hero" className="relative isolate mx-2.5 rounded-lg sm:mx-[22px] sm:rounded-[12px] 2xl:mx-auto 2xl:max-w-[1400px]">
        <HeroScene videoUrl={video?.url} posterUrl={video?.poster} />
        <div className="relative z-10 grid gap-10 px-[6%] pt-7 text-white sm:px-[5%] sm:pt-12 lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:gap-12 lg:pt-16">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-white/25 px-3 py-2 text-[10px] font-semibold tracking-[0.18em] text-[#bfe3cc] sm:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" aria-hidden="true" /> ABIDJAN · LOCATION &amp; VENTE
            </p>
            <h1 id="h-hero" className="hero-title mt-4 sm:mt-5">
              Votre voiture à Abidjan, <em>avec ou sans chauffeur</em>
            </h1>
            <p className="mt-4 max-w-xl text-[14px] leading-[1.65] text-[#d3e6d9] sm:mt-6 sm:text-[16px]">
              Louez une berline, un SUV ou un véhicule de prestige, achetez ou vendez en confiance. Chaque véhicule est contrôlé par notre équipe avant sa publication.
            </p>
            <ul className="mt-6 hidden flex-wrap gap-x-6 gap-y-2 text-[14px] font-semibold sm:flex">
              {PROOF.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Check size={18} strokeWidth={2.6} className="text-brand-orange" aria-hidden="true" /> {p}
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-center gap-2 text-[11px] text-[#bfe3cc] sm:text-xs lg:mt-6">
              <MapPin size={15} aria-hidden="true" /> Abidjan &amp; Côte d&apos;Ivoire
            </p>
          </div>
          <div className="hidden min-w-0 lg:block">
            <HeroBooking locations={ops.pickupLocations} />
          </div>
        </div>

        <nav aria-label="Nos services" className="relative z-10 mt-6 grid gap-2 px-[5%] pb-5 md:grid-cols-3 md:gap-4 lg:mt-8 lg:pb-7">
          {PATHS.map(({ n, title: label, text, href, Icon }, i) => (
            <Link
              key={n}
              href={href}
              className={`group flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-transform hover:-translate-y-0.5 md:py-4 lg:gap-4 lg:px-5 ${i === 0 ? "border-white bg-white text-ink" : "border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/15"}`}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg lg:h-[44px] lg:w-[44px] ${i === 0 ? "bg-green-50 text-brand-green" : "bg-white/10 text-white"}`} aria-hidden="true">
                <Icon size={22} />
              </span>
              <span className="grid flex-1 gap-0.5 md:gap-1">
                <span className={`text-[9px] font-semibold tracking-[0.15em] ${i === 0 ? "text-[#6a756e]" : "text-[#bfe3cc]"}`}>{n} / VOTRE PARCOURS</span>
                <strong className="font-display text-[14px] leading-snug tracking-[-0.01em] lg:text-[15px]">{label}</strong>
                <span className={`hidden text-[12px] md:block ${i === 0 ? "text-[#5d6a62]" : "text-[#c9ddd0]"}`}>{text}</span>
              </span>
              <ArrowUpRight size={22} className={`shrink-0 ${i === 0 ? "text-brand-green" : ""}`} aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </section>

      {order.map((key) => blocks[key] ?? null)}
    </>
  );
}
