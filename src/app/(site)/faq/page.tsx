import type { Metadata } from "next";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Questions fréquentes", description: "Réponses aux questions fréquentes sur la location, la caution, les propriétaires et la vente chez AUTO225." };

export default async function FaqPage() {
  const faqs = await db.faq.findMany({ where: { published: true }, orderBy: { position: "asc" } });
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="heading-section">Questions fréquentes</h1>
      <div className="mt-6 divide-y divide-line rounded-2xl border border-line">
        {faqs.map((f) => (
          <details key={f.id} className="group p-5">
            <summary className="cursor-pointer list-none font-semibold [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-4">{f.question}<span className="text-xl text-orange-cta transition-transform group-open:rotate-45" aria-hidden="true">+</span></span>
            </summary>
            <p className="mt-3 whitespace-pre-line text-sm text-muted">{f.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
