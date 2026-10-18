# Índice — research/tech/

> 11 artefatos de pesquisa técnica para o SaaS de demos interativas (clone Supademo BR). Cada documento foca em 1 camada/domínio. `RECOMMENDATION.md` consolida tudo em 1 stack final recomendada.

## Estrutura

| Doc | Domínio | Linhas | Conteúdo principal |
|-----|---------|--------|--------------------|
| [chrome-extension-mv3.md](./chrome-extension-mv3.md) | Extensão Chrome | 366 | `chrome.tabs.captureVisibleTab`, `scripting.executeScript`, service worker + offscreen, comparativo rrweb/html2canvas, libs utilitárias |
| [public-player.md](./public-player.md) | Player público | 354 | Storylane/Navattic/Supademo anatomia, schema JSON do demo, React + Floating UI + framer-motion, embed via `<script>` ou `<iframe>`, A11y + mobile + SEO |
| [backend-stack.md](./backend-stack.md) | Backend | 457 | Next.js 15 App Router vs alternativas, graphile-worker vs BullMQ, Cloudflare R2, Clerk vs NextAuth vs Supabase, Resend vs Postmark |
| [database-model.md](./database-model.md) | Banco de dados | 451 | RLS multi-tenant, schemas (workspaces, demos, steps, hotspots, subscriptions, events), Drizzle vs Prisma vs Kysely |
| [analytics-stack.md](./analytics-stack.md) | Analytics | 274 | PostHog vs Plausible vs Mixpanel, schema de eventos, funis SQL passo-a-passo, LGPD em analytics |
| [payments-brazil.md](./payments-brazil.md) | Pagamentos BR | 368 | Asaas Subscriptions API, comparativo Mercado Pago/Pagar.me/Stripe, LGPD em webhooks, fluxo completo |
| [infra-vps.md](./infra-vps.md) | Infraestrutura | 544 | Hetzner, K3s vs Docker Compose, Cloudflare (R2/CDN/Workers), pgBackRest, SigNoz, custos mensais |
| [lgpd-recording.md](./lgpd-recording.md) | LGPD | 407 | Mascaramento PII em 3 camadas (extensão + OCR + UI), criptografia at-rest, retenção, subprocessadores |
| [open-source-reference.md](./open-source-reference.md) | Open source | 445 | GuideFlow.js, SubwatG/GuideFlow (extensão), Spotlane, rrweb, libs reusáveis |
| [architecture-diagram.md](./architecture-diagram.md) | Diagramas | 564 | Mermaid: fluxo geral, criação de demo, visualização, billing, backup, segurança, deploy |
| **[RECOMMENDATION.md](./RECOMMENDATION.md)** | **Recomendação final** | **501** | **Stack final, versões npm, complexidade por camada, custo mensal, riscos, roadmap** |

## Como ler

1. **Decisor** (time, lead) → comece por [`RECOMMENDATION.md`](./RECOMMENDATION.md). Tem tudo em 1 página: stack final, custo, complexidade, roadmap.

2. **Dev full-stack** → leia [`architecture-diagram.md`](./architecture-diagram.md) para visão geral, depois cada `.md` específico da sua camada.

3. **Dev de infra** → [`infra-vps.md`](./infra-vps.md) + [`database-model.md`](./database-model.md) (RLS).

4. **Dev da extensão** → [`chrome-extension-mv3.md`](./chrome-extension-mv3.md) + [`open-source-reference.md`](./open-source-reference.md) (estudar SubwatG/GuideFlow).

5. **Compliance / jurídico** → [`lgpd-recording.md`](./lgpd-recording.md) + [`payments-brazil.md`](./payments-brazil.md) (webhooks).

## Convenções dos documentos

Cada documento segue este padrão:

1. **Resumo executivo** (1-2 parágrafos)
2. **Comparativo de alternativas** com fontes citadas
3. **Decisão recomendada** com justificativa
4. **Stack concreta** (libs + versões)
5. **Estimativa de complexidade** (S/M/L)
6. **Snippet de código** quando aplicável
7. **Referências citadas** com URLs exatas

## Status dos artefatos

- ✅ Pesquisa inicial completa — fontes oficiais, GitHub, blogs de engenharia.
- ⏳ POCs pendentes — ver README.md do diretório (POCs de latência R2, stress test Postgres, Lighthouse do player).
- ⏳ Validação com time — precisa revisão do arquiteto sênior antes de virar ADRs formais.

Última atualização: 2026-10-18.