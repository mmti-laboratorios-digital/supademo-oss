# Recomendação final — stack DemoBR (clone Supademo BR)

> Stack recomendada, baseada em 10 documentos de pesquisa neste diretório. Restrições do brief: **1 VPS 8 GB Hetzner, time pequeno, PT-BR first, LGPD compliant, self-serve.**

---

## 1. TL;DR — Stack em uma frase por camada

| Camada | Escolha | Justificativa em 1 linha |
|--------|---------|-------------------------|
| **Front / App full-stack** | Next.js 15 (App Router, RSC, Node runtime) | Fullstack real (API + admin + landing + embed), RSC economiza JS no cliente, ecossistema enorme, TypeScript nativo |
| **Editor (extensão Chrome)** | MV3 vanilla TS + Vite + WXT, sem framework | MV3 é obrigatório; bundle precisa ser ≤ 1 MB; SW leve é crítico |
| **Bibliotecas de tour/overlay** | `@floating-ui/dom` + `framer-motion` + `@guideflow/core` (FSM) | MIT, leves, acessíveis; intro.js/shepherd.js são AGPL — evitar |
| **Backend / API** | Next.js Route Handlers + `next/server` | Já dispensa dentro do Next; sem necessidade de serviço separado |
| **Banco de dados** | Postgres 16 + Drizzle ORM + RLS | Multi-tenant com segurança no DB, Drizzle bundle ~7KB, migrations SQL reviewable |
| **Filas / Workers** | `graphile-worker` (Postgres-only, sem Redis) | Zero infra extra, transacional, cron nativo, > 100k jobs/dia — suficiente |
| **Object storage** | Cloudflare R2 (S3-compatible) | Egress grátis — economia de centenas de reais vs S3 em serving público |
| **CDN / Edge** | Cloudflare (DNS + proxy + cache) | DDoS grátis + edge + integração nativa com R2 |
| **Reverse proxy / TLS** | Caddy (no VPS) | Let's Encrypt automático, config mínima |
| **Orquestração** | Docker Compose (não K3s) | 1 VPS não justifica K3s; compose é mais simples; migração para K3s trivial depois |
| **Auth + Organizations** | Clerk (Pro $25/mo) | Org nativo + SSO Enterprise incluso | Sem reinventar auth |
| **Email transacional** | Resend ($20/mo, free 3k) | React Email SDK + free tier útil + DX #1 |
| **Pagamento BR** | Asaas (PIX + Boleto + Cartão recorrente) | API Subscription nativa + PIX recorrente + webhooks maduros |
| **Analytics** | PostHog Cloud (free 1M eventos/mês) | Product analytics + funnels + session replay, OTel-native |
| **Observability** | SigNoz self-host + OpenTelemetry | Logs + metrics + traces em 1 backend; sem Datadog |
| **Backup DB** | pgBackRest + repo em R2 | PITR, encriptação, compressão paralela |
| **LGPD tooling** | Tesseract.js (OCR) + sharp (blur) + pgcrypto (colunas) | OCR detecta PII, sharp aplica blur, pgcrypto criptografa colunas |

---

## 2. Stack detalhada por camada

### 2.1 Frontend (Admin + Landing + Editor)

**Next.js 15 App Router** com:
- `react@19`, `react-dom@19`
- `@clerk/nextjs@^6` — auth
- `tailwindcss@^3.4` — utility CSS
- `shadcn/ui` (CLI copy-paste) — componentes (Radix + Tailwind)
- `@tanstack/react-query@^5` — data fetching (server actions + RSC já cobrem 80%)
- `framer-motion@^11` — animações
- `@floating-ui/dom@^1.6` — posicionar tooltips/popovers
- `zod@^3.23` — validação
- `react-hook-form@^7.53` — forms
- `next-themes@^0.3` — dark/light
- `sonner@^1.5` — toasts
- `lucide-react@^0.460` — ícones

**Por que Next.js fullstack?** RSC economiza JS no cliente, Route Handlers elimina NestJS/Express, Server Actions simplificam mutations, edge runtime opcional para Vercel-deploy futuro.

### 2.2 Extensão Chrome (MV3)

- Linguagem: TypeScript estrito
- Build: `wxt@^0.18` (Vite-based framework para extensões, sucessor moderno de Plasmo)
- Bundler: Vite (built-in no WXT)
- Estado: Zustand 5 (no popup) + `chrome.storage.session` (no SW)
- Comunicação: `chrome.runtime.sendMessage` + `comlink@^4.4`
- UI: React 19 (no popup + viewer) + Tailwind (opcional)
- Captura: `chrome.tabs.captureVisibleTab` + `chrome.scripting.executeScript`
- Para Sandbox mode (Fase 2): `@rrweb/record@^2.0`

**Por que WXT em vez de Plasmo/CRXjs?** WXT é mais leve (sem Next.js embutido), tree-shaking agressivo, file-based routing moderno.

### 2.3 Player público (biblioteca + embed)

- `@easydemo/core` — state machine (port de `@guideflow/core` pattern)
- `@easydemo/player` — React 19 component
  - `framer-motion@^11` para transições entre passos
  - `@floating-ui/dom@^1.6` para posicionar tooltips
  - `zustand@^5` para state machine
  - `dompurify@^3.1` se aceitar HTML em captions
- `@easydemo/embed-loader` — vanilla TS, ~3 KB, cria iframe
- Formato de demo: **JSON Schema próprio** (inspirado em Spotlane)
- Coordinate system: **fracionário (0-1)** para todos os hotspots, image_size_width/height em px

### 2.4 Backend (API + jobs)

**Next.js Route Handlers** com:
- `@clerk/nextjs/server` — auth server
- `drizzle-orm@^0.36` + `drizzle-kit@^0.28` — ORM + migrations
- `postgres@^3.4` (Porsager) — driver
- `zod@^3.23` — input validation
- `@aws-sdk/client-s3@^3.680` + `@aws-sdk/s3-request-presigner` — R2 SDK
- `graphile-worker@^0.16` — job queue
- `pino@^9.5` + `pino-pretty` — logs
- `@sentry/nextjs@^8` — errors
- `resend@^4` + `@react-email/components@^0.0.30` — email

### 2.5 Banco de dados

**Postgres 16** (versão canônica — ver `docs/ADRs/ADR-013-postgres-16-canonical.md`) com:
- Schema `public` único
- RLS ativado em todas tabelas tenant-scoped
- `pgcrypto` para colunas PII
- `pg_partman` para partitioning de `demo_events` por mês
- `pgBackRest` para backup

### 2.6 Auth

**Clerk Pro ($25/mo)** com:
- Organizations (multi-tenant)
- SSO Enterprise incluso
- Webhooks para sync com Postgres
- Componentes pré-construídos

### 2.7 Pagamento

**Asaas** (API REST + webhooks):
- Subscriptions API para recorrência
- billingType: `CREDIT_CARD | PIX | BOLETO`
- Cycle: `MONTHLY`
- Webhook events: `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `SUBSCRIPTION_INACTIVATED`

### 2.8 Email

**Resend Pro ($20/mo)** com:
- React Email components
- Free tier 3k emails (dev)
- Webhooks de delivery

### 2.9 Analytics

**PostHog Cloud (free tier até 1M eventos)** com:
- Eventos custom: `demo_view`, `step_view`, `cta_click`, `demo_complete`, `lead_capture`
- Session replay (5k/mês free)
- Dashboard iframe embed no nosso admin

### 2.10 Observability

**SigNoz self-host** em Docker Compose (no VPS):
- ClickHouse como storage
- OpenTelemetry SDK em Next.js e Worker
- Dashboards + alertas
- ~1.5-2 GB RAM

### 2.11 Infra

**Hetzner CPX32** (4 vCPU, 8 GB RAM, 160 GB NVMe) — ~€35/mo:
- Ubuntu 24.04 LTS
- Docker + Docker Compose
- Caddy como reverse proxy
- `unattended-upgrades` habilitado
- Firewall Hetzner (stateful)
- Snapshot semanal (~€1/mo)

**Cloudflare (free/Pro)**:
- DNS proxied para VPS
- CDN para assets do R2
- R2 bucket para storage
- Workers (opcional para edge logic)

### 2.12 LGPD pipeline

- Pré-captura (extensão): mask `input[type=password]`, `input[name*=cpf]`, etc.
- Pós-captura (backend): Tesseract.js OCR + regex PII → sharp blur overlay
- UI de revisão no editor antes de publicar
- pgcrypto para colunas PII em PG
- Criptografia AES-256-CBC em backups pgBackRest
- Retention jobs (graphile-worker cron):
  - 30 dias após soft delete → wipe images
  - 24 meses audit logs → anonymize
  - 90 dias demo_events raw → purge (manter agregados)
- DPA com todos subprocessadores (Hetzner, Cloudflare, Clerk, Asaas, Resend, PostHog)

---

## 3. Dependências npm — versões alvo

### 3.1 Apps (Next.js)

```json
{
  "name": "easydemo-app",
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@clerk/nextjs": "^6.0.0",
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.4",
    "drizzle-zod": "^0.5.0",
    "zod": "^3.23.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "next-themes": "^0.3.0",
    "sonner": "^1.5.0",
    "lucide-react": "^0.460.0",
    "framer-motion": "^11.0.0",
    "@floating-ui/react": "^0.26.0",
    "@tanstack/react-query": "^5.59.0",
    "@aws-sdk/client-s3": "^3.680.0",
    "@aws-sdk/s3-request-presigner": "^3.680.0",
    "@upstash/ratelimit": "^2.0.0",
    "@vercel/og": "^0.6.3",
    "resend": "^4.0.0",
    "@react-email/components": "^0.0.30",
    "@sentry/nextjs": "^8.40.0",
    "pino": "^9.5.0",
    "svix": "^1.41.0",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "drizzle-kit": "^0.28.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.0",
    "eslint": "^9.0.0",
    "prettier": "^3.3.0",
    "vitest": "^2.1.0",
    "@playwright/test": "^1.48.0",
    "pino-pretty": "^11.3.0"
  }
}
```

### 3.2 Worker (graphile-worker)

```json
{
  "name": "easydemo-worker",
  "dependencies": {
    "graphile-worker": "^0.16.0",
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.4",
    "tesseract.js": "^5.1.0",
    "sharp": "^0.33.5",
    "@aws-sdk/client-s3": "^3.680.0",
    "resend": "^4.0.0",
    "@react-email/components": "^0.0.30",
    "pino": "^9.5.0",
    "@opentelemetry/api": "^1.9.0",
    "@opentelemetry/sdk-node": "^0.54.0",
    "@opentelemetry/exporter-trace-otlp-http": "^0.54.0",
    "@opentelemetry/resources": "^1.27.0",
    "@opentelemetry/semantic-conventions": "^1.27.0",
    "@opentelemetry/instrumentation-undici": "^0.7.0"
  }
}
```

### 3.3 Extensão (WXT)

```json
{
  "name": "easydemo-extension",
  "dependencies": {
    "wxt": "^0.18.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@floating-ui/dom": "^1.6.0",
    "zustand": "^5.0.0",
    "nanoid": "^5.0.0",
    "comlink": "^4.4.0",
    "webextension-polyfill": "^0.10.0",
    "chrome-screenshot-api": "^1.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/chrome": "^0.0.280",
    "@types/webextension-polyfill": "^0.10.7",
    "vitest": "^2.1.0",
    "@playwright/test": "^1.48.0"
  }
}
```

### 3.4 Player (biblioteca)

```json
{
  "name": "@easydemo/player",
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@floating-ui/react": "^0.26.0",
    "framer-motion": "^11.0.0",
    "zustand": "^5.0.0",
    "posthog-js": "^1.180.0",
    "dompurify": "^3.1.6",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/react": "^19.0.0",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vitest": "^2.1.0",
    "@playwright/test": "^1.48.0",
    "size-limit": "^11.1.0"
  }
}
```

### 3.5 Backend (Drizzle schemas — para versionar separadamente)

```json
{
  "name": "@easydemo/db",
  "dependencies": {
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.4",
    "drizzle-zod": "^0.5.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28.0",
    "typescript": "^5.6.0"
  }
}
```

---

## 4. Estimativa de complexidade (cada parte)

### 4.1 MVP (Fase 1) — total L (3-4 meses, 1 dev sênior)

| Componente | Tamanho | Estimativa (semanas) |
|------------|---------|----------------------|
| Setup Next.js + Drizzle + Clerk | S | 1 |
| RLS + middleware de tenant | M | 1 |
| Schema DB completo + migrations | M | 1 |
| API REST demos (CRUD + upload sign) | M | 2 |
| **Extensão MV3 (MVP)** | **M** | **3** |
| Editor web (preview + edição simples) | M | 2 |
| **Player público + embed loader** | **S-M** | **1.5** |
| Asaas webhook + idempotência | M | 1.5 |
| graphile-worker + jobs principais | S-M | 1 |
| pgBackRest + R2 | M | 1 |
| SigNoz self-host + OTel SDK | M | 1 |
| Frontend admin (shadcn) | M | 1.5 |
| Frontend landing + pricing | S | 1 |
| **LGPD pipeline (OCR + blur)** | **M** | **2** |
| CI/CD GitHub Actions | S | 0.5 |
| QA, deploy, polish | M | 2 |

**Subtotal: ~20 semanas (5 meses) com 1 dev.** Mais realista: 3-4 meses com 1 dev sênior full-stack.

### 4.2 Fase 2 (meses 4-6)

| Componente | Tamanho |
|------------|---------|
| Sandbox HTML mode (clone de páginas) | L |
| Sandbox replay mode (rrweb) | L |
| Remotion video export | L |
| AI voiceover (ElevenLabs) | M |
| AI translation / AI demo audit | M |
| Multi-gateway (Stripe + Asaas) | L |
| Session replay dashboard custom (Tremor) | L |

### 4.3 Esforço por camada

| Camada | Esforço relativo |
|--------|------------------|
| Front (admin + landing) | M |
| Back (API + jobs) | M |
| DB | M |
| Queue | S |
| Storage | S |
| CDN | S |
| Payments | M |
| Analytics | S |
| Infra | M |
| LGPD | M |
| Extensão MV3 | M-L |
| Player público | S-M |

---

## 5. Custo mensal estimado (VPS + serviços)

| Item | Custo |
|------|-------|
| Hetzner CPX32 | €35 (~R$ 200) |
| Hetzner Snapshot | €1 |
| Cloudflare R2 (100 GB + 1M reqs) | ~$2 |
| Cloudflare (free tier) | $0 |
| PostHog Cloud (free) | $0 |
| SigNoz self-host | $0 (usa VPS) |
| Asaas (taxas por transação) | variável |
| Resend Pro (50k emails) | $20 |
| Clerk Pro (até 10k MAU) | $25 |
| **Subtotal fixo** | **~$85/mo + R$ 200** |

**Custo variável:** Asaas ~R$ 0,50 por transação PIX; ~R$ 0,49 + 1,99% cartão; Cloudflare R2 só cresce se storage+egress crescer.

**Total realista MVP: ~R$ 700-800/mo + custo variável de pagamentos.**

Após 100 clientes pagantes (R$ 50/mo cada), **break-even de infra** = ~14 clientes.

---

## 6. Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| RLS bypass por bug de migration | Baixa | **Alto** | `FORCE ROW LEVEL SECURITY` + testes de leak + code review obrigatório |
| Service Worker dorme e perde eventos | Média | Médio | Usar `chrome.storage.session` para buffer; sync ASAP; heartbeat com `chrome.alarms` |
| Vendor lock-in Clerk | Baixa | Médio | Exportar hashes de usuário periodicamente; documentar migração |
| LGPD não conformidade | Média | **Alto** | DPO interno + revisão trimestral + DPIA + DPAs assinados |
| VPS única indisponível | Média | Alto | Snapshot diário + backup off-site (R2) + runbook de DR; aceitar SLA menor que 99.9% no MVP |
| Cold start do Next.js | Baixa | Baixo | RSC + ISR + cache agressivo no Cloudflare |
| rrweb bundle grande (Fase 2) | Baixa | Médio | Lazy load + considerar HTML sandbox simples como padrão |
| Custos Asaas subindo | Média | Médio | Negociar volume; oferecer Stripe em plano enterprise |

---

## 7. Não-objetivos (explícitos)

Para manter foco no MVP, decidimos **NÃO construir** na Fase 1:

- Multi-idioma do player (só PT-BR).
- Sandbox HTML mode (só screenshots no MVP).
- Sandbox replay mode (rrweb) — Fase 2.
- Remotion video export — Fase 2.
- AI features (voiceover, translation, audit) — Fase 2.
- Mobile app nativo — web responsivo no player é suficiente.
- Webhooks públicos para clientes integrarem com seus CRMs — Fase 2.
- API pública documentada — Fase 2.
- 99.9% SLA formal — aceitável 99% no MVP.

---

## 8. Roadmap sugerido

### Mês 1-2: Fundação
- VPS provisionado, Docker Compose base, Caddy, SigNoz.
- Next.js 15 + Drizzle + Clerk + RLS + migrations.
- Schema DB completo.
- API CRUD básica + auth.

### Mês 2-3: Captura
- Extensão MV3 com captura básica (1 captura por click, sem full-page).
- Upload presigned R2 funcionando.
- Job graphile-worker `process_demo` com OCR PII.
- Editor web mínimo (lista demos + preview).

### Mês 3-4: Player + Analytics
- Player público React + embed loader.
- PostHog SDK + dashboard embed.
- API de eventos.
- Frontend landing + pricing + Asaas checkout.

### Mês 4-5: Polish + Beta
- LGPD pipeline completo (revisão manual no editor).
- CI/CD + monitoring + alertas.
- Documentação legal (DPA, política de privacidade).
- Beta fechado com 10 clientes.

### Mês 5-6: Launch
- Marketing site público.
- Onboarding guiado.
- Suporte (Resend + Intercom ou Crisp).
- Launch público.

### Mês 6+: Fase 2 (Sandbox + AI)

---

## 9. TL;DR para apresentar ao time

> Vamos montar um SaaS BR de demos interativas com:
> - **Next.js 15 + Postgres + R2** como core técnico (full-stack TypeScript, multi-tenant seguro, egress grátis no storage).
> - **Clerk** para auth (organizações nativas + SSO incluso).
> - **Asaas** para pagamento (PIX + boleto + cartão recorrente, tudo na mesma API).
> - **Extensão Chrome MV3** capturando screenshots + cliques via service worker + content script.
> - **Player React público** embutido via `<script>` ou `<iframe>`, com hotspots em coordenadas fracionárias.
> - **graphile-worker + Postgres-only** para jobs (sem Redis no MVP).
> - **PostHog + SigNoz** para analytics e observability.
> - **Hetzner 8GB + Docker Compose** (não K3s) por simplicidade.
> - **pgBackRest + Cloudflare R2** para backup com PITR.
> - **LGPD desde o design** com OCR + blur + criptografia at-rest.
>
> MVP em 3-4 meses com 1 dev sênior. Custo fixo ~R$ 700/mo + variável de pagamentos.

---

## 10. Notas sobre ADRs pré-existentes no `README.md`

O `README.md` deste diretório contém **ADRs cativos** já registrados que esta pesquisa **levanta questionamentos** mas não contradiz:

| ADR pré-existente | Esta pesquisa recomenda | Por quê diverge |
|--------------------|-------------------------|-----------------|
| ADR-005: **Better-Auth** (TS-first, OAuth + magic link) | **Clerk** | Clerk tem Organizations nativas (essencial multi-tenant B2B), SSO Enterprise incluso em Pro ($25/mo vs $125 do WorkOS), UX pré-construída, free tier 50k MAU. Para SaaS B2B pequeno, Clerk reduz semanas de implementação. Se preferir self-host puro, Better-Auth é válido. |
| ADR-002: **PostgreSQL self-hosted** em vez de Supabase/Neon | **Postgres self-hosted + R2** | Concordamos — sem dependência SaaS externa para dados primários, LGPD-friendly. |
| ADR-003: **Cloudflare R2** | **Cloudflare R2** | Concordamos. |
| ADR-004: **Drizzle ORM** | **Drizzle ORM** | Concordamos. |
| ADR-006: **Asaas** | **Asaas** | Concordamos. |
| ADR-007: **MV3 captureVisibleTab only** | **`captureVisibleTab` + `scripting.executeScript` no MVP** | Concordamos — `tabCapture`+offscreen só na Fase 2 (sandbox mode). |
| (não tem) | **graphile-worker** (não mencionado) | Recomendação nova — Postgres-only queue, sem Redis no MVP. |
| (não tem) | **PostHog Cloud** (Sentry no README) | Sentry é para errors; PostHog cobre funis + session replay, que Sentry não faz. Usar **ambos**. |

**Plano de ação:**
1. Apresentar este `RECOMMENDATION.md` ao time.
2. Atualizar `README.md` para refletir novos ADRs (se aprovados): ADR-008 graphile-worker, ADR-009 PostHog, ADR-010 SigNoz, ADR-011 Clerk (revoga ADR-005 se aprovado), etc.
3. Criar `RFC-Brazilian-Supademo.md` consolidado apontando para este diretório como single source of truth.

---

## 11. Documentos de referência neste diretório

| Doc | Conteúdo |
|-----|----------|
| `chrome-extension-mv3.md` | Captura via MV3, alternativas (rrweb, html2canvas), limitações |
| `public-player.md` | Player JS, embed strategies, A11y, mobile, SEO |
| `backend-stack.md` | Next.js 15, queue, upload, auth, email |
| `database-model.md` | Postgres RLS, schemas, ORM |
| `analytics-stack.md` | PostHog vs Plausible vs Mixpanel, eventos, funis |
| `payments-brazil.md` | Asaas, Mercado Pago, Pagar.me, Stripe BR |
| `infra-vps.md` | Hetzner, K3s vs Compose, Cloudflare, pgBackRest, SigNoz |
| `lgpd-recording.md` | Mascaramento PII, criptografia, retenção |
| `open-source-reference.md` | GuideFlow.js, Spotlane, rrweb, libs reusáveis |
| `architecture-diagram.md` | Diagramas Mermaid completos |
| `INDEX.md` | Índice navegável desta pasta |

---

**Pronto para implementar.** Começar pela infraestrutura (VPS + Docker Compose + SigNoz + pgBackRest) em paralelo com setup do Next.js + Drizzle + Clerk. A extensão pode esperar até Mês 2.