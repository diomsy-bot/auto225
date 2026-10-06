import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="heading-section">Politique de confidentialité</h1>
      <p className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm">
        Texte à valider par les responsables compétents au regard des formalités applicables en Côte d&apos;Ivoire avant la mise en ligne.
      </p>
      <div className="mt-6 space-y-4 text-sm text-muted">
        <h2 className="text-lg font-bold text-ink">Données collectées</h2>
        <p>Nous collectons uniquement les informations nécessaires au traitement de vos demandes : identité, coordonnées, détails de la demande et, pour les propriétaires et vendeurs, les justificatifs exigés.</p>
        <h2 className="text-lg font-bold text-ink">Justificatifs</h2>
        <p>Les documents déposés sont stockés dans un espace privé, accessibles uniquement à vous et à l&apos;équipe habilitée, et ne sont jamais publiés ni indexés par les moteurs de recherche.</p>
        <h2 className="text-lg font-bold text-ink">Communications commerciales</h2>
        <p>Les offres commerciales ne sont envoyées qu&apos;avec votre accord, distinct des messages liés à vos demandes.</p>
        <h2 className="text-lg font-bold text-ink">Vos droits</h2>
        <p>Vous pouvez demander l&apos;accès à vos données ou leur suppression depuis votre compte ou en nous contactant. Durées de conservation par catégorie à préciser.</p>
      </div>
    </div>
  );
}
