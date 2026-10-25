#!/usr/bin/env bash
# =============================================================================
#  apps/web/scripts/test-rls.sh — Wrapper bash para scripts/db/test-rls.ts
#  Exit 0 se RLS está aplicado, 1 se vazou, 2 se erro de setup.
# =============================================================================
set -euo pipefail

BLUE='\033[0;34m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
log() { printf "${BLUE}[test-rls]${NC} %s\n" "$*"; }

# scripts/web/scripts/test-rls.sh → monorepo root é 3 níveis acima
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TEST_FILE="$ROOT_DIR/scripts/db/test-rls.ts"

# Carrega .env se existir
if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a; . "$ROOT_DIR/.env"; set +a
fi

if [[ ! -f "$TEST_FILE" ]]; then
  echo "❌ Arquivo não encontrado: $TEST_FILE"
  exit 2
fi

log "Rodando test-rls.ts…"
cd "$ROOT_DIR"

# Tenta usar tsx do web package (mais provável estar instalado)
if pnpm --filter web exec tsx "$TEST_FILE" 2>/dev/null; then
  exit 0
elif command -v tsx >/dev/null 2>&1; then
  tsx "$TEST_FILE"
else
  npx --yes tsx "$TEST_FILE"
fi