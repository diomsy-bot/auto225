import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { db } from "@/lib/db";
import { FUEL_LABELS, TRANSMISSION_LABELS, enumOptions } from "@/lib/labels";
import { SaleCard } from "@/components/vehicles/vehicle-card";
import { PageIntro } from "@/components/site/page-intro";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Achat & vente de véhicules à Abidjan",
  description: "Véhicules d'occasion à vendre à Abidjan : consultez les annonces, demandez une visite ou proposez votre voiture.",
};

type SP = Record<string, string | undefined>;
const num = (v?: string) => (v && Number(v) > 0 ? Number(v) : undefined);

export default async function SaleCatalogue({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  // Un véhicule vendu sort des résultats (ACC-07).
  const where: Prisma.VehicleWhereInput = { status: "PUBLISHED", forSale: true, saleStatus: { not: "SOLD" } };
  if (sp.marque) where.brand = { equals: sp.marque, mode: "insensitive" };
  if (sp.modele) where.model = { contains: sp.modele, mode: "insensitive" };
  if (num(sp.prixMin) || num(sp.prixMax)) where.salePrice = { gte: num(sp.prixMin), lte: num(sp.prixMax) };
  if (num(sp.anneeMin)) where.year = { gte: num(sp.anneeMin) };
  if (num(sp.kmMax)) where.mileage = { lte: num(sp.kmMax) };
  if (sp.carburant && sp.carburant in FUEL_LABELS) where.fuel = sp.carburant as keyof typeof FUEL_LABELS;
  if (sp.boite && sp.boite in TRANSMISSION_LABELS) where.transmission = sp.boite as keyof typeof TRANSMISSION_LABELS;

  const [vehicles, brands] = await Promise.all([
    db.vehicle.findMany({ where, include: { photos: { orderBy: { position: "asc" } } }, orderBy: { createdAt: "desc" }, take: 60 }),
    db.vehicle.findMany({ where: { status: "PUBLISHED", forSale: true }, distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } }),
  ]);

  return (
    <>
    <PageIntro
      eyebrow="Achat & vente"
      title="Votre prochaine voiture."
      actions={<Link href="/achat-vente/proposer" className="btn-green">Proposer un véhicule à vendre <Plus size={17} aria-hidden="true" /></Link>}
    >
      Des annonces à explorer. Un rendez-vous pour décider.
    </PageIntro>
    <div className="container-page py-10">
      <form method="get" className="grid rounded-[9px] border border-[#e3e8e1] bg-white shadow-[0_7px_25px_#22392d08] gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4" role="search" aria-label="Filtrer les véhicules à vendre">
        <Sel name="marque" label="Marque" value={sp.marque} options={brands.map((b) => ({ value: b.brand, label: b.brand }))} />
        <Inp name="modele" label="Modèle" value={sp.modele} />
        <Inp name="prixMin" label="Prix min (FCFA)" value={sp.prixMin} type="number" />
        <Inp name="prixMax" label="Prix max (FCFA)" value={sp.prixMax} type="number" />
        <Inp name="anneeMin" label="Année minimum" value={sp.anneeMin} type="number" />
        <Inp name="kmMax" label="Kilométrage max" value={sp.kmMax} type="number" />
        <Sel name="carburant" label="Carburant" value={sp.carburant} options={enumOptions(FUEL_LABELS)} />
        <Sel name="boite" label="Boîte de vitesses" value={sp.boite} options={enumOptions(TRANSMISSION_LABELS)} />
        <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
          <button className="btn-green">Filtrer</button>
          <Link href="/achat-vente" className="btn-outline">Réinitialiser</Link>
        </div>
      </form>

      <p className="mt-8 font-display text-[19px] font-bold">{vehicles.length} véhicule{vehicles.length > 1 ? "s" : ""}</p>
      {vehicles.length === 0 ? (
        <div className="mt-4 rounded-[10px] border border-dashed border-[#d9e3d4] bg-surface p-10 text-center text-sm text-muted">Aucun véhicule ne correspond à vos critères.</div>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => <SaleCard key={v.id} vehicle={v} />)}
        </div>
      )}
    </div>
    </>
  );
}

function Inp({ name, label, value, type = "text" }: { name: string; label: string; value?: string; type?: string }) {
  return (
    <div>
      <label htmlFor={`v-${name}`} className="label">{label}</label>
      <input id={`v-${name}`} name={name} type={type} inputMode={type === "number" ? "numeric" : undefined} defaultValue={value} className="input" />
    </div>
  );
}

function Sel({ name, label, value, options }: { name: string; label: string; value?: string; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label htmlFor={`v-${name}`} className="label">{label}</label>
      <select id={`v-${name}`} name={name} defaultValue={value ?? ""} className="input">
        <option value="">Tous</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
