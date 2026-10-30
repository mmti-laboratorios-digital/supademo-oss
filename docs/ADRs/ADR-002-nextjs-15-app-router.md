# ADR-002: Next.js 15 com App Router como framework fullstack

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Tech lead DemoBR, Founding engineer

## Context and Problem Statement

O DemoBR precisa entregar três superfícies distintas:

1. **Painel admin/editor** (autenticado, dashboard, CRUD de demos, billing).
2. **Landing page pública** (pricing, marketing, SEO).
3. **API REST** consumida pela extensão Chrome, player embed, integrações externas e MCP.

Tradicionalmente isso exigiria dois serviços: framework React para UI + framework Node (NestJS/Express/Fastify) para API. Mas com React Server Components, Server Actions e Route Handlers do Next.js 15, é viável unificar tudo em um único processo Node, **sem perder a separação de concerns**. Devemos decidir se adotamos o monolito Next.js ou se dividimos em dois serviços.

Restrições adicionais:
- 1 VPS Hetzner CPX32 (8 GB RAM) — não cabe dois runtimes Node gordos.
- Time pequeno (1–3 devs) — separar significa 2 deploys, 2 logs, 2 surfaces de ataque.
- Player público precisa ser SSR-friendly para SEO de demos publicadas.

## Decision Drivers

- **Uma única base de código TypeScript** para UI e API.
- **Mínimo de containers em produção** (1 processo Next + 1 worker Node + 1 Postgres + 1 Caddy).
- **DX consistente** — middleware, auth, validação, logger compartilhados.
- **SEO forte** — landing page e demos públicas precisam de SSR/RSC.
- **OpenAPI** ainda precisa ser servida (Route Handlers com `app/api/v1/...`).

## Considered Options

1. **Next.js 15 (App Router, RSC, Route Handlers)** — fullstack em um único processo.
2. **NestJS** como API + **Next.js** como frontend (dois serviços).
3. **Remix** — concorrente direto do Next, React-based, fullstack.
4. **SvelteKit** — fullstack em Svelte, ótimo DX, ecossistema menor.

## Decision Outcome

**Chosen option: "Next.js 15 App Router + Route Handlers"**, porque elimina um serviço inteiro do orçamento operacional (sem segunda instância Node, sem segunda pipeline de CI, sem segundo certificado TLS), mantém um único middleware de auth (Clerk), e ainda dá RSC para o player público renderizar HTML SSR com hidratação mínima.

Detalhes da configuração:

- `app/(marketing)/*` — landing, /pricing, /blog, público, gerado estaticamente com ISR.
- `app/(app)/*` — admin autenticado com Clerk; layout chama `auth()` e redireciona.
- `app/api/v1/*` — Route Handlers REST tipados com Zod, retornam JSON puro.
- `app/d/[slug]/*` — página de demo pública; RSC carrega demo+steps do banco, renderiza OG tags, embute player.
- **Server Actions** (`"use server"`) para mutações internas do admin (criar demo, upload metadata), mas **toda API pública é Route Handler** porque MCP/extensão/integrações precisam REST OpenAPI.

### Positive Consequences

- 1 processo Node em produção (facilita `docker compose` e profiling).
- TypeScript compartilhado: Drizzle types fluem direto para props de RSC.
- RSC reduz drasticamente o JS enviado ao cliente no player público (bom para LCP em mobile BR, onde 3G ainda é relevante).
- `next start` em Docker é simples (`CMD ["node","server.js"]`).
- Middleware (`middleware.ts`) faz auth, i18n, rate-limit em uma camada só.
- Quando migrarmos para Vercel/edge runtime no futuro, zero refactor.

### Negative Consequences

- **Vendor lock-in moderado** com a Vercel (mesmo rodando self-hosted, várias APIs são Next-específicas).
- **Cold start** maior que Express puro (mitigado por RSC + cache; aceitável para tráfego BR).
- **Bundle do Next no cliente admin** pode ficar > 200 KB sem tree-shaking agressivo (mitigado com `dynamic import` para o editor).
- Documentação App Router ainda está evoluindo — bugs e breaking changes entre minor versions (risco controlado pinando `~15.1.0`).

### Follow-ups

- Adotar **React Compiler** quando estabilizar (RC em 2026); deve eliminar `useMemo`/`useCallback` manuais.
- Monitorar tamanho do bundle `/admin/editor` com `@next/bundle-analyzer` em CI (gate: > 350 KB → falha PR).

## Pros and Cons of the Options

### Next.js 15 App Router (escolhido)

- Good, fullstack real com tipagem compartilhada.
- Good, RSC reduz JS do player público.
- Good, ecossistema (shadcn, Clerk SDK, Sentry, Resend) é first-class.
- Bad, lock-in com Vercel APIs (Server Actions, route segment config).
- Bad, App Router ainda tem breaking changes entre minors.

### NestJS + Next.js

- Good, NestJS é opinião e estruturado (módulos, decorators, DI).
- Good, separação clara de API e UI.
- Bad, dois deploys, dois Caddy upstreams, dois Dockerfiles.
- Bad, duplica auth (Clerk middleware duas vezes), validação (Zod duas vezes), logger.
- Bad, Drizzle types no Nest exigem um pacote `@easydemo/db` adicional — overhead.
- Bad, Nest consome ~120 MB RAM ociosos; no CPX32 isso é dinheiro.

### Remix

- Good, modelagem de rotas é excelente (`loader`/`action`).
- Good, foco em progressive enhancement.
- Neutral, agora mantido pela Shopify (roadmap estável).
- Bad, comunidade menor; menos componentes prontos (shadcn é Next-first).
- Bad, integração com Clerk/Resend/Sentry tem SDKs mais frágeis.
- Bad, sem equivalente direto a `app router` para rotas paralelas/intercepting.

### SvelteKit

- Good, DX imbatível, bundle final pequeno.
- Good, Runes substitui hooks; curva de aprendizado pequena.
- Bad, ecossistema React (shadcn, framer-motion, react-hook-form) não aproveita.
- Bad, maioria do time conhece React; Svelte é aposta arriscada em 2026.
- Bad, libs de UI/AI (Mastra, Vercel AI SDK) são React-first.

## References

- [Next.js 15 release notes](https://nextjs.org/blog/next-15)
- [App Router docs](https://nextjs.org/docs/app)
- [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- RFC DemoBR §2.1, §2.2
- `research/tech/backend-stack.md` §1 — escolha de framework
- `research/tech/architecture-diagram.md` §1 — diagrama geral