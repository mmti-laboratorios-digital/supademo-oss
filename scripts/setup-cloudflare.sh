#!/usr/bin/env bash
# =============================================================================
#  scripts/setup-cloudflare.sh — Provisiona R2 + custom domain via wrangler
# =============================================================================
set -euo pipefail

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; NC='\033[0m'
log() { printf "${BLUE}[cloudflare]${NC} %s\n" "$*"; }
ok()  { printf "${GREEN}[ok]${NC} %s\n" "$*"; }
warn(){ printf "${YELLOW}[warn]${NC} %s\n" "$*"; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# -----------------------------------------------------------------------------
# 1. wrangler instalado?
# -----------------------------------------------------------------------------
if ! command -v wrangler >/dev/null 2>&1; then
  log "Instalando wrangler…"
  npm i -g wrangler || pnpm add -g wrangler
fi
log "wrangler $(wrangler --version)"

# -----------------------------------------------------------------------------
# 2. Login
# -----------------------------------------------------------------------------
if ! wrangler whoami >/dev/null 2>&1; then
  log "Faça login no Cloudflare:"
  wrangler login
fi
ACCOUNT_ID="$(wrangler whoami --json 2>/dev/null \
  | jq -r '.accounts[0].id' || true)"

if [[ -z "$ACCOUNT_ID" || "$ACCOUNT_ID" == "null" ]]; then
  printf "Account ID do Cloudflare (console → Workers & Pages →右上角): "
  read -r ACCOUNT_ID
fi
ok "Account ID: $ACCOUNT_ID"

# -----------------------------------------------------------------------------
# 3. Cria buckets R2 (public + private)
# -----------------------------------------------------------------------------
PUBLIC_BUCKET="${EASYDEMO_R2_PUBLIC:-demo-public}"
PRIVATE_BUCKET="${EASYDEMO_R2_PRIVATE:-demo-private}"

log "Criando bucket '$PUBLIC_BUCKET' (se não existir)…"
wrangler r2 bucket create "$PUBLIC_BUCKET" 2>/dev/null \
  && ok "Bucket público criado." \
  || ok "Bucket público já existe (idempotente)."

log "Criando bucket '$PRIVATE_BUCKET' (se não existir)…"
wrangler r2 bucket create "$PRIVATE_BUCKET" 2>/dev/null \
  && ok "Bucket privado criado." \
  || ok "Bucket privado já existe (idempotente)."

# -----------------------------------------------------------------------------
# 4. API token com escopo R2
# -----------------------------------------------------------------------------
printf "\n${YELLOW}Crie um API Token em https://dash.cloudflare.com/profile/api-tokens${NC}\n"
printf "Template: 'Edit Cloudflare R2' OU custom com permissão Object Read & Write nos dois buckets.\n\n"
printf "Cole o token (será salvo no .env): "
read -rs CF_TOKEN; echo
printf "Nome do token (opcional, só para referência): "
read -r CF_TOKEN_NAME

# -----------------------------------------------------------------------------
# 5. Custom domain (cdn.easydemo.io)
# -----------------------------------------------------------------------------
CDN_DOMAIN="${EASYDEMO_CDN_DOMAIN:-cdn.easydemo.io}"
printf "\n${YELLOW}Configurar custom domain ${CDN_DOMAIN} → bucket público?${NC} [s/N]: "
read -r ANS
ANS="$(printf '%s' "$ANS" | tr '[:upper:]' '[:lower:]')"

if [[ "$ANS" == "s" || "$ANS" == "sim" || "$ANS" == "y" ]]; then
  wrangler r2 bucket custom-domain add "$PUBLIC_BUCKET" "$CDN_DOMAIN" \
    || warn "Já configurado (idempotente)."
  printf "\n${GREEN}Importante: crie um registro CNAME em seu DNS:${NC}\n"
  printf "  ${CDN_DOMAIN} → ${PUBLIC_BUCKET}.${ACCOUNT_ID}.r2.cloudflarestorage.com\n\n"
fi

# -----------------------------------------------------------------------------
# 6. CORS no bucket público
# -----------------------------------------------------------------------------
log "Configurando CORS no bucket público…"
# wrangler não tem subcomando de CORS; usa aws-cli (R2 = S3)
if command -v aws >/dev/null 2>&1; then
  CORS_FILE="$(mktemp)"
  cat > "$CORS_FILE" <<JSON
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://app.easydemo.io", "https://cdn.easydemo.io", "http://localhost:3000"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
      "MaxAgeSeconds": 3600
    }
  ]
}
JSON
  AWS_ACCESS_KEY_ID="$(printf '%s' "$CF_TOKEN" | cut -d. -f1)" \
  AWS_SECRET_ACCESS_KEY="$(printf '%s' "$CF_TOKEN" | cut -d. -f2-)" \
    aws s3api put-bucket-cors \
      --bucket "$PUBLIC_BUCKET" \
      --cors-configuration "file://$CORS_FILE" \
      --endpoint-url "https://${ACCOUNT_ID}.r2.cloudflarestorage.com" \
      || warn "Falha ao setar CORS via aws-cli (configure AWS_ACCESS_KEY/SECRET manualmente)."
  rm -f "$CORS_FILE"
else
  warn "aws-cli não instalado. Configure CORS pelo dashboard do Cloudflare."
fi

# -----------------------------------------------------------------------------
# 7. Testa leitura via custom domain
# -----------------------------------------------------------------------------
printf "\n${YELLOW}Testar GET ${CDN_DOMAIN}/_health (timeout 5s)? [s/N]${NC}: "
read -r ANS2
ANS2="$(printf '%s' "$ANS2" | tr '[:upper:]' '[:lower:]')"
if [[ "$ANS2" == "s" || "$ANS2" == "y" ]]; then
  curl -sS -o /dev/null -w "HTTP %{http_code} em %{time_total}s\n" \
    --max-time 5 "https://${CDN_DOMAIN}/_health" \
    || warn "Sem resposta (DNS não propagado? Aguarde alguns minutos.)"
fi

# -----------------------------------------------------------------------------
# 8. Grava no .env
# -----------------------------------------------------------------------------
if [[ -f "$ROOT_DIR/.env" ]]; then
  cp -a "$ROOT_DIR/.env" "$ROOT_DIR/.env.bak"
  set_kv() {
    local key="$1" val="$2"
    if grep -qE "^${key}=" "$ROOT_DIR/.env"; then
      sed -i.bak "s|^${key}=.*$|${key}=${val}|" "$ROOT_DIR/.env"
    else
      printf "\n%s=%s\n" "$key" "$val" >> "$ROOT_DIR/.env"
    fi
  }
  set_kv "R2_ACCOUNT_ID" "$ACCOUNT_ID"
  set_kv "R2_ACCESS_KEY_ID" "$(printf '%s' "$CF_TOKEN" | cut -d. -f1)"
  set_kv "R2_SECRET_ACCESS_KEY" "$(printf '%s' "$CF_TOKEN" | cut -d. -f2-)"
  set_kv "R2_BUCKET_PUBLIC" "$PUBLIC_BUCKET"
  set_kv "R2_BUCKET_PRIVATE" "$PRIVATE_BUCKET"
  set_kv "R2_PUBLIC_BASE_URL" "https://${CDN_DOMAIN}"
  set_kv "CLOUDFLARE_ACCOUNT_ID" "$ACCOUNT_ID"
  set_kv "CLOUDFLARE_API_TOKEN" "$CF_TOKEN"
  rm -f "$ROOT_DIR/.env.bak"
  ok ".env atualizado com credenciais R2/Cloudflare."
fi

printf "\n${GREEN}Setup Cloudflare concluído.${NC}\n"
printf "  ${BLUE}Buckets${NC}:    %s, %s\n" "$PUBLIC_BUCKET" "$PRIVATE_BUCKET"
printf "  ${BLUE}CDN domain${NC}: https://%s\n" "$CDN_DOMAIN"
printf "  ${BLUE}Account ID${NC}: %s\n\n" "$ACCOUNT_ID"