import { CalendarDays, MapPin, Search } from "lucide-react";

const fieldClass =
  "block min-h-12 w-full min-w-0 rounded-lg border border-[#d8e4d2] bg-[#fafbf8] px-3 py-2 text-[15px] text-ink focus:border-brand-green focus:bg-white focus:outline-2 focus:outline-brand-green/25";

/**
 * Fiche « Demande de location » de l'accueil (ordinateur) : formule, lieu et dates,
 * envoyée au catalogue /location qui affiche les véhicules disponibles sur la période.
 */
export function HeroBooking({ locations }: { locations: string[] }) {
  return (
    <form
      action="/location"
      method="get"
      role="search"
      aria-labelledby="h-hero-booking"
      className="grid gap-4 rounded-2xl bg-white p-6 text-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,.5)]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="h-hero-booking" className="home-h2 text-[21px]">Demande de location</h2>
        <span className="text-xs text-muted">Prix par jour en FCFA</span>
      </div>

      <fieldset className="grid grid-cols-3 gap-1 rounded-xl bg-[#eef3ed] p-1">
        <legend className="sr-only">Formule</legend>
        {[
          ["", "Peu importe"],
          ["sans", "Sans chauffeur"],
          ["avec", "Avec chauffeur"],
        ].map(([value, label]) => (
          <label key={value || "all"} className="relative">
            <input type="radio" name="chauffeur" value={value} defaultChecked={value === ""} className="peer sr-only" />
            <span className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-2 text-center text-[13px] font-semibold text-[#4e5f55] transition-colors peer-checked:bg-white peer-checked:text-brand-green peer-checked:shadow-[0_1px_3px_rgba(0,0,0,.15)] peer-focus-visible:outline-3 peer-focus-visible:outline-brand-orange">
              {label}
            </span>
          </label>
        ))}
      </fieldset>

      <div className="grid gap-1.5">
        <label htmlFor="hb-lieu" className="flex items-center gap-1.5 text-[13px] font-semibold">
          <MapPin size={15} className="text-brand-green" aria-hidden="true" /> Lieu de retrait
        </label>
        <select id="hb-lieu" name="lieu" defaultValue="" className={fieldClass}>
          <option value="">Abidjan · tous les lieux</option>
          {locations.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid min-w-0 gap-1.5">
          <label htmlFor="hb-depart" className="flex items-center gap-1.5 text-[13px] font-semibold">
            <CalendarDays size={15} className="text-brand-green" aria-hidden="true" /> Départ
          </label>
          <input id="hb-depart" type="datetime-local" name="depart" className={fieldClass} />
        </div>
        <div className="grid min-w-0 gap-1.5">
          <label htmlFor="hb-retour" className="flex items-center gap-1.5 text-[13px] font-semibold">
            <CalendarDays size={15} className="text-brand-green" aria-hidden="true" /> Retour
          </label>
          <input id="hb-retour" type="datetime-local" name="retour" className={fieldClass} />
        </div>
      </div>

      <button type="submit" className="btn-green min-h-12 w-full rounded-full text-[15px]">
        <Search size={18} aria-hidden="true" /> Voir les véhicules disponibles
      </button>
      <p className="text-xs leading-relaxed text-muted">
        Votre demande est confirmée par notre équipe après vérification de la disponibilité. La caution est indiquée sur chaque fiche.
      </p>
    </form>
  );
}
