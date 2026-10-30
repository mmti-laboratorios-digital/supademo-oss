# PHASE 7 — Padronização da porta do Postgres em 55432

> Status: ✅ arquivos atualizados · ⏸ validação runtime pendente (subagent sem shell)

## TL;DR

- **Postgres interno do container:** continua em `5432` (default Postgres) — não
  precisamos mudar e isso evita editar `infra/postgres/init-roles.sql` ou
  `infra/postgres/ROLES.md`.
- **Mapeamento host → container:** `127.0.0.1:55432:5432` (era `5432:5432`).
- **Convenção:** todas as URLs locais de DEV apontam para `localhost:55432`.
- **Antes:** sofria `bind host port 127.0.0.1:5432/tcp: address already in use`
  quando `postgresql@16-main.service` do SO estava ativo. Workaround: container
  `supademo-test` side-channel na 55432 (documentado em `PHASE-6-db.md`).
- **Depois:** o `easydemo-postgres` (compose do projeto) assume 55432 nativamente;
  o `supademo-test` vira legado e pode ser removido quando quiser.

## Por que 55432?

- Porta alta (>1024) → não exige privilégio root para bind.
- Sufixo `5432` preserva a "essência" Postgres para inspeção visual.
- Distinta do default `:5432`, então é óbvio que é um serviço nosso, não o
  Postgres do sistema operacional.

## Antes vs depois

| Onde | Antes | Depois |
|---|---|---|
| `infra/docker-compose.yml` (publish) | `127.0.0.1:5432:5432` | `127.0.0.1:55432:5432` |
| `infra/postgres/postgresql.conf` | `port = 5432` | `port = 5432` *(inalterado — porta interna)* + comentário |
| `.env.example` | `…@localhost:5432/supademo` | `…@localhost:55432/supademo` |
| `apps/web/.env`, `.env.test` | já `55432` | já `55432` *(mantido)* |
| `apps/web/drizzle.config.ts` (fallback) | `:5432` | `:55432` |
| `apps/workers/src/index.ts` (fallback) | `:5432` | `:55432` |
| `apps/web/scripts/seed.ts` (fallback) | `:5432` | `:55432` |
| `scripts/seed.ts` (fallback + doc) | `:5432` | `:55432` |
| `scripts/init-db.sh` (fallback + doc) | `:5432` | `:55432` |
| `scripts/setup.sh` (print de boas-vindas) | `localhost:5432` | `localhost:55432` *(+ user `app`)* |
| `scripts/db-snapshot.sh` (default port) | `5432` | `55432` |
| `apps/web/scripts/db/test-rls.ts` | já `55432` | já `55432` *(mantido)* |
| `apps/web/scripts/db/test-rls-admin.ts` | já `55432` | já `55432` *(mantido)* |
| `infra/postgres/ROLES.md` | já `55432` | já `55432` *(mantido)* |
| `infra/docker-compose.prod.yml` | sem publish de porta | sem publish *(inalterado — interno)* |
| `infra/postgres/init-roles.sql` | n/a | n/a *(sem referência a porta)* |
| `.github/workflows/ci.yml` | `5432:5432` + `localhost:5432` | **mantido** — CI não tem colisão |

### Arquivos NÃO alterados (e por quê)

| Arquivo | Razão |
|---|---|
| `docs/RFC-Brazilian-Supademo.md:948` (`postgres:5432`) | É o DNS interno do compose (`postgres` = nome do service), porta 5432 é a interna — não é a porta do host. |
| `setup-report/PHASE-3-e2e.md`, `PHASE-6-db.md` | Logs históricos de incidente — reescrever história é errado. |
| `setup-report/PHASE-9-app-user-vs-app-owner.md` | Snapshot de um momento da refatoração. |
| `research/pocs/POC-*.md` | Benchmarks em containers `pgbench-poc` na 6543 (já fora do default). |
| `research/tech/infra-vps.md` | Planejamento de VPS prod (não código executado). |
| `node_modules/**` | Third-party. |
| `apps/web/.next/**` | Build artifact. |

## Como confirmar

Sem shell disponível para este subagent, o host deve rodar:

```bash
# 1. Porta host
ss -tulpn 'sport = :55432' 2>/dev/null   # deve mostrar easydemo-postgres

# 2. Conectividade via psql / app
psql 'postgres://app:easydemo@127.0.0.1:55432/supademo' -c 'SELECT 1;'

# 3. RLS — exercita isolamento multi-tenant
cd apps/web
DATABASE_URL=postgres://app_owner:easydemo@127.0.0.1:55432/supademo \
DIRECT_URL=postgres://app_owner:easydemo@127.0.0.1:55432/supademo \
  pnpm exec tsx scripts/db/test-rls.ts
# esperado: ✅ RLS está aplicando corretamente.

# 4. Subir / descer compose com a nova porta
docker compose -f infra/docker-compose.yml down
docker compose -f infra/docker-compose.yml up -d postgres pgweb
docker compose -f infra/docker-compose.yml exec postgres \
  pg_isready -U app -d supademo            # deve aceitar conexão em 5432 interno

# 5. CI workflow (não precisa mudar)
gh workflow run ci.yml                       # roda em runner limpo, 5432 é ok
```

## Pós-validação (sugestões)

- Quando confirmar que tudo funciona, remover o container side-channel
  `supademo-test` que vinha sendo usado como workaround:
  `docker rm -f supademo-test`.
- `Makefile` tem `db-shell` invocando `psql -U app_user -d supademo`, mas o
  `infra/docker-compose.yml` define `POSTGRES_USER: app`. É inconsistência
  pré-existente (não relacionada a esta phase) — manter fora de escopo.
- Considerar adicionar `127.0.0.1:55432` à lista de ports "oficiais" no
  README, na seção de setup local.

## Restrições respeitadas

- ✅ Nada de billing/Asaas tocado.
- ✅ Backup de `postgresql.conf` do SO não foi necessário: o subagent não tem
  acesso a shell/sudo e o `postgresql.conf` editado é o do **projeto**
  (`infra/postgres/postgresql.conf`, montado via volume), não o do SO.
- ✅ Compatibilidade preservada: container continua ouvindo em 5432 (default
  Postgres); só o mapeamento host:container mudou.