import Link from "next/link";
import { VehicleForm } from "@/components/admin/vehicle-form";

export const metadata = { title: "Nouveau véhicule" };

export default function NewVehicle() {
  return (
    <div className="max-w-5xl space-y-4">
      <Link href="/admin/vehicules" className="text-sm text-muted hover:underline">← Véhicules</Link>
      <h1 className="text-2xl font-extrabold">Nouveau véhicule</h1>
      <p className="text-sm text-muted">Enregistrez la fiche, puis ajoutez les photos. Publiez quand tout est prêt.</p>
      <VehicleForm />
    </div>
  );
}
