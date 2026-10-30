# ADR-003: PostgreSQL 17 self-hosted em Hetzner

- **Status:** Superseded (parcialmente) — a versão do banco foi superseded por
  [ADR-013](ADR-013-postgres-16-canonical.md). A decisão de **self-host no
  Hetzner** (em vez de Supabase/Neon/RDS) permanece válida.
- **Date:** 2026-10-18
- **Deciders:** Tech lead EasyDemo, Founding engineer
- **Superseded by:** [ADR-013](ADR-013-postgres-16-canonical.md) — apenas no
  que toca a versão do Postgres (a canônica é **16**)

> ⚠️ **A versão 17 nunca foi implementada.** O `infra/docker-compose.yml` usa
> `postgres:16-alpine` desde o scaffold (`cc36a17`). Ver ADR-013 para a
> verificação no histórico e para as consequências.

## Context and Problem Statement

EasyDemo é um SaaS B2B que armazena dados de clientes B2B (workspaces, membros, demos, leads capturados, eventos de analytics). Esses dados são:

- **Sensíveis** (leads de terceiros, dados de billing).
- **Regulados por LGPD** (operador é a EasyDemo; temos DPO/controlador obligations).
- **Volume moderado** — projeção 12 meses: ~50 GB raw, ~5M eventos/mês, ~100 workspaces.
- **Críticos** — perda de leads capturados = perda de receita do cliente.

Devemos escolher entre **hospedar o Postgres nós mesmos** (no mesmo VPS Hetzner) ou delegar a um provedor gerenciado (Supabase, Neon, RDS).

## Decision Drivers

- **LGPD**: dados primários precisam de residência clara (UE ou BR); egress cross-border controlado.
- **Custo**: Supabase Pro $25/mo + excedentes; Neon similar; RDS mínimo ~$30/mo. Self-host = €0 marginal.
- **Performance**: RLS e JSONB rodam melhor em Postgres "puro" do que em wrappers (Neon/PgBouncer exigem cuidado com prepared statements).
- **Operação**: time precisa aprender Postgres ops (WAL, vacuum, backup) — alternativa é pagar para não aprender.
- **Risco de vendor lock-in**: Supabase/Neon amarram a APIs próprias.

## Considered Options

1. **Postgres 17 self-hosted no Hetzner CPX32** com pgBackRest em R2.
2. **Supabase** (Postgres gerenciado com auth/storage/RLS prontos).
3. **Neon** (Postgres serverless, branching, autoscaling).
4. **AWS RDS** (Postgres gerenciado HA, Multi-AZ).

## Decision Outcome

**Chosen option: "Postgres 17 self-hosted em Hetzner"**, porque o custo marginal é zero (o VPS já está pago), o controle operacional é total, e os dados nunca saem da UE sem nosso consentimento explícito — o que é uma das obrigações mais claras de LGPD para o cliente final.

Configuração:
- `postgresql-17` instalado via `apt.postgresql.org` ou imagem Docker oficial `postgres:17-alpine`.
- **Schema separation:** `app` (multi-tenant), `analytics` (eventos), `graphile_worker` (fila).
- **RLS ativado em todas tabelas tenant-scoped**, com `FORCE ROW LEVEL SECURITY` para owners=`postgres` também.
- `shared_buffers=2GB`, `effective_cache_size=6GB`, `work_mem=64MB`, `maintenance_work_mem=512MB`, `wal_compression=on`, `max_wal_size=4GB`.
- `pgBackRest` enviando WAL + base backup para bucket R2 (`pgbackrest` em região `eu-central-1`).
- `pg_cron` (extensão) ou `graphile-worker` cron para retention jobs.
- Conexão via Unix socket do app; porta 5432 fechada para WAN por firewall Hetzner.

### Positive Consequences

- Custo fixo de €0/mês para o banco (já incluso no VPS).
- Dados em UE (Hetzner fsn1/nbg1) — simples de documentar em contrato LGPD.
- Controle total: `EXPLAIN`, `pg_stat_statements`, extensão custom.
- Compatibilidade 100% com `graphile-worker`, `pg_partman`, `pg_crypto`, `pgcrypto` — nada de "managed extensions" subset.
- Failover: replicar para uma 2ª VPS Hetzner se SLA ficar crítico (custo ~+€14/mês).

### Negative Consequences

- Somos responsáveis por: backups, vacuum, tuning, security patches, upgrade de major version.
- Sem HA nativo — uma VPS indisponível = API indisponível. Aceitável no MVP; mitigável com replica.
- Auto-scaling impossível (precisa migrar de servidor quando > 50 GB / 5k QPS).
- `apt.postgresql.org` exige patching mensal (Ubuntu 24.04 LTS dá ~5 anos de suporte, ok).

### Follow-ups

- Provisionar replica async para Hetzner fsn1 quando MRR > R$ 30k ou SLA exigido > 99.5%.
- Configurar `pg_stat_statements` e `auto_explain` em produção desde o dia 1 (custa 2–5% de performance, economiza horas de debug).
- Documentar runbook de restore em `infra/postgres/RUNBOOK.md`.

## Pros and Cons of the Options

### Postgres 17 self-hosted Hetzner (escolhido)

- Good, custo marginal zero.
- Good, residência de dados clara (UE).
- Good, controle operacional total.
- Bad, operação manual (backup, vacuum, upgrade).
- Bad, sem failover automático (mitigável).

### Supabase

- Good, auth + storage + edge functions + realtime prontos.
- Good, dashboard SQL web útil para debugging.
- Bad, $25/mo Pro + excedentes ($0.125/GB storage, $0.09/GB egress).
- Bad, regras de RLS próprias (não é exatamente Postgres padrão).
- Bad, dados em AWS US (default) — exige provisionar em `sa-east-1` ou aceitar LGPD risk.
- Bad, lock-in significativo (auth.goTrue, storage custom).

### Neon

- Good, branching por PR (excelente DX).
- Good, autoscaling de compute (escala a zero).
- Good, plano free generoso para staging.
- Bad, **latência de cold start** (~500 ms no primeiro query) — ruim para time-to-first-byte.
- Bad, conexão via proxy limita `LISTEN/NOTIFY` (graphile-worker precisa de polling — ok, mas menos elegante).
- Bad, residência principal US; UE só via plano Teams ($0.5/GB).
- Bad, storage cobra por GB-mês separadamente.

### AWS RDS

- Good, HA Multi-AZ, backup PITR nativo.
- Good, integração nativa com VPC, IAM, KMS.
- Bad, mínimo ~$30/mês só para começar (db.t4g.micro).
- Bad, dados em US-East-1 default — exige opt-in `sa-east-1` (+latência BR).
- Bad, plano free termina em 12 meses.
- Bad, navegador de console AWS é overhead para time pequeno.

## References

- [PostgreSQL 17 release notes](https://www.postgresql.org/docs/release/17.0/)
- [pgBackRest docs](https://pgbackrest.org/)
- [Hetzner Cloud pricing](https://www.hetzner.com/cloud)
- [LGPD art. 33 (transferência internacional)](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- RFC EasyDemo §2.2, §2.3
- `research/tech/infra-vps.md` §1 — escolha do VPS
- `research/tech/RECOMMENDATION.md` §2.5 — banco de dados