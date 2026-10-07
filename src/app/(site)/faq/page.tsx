import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PageIntro } from "@/components/site/page-intro";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Questions fréquentes", description: "Réponses aux questions fréquentes sur la location, la caution, les propriétaires et la vente chez AUTO225." };

export default async function FaqPage() {
  const faqs = await db.faq.findMany({ where: { published: true }, orderBy: { position: "asc" } });
  return (
    <>
    <PageIntro eyebrow="On vous répond" title="Questions fréquentes." />
    <div className="container-page max-w-4xl py-10">
      {faqs.map((f) => (
        <details key={f.id} className="group border-b border-[#e1e7dc] py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            {f.question}
            <Plus size={17} className="shrink-0 text-brand-green transition-transform group-open:rotate-45" aria-hidden="true" />
          </summary>
          <p className="mt-3 text-[13px] leading-[1.75] whitespace-pre-line text-[#6a756e]">{f.answer}</p>
        </details>
      ))}
    </div>
    </>
  );
}
