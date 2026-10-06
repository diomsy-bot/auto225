import type { Vehicle } from "@prisma/client";
import { saveVehicle } from "@/actions/admin/vehicles";
import { ActionForm } from "@/components/admin/action-form";
import { CATEGORY_LABELS, FUEL_LABELS, SALE_STATUS_LABELS, TRANSMISSION_LABELS, VEHICLE_STATUS_LABELS } from "@/lib/labels";

type V = Partial<Vehicle> & { ownerEmail?: string | null };

export function VehicleForm({ vehicle }: { vehicle?: V }) {
  const v = vehicle ?? {};
  return (
    <ActionForm action={saveVehicle} className="space-y-6">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <Section title="Identification">
        <In name="brand" label="Marque" v={v.brand} required />
        <In name="model" label="Modèle" v={v.model} required />
        <In name="year" label="Année" v={v.year} type="number" required />
        <Sel name="category" label="Catégorie" v={v.category} options={CATEGORY_LABELS} />
        <Sel name="transmission" label="Boîte" v={v.transmission} options={TRANSMISSION_LABELS} />
        <Sel name="fuel" label="Carburant" v={v.fuel} options={FUEL_LABELS} />
        <In name="seats" label="Places" v={v.seats ?? 5} type="number" required />
        <In name="plate" label="Immatriculation (privée, jamais affichée)" v={v.plate} />
        <In name="city" label="Ville" v={v.city ?? "Abidjan"} required />
        <In name="zone" label="Zone de disponibilité" v={v.zone} />
        <In name="features" label="Équipements (séparés par des virgules)" v={v.features?.join(", ")} wide />
        <Ta name="description" label="Description" v={v.description} />
        <Sel name="status" label="Statut de publication" v={v.status ?? "DRAFT"} options={VEHICLE_STATUS_LABELS} />
        <In name="ownerEmail" label="Email du propriétaire (facultatif)" v={v.ownerEmail} />
        <Cb name="featured" label="Afficher à la une sur l'accueil" v={v.featured} />
      </Section>

      <Section title="Location">
        <Cb name="forRent" label="Proposé à la location" v={v.forRent ?? true} />
        <In name="dailyPrice" label="Prix par jour (FCFA)" v={v.dailyPrice} type="number" />
        <In name="deposit" label="Caution (FCFA)" v={v.deposit} type="number" />
        <In name="includedKmPerDay" label="Km inclus par jour (vide = illimité)" v={v.includedKmPerDay} type="number" />
        <In name="extraKmPrice" label="Prix du km supplémentaire" v={v.extraKmPrice} type="number" />
        <In name="minDays" label="Durée minimale (jours)" v={v.minDays ?? 1} type="number" required />
        <Cb name="withoutDriver" label="Sans chauffeur" v={v.withoutDriver ?? true} />
        <Cb name="withDriver" label="Avec chauffeur" v={v.withDriver} />
        <In name="driverDailyPrice" label="Prix du chauffeur par jour" v={v.driverDailyPrice} type="number" />
        <Cb name="deliveryAvailable" label="Livraison possible" v={v.deliveryAvailable} />
        <In name="deliveryFee" label="Frais de livraison" v={v.deliveryFee} type="number" />
        <Ta name="rentalConditions" label="Conditions" v={v.rentalConditions} />
        <Ta name="cancellationPolicy" label="Politique d'annulation" v={v.cancellationPolicy} />
      </Section>

      <Section title="Vente">
        <Cb name="forSale" label="Proposé à la vente" v={v.forSale} />
        <In name="salePrice" label="Prix de vente (FCFA)" v={v.salePrice} type="number" />
        <In name="mileage" label="Kilométrage" v={v.mileage} type="number" />
        <Sel name="saleStatus" label="Statut de vente" v={v.saleStatus ?? "AVAILABLE"} options={SALE_STATUS_LABELS} />
        <Ta name="saleCondition" label="État décrit" v={v.saleCondition} />
        <Ta name="visitConditions" label="Conditions de visite" v={v.visitConditions} />
      </Section>

      <button className="btn-primary">Enregistrer le véhicule</button>
    </ActionForm>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
      <legend className="px-1 text-lg font-bold">{title}</legend>
      {children}
    </fieldset>
  );
}

function In({ name, label, v, type = "text", required, wide }: { name: string; label: string; v?: string | number | null; type?: string; required?: boolean; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2 lg:col-span-3" : ""}>
      <label htmlFor={`a-${name}`} className="label">{label}</label>
      <input id={`a-${name}`} name={name} type={type} defaultValue={v ?? ""} required={required} className="input" />
    </div>
  );
}

function Ta({ name, label, v }: { name: string; label: string; v?: string | null }) {
  return (
    <div className="sm:col-span-2 lg:col-span-3">
      <label htmlFor={`a-${name}`} className="label">{label}</label>
      <textarea id={`a-${name}`} name={name} defaultValue={v ?? ""} rows={3} className="input" />
    </div>
  );
}

function Sel({ name, label, v, options }: { name: string; label: string; v?: string | null; options: Record<string, string> }) {
  return (
    <div>
      <label htmlFor={`a-${name}`} className="label">{label}</label>
      <select id={`a-${name}`} name={name} defaultValue={v ?? Object.keys(options)[0]} className="input">
        {Object.entries(options).map(([value, l]) => <option key={value} value={value}>{l}</option>)}
      </select>
    </div>
  );
}

function Cb({ name, label, v }: { name: string; label: string; v?: boolean | null }) {
  return (
    <label className="flex items-center gap-3 self-end py-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={!!v} className="h-5 w-5 accent-brand-green" />
      {label}
    </label>
  );
}
