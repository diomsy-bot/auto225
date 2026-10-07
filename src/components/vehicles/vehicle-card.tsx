import Link from "next/link";
import { ArrowUpRight, Fuel, Gauge, Settings2, UsersRound } from "lucide-react";
import type { Vehicle, VehiclePhoto } from "@prisma/client";
import { formatFcfa } from "@/lib/format";
import { CATEGORY_LABELS, FUEL_LABELS, SALE_STATUS_LABELS, TRANSMISSION_LABELS } from "@/lib/labels";
import { StatusBadge } from "@/components/ui/badge";
import { VehicleImage } from "./vehicle-image";

type V = Vehicle & { photos: VehiclePhoto[] };

const cardClass = "group relative flex flex-col overflow-hidden rounded-[10px] border border-[#e7ece6] bg-white transition-shadow hover:shadow-[0_12px_40px_#142f2214]";
const tagClass = "absolute top-4 left-4 rounded-[5px] bg-[#fffef4ed] px-3 py-1.5 text-[11px] font-semibold text-ink";

function Arrow() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-green-50 text-brand-green transition-colors group-hover:bg-brand-green group-hover:text-white" aria-hidden="true">
      <ArrowUpRight size={20} />
    </span>
  );
}

export function RentalCard({ vehicle, query = "" }: { vehicle: V; query?: string }) {
  const photo = vehicle.photos[0];
  return (
    <article className={cardClass}>
      <div className="relative">
        <VehicleImage src={photo?.url} alt={photo?.alt || `${vehicle.brand} ${vehicle.model}`} isDemo={vehicle.isDemo} className="h-[222px] sm:h-[200px] lg:h-[222px]" zoom />
        <span className={tagClass}>{CATEGORY_LABELS[vehicle.category]}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-bold tracking-[0.15em] text-muted uppercase">{vehicle.brand} · {vehicle.year}</p>
        <h3 className="mt-2 mb-4 text-[19px] font-bold">
          <Link href={`/location/${vehicle.slug}${query}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {vehicle.brand} {vehicle.model}
          </Link>
        </h3>
        <ul className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#6f7b72]">
          <li className="flex items-center gap-1.5"><Settings2 size={14} aria-hidden="true" />{TRANSMISSION_LABELS[vehicle.transmission]}</li>
          <li className="flex items-center gap-1.5"><UsersRound size={14} aria-hidden="true" />{vehicle.seats} places</li>
          <li className="flex items-center gap-1.5"><Fuel size={14} aria-hidden="true" />{FUEL_LABELS[vehicle.fuel]}</li>
          {vehicle.withDriver && <li>{vehicle.withoutDriver ? "Avec ou sans chauffeur" : "Avec chauffeur"}</li>}
        </ul>
        <div className="mt-auto flex items-center justify-between border-t border-[#edf0e9] pt-4">
          <p>
            <strong className="font-display text-[18px] font-bold tracking-tight text-brand-green">{formatFcfa(vehicle.dailyPrice)}</strong>
            {vehicle.dailyPrice != null && <span className="text-[11px] text-[#8a938e]"> / jour</span>}
          </p>
          <Arrow />
        </div>
      </div>
    </article>
  );
}

export function SaleCard({ vehicle }: { vehicle: V }) {
  const photo = vehicle.photos[0];
  return (
    <article className={cardClass}>
      <div className="relative">
        <VehicleImage src={photo?.url} alt={photo?.alt || `${vehicle.brand} ${vehicle.model}`} isDemo={vehicle.isDemo} className="h-[222px] sm:h-[200px] lg:h-[222px]" zoom />
        <span className={tagClass}>{CATEGORY_LABELS[vehicle.category]}</span>
        <span className="absolute top-4 right-4"><StatusBadge status={vehicle.saleStatus} labels={SALE_STATUS_LABELS} /></span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-bold tracking-[0.15em] text-muted uppercase">{vehicle.brand} · {vehicle.year}</p>
        <h3 className="mt-2 mb-4 text-[19px] font-bold">
          <Link href={`/achat-vente/${vehicle.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {vehicle.brand} {vehicle.model}
          </Link>
        </h3>
        <ul className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#6f7b72]">
          <li className="flex items-center gap-1.5"><Settings2 size={14} aria-hidden="true" />{TRANSMISSION_LABELS[vehicle.transmission]}</li>
          <li className="flex items-center gap-1.5"><Fuel size={14} aria-hidden="true" />{FUEL_LABELS[vehicle.fuel]}</li>
          {vehicle.mileage != null && <li className="flex items-center gap-1.5"><Gauge size={14} aria-hidden="true" />{vehicle.mileage.toLocaleString("fr-FR")} km</li>}
          <li>{vehicle.city}</li>
        </ul>
        <div className="mt-auto flex items-center justify-between border-t border-[#edf0e9] pt-4">
          <strong className="font-display text-[18px] font-bold tracking-tight text-brand-green">{formatFcfa(vehicle.salePrice)}</strong>
          <Arrow />
        </div>
      </div>
    </article>
  );
}
