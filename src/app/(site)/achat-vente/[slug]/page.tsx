import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatFcfa } from "@/lib/format";
import { CATEGORY_LABELS, FUEL_LABELS, SALE_STATUS_LABELS, TRANSMISSION_LABELS } from "@/lib/labels";
import { StatusBadge } from "@/components/ui/badge";
import { SaleInquiryForm } from "@/components/sale/inquiry-form";
import { VehicleGallery } from "@/components/vehicles/gallery";

type Props = { params: Promise<{ slug: string }> };

const load = (slug: string) =>
  db.vehicle.findFirst({ where: { slug, forSale: true, status: { in: ["PUBLISHED", "ARCHIVED"] } }, include: { photos: { orderBy: { position: "asc" } } } });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = await load((await params).slug);
  if (!v) return {};
  return {
    title: `${v.brand} ${v.model} ${v.year} à vendre`,
    description: `${v.brand} ${v.model} ${v.year}, ${v.mileage?.toLocaleString("fr-FR")} km, ${formatFcfa(v.salePrice)} à ${v.city}.`,
    // Une annonce vendue reste consultable pour les liens partagés, mais n'est plus indexée.
    robots: v.saleStatus === "SOLD" || v.status === "ARCHIVED" ? { index: false } : undefined,
  };
}

export default async function SaleVehiclePage({ params }: Props) {
  const vehicle = await load((await params).slug);
  if (!vehicle) notFound();
  const user = await getCurrentUser();
  const sold = vehicle.saleStatus === "SOLD" || vehicle.status === "ARCHIVED";

  const specs: [string, string][] = [
    ["Année", String(vehicle.year)],
    ["Kilométrage", `${vehicle.mileage?.toLocaleString("fr-FR") ?? "—"} km`],
    ["Catégorie", CATEGORY_LABELS[vehicle.category]],
    ["Boîte", TRANSMISSION_LABELS[vehicle.transmission]],
    ["Carburant", FUEL_LABELS[vehicle.fuel]],
    ["Places", String(vehicle.seats)],
    ["Localisation", vehicle.city],
  ];

  return (
    <div className="container-page py-8">
      <nav aria-label="Fil d'Ariane" className="text-sm text-muted">
        <Link href="/achat-vente" className="hover:underline">Achat &amp; vente</Link> <span aria-hidden="true">/</span> {vehicle.brand} {vehicle.model}
      </nav>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          <VehicleGallery photos={vehicle.photos} name={`${vehicle.brand} ${vehicle.model}`} isDemo={vehicle.isDemo} />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold">{vehicle.brand} {vehicle.model} <span className="text-muted">{vehicle.year}</span></h1>
            <StatusBadge status={sold ? "SOLD" : vehicle.saleStatus} labels={SALE_STATUS_LABELS} />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-brand-green">{formatFcfa(vehicle.salePrice)}</p>
          <dl className="mt-6 grid gap-x-6 sm:grid-cols-2">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-line py-2 text-sm">
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {vehicle.saleCondition && (<><h2 className="mt-8 text-xl font-bold">État du véhicule</h2><p className="mt-2 whitespace-pre-line text-sm text-muted">{vehicle.saleCondition}</p></>)}
          {vehicle.features.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">{vehicle.features.map((f) => <li key={f} className="badge bg-green-50 text-brand-green">{f}</li>)}</ul>
          )}
          {vehicle.description && (<><h2 className="mt-8 text-xl font-bold">Description</h2><p className="mt-2 whitespace-pre-line text-sm text-muted">{vehicle.description}</p></>)}
          {vehicle.visitConditions && (<><h2 className="mt-8 text-xl font-bold">Conditions de visite</h2><p className="mt-2 whitespace-pre-line text-sm text-muted">{vehicle.visitConditions}</p></>)}
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            {sold ? (
              <>
                <h2 className="text-lg font-bold">Ce véhicule a été vendu</h2>
                <p className="mt-2 text-sm text-muted">Découvrez les autres véhicules disponibles.</p>
                <Link href="/achat-vente" className="btn-green mt-4 w-full">Voir les véhicules à vendre</Link>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold">Ce véhicule vous intéresse ?</h2>
                <p className="mt-1 text-sm text-muted">Demandez des renseignements ou un rendez-vous de visite.</p>
                <div className="mt-4">
                  <SaleInquiryForm vehicleId={vehicle.id} defaults={{ name: user?.name, email: user?.email, phone: user?.phone ?? undefined }} />
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
