"use client";

import { useActionState } from "react";
import { leaveReview, requestDataDeletion, updateProfile } from "@/actions/account";
import { resendVerification } from "@/actions/auth";
import { ownerAddUnavailability } from "@/actions/owner";
import { Checkbox, Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { initialFormState } from "@/lib/form";

export function ProfileForm({ user }: { user: { name: string; phone: string | null; marketingOptIn: boolean } }) {
  const [state, action] = useActionState(updateProfile, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <Field name="name" label="Nom complet" required state={state} defaultValue={user.name} />
      <Field name="phone" label="Téléphone" type="tel" required state={state} defaultValue={user.phone ?? ""} />
      <Checkbox name="marketing" defaultChecked={user.marketingOptIn} label="Recevoir les offres d'AUTO225" hint="Indépendant des messages liés à vos demandes." />
      <FormMessage state={state} />
      <SubmitButton className="btn-green">Enregistrer</SubmitButton>
    </form>
  );
}

export function ResendVerification() {
  const [state, action] = useActionState(resendVerification, initialFormState);
  return (
    <form action={action} className="inline">
      <button className="font-semibold underline">Renvoyer le lien</button>
      {state.message && <span className="ml-2">{state.message}</span>}
      {state.error && <span className="ml-2 text-red-700">{state.error}</span>}
    </form>
  );
}

export function DataRequest() {
  const [state, action] = useActionState(requestDataDeletion, initialFormState);
  return (
    <form action={action}>
      <FormMessage state={state} />
      {!state.message && <SubmitButton className="btn-outline btn-sm">Demander l&apos;accès ou la suppression de mes données</SubmitButton>}
    </form>
  );
}

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(leaveReview, initialFormState);
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="mt-3 space-y-3 rounded-xl bg-surface p-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Field as="select" name="rating" label="Note" required state={state} options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} / 5` }))} defaultValue="5" />
      <Field as="textarea" name="comment" label="Votre avis" required state={state} />
      <FormMessage state={state} />
      <SubmitButton className="btn-green btn-sm">Publier mon avis</SubmitButton>
    </form>
  );
}

export function OwnerUnavailabilityForm({ vehicleId }: { vehicleId: string }) {
  const [state, action] = useActionState(ownerAddUnavailability, initialFormState);
  return (
    <form action={action} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <Field name="startAt" label="Du" type="datetime-local" required state={state} />
      <Field name="endAt" label="Au" type="datetime-local" required state={state} />
      <Field name="note" label="Motif" state={state} />
      <SubmitButton className="btn-outline">Ajouter</SubmitButton>
      <div className="sm:col-span-4"><FormMessage state={state} /></div>
    </form>
  );
}
