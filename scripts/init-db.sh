#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────────────────────
# scripts/init-db.sh
#
# Prepara o Postgres local para o DemoBR.
#
# IMPORTANTE: a criação de roles/grants NÃO vive aqui. Ela é delegada a
# infra/postgres/init-roles.sql, que é a única fonte de verdade. Antes these
# dois arquivos mantinham lógica duplicada e divergiam: este script criava
# `app_owner SUPERUSER` (dando poder de bypass total, inclusive de RLS de
# sistema) enquanto o init-roles.sql usava NOSUPERUSER + BYPASSRLS.
#
# Divergência de segurança entre dois arquivos queogyram o mesmo cluster é
# exatamente o tipo de bug que só aparece em re-init, muito depois.
#
# O que este script faz:
#   1. conecta no banco de manutenção e garante o database `supademo`
#   2. cria as extensions (pgcrypto, uuid-ossp)
#   3. delega roles + grants + search_path para init-roles.sql
#   4. aplica as senhas vindas do ambiente (.env / PG_*_PASS)
#   5. aplica migrations via drizzle-kit (respeita meta/_journal.json)
#
# Idempotente: pode rodar múlti vezes.
#
# Uso:
#   psql_app() { psql -h HOST -p PORT -U USER -d DB "$@"; }
#   PG_HOST=localhost PG_PORT=5432 PG_SUPERUSER=app \
#     PG_OWNER_PASS=... PG_USER_PASS=... PG_RO_PASS=... \
#     bash scripts/init-db.sh
# ───────────────────────────────────────────────────────────────────────────

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INIT_ROLES_SQL="$ROOT_DIR/infra/postgres/init-roles.sql"

# drizzle-kit lê DIRECT_URL do ambiente e procura .env em apps/web/, enquanto o
# projeto mantém o .env na raiz. Sem carregar aqui, `db:migrate` cai no
# fallback hardcoded (porta 55432 do Postgres em Docker) e falha.
if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

DB_NAME="${PG_DB_NAME:-supademo}"
PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
# Role de bootstrap: o superuser interno do container (POSTGRES_USER=app).
# Precisa de CREATEROLE para criar app_owner/app_user/readonly.
PG_SUPERUSER="${PG_SUPERUSER:-app}"

OWNER_PASS="${PG_OWNER_PASS:?defina PG_OWNER_PASS (senha de app_owner)}"
USER_PASS="${PG_USER_PASS:?defina PG_USER_PASS (senha de app_user)}"
RO_PASS="${PG_RO_PASS:?defina PG_RO_PASS (senha de readonly)}"

psql_admin() {
  local db="${1:-postgres}"
  shift
  PGPASSWORD="${PG_SUPERUSER_PASS:-}" psql \
    -v ON_ERROR_STOP=1 -h "$PG_HOST" -p "$PG_PORT" -U "$PG_SUPERUSER" -d "$db" "$@"
}

echo "🔌 Conectando em $PG_SUPERUSER@$PG_HOST:$PG_PORT"

# 1. Garante o database (CREATE DATABASE não roda dentro de bloco $$/DO).
if ! psql_admin postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
  echo "📦 Criando database '$DB_NAME'"
  psql_admin postgres -c "CREATE DATABASE \"$DB_NAME\""
else
  echo "✓ Database '$DB_NAME' já existe"
fi

# 2. Extensions (idempotente).
echo "🔧 Garantindo extensions"
psql_admin "$DB_NAME" <<SQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SQL

# 3. Schemas + roles + grants: fonte única de verdade.
if [[ ! -f "$INIT_ROLES_SQL" ]]; then
  echo "❌ init-roles.sql não encontrado em $INIT_ROLES_SQL" >&2
  exit 1
fi
echo "🔐 Aplicando roles e grants de infra/postgres/init-roles.sql"
psql_admin "$DB_NAME" -f "$INIT_ROLES_SQL"

# 4. Senhas vêm do ambiente — init-roles.sql usa placeholders fixos porque é
#    executado pelo docker-entrypoint-initdb.d, onde não há .env.
echo "🔑 Aplicando senhas do ambiente"
psql_admin "$DB_NAME" <<SQL
ALTER ROLE app_owner WITH PASSWORD '$OWNER_PASS';
ALTER ROLE app_user  WITH PASSWORD '$USER_PASS';
ALTER ROLE readonly  WITH PASSWORD '$RO_PASS';
SQL

# 5. Migrations via drizzle-kit.
#
# Antes este script rodava `psql -f db/migrations/0000_init.sql`, o que
# aplicava SÓ a primeira migration e ignorava meta/_journal.json — 0001 e
# 0002 nunca chegavam ao banco em um re-init. Drizzle-kit migrate é o caminho
# canônico e é idempotente.
echo "📦 Aplicando migrations (drizzle-kit migrate)"
if command -v pnpm >/dev/null 2>&1; then
  (cd "$ROOT_DIR" && pnpm --filter web db:migrate)
else
  echo "⚠️  pnpm não encontrado — pulei as migrations. Rode: pnpm db:migrate"
fi

cat <<EOF

✅ init-db concluído.

   app_owner : NOSUPERUSER + BYPASSRLS (migrations, jobs, webhooks)
   app_user  : NOSUPERUSER + RLS enforced (runtime do Next.js)
   readonly  : NOSUPERUSER + SELECT only (analytics, auditoria LGPD)
   \$ psql -h $PG_HOST -p $PG_PORT -U app_user -d $DB_NAME

EOF