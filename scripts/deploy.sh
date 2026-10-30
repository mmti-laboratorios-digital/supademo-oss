#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────────────────────
# scripts/deploy.sh
#
# SSH para VPS + docker compose pull && up.
# Uso:
#   VPS_HOST=easydemo.example.com VPS_USER=root \
#     bash scripts/deploy.sh
# ───────────────────────────────────────────────────────────────────────────

set -euo pipefail

VPS_HOST="${VPS_HOST:?VPS_HOST é obrigatório (ex: easydemo.example.com)}"
VPS_USER="${VPS_USER:-root}"
REMOTE_DIR="${REMOTE_DIR:-/opt/easydemo}"
SERVICE="${SERVICE:-web}"

echo "🚢 Deploy → ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}"

ssh "${VPS_USER}@${VPS_HOST}" <<EOF
  set -e
  cd ${REMOTE_DIR}

  echo "  · git pull"
  git pull --ff-only

  echo "  · docker compose pull"
  docker compose -f infra/docker-compose.prod.yml pull

  echo "  · docker compose up -d ${SERVICE}"
  docker compose -f infra/docker-compose.prod.yml up -d --no-deps ${SERVICE}

  echo "  · docker compose ps"
  docker compose -f infra/docker-compose.prod.yml ps

  echo "  · logs (últimas 20)"
  docker compose -f infra/docker-compose.prod.yml logs --tail=20 ${SERVICE}
EOF

echo "✅ Deploy concluído."