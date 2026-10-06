#!/usr/bin/env bash
# Sauvegarde quotidienne : base de données + fichiers (photos et justificatifs).
# À planifier (cron) et à copier vers un stockage indépendant du serveur.
# Exemple cron : 0 3 * * * /opt/auto225/scripts/backup.sh /var/backups/auto225
set -euo pipefail
DEST="${1:-./backups}"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
mkdir -p "$DEST"
docker compose exec -T db pg_dump -U auto225 -Fc auto225 > "$DEST/db-$STAMP.dump"
docker compose run --rm -T --no-deps -v "$(realpath "$DEST")":/backup app tar czf "/backup/storage-$STAMP.tgz" -C /data storage
# Conserve 30 jours de sauvegardes locales.
find "$DEST" -type f -mtime +30 -delete
echo "Sauvegarde terminée : $DEST ($STAMP)"
