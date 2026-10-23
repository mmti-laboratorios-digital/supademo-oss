#!/usr/bin/env bash
# =============================================================================
#  scripts/health-check.sh — Smoke test do /api/health (DB, R2, Clerk, Asaas,
#  Resend, Sentry).
#  Exit codes:
#    0 → todos os checks OK
#    1 → algum check "degraded" (warning, sistema ainda utilizável)
#    2 → algum check "down" (falha crítica)
# =============================================================================
set -euo pipefail

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'
log() { printf "${BLUE}[health]${NC} %s\n" "$*"; }

URL="${HEALTH_URL:-${APP_BASE_URL:-http://localhost:3000}/api/health}"
TIMEOUT="${HEALTH_TIMEOUT:-10}"
JSON_ONLY="${JSON_ONLY:-false}"

log "GET $URL (timeout ${TIMEOUT}s)…"

# Arquivo de resposta via mktemp: garante corpo vazio a cada execução.
#
# Com um caminho fixo (/tmp/_health.json), quando o curl falhava ele NÃO
# sobrescrevia o arquivo — e o parser lia o JSON da execução ANTERIOR. Uma
# execução anterior saudável + serviço fora agora = "Overall: ok" + exit 0,
# o que fazia o deploy.yml achar que está tudo bem e NÃO reverter.
BODY="$(mktemp -t _health.XXXXXX.json)"
cleanup() { rm -f "$BODY"; }
trap cleanup EXIT

# curl reporta o status via -w e já imprime "000" quando não consegue
# conectar. O `|| echo "000"` anterior duplicava o valor e produzia
# "000000", que nunca casava com as comparações "000" mais abaixo — então
# uma queda total do serviço saía como "degraded" em vez de "down".
HTTP_CODE="$(curl -sS --max-time "$TIMEOUT" -o "$BODY" -w '%{http_code}' "$URL" 2>/dev/null || true)"
HTTP_CODE="${HTTP_CODE:-000}"
case "$HTTP_CODE" in
  [0-9][0-9][0-9]) ;;   # status normal
  *) HTTP_CODE="000" ;; # curl não produziu nada
esac

if [[ "$JSON_ONLY" == "true" ]]; then
  cat "$BODY"
  printf "\n"
  case "$HTTP_CODE" in
    200) exit 0 ;;
    503) exit 2 ;;
    *)   exit 1 ;;
  esac
fi

# Parse JSON simples (sem jq hard dep, mas usa se disponível)
parse_status() {
  if command -v jq >/dev/null 2>&1; then
    jq -r '.checks[$key].status // "unknown"' --arg key "$1" <"$BODY" 2>/dev/null || echo "unknown"
  else
    # fallback regex
    grep -oE "\"$1\":\{[^}]*\"status\":\"(ok|degraded|down)\"" "$BODY" \
      | sed -E "s/.*\"status\":\"([a-z]+)\".*/\1/" || echo "unknown"
  fi
}

overall_status() {
  if command -v jq >/dev/null 2>&1; then
    jq -r '.status // "unknown"' <"$BODY" 2>/dev/null || echo "unknown"
  else
    grep -oE '"status":"(ok|degraded|down)"' "$BODY" | head -n1 \
      | sed -E 's/.*"status":"([a-z]+)".*/\1/' || echo "unknown"
  fi
}

OVERALL="$(overall_status)"
DB_STATUS="$(parse_status database)"
R2_STATUS="$(parse_status r2)"
CLERK_STATUS="$(parse_status clerk)"
ASAAS_STATUS="$(parse_status asaas)"
RESEND_STATUS="$(parse_status resend)"
SENTRY_STATUS="$(parse_status sentry)"

print_status() {
  local label="$1" status="$2"
  case "$status" in
    ok)       printf "  ${GREEN}●${NC} %-9s ${GREEN}OK${NC}\n" "$label" ;;
    degraded) printf "  ${YELLOW}●${NC} %-9s ${YELLOW}DEGRADED${NC}\n" "$label" ;;
    down)     printf "  ${RED}●${NC} %-9s ${RED}DOWN${NC}\n" "$label" ;;
    *)        printf "  ${YELLOW}●${NC} %-9s ${YELLOW}UNKNOWN${NC}\n" "$label" ;;
  esac
}

printf "\n"
printf "HTTP:    %s\n" "$HTTP_CODE"
printf "Overall: %s\n\n" "$OVERALL"
print_status "database" "$DB_STATUS"
print_status "r2"       "$R2_STATUS"
print_status "clerk"    "$CLERK_STATUS"
print_status "asaas"    "$ASAAS_STATUS"
print_status "resend"   "$RESEND_STATUS"
print_status "sentry"   "$SENTRY_STATUS"
printf "\n"

case "$OVERALL" in
  ok)       exit 0 ;;
  degraded) exit 1 ;;
  down|"")  
    if [[ "$HTTP_CODE" == "000" ]]; then exit 2; fi
    [[ "$HTTP_CODE" -ge 500 ]] && exit 2 || exit 1
    ;;
  *)
    # HTTP 000 = conexão recusada / timeout: o serviço inteiro está fora.
    # É o caso mais crítico possível, então precisa ser 2 (down) mesmo sem
    # JSON para parsear. Antes caía no `*)` e devolvia 1 ("degraded,
    # sistema ainda utilizável"), mascarando queda total no alerta.
    [[ "$HTTP_CODE" == "000" ]] && exit 2
    exit 1
    ;;
esac