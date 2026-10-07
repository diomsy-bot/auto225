# Mettre AUTO225.COM en ligne sur un serveur Windows

Variante du [guide Linux](DEPLOIEMENT.md) pour un VPS sous Windows Server (par exemple chez Contabo).
Docker n'est pas utilisé : le site tourne directement avec Node.js, la base dans PostgreSQL pour Windows,
et Caddy sert le site en HTTPS avec un certificat Let's Encrypt automatique.

Prévoir au moins 4 Go de RAM (Windows, PostgreSQL et la construction du site).

## 1. Se connecter au serveur

Sur votre PC : touche Windows, tapez `mstsc` (Connexion Bureau à distance).

- Ordinateur : l'IP du VPS (par exemple `169.58.23.167`)
- Utilisateur : `Administrator`
- Mot de passe : celui de l'email de livraison Contabo, ou réinitialisé dans my.contabo.com > Your services > Manage > Password reset.

Toutes les étapes suivantes se font **dans la fenêtre du serveur**.

## 2. Installer les logiciels

Dans le navigateur du serveur, télécharger et installer avec les options par défaut :

1. **Node.js 22 LTS** : https://nodejs.org (Windows Installer .msi, 64 bits).
2. **Git** : https://git-scm.com/download/win
3. **PostgreSQL 16** : https://www.postgresql.org/download/windows/ (installateur EDB).
   Noter le mot de passe choisi pour l'utilisateur `postgres`. Stack Builder n'est pas nécessaire.
4. **Caddy** : https://caddyserver.com/download (plateforme Windows amd64).
   Créer le dossier `C:\caddy` et y placer le fichier téléchargé renommé en `caddy.exe`.

Puis ouvrir **PowerShell en administrateur** (clic droit sur le menu Démarrer > Terminal (admin) ou Windows PowerShell (admin)).

## 3. Créer la base de données

Une commande à la fois :

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
```

Saisir le mot de passe `postgres`, puis, à l'invite `postgres=#` (remplacer MOT_DE_PASSE par un mot de passe
long composé seulement de lettres et de chiffres) :

```sql
CREATE USER auto225 WITH PASSWORD 'MOT_DE_PASSE';
CREATE DATABASE auto225 OWNER auto225;
\q
```

## 4. Récupérer le code et le configurer

```powershell
cd C:\
git clone https://github.com/diomsy-bot/auto225.git
cd C:\auto225
copy .env.example .env
notepad .env
```

Le dépôt est privé : `git clone` demande l'identifiant GitHub et un jeton d'accès
(GitHub > Settings > Developer settings > Personal access tokens) à la place du mot de passe.

Dans le Bloc-notes, renseigner puis enregistrer :

```
DATABASE_URL="postgresql://auto225:MOT_DE_PASSE@localhost:5432/auto225"
APP_URL="https://auto225.com"
STORAGE_DIR="C:/auto225-data/storage"
SEED_ADMIN_PASSWORD="un mot de passe administrateur fort"
```

ainsi que `SMTP_URL`, `MAIL_FROM` et `TEAM_EMAIL` pour l'envoi des emails.
Utiliser des `/` (et non des `\`) dans `STORAGE_DIR`.

## 5. Construire le site et préparer la base

Une commande à la fois, dans `C:\auto225` :

```powershell
npm ci
npm run build
npx prisma migrate deploy
npx prisma db seed
```

`npx prisma db seed` crée le compte administrateur ; ne le lancer qu'une seule fois.

## 6. Démarrage automatique et HTTPS

```powershell
powershell -ExecutionPolicy Bypass -File C:\auto225\deploy\windows\install-service.ps1
```

Ce script installe le démarrage automatique du site (tâche planifiée « AUTO225 », relancée en cas d'arrêt),
le service Windows Caddy et ouvre les ports 80 et 443 du pare-feu.
Vérification sur le serveur : http://localhost:3000 doit afficher le site.

## 7. Faire pointer le domaine (LWS)

Dans l'espace client LWS > auto225.com > Zone DNS :

- enregistrement **A** `@` → IP du VPS ; enregistrement **A** `www` → IP du VPS ;
- supprimer les AAAA sur `@` et `www` et toute redirection ou page de parking ;
- ne pas toucher aux MX et TXT.

Quand le DNS pointe vers le serveur (`nslookup auto225.com`), Caddy obtient le certificat tout seul
et https://auto225.com s'ouvre avec le cadenas.

## 8. Après la mise en ligne

- Se connecter à l'administration, changer le mot de passe et activer la double authentification.
- Sauvegarde chaque nuit à 3 h :

  ```powershell
  $a = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\auto225\deploy\windows\backup.ps1"
  Register-ScheduledTask -TaskName "AUTO225 sauvegarde" -Action $a -Trigger (New-ScheduledTaskTrigger -Daily -At 3am) -User "SYSTEM" -RunLevel Highest
  ```

  Les sauvegardes vont dans `C:\auto225-data\backups` : les copier régulièrement hors du serveur.
- Mettre à jour le site : `powershell -ExecutionPolicy Bypass -File C:\auto225\deploy\windows\update.ps1`

## En cas de problème

- **Le site ne répond pas sur localhost:3000** : journaux dans `C:\auto225-data\logs`.
- **Pas de HTTPS** : le DNS ne pointe pas encore vers le serveur, ou le service Caddy est arrêté
  (`Get-Service caddy`). Pour voir l'erreur, arrêter le service (`Stop-Service caddy`) puis lancer
  `C:\caddy\caddy.exe run --config C:\auto225\deploy\windows\Caddyfile` dans PowerShell.
