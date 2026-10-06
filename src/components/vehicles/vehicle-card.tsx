import Link from "next/link";
import type { Vehicle, VehiclePhoto } from "@prisma/client";
import { formatFcfa } from "@/lib/format";
import { CATEGORY_LABELS, FUEL_LABELS, SALE_STATUS_LABELS, TRANSMISSION_LABELS } from "@/lib/labels";
import { StatusBadge } from "@/components/ui/badge";
import { VehicleImage } from "./vehicle-image";

type V = Vehicle & { photos: VehiclePhoto[] };

export function RentalCard({ vehicle, query = "" }: { vehicle: V; query?: string }) {
  const photo = vehicle.photos[0];
  return (
    <article className="card group relative flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <VehicleImage src={photo?.url} alt={photo?.alt || `${vehicle.brand} ${vehicle.model}`} isDemo={vehicle.isDemo} className="aspect-[16/10]" />
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{CATEGORY_LABELS[vehicle.category]} · {vehicle.year}</p>
        <h3 className="mt-1 text-lg font-bold">
          <Link href={`/location/${vehicle.slug}${query}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {vehicle.brand} {vehicle.model}
          </Link>
        </h3>
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          <li>{TRANSMISSION_LABELS[vehicle.transmission]}</li>
          <li>{FUEL_LABELS[vehicle.fuel]}</li>
          <li>{vehicle.seats} places</li>
          {vehicle.withDriver && <li>{vehicle.withoutDriver ? "Avec ou sans chauffeur" : "Avec chauffeur"}</li>}
        </ul>
        <div className="mt-auto flex items-end justify-between pt-4">
          <p>
            <span className="text-lg font-extrabold text-brand-green">{formatFcfa(vehicle.dailyPrice)}</span>
            {vehicle.dailyPrice != null && <span className="text-xs text-muted"> / jour</span>}
          </p>
          <span className="text-sm font-semibold text-orange-cta group-hover:underline" aria-hidden="true">Voir →</span>
        </div>
      </div>
    </article>
  );
}

export function SaleCard({ vehicle }: { vehicle: V }) {
  const photo = vehicle.photos[0];
  return (
    <article className="card group relative flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <VehicleImage src={photo?.url} alt={photo?.alt || `${vehicle.brand} ${vehicle.model}`} isDemo={vehicle.isDemo} className="aspect-[16/10]" />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{vehicle.year} · {vehicle.mileage?.toLocaleString("fr-FR")} km</p>
          <StatusBadge status={vehicle.saleStatus} labels={SALE_STATUS_LABELS} />
        </div>
        <h3 className="mt-1 text-lg font-bold">
          <Link href={`/achat-vente/${vehicle.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {vehicle.brand} {vehicle.model}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-muted">{TRANSMISSION_LABELS[vehicle.transmission]} · {FUEL_LABELS[vehicle.fuel]} · {vehicle.city}</p>
        <p className="mt-auto pt-4 text-lg font-extrabold text-brand-green">{formatFcfa(vehicle.salePrice)}</p>
      </div>
    </article>
  );
}
