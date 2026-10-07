# AUTO225.COM

Site de location et de vente de véhicules à Abidjan : location avec ou sans chauffeur, mise en location de véhicules de propriétaires, service particulier sur devis, achat et vente, espace client, espace propriétaire et administration.

Réalisé d'après le cahier des charges v1.0 du 6 octobre 2026.

## Technologies

| Élément | Choix |
|---|---|
| Application | Next.js 15 (App Router, Server Actions), React 19, TypeScript |
| Style | Tailwind CSS 4, police Poppins, charte vert `#017234` / orange `#FA4705` tirée du logo |
| Base de données | PostgreSQL 16 + Prisma 6 |
| Fichiers | Dossier `STORAGE_DIR` avec deux espaces séparés : `public/` (photos des annonces) et `private/` (justificatifs, servis après contrôle d'accès) |
| Emails | SMTP via Nodemailer (sans SMTP, les emails sont affichés dans la console) |
| Tests | Vitest (règles de prix, double authentification, doubles réservations) et Playwright (parcours de recette) |

## Démarrer en local

Prérequis : Node.js 22 et PostgreSQL 16.

```bash
cp .env.example .env        # puis ajuster DATABASE_URL
npm install
npx prisma migrate deploy   # crée les tables et la contrainte anti double réservation
npm run db:seed             # compte administrateur, contenus et véhicules de démonstration
npm run dev                 # http://localhost:3000
```

Compte administrateur créé par le seed : `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (voir `.env`). À la première connexion, l'administrateur doit activer la double authentification avec une application (Google Authenticator, Microsoft Authenticator…). **Changez ce mot de passe avant toute mise en ligne.**

## Tests

```bash
npm run lint && npm run typecheck
npm test              # tests unitaires et tests sur la base (DATABASE_URL requis)
npm run build
npm run test:e2e      # parcours complets dans un navigateur (serveur lancé automatiquement)
```

## Correspondance avec les critères de recette

| Critère | Où c'est assuré | Test |
|---|---|---|
| ACC-01 trois options visibles dès l'accueil, vente dans le menu | `src/app/(site)/page.tsx`, `components/site/header.tsx` | e2e ACC-01 |
| ACC-02 animation avec pause et version statique | `components/home/hero-scene.tsx`, `logo-intro.tsx`, `globals.css` | e2e ACC-02 |
| ACC-03 recherche par dates, aucune double réservation | `lib/availability.ts`, `lib/booking-ops.ts`, contrainte `Booking_no_overlap` dans la migration | `tests/integration/booking-concurrency.test.ts`, e2e ACC-03 |
| ACC-04 total reproductible, caution séparée, tarif figé | `lib/pricing.ts` (calcul serveur), montants enregistrés dans `Booking` | `tests/unit/pricing.test.ts` |
| ACC-05 référence, attente, suivi de l'état | `actions/booking.ts`, `/location/demande/[reference]`, `/suivi`, `/compte` | e2e ACC-05 |
| ACC-06 dossier non validé invisible, justificatifs privés | `actions/owner.ts`, `/api/documents/[id]`, `lib/storage.ts` | e2e ACC-06 |
| ACC-07 service particulier avec devis, annonce vendue retirée | `actions/service.ts`, `/admin/services/[id]`, filtre `saleStatus` | e2e ACC-07 |
| ACC-08 modifications persistantes, droits par compte | `/admin/contenus`, `lib/auth.ts` (`requireStaff`, contrôles par propriétaire) | e2e ACC-08 |
| ACC-09 formulaires mobile et ordinateur, pas de doublon | validation `zod` côté serveur, bouton désactivé pendant l'envoi, limitation des envois | e2e ACC-09 |
| ACC-10 sauvegarde et restauration | `scripts/backup.sh`, `scripts/restore.sh` | restauration à tester sur le serveur avant lancement |

## Mise en production

Les photos et justificatifs sont stockés sur disque : il faut un hébergement avec **disque persistant** (VPS, ou plateforme avec volume). `docker-compose.yml` fournit l'application, PostgreSQL, le proxy HTTPS Caddy (certificat Let's Encrypt automatique, configuré dans `deploy/Caddyfile`) et des volumes persistants. Le guide pas à pas (serveur, DNS du domaine, HTTPS) est dans [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md) ; pour un serveur Windows sans Docker, voir [docs/DEPLOIEMENT-WINDOWS.md](docs/DEPLOIEMENT-WINDOWS.md) et `deploy/windows/`.

```bash
cp .env.example .env    # renseigner APP_URL, DOMAIN, POSTGRES_PASSWORD, SMTP_URL, TEAM_EMAIL, mots de passe
docker compose up -d --build
docker compose exec app npm run db:seed
```

Sauvegarde quotidienne : planifier `scripts/backup.sh` (cron) et copier les fichiers vers un stockage indépendant. Restaurer une sauvegarde sur un environnement de test avant le lancement.

## Organisation du code

```
prisma/                  schéma, migrations, données initiales
src/app/(site)/          pages publiques, compte client et propriétaire
src/app/admin/           administration (gestionnaires et administrateurs)
src/actions/             actions serveur (formulaires)
src/lib/                 prix, disponibilités, authentification, stockage, emails
src/components/          composants d'interface
tests/                   tests unitaires, base de données et parcours
```

## Points restant à valider par AUTO225 (cahier des charges §19)

Valeurs par défaut en place, toutes modifiables dans **Administration → Paramètres** ou dans les fiches véhicules :

- Modèle opéré par AUTO225 : les propriétaires déposent un dossier, l'équipe valide avant publication.
- Confirmation manuelle des réservations, paiement suivi manuellement (pas de paiement en ligne).
- Tranches de 24 h, tolérance de retard de 60 min, marge de 2 h entre deux locations, pas de remise ni de taxe.
- Lieux de retrait à Abidjan (liste modifiable).
- Prestations du service particulier : transfert aéroport, chauffeur privé, mariage, déplacement professionnel, longue durée, flotte d'entreprise (toutes « Sur devis »).
- Les 9 véhicules sont des **exemples de démonstration** (photos issues de l'affiche) et sont signalés comme tels sur le site. À remplacer par le stock réel.
- Les chiffres de l'affiche (clients, note, garanties, assurances, revenus garantis) ne sont pas publiés.
- Coordonnées de l'affiche affichées avec la mention « en cours de confirmation ».
- Conditions générales et politique de confidentialité : textes à faire valider avant lancement.
