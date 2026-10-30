#!/usr/bin/env bash
# =============================================================================
#  scripts/teardown.sh — Derruba containers e (opcionalmente) volumes
# =============================================================================
set -euo pipefail

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { printf "${BLUE}[teardown]${NC} %s\n" "$*"; }
ok()   { printf "${GREEN}[ok]${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}[warn]${NC} %s\n" "$*"; }
err()  { printf "${RED}[err]${NC} %s\n" "$*" >&2; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Confirma se estamos mesmo num projeto EasyDemo
if [[ ! -f "pnpm-workspace.yaml" ]]; then
  err "Não parece ser um projeto EasyDemo (pnpm-workspace.yaml não encontrado)."
  exit 1
fi

log "Parando containers (postgres, pgweb, …)…"
docker compose -f infra/docker-compose.yml down --remove-orphans
ok "Containers parados."

# Pergunta antes de apagar volumes
printf "\n${YELLOW}Apagar volumes (postgres_data, pgweb_data)?${NC} [s/N]: "
read -r ANSWER
ANSWER="$(printf '%s' "$ANSWER" | tr '[:upper:]' '[:lower:]')"

if [[ "$ANSWER" == "s" || "$ANSWER" == "sim" || "$ANSWER" == "y" || "$ANSWER" == "yes" ]]; then
  warn "Apagando volumes… ISSO APAGA TODOS OS DADOS LOCAIS."
  docker compose -f infra/docker-compose.yml down -v
  ok "Volumes apagados."
else
  log "Volumes preservados. Para limpar depois: docker compose -f infra/docker-compose.yml down -v"
fi

# Pergunta se quer apagar build cache
printf "\n${YELLOW}Apagar imagens do projeto (easydemo-*) e cache?${NC} [s/N]: "
read -r ANSWER2
ANSWER2="$(printf '%s' "$ANSWER2" | tr '[:upper:]' '[:lower:]')"
if [[ "$ANSWER2" == "s" || "$ANSWER2" == "sim" || "$ANSWER2" == "y" || "$ANSWER2" == "yes" ]]; then
  docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' \
    | awk '/^easydemo-/{print $2}' \
    | xargs -r docker rmi -f || true
  docker builder prune -f || true
  ok "Imagens e cache limpos."
fi

printf "\n${GREEN}Teardown concluído.${NC}\n"