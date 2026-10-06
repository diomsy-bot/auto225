"use client";

import Link from "next/link";
import { useActionState } from "react";
import { confirmTotp, forgotPassword, login, register, resetPassword } from "@/actions/auth";
import { Checkbox, Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { initialFormState } from "@/lib/form";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="suite" value={next ?? ""} />
      <Field name="email" label="Email" type="email" autoComplete="email" required state={state} />
      <Field name="password" label="Mot de passe" type="password" autoComplete="current-password" required state={state} />
      <FormMessage state={state} />
      <SubmitButton className="btn-green w-full" pendingLabel="Connexion…">Se connecter</SubmitButton>
      <p className="text-center text-sm"><Link href="/mot-de-passe-oublie" className="text-brand-green underline">Mot de passe oublié ?</Link></p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState(register, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="suite" value={next ?? ""} />
      <Field name="name" label="Nom complet" autoComplete="name" required state={state} />
      <Field name="email" label="Email" type="email" autoComplete="email" required state={state} />
      <Field name="phone" label="Téléphone" type="tel" autoComplete="tel" required state={state} />
      <Field name="password" label="Mot de passe" type="password" autoComplete="new-password" required state={state} hint="Au moins 10 caractères, avec des lettres et des chiffres." />
      <Field name="confirm" label="Confirmez le mot de passe" type="password" autoComplete="new-password" required state={state} />
      <Checkbox name="accept" label={<>J&apos;accepte les <Link href="/conditions" className="text-brand-green underline">conditions</Link> et la <Link href="/confidentialite" className="text-brand-green underline">politique de confidentialité</Link>.</>} />
      {state.fieldErrors?.accept && <p className="text-xs font-medium text-red-700">{state.fieldErrors.accept}</p>}
      <Checkbox name="marketing" label="J'accepte de recevoir les offres d'AUTO225 (facultatif)." />
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingLabel="Création du compte…">Créer mon compte</SubmitButton>
    </form>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState(forgotPassword, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <Field name="email" label="Email" type="email" autoComplete="email" required state={state} />
      <FormMessage state={state} />
      <SubmitButton className="btn-green w-full">Recevoir un lien</SubmitButton>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Field name="password" label="Nouveau mot de passe" type="password" autoComplete="new-password" required state={state} hint="Au moins 10 caractères, avec des lettres et des chiffres." />
      <Field name="confirm" label="Confirmez le mot de passe" type="password" autoComplete="new-password" required state={state} />
      <FormMessage state={state} />
      <SubmitButton className="btn-green w-full">Enregistrer</SubmitButton>
    </form>
  );
}

export function TotpForm() {
  const [state, action] = useActionState(confirmTotp, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <Field name="code" label="Code à 6 chiffres" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" required state={state} />
      <FormMessage state={state} />
      <SubmitButton className="btn-green w-full">Valider</SubmitButton>
    </form>
  );
}
