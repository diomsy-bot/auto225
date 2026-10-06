import { fromZonedTime } from "date-fns-tz";

// Toutes les dates sont affichées et saisies dans le fuseau d'Abidjan.
export const TIME_ZONE = "Africa/Abidjan";

export function formatFcfa(amount: number | null | undefined): string {
  if (amount == null) return "Sur devis";
  return `${new Intl.NumberFormat("fr-FR").format(amount).replace(/ | /g, " ")} FCFA`;
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: TIME_ZONE, dateStyle: "medium" }).format(date);
}

/** Convertit une saisie "2026-10-10T09:00" (heure d'Abidjan) en Date UTC. */
export function parseLocalDateTime(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return null;
  const date = fromZonedTime(value, TIME_ZONE);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Inverse de parseLocalDateTime, pour pré-remplir un champ datetime-local. */
export function toLocalInputValue(date: Date): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return parts.replace(" ", "T");
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
