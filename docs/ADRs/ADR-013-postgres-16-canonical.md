# ADR-013: PostgreSQL 16 como versão canônica do banco

- **Status:** Accepted
- **Date:** 2026-10-25
- **Deciders:** Tech lead EasyDemo
- **Supersedes:** ADR-003 (PostgreSQL 17 self-hosted em Hetzner), ADR-009 (Hetzner CPX32 + Docker Compose) — apenas no que toca a versão do banco

## Context and Problem Statement

O repositório nasceu com uma **incoerência de versão do Postgres** entre
documentação e implementação:

| Fonte | Versão |
|---|---|
| `infra/docker-compose.yml` e `infra/docker-compose.prod.yml` | **`postgres:16-alpine`** |
| `infra/postgres/postgresql.conf` (tuning real) | **16** — "PostgreSQL 16 — single-node VPS 8 GB" |
| `docs/RFC-Brazilian-Supademo.md` §2.1/§2.2 | **16** |
| `specs/mvp-scope.json` (`stack.db`) | **16** |
| `AGENTS.md` | **16** |
| `research/tech/README.md` (índice do research) | **16** — "POC: stress test Postgres 16 com 1k conexões no CX31" |
| ADR-003, ADR-004, ADR-009, ADR-010 | **17** |
| ADR-003 título, ADR-009 snippet de compose, `ARCHITECTURE-decision-map.md`, `SECURITY-MODEL.md` | **17** |
| `research/tech/architecture-diagram.md`, `research/tech/infra-vps.md`, `research/tech/RECOMMENDATION.md` | **17** |

Verificação no histórico do git:

```
$ git log --all -S "postgres:17-alpine" -- infra/
(vazio — o compose NUNCA usou 17)

$ git log --all -S "postgres:16-alpine" -- infra/
cc36a17 feat: initial scaffold — DemoBR v1.0
```

O `17` **nunca foi implementado**. Ele entrou por draft em 2 dos 6 arquivos de
`research/tech/` — `architecture-diagram.md` e `infra-vps.md` — que contradizem
o índice do próprio research (`research/tech/README.md`, que diz 16). A síntese
automática de 2026-10-18 propagou esse 17 para os ADRs gerados no mesmo dia,
que nasceram incoerentes com o compose do mesmo commit.

O risco concreto: um dev (ou uma IA) que leia o ADR-003 e leve a decisão a
literalmente pode "corrigir" o `docker-compose.yml` para `postgres:17-alpine` e
quebrar o banco de produção — enquanto toda a documentação operacional
(tuning, tuning de `shared_buffers`, benchmark de conexões) é calibrada para 16.

## Decision Drivers

- **Coerência com o que está em produção.** O compose, o tuning e o
  benchmark de stress test são de 16.
- **Custo de upgrade zero no MVP.** Trocar a versão do banco de produção
  exige reprovisionar o Postgres, re-validar a compatibilidade do pgBackRest
  com a nova major, re-testar as migrations e re-rodar os benchmarks — tudo
  isso durante o MVP, sem nenhum ganho de produto.
- **Ciclo de suporte.** PostgreSQL 16 tem suporte até **nov/2028**; 17 até
  nov/2029. Não há urgência.
- **Não reescrever registros.** ADR é registro histórico; divergência se
  resolve com um ADR que supersede, não editando o antigo.

## Considered Options

1. **Manter 16 como canônico e registrar ADR-013** (escolhido).
2. **Fazer upgrade do stack para 17** — alinhar o compose, o tuning e
   reprovisionar o banco de produção.
3. **Editar ADR-003 e ADR-009 in-place** — violaria a convenção de ADR
   ("não se reescreve; crie um novo que supersede").

## Decision Outcome

**Chosen option: "PostgreSQL 16 como versão canônica"**, porque é a versão
realmente implementada desde o scaffold, tem ciclo de suporte suficiente para
o MVP, e trocar agora impõe reprovisionamento e revalidação de backup e
migrations sem nenhum ganho de produto.

Configuração:

- **Imagem**: `postgres:16-alpine` nos dois `docker-compose` (dev e prod).
- **Tuning**: `infra/postgres/postgresql.conf` — single-node, VPS 8 GB,
  `shared_buffers=2GB`.
- **Roles**: `app_user` (runtime, respeita RLS), `app_owner` (BYPASSRLS, só
  migrations), `readonly`.
- **Backup**: pgBackRest com repo S3-compatível em R2 (AES-256 + PITR).
  Compatibilidade com a 16 verificada — ver ADR-010.
- **Upgrade para 17 fica fora do MVP.** Se vier a ser necessário, é um ADR
  novo, com reprovisionamento, revalidação de pgBackRest e re-rodagem dos
  benchmarks.

### Consequência conhecida: benchmarks de POC são de 17

Os POCs em `research/pocs/` **realmente rodaram** com `postgres:17-alpine`:

- `POC-rls-bench.md` — overhead de RLS ~0,7 ms p50 (200 × 8 cenários)
- `POC-graphile-throughput.md` — POC local 100% com Postgres 17

Esses arquivos são **registro histórico de experimento** e não foram
alterados. O consequence: os números de performance publicados vieram da 17,
não da 16 que está em produção. As diferenças entre 16 e 17 são marginais
nessas métricas, mas **os números não são version-matched**.

**Mitigação**: re-rodar os dois POCs com `postgres:16-alpine` antes de usar
qualquer número de performance como SLA. Fica como pendência em
`research/pocs/INDEX.md`.

## Links

- [ADR-003](ADR-003-postgres-17-self-hosted-hetzner.md) — superseded (no que
  toca a versão do banco)
- [ADR-009](ADR-009-hetzner-cpx32-docker-compose.md) — superseded (no que
  toca a versão do banco)
- [ADR-010](ADR-010-pgbackrest.md) — backup/PITR, compatível com 16
- [ADR-004](ADR-004-drizzle-orm.md) — ORM
- `infra/postgres/postgresql.conf` — tuning
- `infra/docker-compose.yml` — stack de desenvolvimento
- [PostgreSQL 16 release notes](https://www.postgresql.org/docs/release/16.0/)
- [PostgreSQL versioning and support policy](https://www.postgresql.org/support/versioning/)
