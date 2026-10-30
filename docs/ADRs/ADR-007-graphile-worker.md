# ADR-007: graphile-worker (Postgres-only queue)

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Tech lead EasyDemo, Founding engineer

## Context and Problem Statement

EasyDemo precisa de uma **fila de jobs** para:

- **Processar demos após upload** (LGPD pipeline: OCR + blur + re-upload).
- **Enviar emails transacionais** (Resend) em retry.
- **Sync com Clerk** via webhook (reconciliação).
- **Cobrar webhooks do Asaas** e atualizar subscription.
- **Retention jobs** (cron diário) — purge eventos > 90 dias, anonymize audit logs > 24 meses.
- **Gerar OG images** sob demanda.

Estimativa de volume: < 100k jobs/dia no MVP. Pico: 1k jobs/min em campanha de marketing.

Devemos escolher entre **fila Postgres-only** (graphile-worker) ou **fila Redis** (BullMQ) ou **SaaS gerenciado** (Inngest, SQS, Trigger.dev).

## Decision Drivers

- **Infra mínima**: já temos Postgres; não queremos adicionar +1 serviço (Redis).
- **Transacional**: enfileirar dentro da mesma transação do INSERT do demo (atomicidade).
- **Cron nativo**: retention jobs diários sem precisar cron do SO.
- **Backpressure**: jobs falhos devem retentear com backoff exponencial.
- **Observabilidade**: lista de jobs pendentes visível em SQL (debug-friendly).

## Considered Options

1. **graphile-worker** (Postgres-only, sem Redis).
2. **BullMQ** + Redis (battle-tested, Node-first).
3. **AWS SQS** + Lambda (serverless).
4. **Inngest** (SaaS, DX excelente, função-as-a-service).
5. **Trigger.dev** (open-source self-hosted, type-safe).

## Decision Outcome

**Chosen option: "graphile-worker"**, porque elimina a dependência de Redis, é transacional com Postgres (enfileira no mesmo `BEGIN/COMMIT`), tem cron nativo e observabilidade via SQL. Para 100k jobs/dia, é mais do que suficiente (benchmarks mostram 10k+ jobs/s em triviais).

Configuração:

- Schema dedicado `graphile_worker` (instalado via `graphile-worker migrate`).
- Worker process em container separado (`apps/workers/`), escala vertical por enquanto.
- `worker.run()` com `concurrency: 10` e `pollInterval: 200`.
- Helpers `makeWorkerUtils()` para `addJob()` server-side.
- Jobs críticos (billing, LGPD purge) com `maxAttempts: 10` e `backoff` exponencial.
- Cron jobs declarados em `graphile_worker.cron` (ex: `0 3 * * *` para retention).

### Positive Consequences

- **Zero infra adicional**: roda no Postgres que já temos.
- **Transacional**: `addJob()` na mesma conexão da mutation — se a mutation falhar, job não entra.
- **Cron nativo**: substitui `crontab` para jobs internos.
- **SQL-friendly**: `SELECT * FROM graphile_worker.jobs WHERE state='failed'` resolve 90% do debug.
- **Open-source MIT**, mantido ativamente.
- Funciona bem em `docker compose` sem dependência externa.
- Backoff exponencial e retry built-in.

### Negative Consequences

- **Latência enqueue → pickup** ~50–200 ms (polling). Aceitável para jobs assíncronos; **inaceitável para realtime**.
- Concorrência limitada por CPU do Postgres (pool de conexões). Em > 5k jobs/s precisa benchmarking sério.
- Sem UI de inspeção (precisa query SQL ou construir dashboard).
- Sem prioridade de fila com peso (só FIFO + scheduled_at).

### Follow-ups

- Construir **Worker Dashboard** em `/admin/workers` (Next.js) mostrando jobs pendentes/falhos — simples SQL + shadcn table.
- Configurar **alerta SigNoz** quando `failed_jobs > 50/hora`.

## Pros and Cons of the Options

### graphile-worker (escolhido)

- Good, zero infra extra.
- Good, transacional.
- Good, cron nativo.
- Good, MIT license.
- Bad, latência ~200 ms enqueue→pickup.
- Bad, sem UI.

### BullMQ + Redis

- Good, batalha-testado, Node-first.
- Good, dashboards prontos (Bull Board).
- Good, throughput alto.
- Bad, **+1 serviço** (Redis): 50 MB RAM, precisa HA se crítico.
- Bad, **não transacional** com Postgres (enfileirar e gravar DB são 2 chamadas).
- Bad, cron via `bullmq-pro` ou `@bree` separado.

### AWS SQS + Lambda

- Good, zero ops, serverless.
- Good, escala infinita.
- Bad, cold start Lambda ~500 ms — ruim para webhooks de billing.
- Bad, lock-in AWS.
- Bad, debug via CloudWatch (caro e verboso).
- Bad, latência mínima ~100 ms por mensagem.

### Inngest

- Good, DX incrível (type-safe, declarative).
- Good, free tier generoso (10k runs/mês).
- Good, suporte a long-running, sleep, parallel.
- Bad, **SaaS** — vendor lock-in.
- Bad, free tier acaba em 10k jobs/mês (no nosso volume ~50k/mês).
- Bad, dados passam por servidor de terceiro (LGPD: outro DPA).

### Trigger.dev

- Good, type-safe, self-hostable.
- Good, suporte a schedules, webhooks, long-running.
- Bad, ainda em beta (3.0 em 2025); instável para produção crítica.
- Bad, self-host consome ~500 MB RAM.

## References

- [graphile-worker docs](https://github.com/graphile/worker)
- [BullMQ](https://docs.bullmq.io/)
- [Inngest](https://www.inngest.com/docs)
- [Trigger.dev](https://trigger.dev/docs)
- RFC EasyDemo §2.2 — escolha de fila
- `research/tech/backend-stack.md` §2 — queue comparison