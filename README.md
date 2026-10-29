# DemoBR

> Demos interativas do seu produto, em PT-BR, com PIX e LGPD.

Clone brasileiro do Supademo, otimizado para o mercado BR com pagamento via PIX/boleto, conformidade LGPD de ponta a ponta e player PT-BR-first.

> **Licença:** projeto proprietário, de uso interno — todos os direitos reservados. Ver [`LICENSE`](LICENSE).

## Stack

- **Next.js 15** App Router + React 19 + TypeScript 5.6
- **Tailwind CSS** + Radix UI primitives
- **PostgreSQL 16** + Drizzle ORM 0.36 com Row-Level Security
- **Clerk** (auth multi-tenant com Organizations)
- **graphile-worker** (fila Postgres-only)
- **Cloudflare R2** (storage S3-compatible, zero egress)
- **Asaas** (PIX/boleto/cartão BR)
- **Resend** (e-mail transacional)
- **Sentry** (error tracking)
- **Vitest** + Playwright (testes)
- **Biome** (lint + format)

## Quickstart

```bash
# 1. Clonar e instalar
git clone <repo> demobr && cd demobr
nvm use                # Node 22
corepack enable
pnpm install

# 2. Configurar .env
cp .env.example .env
# preencher DATABASE_URL, CLERK_*, R2_*, etc.

# 3. Subir Postgres local
pnpm docker:dev

# 4. Criar roles e aplicar schema
bash scripts/init-db.sh
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 5. Dev
pnpm dev               # Next.js em :3000
pnpm worker            # graphile-worker
pnpm extension:dev     # Chrome extension
```

Estrutura completa: ver `docs/RFC-Brazilian-Supademo.md`.
Escopo e execução do MVP: ver `docs/MVP-PLAN.md`.

## Layout

```
apps/
  web/         # Next.js 15 App Router
  extension/   # Chrome MV3
  workers/     # graphile-worker process
packages/
  shared/      # types + zod schemas
  player/      # @demo.br/player (vanilla, publicável)
  ui/          # shadcn-style primitives
infra/         # docker-compose, Caddy, Postgres, OTEL
scripts/       # init-db, seed, deploy
docs/          # RFC, ADRs
research/      # concorrência, pricing, tech
specs/         # mvp-scope.json
```

## Documentação

- **[Mapa da documentação](docs/README.md)** — **comece aqui**: o que cada arquivo é, quando abrir e quando não mexer
- [MVP Plan](docs/MVP-PLAN.md) — escopo, fases F0–F10, gates e decisões do MVP
- [MVP Progress](docs/MVP-PROGRESS.md) — **o que já foi feito** e por quê (log de execução)
- [AGENTS.md](AGENTS.md) — protocolo de execução para agentes de IA
- [RFC completa](docs/RFC-Brazilian-Supademo.md) — arquitetura, stack, GTM e env vars
- [MVP scope](specs/mvp-scope.json) — par machine-readable do MVP Plan
- [Marketing](marketing/README.md) — plano de lançamento, ICP, métricas, conteúdo
- [Research](research/) — dados de mercado e concorrência (leitura)

## Licença

Proprietary. Todos os direitos reservados.