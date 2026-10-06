#!/usr/bin/env bash
# Restauration à partir d'une sauvegarde (à tester avant la mise en production).
# Usage : scripts/restore.sh backups/db-YYYYMMDD-HHMMSS.dump backups/storage-YYYYMMDD-HHMMSS.tgz
set -euo pipefail
DB_DUMP="$1"
STORAGE_TGZ="$2"
docker compose exec -T db pg_restore -U auto225 -d auto225 --clean --if-exists < "$DB_DUMP"
docker compose run --rm -T --no-deps -v "$(realpath "$(dirname "$STORAGE_TGZ")")":/backup app sh -c "rm -rf /data/storage/* && tar xzf /backup/$(basename "$STORAGE_TGZ") -C /data"
echo "Restauration terminée."
