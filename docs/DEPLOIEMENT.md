# Mettre AUTO225.COM en ligne sur auto225.com

Le site a besoin d'un serveur avec disque persistant (photos, justificatifs, base PostgreSQL).
La configuration fournie lance trois conteneurs Docker sur un même serveur :
l'application Next.js, PostgreSQL et Caddy, qui sert le site en HTTPS et obtient
automatiquement le certificat Let's Encrypt.

## 1. Louer un serveur (VPS)

- 2 vCPU, 4 Go de RAM, 40 Go de disque minimum, Ubuntu 24.04.
- Fournisseurs possibles : Hetzner, OVHcloud, DigitalOcean, Contabo (de 5 à 15 € par mois).
- Ajouter votre clé SSH à la création, puis noter l'**adresse IPv4** publique du serveur
  (et l'IPv6 si elle est fournie).
- Ouvrir les ports **22, 80 et 443** dans le pare-feu du fournisseur s'il en a un.

## 2. Faire pointer le domaine vers le serveur

Dans l'espace client du registrar où auto225.com est enregistré, section « Zone DNS » :

| Type | Nom (hôte) | Valeur | TTL |
|------|-----------|--------|-----|
| A | `@` (auto225.com) | IPv4 du serveur | 3600 |
| A | `www` | IPv4 du serveur | 3600 |
| AAAA | `@` et `www` | IPv6 du serveur (facultatif) | 3600 |

- Supprimer les anciens enregistrements A, AAAA ou CNAME sur `@` et `www`
  (page de parking du registrar, redirection web…).
- Ne pas toucher aux enregistrements **MX** et **TXT** si des emails @auto225.com existent déjà.
- La propagation prend en général de quelques minutes à quelques heures.
  Vérifier avec `nslookup auto225.com` : la réponse doit être l'IP du serveur.

## 3. Installer Docker sur le serveur

```bash
ssh root@IP_DU_SERVEUR
curl -fsSL https://get.docker.com | sh
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
```

## 4. Récupérer le code et configurer

Le dépôt est privé : créer une clé de déploiement (« Deploy key », lecture seule)
dans GitHub > Settings > Deploy keys, ou utiliser un jeton d'accès personnel.

```bash
git clone git@github.com:diomsy-bot/auto225.git /opt/auto225
cd /opt/auto225
cp .env.example .env
nano .env
```

Valeurs à renseigner dans `.env` :

- `APP_URL="https://auto225.com"`
- `DOMAIN="auto225.com"` et `ACME_EMAIL` (email qui reçoit les alertes de certificat)
- `POSTGRES_PASSWORD` : un mot de passe long (`openssl rand -hex 24`)
- `SEED_ADMIN_PASSWORD` : un mot de passe administrateur fort
- `SMTP_URL`, `MAIL_FROM`, `TEAM_EMAIL` pour l'envoi des emails

## 5. Démarrer

```bash
docker compose up -d --build
docker compose exec app npm run db:seed   # une seule fois : crée le compte admin
docker compose logs -f caddy              # voir l'obtention du certificat
```

Quand le DNS pointe bien vers le serveur, Caddy obtient le certificat en quelques secondes.
Le site répond alors sur https://auto225.com, et https://www.auto225.com redirige vers lui.

## 6. Après la mise en ligne

- Se connecter à l'administration, changer le mot de passe et activer la double authentification.
- Planifier la sauvegarde quotidienne :
  `0 3 * * * cd /opt/auto225 && ./scripts/backup.sh /var/backups/auto225` (crontab), puis copier les sauvegardes hors du serveur.
- Mettre à jour le site : `git pull && docker compose up -d --build`.

## En cas de problème

- **Pas de certificat / erreur HTTPS** : `docker compose logs caddy`. Le plus souvent le DNS ne pointe
  pas encore vers le serveur, ou les ports 80/443 sont fermés.
- **Erreur 502** : l'application ne démarre pas, voir `docker compose logs app`.
