// Données initiales : comptes, paramètres, contenus et véhicules de DÉMONSTRATION.
// Les véhicules de démonstration sont marqués isDemo et signalés comme tels sur le site.
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const HOME_SECTIONS = [
  ["search", "Où allons-nous ?", ""],
  ["featured", "À chacun sa route.", ""],
  ["paths", "Votre voiture peut aller *plus loin.*", ""],
  ["steps", "Votre trajet, en trois étapes.", ""],
  ["sale", "La prochaine est peut-être ici.", ""],
  ["advantages", "Pourquoi choisir AUTO225 ?", ""],
  ["reviews", "Avis de nos clients", ""],
  ["faq", "Avant de prendre la route.", ""],
  ["contact", "Une question ? Parlons-en.", ""],
] as const;

const SERVICE_TYPES = [
  ["transfert-aeroport", "Transfert aéroport", "Accueil à l'aéroport Félix Houphouët-Boigny et transfert vers votre destination."],
  ["chauffeur-prive", "Chauffeur privé", "Un chauffeur et un véhicule à votre disposition à l'heure ou à la journée."],
  ["mariage-evenement", "Mariage et événement", "Véhicules de cérémonie et convois pour vos événements."],
  ["deplacement-professionnel", "Déplacement professionnel", "Véhicules et chauffeurs pour vos rendez-vous, séminaires et visites."],
  ["location-longue-duree", "Location longue durée", "Location au mois pour particuliers et professionnels."],
  ["flotte-entreprise", "Flotte d'entreprise", "Mise à disposition de plusieurs véhicules pour votre entreprise."],
] as const;

const FAQ = [
  ["Ma réservation est-elle confirmée dès l'envoi de la demande ?", "Non. Vous recevez une référence et un accusé de réception. Notre équipe vérifie la disponibilité et les conditions, puis vous confirme la réservation avec les modalités de paiement et de remise du véhicule."],
  ["Puis-je louer avec chauffeur ?", "Oui, lorsque le véhicule le propose. L'option est indiquée sur chaque fiche et le prix du chauffeur est ajouté au récapitulatif."],
  ["Qu'est-ce que la caution ?", "La caution est un montant de garantie distinct du prix de la location. Son montant est indiqué sur chaque fiche véhicule. Elle est restituée selon les conditions de location."],
  ["Comment mettre ma voiture en location ?", "Créez un compte, remplissez le formulaire propriétaire et déposez vos justificatifs dans votre espace privé. Notre équipe vérifie votre dossier avant toute mise en ligne."],
  ["Comment sont calculés les prix ?", "Les prix sont indiqués en FCFA par tranche de 24 heures. Le total est calculé automatiquement selon vos dates et options, et reste figé une fois la réservation confirmée."],
] as const;

const ADVANTAGES = [
  ["Véhicules vérifiés", "Chaque véhicule est contrôlé par notre équipe avant sa publication."],
  ["Prix clairs en FCFA", "Récapitulatif détaillé : durée, options, frais et caution séparée."],
  ["Avec ou sans chauffeur", "Selon le véhicule, choisissez de conduire ou d'être conduit."],
  ["Une équipe à Abidjan", "Un interlocuteur joignable par téléphone, email ou WhatsApp."],
] as const;

type DemoVehicle = Partial<Prisma.VehicleCreateInput> & Pick<Prisma.VehicleCreateInput, "slug" | "brand" | "model" | "year" | "category" | "transmission" | "fuel" | "seats">;

const COMMON_RENTAL = {
  rentalConditions: "Âge minimum 23 ans et permis de plus de 2 ans pour la conduite sans chauffeur. Carburant à la charge du client. Conditions définitives à valider par AUTO225.",
  cancellationPolicy: "Annulation gratuite jusqu'à 48 h avant le départ. Politique définitive à valider par AUTO225.",
};

const VEHICLES: (DemoVehicle & { photo?: string })[] = [
  { slug: "toyota-camry-demo", brand: "Toyota", model: "Camry", year: 2022, category: "BERLINE", transmission: "AUTOMATIC", fuel: "PETROL", seats: 5, features: ["Climatisation", "Bluetooth", "Caméra de recul"], dailyPrice: 35000, deposit: 200000, includedKmPerDay: 200, withDriver: true, withoutDriver: true, driverDailyPrice: 15000, deliveryAvailable: true, deliveryFee: 10000, featured: true, zone: "Abidjan", photo: "/demo/camry.webp", ...COMMON_RENTAL },
  { slug: "kia-sportage-demo", brand: "KIA", model: "Sportage", year: 2023, category: "SUV", transmission: "AUTOMATIC", fuel: "PETROL", seats: 5, features: ["Climatisation", "GPS", "Bluetooth", "Caméra de recul"], dailyPrice: 60000, deposit: 300000, includedKmPerDay: 200, withDriver: true, withoutDriver: true, driverDailyPrice: 15000, deliveryAvailable: true, deliveryFee: 10000, featured: true, zone: "Abidjan", photo: "/demo/sportage.webp", ...COMMON_RENTAL },
  { slug: "mercedes-classe-e-demo", brand: "Mercedes-Benz", model: "Classe E", year: 2022, category: "PRESTIGE", transmission: "AUTOMATIC", fuel: "PETROL", seats: 5, features: ["Climatisation", "Cuir", "GPS", "Bluetooth"], dailyPrice: 250000, deposit: 1000000, includedKmPerDay: 150, withDriver: true, withoutDriver: false, driverDailyPrice: 20000, deliveryAvailable: true, deliveryFee: 15000, featured: true, zone: "Abidjan", photo: "/demo/classe-e.webp", ...COMMON_RENTAL },
  { slug: "hyundai-accent-demo", brand: "Hyundai", model: "Accent", year: 2021, category: "CITADINE", transmission: "MANUAL", fuel: "PETROL", seats: 5, features: ["Climatisation"], dailyPrice: 25000, deposit: 150000, includedKmPerDay: 200, withDriver: false, withoutDriver: true, zone: "Abidjan", ...COMMON_RENTAL },
  { slug: "toyota-prado-demo", brand: "Toyota", model: "Land Cruiser Prado", year: 2021, category: "QUATRE_QUATRE", transmission: "AUTOMATIC", fuel: "DIESEL", seats: 7, features: ["Climatisation", "4 roues motrices", "GPS"], dailyPrice: 90000, deposit: 500000, includedKmPerDay: 250, withDriver: true, withoutDriver: true, driverDailyPrice: 15000, zone: "Abidjan", minDays: 2, ...COMMON_RENTAL },
  { slug: "toyota-hiace-demo", brand: "Toyota", model: "Hiace", year: 2020, category: "MINIBUS", transmission: "MANUAL", fuel: "DIESEL", seats: 15, features: ["Climatisation"], dailyPrice: 75000, deposit: 400000, withDriver: true, withoutDriver: false, driverDailyPrice: 0, zone: "Abidjan", ...COMMON_RENTAL },
  // Vente
  { slug: "toyota-rav4-2019-demo", brand: "Toyota", model: "RAV4", year: 2019, category: "SUV", transmission: "AUTOMATIC", fuel: "PETROL", seats: 5, features: ["Climatisation", "Caméra de recul"], forRent: false, forSale: true, salePrice: 14500000, mileage: 68000, saleCondition: "Bon état général, carnet d'entretien disponible.", visitConditions: "Visite sur rendez-vous à l'agence de Treichville.", zone: "Abidjan" },
  { slug: "toyota-corolla-2017-demo", brand: "Toyota", model: "Corolla", year: 2017, category: "BERLINE", transmission: "AUTOMATIC", fuel: "PETROL", seats: 5, features: ["Climatisation"], forRent: false, forSale: true, salePrice: 7800000, mileage: 112000, saleCondition: "Entretien régulier, quelques rayures sur le pare-chocs arrière.", visitConditions: "Visite sur rendez-vous.", zone: "Abidjan" },
  { slug: "toyota-hilux-2020-demo", brand: "Toyota", model: "Hilux", year: 2020, category: "PICKUP", transmission: "MANUAL", fuel: "DIESEL", seats: 5, features: ["4 roues motrices", "Climatisation"], forRent: false, forSale: true, salePrice: 18000000, mileage: 85000, saleStatus: "RESERVED", saleCondition: "Très bon état.", visitConditions: "Visite sur rendez-vous.", zone: "Abidjan" },
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@auto225.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangezMoi!2026";
  await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: "Administrateur AUTO225", role: "ADMIN", passwordHash: await bcrypt.hash(adminPassword, 12), emailVerifiedAt: new Date() },
  });

  for (const [i, [key, title, subtitle]] of HOME_SECTIONS.entries()) {
    await db.homeSection.upsert({ where: { key }, update: {}, create: { key, title, subtitle, position: i } });
  }
  for (const [i, [slug, name, description]] of SERVICE_TYPES.entries()) {
    await db.serviceType.upsert({ where: { slug }, update: {}, create: { slug, name, description, position: i } });
  }
  if ((await db.faq.count()) === 0) {
    await db.faq.createMany({ data: FAQ.map(([question, answer], position) => ({ question, answer, position })) });
  }
  if ((await db.advantage.count()) === 0) {
    await db.advantage.createMany({ data: ADVANTAGES.map(([title, description], position) => ({ title, description, position })) });
  }

  for (const { photo, ...v } of VEHICLES) {
    const exists = await db.vehicle.findUnique({ where: { slug: v.slug } });
    if (exists) continue;
    await db.vehicle.create({
      data: {
        ...v,
        status: "PUBLISHED",
        isDemo: true,
        description: v.description ?? `${v.brand} ${v.model} ${v.year} — fiche de démonstration à remplacer par les véhicules réels.`,
        photos: photo ? { create: [{ url: photo, alt: `${v.brand} ${v.model}`, position: 0 }] } : undefined,
      },
    });
  }
  console.log("Seed terminé. Administrateur :", adminEmail);
}

main().finally(() => db.$disconnect());
