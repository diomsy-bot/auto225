import Link from "next/link";
import { importListingWithAi } from "@/actions/admin/import";
import { ActionForm } from "@/components/admin/action-form";
import { aiImportConfigured } from "@/lib/listing-ai";

export const metadata = { title: "Saisie assistée" };

export default function ImportListing() {
  const enabled = aiImportConfigured();
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/vehicules" className="text-sm text-muted hover:underline">← Véhicules</Link>
      <h1 className="text-2xl font-extrabold">Saisie assistée par IA</h1>
      <p className="text-sm text-muted">
        Collez l&apos;annonce qu&apos;un vendeur ou un loueur vous a envoyée (WhatsApp, email…) et ajoutez ses photos.
        L&apos;IA pré-remplit la fiche, qui est créée en <strong>brouillon</strong> : relisez-la, corrigez-la, puis publiez-la.
        Les numéros de téléphone, emails et liens sont retirés de la description.
      </p>
      <p className="rounded-xl bg-orange-50 px-4 py-3 text-sm">
        N&apos;utilisez que des annonces dont le vendeur a accepté la publication sur AUTO225. Ne copiez pas les annonces
        d&apos;autres sites (CoinAfrique, Jumia…) : leurs conditions l&apos;interdisent et les photos appartiennent aux vendeurs.
      </p>
      {!enabled && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          La saisie assistée n&apos;est pas encore activée : ajoutez la clé <code>ANTHROPIC_API_KEY</code> dans la configuration du serveur.
        </p>
      )}
      <ActionForm action={importListingWithAi} className="card space-y-4 p-5">
        <div>
          <label htmlFor="i-text" className="label">Texte de l&apos;annonce</label>
          <textarea id="i-text" name="text" rows={10} required minLength={20} maxLength={8000} className="input" placeholder="Ex. : Toyota RAV4 2008, essence, automatique, 136 000 km, peinture d'origine, toit ouvrant. Prix 6 000 000 FCFA. Visible à Abobo." />
        </div>
        <div>
          <label htmlFor="i-photos" className="label">Photos (12 maximum, 25 Mo au total, JPEG, PNG ou WebP)</label>
          <input id="i-photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="input" />
        </div>
        <div>
          <label htmlFor="i-source" className="label">Vendeur et provenance (privé, gardé dans le journal)</label>
          <input id="i-source" name="source" maxLength={300} className="input" placeholder="Ex. : M. Koné, reçu par WhatsApp le 7 octobre" />
        </div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="consent" required className="mt-0.5 h-5 w-5 accent-brand-green" />
          Le vendeur ou le loueur m&apos;a transmis cette annonce et accepte qu&apos;elle soit publiée sur AUTO225.
        </label>
        <button className="btn-primary" disabled={!enabled}>Créer la fiche en brouillon</button>
        <p className="text-xs text-muted">L&apos;analyse prend quelques secondes.</p>
      </ActionForm>
    </div>
  );
}
