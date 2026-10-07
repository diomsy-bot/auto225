import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { availableDuring } from "@/lib/availability";
import { db } from "@/lib/db";
import { parseLocalDateTime } from "@/lib/format";
import { CATEGORY_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, enumOptions } from "@/lib/labels";
import { getOperations, getPricingRules } from "@/lib/settings";
import { RentalSearchForm } from "@/components/vehicles/search-form";
import { RentalCard } from "@/components/vehicles/vehicle-card";
import { PageIntro } from "@/components/site/page-intro";

export const metadata: Metadata = {
  title: "Louez un véhicule à Abidjan",
  description: "Catalogue de véhicules à louer à Abidjan, avec ou sans chauffeur. Recherche par dates, prix en FCFA.",
};

type SP = Record<string, string | undefined>;

export default async function RentalCatalogue({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [ops, rules] = await Promise.all([getOperations(), getPricingRules()]);
  const startAt = parseLocalDateTime(sp.depart);
  const endAt = parseLocalDateTime(sp.retour);
  const datesValid = startAt && endAt && endAt > startAt;

  const where: Prisma.VehicleWhereInput = { status: "PUBLISHED", forRent: true };
  const and: Prisma.VehicleWhereInput[] = [];
  if (sp.categorie && sp.categorie in CATEGORY_LABELS) where.category = sp.categorie as keyof typeof CATEGORY_LABELS;
  if (sp.budget && Number(sp.budget) > 0) where.dailyPrice = { lte: Number(sp.budget) };
  if (sp.chauffeur === "avec") where.withDriver = true;
  if (sp.chauffeur === "sans") where.withoutDriver = true;
  if (sp.marque) where.brand = { equals: sp.marque, mode: "insensitive" };
  if (sp.boite && sp.boite in TRANSMISSION_LABELS) where.transmission = sp.boite as keyof typeof TRANSMISSION_LABELS;
  if (sp.carburant && sp.carburant in FUEL_LABELS) where.fuel = sp.carburant as keyof typeof FUEL_LABELS;
  if (sp.places && Number(sp.places) > 0) where.seats = { gte: Number(sp.places) };
  if (sp.equipement) where.features = { has: sp.equipement };
  // Les véhicules indisponibles aux dates choisies ne sont pas proposés (ACC-03).
  if (datesValid) and.push(availableDuring(startAt, endAt, rules.bufferHours));
  if (and.length) where.AND = and;

  const [vehicles, brands, featureRows] = await Promise.all([
    db.vehicle.findMany({ where, include: { photos: { orderBy: { position: "asc" } } }, orderBy: [{ featured: "desc" }, { dailyPrice: "asc" }], take: 60 }),
    db.vehicle.findMany({ where: { status: "PUBLISHED", forRent: true }, distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } }),
    db.vehicle.findMany({ where: { status: "PUBLISHED", forRent: true }, select: { features: true } }),
  ]);
  const features = [...new Set(featureRows.flatMap((r) => r.features))].sort();

  const keep = new URLSearchParams();
  if (sp.depart) keep.set("depart", sp.depart);
  if (sp.retour) keep.set("retour", sp.retour);
  if (sp.lieu) keep.set("lieu", sp.lieu);
  if (sp.chauffeur) keep.set("chauffeur", sp.chauffeur);
  const query = keep.size ? `?${keep}` : "";

  return (
    <>
    <PageIntro eyebrow="Prenez la route" title="Louez un véhicule.">
      Choisissez vos dates, comparez et envoyez votre demande. Avec ou sans chauffeur, à Abidjan.
    </PageIntro>
    <div className="container-page py-10">
      <RentalSearchForm locations={ops.pickupLocations} values={sp} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside aria-label="Filtres complémentaires">
          <details className="group rounded-[10px] border border-line bg-surface p-5" open={!!(sp.marque || sp.boite || sp.carburant || sp.places || sp.equipement)}>
          <summary className="flex cursor-pointer list-none items-center justify-between font-semibold [&::-webkit-details-marker]:hidden">
            Plus de filtres <span className="text-orange-cta transition-transform group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <form action="/location" method="get" className="mt-4 space-y-4">
            {["lieu", "depart", "retour", "categorie", "budget", "chauffeur"].map((k) =>
              sp[k] ? <input key={k} type="hidden" name={k} value={sp[k]} /> : null,
            )}
            <Select name="marque" label="Marque" value={sp.marque} options={brands.map((b) => ({ value: b.brand, label: b.brand }))} />
            <Select name="boite" label="Boîte de vitesses" value={sp.boite} options={enumOptions(TRANSMISSION_LABELS)} />
            <Select name="carburant" label="Carburant" value={sp.carburant} options={enumOptions(FUEL_LABELS)} />
            <Select name="places" label="Places minimum" value={sp.places} options={[2, 4, 5, 7, 9, 15].map((n) => ({ value: String(n), label: `${n} places ou plus` }))} />
            <Select name="equipement" label="Équipement" value={sp.equipement} options={features.map((f) => ({ value: f, label: f }))} />
            <button type="submit" className="btn-green w-full">Appliquer</button>
            <Link href="/location" className="block text-center text-sm text-muted underline">Réinitialiser</Link>
          </form>
          </details>
        </aside>

        <section aria-live="polite">
          <p className="font-display text-[19px] font-bold">
            {vehicles.length} véhicule{vehicles.length > 1 ? "s" : ""}
            {datesValid ? " disponible" + (vehicles.length > 1 ? "s" : "") + " sur vos dates" : ""}
          </p>
          {sp.depart && sp.retour && !datesValid && (
            <p className="mt-2 rounded-xl bg-orange-50 px-4 py-2 text-sm text-orange-cta">La date de retour doit être après la date de départ.</p>
          )}
          {vehicles.length === 0 ? (
            <div className="mt-4 rounded-[10px] border border-dashed border-[#d9e3d4] bg-surface p-10 text-center">
              <p className="font-semibold">Aucun véhicule ne correspond à votre recherche.</p>
              <p className="mt-1 text-sm text-muted">Modifiez vos dates ou vos filtres, ou demandez-nous un <Link href="/service-particulier" className="text-brand-green underline">service sur mesure</Link>.</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((v) => <RentalCard key={v.id} vehicle={v} query={query} />)}
            </div>
          )}
        </section>
      </div>
    </div>
    </>
  );
}

function Select({ name, label, value, options }: { name: string; label: string; value?: string; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label htmlFor={`flt-${name}`} className="label">{label}</label>
      <select id={`flt-${name}`} name={name} defaultValue={value ?? ""} className="input">
        <option value="">Tous</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
