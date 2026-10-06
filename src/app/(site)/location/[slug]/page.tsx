import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatFcfa } from "@/lib/format";
import { CATEGORY_LABELS, FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/labels";
import { getOperations, getPricingRules } from "@/lib/settings";
import { BookingForm } from "@/components/booking/booking-form";
import { VehicleGallery } from "@/components/vehicles/gallery";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

async function load(slug: string) {
  return db.vehicle.findFirst({
    where: { slug, forRent: true, status: { in: ["PUBLISHED", "ARCHIVED"] } },
    include: { photos: { orderBy: { position: "asc" } }, reviews: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 6 } },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = await load((await params).slug);
  if (!v) return {};
  return {
    title: `Location ${v.brand} ${v.model} ${v.year} à ${v.city}`,
    description: `${v.brand} ${v.model} ${v.year} à louer à ${v.city} : ${formatFcfa(v.dailyPrice)} par jour. ${CATEGORY_LABELS[v.category]}, ${TRANSMISSION_LABELS[v.transmission].toLowerCase()}, ${v.seats} places.`,
    robots: v.status === "ARCHIVED" ? { index: false } : undefined,
  };
}

export default async function RentalVehiclePage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const vehicle = await load(slug);
  if (!vehicle) notFound();
  const [ops, rules, user] = await Promise.all([getOperations(), getPricingRules(), getCurrentUser()]);
  const archived = vehicle.status === "ARCHIVED";

  const specs: [string, string][] = [
    ["Catégorie", CATEGORY_LABELS[vehicle.category]],
    ["Année", String(vehicle.year)],
    ["Boîte", TRANSMISSION_LABELS[vehicle.transmission]],
    ["Carburant", FUEL_LABELS[vehicle.fuel]],
    ["Places", String(vehicle.seats)],
    ["Zone de disponibilité", [vehicle.city, vehicle.zone].filter((z, i, a) => z && a.indexOf(z) === i).join(" — ")],
    ["Kilométrage inclus", vehicle.includedKmPerDay ? `${vehicle.includedKmPerDay} km / jour` : "Illimité"],
    ["Durée minimale", `${vehicle.minDays} jour${vehicle.minDays > 1 ? "s" : ""}`],
  ];

  return (
    <div className="container-page py-8">
      <nav aria-label="Fil d'Ariane" className="text-sm text-muted">
        <Link href="/location" className="hover:underline">Louez un véhicule</Link> <span aria-hidden="true">/</span> {vehicle.brand} {vehicle.model}
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          <VehicleGallery photos={vehicle.photos} name={`${vehicle.brand} ${vehicle.model}`} isDemo={vehicle.isDemo} />
          <h1 className="mt-6 text-3xl font-extrabold">{vehicle.brand} {vehicle.model} <span className="text-muted">{vehicle.year}</span></h1>
          <p className="mt-2 text-2xl font-extrabold text-brand-green">
            {formatFcfa(vehicle.dailyPrice)} <span className="text-sm font-medium text-muted">par tranche de {rules.blockHours} h</span>
          </p>
          {vehicle.description && <p className="mt-4 whitespace-pre-line text-muted">{vehicle.description}</p>}

          <h2 className="mt-8 text-xl font-bold">Caractéristiques</h2>
          <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-line py-2 text-sm">
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {vehicle.features.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {vehicle.features.map((f) => <li key={f} className="badge bg-green-50 text-brand-green">{f}</li>)}
            </ul>
          )}

          <h2 className="mt-8 text-xl font-bold">Tarifs et options</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Item k="Prix" v={`${formatFcfa(vehicle.dailyPrice)} / ${rules.blockHours} h`} />
            <Item k="Chauffeur" v={vehicle.withDriver ? (vehicle.driverDailyPrice ? `${formatFcfa(vehicle.driverDailyPrice)} / jour` : "Inclus") + (vehicle.withoutDriver ? " (optionnel)" : " (obligatoire)") : "Non proposé"} />
            <Item k="Livraison" v={vehicle.deliveryAvailable ? formatFcfa(vehicle.deliveryFee ?? 0) : "Non proposée"} />
            <Item k="Caution" v={`${formatFcfa(vehicle.deposit ?? 0)} — séparée du prix de location`} />
            {vehicle.extraKmPrice ? <Item k="Kilomètre supplémentaire" v={formatFcfa(vehicle.extraKmPrice)} /> : null}
          </dl>

          {vehicle.rentalConditions && (
            <>
              <h2 className="mt-8 text-xl font-bold">Conditions</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-muted">{vehicle.rentalConditions}</p>
            </>
          )}
          {vehicle.cancellationPolicy && (
            <>
              <h2 className="mt-8 text-xl font-bold">Politique d&apos;annulation</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-muted">{vehicle.cancellationPolicy}</p>
            </>
          )}

          {vehicle.reviews.length > 0 && (
            <>
              <h2 className="mt-8 text-xl font-bold">Avis vérifiés</h2>
              <ul className="mt-3 space-y-3">
                {vehicle.reviews.map((r) => (
                  <li key={r.id} className="card p-4 text-sm">
                    <p className="text-brand-orange" aria-label={`${r.rating} sur 5`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                    <p className="mt-1">{r.comment}</p>
                    <p className="mt-1 text-xs text-muted">{r.author}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="text-lg font-bold">Demande de réservation</h2>
            {archived || vehicle.dailyPrice == null ? (
              <p className="mt-3 text-sm text-muted">
                {archived ? "Ce véhicule n'est plus proposé à la location." : "Ce véhicule est proposé sur devis."}{" "}
                <Link href="/location" className="text-brand-green underline">Voir les autres véhicules</Link>
              </p>
            ) : (
              <div className="mt-4">
                <BookingForm
                  vehicleId={vehicle.id}
                  locations={ops.pickupLocations}
                  withDriver={vehicle.withDriver}
                  withoutDriver={vehicle.withoutDriver}
                  deliveryAvailable={vehicle.deliveryAvailable}
                  defaults={{ depart: sp.depart, retour: sp.retour, lieu: sp.lieu, chauffeur: sp.chauffeur === "avec", name: user?.name, email: user?.email, phone: user?.phone ?? undefined }}
                />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
