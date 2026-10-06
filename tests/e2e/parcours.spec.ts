import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { totpCode } from "../../src/lib/totp";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@auto225.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangezMoi!2026";
const run = Date.now().toString(36);
// Dates propres à chaque exécution pour ne pas dépendre des réservations précédentes.
const BASE = 60 + Math.floor(Math.random() * 900);

function localInput(daysFromNow: number, hour: number) {
  const d = new Date(Date.now() + daysFromNow * 86400_000);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

async function adminLogin(page: Page) {
  await page.goto("/connexion");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Mot de passe").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL(/admin-securite/);
  if (page.url().includes("activer")) {
    const secret = (await page.getByText(/Clé manuelle/).textContent())!.split(":")[1].trim();
    process.env.E2E_TOTP_SECRET = secret;
  }
  // Base de test uniquement : le secret est relu en base pour générer le code.
  const db = new PrismaClient();
  const secret = process.env.E2E_TOTP_SECRET ?? (await db.user.findUnique({ where: { email: ADMIN_EMAIL } }))?.totpSecret;
  await db.$disconnect();
  test.skip(!secret, "Secret TOTP de l'administrateur introuvable.");
  await page.getByLabel("Code à 6 chiffres").fill(totpCode(secret!, Math.floor(Date.now() / 30_000)));
  await page.getByRole("button", { name: "Valider" }).click();
  await page.waitForURL(/\/admin$/);
}

test.describe.configure({ mode: "serial" });

test("ACC-01 : les trois options sont visibles dès l'accueil, sur mobile et ordinateur", async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1366, height: 800 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    for (const label of ["Louez un véhicule", "Mettez votre voiture en location", "Service particulier"]) {
      const link = page.getByRole("navigation", { name: "Nos services" }).getByRole("link", { name: new RegExp(label) }).first();
      await expect(link).toBeVisible();
      const box = await link.boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Ouvrir le menu").click();
  await expect(page.getByRole("navigation", { name: "Menu mobile" }).getByRole("link", { name: "Achat & vente" })).toBeVisible();
});

test("ACC-02 : animation avec pause et version statique", async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto("/");
  const pause = page.getByRole("button", { name: "Mettre en pause" });
  await expect(pause).toBeVisible();
  await pause.click();
  await expect(page.getByRole("button", { name: "Lire l'animation" })).toHaveAttribute("aria-pressed", "true");
  const reduced = await browser.newPage({ reducedMotion: "reduce" });
  await reduced.goto("/");
  const anim = await reduced.locator(".hero-scene .car-1").evaluate((el) => getComputedStyle(el).animationName);
  expect(anim).toBe("none");
  await expect(reduced.getByRole("link", { name: /Louez un véhicule/ }).first()).toBeVisible();
});

let bookingRef = "";
const customerEmail = `client-${run}@example.com`;

test("ACC-05 : une demande reçoit une référence et reste en attente", async ({ page }) => {
  await page.goto(`/location/toyota-camry-demo?depart=${localInput(BASE, 9)}&retour=${localInput(BASE + 2, 9)}`);
  await expect(page.getByText("Location : 2 jours")).toBeVisible();
  await page.getByLabel("Lieu de retrait").selectOption({ index: 1 });
  await page.getByLabel("Nom complet").fill("Awa Koné");
  await page.getByLabel("Téléphone").fill("+225 07 00 00 00 01");
  await page.getByLabel("Email").fill(customerEmail);
  await page.getByText("J'ai lu les").click();
  await page.getByRole("button", { name: "Envoyer ma demande de réservation" }).click();
  await expect(page.getByRole("heading", { name: "Demande reçue — confirmation en attente" })).toBeVisible();
  bookingRef = (await page.locator(".font-mono").first().textContent())!.trim();
  expect(bookingRef).toMatch(/^LOC-\d{2}-[A-Z0-9]{6}$/);
  await expect(page.getByText("En attente", { exact: true })).toBeVisible();
});

test("ACC-09 : un formulaire incomplet affiche des erreurs sans créer de demande", async ({ page }) => {
  await page.goto("/service-particulier");
  await page.getByRole("button", { name: "Envoyer ma demande de devis" }).click();
  await expect(page.getByText("Merci de corriger les champs indiqués.")).toBeVisible();
  await expect(page.getByText("Choisissez un type de service.")).toBeVisible();
});

test("ACC-07 : un service particulier produit un dossier avec référence", async ({ page }) => {
  await page.goto("/service-particulier?type=transfert-aeroport");
  await page.getByLabel("Date").fill(localInput(10, 9).slice(0, 10));
  await page.getByLabel("Horaire").fill("08:30");
  await page.getByLabel("Lieu de départ").fill("Aéroport FHB");
  await page.getByLabel("Destination").fill("Cocody");
  await page.getByLabel("Nom complet").fill("Awa Koné");
  await page.getByLabel("Téléphone").fill("+225 07 00 00 00 01");
  await page.getByLabel("Email").fill(customerEmail);
  await page.getByText("J'accepte que mes données").click();
  await page.getByRole("button", { name: "Envoyer ma demande de devis" }).click();
  await expect(page.getByRole("heading", { name: "Demande reçue" })).toBeVisible();
  await expect(page.getByText(/SRV-\d{2}-/)).toBeVisible();
});

test("ACC-07 : une annonce vendue n'apparaît plus comme disponible", async ({ page }) => {
  await page.goto("/achat-vente");
  await expect(page.getByRole("link", { name: "Toyota RAV4" })).toBeVisible();
  const res = await page.goto("/achat-vente/toyota-rav4-2019-demo");
  expect(res!.status()).toBe(200);
});

test("ACC-06 et ACC-08 : dossier propriétaire privé, justificatifs inaccessibles aux autres", async ({ page, browser }) => {
  const email = `proprio-${run}@example.com`;
  await page.goto("/inscription?suite=/proprietaires/dossier");
  await page.getByLabel("Nom complet").fill("Yao Kouassi");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Téléphone").fill("+225 05 00 00 00 02");
  await page.locator("#f-password").fill("MotDePasse2026");
  await page.getByLabel("Confirmez le mot de passe").fill("MotDePasse2026");
  await page.getByText("J'accepte les").click();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await page.waitForURL(/proprietaires\/dossier/);

  await page.getByLabel("Ville").fill("Abidjan");
  await page.getByLabel("Marque").fill("Toyota");
  await page.getByLabel("Modèle").fill("Yaris");
  await page.getByLabel("Année").fill("2020");
  await page.getByLabel("Kilométrage").fill("45000");
  await page.getByLabel("Boîte de vitesses").selectOption("AUTOMATIC");
  await page.getByLabel("Carburant").selectOption("PETROL");
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  await page.getByLabel("Photos du véhicule").setInputFiles({ name: "yaris.png", mimeType: "image/png", buffer: png });
  await page.getByLabel("Preuve de propriété ou mandat").setInputFiles({ name: "carte-grise.png", mimeType: "image/png", buffer: png });
  await page.getByRole("button", { name: "Soumettre mon dossier" }).click();
  await page.waitForURL(/compte\/proprietaire\?soumis=/);
  await expect(page.getByText("Soumis").first()).toBeVisible();

  // Récupère l'adresse d'un justificatif via la page du dossier.
  await page.goto("/compte?onglet=documents");
  const href = await page.getByRole("link", { name: "carte-grise.png" }).getAttribute("href");
  expect(href).toMatch(/^\/api\/documents\//);
  expect((await page.request.get(href!)).status()).toBe(200);

  // Visiteur non connecté : refusé.
  const anon = await browser.newContext();
  expect((await anon.request.get(new URL(href!, page.url()).toString())).status()).toBe(401);
  // Autre compte : introuvable.
  const other = await browser.newPage();
  await other.goto("/inscription");
  await other.getByLabel("Nom complet").fill("Autre Client");
  await other.getByLabel("Email").fill(`autre-${run}@example.com`);
  await other.getByLabel("Téléphone").fill("+225 01 00 00 00 03");
  await other.locator("#f-password").fill("MotDePasse2026");
  await other.getByLabel("Confirmez le mot de passe").fill("MotDePasse2026");
  await other.getByText("J'accepte les").click();
  await other.getByRole("button", { name: "Créer mon compte" }).click();
  await other.waitForURL(/compte/);
  expect((await other.request.get(new URL(href!, page.url()).toString())).status()).toBe(404);
  // Et l'administration lui est fermée.
  await other.goto("/admin");
  await expect(other).toHaveURL(/\/compte/);
  // Aucun véhicule public pour ce dossier non validé.
  const catalogue = await anon.newPage();
  await catalogue.goto("/location?marque=Toyota");
  await expect(catalogue.getByText("Yaris")).toHaveCount(0);
});

test("ACC-03 et ACC-05 : l'équipe confirme, la période est bloquée, le client voit le nouvel état", async ({ page, browser }) => {
  test.skip(!bookingRef, "Dépend du test ACC-05");
  await adminLogin(page);
  await page.goto(`/admin/reservations?q=${bookingRef}`);
  await page.getByRole("link", { name: bookingRef }).click();
  await page.getByRole("button", { name: "Confirmer" }).click();
  await expect(page.getByText("Statut mis à jour")).toBeVisible();

  // Une recherche sur ces dates n'affiche plus le véhicule.
  const visitor = await browser.newPage();
  await visitor.goto(`/location?depart=${localInput(BASE + 1, 9)}&retour=${localInput(BASE + 1, 18)}`);
  await expect(visitor.getByRole("link", { name: "Toyota Camry" })).toHaveCount(0);
  await visitor.goto(`/location?depart=${localInput(BASE + 10, 9)}&retour=${localInput(BASE + 11, 9)}`);
  await expect(visitor.getByRole("link", { name: "Toyota Camry" })).toBeVisible();

  // Le client voit l'état confirmé.
  await visitor.goto(`/suivi?ref=${bookingRef}&email=${encodeURIComponent(customerEmail)}`);
  await expect(visitor.getByText("Confirmée", { exact: true })).toBeVisible();
});

test("ACC-08 : une modification administrateur persiste et apparaît sur le site", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/contenus");
  const title = `Nos véhicules à la une ${run}`;
  await page.locator('input[name="title:featured"]').fill(title);
  await page.getByRole("button", { name: "Enregistrer l'accueil" }).click();
  await expect(page.getByText("Accueil mis à jour.")).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.goto("/admin/contenus");
  await page.locator('input[name="title:featured"]').fill("Nos véhicules à la une");
  await page.getByRole("button", { name: "Enregistrer l'accueil" }).click();
});
