"use client";

import { useActionState } from "react";
import type { DocumentKind, Fuel, Transmission } from "@prisma/client";
import { deleteOwnDocument, saveOwnerApplication } from "@/actions/owner";
import { Field, FormMessage } from "@/components/ui/form";
import { initialFormState } from "@/lib/form";
import { DOCUMENT_KIND_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, enumOptions } from "@/lib/labels";

type App = {
  id: string;
  ownerName: string;
  ownerPhone: string;
  city: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  transmission: Transmission;
  fuel: Fuel;
  availability: string;
  desiredPrice: number | null;
  message: string;
  documents: { id: string; kind: DocumentKind; originalName: string }[];
};

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

export function OwnerApplicationForm({ application, defaults }: { application: App | null; defaults: { ownerName: string; ownerPhone: string } }) {
  const [state, action, pending] = useActionState(saveOwnerApplication, initialFormState);
  const a = application;
  return (
    <>
      <form action={action} className="space-y-6" encType="multipart/form-data">
        {a && <input type="hidden" name="id" value={a.id} />}
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-lg font-bold">Vos coordonnées</legend>
          <Field name="ownerName" label="Nom du propriétaire" required state={state} defaultValue={a?.ownerName ?? defaults.ownerName} />
          <Field name="ownerPhone" label="Téléphone" type="tel" required state={state} defaultValue={a?.ownerPhone ?? defaults.ownerPhone} />
          <Field name="city" label="Ville" required state={state} defaultValue={a?.city ?? "Abidjan"} />
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-lg font-bold">Le véhicule</legend>
          <Field name="brand" label="Marque" required state={state} defaultValue={a?.brand} />
          <Field name="model" label="Modèle" required state={state} defaultValue={a?.model} />
          <Field name="year" label="Année" type="number" inputMode="numeric" required state={state} defaultValue={a?.year} />
          <Field name="mileage" label="Kilométrage" type="number" inputMode="numeric" required state={state} defaultValue={a?.mileage} />
          <Field as="select" name="transmission" label="Boîte de vitesses" required state={state} options={enumOptions(TRANSMISSION_LABELS)} placeholder="Choisir" defaultValue={a?.transmission} />
          <Field as="select" name="fuel" label="Carburant" required state={state} options={enumOptions(FUEL_LABELS)} placeholder="Choisir" defaultValue={a?.fuel} />
          <Field name="desiredPrice" label="Tarif souhaité (FCFA / jour)" type="number" inputMode="numeric" state={state} defaultValue={a?.desiredPrice ?? undefined} />
          <Field as="textarea" name="availability" label="Disponibilités" hint="Ex. : tous les jours sauf le week-end, à partir de novembre…" state={state} defaultValue={a?.availability} className="sm:col-span-2" />
          <Field as="textarea" name="message" label="Informations complémentaires" state={state} defaultValue={a?.message} className="sm:col-span-2" />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-lg font-bold">Photos et justificatifs</legend>
          <p className="text-sm text-muted">Formats acceptés : JPG, PNG, WebP ou PDF, 10 Mo maximum par fichier. Ces fichiers restent privés.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="photos" label="Photos du véhicule" type="file" accept="image/jpeg,image/png,image/webp" multiple />
            <Field name="ownershipProof" label="Preuve de propriété ou mandat" type="file" accept={ACCEPT} multiple />
            <Field name="vehiclePapers" label="Documents du véhicule" type="file" accept={ACCEPT} multiple />
            <Field name="insurance" label="Attestation d'assurance" type="file" accept={ACCEPT} multiple />
            <Field name="identity" label="Pièce d'identité" type="file" accept={ACCEPT} multiple />
          </div>
        </fieldset>

        <FormMessage state={state} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="submit" name="intent" value="submit" className="btn-primary" disabled={pending}>
            {pending ? "Envoi…" : "Soumettre mon dossier"}
          </button>
          <button type="submit" name="intent" value="draft" className="btn-outline" disabled={pending}>
            Enregistrer le brouillon
          </button>
        </div>
      </form>

      {a && a.documents.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold">Fichiers déjà déposés</h2>
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
            {a.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  <span className="font-medium">{DOCUMENT_KIND_LABELS[d.kind]}</span>
                  <a href={`/api/documents/${d.id}`} target="_blank" className="ml-2 text-brand-green underline">{d.originalName}</a>
                </span>
                <form action={deleteOwnDocument}>
                  <input type="hidden" name="documentId" value={d.id} />
                  <button className="text-xs text-red-700 underline">Supprimer</button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
