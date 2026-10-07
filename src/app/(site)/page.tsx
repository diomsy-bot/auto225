import Link from "next/link";
import { ArrowRight, ArrowUpRight, Car, KeyRound, MapPin, Plus, Route } from "lucide-react";
import { db } from "@/lib/db";
import { CATEGORY_LABELS } from "@/lib/labels";
import { getContact, getOperations, whatsappLink } from "@/lib/settings";
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
  return text.split(/\*([^*]+)\*/g).map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part));
}

const h2Class = "mt-3 text-[28px] leading-[1.22] font-bold tracking-[-0.04em] sm:text-4xl";

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
      <section key="search" aria-labelledby="h-search" className="container-page pt-6 pb-8 md:pt-24">
        <h2 id="h-search" className="eyebrow">{title("search", "Où allons-nous ?")}</h2>
        <div className="mt-4">
          <RentalSearchForm locations={ops.pickupLocations} compact />
        </div>
      </section>
    ),
    featured: featured.length > 0 && (
      <section key="featured" aria-labelledby="h-featured" className="container-page py-8 sm:py-12">
        <div className="mb-6 flex items-start justify-between gap-4 sm:items-center">
          <div>
            <p className="eyebrow">Le véhicule qui vous ressemble</p>
            <h2 id="h-featured" className={h2Class}>{title("featured", "À chacun sa route.")}</h2>
            {subtitle("featured") && <p className="mt-2 text-muted">{subtitle("featured")}</p>}
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
        <div className="flex justify-between overflow-hidden rounded-xl bg-ink px-7 py-8 text-white sm:px-14 sm:py-12">
          <div>
            <p className="eyebrow text-[#9ec2ac]!">Pour les propriétaires</p>
            <h2 id="h-owner" className="mt-3 mb-3 max-w-md text-[34px] leading-[1.15] font-bold tracking-[-0.04em] sm:text-[43px]">{title("paths", "Votre voiture peut aller *plus loin.*")}</h2>
            <p className="text-[13px] leading-[1.75] text-[#bdcfc2]">
              {subtitle("paths") || <>Proposez votre véhicule à notre équipe.<br />Nous étudions votre dossier avant toute mise en location.</>}
            </p>
            <Link href="/proprietaires" className="btn-orange mt-6">Devenir partenaire <ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>
          <div className="relative hidden h-[210px] w-[40%] place-items-center self-center bg-[radial-gradient(ellipse,#7c987944,transparent_68%)] text-[#dbe9df] before:absolute before:h-[250px] before:w-[250px] before:rounded-full before:border before:border-[#86a98d36] lg:grid" aria-hidden="true">
            <Car size={150} strokeWidth={0.8} />
            <span className="text-center text-[9px] tracking-[0.25em] text-[#a3bcaa]">UN NOUVEAU DÉPART<br />POUR VOTRE VÉHICULE</span>
          </div>
        </div>
      </section>
    ),
    steps: (
      <section key="steps" aria-labelledby="h-steps" className="container-page py-8 sm:py-14">
        <p className="eyebrow">Simple, du départ à l&apos;arrivée</p>
        <h2 id="h-steps" className={h2Class}>{title("steps", "Votre trajet, en trois étapes.")}</h2>
        <ol className="mt-7 grid gap-5 sm:mt-9 md:grid-cols-3 md:gap-10">
          {[
            ["01", "Choisissez votre véhicule", "Explorez le catalogue et renseignez vos dates de départ et de retour."],
            ["02", "Envoyez votre demande", "Consultez votre récapitulatif et recevez une référence de suivi."],
            ["03", "Recevez la confirmation", "Notre équipe vérifie la disponibilité, confirme et vous accompagne jusqu'à la remise du véhicule."],
          ].map(([n, t, d]) => (
            <li key={n} className="relative pl-14 md:pl-0">
              <span className="absolute top-0 left-0 grid h-9 w-9 place-items-center rounded-full border border-[#dfe9dd] bg-[#f0f5ee] text-xs text-brand-green md:static md:mb-5 md:h-11 md:w-11" aria-hidden="true">{n}</span>
              <h3 className="text-[17px] font-bold sm:text-[19px]">{t}</h3>
              <p className="mt-2 max-w-[290px] text-[13px] leading-[1.75] text-[#6a756e]">{d}</p>
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
            <h2 id="h-sale" className="mt-2.5 text-[26px] font-bold tracking-[-0.04em] sm:text-[27px]">{title("sale", "La prochaine est peut-être ici.")}</h2>
            <p className="mt-2 text-[13px] text-[#6a756e]">{subtitle("sale", "Découvrez les annonces ou proposez votre voiture à la vente.")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/achat-vente/proposer" className="btn-light">Proposer mon véhicule</Link>
            <Link href="/achat-vente" className="btn-green">Voir les annonces <ArrowUpRight size={18} aria-hidden="true" /></Link>
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
              <span className="block h-[3px] w-6 bg-brand-orange" aria-hidden="true" />
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
          <h2 id="h-faq" className={`${h2Class} max-w-xs`}>{title("faq", "Avant de prendre la route.")}</h2>
          <Link href="/faq" className="mt-4 hidden items-center gap-2 text-sm font-semibold text-brand-green hover:underline lg:inline-flex">Toutes les questions <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <div>
          {faqs.map((f) => (
            <details key={f.id} className="group border-b border-[#e1e7dc] py-5">
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
        <div className="flex flex-col items-start justify-between gap-6 rounded-xl bg-brand-green p-7 text-white sm:p-10 md:flex-row md:items-center">
          <div>
            <p className="eyebrow text-[#b3cbbd]!">Restons en contact</p>
            <h2 id="h-contact" className="mt-2.5 text-[26px] font-bold tracking-[-0.04em] sm:text-[30px]">{title("contact", "Une question ? Parlons-en.")}</h2>
            <p className="mt-2 text-[13px] text-[#c2d6c9]">{subtitle("contact", "Notre équipe vous répond par téléphone, email ou WhatsApp.")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={whatsappLink(contact.whatsapp)} target="_blank" rel="noopener noreferrer" className="btn bg-white text-brand-green hover:bg-green-50">WhatsApp</a>
            <Link href="/contact" className="btn border border-white/40 text-white hover:bg-white/10">Nous écrire <ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>
    ),
  };

  return (
    <>
      <section aria-labelledby="h-hero" className="relative isolate mx-2.5 h-[555px] rounded-lg sm:mx-[22px] sm:h-[560px] sm:rounded-[10px] 2xl:mx-auto 2xl:max-w-[1400px]">
        <HeroScene videoUrl={video?.url} posterUrl={video?.poster} />
        <div className="relative z-10 px-[6%] pt-8 text-white sm:px-[5%] sm:pt-16">
          <p className="inline-flex items-center gap-2.5 rounded-full border border-white/25 px-3 py-2.5 text-[8px] tracking-[0.2em] sm:text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" aria-hidden="true" /> LA ROUTE EST À VOUS
          </p>
          <h1 id="h-hero" className="mt-5 text-[36px] leading-[1.14] font-bold tracking-[-0.045em] sm:mt-6 sm:text-[48px] lg:text-[58px]">
            Plus qu&apos;une voiture.<br />Une nouvelle <em>liberté.</em>
          </h1>
          <p className="mt-4 text-[12px] leading-[1.9] text-[#d3dbd3] sm:mt-6 sm:text-[15px]">
            Un week-end, un rendez-vous, un nouveau départ.<br />Trouvez le véhicule qui vous accompagne.
          </p>
          <p className="mt-4 flex items-center gap-2 text-[10px] text-[#d6e2d8] sm:mt-7 sm:text-xs">
            <MapPin size={15} aria-hidden="true" /> Abidjan &amp; Côte d&apos;Ivoire
          </p>
        </div>
        <p className="absolute right-11 bottom-28 z-10 hidden gap-10 text-[9px] tracking-[0.2em] text-white xl:flex" aria-hidden="true">
          LE PLAISIR DE PRENDRE LA ROUTE <span>01 — 03</span>
        </p>

        <nav aria-label="Nos services" className="absolute right-[5%] bottom-4 left-[5%] z-10 grid gap-2 md:right-[4.5%] md:-bottom-[42px] md:left-[4.5%] md:grid-cols-3 md:gap-4">
          {PATHS.map(({ n, title: label, text, href, Icon }, i) => (
            <Link
              key={n}
              href={href}
              className={`group flex items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-transform hover:-translate-y-1 md:rounded-[9px] md:px-3 md:py-5 md:shadow-[0_12px_40px_#142f2212] lg:gap-4 lg:px-5 lg:py-6 ${i === 0 ? "border-brand-green bg-brand-green text-white" : "border-[#e9ece6] bg-white text-ink"}`}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg lg:h-[46px] lg:w-[46px] ${i === 0 ? "bg-white/10 text-white" : "bg-[#edf3ed] text-brand-green"}`} aria-hidden="true">
                <Icon size={22} />
              </span>
              <span className="grid flex-1 gap-0.5 md:gap-1.5">
                <span className={`text-[7px] tracking-[0.15em] md:text-[9px] ${i === 0 ? "text-[#b3cbbd]" : "text-[#8b968f]"}`}>{n} / VOTRE PARCOURS</span>
                <strong className="font-display text-[13px] leading-snug tracking-[-0.02em] lg:text-[15px]">{label}</strong>
                <span className={`hidden text-[11px] md:block ${i === 0 ? "text-[#c2d6c9]" : "text-[#818c84]"}`}>{text}</span>
              </span>
              <ArrowUpRight size={22} className="shrink-0" aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </section>

      {order.map((key) => blocks[key] ?? null)}
    </>
  );
}
