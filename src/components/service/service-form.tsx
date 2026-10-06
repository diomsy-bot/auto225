"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestService } from "@/actions/service";
import { Checkbox, Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { initialFormState } from "@/lib/form";
import { CATEGORY_LABELS } from "@/lib/labels";

export function ServiceForm({ types, defaults }: {
  types: { value: string; label: string }[];
  defaults: { serviceTypeId?: string; name?: string; email?: string; phone?: string };
}) {
  const [state, action] = useActionState(requestService, initialFormState);
  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="hidden" aria-hidden="true"><input type="text" name="website" tabIndex={-1} autoComplete="off" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field as="select" name="serviceTypeId" label="Type de service" required state={state} options={types} placeholder="Choisir" defaultValue={defaults.serviceTypeId} className="sm:col-span-2" />
        <Field name="date" label="Date" type="date" required state={state} />
        <Field name="time" label="Horaire" type="time" required state={state} />
        <Field name="departure" label="Lieu de départ" required state={state} />
        <Field name="destination" label="Destination" state={state} />
        <Field name="passengers" label="Nombre de passagers" type="number" min={1} inputMode="numeric" required defaultValue="1" state={state} />
        <Field name="duration" label="Durée estimée" placeholder="Ex. : 1 journée, 3 heures, 2 mois" state={state} />
        <Field as="select" name="category" label="Catégorie souhaitée" state={state} options={Object.values(CATEGORY_LABELS).map((l) => ({ value: l, label: l }))} placeholder="Indifférent" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="name" label="Nom complet" autoComplete="name" required state={state} defaultValue={defaults.name} />
        <Field name="phone" label="Téléphone" type="tel" autoComplete="tel" required state={state} defaultValue={defaults.phone} />
        <Field name="email" label="Email" type="email" autoComplete="email" required state={state} defaultValue={defaults.email} />
      </div>
      <Field as="textarea" name="message" label="Votre message" state={state} />
      <Checkbox name="accept" label={<>J&apos;accepte que mes données soient utilisées pour traiter ma demande (<Link href="/confidentialite" className="text-brand-green underline">confidentialité</Link>).</>} />
      {state.fieldErrors?.accept && <p className="text-xs font-medium text-red-700">{state.fieldErrors.accept}</p>}
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full sm:w-auto">Envoyer ma demande de devis</SubmitButton>
    </form>
  );
}
