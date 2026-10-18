#!/usr/bin/env bash
# =============================================================================
# install-playwright-no-sudo.sh
#
# Para desenvolvedores que NÃO têm sudo (sandbox, container sem root, etc).
# Tenta 3 métodos em ordem de preferência. Cada um pode ser pulado.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

note() { printf '\033[1;34mℹ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m⚠ %s\033[0m\n' "$*"; }

note "Repositório: $REPO_ROOT"

# -----------------------------------------------------------------------------
# Método 1 — sem deps de sistema (recomendado se libs já estão no host)
# -----------------------------------------------------------------------------
note "Método 1: instalar só o chromium (sem --with-deps)"
echo "    pnpm exec playwright install chromium"
echo
if command -v pnpm >/dev/null 2>&1; then
    pnpm exec playwright install chromium 2>&1 | tail -5 || warn "Método 1 falhou"
else
    warn "pnpm não encontrado no PATH — pule Método 1"
fi
ok "Método 1 concluído"
echo

# -----------------------------------------------------------------------------
# Método 2 — Docker oficial Playwright
# -----------------------------------------------------------------------------
note "Método 2: usar imagem Docker oficial (se Docker disponível)"
if command -v docker >/dev/null 2>&1; then
    cat <<EOF
    docker run --rm \\
      -v "\$(pwd):/app" \\
      -w /app \\
      -e CI=1 \\
      mcr.microsoft.com/playwright:v1.48.0-jammy \\
      bash -c "pnpm install --frozen-lockfile && pnpm test:e2e"
EOF
    ok "Docker detectado — cole o comando acima para rodar via container"
else
    warn "Docker não está instalado — pule Método 2"
fi
echo

# -----------------------------------------------------------------------------
# Método 3 — usar Chromium já presente no sistema
# -----------------------------------------------------------------------------
note "Método 3: usar chromium já cacheado (zero download)"
CHROMIUM_BIN="$(find ~/.cache/ms-playwright -path '*chrome-linux/chrome' -o \
                                       -path '*chrome-linux64/chrome' 2>/dev/null | sort -r | head -1)"
if [[ -n "$CHROMIUM_BIN" && -x "$CHROMIUM_BIN" ]]; then
    CHROMIUM_VER="$("$CHROMIUM_BIN" --version 2>/dev/null || echo unknown)"
    ok "Chromium encontrado: $CHROMIUM_BIN ($CHROMIUM_VER)"
    echo "    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 pnpm test:e2e"
else
    warn "Nenhum Chromium em ~/.cache/ms-playwright — rode Método 1 antes"
fi
echo

# -----------------------------------------------------------------------------
# Smoke test do binário (descobre libs faltantes sem subir o dev server)
# -----------------------------------------------------------------------------
note "Smoke test do binário (verifica libs faltantes)"
if [[ -n "$CHROMIUM_BIN" && -x "$CHROMIUM_BIN" ]]; then
    MISSING="$(ldd "$CHROMIUM_BIN" 2>/dev/null | awk '/not found/ {print $1}')"
    if [[ -z "$MISSING" ]]; then
        ok "Todas as libs resolvem — Chromium rodará sem --with-deps"
    else
        warn "Libs faltando:"
        echo "$MISSING" | sed 's/^/    /'
        warn "Sem sudo, peça ao admin do host para instalar"
    fi
else
    warn "Sem binário para testar (rode Método 1)"
fi
echo

ok "Pronto. Próximo passo:"
echo "    (pnpm --filter web dev > /tmp/next-dev.log 2>&1 &)"
echo "    pnpm test:e2e"
