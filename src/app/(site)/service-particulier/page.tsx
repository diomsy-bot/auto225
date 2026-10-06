import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ServiceForm } from "@/components/service/service-form";

export const metadata: Metadata = {
  title: "Service particulier",
  description: "Transfert aéroport, chauffeur privé, mariage, déplacement professionnel, location longue durée : demandez un devis à AUTO225.",
};

export default async function ServicePage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const [types, user] = await Promise.all([
    db.serviceType.findMany({ where: { active: true }, orderBy: { position: "asc" } }),
    getCurrentUser(),
  ]);
  const preselected = types.find((t) => t.slug === type)?.id;
  return (
    <div className="container-page py-10">
      <p className="eyebrow">Sur mesure</p>
      <h1 className="heading-section mt-1">Service particulier</h1>
      <p className="mt-2 max-w-2xl text-muted">Un besoin spécifique ? Décrivez votre demande : notre équipe vous répond avec un devis personnalisé.</p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {types.map((t) => (
          <li key={t.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-bold">{t.name}</h2>
              <span className="badge shrink-0 bg-orange-50 text-orange-cta">{t.priceLabel}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{t.description}</p>
            <a href={`?type=${t.slug}#demande`} className="mt-3 inline-block text-sm font-semibold text-brand-green hover:underline">Demander un devis</a>
          </li>
        ))}
      </ul>

      <section id="demande" className="card mt-10 scroll-mt-24 p-5 sm:p-8">
        <h2 className="text-xl font-bold">Votre demande</h2>
        <div className="mt-6">
          <ServiceForm
            types={types.map((t) => ({ value: t.id, label: t.name }))}
            defaults={{ serviceTypeId: preselected, name: user?.name, email: user?.email, phone: user?.phone ?? undefined }}
          />
        </div>
      </section>
    </div>
  );
}
