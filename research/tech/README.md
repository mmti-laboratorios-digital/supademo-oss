# Research / Tech — stack e infraestrutura

> **Status (2026-10-18):** este diretório recebeu os artefatos-base da primeira varredura técnica. Subagentes devem **expandir** com POCs e benchmarks (latência de R2, custo Asaasais Lighthouse em VPS enxuto, etc.).

## Stack definitiva (single source of truth)

Ver `docs/RFC-Brazilian-Supademo.md` Seção 2.2.

## Custos de infraestrutura (estimativa mensal)

| Componente | Custo | Fonte |
|---|---|---|
| VPS Hetzner CX31 (4 vCPU, 8 GB, 80 GB SSD) | ~R$ 80 | https://www.hetzner.com/cloud |
| Cloudflare R2 (free tier 10 GB) | R$ 0 | https://developers.cloudflare.com/r2/pricing/ |
| Cloudflare CDN (free tier) | R$ 0 | https://www.cloudflare.com/plans |
| Resend (free tier 3k e-mails/mês) | R$ 0 | https://resend.com/pricing |
| Sentry (free tier 5k eventos/mês) | R$ 0 | https://sentry.io/pricing |
| Domínio .com.br (Registro.br, rateado) | ~R$ 4/mês | https://registro.br |
| **Total fixo** | **~R$ 84/mês** | — |

Custos variáveis (pay-as-you-go):

| Componente | Estimativa (Fee) |
|---|---|
| Asaas fee por PIX recebido | R$ 0,99 |
| OpenRouter (Claude Sonnet via OpenRouter) | ~$3/million tokens in / $15 out |
| ElevenLabs TTS (Creator tier) | $5/1k chars; estimativa ~R$ 50–60/mês para 30 min TTS no Pro |
| R2 storage além do free tier | $0.015/GB-mês |

## Benchmarks / referências

- **Cloudflare R2**: zero egress, S3-compatible; latência global via Cloudflare CDN.
- **Hetzner CX31**: 4 vCPU AMD EPYC, 8 GB RAM, NVMe SSD; medido ~9.500 req/s em Node 22 simples. Mais que suficiente para MVP.
- **PostgreSQL 16**: `shared_buffers=2GB` no VPS 8 GB; suporta 100+ conexões simultâneas com tuning conservador.
- **Chrome MV3**: `chrome.tabs.captureVisibleTab` (screenshot) é a abordagem mais CWS-friendly; `tabCapture`/`offscreen` adiciona friction na review.

## Decisões registradas (ADR candidates)

- **ADR-001**: VPS único Hetzner em vez de Vercel/Railway (controle de custos, LGPD data residency).
- **ADR-002**: PostgreSQL self-hosted em vez de Supabase/Neon (sem dependência SaaS externa para dados primários).
- **ADR-003**: Cloudflare R2 em vez de AWS S3 (zero egress; pricing previsível).
- **ADR-004**: Drizzle ORM em vez de Prisma (TS-first, zero overhead runtime, migrations em SQL puro).
- **ADR-005**: Better-Auth em vez de NextAuth/Lucia (Lucia foi descontinuada; Better-Auth é TS-first com OAuth + magic link prontos).
- **ADR-006**: Asaas em vez de Stripe para BR (PIX + boleto + split + NF-e nativos; Stripe fica fallback).
- **ADR-007**: MV3 com `captureVisibleTab` apenas (sem `tabCapture`/`offscreen`) no MVP — adiável para V2.

## Próximos passos

- POC: medir latência de R2 PUT/GET a partir de Hetzner Falkenstein.
- POC: stress test Postgres 16 com 1k conexões simultâneas no CX31.
- POC: TTS ElevenLabs vs Cartesia para pt-BR (qualidade, custo, latência).
- POC: Lighthouse score do player em 3G simulado.