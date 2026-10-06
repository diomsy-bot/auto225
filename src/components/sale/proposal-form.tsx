"use client";

import { useActionState } from "react";
import { proposeVehicleForSale } from "@/actions/sale";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { initialFormState } from "@/lib/form";
import { FUEL_LABELS, TRANSMISSION_LABELS, enumOptions } from "@/lib/labels";

export function SaleProposalForm() {
  const [state, action] = useActionState(proposeVehicleForSale, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="brand" label="Marque" required state={state} />
        <Field name="model" label="Modèle" required state={state} />
        <Field name="year" label="Année" type="number" inputMode="numeric" required state={state} />
        <Field name="mileage" label="Kilométrage" type="number" inputMode="numeric" required state={state} />
        <Field as="select" name="transmission" label="Boîte de vitesses" required state={state} options={enumOptions(TRANSMISSION_LABELS)} placeholder="Choisir" />
        <Field as="select" name="fuel" label="Carburant" required state={state} options={enumOptions(FUEL_LABELS)} placeholder="Choisir" />
        <Field name="askingPrice" label="Prix souhaité (FCFA)" type="number" inputMode="numeric" required state={state} />
        <Field name="city" label="Ville" required state={state} defaultValue="Abidjan" />
      </div>
      <Field as="textarea" name="description" label="État et description" state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="photos" label="Photos du véhicule" type="file" accept="image/jpeg,image/png,image/webp" multiple required />
        <Field name="papers" label="Documents du véhicule (facultatif)" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary">Envoyer ma proposition</SubmitButton>
    </form>
  );
}
