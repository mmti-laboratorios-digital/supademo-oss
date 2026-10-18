#!/usr/bin/env bash
# =============================================================================
#  scripts/db-snapshot.sh — Backup lógico sob demanda (pg_dump → .sql.gz)
# -----------------------------------------------------------------------------
#  Diferença vs pgBackRest (que é PITR + cron):
#    - pgBackRest roda a cada X horas, mantém PITR de N dias, escreve em R2
#    - Este script é um dump pontual: ./backups/db-YYYY-MM-DD-HHMM.sql.gz
#
#  Uso:
#    ./scripts/db-snapshot.sh                       # usa DATABASE_URL do .env
#    DATABASE_URL=postgres://… ./scripts/db-snapshot.sh
#    ./scripts/db-snapshot.sh --upload-r2           # também envia para R2
# =============================================================================
set -euo pipefail

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; NC='\033[0m'
log()  { printf "${BLUE}[snapshot]${NC} %s\n" "$*"; }
ok()   { printf "${GREEN}[ok]${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}[warn]${NC} %s\n" "$*"; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/backups"
mkdir -p "$BACKUP_DIR"

# Parse DATABASE_URL
if [[ -f "$ROOT_DIR/.env" ]]; then
  # shellcheck disable=SC1091
  set -a; . "$ROOT_DIR/.env"; set +a
fi
: "${DATABASE_URL:?DATABASE_URL não definida. Defina no .env.}"

UPLOAD_R2="false"
for arg in "$@"; do
  case "$arg" in
    --upload-r2) UPLOAD_R2="true" ;;
    --help|-h)
      sed -n '2,14p' "$0"; exit 0 ;;
  esac
done

# Parse: postgres://user:pass@host:port/db?...
SCHEME="$(printf '%s' "$DATABASE_URL" | sed -E 's|^([a-z]+)://.*|\1|')"
if [[ "$SCHEME" != "postgres" && "$SCHEME" != "postgresql" ]]; then
  echo "DATABASE_URL precisa ser postgres://…"; exit 1
fi
REST="$(printf '%s' "$DATABASE_URL" | sed -E 's|^[a-z]+://||')"
USERPART="$(printf '%s' "$REST" | awk -F'@' '{print $1}')"
HOSTPART="$(printf '%s' "$REST" | awk -F'@' '{print $2}')"
DB_USER="$(printf '%s' "$USERPART" | awk -F':' '{print $1}')"
DB_PASS="$(printf '%s' "$USERPART" | awk -F':' '{print $2}')"
HOSTPORT="$(printf '%s' "$HOSTPART" | awk -F'/' '{print $1}')"
DB_NAME="$(printf '%s' "$HOSTPART" | awk -F'/' '{print $2}' | sed 's/\?.*//')"
DB_HOST="$(printf '%s' "$HOSTPORT" | awk -F':' '{print $1}')"
# Porta padrão no host: 55432 (convenção do projeto — ver infra/docker-compose.yml).
# O parser abaixo sobrescreve este default se DATABASE_URL trouxer porta explícita.
DB_PORT="$(printf '%s' "$HOSTPORT" | awk -F':' '{print $2}')"
DB_PORT="${DB_PORT:-55432}"

# Se for docker (demobr-postgres), usa docker exec
USE_DOCKER=false
if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q '^demobr-postgres$'; then
  USE_DOCKER=true
fi

TS="$(date +%Y-%m-%d-%H%M)"
OUT_FILE="$BACKUP_DIR/db-$TS.sql.gz"
TMP_FILE="$(mktemp -t demobr-dump.XXXXXX.sql)"

log "Destino: $OUT_FILE"
log "Origem : ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME} (docker=$USE_DOCKER)"

run_pg_dump() {
  if [[ "$USE_DOCKER" == "true" ]]; then
    docker exec \
      -e PGPASSWORD="$DB_PASS" \
      demobr-postgres \
      pg_dump --schema=public --no-owner --no-privileges \
        -U "$DB_USER" -d "$DB_NAME"
  else
    PGPASSWORD="$DB_PASS" pg_dump --schema=public --no-owner --no-privileges \
      -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
  fi
}

if run_pg_dump > "$TMP_FILE" 2>/tmp/_pgdump.err; then
  gzip -9 -c "$TMP_FILE" > "$OUT_FILE"
  rm -f "$TMP_FILE"
  SIZE="$(du -h "$OUT_FILE" | awk '{print $1}')"
  ok "Backup criado: $OUT_FILE ($SIZE)"
else
  echo "pg_dump falhou:"; cat /tmp/_pgdump.err
  rm -f "$TMP_FILE"; exit 1
fi

# Mantém últimos 30 backups locais
LOG="$BACKUP_DIR/.snapshots.log"
printf "%s\t%s\n" "$(date -Iseconds)" "$OUT_FILE" >> "$LOG"
TAIL="$(tail -n 30 "$LOG" | awk '{print $2}')"
ALL="$(ls -1t "$BACKUP_DIR"/db-*.sql.gz 2>/dev/null || true)"
for f in $ALL; do
  if ! grep -qx "$f" <<<"$TAIL"; then
    rm -f "$f"; warn "Rotacionado $f (mantém últimos 30)"
  fi
done

# Opcionalmente envia para R2
if [[ "$UPLOAD_R2" == "true" ]]; then
  if command -v wrangler >/dev/null 2>&1; then
    R2_KEY="snapshots/$(basename "$OUT_FILE")"
    log "Enviando para R2 bucket ${R2_BUCKET_PRIVATE:-demo-private}/$R2_KEY…"
    wrangler r2 object put "${R2_BUCKET_PRIVATE:-demo-private}/$R2_KEY" --file "$OUT_FILE" --remote
    ok "Enviado."
  elif command -v aws >/dev/null 2>&1; then
    R2_KEY="snapshots/$(basename "$OUT_FILE")"
    AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
    AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
    aws s3 cp "$OUT_FILE" "s3://${R2_BUCKET_PRIVATE:-demo-private}/$R2_KEY" \
      --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    ok "Enviado via aws-cli."
  else
    warn "wrangler/aws não encontrados, pulando upload."
  fi
fi

printf "\n${GREEN}Snapshot concluído.${NC}\n"