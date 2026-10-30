# ADR-011: SigNoz self-hosted + OpenTelemetry para observability

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Tech lead EasyDemo, Founding engineer

## Context and Problem Statement

EasyDemo precisa de **observability full-stack**:

1. **Logs estruturados** por request (com `workspace_id`, `request_id`, `trace_id`).
2. **Metrics** (latência p50/p95/p99, error rate, QPS, saturação).
3. **Distributed traces** (frontend Next.js → API → worker → Postgres → R2).
4. **Alertas** (PagerDuty/Slack) quando SLOs são violados.
5. **Correlação** entre logs e traces (clicar num log → ver o trace).

Devemos escolher entre **SaaS de observability** (Datadog, Grafana Cloud, New Relic, Sentry-only) ou **self-host** (SigNoz, Grafana+Prometheus+Loki+Tempo).

## Decision Drivers

- **Custo fixo** aceitável (Datadog $0.10/host/mês + $1.27/milhão de spans — vira caro).
- **LGPD**: logs podem conter PII; queremos controle do storage.
- **OpenTelemetry**: SDK oficial (vendor-neutral).
- **Self-host** viável em 1 VPS (consumo de RAM razoável).
- **Correlação logs ↔ traces** automática.

## Considered Options

1. **SigNoz self-hosted + OpenTelemetry SDK** (logs+metrics+traces em 1 backend ClickHouse).
2. **Datadog** (SaaS gold standard).
3. **Grafana Cloud** (SaaS, plano free generoso).
4. **New Relic** (SaaS, free tier 100GB/mês).
5. **Sentry-only** (apenas errors, sem metrics/traces).
6. **Grafana + Prometheus + Loki + Tempo** self-hosted.

## Decision Outcome

**Chosen option: "SigNoz self-hosted + OpenTelemetry"**, porque entrega **logs + metrics + traces em uma única stack ClickHouse**, com OTel SDK vendor-neutral, e roda confortavelmente em ~1.5–2 GB de RAM no nosso VPS. Datadog seria 5× mais caro e mandaria dados para AWS US.

Configuração:

- Container `signoz-frontend` (UI web) + `signoz-otel-collector` (coletor OTel) + `signoz-query-service` (backend) + `clickhouse` (storage).
- OTel SDK no Next.js (`@opentelemetry/sdk-node` + `auto-instrumentations-node`).
- OTel SDK no worker.
- Rastreamento automático: HTTP, Express, Postgres, Redis (graphile-worker usa Postgres), fetch.
- **Sampling**: 100% em dev, 10% em prod (configurável via env).
- Dashboards prontos: latency, error rate, throughput, slow queries.
- Alertas: Slack webhook quando `error_rate > 5%` ou `p95_latency > 500 ms` por 5 min.
- Retenção de traces: **7 dias** (ClickHouse é eficiente para isso).

### Positive Consequences

- **Tudo em um**: logs + metrics + traces + dashboards + alertas.
- **OpenTelemetry** = vendor-neutral (migrar para Datadog no futuro é trivial).
- **Self-hosted** = dados ficam no nosso VPS (LGPD-friendly).
- ClickHouse storage comprime logs ~10× (50 GB raw → 5 GB).
- UI web moderna (substituiu Jaeger + Grafana).
- **Free open-source**, sem tier limits.
- Correlação automática log ↔ trace via `trace_id`.

### Negative Consequences

- **ClickHouse consome ~1–2 GB RAM** (significativo no CPX32).
- **Setup inicial mais trabalhoso** que SaaS (5 containers).
- **Curva de aprendizado** OTel (instrumentação manual para casos avançados).
- **Sem APM avançado** tipo session replay, real user monitoring (RUM). Para RUM, planejar PostHog separado.
- Versão 0.x — pode ter breaking changes entre releases (pinamos `~0.55.0`).

### Follow-ups

- Adicionar **PostHog Cloud** separado para session replay + funis de produto (escopo diferente de SRE).
- Configurar **Real User Monitoring** (RUM) no player público via `@opentelemetry/instrumentation-browser`.
- Migrar de `docker-compose` SigNoz para Helm Chart quando virarmos K3s.

## Pros and Cons of the Options

### SigNoz self-host + OTel (escolhido)

- Good, 1 stack para tudo.
- Good, OTel vendor-neutral.
- Good, self-host, LGPD-friendly.
- Good, custo fixo €0.
- Bad, consome ~1.5 GB RAM.
- Bad, versão ainda em 0.x.

### Datadog

- Good, melhor UX da categoria.
- Good, APM completo, RUM, session replay, logs, métricas.
- Bad, **caro** ($0.10/host + $1.27/M spans — em volume sai R$ 2k/mês).
- Bad, dados em AWS US (default) — LGPD exige DPA + região custom.
- Bad, lock-in alto (formato proprietário de métricas).

### Grafana Cloud

- Good, free tier generoso (10k séries métricas, 50 GB logs).
- Good, integra com qualquer fonte (Prometheus, Loki, Tempo).
- Good, dados em região AWS ou GCP configurável.
- Bad, free tier limita retenção a 14 dias.
- Bad, exige configurar Loki/Prometheus/Tempo client-side — mais setup.

### New Relic

- Good, free tier 100 GB/mês.
- Good, APM + infra monitoring.
- Bad, vendor lock-in.
- Bad, free tier não cobre produção séria.
- Bad, dados em US default.

### Sentry-only

- Good, errors + source maps + performance simples.
- Good, free tier 5k eventos/mês.
- Bad, **sem logs**, **sem métricas**, **sem correlação**.
- Bad, scope diferente — não substitui APM.

### Grafana + Prometheus + Loki + Tempo

- Good, máximo controle.
- Good, OSS puro.
- Bad, **4 ferramentas** para manter.
- Bad, mais RAM (~2–3 GB total).
- Bad, configurar correlação é manual.

## References

- [SigNoz docs](https://signoz.io/docs/)
- [OpenTelemetry docs](https://opentelemetry.io/docs/)
- [Datadog pricing](https://www.datadoghq.com/pricing/)
- [Grafana Cloud pricing](https://grafana.com/pricing/)
- RFC EasyDemo §2.2 — observability
- `research/tech/analytics-stack.md` — comparação completa
- `research/tech/RECOMMENDATION.md` §2.10 — SigNoz