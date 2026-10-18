-- =============================================================================
-- DemoBR — Postgres init: cria roles app_user, app_owner, readonly
-- ----------------------------------------------------------------------------
-- Idempotente: pode rodar múltiplas vezes.
--
-- Uso no primeiro start do container (docker-entrypoint-initdb.d) ou manualmente:
--   psql -U app -d supademo -f infra/postgres/init-roles.sql
--
-- IMPORTANTE: este arquivo é executado pelo superuser interno do container
-- (role `app`, criada via POSTGRES_USER). Se for rodar como outro role,
-- garanta que ele tenha CREATEROLE ou que os roles já existam.
--
-- Convenção do projeto:
--   app_owner  → migrations, jobs assíncronos, webhooks (BYPASSRLS, NOINHERIT)
--                 NÃO use em runtime de request: bypassaria RLS dos tenants.
--   app_user   → runtime do Next.js + worker (RLS-enforced, NOBYPASSRLS)
--   readonly   → analytics / LGPD audit (SELECT-only, NOBYPASSRLS)
--   app        → superuser interno do container (não usar em app code)
-- =============================================================================

-- ----------------------------------------------------------------------------
-- app_owner: migrations, jobs assíncronos, webhooks
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_owner') THEN
    CREATE ROLE app_owner LOGIN PASSWORD 'app_owner'
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$$;
-- BYPASSRLS é fundamental: migrations, jobs de seed e webhooks rodam
-- sem o contexto de tenant (sem SET app.current_tenant_id). Sem BYPASSRLS
-- essas operações falhariam ou veriam 0 rows.
ALTER ROLE app_owner BYPASSRLS;
ALTER ROLE app_owner SET search_path = app, analytics, public;

-- ----------------------------------------------------------------------------
-- app_user: runtime, RLS-enforced
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user LOGIN PASSWORD 'app_user'
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$$;
-- Garantia explícita: app_user NUNCA pode bypassar RLS.
ALTER ROLE app_user NOBYPASSRLS;

-- ----------------------------------------------------------------------------
-- readonly: SELECT-only (analytics, LGPD audit jobs)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'readonly') THEN
    CREATE ROLE readonly LOGIN PASSWORD 'readonly'
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$$;
ALTER ROLE readonly NOBYPASSRLS;

-- ----------------------------------------------------------------------------
-- Grants no database
-- ----------------------------------------------------------------------------
GRANT CONNECT ON DATABASE supademo TO app_user, app_owner, readonly;

-- ----------------------------------------------------------------------------
-- Grants nos schemas
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA app TO app_user, app_owner, readonly;
GRANT USAGE ON SCHEMA analytics TO app_user, app_owner, readonly;

-- app_owner precisa CREATE para aplicar DDL (migrations)
GRANT CREATE ON SCHEMA app TO app_owner;
GRANT CREATE ON SCHEMA analytics TO app_owner;

-- ----------------------------------------------------------------------------
-- Grants nas tabelas existentes
-- ----------------------------------------------------------------------------
-- app_user: CRUD (RLS será aplicado pelas policies + FORCE RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA analytics TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA analytics TO app_user;

-- app_owner: ALL (DDL + DML, BYPASSRLS já está setado)
GRANT ALL ON ALL TABLES IN SCHEMA app TO app_owner;
GRANT ALL ON ALL TABLES IN SCHEMA analytics TO app_owner;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app TO app_owner;
GRANT ALL ON ALL SEQUENCES IN SCHEMA analytics TO app_owner;

-- readonly: SELECT apenas
GRANT SELECT ON ALL TABLES IN SCHEMA app TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO readonly;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO readonly;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA analytics TO readonly;

-- ----------------------------------------------------------------------------
-- Default privileges (tabelas futuras criadas pelo app_owner)
-- ----------------------------------------------------------------------------
ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT ALL ON TABLES TO app_owner;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics
  GRANT ALL ON TABLES TO app_owner;

ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT ALL ON SEQUENCES TO app_owner;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics
  GRANT ALL ON SEQUENCES TO app_owner;

ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT SELECT ON TABLES TO readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics
  GRANT SELECT ON TABLES TO readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT USAGE, SELECT ON SEQUENCES TO readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics
  GRANT USAGE, SELECT ON SEQUENCES TO readonly;

-- =============================================================================
-- Sanity check: printa estado final dos roles
-- =============================================================================
SELECT
  rolname,
  rolsuper,
  rolbypassrls,
  rolcanlogin,
  rolcreatedb
FROM pg_roles
WHERE rolname IN ('app_owner', 'app_user', 'readonly')
ORDER BY rolname;