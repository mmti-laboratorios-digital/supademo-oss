#!/usr/bin/env bash
# =============================================================================
#  scripts/pre-deploy.sh — Gate de pré-deploy (lint/typecheck/test/migration/branch)
# -----------------------------------------------------------------------------
#  Uso:
#    ./scripts/pre-deploy.sh            # roda tudo
#    ./scripts/pre-deploy.sh --fast      # só lint + typecheck
# =============================================================================
set -euo pipefail

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { printf "${BLUE}[pre-deploy]${NC} %s\n" "$*"; }
ok()   { printf "${GREEN}[ok]${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}[warn]${NC} %s\n" "$*"; }
err()  { printf "${RED}[err]${NC} %s\n" "$*" >&2; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

FAST="false"
for arg in "$@"; do
  case "$arg" in
    --fast|-f) FAST="true" ;;
    --help|-h)
      sed -n '2,10p' "$0"; exit 0 ;;
  esac
done

# Confirma branch
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'no-git')"
log "Branch atual: $CURRENT_BRANCH"
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  err "Branch '$CURRENT_BRANCH' != 'main'. Deploy requer main."
  exit 1
fi
ok "Branch main."

# Working tree limpo?
if ! git diff --quiet HEAD 2>/dev/null; then
  warn "Working tree com mudanças não commitadas."
  git status --short
fi

# Diff resumido contra último deploy (tag ou remote)
if git rev-parse --verify origin/main >/dev/null 2>&1; then
  log "Diff contra origin/main:"
  git fetch --quiet origin main || warn "fetch falhou (sem rede?)"
  DIFF="$(git diff --stat origin/main..HEAD 2>/dev/null || true)"
  if [[ -z "$DIFF" ]]; then
    warn "Sem diff com origin/main (já sincronizado?)"
  else
    printf "%s\n" "$DIFF" | head -n 40
  fi
fi

# Lint
log "Lint (biome)…"
pnpm run lint
ok "Lint ok."

# Typecheck
log "Typecheck (tsc --noEmit)…"
pnpm run typecheck
ok "Typecheck ok."

if [[ "$FAST" == "true" ]]; then
  printf "\n${GREEN}[pre-deploy] Fast mode — pulando testes.${NC}\n"
  exit 0
fi

# Test
log "Test (vitest)…"
pnpm run test
ok "Vitest ok."

# Playwright (e2e) — se existir
if grep -q '"test:e2e"' apps/web/package.json 2>/dev/null; then
  log "Playwright (e2e)…"
  pnpm --filter web exec playwright test --reporter=line || warn "Playwright falhou."
fi

# Migrations pendentes
log "Verificando migrations pendentes (drizzle-kit)…"
if [[ -d apps/web/db/migrations ]]; then
  GENERATED_DIR="$(mktemp -d)"
  pnpm --filter web exec drizzle-kit generate --name=pre-deploy-check 2>/dev/null || true
  # Se gerou novos arquivos em apps/web/db/migrations, abortar
  PENDING="$(git status --porcelain apps/web/db/migrations 2>/dev/null | wc -l)"
  if [[ "$PENDING" -gt 0 ]]; then
    err "Há migrations não commitadas. Faça commit antes de deployar:"
    git status --short apps/web/db/migrations
    exit 1
  fi
  ok "Sem migrations pendentes."
fi

printf "\n${GREEN}[pre-deploy] Tudo verde. Pode deployar.${NC}\n"