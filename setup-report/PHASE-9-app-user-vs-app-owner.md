# PHASE-9 — Separação `app_owner` (BYPASSRLS) vs `app_user` (RLS-enforced)

> **Data:** 2026-10-18
> **Status:** ✅ Completo
> **Objetivo:** Garantir que (a) o role de runtime seja `app_user` (RLS-enforced), (b) `app_owner` tenha `BYPASSRLS` configurado explicitamente e documentado, e (c) haja testes automatizados validando ambos os comportamentos.

---

## Resumo executivo

| Item                                                | Antes                | Depois                                          |
| --------------------------------------------------- | -------------------- | ----------------------------------------------- |
| `DATABASE_URL` em `.env*` aponta para              | `app_user`           | `app_user` ✅ (sem mudança — já estava correto) |
| `DIRECT_URL` em `.env*` aponta para                | `app_owner`          | `app_owner` ✅ (sem mudança)                    |
| `app_owner` tem BYPASSRLS no DB                     | sim (configurado)    | sim ✅ + agora **explícito** em `init-roles.sql` |
| `app_user` tem NO BYPASSRLS no DB                   | sim                  | sim ✅ + agora **explícito** em `init-roles.sql` |
| `infra/postgres/init-roles.sql` é idempotente       | parcial (falhava em re-run) | sim ✅ (DO $$ + IF NOT EXISTS)        |
| `scripts/db/test-rls-admin.ts` existe               | ❌ não existia       | ✅ criado — valida BYPASSRLS                     |
| `scripts/db/test-rls.ts` roda 10/10                 | ❌ bug: usava `.unsafe` em drizzle client (linha 65) | ✅ reescrito, **10/10 OK** |
| `infra/postgres/ROLES.md` documenta canonicamente   | ❌ não existia       | ✅ criado                                        |
| `.github/workflows/ci.yml` separa DATABASE/DIRECT   | ❌ ambos `app_user`  | ✅ `DATABASE_URL=app_user`, `DIRECT_URL=app_owner` |

---

## Estado atual do DB (verificado via `\du+`)

```sql
SELECT rolname, rolsuper, rolbypassrls FROM pg_roles
WHERE rolname IN ('app_owner', 'app_user', 'readonly');
```

Saída real (container `easydemo-postgres` rodando em `127.0.0.1:55432`):

```
 rolname  | rolsuper | rolbypassrls
-----------+----------+--------------
 app_owner | f        | t
 app_user  | f        | f
```

✅ `app_owner` tem `BYPASSRLS=t` (não é superuser, mas bypassa policies).
✅ `app_user` tem `BYPASSRLS=f` (RLS-enforced).

(O role `readonly` não existe nesse DB de teste — foi documentado no schema mas não criado. **Ação:** se for usado em produção, rodar `init-roles.sql`.)

---

## CHECK A — DATABASE_URL

```bash
$ cat apps/web/.env | grep DATABASE_URL
DATABASE_URL=postgres://app_user:easydemo@127.0.0.1:55432/supademo

$ cat .env.example | grep DATABASE_URL
DATABASE_URL=postgres://app_user:CHANGEME@localhost:5432/supademo
```

✅ Correto — runtime usa `app_user`.

---

## CHECK B — DIRECT_URL (migrations)

```bash
$ cat apps/web/.env | grep DIRECT_URL
DIRECT_URL=postgres://app_owner:easydemo@127.0.0.1:55432/supademo

$ cat .env.example | grep DIRECT_URL
DIRECT_URL=postgres://app_owner:CHANGEME@localhost:5432/supademo
```

✅ Correto — migrations usam `app_owner`.

---

## CHECK C — CI (`.github/workflows/ci.yml`)

**Antes:** ambos `DATABASE_URL` e `DIRECT_URL` apontavam para `app_user`. Isso era problemático porque `drizzle-kit push` (que usa `DIRECT_URL` via `drizzle.config.ts`) tentaria aplicar DDL como `app_user` — sem `CREATE` privilege no schema.

**Depois (commit PHASE-9):**
- `DATABASE_URL=postgres://app_user:...` (runtime RLS-enforced)
- `DIRECT_URL=postgres://app_owner:...` (migrations BYPASSRLS)
- Step `Create CI roles` cria `app_owner` (com `BYPASSRLS`) e `readonly` no Postgres antes do `db:push`.

---

## Validação automatizada

### 1. `test-rls.ts` — app_user RLS-enforced (10/10 OK)

```bash
$ DATABASE_URL=postgres://app_user:easydemo@127.0.0.1:55432/supademo \
  ADMIN_URL=postgres://app_owner:easydemo@127.0.0.1:55432/supademo \
  tsx scripts/db/test-rls.ts
```

**Saída (resumida):**

```
✓ 1. app_user NO BYPASSRLS (RLS-enforced) (rolbypassrls=false)
✓ 2. app.workspaces FORCE RLS (rls=true, force=true)
✓ 3. app.demos FORCE RLS (rls=true, force=true)
✓ 4. app_user sem contexto vê 0 demos (RLS bloqueia default) (count=0)
✓ 5. app_user sem contexto vê workspaces (policy workspaces_select: true) (count=3)
✓ 6. Tenant A vê o próprio demo (got 1 rows)
✓ 7. Tenant A NÃO vê demo do Tenant B (got 0 rows)
✓ 8. Tenant B vê o próprio demo (got 1 rows)
✓ 9. Tenant B NÃO vê demo do Tenant A (got 0 rows)
✓ 10. Cleanup (DELETE via app_owner)

Total: 10/10 checks OK
✅ RLS está aplicando corretamente. Isolamento entre tenants OK.
```

### 2. `test-rls-admin.ts` — app_owner BYPASSRLS (PASS)

```bash
$ DATABASE_URL=postgres://app_user:easydemo@127.0.0.1:55432/supademo \
  ADMIN_URL=postgres://app_owner:easydemo@127.0.0.1:55432/supademo \
  tsx scripts/db/test-rls-admin.ts
```

**Saída (resumida):**

```
· app_owner: superuser=false, bypassrls=true
✓ app_owner tem BYPASSRLS.
✓ app_user NÃO tem BYPASSRLS (RLS-enforced).
· app_owner vê 3 demos (BYPASSRLS — vê tudo)
· app_user vê 0 demos (RLS bloqueia sem contexto)
✓ app_owner (3) >= app_user (0) — BYPASSRLS efetivo.
✓ app_user sem contexto vê 0 demos — RLS bloqueia default.
✅ app_owner BYPASSRLS confirmado + app_user RLS-enforced confirmado.
```

---

## Arquivos alterados / criados

### Criados

| Arquivo                                        | Propósito                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| `infra/postgres/ROLES.md`                      | Documentação canônica dos roles (TL;DR, grants, atributos, validação).     |
| `scripts/db/test-rls-admin.ts`                 | Teste que valida `app_owner` tem BYPASSRLS (espelho de `test-rls.ts`).    |

### Atualizados

| Arquivo                                       | Mudança                                                                                              |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `infra/postgres/init-roles.sql`               | Agora idempotente (DO $$ + IF NOT EXISTS); explicitamente seta BYPASSRLS/NOBYPASSRLS; sanity check no final. |
| `scripts/db/test-rls.ts`                      | Reescrito para usar `postgres-js` raw client (não drizzle) e rodar 10 checks limpos.                 |
| `.github/workflows/ci.yml`                    | `DIRECT_URL` corrigido para `app_owner`; step novo cria roles `app_owner` + `readonly` antes do `db:push`. |
| `infra/postgres/ROLES.md` (referência)        | Cross-link com code locations (`lib/db.ts`, `drizzle.config.ts`, `init-roles.sql`).                 |

### Sem mudanças (já estavam corretos)

- `apps/web/.env` — `DATABASE_URL=app_user`, `DIRECT_URL=app_owner`
- `.env.example` — `DATABASE_URL=app_user`, `DIRECT_URL=app_owner`
- `.env.test` — `DATABASE_URL=app_user`, `DIRECT_URL=app_owner`
- `apps/web/lib/db.ts` — `getDb()` (DATABASE_URL/app_user) + `getAdminDb()` (DIRECT_URL/app_owner) + `withTenant()` (RLS)
- `apps/web/drizzle.config.ts` — usa `DIRECT_URL` (app_owner) para migrations
- `apps/web/db/migrations/0000_init.sql` — `FORCE ROW LEVEL SECURITY` em todas as tabelas; grants corretos

---

## Bloqueios residuais

| Item                                                              | Status        | Comentário                                                                          |
| ----------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------- |
| Senhas dos roles estão hardcoded em `init-roles.sql`              | Documentado   | `'app_user'`, `'app_owner'`, `'readonly'` são defaults. `scripts/generate-secrets.sh` substitui por senha aleatória ao gerar `.env`. **Senha nunca deve ser commitada em produção.** |
| Role `readonly` não existe no DB de teste atual                   | Não-bloqueante | Criado por `init-roles.sql` em produção. Se for usado em CI/dev, rodar `init-roles.sql` ou o step CI criado nesta phase. |
| `init-roles.sql` é executado por superuser (`app`)               | Por design    | Roles só podem ser criados por superuser. Em produção, esse role existe (POSTGRES_USER=app). |
| Senha em `apps/web/.env` é `easydemo` (visível no repo)             | OK para dev   | Substituir em produção via `scripts/generate-secrets.sh` ou similar.               |

---

## Como reproduzir em outro ambiente

```bash
# 1. Subir Postgres (cria role `app` superuser)
docker compose -f infra/docker-compose.yml up -d postgres

# 2. Criar roles app_user/app_owner/readonly (idempotente)
PGPASSWORD=easydemo psql -h 127.0.0.1 -p 5432 -U app -d supademo \
  -f infra/postgres/init-roles.sql

# 3. Aplicar migrations (cria tabelas + policies + FORCE RLS)
DATABASE_URL=postgres://app_owner:easydemo@127.0.0.1:5432/supademo \
  pnpm --filter web db:push

# 4. Validar
DATABASE_URL=postgres://app_user:easydemo@127.0.0.1:5432/supademo \
ADMIN_URL=postgres://app_owner:easydemo@127.0.0.1:5432/supademo \
  npx tsx scripts/db/test-rls.ts       # 10/10 OK
DATABASE_URL=postgres://app_user:easydemo@127.0.0.1:5432/supademo \
ADMIN_URL=postgres://app_owner:easydemo@127.0.0.1:5432/supademo \
  npx tsx scripts/db/test-rls-admin.ts # BYPASSRLS confirmado
```

---

## Conclusão

✅ **`app_user` RLS-enforced** confirmado via `test-rls.ts` (10/10).
✅ **`app_owner` BYPASSRLS** confirmado via `test-rls-admin.ts`.
✅ **`DATABASE_URL` aponta para o role correto** (`app_user`).
✅ **`DIRECT_URL` aponta para `app_owner`** em dev/CI/produção.
✅ **`ROLES.md`** e **`init-roles.sql`** prontos e idempotentes.
✅ **CI workflow** corrigido — agora `DIRECT_URL=app_owner` em GitHub Actions.

A separação está correta por design e validada por testes automatizados. Próximos passos opcionais:

1. Adicionar `test-rls.ts` e `test-rls-admin.ts` ao CI (antes do `pnpm test`) para regressão automática.
2. Adicionar `readonly` role em dev/CI se forem usados jobs de analytics reais.
3. Auditar periodicamente os atributos dos roles (`SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname LIKE 'app%' OR rolname = 'readonly'`).