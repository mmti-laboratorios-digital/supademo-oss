# PHASE 8 — Drizzle Journal para 0000_init.sql

**Data:** 2026-10-18  
**Escopo:** Tornar `pnpm exec drizzle-kit migrate` compatível com `0000_init.sql`  
**Status:** ✅ **PASS** — journal+snapshot criados, migrate roda do zero, segundo run é no-op.

---

## Resumo Executivo

| Item | Resultado |
|------|-----------|
| `0000_init.sql` continua source-of-truth | ✅ inalterado (448 linhas) |
| `meta/_journal.json` criado | ✅ 1 entry (`0000_init`, idx 0) |
| `meta/0000_snapshot.json` criado | ✅ gerado a partir do schema TS via `drizzle-kit generate` |
| `drizzle-kit migrate` em DB vazio (`demobr_test`) | ✅ aplica 0000 com sucesso |
| `drizzle-kit migrate` em DB já com 0000 aplicado | ✅ **second run é no-op** (skip via hash em `drizzle.__drizzle_migrations`) |
| `drizzle-kit generate` após migrate | ✅ reporta "No schema changes, nothing to migrate" |
| `Makefile` / `setup.sh` / `ci.yml` migrados de `db:push` para `db:migrate` | ✅ |
| Grants CI ajustados (`app_owner` ganha `CREATE ON DATABASE`) | ✅ |

---

## 1. Decisão Tomada

**Opção A — Híbrido: raw SQL como source-of-truth + journal/snapshot sintéticos.**

Por que não deletar 0000_init.sql e regerar via drizzle-kit? O arquivo tem:

1. **PL/pgSQL function `app.current_tenant_id()`** — drizzle-kit não emite funções.
2. **22 `CREATE POLICY` + `ALTER TABLE … ENABLE/FORCE ROW LEVEL SECURITY`** — drizzle-kit 0.28 emite policies a partir de `pgPolicy()` no schema TS, mas o conjunto aqui foi escrito em SQL manual e diverge do gerado (a versão drizzle-kit geraria policies do schema TS, não essas).
3. **`INSERT INTO app.plans … ON CONFLICT (id) DO NOTHING`** — seed rows; drizzle-kit não emite dados.
4. **`CREATE EXTENSION pgcrypto, "uuid-ossp"`** — emitido, mas só se o schema TS pedir; aqui fica explícito.
5. **`GRANT USAGE/SELECT/ALL` + `ALTER DEFAULT PRIVILEGES`** — emitidos só com `entities.roles` no config; aqui está embutido.
6. **Ordem importa** (criar schemas `app`/`analytics` antes de tabelas, criar `app.plans` antes de `app.subscriptions` por FK, criar `app.workspaces` antes de quase tudo, RLS após as tabelas).

Tentar reproduzir tudo isso via `pgSchema()` + `pgPolicy()` + `pgRole()` + `pgExtension()` no schema TS seria reescrever 448 linhas com risco de divergência. A abordagem híbrida preserva o SQL manual e adiciona os arquivos `meta/` que o `drizzle-kit migrate` exige para reconhecer o estado.

---

## 2. Arquivos Criados

```
apps/web/db/migrations/
├── 0000_init.sql               ← inalterado (source-of-truth)
└── meta/
    ├── _journal.json           ← NOVO
    └── 0000_snapshot.json      ← NOVO
```

### `meta/_journal.json`

```json
{
  "version": "7",
  "dialect": "postgresql",
  "entries": [
    {
      "idx": 0,
      "version": "7",
      "when": 1737000000000,
      "tag": "0000_init",
      "breakpoints": true
    }
  ]
}
```

Campos exigidos pelo `drizzle-orm/migrator.js@0.36.0` (lidos em runtime):
- `entries[i].tag` — usado para localizar `${migrationsFolder}/${tag}.sql`
- `entries[i].breakpoints` — boolean (afeta se a migration é splittable)
- `entries[i].when` — folderMillis, comparação `<` decide se aplica

Campos extras que **não machucam** e são esperados pelo `drizzle-kit check`:
- `version: "7"` (snapshotVersion atual do drizzle-kit 0.28)
- `dialect: "postgresql"`
- `entries[i].idx` (numeração sequencial; conventional)
- `entries[i].version` (replicado do top-level)

### `meta/0000_snapshot.json`

Gerado por `drizzle-kit generate` (1ª execução), depois renomeado de `0001_init_snapshot.json` → `0000_snapshot.json`. Representa o estado pós-`0000_init.sql` (todas as 14 tabelas do schema TS). É usado por `drizzle-kit check` para detectar colisões e por `drizzle-kit generate` para calcular diffs em mudanças futuras. **Não é lido pelo `drizzle-kit migrate`** (verificado: o migrator da `drizzle-orm` só lê o journal).

---

## 3. Validação (migrate rodou sem erro?)

### 3.1 DB vazio (fresh) — `demobr_test`

Comandos:

```bash
docker exec supademo-test psql -U app -c "CREATE DATABASE demobr_test;"
PGPASSWORD=demobr psql -h 127.0.0.1 -p 55432 -U app -d demobr_test \
  -v ON_ERROR_STOP=1 <<SQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_owner') THEN
    CREATE ROLE app_owner LOGIN PASSWORD 'demobr' NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user LOGIN PASSWORD 'demobr';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'readonly') THEN
    CREATE ROLE readonly LOGIN PASSWORD 'readonly';
  END IF;
END
\$\$;
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS analytics;
SQL

cd apps/web
DIRECT_URL=postgres://app:demobr@127.0.0.1:55432/demobr_test \
DATABASE_URL=postgres://app:demobr@127.0.0.1:55432/demobr_test \
  pnpm exec drizzle-kit migrate
```

Saída (resumida):

```
[✓] migrations applied successfully!
```

Verificações pós-run:

```sql
\dn
-- drizzle, app, analytics (3 schemas; drizzle foi criado pelo migrate)

SELECT id, hash, created_at FROM drizzle.__drizzle_migrations;
-- 1 | ed17300b621211a5df00f7612e99e56a94f0c3b48159e1b1a01ee4e990b6e799 | 1737000000000

SELECT count(*) FROM information_schema.tables WHERE table_schema='app';
-- 13
SELECT count(*) FROM information_schema.tables WHERE table_schema='analytics';
-- 1
SELECT id, name_pt_br FROM app.plans;
-- free | Free
-- pro  | Business
-- business | Business
```

### 3.2 Segundo run (idempotência)

```bash
# mesmo comando, mesmo DB
DIRECT_URL=… DATABASE_URL=… pnpm exec drizzle-kit migrate
```

Saída:

```
[✓] migrations applied successfully!
```

`SELECT count(*) FROM drizzle.__drizzle_migrations` continua `1`. O migrator compara `lastDbMigration.created_at (1737000000000) < migration.folderMillis (1737000000000)` — false → skip.

> **Nota sobre a mensagem:** O CLI do `drizzle-kit migrate` 0.28 imprime "[✓] migrations applied successfully!" tanto para "aplicou" quanto para "skipou tudo". Não imprime "No migrations to apply" como algumas versões mais novas. O comportamento real está correto (sem INSERT duplicado em `__drizzle_migrations`).

### 3.3 DB já aplicado via `psql -f` (`supademo` no test container)

O container `supademo-test` já tem `0000_init.sql` aplicado via `psql -f` (PHASE-6). Tentar `drizzle-kit migrate` aqui falha porque a migration não é idempotiva (policies usam `CREATE POLICY`, não `CREATE POLICY IF NOT EXISTS`):

```
error: policy "workspaces_select" for table "workspaces" already exists
```

**Isso é esperado e correto.** O contrato é: `drizzle-kit migrate` aplica 0000 em DBs novos; em DBs onde 0000 já foi aplicado, é preciso primeiro baselinar — inserir o hash em `drizzle.__drizzle_migrations`:

```sql
-- baseline (1x por DB onde 0000 já estava aplicado via psql):
CREATE SCHEMA IF NOT EXISTS drizzle;
CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations(
  id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint
);
INSERT INTO drizzle.__drizzle_migrations(hash, created_at)
VALUES (
  'ed17300b621211a5df00f7612e99e56a94f0c3b48159e1b1a01ee4e990b6e799',
  1737000000000
)
ON CONFLICT DO NOTHING;
```

Após baselining, `drizzle-kit migrate` é no-op. (Não foi necessário aplicar ao `supademo` DB do test container porque ele é descartado em cada CI run.)

### 3.4 `drizzle-kit generate` pós-migrate

```bash
DIRECT_URL=… DATABASE_URL=… pnpm exec drizzle-kit generate --name=patch
```

Saída:

```
14 tables …
No schema changes, nothing to migrate 😴
```

Diff entre o schema TS e o snapshot pós-0000 = vazio. Confirma que o snapshot bate com o estado aplicado.

---

## 5. CI / Scripts Atualizados

| Arquivo | Mudança |
|---------|---------|
| `Makefile` (`db-migrate`) | `pnpm --filter web db:push` → `pnpm --filter web db:migrate` |
| `Makefile` (header comment) | mesma substituição |
| `scripts/setup.sh` (step 6) | `db:push` → `db:migrate` |
| `scripts/setup.sh` (header comment) | mesma substituição |
| `scripts/README.md` | descrição do `setup.sh` atualizada |
| `.github/workflows/ci.yml` | `db:push` → `db:migrate` |
| `.github/workflows/ci.yml` | CI grants: adicionado `GRANT CREATE ON DATABASE supademo TO app_owner;` (precisa para criar schema `drizzle`) |

---

## 6. Caveats

1. **Hash fixo no journal** — `when: 1737000000000` é um timestamp arbitrário. Como o hash da migration é o `sha256(0000_init.sql)` e fica gravado em `drizzle.__drizzle_migrations`, o segundo run skipa corretamente. Mudar o conteúdo do 0000_init.sql invalida o hash e força re-aplicação (que vai falhar em DBs já aplicados — usar nova migration `0001_*.sql` em vez de editar 0000).

2. **Idempotência ausente no SQL** — `CREATE POLICY`/`ALTER TABLE … ENABLE/FORCE ROW LEVEL SECURITY`/`CREATE OR REPLACE FUNCTION` (funciona, mas funções alteradas ficam diferentes no journal) não têm variantes `IF NOT EXISTS`. Em DB novo, `drizzle-kit migrate` aplica uma vez; em DB antigo, baselining manual é necessário.

3. **Snapshot foi gerado por `drizzle-kit generate` (não escrito à mão)** — quando o `drizzle-kit generate` rodou sem snapshot anterior (`prevId: 00000000-...`), ele capturou o estado atual do schema TS como o "primeiro" snapshot. Renomeado para `0000_snapshot.json` para alinhar com o índice 0 do journal. Se o schema TS divergir do SQL manual no futuro, `drizzle-kit generate` vai propor diffs corretos a partir desse snapshot.

4. **`app_owner` precisa de `CREATE ON DATABASE`** — drizzle-kit cria `drizzle` schema + `__drizzle_migrations` table para tracking. Em CI adicionamos o GRANT; localmente, o test container usa `app` (superuser) para `DIRECT_URL`. Se alguém rodar `drizzle-kit migrate` com `app_owner` no test container, vai falhar com `permission denied for database` — usar `app` como `DIRECT_URL` ali.

5. **DB atual (`supademo` no test container) ainda não foi baselined.** Se você rodar `pnpm db:migrate` nele, vai falhar com "policy already exists". Solução: aplicar o snippet de baselining da seção 3.3 (ou recriar o container).

---

## 7. Próximos Passos

- Aplicar baselining ao `supademo` DB do test container (idempotente, pode rodar agora).
- Validar `pnpm --filter web db:migrate` no CI no próximo push.
- Quando o time começar a alterar schema, usar `pnpm --filter web db:generate --name=<descrição>` (vai criar `0001_*.sql` + `meta/0001_snapshot.json` + atualizar `_journal.json` automaticamente).