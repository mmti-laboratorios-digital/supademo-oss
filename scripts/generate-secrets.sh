#!/usr/bin/env bash
# =============================================================================
#  scripts/generate-secrets.sh — Gera e (opcionalmente) substitui secrets no .env
# -----------------------------------------------------------------------------
#  Gera 32-byte secrets base64 para:
#    - ENCRYPTION_KEY
#    - SESSION_SECRET
#    - CLERK_SECRET_KEY (placeholder sk_test_<random>)
#    - CLERK_WEBHOOK_SIGNING_SECRET (whsec_<random>)
#    - ASAAS_WEBHOOK_SECRET
#    - DATABASE_URL password
#    - DIRECT_URL password
#    - PII_HASH_SALT
#
#  Uso:
#    ./scripts/generate-secrets.sh                    # imprime no stdout
#    ./scripts/generate-secrets.sh --write            # sobrescreve o .env
#    ./scripts/generate-secrets.sh --in-place         # alias --write
#    ./scripts/generate-secrets.sh --if-placeholder   # só troca se for CHANGEME/xxx
# =============================================================================
set -euo pipefail

WRITE="false"
ONLY_PLACEHOLDER="false"

for arg in "$@"; do
  case "$arg" in
    --write|-w|--in-place)      WRITE="true" ;;
    --if-placeholder|--placeholder) ONLY_PLACEHOLDER="true" ;;
    --help|-h)
      sed -n '2,18p' "$0"; exit 0 ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; NC='\033[0m'
log() { printf "${BLUE}[secrets]${NC} %s\n" "$*"; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

gen32() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 32 | tr -d '\n'
  else
    head -c 32 /dev/urandom | base64 | tr -d '\n'
  fi
}

gen_db_pwd() {
  if command -v openssl >/dev/null 2>&1; then
    # 24 chars alfanum (sem caracteres ambíguos)
    openssl rand -base64 18 | tr -d '/+=' | cut -c1-24
  else
    head -c 18 /dev/urandom | base64 | tr -d '/+=' | cut -c1-24
  fi
}

gen_hex16() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 16
  else
    head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}

# -----------------------------------------------------------------------------
# Gera os secrets
# -----------------------------------------------------------------------------
ENCRYPTION_KEY="$(gen32)"
PII_HASH_SALT="$(gen32)"
SESSION_SECRET="$(gen32)"
CLERK_SECRET_KEY="sk_test_$(gen_hex16)"
CLERK_WEBHOOK_SIGNING_SECRET="whsec_$(gen_hex16)"
ASAAS_WEBHOOK_SECRET="$(gen32)"
DB_PWD="$(gen_db_pwd)"

cat <<EOF
ENCRYPTION_KEY=$ENCRYPTION_KEY
PII_HASH_SALT=$PII_HASH_SALT
SESSION_SECRET=$SESSION_SECRET
CLERK_SECRET_KEY=$CLERK_SECRET_KEY
CLERK_WEBHOOK_SIGNING_SECRET=$CLERK_WEBHOOK_SIGNING_SECRET
ASAAS_WEBHOOK_SECRET=$ASAAS_WEBHOOK_SECRET
DATABASE_URL_PASSWORD=$DB_PWD
DIRECT_URL_PASSWORD=$DB_PWD
EOF

# -----------------------------------------------------------------------------
# Se --write / --in-place: sobrescreve .env (cria backup .env.bak)
# -----------------------------------------------------------------------------
if [[ "$WRITE" == "true" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "[secrets] .env não existe — copie .env.example primeiro." >&2
    exit 1
  fi
  cp -a "$ENV_FILE" "$ENV_FILE.bak"
  log "Backup em $ENV_FILE.bak"

  # Substitui linhas em sed de forma idempotente
  set_kv() {
    local key="$1" val="$2"
    if grep -qE "^${key}=" "$ENV_FILE"; then
      # troca valor mantendo a linha inteira
      sed -i.bak "s|^${key}=.*$|${key}=${val}|" "$ENV_FILE"
    else
      printf "\n%s=%s\n" "$key" "$val" >> "$ENV_FILE"
    fi
  }

  set_kv "ENCRYPTION_KEY" "$ENCRYPTION_KEY"
  set_kv "PII_HASH_SALT" "$PII_HASH_SALT"
  set_kv "SESSION_SECRET" "$SESSION_SECRET"
  set_kv "CLERK_SECRET_KEY" "$CLERK_SECRET_KEY"
  set_kv "CLERK_WEBHOOK_SIGNING_SECRET" "$CLERK_WEBHOOK_SIGNING_SECRET"
  set_kv "ASAAS_WEBHOOK_SECRET" "$ASAAS_WEBHOOK_SECRET"

  if [[ "$ONLY_PLACEHOLDER" == "true" ]]; then
    # só troca DATABASE_URL se tiver CHANGEME
    if grep -qE "^DATABASE_URL=.*CHANGEME" "$ENV_FILE"; then
      sed -i.bak "s|^DATABASE_URL=postgres://[^:]*:CHANGEME@|DATABASE_URL=postgres://app_user:${DB_PWD}@|" "$ENV_FILE"
    fi
    if grep -qE "^DIRECT_URL=.*CHANGEME" "$ENV_FILE"; then
      sed -i.bak "s|^DIRECT_URL=postgres://[^:]*:CHANGEME@|DIRECT_URL=postgres://app_owner:${DB_PWD}@|" "$ENV_FILE"
    fi
  else
    sed -i.bak "s|^DATABASE_URL=postgres://[^:]*:[^@]*@|DATABASE_URL=postgres://app_user:${DB_PWD}@|" "$ENV_FILE"
    sed -i.bak "s|^DIRECT_URL=postgres://[^:]*:[^@]*@|DIRECT_URL=postgres://app_owner:${DB_PWD}@|" "$ENV_FILE"
  fi

  rm -f "$ENV_FILE.bak"
  printf "${GREEN}[secrets] .env atualizado (backup em .env.bak).${NC}\n"
fi