# Mapa de Decisões Arquiteturais — DemoBR

> Visão de 1 página com **decisão principal** vs **alternativa rejeitada** vs **link para ADR**. Use este documento como índice executivo.

**Status global:** as 13 decisões estão em **Accepted** e em produção no MVP. Revisões programadas: Q4 2026 (pós-launch público).

> A decisão 003 (banco) teve a **versão do Postgres superseded** por
> [ADR-013](ADRs/ADR-013-postgres-16-canonical.md): a canônica é **16**, que é o
> que está no `docker-compose` desde o scaffold. O `17` documentado na ADR-003
> nunca foi implementado.

## Tabela mestra

| # | Camada | Decisão escolhida | Custo fixo/mo | Alternativa rejeitada | Por que rejeitada | ADR |
|---|---|---|---|---|---|---|
| 001 | Monorepo | **pnpm workspaces** + versions catalog | €0 | Turborepo | Cache remoto pago, abstração extra sem ganho no MVP | [ADR-001](ADRs/ADR-001-monorepo-pnpm-workspaces.md) |
| 002 | Framework | **Next.js 15 App Router** + Route Handlers | €0 | NestJS + Next separados | Dois deploys, duplica auth/validação, consome RAM extra | [ADR-002](ADRs/ADR-002-nextjs-15-app-router.md) |
| 003 | Banco | **Postgres 16 self-hosted** no Hetzner | €0 (já incluso) | Supabase / Neon / RDS | LGPD (residência), lock-in, custo de egress recorrente | [ADR-003](ADRs/ADR-003-postgres-17-self-hosted-hetzner.md) · versão em [ADR-013](ADRs/ADR-013-postgres-16-canonical.md) |
| 004 | ORM | **Drizzle** + drizzle-zod | €0 | Prisma | Bundle ~500 KB vs ~7 KB; engine Rust separada; migrations não-SQL | [ADR-004](ADRs/ADR-004-drizzle-orm.md) |
| 005 | Auth | **Clerk Pro** | $25 (R$ 150) | Auth.js / Lucia / Better-Auth / WorkOS | Organizations + SSO inclusos; só WorkOS tem SSO mas custa $125/mo e exige combinar com outro login | [ADR-005](ADRs/ADR-005-clerk-pro.md) |
| 006 | Storage | **Cloudflare R2** + CDN Cloudflare | ~$2 (100 GB) | AWS S3 / MinIO / Backblaze B2 | Egress grátis (R2) vs $0.09/GB (S3) — economia anual > R$ 5k | [ADR-006](ADRs/ADR-006-cloudflare-r2-cdn.md) |
| 007 | Fila | **graphile-worker** (Postgres-only) | €0 | BullMQ+Redis / SQS / Inngest | Sem Redis (já temos Postgres); transacional; cron nativo | [ADR-007](ADRs/ADR-007-graphile-worker.md) |
| 008 | Pagamento BR | **Asaas** | variável (taxa) | Mercado Pago / Pagar.me / InfinitePay / Stripe | Único gateway BR com subscription + PIX recorrente + NF-e automática | [ADR-008](ADRs/ADR-008-asaas.md) |
| 009 | Orquestração | **Hetzner CPX32 + Docker Compose** | €35 (R$ 200) | K3s / Nomad / EKS-GKE-DOKS | K3s consome 1.4 GB RAM à toa; K8s gerenciado > $70/mo | [ADR-009](ADRs/ADR-009-hetzner-cpx32-docker-compose.md) |
| 010 | Backup DB | **pgBackRest** (PITR + AES-256) → R2 | ~$1 (storage) | WAL-G / Barman / pg_dump / Hetzner Snapshots | PITR real até o segundo; AES-256 nativo; restore parcial | [ADR-010](ADRs/ADR-010-pgbackrest.md) |
| 011 | Observability | **SigNoz self-host** + OpenTelemetry | €0 (RAM) | Datadog / Grafana Cloud / New Relic / Sentry-only | Tudo-em-um (logs+metrics+traces); self-host LGPD; OTel vendor-neutral | [ADR-011](ADRs/ADR-011-signoz-opentelemetry.md) |
| 012 | i18n | **JSON messages custom** (pt-BR-first) | €0 | i18next / FormatJS / Lingui | Zero bundle, dev PT-BR edita JSON direto; migração futura trivial | [ADR-012](ADRs/ADR-012-pt-br-first-i18n.md) |

## Custo fixo total (MVP)

| Componente | Custo/mo | Observação |
|---|---|---|
| Hetzner CPX32 | €35 (~R$ 200) | já cobre VPS+Compose |
| Hetzner Snapshot | €1 | backup volume-level |
| Cloudflare R2 | ~$2 | 100 GB storage + 1M reqs |
| Cloudflare (free) | $0 | DNS + CDN |
| PostHog Cloud (free tier) | $0 | product analytics |
| Clerk Pro | $25 | até 10k MAU |
| Resend Pro | $20 | 50k emails |
| SigNoz self-host | $0 | usa VPS |
| Asaas (taxas) | variável | ~R$ 0,99/PIX + R$ 0,49 + 1,99%/cartão |
| **Total fixo** | **~$85/mês + R$ 200** | |

**Break-even de infra: ~14 clientes pagantes a R$ 50/mês.**

## Decisões adiadas (Fase 2)

| Item | Quando | Por quê adiar |
|---|---|---|
| Sandbox HTML mode (clone de páginas) | Mês 6+ | Complexidade alta; cliente pediu? Validar primeiro |
| Sandbox replay mode (rrweb) | Mês 6+ | Bundle grande; sandbox HTML é alternativa mais leve |
| Remotion video export | Mês 6+ | Feature de marketing, não MVP |
| AI voiceover (ElevenLabs) | Mês 6+ | Custo variável; precisa validar willingness-to-pay |
| Stripe como gateway secundário USD | Quando tiver clientes enterprise EN | Foco é BR no MVP |
| 99.9% SLA formal | Pós-MRR R$ 30k | Custa HA + replica; aceitamos 99% no MVP |
| Migrar Turborepo/Nx | Se `pnpm -r` ficar > 4 min com > 20 pacotes | Não urgente |
| Migração para K3s | > 20 microserviços | Não urgente |

## Cadeia de dependências críticas

```
Hetzner VPS ──┬── Postgres 16 (self-host)
              └── Docker Compose ──┬── Next.js 15 (Next + Clerk SDK + Drizzle)
                                  ├── graphile-worker (Postgres-only)
                                  ├── pgBackRest → R2
                                  ├── SigNoz → ClickHouse
                                  └── Caddy (reverse proxy + TLS)

Externos:
Clerk (auth) ──────────┐
Asaas (pagamento) ─────┤── via /api/webhooks/*
Resend (email) ────────┤
Cloudflare R2 ─────────┤── storage
PostHog Cloud ─────────┘── product analytics
```

## Princípios de revisão

- **Cada ADR tem status** Accepted/Proposed/Rejected/Superseded.
- **Revisão anual** em Q4 (todos os 13 ADRs).
- **Mudança de contexto** (ex.: custo de egress cai, novo S3 compatível) ⇒ reabrir ADR relevante.
- **Toda nova decisão** precisa de ADR em `docs/ADRs/ADR-NNN-titulo.md` antes de implementação.

## Próximas decisões a documentar

| ADR proposta | Status | Trigger |
|---|---|---|
| ADR-013: Cloudflare como WAF | Proposed | Ativar rate-limit + bot management |
| ADR-014: Next.js middleware para RLS context | Proposed | Padrão `SET LOCAL app.current_workspace_id` |
| ADR-015: LlamaIndex + pgvector para AI audit | Proposed | Quando AI features entrarem em roadmap |
| ADR-016: pg_partman para analytics.events | Proposed | Quando volume passar 10M eventos/mês |
| ADR-017: Headscale (Tailscale self-host) para VPN entre VPSs | Proposed | Quando tivermos replica Hetzner |

---

**Mantido por:** Tech lead DemoBR.
**Última atualização:** 2026-10-18.