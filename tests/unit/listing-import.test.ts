import { describe, expect, it } from "vitest";
import { stripContactInfo, toVehicleDraft, type ExtractedListing } from "@/lib/listing-import";

const base: ExtractedListing = {
  brand: "Toyota", model: "RAV4", year: 2008, category: "SUV", transmission: "AUTOMATIC", fuel: "PETROL", seats: 5,
  forRent: false, forSale: true, dailyPrice: null, salePrice: 6_000_000, mileage: 136_000, city: "Abidjan", zone: "Abobo",
  features: ["Toit ouvrant"], description: "Très bon état.", saleCondition: "Peinture d'origine", warnings: [],
};

describe("stripContactInfo", () => {
  it("retire téléphones, emails et liens", () => {
    const out = stripContactInfo("Belle voiture. Appelez le +225 05 85 00 00 24 ou ecrire a vendeur@mail.com, voir https://ci.coinafrique.com/annonce/x");
    expect(out).not.toMatch(/\d{2} \d{2} \d{2}/);
    expect(out).not.toContain("@");
    expect(out).not.toContain("coinafrique");
    expect(out).toContain("Belle voiture.");
  });
  it("ne laisse pas de ponctuation orpheline", () => {
    expect(stripContactInfo("Véhicule visible à Abobo, contactez AUTO225.")).toBe("Véhicule visible à Abobo.");
  });
  it("garde les petits nombres utiles", () => {
    expect(stripContactInfo("Moteur 2.4, 5 places, année 2008")).toBe("Moteur 2.4, 5 places, année 2008");
    expect(stripContactInfo("Prix 12 500 000 FCFA")).toBe("Prix 12 500 000 FCFA");
    expect(stripContactInfo("Tel 0585000024 merci")).not.toContain("0585000024");
  });
});

describe("toVehicleDraft", () => {
  it("crée toujours un brouillon", () => {
    const { data, warnings } = toVehicleDraft(base);
    expect(data.status).toBe("DRAFT");
    expect(data.salePrice).toBe(6_000_000);
    expect(data.dailyPrice).toBeNull();
    expect(warnings).toEqual([]);
  });
  it("signale les champs manquants et applique des valeurs par défaut", () => {
    const { data, warnings } = toVehicleDraft({ ...base, year: null, transmission: null, fuel: null, forSale: false, forRent: false, seats: 500 });
    expect(data.year).toBe(new Date().getFullYear());
    expect(data.forRent).toBe(true);
    expect(data.seats).toBe(5);
    expect(warnings.length).toBe(4);
  });
});
