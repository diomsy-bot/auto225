"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestSaleInfo } from "@/actions/sale";
import { Checkbox, Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { initialFormState } from "@/lib/form";

export function SaleInquiryForm({ vehicleId, defaults }: { vehicleId: string; defaults: { name?: string; email?: string; phone?: string } }) {
  const [state, action] = useActionState(requestSaleInfo, initialFormState);
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <div className="hidden" aria-hidden="true"><input type="text" name="website" tabIndex={-1} autoComplete="off" /></div>
      <Field as="select" name="kind" label="Votre demande" required state={state} options={[{ value: "INFO", label: "Demande de renseignements" }, { value: "VISIT", label: "Rendez-vous de visite" }]} defaultValue="INFO" />
      <Field name="preferredDate" label="Date de visite souhaitée" type="date" state={state} />
      <Field name="name" label="Nom complet" autoComplete="name" required state={state} defaultValue={defaults.name} />
      <Field name="phone" label="Téléphone" type="tel" autoComplete="tel" required state={state} defaultValue={defaults.phone} />
      <Field name="email" label="Email" type="email" autoComplete="email" required state={state} defaultValue={defaults.email} />
      <Field as="textarea" name="message" label="Message" state={state} />
      <Checkbox name="accept" label={<>J&apos;accepte la <Link href="/confidentialite" className="text-brand-green underline">politique de confidentialité</Link>.</>} />
      {state.fieldErrors?.accept && <p className="text-xs font-medium text-red-700">{state.fieldErrors.accept}</p>}
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full">Envoyer</SubmitButton>
    </form>
  );
}
