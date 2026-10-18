#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────────────────────
# scripts/init-db.sh
#
# Cria 3 roles no Postgres:
#   - app_owner  → migrations (bypassa RLS)
#   - app_user   → runtime (RLS aplicado)
#   - readonly   → analytics queries
#
# Idempotente: pode rodar múltiplas vezes. Cria também a extension pgcrypto
# e os schemas app/analytics.
#
# Uso:
#   DATABASE_URL=postgres://app:CHANGEME@localhost:55432/supademo \
#     bash scripts/init-db.sh
#
# Nota: porta 55432 (não 5432) é convenção do projeto — ver
# infra/docker-compose.yml. O container Postgres do projeto é publicado
# em 55432 no host para evitar colisão com `postgresql@16-main` do SO.
# ───────────────────────────────────────────────────────────────────────────

set -euo pipefail

DB_URL="${DATABASE_URL:-postgres://app:CHANGEME@localhost:55432/supademo}"
OWNER_PASS="${PG_OWNER_PASS:-CHANGEME_owner}"
USER_PASS="${PG_USER_PASS:-CHANGEME_user}"
RO_PASS="${PG_RO_PASS:-CHANGEME_ro}"

echo "🔌 Connecting to $DB_URL"
psql "$DB_URL" -v ON_ERROR_STOP=1 <<SQL
-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_owner') THEN
    CREATE ROLE app_owner LOGIN PASSWORD '$OWNER_PASS' SUPERUSER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user LOGIN PASSWORD '$USER_PASS';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'readonly') THEN
    CREATE ROLE readonly LOGIN PASSWORD '$RO_PASS';
  END IF;
END
\$\$;

-- Schemas
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Grants
GRANT USAGE ON SCHEMA app TO app_user, readonly;
GRANT USAGE ON SCHEMA analytics TO app_user, readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT SELECT ON TABLES TO readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT SELECT ON TABLES TO readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT USAGE, SELECT ON SEQUENCES TO app_user, readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics
  GRANT USAGE, SELECT ON SEQUENCES TO app_user, readonly;
SQL

echo "✅ Roles + schemas criados."
echo "   app_owner: SUPERUSER (migrations, bypass RLS)"
echo "   app_user:  RLS aplicado (runtime)"
echo "   readonly:  SELECT apenas"

# Aplica migrations
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATION_FILE="$ROOT/apps/web/db/migrations/0000_init.sql"
if [ -f "$MIGRATION_FILE" ]; then
  echo "📦 Aplicando migration inicial: $MIGRATION_FILE"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION_FILE"
  echo "✅ Migration aplicada."
else
  echo "⚠️  Migration não encontrada em $MIGRATION_FILE"
fi

echo "🎉 init-db concluído."