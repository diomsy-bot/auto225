import { moderateReview, saveAdvantage, saveFaq, saveHomeSections, saveServiceType } from "@/actions/admin/content";
import { ActionForm } from "@/components/admin/action-form";
import { db } from "@/lib/db";

export const metadata = { title: "Contenus" };

const SECTION_NAMES: Record<string, string> = {
  search: "Recherche rapide", featured: "Véhicules à la une", paths: "Les trois parcours", sale: "Achat & vente", steps: "Étapes de réservation",
  advantages: "Avantages", reviews: "Avis clients", faq: "Questions fréquentes", contact: "Contact",
};

export default async function ContentAdmin() {
  const [sections, faqs, advantages, services, reviews] = await Promise.all([
    db.homeSection.findMany({ orderBy: { position: "asc" } }),
    db.faq.findMany({ orderBy: { position: "asc" } }),
    db.advantage.findMany({ orderBy: { position: "asc" } }),
    db.serviceType.findMany({ orderBy: { position: "asc" } }),
    db.review.findMany({ where: { status: "PENDING" }, include: { vehicle: true }, orderBy: { createdAt: "asc" } }),
  ]);
  return (
    <div className="max-w-5xl space-y-10">
      <h1 className="text-2xl font-extrabold">Contenus du site</h1>

      <section>
        <h2 className="text-lg font-bold">Accueil : sections sous le premier écran</h2>
        <p className="text-sm text-muted">Modifiez l&apos;ordre (numéro), les titres et l&apos;affichage de chaque section.</p>
        <ActionForm action={saveHomeSections} className="card mt-3 space-y-3 p-5">
          {sections.map((s) => (
            <div key={s.key} className="grid gap-2 border-b border-line pb-3 sm:grid-cols-[70px_160px_1fr_1fr_auto] sm:items-center">
              <input type="hidden" name="key" value={s.key} />
              <input name={`position:${s.key}`} type="number" defaultValue={s.position} aria-label="Ordre" className="input" />
              <span className="text-sm font-semibold">{SECTION_NAMES[s.key] ?? s.key}</span>
              <input name={`title:${s.key}`} defaultValue={s.title} aria-label="Titre" className="input" />
              <input name={`subtitle:${s.key}`} defaultValue={s.subtitle} aria-label="Sous-titre" placeholder="Sous-titre" className="input" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={`enabled:${s.key}`} defaultChecked={s.enabled} className="h-5 w-5 accent-brand-green" />Affichée</label>
            </div>
          ))}
          <button className="btn-green">Enregistrer l&apos;accueil</button>
        </ActionForm>
      </section>

      <section id="avis">
        <h2 className="text-lg font-bold">Avis à modérer</h2>
        {reviews.length === 0 ? <p className="mt-2 text-sm text-muted">Aucun avis en attente.</p> : (
          <ul className="mt-3 space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="card p-4 text-sm">
                <p><strong>{r.author}</strong> · {r.rating}/5 · {r.vehicle.brand} {r.vehicle.model}</p>
                <p className="mt-1">{r.comment}</p>
                <form action={moderateReview} className="mt-2 flex gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <button name="status" value="APPROVED" className="btn-green btn-sm">Publier</button>
                  <button name="status" value="REJECTED" className="btn-outline btn-sm">Rejeter</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold">Prestations « Service particulier »</h2>
        <p className="text-sm text-muted">Seules les prestations actives sont publiées.</p>
        <div className="mt-3 space-y-3">
          {[...services, null].map((s) => (
            <form key={s?.id ?? "new"} action={saveServiceType} className="card grid gap-2 p-4 sm:grid-cols-[60px_1fr_2fr_140px_auto_auto] sm:items-center">
              {s && <input type="hidden" name="id" value={s.id} />}
              <input name="position" type="number" defaultValue={s?.position ?? services.length} aria-label="Ordre" className="input" />
              <input name="name" defaultValue={s?.name} placeholder="Nouvelle prestation" aria-label="Nom" className="input" />
              <input name="description" defaultValue={s?.description} placeholder="Description" aria-label="Description" className="input" />
              <input name="priceLabel" defaultValue={s?.priceLabel ?? "Sur devis"} aria-label="Prix affiché" className="input" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={s?.active ?? true} className="h-5 w-5 accent-brand-green" />Active</label>
              <button className="btn-outline btn-sm">{s ? "Enregistrer" : "Ajouter"}</button>
            </form>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">Avantages affichés sur l&apos;accueil</h2>
        <p className="text-sm text-muted">N&apos;affichez que des avantages vérifiés.</p>
        <div className="mt-3 space-y-3">
          {[...advantages, null].map((a) => (
            <form key={a?.id ?? "new"} action={saveAdvantage} className="card grid gap-2 p-4 sm:grid-cols-[60px_1fr_2fr_auto_auto_auto] sm:items-center">
              {a && <input type="hidden" name="id" value={a.id} />}
              <input name="position" type="number" defaultValue={a?.position ?? advantages.length} aria-label="Ordre" className="input" />
              <input name="title" defaultValue={a?.title} placeholder="Nouvel avantage" aria-label="Titre" className="input" />
              <input name="description" defaultValue={a?.description} placeholder="Description" aria-label="Description" className="input" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={a?.published ?? true} className="h-5 w-5 accent-brand-green" />Publié</label>
              <button className="btn-outline btn-sm">{a ? "Enregistrer" : "Ajouter"}</button>
              {a && <button name="op" value="delete" className="text-xs text-red-700 underline">Supprimer</button>}
            </form>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">Questions fréquentes</h2>
        <div className="mt-3 space-y-3">
          {[...faqs, null].map((f) => (
            <form key={f?.id ?? "new"} action={saveFaq} className="card space-y-2 p-4">
              {f && <input type="hidden" name="id" value={f.id} />}
              <div className="grid gap-2 sm:grid-cols-[60px_1fr]">
                <input name="position" type="number" defaultValue={f?.position ?? faqs.length} aria-label="Ordre" className="input" />
                <input name="question" defaultValue={f?.question} placeholder="Nouvelle question" aria-label="Question" className="input" />
              </div>
              <textarea name="answer" defaultValue={f?.answer} rows={2} placeholder="Réponse" aria-label="Réponse" className="input" />
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={f?.published ?? true} className="h-5 w-5 accent-brand-green" />Publiée</label>
                <button className="btn-outline btn-sm">{f ? "Enregistrer" : "Ajouter"}</button>
                {f && <button name="op" value="delete" className="text-xs text-red-700 underline">Supprimer</button>}
              </div>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
