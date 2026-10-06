import { TIME_ZONE } from "@/lib/format";

type Period = { startAt: Date; endAt: Date; kind: "booking" | "pending" | "unavailable" };

const dayKey = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: TIME_ZONE }).format(d);

/** Calendrier du véhicule sur 2 mois : réservations confirmées, demandes en attente, indisponibilités. */
export function VehicleCalendar({ periods, months = 2 }: { periods: Period[]; months?: number }) {
  const today = new Date();
  const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const grids = Array.from({ length: months }, (_, i) => new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + i, 1)));
  const status = new Map<string, Period["kind"]>();
  const rank = { unavailable: 3, booking: 2, pending: 1 };
  for (const p of periods) {
    for (let t = new Date(p.startAt); t < p.endAt; t = new Date(t.getTime() + 86400_000)) {
      const k = dayKey(t);
      const cur = status.get(k);
      if (!cur || rank[p.kind] > rank[cur]) status.set(k, p.kind);
    }
    const lastKey = dayKey(new Date(p.endAt.getTime() - 1));
    if (!status.has(lastKey)) status.set(lastKey, p.kind);
  }
  const color = { booking: "bg-brand-green text-white", pending: "bg-orange-50 text-orange-cta ring-1 ring-orange-200", unavailable: "bg-gray-300 text-ink" };

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2">
        {grids.map((m) => {
          const daysInMonth = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 0)).getUTCDate();
          const offset = (m.getUTCDay() + 6) % 7;
          return (
            <div key={m.toISOString()}>
              <p className="mb-2 text-sm font-semibold capitalize">{new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(m)}</p>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <span key={i} className="text-muted">{d}</span>)}
                {Array.from({ length: offset }, (_, i) => <span key={`o${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const d = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), i + 1, 12));
                  const s = status.get(dayKey(d));
                  return <span key={i} className={`rounded py-1 ${s ? color[s] : "bg-surface"}`}>{i + 1}</span>;
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        <span><span className="mr-1 inline-block h-3 w-3 rounded bg-brand-green align-middle" />Réservé</span>
        <span><span className="mr-1 inline-block h-3 w-3 rounded bg-orange-50 ring-1 ring-orange-200 align-middle" />Demande en attente (ne bloque pas)</span>
        <span><span className="mr-1 inline-block h-3 w-3 rounded bg-gray-300 align-middle" />Indisponible</span>
      </p>
    </div>
  );
}
