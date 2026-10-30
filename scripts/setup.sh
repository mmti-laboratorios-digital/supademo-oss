#!/usr/bin/env bash
# =============================================================================
#  scripts/setup.sh — Provisiona o ambiente EasyDemo do zero (Linux/macOS)
# -----------------------------------------------------------------------------
#  Passos:
#   1. Valida pré-requisitos (pnpm, node, docker, gh)
#   2. Cria .env a partir de .env.example (gerando secrets locais)
#   3. pnpm install
#   4. Sobe Postgres + pgweb via docker compose
#   5. Espera postgres ficar healthy
#   6. pnpm db:migrate + db:seed (apps/web)
#   7. Imprime resumo com URLs e credenciais
# =============================================================================
set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { printf "${BLUE}[setup]${NC} %s\n" "$*"; }
ok()    { printf "${GREEN}[ok]${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}[warn]${NC} %s\n" "$*"; }
err()   { printf "${RED}[err]${NC} %s\n" "$*" >&2; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
ver_ge() {
  # ver_ge A B → retorna 0 se A >= B
  local a b
  # Guarda-corpo: com `set -u`, uma comparação aritmética com texto não-numérico
  # faz o bash tratar o texto como nome de variável e abortar com
  # "X: unbound variable" (ex: ver_ge "Docker version 29.5.2" 24.0).
  [[ "$1" =~ ^[0-9]+(\.[0-9]+)*$ ]] || return 1
  [[ "$2" =~ ^[0-9]+(\.[0-9]+)*$ ]] || return 1
  IFS='.' read -r -a a <<<"$1"
  IFS='.' read -r -a b <<<"$2"
  local n=${#a[@]}
  [[ ${#b[@]} -gt $n ]] && n=${#b[@]}
  for ((i=0; i<n; i++)); do
    local av=${a[i]:-0} bv=${b[i]:-0}
    (( av > bv )) && return 0
    (( av < bv )) && return 1
  done
  return 0
}

have_cmd() { command -v "$1" >/dev/null 2>&1; }

get_version() {
  # Extrai o primeiro número de versão (major[.minor[.patch]]) da primeira
  # linha de `<cmd> --version`.
  #
  # Não ancora no início: cada tool formata differently —
  #   node  → "v24.16.0"
  #   pnpm  → "9.12.0"
  #   docker → "Docker version 29.5.2, build c48d262e"
  # O regex anterior (`.*v?([0-9]+\.[0-9]+...)`) fazia backtrack guloso e
  # devolvia "6.0" para "v24.16.0", reprovando qualquer Node >= 10.
  "$1" --version 2>/dev/null \
    | head -n1 \
    | grep -oE '[0-9]+(\.[0-9]+)*' \
    | head -n1 \
    || true
}

wait_healthy() {
  local name="$1" timeout="${2:-60}" elapsed=0
  log "Esperando container '${name}' ficar healthy (timeout ${timeout}s)…"
  while (( elapsed < timeout )); do
    local state
    state="$(docker inspect -f '{{.State.Health.Status}}' "$name" 2>/dev/null || echo "missing")"
    case "$state" in
      healthy) ok "Container '${name}' está healthy."; return 0 ;;
      starting|unhealthy|missing)
        sleep 2; elapsed=$((elapsed+2)) ;;
      *) sleep 2; elapsed=$((elapsed+2)) ;;
    esac
  done
  err "Container '${name}' não ficou healthy em ${timeout}s."
  return 1
}

wait_pgready() {
  local timeout="${1:-60}" elapsed=0
  log "Esperando Postgres responder (pg_isready, timeout ${timeout}s)…"
  while (( elapsed < timeout )); do
    if docker exec easydemo-postgres pg_isready -U app_user -d supademo >/dev/null 2>&1; then
      ok "Postgres está pronto."
      return 0
    fi
    sleep 2; elapsed=$((elapsed+2))
  done
  err "Postgres não respondeu em ${timeout}s."
  return 1
}

generate_secret() {
  # 32 bytes base64 (≈44 chars)
  if have_cmd openssl; then
    openssl rand -base64 32
  else
    # Fallback: /dev/urandom
    head -c 32 /dev/urandom | base64
  fi
}

# -----------------------------------------------------------------------------
# 1. Pré-requisitos
# -----------------------------------------------------------------------------
log "Verificando pré-requisitos…"

MIN_NODE="22.0"
MIN_PNPM="9.0"
MIN_DOCKER="24.0"

have_cmd node || { err "node não encontrado. Instale Node 22+."; exit 1; }
NODE_V="$(get_version node)"
ver_ge "$NODE_V" "$MIN_NODE" || { err "Node $NODE_V < $MIN_NODE. Atualize."; exit 1; }
ok "Node $NODE_V"

have_cmd pnpm || { err "pnpm não encontrado. corepack enable && corepack prepare pnpm@9.12.0 --activate"; exit 1; }
PNPM_V="$(get_version pnpm)"
ver_ge "$PNPM_V" "$MIN_PNPM" || { err "pnpm $PNPM_V < $MIN_PNPM."; exit 1; }
ok "pnpm $PNPM_V"

have_cmd docker || { err "docker não encontrado."; exit 1; }
DOCKER_V="$(get_version docker)"
ver_ge "$DOCKER_V" "$MIN_DOCKER" || warn "Docker $DOCKER_V < $MIN_DOCKER — pode funcionar, mas versões antigas não testadas."
ok "docker $DOCKER_V"

if ! docker info >/dev/null 2>&1; then
  err "Docker daemon não está rodando. Inicie o Docker Desktop / dockerd."
  exit 1
fi
ok "docker daemon respondendo"

if have_cmd gh; then
  ok "gh CLI $(get_version gh) (opcional)"
else
  warn "gh CLI não instalado (opcional, só para criar PRs/releases)."
fi

# -----------------------------------------------------------------------------
# 2. .env a partir de .env.example
# -----------------------------------------------------------------------------
log "Configurando .env…"
if [[ ! -f .env ]]; then
  cp .env.example .env
  ok ".env criado a partir de .env.example."
else
  warn ".env já existe — não sobrescrevendo."
fi

# Gera secrets locais só se ainda forem placeholders
bash "$ROOT_DIR/scripts/generate-secrets.sh" --in-place --if-placeholder

# -----------------------------------------------------------------------------
# 3. pnpm install
# -----------------------------------------------------------------------------
log "Instalando dependências (pnpm install)…"
pnpm install --silent
ok "Dependências instaladas."

# -----------------------------------------------------------------------------
# 4. Docker compose: postgres + pgweb
# -----------------------------------------------------------------------------
log "Subindo Postgres + pgweb…"
docker compose -f infra/docker-compose.yml up -d postgres pgweb

# -----------------------------------------------------------------------------
# 5. Health check
# -----------------------------------------------------------------------------
wait_healthy "easydemo-postgres" 90 || true
wait_pgready 90

# -----------------------------------------------------------------------------
# 6. DB migrate + seed
# -----------------------------------------------------------------------------
log "Aplicando migrations (pnpm --filter web db:migrate)…"
pnpm --filter web db:migrate

log "Rodando seed (pnpm --filter web db:seed)…"
pnpm --filter web db:seed || warn "Seed não rodou — verifique db:seed no apps/web."

# -----------------------------------------------------------------------------
# 7. Resumo
# -----------------------------------------------------------------------------
printf "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
printf "${GREEN}EasyDemo setup concluído${NC}\n\n"
printf "  ${BLUE}Web (Next.js)${NC}      → ${CYAN}http://localhost:3000${NC}\n"
printf "  ${BLUE}pgweb (DB UI)${NC}      → ${CYAN}http://localhost:8081${NC}\n"
printf "  ${BLUE}Postgres${NC}          → ${CYAN}localhost:55432${NC}  (user: app / pwd: ver .env)\n"
printf "  ${BLUE}Worker (fila)${NC}     → ${CYAN}pnpm worker${NC}\n"
printf "  ${BLUE}Extension (chrome)${NC}→ ${CYAN}pnpm extension:dev${NC}\n\n"
printf "  Próximos passos:\n"
printf "    pnpm dev           # Next.js em :3000\n"
printf "    pnpm worker        # graphile-worker\n"
printf "    pnpm db:studio     # Drizzle Studio (se existir)\n"
printf "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"