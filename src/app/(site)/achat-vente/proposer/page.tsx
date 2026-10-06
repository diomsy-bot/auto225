import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { SaleProposalForm } from "@/components/sale/proposal-form";

export const metadata: Metadata = { title: "Proposer un véhicule à vendre", robots: { index: false } };

export default async function ProposePage() {
  await requireUser("/achat-vente/proposer");
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="heading-section">Proposer un véhicule à vendre</h1>
      <p className="mt-2 text-muted">Votre proposition est étudiée par notre équipe avant toute publication. Vos documents restent privés.</p>
      <div className="card mt-6 p-5 sm:p-6">
        <SaleProposalForm />
      </div>
    </div>
  );
}
