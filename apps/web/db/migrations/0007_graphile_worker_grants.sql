-- 0007_graphile_worker_grants.sql
--
-- Dá ao `app_user` (role de runtime) acesso ao schema da fila do
-- graphile-worker.
--
-- Contexto: o graphile-worker cria o schema `graphile_worker` e as tabelas
-- `_private_jobs`, `_private_known_crontabs`, `_private_task_queues` e
-- `_private_tasks` na primeira execução. A instalação precisa de DDL — o
-- role `app_user` não tem, então o worker faz o `migrate()` com o
-- `DIRECT_URL` (app_owner, BYPASSRLS).
--
-- ⚠️ **Mas o worker OPERA a fila com o `DATABASE_URL` (app_user)**, e sem os
-- grants abaixo ele falha no boot com:
--
--   ERROR: permission denied for schema graphile_worker (42501)
--
-- O `app_user` precisa de USAGE no schema + CRUD nas tabelas da fila. São
-- tabelas internas do worker (sem dado de tenant), então não há risco de
-- RLS: o isolamento multi-tenant do EasyDemo vive em `app.*`.
--
-- ⚠️ A ordem importa: o schema `graphile_worker` só existe **depois** que o
-- worker rodou uma vez (ou que o `migrate()` foi executado). Por isso o
-- `DO $$` abaixo só aplica os grants se o schema existir — e o
-- `init-roles.sql` cobre o caso de um banco novo (lá o schema é criado
-- junto).
--
-- ⚠️ `GRANT ALL ON ALL TABLES` cobre apenas as tabelas existentes no momento
-- do comando. As tabelas futuras (novas versões do graphile-worker) são
-- cobertas pelo `ALTER DEFAULT PRIVILEGES` abaixo.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'graphile_worker') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA graphile_worker TO app_user, app_owner, readonly';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA graphile_worker TO app_user';
    EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA graphile_worker TO app_user';
    EXECUTE 'GRANT ALL ON ALL TABLES IN SCHEMA graphile_worker TO app_owner';
    EXECUTE 'GRANT ALL ON ALL SEQUENCES IN SCHEMA graphile_worker TO app_owner';
    EXECUTE 'GRANT SELECT ON ALL TABLES IN SCHEMA graphile_worker TO readonly';
    EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA graphile_worker TO readonly';

    -- Tabelas futuras criadas pelo app_owner (adicionadas pelo migrate do worker).
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA graphile_worker GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA graphile_worker GRANT USAGE, SELECT ON SEQUENCES TO app_user';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA graphile_worker GRANT ALL ON TABLES TO app_owner';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA graphile_worker GRANT ALL ON SEQUENCES TO app_owner';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA graphile_worker GRANT SELECT ON TABLES TO readonly';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA graphile_worker GRANT USAGE, SELECT ON SEQUENCES TO readonly';
  END IF;
END
$$;
