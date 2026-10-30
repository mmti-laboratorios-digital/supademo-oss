# Service Level Objectives — DemoBR

> SLOs do MVP e metas pós-estabilidade. Cada SLO tem métrica, target,
> janela de medição, e **error budget** associado. Acompanhamento em
> `/admin/observability/slos` (dashboard SigNoz).

**Versão:** 1.0
**Owner:** Tech lead DemoBR
**Última revisão:** 2026-10-18
**Próxima revisão:** 2027-04-18 (semestral)

---

## 1. Filosofia de SLO

Seguimos o **Google SRE Workbook** (cap. 5–8):

- **SLI** (Service Level Indicator): métrica técnica (latência, erro, throughput).
- **SLO** (Service Level Objective): target que o SLI deve atingir.
- **Error budget**: `1 - SLO`. Quando estourado, congelamos mudanças de feature
  e focamos em confiabilidade.

Definimos SLOs **menores que a realidade** para criar folga. Quando batemos
100% do error budget por 2 meses seguidos, **aumentamos** o SLO (mais
ambicioso). Quando estouramos 2 meses seguidos, **investimos em confiabilidade**
antes de features.

---

## 2. SLOs do MVP (2026-Q4 → 2027-Q2)

### 2.1 API REST (`/api/v1/*` autenticado)

| Métrica | Tipo | Target MVP | Target pós-estabilidade |
|---------|------|-----------|-------------------------|
| **Availability** | SLO | **99.5%** | 99.9% |
| **Latência p50** | SLO | < 100ms | < 80ms |
| **Latência p95** | SLO | **< 300ms** | < 200ms |
| **Latência p99** | SLO | < 800ms | < 500ms |
| **Error rate (5xx)** | SLO | < 0.5% | < 0.1% |
| **Throughput** | informational | 100 RPS sustentados | 1k RPS |

**Janela de medição**: 30 dias corridos (rolling).

**Cálculo de availability**:
```
availability = (successful_requests) / (total_requests)
              onde successful = status 2xx, 3xx, 4xx (não conta 5xx nem timeout)
```

**Error budget mensal** (SLO 99.5%):
- Total requests esperado: ~5M/mês (150k/dia médio).
- Budget de falhas 5xx: 25.000 requests/mês.
- Quando budget < 20%, alerta Slack.
- Quando budget < 0%, **code freeze de features** (commit apenas em fix de confiabilidade).

### 2.2 Player público (`/d/[slug]` SSR)

| Métrica | Tipo | Target MVP | Target pós-estabilidade |
|---------|------|-----------|-------------------------|
| **Availability** | SLO | 99.0% | **99.9%** |
| **First Paint p50** | SLO | < 800ms | < 500ms |
| **First Paint p95** | SLO | **< 1.5s** | < 1s |
| **LCP p95** | SLO | < 2.5s | < 1.8s |
| **CLS p95** | SLO | < 0.1 | < 0.05 |
| **TBT p95** | SLO | < 200ms | < 100ms |

**Medição**: Real User Monitoring (RUM) via `@opentelemetry/instrumentation-browser`
+ Web Vitals reportados ao SigNoz.

**Error budget mensal** (SLO 99.0%):
- Player é mais tolerante porque depende de Cloudflare (que tem SLA 100% upstream).
- Budget: ~432 min downtime/mês.

### 2.3 Upload de screenshots (`/upload/sign` + PUT R2)

| Métrica | Tipo | Target MVP | Target pós-estabilidade |
|---------|------|-----------|-------------------------|
| **Availability** | SLO | 99.0% | 99.5% |
| **Latência sign (p95)** | SLO | < 200ms | < 100ms |
| **Taxa de upload bem-sucedido** | SLO | > 95% | > 99% |
| **Tempo total sign→upload (p95)** | SLO | < 8s (1 MB PNG) | < 5s |

**Medição**: OTel traces de `upload.sign.start` → `upload.put.completed`.

### 2.4 Webhooks de saída

| Métrica | Tipo | Target MVP | Target pós-estabilidade |
|---------|------|-----------|-------------------------|
| **Taxa de entrega (1ª tentativa)** | SLO | > 95% | > 99% |
| **Taxa de entrega (≤ 8 tentativas)** | SLO | > 99.5% | > 99.9% |
| **Latência evento→1ª entrega (p95)** | SLO | < 30s | < 5s |
| **Dead letter rate** | SLO | < 0.5% | < 0.1% |

**Error budget**: dead letters aceitáveis ~10/mês.

### 2.5 Job queue (graphile-worker)

| Métrica | Tipo | Target MVP | Target pós-estabilidade |
|---------|------|-----------|-------------------------|
| **Jobs completed (24h)** | informational | > 99% enfileirados | > 99.9% |
| **Latência enqueue → pickup (p95)** | SLO | < 500ms | < 200ms |
| **Failed jobs (24h)** | SLO | < 1% | < 0.1% |
| **Queue depth** | alerting | < 1.000 pending | < 100 pending |
| **Oldest pending job** | alerting | < 5 min | < 1 min |

---

## 3. SLOs de infraestrutura

### 3.1 Backup Postgres

| Métrica | Tipo | Target MVP | Target pós-estabilidade |
|---------|------|-----------|-------------------------|
| **RPO** (data loss) | SLO | **≤ 1 hora** | ≤ 15 min |
| **RTO** (downtime) | SLO | **≤ 30 min** | ≤ 5 min |
| **Backup success rate** | SLO | 100% (alvo: 99.9%) | 100% |
| **Restore drill** | conformance | 1×/mês | 1×/semana |
| **Retenção** | conformance | 7 full + diff diário + 30 WAL days | 30 full + 90 WAL days |

**Definição**:
- **RPO**: tempo máximo entre o último WAL arquivado e o ponto de falha.
  Com `archive_mode=on` e `archive_command='pgbackrest archive-push %p'`,
  o RPO é ~ segundos na prática; aceitamos ≤ 1h como margem.
- **RTO**: tempo entre "declarar desastre" e "Postgres restored + app reconnected".
  Medido em último drill: 22 min (full restore de 50 GB em CPX32).

### 3.2 Observability (SigNoz + OTel)

| Métrica | Tipo | Target |
|---------|------|--------|
| **Coleta OTel uptime** | SLO | 99.5% |
| **Trace sampling rate** | SLO | 10% (prod), 100% (dev) |
| **Latência exportação OTel (p95)** | SLO | < 5s |
| **ClickHouse query latency p95** | SLO | < 2s |

---

## 4. SLOs de billing

| Métrica | Tipo | Target |
|---------|------|--------|
| **Webhook Asaas delivery success** | SLO | > 99.5% |
| **Idempotência (zero cobrança dupla)** | SLO | 100% |
| **Reconciliation lag** | SLO | < 24h |

Medido diariamente por script `scripts/asaas-reconciliation.ts` que compara
subscriptions Asaas com `app.subscriptions`.

---

## 5. Error budget tracking

### 5.1 Cálculo mensal

Para SLO de availability 99.5%:
- **Budget total mensal**: 0.5% × total_requests = ~25.000 5xx errors/mês.
- **Burn rate aceitável**: ~833 5xx/dia (5.5% do orçamento por dia em 30d).

### 5.2 Alertas de burn rate

Configurados em SigNoz como PromQL:

| Janela | Budget consumido | Severidade | Ação |
|--------|-----------------|-----------|------|
| 1h | > 5% | ⚠️ warning | Notifica Slack #ops |
| 1h | > 10% | 🔴 critical | PagerDuty + call |
| 6h | > 20% | 🔴 critical | PagerDuty |
| 24h | > 50% | 🟣 freeze | Code freeze de features |
| 30d | > 100% | 🟣 freeze | Code freeze + post-mortem obrigatório |

### 5.3 Política de code freeze

Quando error budget mensal < 20% OU > 100% consumido:

- ❌ Não merge de features novas.
- ❌ Não deploy de mudanças que não são bug-fix ou reliability.
- ✅ Merge de fixes, performance improvements, security patches.
- ✅ Post-mortem público em ≤ 7 dias.
- ✅ Review de mudanças da semana anterior.

Quando budget mensal < 0% (estourado por 2 meses consecutivos):

- ❌ Não merge de features.
- ✅ Toda mudança passa por SRE review.
- ✅ Re-arquitetura priorizada no roadmap.

---

## 6. Medições e ferramentas

| SLO | Ferramenta | Onde ver |
|-----|-----------|----------|
| API availability | SigNoz + OTel SDK | `/admin/observability/slos` |
| API latency | SigNoz + OTel SDK | `/admin/observability/slos` |
| Player metrics | `@opentelemetry/instrumentation-browser` | `/admin/observability/rum` |
| Backup success | SigNoz custom metric (`pgbackrest.info.last_success_age`) | `/admin/observability/backups` |
| Webhook delivery | `app.webhook_deliveries` table + SigNoz | `/admin/observability/webhooks` |
| Job queue | `graphile_worker.jobs` table + SigNoz | `/admin/observability/workers` |

Dashboard `/admin/observability/slos` mostra, em uma página:

- Cada SLO com seu status (✓ / ⚠️ / 🔴).
- Error budget restante (barrinha visual).
- Burn rate em tempo real.
- Histórico 30/60/90 dias.
- Link para runbook quando SLO violado.

---

## 7. Responsabilidades e reviews

| Quem | Responsabilidade |
|------|-----------------|
| Tech lead | Define SLOs, revisa mensalmente, reporta para founders |
| SRE / DevOps | Monitora dashboards, responde a alertas, agenda restore drills |
| Time de produto | Consome error budget como restrição de roadmap |
| DPO | Audita SLOs LGPD (DSR < 7 dias, retention 90 dias) |

### 7.1 Revisão mensal

Último dia útil do mês, 30 min:

1. Todos os SLOs bateram target? Anotar excessos.
2. Error budget restante — qual feature podemos priorizar?
3. Burn rate — algum alerta não foi tratado?
4. Novos SLOs necessários? (ex.: feature nova gerando tráfego)
5. Atualizar `docs/SLOs.md` se algum número mudou.

### 7.2 Revisão trimestral

Trimestral, 1h, com fundadores:

1. Apresentar SLOs vs target (média 90 dias).
3. Decisão de **endurecer SLO** se cumprimos 100% por 2 meses.
2. Decisão de **investir em confiabilidade** se estouramos 2 meses.
4. Roadmap Q próximo.

---

## 8. SLIs em detalhe (para implementação)

### 8.1 API availability

```promql
sum(rate(http_requests_total{service="web", route=~"/api/v1/.*", status!~"5.."}[5m]))
/
sum(rate(http_requests_total{service="web", route=~"/api/v1/.*"}[5m]))
```

### 8.2 API p95 latency

```promql
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket{service="web", route=~"/api/v1/.*"}[5m])) by (le)
)
```

### 8.3 Player first paint (RUM)

```js
// Injetado no <head> do player
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntriesByName('first-paint')) {
    OTel.recordMetric('player.first_paint', entry.startTime);
  }
});
observer.observe({ type: 'paint', buffered: true });
```

### 8.4 Backup freshness

```promql
time() - max(pgbackrest_last_backup_timestamp_seconds)
```

Alert se > 86400 (24h).

---

## 9. Exceções e janela de manutenção

**Janelas de manutenção** (degradação esperada):

- Patch de segurança: aviso 24h antes, ≤ 15 min.
- Upgrade Postgres major: ≤ 1h, fim de semana, aviso 7 dias antes.
- Migração de infra: ≤ 4h, fim de semana, aviso 14 dias antes.

**Durante manutenção**:
- SLOs **não são pausados** (continuam medindo).
- Mas requests retornam **503 com `Retry-After`** e são contadas como **error budget exempted** (até 2× o tempo da janela).

---

## 10. Resumo executivo (1 slide)

**SLOs MVP (2026-Q4)**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DemoBR SLOs — MVP                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  API REST                          Player público                   │
│  ────────                          ──────────────                   │
│  Availability:  99.5%              Availability: 99.0%              │
│  p95 latency:   < 300ms            First Paint:    < 1.5s          │
│  5xx rate:      < 0.5%             LCP p95:        < 2.5s          │
│                                                                     │
│  Backup                            Webhooks                         │
│  ───────                           ─────────                        │
│  RPO:  1h                          1ª tentativa:    > 95%           │
│  RTO:  30min                       ≤ 8 tentativas:  > 99.5%         │
│  Sucesso: 100%                     Dead letter:     < 0.5%          │
│                                                                     │
│  Error budget mensal (API 99.5%):  ~25.000 req 5xx tolerados        │
│  Burn rate aceitável:              ~833 5xx/dia                     │
│  Code freeze trigger:              budget < 20% ou > 100% consumido  │
│                                                                     │
│  Revisão:                          mensal (SRE) + trimestral (lead)  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 11. Histórico de mudanças

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-10-18 | Criação inicial dos SLOs do MVP |

---

**Mantido por**: Tech lead DemoBR.
**Dashboard**: <https://easydemo.io/admin/observability/slos>
**Runbook geral**: `runbooks/observability.md`