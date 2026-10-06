import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions générales" };

export default function TermsPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="heading-section">Conditions générales</h1>
      <p className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm">
        Document à rédiger et à faire valider par les responsables compétents avant la mise en ligne (location, caution, annulation, assurance, sinistres, propriétaires, vente).
      </p>
      <div className="mt-6 space-y-4 text-sm text-muted">
        <h2 className="text-lg font-bold text-ink">1. Demandes de réservation</h2>
        <p>Une demande envoyée sur le site n&apos;est pas une réservation confirmée. La réservation est confirmée par AUTO225 après vérification de la disponibilité et des conditions.</p>
        <h2 className="text-lg font-bold text-ink">2. Prix</h2>
        <p>Les prix sont indiqués en FCFA. Le montant figurant sur la confirmation est celui qui s&apos;applique, même si le tarif du véhicule change ensuite. La caution est distincte du prix de la location.</p>
        <h2 className="text-lg font-bold text-ink">3. Annulation</h2>
        <p>Conditions d&apos;annulation à définir.</p>
      </div>
    </div>
  );
}
