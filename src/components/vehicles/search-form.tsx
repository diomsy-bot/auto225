import { CalendarDays, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { CATEGORY_LABELS, enumOptions } from "@/lib/labels";

export type SearchValues = {
  lieu?: string;
  depart?: string;
  retour?: string;
  categorie?: string;
  budget?: string;
  chauffeur?: string;
};

const fieldClass = "w-full min-w-0 border-0 bg-transparent p-0 text-[13px] text-[#233d2e] focus:outline-none";
const cellClass = "grid min-w-0 flex-1 grid-cols-[16px_1fr] items-center gap-x-2 gap-y-1 text-[11px] font-bold text-[#62746a] lg:border-r lg:border-[#e4e9e3] lg:pr-5 lg:last:border-r-0";

/**
 * Barre de recherche du design : lieu, départ, retour (et filtres complémentaires sur le catalogue).
 * `compact` : version de l'accueil, limitée à l'essentiel.
 */
export function RentalSearchForm({ values = {}, locations, compact = false }: {
  values?: SearchValues;
  locations: string[];
  compact?: boolean;
}) {
  return (
    <form action="/location" method="get" role="search" aria-label="Rechercher un véhicule" className="rounded-[9px] border border-[#e3e8e1] bg-white p-4 shadow-[0_7px_25px_#22392d08] sm:p-5 lg:px-6">
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 lg:flex lg:items-center lg:gap-6">
        <div className={`${cellClass} col-span-2`}>
          <MapPin size={16} className="row-span-2 text-brand-green" aria-hidden="true" />
          <label htmlFor="s-lieu">Lieu de retrait</label>
          <select id="s-lieu" name="lieu" defaultValue={values.lieu ?? ""} className={`${fieldClass} col-start-2`}>
            <option value="">Abidjan · tous les lieux</option>
            {locations.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className={cellClass}>
          <CalendarDays size={16} className="row-span-2 text-brand-green" aria-hidden="true" />
          <label htmlFor="s-depart">Départ</label>
          <input id="s-depart" type="datetime-local" name="depart" defaultValue={values.depart} className={`${fieldClass} col-start-2`} />
        </div>
        <div className={cellClass}>
          <CalendarDays size={16} className="row-span-2 text-brand-green" aria-hidden="true" />
          <label htmlFor="s-retour">Retour</label>
          <input id="s-retour" type="datetime-local" name="retour" defaultValue={values.retour} className={`${fieldClass} col-start-2`} />
        </div>
        {compact && (
          <button type="submit" className="btn-green col-span-2 lg:col-span-1">
            <Search size={18} aria-hidden="true" /> Rechercher
          </button>
        )}
      </div>

      {!compact && (
        <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-[#edf0e9] pt-5">
          <SlidersHorizontal size={17} className="mb-3 hidden text-brand-green sm:block" aria-hidden="true" />
          <div className="min-w-[140px] flex-1">
            <label htmlFor="s-categorie" className="label">Catégorie</label>
            <select id="s-categorie" name="categorie" defaultValue={values.categorie ?? ""} className="input">
              <option value="">Toutes</option>
              {enumOptions(CATEGORY_LABELS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="min-w-[140px] flex-1">
            <label htmlFor="s-budget" className="label">Budget max / jour</label>
            <input id="s-budget" type="number" inputMode="numeric" min={0} step={5000} name="budget" placeholder="FCFA" defaultValue={values.budget} className="input" />
          </div>
          <div className="min-w-[140px] flex-1">
            <label htmlFor="s-chauffeur" className="label">Chauffeur</label>
            <select id="s-chauffeur" name="chauffeur" defaultValue={values.chauffeur ?? ""} className="input">
              <option value="">Indifférent</option>
              <option value="avec">Avec chauffeur</option>
              <option value="sans">Sans chauffeur</option>
            </select>
          </div>
          <button type="submit" className="btn-green w-full sm:w-auto">
            <Search size={18} aria-hidden="true" /> Rechercher un véhicule
          </button>
        </div>
      )}
    </form>
  );
}
