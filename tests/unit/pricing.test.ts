import { describe, expect, it } from "vitest";
import { DEFAULT_PRICING_RULES, PricingError, billedDays, quote, type PricedVehicle } from "@/lib/pricing";

const vehicle: PricedVehicle = {
  dailyPrice: 35000,
  deposit: 200000,
  driverDailyPrice: 15000,
  deliveryFee: 10000,
  minDays: 1,
  withDriver: true,
  withoutDriver: true,
  deliveryAvailable: true,
};
const at = (s: string) => new Date(`${s}Z`);

describe("billedDays (tranches de 24 h)", () => {
  it("compte une tranche pour moins de 24 h", () => {
    expect(billedDays(at("2026-11-01T09:00"), at("2026-11-01T18:00"), DEFAULT_PRICING_RULES)).toBe(1);
  });
  it("compte 2 tranches pour exactement 48 h", () => {
    expect(billedDays(at("2026-11-01T09:00"), at("2026-11-03T09:00"), DEFAULT_PRICING_RULES)).toBe(2);
  });
  it("ne facture pas un retard dans la tolérance", () => {
    expect(billedDays(at("2026-11-01T09:00"), at("2026-11-03T09:45"), DEFAULT_PRICING_RULES)).toBe(2);
  });
  it("facture une tranche de plus au-delà de la tolérance", () => {
    expect(billedDays(at("2026-11-01T09:00"), at("2026-11-03T10:30"), DEFAULT_PRICING_RULES)).toBe(3);
  });
  it("refuse un retour avant le départ", () => {
    expect(() => billedDays(at("2026-11-03T09:00"), at("2026-11-01T09:00"), DEFAULT_PRICING_RULES)).toThrow(PricingError);
  });
});

describe("quote (ACC-04)", () => {
  const period = { startAt: at("2026-11-01T09:00"), endAt: at("2026-11-04T09:00") };

  it("est reproductible et sépare la caution du total", () => {
    const a = quote(vehicle, { ...period, withDriver: false, delivery: false });
    const b = quote(vehicle, { ...period, withDriver: false, delivery: false });
    expect(a).toEqual(b);
    expect(a.billedDays).toBe(3);
    expect(a.total).toBe(105000);
    expect(a.deposit).toBe(200000);
  });

  it("ajoute chauffeur, livraison, frais et taxes", () => {
    const q = quote(vehicle, { ...period, withDriver: true, delivery: true }, { ...DEFAULT_PRICING_RULES, serviceFee: 5000, taxPercent: 10 });
    expect(q.rentalTotal).toBe(105000);
    expect(q.driverTotal).toBe(45000);
    expect(q.deliveryTotal).toBe(10000);
    expect(q.feesTotal).toBe(5000);
    expect(q.taxTotal).toBe(16500);
    expect(q.total).toBe(181500);
  });

  it("applique la meilleure remise de durée", () => {
    const rules = { ...DEFAULT_PRICING_RULES, discounts: [{ minDays: 7, percent: 5 }, { minDays: 30, percent: 15 }] };
    const q = quote(vehicle, { startAt: at("2026-11-01T09:00"), endAt: at("2026-11-08T09:00"), withDriver: false, delivery: false }, rules);
    expect(q.discountPercent).toBe(5);
    expect(q.rentalTotal).toBe(Math.round(7 * 35000 * 0.95));
  });

  it("respecte la durée minimale et les options disponibles", () => {
    expect(() => quote({ ...vehicle, minDays: 2 }, { startAt: at("2026-11-01T09:00"), endAt: at("2026-11-01T20:00"), withDriver: false, delivery: false })).toThrow(/Durée minimale/);
    expect(() => quote({ ...vehicle, withDriver: false }, { ...period, withDriver: true, delivery: false })).toThrow(/chauffeur/);
    expect(() => quote({ ...vehicle, withoutDriver: false }, { ...period, withDriver: false, delivery: false })).toThrow(/uniquement avec chauffeur/);
    expect(() => quote({ ...vehicle, dailyPrice: null }, { ...period, withDriver: false, delivery: false })).toThrow(/devis/);
  });
});
