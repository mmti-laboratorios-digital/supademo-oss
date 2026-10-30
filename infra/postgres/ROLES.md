# Postgres Roles — EasyDemo

Documentação canônica dos roles do Postgres. Qualquer mudança em roles/grants deve ser refletida aqui.

> **Last reviewed:** PHASE-9 (app_user vs app_owner separation).

---

## TL;DR

| Role        | Uso                                | BYPASSRLS | Acesso                          | URL/Connection                     |
| ----------- | ---------------------------------- | --------- | ------------------------------- | ---------------------------------- |
| `app_owner` | migrations, webhooks, jobs async   | **SIM**   | ALL (DDL + DML cross-tenant)    | `DIRECT_URL` no app code           |
| `app_user`  | runtime Next.js + worker           | **NÃO**   | CRUD (RLS-enforced)             | `DATABASE_URL` no app code         |
| `readonly`  | analytics, LGPD audit jobs         | **NÃO**   | SELECT apenas                   | (não usado em runtime do app code) |
| `app`       | superuser interno do container     | **SIM**   | Tudo (criar roles, DBs, etc.)   | apenas em docker-compose / setup   |

> ⚠️ **`app` é o superuser criado pelo `POSTGRES_USER`** no `infra/docker-compose.yml`.
> Ele existe APENAS para bootstrap (criar roles, rodar init-roles.sql). **Nunca** use em app code.

---

## Por que separar `app_owner` e `app_user`?

O ponto crítico do design de segurança multi-tenant é que **RLS só funciona se o role que faz as queries de runtime tiver o GUC `app.current_tenant_id` setado em cada request** (via `withTenant()` em `apps/web/lib/db.ts`).

Quando um role tem `BYPASSRLS=t`, **todas as policies são ignoradas**. Isso é desejável para:

- **Migrations**: rodam DDL sem contexto de tenant — sem BYPASSRLS, elas falhariam em tabelas com FORCE ROW LEVEL SECURITY.
- **Webhooks**: payments, integrações, jobs assíncronos — operam cross-tenant por design.
- **Seeds e admin scripts**: precisam inserir dados sem `SET app.current_tenant_id`.

Mas é **perigoso** para queries de runtime — se o app conectasse como `app_owner`, **todo o RLS seria ignorado** e qualquer bug em `withTenant()` viraria vazamento de dados entre tenants.

**Por isso a separação é obrigatória**:

```
runtime   → app_user (RLS-enforced)  ← DATABASE_URL
admin/ops → app_owner (BYPASSRLS)    ← DIRECT_URL
```

---

## Como conectar em cada caso

### Runtime (Next.js server, worker, scripts de leitura)

```bash
DATABASE_URL=postgres://app_user:<password>@host:port/easydemo
```

- `app_user` recebe `app.current_tenant_id` via `SET LOCAL` dentro de uma transação (`withTenant()`).
- RLS aplica: cada query só vê dados do tenant do request.
- `FORCE ROW LEVEL SECURITY` está ativo em **todas** as 13 tabelas de `app.*`.

### Migrations / DDL / Webhooks / Jobs

```bash
DIRECT_URL=postgres://app_owner:<password>@host:port/easydemo
```

- `app_owner` tem `BYPASSRLS=t` — ignora policies.
- Pode aplicar DDL (`CREATE TABLE`, `ALTER TABLE`) — recebeu `GRANT CREATE ON SCHEMA app`.
- Use para: `drizzle-kit push`, `drizzle-kit migrate`, scripts de seed, webhooks Asaas/Stripe, cron jobs.

### Admin / DBA (não usar em app code)

```bash
psql -U app -d easydemo          # superuser interno do container
```

---

## Grants concedidos (resumo)

```sql
-- database
GRANT CONNECT ON DATABASE easydemo TO app_user, app_owner, readonly;

-- schemas
GRANT USAGE   ON SCHEMA app        TO app_user, app_owner, readonly;
GRANT USAGE   ON SCHEMA analytics  TO app_user, app_owner, readonly;
GRANT CREATE  ON SCHEMA app        TO app_owner;     -- migrations
GRANT CREATE  ON SCHEMA analytics  TO app_owner;     -- migrations

-- app_user: CRUD (RLS-enforced)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app        TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA analytics  TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app        TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA analytics  TO app_user;

-- app_owner: ALL (BYPASSRLS já setado)
GRANT ALL ON ALL TABLES    IN SCHEMA app        TO app_owner;
GRANT ALL ON ALL TABLES    IN SCHEMA analytics  TO app_owner;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app        TO app_owner;
GRANT ALL ON ALL SEQUENCES IN SCHEMA analytics  TO app_owner;

-- readonly: SELECT apenas
GRANT SELECT ON ALL TABLES    IN SCHEMA app        TO readonly;
GRANT SELECT ON ALL TABLES    IN SCHEMA analytics  TO readonly;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app        TO readonly;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA analytics  TO readonly;
```

Default privileges estão configurados para que **tabelas futuras** (criadas via migrations) herdem os grants corretos.

---

## Atributos por role (output de `\du+` no DB)

```
                                    List of roles
 Role name |                         Attributes                         | Description
-----------+------------------------------------------------------------+-------------
 app       | Superuser, Create role, Create DB, Replication, Bypass RLS |
 app_owner | Bypass RLS                                                 |
 app_user  |                                                            |
```

**Validações críticas**:

| Role       | `rolsuper` | `rolbypassrls` | Por quê                                                                                   |
| ---------- | ---------- | -------------- | ----------------------------------------------------------------------------------------- |
| `app_user` | `false`    | `false`        | runtime RLS-enforced — **nunca** pode bypassar policies                                    |
| `app_owner`| `false`    | `true`         | migrations/jobs precisam ignorar policies; não é superuser (princípio do menor privilégio) |
| `readonly` | `false`    | `false`        | SELECT-only + RLS-enforced (LGPD)                                                          |

---

## Como validar

```bash
# 1. app_user RLS-enforced: 10/10 checks
DATABASE_URL=postgres://app_user:easydemo@127.0.0.1:55432/easydemo \
ADMIN_URL=postgres://app_owner:easydemo@127.0.0.1:55432/easydemo \
  tsx scripts/db/test-rls.ts

# 2. app_owner BYPASSRLS: confirma que ele lê cross-tenant
DATABASE_URL=postgres://app_user:easydemo@127.0.0.1:55432/easydemo \
ADMIN_URL=postgres://app_owner:easydemo@127.0.0.1:55432/easydemo \
  tsx scripts/db/test-rls-admin.ts

# 3. Atributos no DB
psql -U app_owner -d easydemo -c "SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname IN ('app_owner','app_user','readonly') ORDER BY rolname;"
```

Saída esperada:

```
 rolname  | rolsuper | rolbypassrls
-----------+----------+--------------
 app_owner | f        | t
 app_user  | f        | f
 readonly  | f        | f
```

---

## Onde cada role é usado no código

| Arquivo                                      | URL/role           | Comentário                                          |
| -------------------------------------------- | ------------------ | --------------------------------------------------- |
| `apps/web/.env` (`DATABASE_URL`)             | `app_user`         | runtime — RLS-enforced                              |
| `apps/web/.env` (`DIRECT_URL`)               | `app_owner`        | migrations, webhooks, jobs                          |
| `apps/web/lib/db.ts` (`getDb()`)             | `DATABASE_URL`     | runtime                                             |
| `apps/web/lib/db.ts` (`getAdminDb()`)       | `DIRECT_URL`       | admin — **NÃO usar em runtime de request**          |
| `apps/web/lib/db.ts` (`withTenant()`)        | `DATABASE_URL`     | runtime + SET LOCAL app.current_tenant_id           |
| `apps/web/drizzle.config.ts`                 | `DIRECT_URL`       | `drizzle-kit` (migrations)                          |
| `scripts/db/test-rls.ts`                     | ambos              | valida isolamento (10 checks)                       |
| `scripts/db/test-rls-admin.ts`               | ambos              | valida BYPASSRLS do app_owner                       |
| `apps/web/scripts/seed-test.ts`              | `app_owner`        | seed cross-tenant                                   |
| `apps/web/app/api/__tests__/*.integration.*` | ambos              | tests E2E que precisam semear e validar RLS         |
| `.github/workflows/ci.yml`                   | `app_user`         | ⚠️ `DIRECT_URL` em CI também aponta p/ `app_user` — ver PHASE-9 |

---

## Boas práticas

1. **NUNCA** referencie `app_owner` em código de runtime (API routes, server components, `getDb()` callers).
2. **SEMPRE** passe `withTenant(orgId, fn)` em runtime — NUNCA chame `getDb()` direto em rotas multi-tenant.
3. **Sempre** aplique `FORCE ROW LEVEL SECURITY` em tabelas multi-tenant — sem isso, `app_owner` (BYPASSRLS) ignora, mas o perigo é esquecer de setar.
4. **Verifique periodicamente** que `app_user` continua com `rolbypassrls=f` (rodar `test-rls.ts` em CI).
5. **Não exponha** `DIRECT_URL` para o front-end. Use apenas em server-side / migrations.

---

## Histórico de mudanças

| Data       | Mudança                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| PHASE-9    | Documentação canônica. Roles `app_owner` (BYPASSRLS), `app_user`, `readonly`. |
| PHASE-6    | Separação inicial `getDb()` (app_user) vs `getAdminDb()` (app_owner).     |
| Initial    | Roles criados em `scripts/init-db.sh` (versão antiga).                    |