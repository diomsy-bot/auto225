import { saveSettings } from "@/actions/admin/content";
import { ActionForm } from "@/components/admin/action-form";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { getContact, getOperations, getPricingRules } from "@/lib/settings";

export const metadata = { title: "Paramètres" };

export default async function SettingsAdmin() {
  await requireStaff(["ADMIN"]);
  const [contact, rules, ops, video] = await Promise.all([getContact(), getPricingRules(), getOperations(), db.setting.findUnique({ where: { key: "heroVideo" } })]);
  const v = (video?.value ?? {}) as { url?: string; poster?: string };
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-extrabold">Paramètres</h1>
      <ActionForm action={saveSettings} className="mt-6 space-y-6">
        <fieldset className="card grid gap-4 p-5 sm:grid-cols-2">
          <legend className="px-1 text-lg font-bold">Coordonnées</legend>
          <In name="companyName" label="Nom de l'entreprise" v={contact.companyName} />
          <In name="address" label="Adresse" v={contact.address} />
          <In name="phone" label="Téléphone" v={contact.phone} />
          <In name="whatsapp" label="Numéro WhatsApp (format international, ex. 2250700000000)" v={contact.whatsapp} />
          <In name="email" label="Email" v={contact.email} />
          <In name="hours" label="Horaires" v={contact.hours} />
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="confirmed" defaultChecked={contact.confirmed} className="h-5 w-5 accent-brand-green" />Coordonnées confirmées (retire la mention « en cours de confirmation »)</label>
        </fieldset>

        <fieldset className="card grid gap-4 p-5 sm:grid-cols-3">
          <legend className="px-1 text-lg font-bold">Règles tarifaires</legend>
          <p className="text-sm text-muted sm:col-span-3">Une modification ne change jamais une réservation déjà enregistrée : les montants sont figés à la demande.</p>
          <In name="blockHours" label="Durée d'une tranche (heures)" v={rules.blockHours} type="number" />
          <In name="graceMinutes" label="Tolérance de retard non facturée (minutes)" v={rules.graceMinutes} type="number" />
          <In name="bufferHours" label="Marge entre deux locations (heures)" v={rules.bufferHours} type="number" />
          <In name="taxPercent" label="Taxes (%)" v={rules.taxPercent} type="number" />
          <In name="serviceFee" label="Frais de dossier (FCFA)" v={rules.serviceFee} type="number" />
          <div className="sm:col-span-3">
            <label className="label" htmlFor="discounts">Remises par durée (une par ligne, « jours minimum : % »)</label>
            <textarea id="discounts" name="discounts" rows={3} defaultValue={rules.discounts.map((d) => `${d.minDays}: ${d.percent}`).join("\n")} placeholder={"7: 5\n30: 15"} className="input" />
          </div>
        </fieldset>

        <fieldset className="card grid gap-4 p-5 sm:grid-cols-2">
          <legend className="px-1 text-lg font-bold">Zones de service</legend>
          <div><label className="label" htmlFor="pl">Lieux de retrait (un par ligne)</label><textarea id="pl" name="pickupLocations" rows={6} defaultValue={ops.pickupLocations.join("\n")} className="input" /></div>
          <div><label className="label" htmlFor="ct">Villes desservies (une par ligne)</label><textarea id="ct" name="cities" rows={6} defaultValue={ops.cities.join("\n")} className="input" /></div>
        </fieldset>

        <fieldset className="card grid gap-4 p-5 sm:grid-cols-2">
          <legend className="px-1 text-lg font-bold">Vidéo d&apos;accueil (facultatif)</legend>
          <p className="text-sm text-muted sm:col-span-2">Sans vidéo, l&apos;accueil affiche l&apos;animation légère du décor d&apos;Abidjan. La vidéo est coupée en cas de connexion lente ou de réduction des mouvements.</p>
          <In name="heroVideoUrl" label="URL de la vidéo (MP4/WebM, sans son)" v={v.url} />
          <In name="heroVideoPoster" label="URL de l'image de couverture" v={v.poster} />
        </fieldset>
        <button className="btn-primary">Enregistrer les paramètres</button>
      </ActionForm>
    </div>
  );
}

function In({ name, label, v, type = "text" }: { name: string; label: string; v?: string | number; type?: string }) {
  return (
    <div>
      <label className="label" htmlFor={`p-${name}`}>{label}</label>
      <input id={`p-${name}`} name={name} type={type} defaultValue={v ?? ""} className="input" />
    </div>
  );
}
