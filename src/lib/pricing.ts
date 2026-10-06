// Calcul tarifaire — exécuté uniquement côté serveur (ACC-04).
// Règle par défaut (modifiable dans les paramètres) : tranches de 24 h,
// tolérance de retard sans facturation, durée minimale par véhicule, remises par durée.

export type PricingRules = {
  blockHours: number;
  graceMinutes: number;
  discounts: { minDays: number; percent: number }[];
  taxPercent: number;
  serviceFee: number;
  bufferHours: number;
};

export const DEFAULT_PRICING_RULES: PricingRules = {
  blockHours: 24,
  graceMinutes: 60,
  discounts: [],
  taxPercent: 0,
  serviceFee: 0,
  bufferHours: 2,
};

export type PricedVehicle = {
  dailyPrice: number | null;
  deposit: number | null;
  driverDailyPrice: number | null;
  deliveryFee: number | null;
  minDays: number;
  withDriver: boolean;
  withoutDriver: boolean;
  deliveryAvailable: boolean;
};

export type Quote = {
  billedDays: number;
  unitPrice: number;
  rentalGross: number;
  discountPercent: number;
  rentalTotal: number;
  driverTotal: number;
  deliveryTotal: number;
  feesTotal: number;
  taxTotal: number;
  total: number;
  deposit: number;
};

export class PricingError extends Error {}

export function billedDays(startAt: Date, endAt: Date, rules: PricingRules): number {
  const minutes = (endAt.getTime() - startAt.getTime()) / 60000;
  if (minutes <= 0) throw new PricingError("La date de retour doit être après la date de départ.");
  const blockMinutes = rules.blockHours * 60;
  const full = Math.floor(minutes / blockMinutes);
  const remainder = minutes - full * blockMinutes;
  // Un dépassement au-delà de la tolérance compte pour une tranche entière.
  const days = remainder > rules.graceMinutes || full === 0 ? full + 1 : full;
  return Math.max(days, 1);
}

export function quote(
  vehicle: PricedVehicle,
  input: { startAt: Date; endAt: Date; withDriver: boolean; delivery: boolean },
  rules: PricingRules = DEFAULT_PRICING_RULES,
): Quote {
  if (vehicle.dailyPrice == null) throw new PricingError("Ce véhicule est proposé sur devis.");
  if (input.withDriver && !vehicle.withDriver) throw new PricingError("Ce véhicule n'est pas proposé avec chauffeur.");
  if (!input.withDriver && !vehicle.withoutDriver) throw new PricingError("Ce véhicule est proposé uniquement avec chauffeur.");
  if (input.delivery && !vehicle.deliveryAvailable) throw new PricingError("La livraison n'est pas disponible pour ce véhicule.");

  const days = billedDays(input.startAt, input.endAt, rules);
  if (days < vehicle.minDays) {
    throw new PricingError(`Durée minimale de location : ${vehicle.minDays} jour${vehicle.minDays > 1 ? "s" : ""}.`);
  }

  const rentalGross = days * vehicle.dailyPrice;
  const discountPercent = rules.discounts
    .filter((d) => days >= d.minDays)
    .reduce((best, d) => Math.max(best, d.percent), 0);
  const rentalTotal = Math.round(rentalGross * (1 - discountPercent / 100));
  const driverTotal = input.withDriver ? days * (vehicle.driverDailyPrice ?? 0) : 0;
  const deliveryTotal = input.delivery ? (vehicle.deliveryFee ?? 0) : 0;
  const feesTotal = rules.serviceFee;
  const taxable = rentalTotal + driverTotal + deliveryTotal + feesTotal;
  const taxTotal = Math.round((taxable * rules.taxPercent) / 100);

  return {
    billedDays: days,
    unitPrice: vehicle.dailyPrice,
    rentalGross,
    discountPercent,
    rentalTotal,
    driverTotal,
    deliveryTotal,
    feesTotal,
    taxTotal,
    total: taxable + taxTotal,
    // La caution est séparée et ne fait pas partie du total de location.
    deposit: vehicle.deposit ?? 0,
  };
}
