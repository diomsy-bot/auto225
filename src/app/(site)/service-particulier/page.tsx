import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ServiceForm } from "@/components/service/service-form";
import { PageIntro } from "@/components/site/page-intro";
import { ArrowUpRight, Route } from "lucide-react";

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
    <>
    <PageIntro eyebrow="Service particulier" title="Chaque trajet a son histoire.">
      Un besoin spécifique ? Décrivez votre projet et recevez une proposition adaptée.
    </PageIntro>
    <div className="container-page py-10">
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {types.map((t, i) => (
          <li key={t.id}>
            <a href={`?type=${t.slug}#demande`} className="group relative block h-full rounded-[10px] border border-[#e4eadf] bg-surface p-7 text-ink transition hover:border-brand-green">
              <span className="absolute top-6 right-6 text-xs text-[#9daa9c]" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <Route className="text-brand-green" aria-hidden="true" />
              <h2 className="mt-5 text-[19px] font-bold">{t.name}</h2>
              <p className="mt-2 text-[13px] leading-[1.7] text-[#6a756e]">{t.description}</p>
              <span className="mt-6 flex items-center gap-3 text-xs font-semibold text-brand-green">{t.priceLabel} · Demander un devis <ArrowUpRight size={16} aria-hidden="true" /></span>
            </a>
          </li>
        ))}
      </ul>

      <section id="demande" className="card mt-10 scroll-mt-28 p-5 sm:p-8">
        <p className="eyebrow">AUTO225 · Votre demande</p>
        <h2 className="mt-3 text-[27px] font-bold">Un trajet sur mesure.</h2>
        <div className="mt-6">
          <ServiceForm
            types={types.map((t) => ({ value: t.id, label: t.name }))}
            defaults={{ serviceTypeId: preselected, name: user?.name, email: user?.email, phone: user?.phone ?? undefined }}
          />
        </div>
      </section>
    </div>
    </>
  );
}
