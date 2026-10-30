# Scripts operacionais — EasyDemo

Este diretório contém scripts de provisionamento, validação e manutenção do
ambiente EasyDemo. Todos são idempotentes (podem rodar várias vezes sem efeito
colateral) e imprimem mensagens coloridas com `[ok]`/`[warn]`/`[err]`.

## TL;DR

```bash
# 1. Provisionar ambiente local do zero
bash scripts/setup.sh

# 2. Derrubar tudo (containers; volumes só com confirmação)
bash scripts/teardown.sh

# 3. Health check pós-deploy
bash scripts/health-check.sh                       # exit 0/1/2

# 4. Snapshot sob demanda (diferente do pgBackRest, que é cron)
bash scripts/db-snapshot.sh --upload-r2

# 5. DR drill (provisiona VPS temp na Hetzner)
SLACK_WEBHOOK_URL=https://hooks.slack.com/... bash scripts/restore-drill.sh

# 6. Gate de pré-deploy (lint + typecheck + tests + migration check)
bash scripts/pre-deploy.sh           # completo
bash scripts/pre-deploy.sh --fast    # só lint + typecheck

# 7. Provisionar VPS na Hetzner
bash scripts/provision-hetzner.sh    # gera infra/cloud-init.yaml

# 8. Provisionar R2 + CDN no Cloudflare
bash scripts/setup-cloudflare.sh
```

## Índice

| Script                              | Categoria      | Descrição                                                                 |
|-------------------------------------|----------------|---------------------------------------------------------------------------|
| `setup.sh`                          | bootstrap      | Setup local do zero (deps + docker + db:migrate + seed)                     |
| `teardown.sh`                       | bootstrap      | Derruba containers e (opcionalmente) volumes                              |
| `init-db.sh`                        | bootstrap      | Cria roles, schemas e força RLS (idempotente)                             |
| `provision-hetzner.sh`              | infra-prod     | Cria VPS via hcloud + gera `cloud-init.yaml` (Docker, UFW, Caddy, f2b)    |
| `setup-cloudflare.sh`               | infra-prod     | Provisiona R2 buckets + API token + custom domain `cdn.easydemo.io`           |
| `health-check.sh`                   | monitor        | GET `/api/health` com exit codes (0 ok / 1 degraded / 2 down)             |
| `db-snapshot.sh`                    | backup         | `pg_dump` sob demanda → `./backups/db-*.sql.gz`                           |
| `restore-drill.sh`                  | DR             | DR drill: VPS temp na Hetzner + restore + notifica Slack                  |
| `generate-secrets.sh`               | segurança      | 32-byte secrets base64 para ENCRYPTION_KEY, CLERK_*, SESSION_*, etc.      |
| `pre-deploy.sh`                     | CI/CD          | Gate de pré-deploy (lint/typecheck/test/branch/migrations)                |
| `seed.ts` (em `apps/web/scripts/`)  | dev            | Popula workspace demo, 3 demos, 1 lead                                    |
| `migrate-from-guiaflow.ts`          | dev            | Importa export GuiaFlow (formato llms.txt) via `/api/v1/demos`            |
| `test-pii-redaction.ts`             | teste          | Pipeline OCR + regex → blur de CPF/e-mail/telefone/cartão                 |
| `test-webhook-asaas.ts`             | teste          | POST webhook Asaas + valida idempotência                                  |
| `test-rls.ts` + `test-rls.sh`       | teste          | Verifica RLS multi-tenant (tenant A não lê dados de B)                    |
| `smoke-test.sh`                     | teste          | Smoke test URLs públicas com timeout 5s                                   |

## Precedência de paths

- Todos os scripts carregam `.env` automaticamente (se existir no diretório raiz).
- `DATABASE_URL` é parseada para extrair `user/password/host/port/db`.
- Containers docker (`easydemo-postgres`) são detectados e usados preferencialmente.

## Pré-requisitos comuns

- Linux ou macOS
- `bash >= 4.4`, `curl`, `openssl` (ou `/dev/urandom`)
- `docker` 24+ com daemon rodando
- `node` 22+, `pnpm` 9+ (para `pnpm install`)
- `hcloud` (opcional, só para `provision-hetzner.sh` / `restore-drill.sh`)
- `wrangler` (opcional, só para `setup-cloudflare.sh`)
- `jq` (recomendado; sem ele os scripts caem em fallback regex)

## Filosofia

1. **Idempotência**: rodar 2× não dá erro.
2. **Sem prompts invisíveis**: tudo que precisa confirmação pergunta.
3. **Cores ANSI**: `[ok]` verde, `[warn]` amarelo, `[err]` vermelho.
4. **Exit codes precisos**: 0 = ok, 1 = degradado, 2 = erro de setup.
5. **Falha local, log global**: tudo no stderr, resumo no stdout.
6. **Sem estado global fora de `.env`**: secrets ficam em `.env` (com backup `.bak`).

## Onde os dados vão?

| Destino                  | Conteúdo                              | Rotação                       |
|--------------------------|---------------------------------------|-------------------------------|
| `.env`                   | Secrets locais                         | manual                        |
| `./backups/db-*.sql.gz`  | Snapshots sob demanda                 | 30 últimos (auto)             |
| R2 `snapshots/`          | Snapshots após `--upload-r2`          | depende de lifecycle policy   |
| R2 `demo-backups/`       | pgBackRest (full + WAL)               | 90 dias (config)              |

## Como combinar com `make`

Todos os scripts acima têm alvo no `Makefile` raiz (se preferir interface
declarativa). Ex.: `make health` chama `bash scripts/health-check.sh`.

## Referências

- `infra/docker-compose.yml` — Postgres + pgweb + Caddy + web + worker
- `apps/web/scripts/seed.ts` — seed local (chamado por `setup.sh`)
- `.github/workflows/ci.yml` — CI (lint, typecheck, test, build, bundle budget)
- `.github/workflows/deploy.yml` — Deploy com rollback automático