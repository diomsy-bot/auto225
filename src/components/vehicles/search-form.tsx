import { CATEGORY_LABELS, enumOptions } from "@/lib/labels";

export type SearchValues = {
  lieu?: string;
  depart?: string;
  retour?: string;
  categorie?: string;
  budget?: string;
  chauffeur?: string;
};

export function RentalSearchForm({ values = {}, locations, compact = false }: {
  values?: SearchValues;
  locations: string[];
  compact?: boolean;
}) {
  return (
    <form action="/location" method="get" className={`grid gap-3 ${compact ? "sm:grid-cols-2 lg:grid-cols-6" : "sm:grid-cols-2 lg:grid-cols-3"}`} role="search" aria-label="Rechercher un véhicule">
      <div className={compact ? "lg:col-span-2" : ""}>
        <label htmlFor="s-lieu" className="label">Lieu de retrait</label>
        <select id="s-lieu" name="lieu" defaultValue={values.lieu ?? ""} className="input">
          <option value="">Tous les lieux</option>
          {locations.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="s-depart" className="label">Départ</label>
        <input id="s-depart" type="datetime-local" name="depart" defaultValue={values.depart} className="input" />
      </div>
      <div>
        <label htmlFor="s-retour" className="label">Retour</label>
        <input id="s-retour" type="datetime-local" name="retour" defaultValue={values.retour} className="input" />
      </div>
      <div>
        <label htmlFor="s-categorie" className="label">Catégorie</label>
        <select id="s-categorie" name="categorie" defaultValue={values.categorie ?? ""} className="input">
          <option value="">Toutes</option>
          {enumOptions(CATEGORY_LABELS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="s-budget" className="label">Budget max / jour</label>
        <input id="s-budget" type="number" inputMode="numeric" min={0} step={5000} name="budget" placeholder="FCFA" defaultValue={values.budget} className="input" />
      </div>
      <div className={compact ? "lg:col-span-2" : ""}>
        <label htmlFor="s-chauffeur" className="label">Chauffeur</label>
        <select id="s-chauffeur" name="chauffeur" defaultValue={values.chauffeur ?? ""} className="input">
          <option value="">Indifférent</option>
          <option value="avec">Avec chauffeur</option>
          <option value="sans">Sans chauffeur</option>
        </select>
      </div>
      <div className={`flex items-end ${compact ? "lg:col-span-4" : "sm:col-span-2 lg:col-span-3"}`}>
        <button type="submit" className="btn-primary w-full sm:w-auto">Rechercher un véhicule</button>
      </div>
    </form>
  );
}
