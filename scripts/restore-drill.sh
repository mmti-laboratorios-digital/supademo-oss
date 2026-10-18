#!/usr/bin/env bash
# =============================================================================
#  scripts/restore-drill.sh — DR drill: provisiona VPS temp, restaura backup,
#  valida com SELECT count(*), notifica Slack.
#
#  Pré-requisitos:
#    - hcloud CLI autenticado (`hcloud context create demobr-prod`)
#    - SSHPASS ou chave SSH carregada no agent
#    - Slack webhook URL em $SLACK_WEBHOOK_URL
#    - Último backup acessível no R2 (variáveis R2_* no .env)
#
#  Uso:
#    SLACK_WEBHOOK_URL=https://hooks.slack.com/... ./scripts/restore-drill.sh
# =============================================================================
set -euo pipefail

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'
log() { printf "${BLUE}[dr-drill]${NC} %s\n" "$*"; }
ok()  { printf "${GREEN}[ok]${NC} %s\n" "$*"; }
warn(){ printf "${YELLOW}[warn]${NC} %s\n" "$*"; }
err() { printf "${RED}[err]${NC} %s\n" "$*" >&2; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Carrega .env
if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a; . "$ROOT_DIR/.env"; set +a
fi
: "${SLACK_WEBHOOK_URL:?SLACK_WEBHOOK_URL não definida}"
: "${R2_BUCKET_PRIVATE:=demo-private}"
: "${R2_ACCOUNT_ID:?R2_ACCOUNT_ID não definido}"

require() { command -v "$1" >/dev/null 2>&1 || { err "$1 não encontrado"; exit 1; }; }
require hcloud
require ssh
require scp

# -----------------------------------------------------------------------------
# 1. Pede confirmação (drill é destrutivo no VPS temp)
# -----------------------------------------------------------------------------
printf "${YELLOW}Isso vai provisionar um VPS temporário em Hetzner (~0.01€/h) e restaurar o último backup do R2. Continuar? [s/N]${NC}: "
read -r ANS
ANS="$(printf '%s' "$ANS" | tr '[:upper:]' '[:lower:]')"
[[ "$ANS" == "s" || "$ANS" == "sim" || "$ANS" == "y" ]] || { log "Abortado."; exit 0; }

# -----------------------------------------------------------------------------
# 2. Provisiona VPS temp
# -----------------------------------------------------------------------------
DRILL_NAME="demobr-drill-$(date +%Y%m%d%H%M%S)"
SERVER_TYPE="${DRILL_SERVER_TYPE:-cx22}"
IMAGE="${DRILL_IMAGE:-ubuntu-24.04}"
LOCATION="${DRILL_LOCATION:-fsn1}"
SSH_KEY="${DRILL_SSH_KEY:-$(hcloud ssh-key list -o json | jq -r '.[0].name')}"

[[ -n "$SSH_KEY" ]] || { err "Nenhuma SSH key encontrada no hcloud."; exit 1; }

log "Criando VPS '$DRILL_NAME' ($SERVER_TYPE @ $LOCATION)…"
hcloud server create \
  --name "$DRILL_NAME" \
  --type "$SERVER_TYPE" \
  --image "$IMAGE" \
  --location "$LOCATION" \
  --ssh-key "$SSH_KEY" \
  --start-after-create \
  --output json > /tmp/_drill.json

SERVER_IP="$(jq -r '.server.public_net.ipv4.ip' /tmp/_drill.json)"
log "VPS criado: $SERVER_IP"

trap 'cleanup' EXIT INT TERM
cleanup() {
  log "Limpando VPS $DRILL_NAME…"
  hcloud server delete "$DRILL_NAME" >/dev/null 2>&1 || true
}

# Espera SSH responder
log "Esperando SSH responder…"
for i in {1..30}; do
  if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 root@"$SERVER_IP" true 2>/dev/null; then
    ok "SSH disponível."
    break
  fi
  sleep 2
  if [[ $i -eq 30 ]]; then err "SSH timeout."; exit 1; fi
done

# -----------------------------------------------------------------------------
# 3. Instala Postgres + pgBackRest no VPS temp
# -----------------------------------------------------------------------------
log "Instalando Postgres 16 + pgBackRest no VPS temp…"
ssh -o StrictHostKeyChecking=no root@"$SERVER_IP" bash -s <<'REMOTE'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl gnupg lsb-release ca-certificates
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
  | gpg --dearmor -o /usr/share/keyrings/pgdg.gpg
echo "deb [signed-by=/usr/share/keyrings/pgdg.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
  > /etc/apt/sources.list.d/pgdg.list
apt-get update -qq
apt-get install -y -qq postgresql-16 pgbackrest
systemctl stop postgresql || true
REMOTE

# -----------------------------------------------------------------------------
# 4. Baixa último backup do R2
# -----------------------------------------------------------------------------
LATEST_KEY="$(mktemp -u /tmp/_latest.XXXXXX)"
log "Listando backups no R2 (snapshots/)…"

# Pode usar wrangler ou aws cli
LOCAL_FILE="/tmp/db-latest.sql.gz"
if command -v wrangler >/dev/null 2>&1; then
  # wrangler r2 object get <KEY> --file <OUT>
  KEY="$(wrangler r2 object list "$R2_BUCKET_PRIVATE" --prefix=snapshots/ --json 2>/dev/null \
    | jq -r 'sort_by(.LastModified) | reverse | .[0].Key' || true)"
  [[ -n "$KEY" ]] || { err "Nenhum backup encontrado em snapshots/."; exit 1; }
  log "Baixando $KEY…"
  wrangler r2 object get "$R2_BUCKET_PRIVATE/$KEY" --file "$LOCAL_FILE" --remote
elif command -v aws >/dev/null 2>&1; then
  KEY="$(AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
    aws s3api list-objects-v2 --bucket "$R2_BUCKET_PRIVATE" --prefix snapshots/ \
    --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
    --query 'reverse(sort_by(Contents,&LastModified))[0].Key' --output text)"
  log "Baixando $KEY…"
  AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  aws s3 cp "s3://${R2_BUCKET_PRIVATE}/$KEY" "$LOCAL_FILE" \
    --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
else
  err "Precisa de wrangler ou aws CLI."; exit 1
fi

log "Copiando backup para o VPS…"
scp -o StrictHostKeyChecking=no "$LOCAL_FILE" "root@$SERVER_IP:/tmp/db-latest.sql.gz"

# -----------------------------------------------------------------------------
# 5. Restaura
# -----------------------------------------------------------------------------
log "Restaurando no VPS temp…"
ssh -o StrictHostKeyChecking=no root@"$SERVER_IP" bash -s <<'REMOTE'
set -euo pipefail
sudo -u postgres createdb demobr_drill || true
gunzip -c /tmp/db-latest.sql.gz | sudo -u postgres psql -d demobr_drill -v ON_ERROR_STOP=1
echo "---"
sudo -u postgres psql -d demobr_drill -c "SELECT count(*) AS workspaces FROM workspaces;"
sudo -u postgres psql -d demobr_drill -c "SELECT count(*) AS demos      FROM demos;"
sudo -u postgres psql -d demobr_drill -c "SELECT count(*) AS steps      FROM steps;"
sudo -u postgres psql -d demobr_drill -c "SELECT count(*) AS leads      FROM leads;"
REMOTE

# -----------------------------------------------------------------------------
# 6. Notifica Slack
# -----------------------------------------------------------------------------
SUMMARY="✅ DR drill concluído em $(date -Iseconds)
• VPS temp: $DRILL_NAME ($SERVER_IP) — destruído no fim
• Backup: $KEY
• VPS já foi limpa."

log "Notificando Slack…"
curl -fsS -X POST -H 'Content-Type: application/json' \
  --data "$(jq -nc --arg text "$SUMMARY" '{text: $text}')" \
  "$SLACK_WEBHOOK_URL" >/dev/null || warn "Falha ao notificar Slack (não-bloqueante)."
ok "Notificado."

printf "\n${GREEN}DR drill concluído com sucesso.${NC}\n"