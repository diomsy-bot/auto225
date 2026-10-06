"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { requestBooking } from "@/actions/booking";
import { previewQuote, type QuotePreview } from "@/actions/quote";
import { Checkbox, Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { initialFormState } from "@/lib/form";

const fcfa = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/ | /g, " ")} FCFA`;

type Props = {
  vehicleId: string;
  locations: string[];
  withDriver: boolean;
  withoutDriver: boolean;
  deliveryAvailable: boolean;
  defaults: { depart?: string; retour?: string; lieu?: string; chauffeur?: boolean; name?: string; email?: string; phone?: string };
};

export function BookingForm({ vehicleId, locations, withDriver, withoutDriver, deliveryAvailable, defaults }: Props) {
  const [state, action] = useActionState(requestBooking, initialFormState);
  const [depart, setDepart] = useState(defaults.depart ?? "");
  const [retour, setRetour] = useState(defaults.retour ?? "");
  const [driver, setDriver] = useState(withoutDriver ? !!defaults.chauffeur && withDriver : true);
  const [delivery, setDelivery] = useState(false);
  const [preview, setPreview] = useState<QuotePreview>({});
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    if (!depart || !retour) {
      setPreview({});
      return;
    }
    const t = setTimeout(() => {
      startTransition(async () => setPreview(await previewQuote({ vehicleId, depart, retour, withDriver: driver, delivery })));
    }, 250);
    return () => clearTimeout(t);
  }, [vehicleId, depart, retour, driver, delivery]);

  const q = preview.quote;

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <div className="hidden" aria-hidden="true">
        <label>Site web <input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="depart" label="Départ" type="datetime-local" required state={state} value={depart} onChange={(e) => setDepart((e.target as HTMLInputElement).value)} />
        <Field name="retour" label="Retour" type="datetime-local" required state={state} value={retour} onChange={(e) => setRetour((e.target as HTMLInputElement).value)} />
      </div>
      <p className="-mt-2 text-xs text-muted">Horaires à l&apos;heure d&apos;Abidjan (GMT).</p>
      <Field as="select" name="lieu" label="Lieu de retrait" required state={state} options={locations.map((l) => ({ value: l, label: l }))} placeholder="Choisir un lieu" defaultValue={defaults.lieu} />

      <fieldset className="space-y-2">
        <legend className="label">Options</legend>
        {withDriver && withoutDriver && (
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="chauffeur" checked={driver} onChange={(e) => setDriver(e.target.checked)} className="h-5 w-5 accent-brand-green" />
            Avec chauffeur
          </label>
        )}
        {withDriver && !withoutDriver && (
          <>
            <input type="hidden" name="chauffeur" value="on" />
            <p className="text-sm">Ce véhicule est proposé avec chauffeur.</p>
          </>
        )}
        {deliveryAvailable && (
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="livraison" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} className="h-5 w-5 accent-brand-green" />
            Livraison du véhicule
          </label>
        )}
      </fieldset>

      <div className="rounded-2xl bg-surface p-4 text-sm" aria-live="polite">
        <p className="font-semibold">Récapitulatif</p>
        {!depart || !retour ? (
          <p className="mt-1 text-muted">Choisissez vos dates pour afficher le prix.</p>
        ) : preview.error ? (
          <p className="mt-1 text-red-700">{preview.error}</p>
        ) : q ? (
          <dl className={`mt-2 space-y-1 ${loading ? "opacity-60" : ""}`}>
            <Row label={`Location : ${q.billedDays} jour${q.billedDays > 1 ? "s" : ""} × ${fcfa(q.unitPrice)}`} value={fcfa(q.rentalGross)} />
            {q.discountPercent > 0 && <Row label={`Remise durée (${q.discountPercent} %)`} value={`− ${fcfa(q.rentalGross - q.rentalTotal)}`} />}
            {q.driverTotal > 0 && <Row label="Chauffeur" value={fcfa(q.driverTotal)} />}
            {q.deliveryTotal > 0 && <Row label="Livraison" value={fcfa(q.deliveryTotal)} />}
            {q.feesTotal > 0 && <Row label="Frais de service" value={fcfa(q.feesTotal)} />}
            {q.taxTotal > 0 && <Row label="Taxes" value={fcfa(q.taxTotal)} />}
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd className="text-brand-green">{fcfa(q.total)}</dd>
            </div>
            <Row label="Caution (séparée, restituable)" value={fcfa(q.deposit)} />
            {preview.available === false && (
              <p className="pt-2 font-medium text-red-700">Ce véhicule n&apos;est pas disponible sur cette période.</p>
            )}
          </dl>
        ) : (
          <p className="mt-1 text-muted">Calcul en cours…</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Nom complet" required autoComplete="name" state={state} defaultValue={defaults.name} className="sm:col-span-2" />
        <Field name="phone" label="Téléphone" type="tel" required autoComplete="tel" placeholder="+225 07 00 00 00 00" state={state} defaultValue={defaults.phone} />
        <Field name="email" label="Email" type="email" required autoComplete="email" state={state} defaultValue={defaults.email} />
      </div>
      <Field as="textarea" name="message" label="Message (facultatif)" state={state} />
      <Checkbox name="accept" label={<>J&apos;ai lu les <Link href="/conditions" className="text-brand-green underline" target="_blank">conditions de location</Link> et la <Link href="/confidentialite" className="text-brand-green underline" target="_blank">politique de confidentialité</Link>.</>} />
      {state.fieldErrors?.accept && <p className="text-xs font-medium text-red-700">{state.fieldErrors.accept}</p>}
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingLabel="Envoi de la demande…">Envoyer ma demande de réservation</SubmitButton>
      <p className="text-center text-xs text-muted">Votre demande sera confirmée par notre équipe. Aucun paiement n&apos;est demandé à cette étape.</p>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
