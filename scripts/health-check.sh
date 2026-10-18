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

# curl retorna:
#   body + http code via -w
RESPONSE="$(curl -sS --max-time "$TIMEOUT" -o /tmp/_health.json -w '%{http_code}' "$URL" || echo "000")"
HTTP_CODE="$RESPONSE"

if [[ "$JSON_ONLY" == "true" ]]; then
  cat /tmp/_health.json
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
    jq -r '.checks[$key].status // "unknown"' --arg key "$1" </tmp/_health.json 2>/dev/null || echo "unknown"
  else
    # fallback regex
    grep -oE "\"$1\":\{[^}]*\"status\":\"(ok|degraded|down)\"" /tmp/_health.json \
      | sed -E "s/.*\"status\":\"([a-z]+)\".*/\1/" || echo "unknown"
  fi
}

overall_status() {
  if command -v jq >/dev/null 2>&1; then
    jq -r '.status // "unknown"' </tmp/_health.json 2>/dev/null || echo "unknown"
  else
    grep -oE '"status":"(ok|degraded|down)"' /tmp/_health.json | head -n1 \
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
  *)        exit 1 ;;
esac