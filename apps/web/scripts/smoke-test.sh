#!/usr/bin/env bash
# =============================================================================
#  apps/web/scripts/smoke-test.sh — Smoke test pós-deploy (5s timeout cada)
# =============================================================================
set -euo pipefail

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'
log()   { printf "${BLUE}[smoke]${NC} %s\n" "$*"; }
ok()    { printf "${GREEN}[ok]${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}[warn]${NC} %s\n" "$*"; }
err()   { printf "${RED}[err]${NC} %s\n" "$*" >&2; }

BASE="${BASE:-${APP_BASE_URL:-http://localhost:3000}}"
TIMEOUT="${TIMEOUT:-5}"
FAIL=0

check() {
  local label="$1" path="$2" expected_code="$3" method="${4:-GET}" body="${5:-}"
  local code
  if [[ -n "$body" ]]; then
    code="$(curl -sS --max-time "$TIMEOUT" -o /tmp/_smoke.body -w '%{http_code}' \
      -X "$method" -H 'Content-Type: application/json' --data "$body" "$BASE$path" || echo "000")"
  else
    code="$(curl -sS --max-time "$TIMEOUT" -o /tmp/_smoke.body -w '%{http_code}' \
      -X "$method" "$BASE$path" || echo "000")"
  fi

  if [[ "$code" == "$expected_code" ]]; then
    ok "$method $path → $code"
  elif [[ "$code" == "000" ]]; then
    err "$method $path → TIMEOUT (>${TIMEOUT}s)"
    FAIL=$((FAIL+1))
  else
    err "$method $path → $code (esperado $expected_code)"
    cat /tmp/_smoke.body | head -n 5 | sed 's/^/    /'
    FAIL=$((FAIL+1))
  fi
}

log "Smoke test em $BASE (timeout ${TIMEOUT}s por request)…"

check "/"                              "/"                                     200
check "/pricing"                       "/pricing"                              200
check "/d/nao-existe"                  "/d/nao-existe"                         404
check "POST /api/v1/events (sem auth)" "/api/v1/events"                        401 POST '{"type":"view","demo_id":"x"}'

if [[ "$FAIL" -gt 0 ]]; then
  printf "\n${RED}❌ %d check(s) falharam.${NC}\n" "$FAIL"
  exit 1
fi
printf "\n${GREEN}✅ Smoke test passou.${NC}\n"