# RFC — Clonagem brasileira do Supademo

> **Status:** Draft v1.0 — canônica para o primeiro commit.
> **Data:** 2026-10-18.
> **Autor:** arquiteto-chefe (síntese de research/demos, research/pricing, research/tech).
> **Audiência:** engenharia, produto, design, GTM, jurídico (LGPD).
> **Idioma do documento:** PT-BR (seção técnica pode usar termos EN consagrados).
>
> ⚠️ **Escopo do MVP:** ver [`docs/MVP-PLAN.md`](MVP-PLAN.md). Ele **prevalece**
> sobre a §1 (Especificação do MVP) e sobre as `mvp_phases` de
> `specs/mvp-scope.json`. Este RFC segue válido para **arquitetura, stack e
> ADRs**. As decisões de escopo do MVP foram revisadas contra dados de mercado
> (Supademo $4M ARR / 3.000 pagantes; State of Interactive Demos 2026) e
> registradas como D1–D12 no MVP Plan.

---

## 0. Sumário executivo

Um produto **SaaS de demos interativas guiado por clicks** (modelo Supademo/Storylane/Navattic), posicionado para o mercado brasileiro com três pilares: **preço em R$** com **PIX/boleto nativos**, **conformidade LGPD de ponta a ponta** (consentimento explícito, papéis operador↔controlador claros, DSR endpoint), e **player PT-BR-first** (texto, narração TTS pt-BR, WhatsApp CTA, embed otimizado para host BR). A operação cabe em **um único VPS 8 GB** servindo um monólito Next.js 15 + Postgres 16 + graphile-worker (Postgres-only, sem Redis) + Clerk (auth multi-tenant com Org nativo), com **Cloudflare R2 + CDN** servindo screenshots e áudio sem cobrança de egress — escolha que derruba o custo variável a quase zero até centenas de milhares de visualizações/mês. Pricing de entrada em **R$ 49/mês** (Pro) é ≈ 36 % mais alto que o GuiaFlow Pro (R$ 36) em troca de SaaS gerenciado com IA inclusa (vs BYOK), e **≈ 82 % mais barato** que a Supademo Scale ($50 USD ≈ R$ 275 com FX R$ 5,50/USD por research/pricing/competitors-pricing.md); Business em **R$ 199/mês** ancora o tier empresa sem canibalizar o Pro. Diferenciação vs GuiaFlow vem de **SaaS gerenciado** (sem BYOK, sem hospedar chave de IA, sem exportar HTML), **LGPD por design**, **analytics de verdade** (engagement por step), **API REST + MCP server** estilo GuiaFlow Pro/OpenAPI 3.1, e **integrações BR-first** (WhatsApp, HubSpot BR, RD Station, Asaas). Diferenciação vs Supademo vem de **preço** e **pagamento local** (PIX/boleto + NF-e). MVP em **4 fases de 6 semanas** (24 semanas até GA) entregável por 1 engenheiro full-stack sênior + 1 designer + 0,5 dev front-end para a extensão.

---

## 1. Especificação do MVP

> ⚠️ **Ver [`docs/MVP-PLAN.md`](MVP-PLAN.md) §4 (Escopo do MVP) e §8 (Fases).**
>
> A tabela P0/P1/P2 que existia aqui foi **revisada contra dados de mercado de
> Out/2026** (GetLatka: Supademo US$4M ARR / 3.000 pagantes; changelog oficial
> do Supademo de jan/2023 a out/2026; State of Interactive Demos 2026) e **não
> substitui mais o escopo do MVP**.
>
> O que mudou em relação a esta seção:
>
> | Item | Antes (aqui) | Agora (MVP Plan) |
> |---|---|---|
> | Embed | P1 | **P0** — já é Free no Supademo |
> | White-label player | P2 | **P0** — o `ThemeEditor` já existe, só o player ignora |
> | DSR endpoint LGPD | P2 | **já implementado** (`apps/web/app/api/dsr/route.ts`) |
> | TTS pt-BR | P1 | Fase 2 — custo mensal, não de adoção |
> | AI text personalisation | P1 | Fase 2 — dívida competitiva (o Free do Supademo já tem) |
> | CRM BR (HubSpot/RD/Kommo) | P1 | V2 — tier alto no Supademo |
> | Showcase /c/[slug] | P2 | Fase 2 — 1º upsell, decidido pelos dados do alpha |
> | Domínio customizado | P1 | V2 — Growth+ no Supademo |
> | — | — | 🆕 **Upload manual de screenshot** — P0, bloqueador do alpha |
> | — | — | 🆕 **Badge "Powered by EasyDemo"** — P0, canal #1 do Supademo |
> | — | — | 🆕 **Branding no player** — P0, parity gap interno |
> | — | — | 🆕 **Legal (CNPJ, DPO, docs)** — P0, gate de lançamento BR |
>
> **Regra vigente:** MVP = paridade com o core do Supademo (Free + Scale) +
> 3 gaps de mercado BR (PIX/BRL, LGPD/DSR, PT-BR). Tudo que o Supademo não tem
> **e** não é gap BR fica fora até os dados pedirem. Decisões D1–D12 no MVP Plan §3.
>
> **Fases de execução, arquivos, gates e lead times:** MVP Plan §8, §9 e §11.

## 2. Arquitetura técnica

### 2.1 Diagrama de componentes (ASCII)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              USUÁRIOS                                        │
│                                                                              │
│  Creator (Chrome)              Viewer (navegador BR)        Admin (web)       │
│  ┌──────────────┐              ┌────────────────┐          ┌────────────┐   │
│  │ Extensão MV3 │              │ Player público │          │ Dashboard  │   │
│  │ service wk   │              │ /d/[slug]      │          │ /app/*     │   │
│  └──────┬───────┘              │ /embed/[id]    │          └──────┬─────┘   │
│         │ upload               │ /c/[slug]      │                 │          │
│         │ screenshot+meta      └───────┬────────┘                 │          │
└─────────┼──────────────────────────────┼──────────────────────────┼──────────┘
          │                              │                          │
          ▼                              ▼                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Cloudflare edge (CDN + WAF)                          │
│  • DNS + DDoS + cache de assets                                              │
│  • Custom domain do player (Business tier)                                   │
│  • R2 bucket público via `cdn.dominio.com` (screenshots, áudio TTS, OG img)   │
└─────────┬────────────────────────────────────────────────────────────────────┘
          │ HTTPS (TLS Caddy)
          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│           VPS único 8 GB (Hetzner CX31 ou similar — ~R$ 150/mês)             │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐   │
│   │                    Docker compose stack                              │   │
│   │                                                                      │   │
│   │   ┌────────────────────────┐    ┌──────────────────────────────┐    │   │
│   │   │ Next.js 15 (App Router)│    │ graphile-worker (Node)       │    │   │
│   │   │ - App routes /app      │    │ - process_uploaded_demo       │    │   │
│   │   │ - API /api/v1          │◄──►│ - redact_sensitive_fields     │    │   │
│   │   │ - Player /d, /embed    │    │ - generate_og_image           │    │   │
│   │   │ - SSR + RSC            │    │ - tts_job (ElevenLabs)        │    │   │
│   │   └────────┬───────────────┘    │ - webhook_dispatch            │    │   │
│   │            │                    │ - send_invitation_email       │    │   │
│   │            │                    │ - sync_billing_event          │    │   │
│   │            │                    │ - lgpd_retention_cron         │    │   │
│   │            │                    │ - cleanup_expired_demos       │    │   │
│   │            │                    └──────────────┬───────────────┘    │   │
│   │            │                                   │                    │   │
│   │            ▼                                   ▼                    │   │
│   │   ┌────────────────────────────────────────────────────────────────┐    │   │
│   │   │ PostgreSQL 16 (com RLS e fila graphile-worker)               │    │   │
│   │   │ - RLS em TODAS tabelas com tenant_id                         │    │   │
│   │   │ - SET LOCAL app.current_tenant_id = '<uuid>' por conexão    │    │   │
│   │   │ - FORCE ROW LEVEL SECURITY (evita bypass do owner)          │    │   │
│   │   │ - workspaces, members, demos, steps, hotspots, plans,        │    │   │
│   │   │   subs, leads, webhooks, webhook_deliveries                  │    │   │
│   │   │ - events (analytics) partitioned by month                    │    │   │
│   │   │ - audit_logs, dsr_log (LGPD)                                 │    │   │
│   │   │ - _graphile_worker (fila)                                    │    │   │
│   │   └────────────────────────────────────────────────────────────────┘    │   │
│   │                                                                      │   │
│   │   ┌────────────────────────┐                                          │   │
│   │   │ Caddy reverse proxy    │                                          │   │
│   │   │ - TLS automático       │                                          │   │
│   │   │ - compressao            │                                          │   │
│   │   └────────────────────────┘                                          │   │
│   └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   Backups: pg_dump diário → R2 bucket privado (`backup-pg-encrypted`)        │
│   Monitoramento: Uptime Kuma (HTTP probe) + Better Stack (logs)              │
└─────────────┬────────────────────────────────────────────────────────────────┘
              │ Outbound HTTPS
              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          Integrações externas                                │
│                                                                              │
│  • Asaas (PIX, boleto, cartão, webhook)        — billing BR                   │
│  • OpenRouter / Anthropic / OpenAI              — AI text generation         │
│  • ElevenLabs / Cartesia                        — TTS pt-BR                  │
│  • HubSpot / RD Station / Kommo                 — CRM sync                   │
│  • Resend / Postmark                            — e-mail transacional        │
│  • Sentry                                        — error tracking            │
│  • Cloudflare R2                                 — object storage + CDN     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Stack definitiva (uma escolha por camada, justificada)

| Camada | Escolha | Justificativa (1 linha) |
|---|---|---|
| **Framework** | Next.js 15 (App Router, RSC) | Monólito único (frontend + API + player SSR), ecossistema maduro, deploy simples em Docker, suporte oficial a RSC para o player. |
| **Linguagem** | TypeScript 5.6 strict | Tipos compartilhados entre Next e workers, menos bugs, DX superior. |
| **UI** | Tailwind CSS 3.4 + shadcn/ui + Radix | Componentes acessíveis prontos, customização total, sem dependência de designer no MVP. |
| **Validação** | Zod 3.23 | Schemas compartilhados entre server actions, API REST e client. |
| **ORM** | Drizzle ORM 0.36 | TS-first, zero runtime, SQL transparente, migrations versionadas em SQL puro, melhor que Prisma para VPS enxuto. |
| **Banco de dados** | PostgreSQL 16 (self-hosted) | Roda no mesmo VPS 8 GB com `shared_buffers=2GB`, JSONB para steps/hotspots, full-text search nativo. |
| **Auth** | Clerk (Pro $25/mês) | **Org nativo** (workspaces) — essencial para multi-tenant B2B; SSO Enterprise incluso em Pro; SDK Next.js 15+ no dia 1; user data exportável (lock-in baixo). Free tier 50 k MAU. Fallback self-host: Lucia + DIY se custo for proibitivo, mas perde Org nativo e SSO. **Decisão alinhada com research/tech/backend-stack.md §4.** |
| **Fila** | `graphile-worker` (Postgres-only) | Sem Redis extra; benchmark 180k jobs/s em triviais; transacional (enfileira dentro da mesma transaction do INSERT); cron nativo para LGPD retention. Migração para BullMQ 5 + Redis fica como V2 quando latência enqueue→pickup > 1 s ou > 3 instâncias da API. **Decisão alinhada com research/tech/backend-stack.md §2.** |
| **Storage** | Cloudflare R2 | Zero egress fee, S3-API compatível, integrado com Cloudflare CDN, 10 GB/mês free. Hospeda screenshots, áudio TTS, OG images, backups. |
| **CDN** | Cloudflare (free tier) | DNS + DDoS + cache + R2 público; já gerencia domínio do player e da app. |
| **Reverse proxy** | Caddy 2 | TLS automático via Let's Encrypt, config trivial, gzip/brotli nativos. |
| **Containerização** | Docker Compose v2 | Single-host, sem Kubernetes; reproduzível entre dev/staging/prod. |
| **Payments BR** | Asaas (sub-conta ou conta única CNPJ) | PIX + boleto + NF-e + split + webhook HMAC; cobertura nacional; fee ~R$ 0,99 por PIX recebido. Stripe fica como fallback para EN. |
| **E-mail** | Resend | API simples, DKIM/SPF automático, free tier 3k/mês, PT-BR templates fáceis. |
| **Error tracking** | Sentry | Free tier 5k eventos/mês, source maps, alertas. |
| **Logs** | Pino → Better Stack (Logtail) | Structured JSON, free tier 1 GB/mês, query por `workspace_id`. |
| **Extensão** | Chrome MV3, Plumber/WXT (build) ou manual `manifest.json` + Vite | MV3 service worker; `chrome.tabs.captureVisibleTab` para screenshots; sem `tabCapture` no MVP. |
| **Testes** | Vitest (unit), Playwright (e2e do player + editor) | Mesma config do Next, rápido, e2e cobre fluxo crítico de captura→publicação→view. |
| **Lint/format** | Biome 1.9 | Substitui ESLint + Prettier, config única, mais rápido. |
| **CI** | GitHub Actions | Build + lint + test + push Docker image para GHCR; deploy via `docker compose pull && up`. |
| **Hospedagem VPS** | Hetzner CX31 (4 vCPU, 8 GB, 80 GB SSD) — ~€14/mês ≈ R$ 80 | Custo-baixo BR/EU, datacenters em Falkenstein/Helsinca, latência boa para BR via peering. Alternativa: Hostinger VPS BR (R$ 60–100). |
| **Domínios** | Registro.br (.com.br R$ 40/ano) + Cloudflare Registrar (app.en.com) | .com.br passa confiança ao lead BR; `.com` para o produto internacional. |

### 2.3 Modelo de dados (SQL DDL abreviado)

```sql
-- Schemas para multi-tenant separation of concerns
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Workspaces = tenant root
CREATE TABLE app.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(32) UNIQUE NOT NULL,            -- "acme", aparece em /app/[slug]
  name VARCHAR(120) NOT NULL,
  locale VARCHAR(5) NOT NULL DEFAULT 'pt-BR',  -- 'pt-BR' | 'en'
  plan_id VARCHAR(20) NOT NULL DEFAULT 'free', -- 'free' | 'pro' | 'business'
  subscription_id UUID REFERENCES app.subscriptions(id),
  asaas_customer_id VARCHAR(40),
  custom_domain VARCHAR(255),                  -- CNAME opcional (Pro/Business)
  brand_logo_r2_key VARCHAR(255),
  brand_color VARCHAR(16),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Members = users com role
CREATE TABLE app.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES app.workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(120),
  role VARCHAR(20) NOT NULL DEFAULT 'owner',    -- 'owner' | 'admin' | 'editor' | 'viewer'
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, email)
);

CREATE TABLE app.sessions (
  id TEXT PRIMARY KEY,                          -- Clerk session token (sess_*)
  member_id UUID NOT NULL REFERENCES app.members(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  user_agent_hash VARCHAR(64),                  -- SHA-256, sem PII
  ip_hash VARCHAR(64),                          -- SHA-256 + salt rotativo, agregado
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Demos = produto editorial
CREATE TABLE app.demos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES app.workspaces(id) ON DELETE CASCADE,
  slug VARCHAR(64) UNIQUE NOT NULL,             -- aparece em /d/[slug]
  title VARCHAR(180) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',  -- 'draft' | 'published' | 'archived'
  language VARCHAR(5) NOT NULL DEFAULT 'pt-BR',
  cover_r2_key VARCHAR(255),                    -- OG image
  lead_form_enabled BOOLEAN NOT NULL DEFAULT false,
  lead_form_consent_text TEXT,                  -- texto LGPD customizado
  final_cta JSONB,                               -- {type:'whatsapp',url:'...',label:'...'}
  variables JSONB,                               -- tokens default p/ personalização
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_demos_workspace ON app.demos(workspace_id, status);

-- Steps = uma tela capturada
CREATE TABLE app.steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_id UUID NOT NULL REFERENCES app.demos(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,                     -- ordem
  screenshot_r2_key VARCHAR(255) NOT NULL,
  source_url TEXT NOT NULL,                      -- URL original capturado
  source_title VARCHAR(255),
  caption TEXT,                                  -- texto do hotspot
  hotspot JSONB NOT NULL,                        -- {type:'pointer'|'callout'|'area', x,y,w,h, ...}
  voiceover_r2_key VARCHAR(255),                 -- TTS gerado
  voiceover_text TEXT,
  next_step_id UUID REFERENCES app.steps(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(demo_id, position)
);

-- Hotspots adicionais (caso step tenha múltiplos pontos clicáveis)
CREATE TABLE app.hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES app.steps(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,                     -- 'pointer' | 'callout' | 'area'
  geometry JSONB NOT NULL,                       -- {x,y,w,h} em % relativo
  action VARCHAR(20) NOT NULL DEFAULT 'next',      -- 'next' | 'branch' | 'url' | 'form'
  action_target JSONB,                           -- ex: {branchToStepId:'...'} ou {url:'...'}
  label TEXT
);

-- Plans + subscriptions (billing)
CREATE TABLE app.plans (
  id VARCHAR(20) PRIMARY KEY,                    -- 'free' | 'pro' | 'business'
  name_pt_br VARCHAR(40) NOT NULL,
  name_en VARCHAR(40) NOT NULL,
  price_brl_cents INTEGER NOT NULL,
  max_demos INTEGER,                             -- NULL = ilimitado
  max_steps_per_demo INTEGER,
  max_leads_per_month INTEGER,
  max_views_per_month INTEGER,                   -- soft cap
  tts_minutes_per_month INTEGER,
  ai_text_requests_per_month INTEGER,
  features JSONB NOT NULL                        -- array de strings p/ mostrar no /pricing
);

CREATE TABLE app.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES app.workspaces(id) ON DELETE CASCADE,
  plan_id VARCHAR(20) NOT NULL REFERENCES app.plans(id),
  asaas_subscription_id VARCHAR(40),
  status VARCHAR(20) NOT NULL,                   -- 'active' | 'past_due' | 'canceled' | 'trial'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads capturados pelo formulário de step 1 (LGPD operador = plataforma)
CREATE TABLE app.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES app.workspaces(id) ON DELETE CASCADE,
  demo_id UUID NOT NULL REFERENCES app.demos(id) ON DELETE CASCADE,
  name VARCHAR(120),
  email VARCHAR(255),
  phone VARCHAR(32),
  consent_text TEXT NOT NULL,                    -- texto exato mostrado
  consent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consent_ip_hash VARCHAR(64),                   -- hasheado, agregado LGPD
  user_agent_hash VARCHAR(64),
  extra JSONB,                                   -- campos customizados do form
  exported_at TIMESTAMPTZ,                       -- LGPD DSR: quando exportou/apagou
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_workspace ON app.leads(workspace_id, created_at DESC);
CREATE INDEX idx_leads_demo ON app.leads(demo_id);

-- Events = analytics LGPD-safe (sem IP, sem user_id)
CREATE TABLE analytics.events (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL,
  demo_id UUID NOT NULL,
  event_type VARCHAR(40) NOT NULL,               -- 'view' | 'step_seen' | 'cta_click' | 'complete' | 'bounce'
  step_id UUID,
  visitor_id_hash VARCHAR(64),                   -- cookie first-party _pk_id, 30d
  device_class VARCHAR(10),                      -- 'mobile' | 'tablet' | 'desktop'
  country_code VARCHAR(2),                       -- via Accept-Language apenas
  referrer_host VARCHAR(255),
  utm JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_demo ON analytics.events(demo_id, event_type, created_at DESC);
-- PARTITION BY RANGE (created_at) recomendado após 6 meses

-- Webhook deliveries
CREATE TABLE app.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES app.workspaces(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret VARCHAR(255) NOT NULL,                   -- HMAC-SHA256
  events TEXT[] NOT NULL,                        -- ['demo.viewed','demo.lead_captured',...]
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES app.webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(40) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt INTEGER NOT NULL DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DSR (LGPD art. 18) audit log
CREATE TABLE app.dsr_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES app.workspaces(id),
  lead_email VARCHAR(255),
  action VARCHAR(20) NOT NULL,                    -- 'export' | 'delete'
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'done' | 'rejected'
  notes TEXT
);
```

### 2.4 Fluxos críticos

#### 2.4.1 Signup → primeiro demo publicado (15 min ideal)

```
[BROWSER]                              [API]                              [DB]
  │── POST /api/auth/sign-up ────────►│                                       │
  │    {email, password, name}         │── INSERT member, workspace ────────►│
  │                                    │── send verification e-mail (Resend) │
  │◄─ 201 {workspace.slug} ───────────│                                       │
  │── GET /verify?token=... ─────────►│── mark email_verified ──────────────►│
  │── POST /api/demos ───────────────►│── INSERT demo (status=draft) ───────►│
  │                                    │                                       │
  │── [instala extensão MV3]          │                                       │
  │── [popup] "Iniciar captura"       │                                       │
  │── [clica 5 elementos no produto]  │                                       │
  │    └─ service worker ────► 5x PUT /api/demos/[id]/steps                │
  │                              (screenshot blob + meta) ──┘                │
  │── [editor] ajusta título/CTA       │                                       │
  │── [editor] publica ──► PUT /demos/[id]/publish ─► UPDATE status=published│
  │                                    │── og-image-job (graphile-worker) ──► R2  │
  │◄─ 200 {publicUrl:'/d/[slug]'} ───│                                       │
```

#### 2.4.2 Viewer assiste demo e vira lead (LGPD-safe)

```
[VIEWER]                       [PLAYER SSR]                       [DB]
   │                              │                                  │
   │── GET /d/[slug] ────────────►│── render SSR primeiro step      │
   │                              │── set _pk_id cookie (30d)      │
   │                              │── INSERT event 'view' ─────────►│
   │◄─ HTML ─────────────────────│                                  │
   │── POST /api/leads ──────────►│                                  │
   │   {name, email, consent}     │── validate Zod schema            │
   │                              │── INSERT lead ──────────────────►│
   │                              │── INSERT event 'lead_captured' ►│
   │                              │── dispatch webhook (graphile-worker) │
   │                              │── (opcional) trigger RD Station  │
   │◄─ 200 ──────────────────────│                                  │
   │── [clica CTA WhatsApp]       │                                  │
   │   └─ window.open wa.me/...   │                                  │
   │   └─ INSERT event 'cta_click'►                                  │
   │── [termina demo]            │                                  │
   │   └─ INSERT event 'complete' ►                                  │
```

#### 2.4.3 Captura (extensão MV3)

1. User clica ícone da extensão → popup com "Iniciar captura".
2. Service worker abre overlay na tab ativa (content script injeta `<div class="gf-overlay">`).
3. User clica em elemento → content script envia `chrome.runtime.sendMessage({type:'capture', elementRect, x, y, ...})` para service worker.
4. Service worker chama `chrome.tabs.captureVisibleTab({format:'png'})` → blob base64.
5. SW faz `POST /api/demos/[id]/steps` com `multipart/form-data` (screenshot + JSON meta).
6. API salva screenshot em R2 (`demos/{demo_id}/steps/{n}.webp` — convertida via sharp).
7. API retorna `step.id` + `hotspot default` (centro do clique).
8. Content script marca o clique com anel visual (UX feedback).
9. User clica "Parar" → SW fecha overlay, redireciona para `/app/[slug]/demos/[id]/edit?step=N`.

#### 2.4.4 Billing upgrade (Asaas)

1. User no dashboard clica "Upgrade Pro" → `POST /api/billing/checkout` com `plan_id=pro`.
2. API cria customer em Asaas (se não existe) e cria checkout com `billingType=PIX` (default) + alternativas `BOLETO` + `CREDIT_CARD`.
3. API retorna URL do checkout Asaas.
4. User paga PIX → Asaas chama webhook `POST /api/webhooks/asaas` com `event:PAYMENT_CONFIRMED` + HMAC.
5. API valida HMAC; UPDATE subscription.status='active'; UPDATE workspace.plan_id='pro'; INSERT event audit.
6. Email de confirmação enviado (Resend).
7. UI reflete plano imediatamente (revalidate via tag).

### 2.5 Decisões MV3 da extensão

| Decisão | Escolha | Por quê |
|---|---|---|
| Captura | `chrome.tabs.captureVisibleTab` (PNG, qualidade 90) | Mais simples, menos friction no Chrome Web Store review; **sem** `tabCapture`/`offscreen` no MVP. |
| Estado de captura | `chrome.storage.session` | Service worker pode morrer; storage de sessão é restaurável. |
| Comunicação SW ↔ content | `chrome.runtime.sendMessage` + `chrome.runtime.onMessage` | Padrão MV3; não usa `chrome.connect` (long-lived). |
| Overlay UI | Content script injeta `<div>` com Shadow DOM (CSS isolado) | Não conflita com CSS do site capturado. |
| Permissões | `activeTab`, `storage`, `scripting` | Mínimo necessário; sem `<all_urls>` (review mais simples). Host permissions opcionais via `optional_host_permissions` se o usuário quiser em sites restritos. |
| Build | WXT (framework MV3) ou `manifest.json` + Vite | WXT simplifica HMR e build multi-browser; pode ficar p/ V2. Para o MVP, manual + Vite. |
| Submissão CWS | Conta developer US$ 5 + privacy policy pública | Justification de uso de `activeTab` + `storage` bem documentada. |
| Sem `tabCapture`/`offscreen` no MVP | Decisão explícita | CWS review de MV3 com `tabCapture` é mais lento e exige justification extensa; adiável. |
| Versionamento | Semver da extensão desincronizado do app | Extensão tem `version` próprio no manifest. |

### 2.6 Decisões LGPD

| Tema | Decisão | Base legal |
|---|---|---|
| **Papéis** | Plataforma = **operadora**; Creator/Workspace = **controladora** dos leads que captura. Contrato de operador (anexo ao ToS) define finalidade, base legal e SLA. | LGPD art. 5º, 39º |
| **Consentimento** | Checkbox de consentimento **obrigatório e desmarcado por default**, vinculado ao **texto exato** exibido (armazenado em `leads.consent_text` + timestamp `consent_at`). | LGPD art. 7º, §1º, 8º |
| **Base legal para analytics** | Legítimo interesse do creator (art. 7º, VI), **anonimizado** desde a coleta (visitor_id = SHA-256 de cookie first-party + salt rotativo mensal; sem IP). Banner "Este demo usa analytics anônimos" no primeiro view, com opt-out via DNT/GPC respeitado. | LGPD art. 7º, VI; 18º |
| **IP** | **Nunca armazenado**. Apenas hasheado em logs efêmeros (24h) para rate-limit; depois apagado. Geolocalização usa **Accept-Language apenas**, nunca IP. | LGPD art. 18, IV e IX |
| **DSR endpoint** | `POST /api/dsr` aceita `email` do titular; envia token para o e-mail; titular usa token para `export` (JSON) ou `delete` (apaga leads + analytics agregados do `visitor_id_hash` correspondente, se conhecido). Log em `app.dsr_log`. SLA: 15 dias (LGPD art. 18, §5º). | LGPD art. 18 |
| **Retenção** | Leads: enquanto workspace estiver ativo + 90 dias após cancelamento, depois **apagados** (criptografados antes no backup). Analytics: agregados por 24 meses, depois **apagados**. Backups cifrados AES-256 em R2, política de retenção de 12 meses. | LGPD art. 16 (eliminação após cessada finalidade) |
| **DPO** | E-mail `dpo@dominio.com` público na Política de Privacidade; designação formal como DPO interno (não precisa ser externo para SaaS pequeno). | LGPD art. 41 |
| **Transferência internacional** | Todos os dados primários em VPS BR (Hetzner Falkenstein ou Hostinger BR); Cloudflare R2 pode ter réplica global mas **dados pessoais ficam em bucket BR** (region restriction no bucket R2 quando disponível; senão criptografados com chave no VPS). Sub-processadores: Cloudflare, Resend, Asaas, Sentry — todos listados na Política de Privacidade. | LGPD art. 33 |
| **Política de Privacidade** | Gerada a partir de template LGPD-friendly (modelo ANPD), revisada por advogado antes do GA. | LGPD art. 9º |
| **Registro de operações** | Não obrigatório (empresa de pequeno porte isenta em muitos casos), mas manter `app.dsr_log` + `app.audit_log` cobre o art. 37 se necessário. | LGPD art. 37 |
| **Encarregado (DPO)** | Designado internamente (1 pessoa do time), e-mail público. Para enterprise B2B com contratos grandes, upgrade para DPO externo (LGPD art. 41). | LGPD art. 41 |
| **Cookies** | Apenas 1 cookie **first-party** (`_pk_id`), 30 dias, **não essencial** (analytics). Banner com opt-out funcional. | LGPD art. 4º, 5º; Marco Civil da Internet |

---

## 3. Roadmap de execução

> ⚠️ **Ver [`docs/MVP-PLAN.md`](MVP-PLAN.md) §8 (Fases PR1 e F0–F10) e §9 (Gates).**
>
> O roadmap H1–H4 (24 semanas, 2,5 FTE) que existia aqui foi substituído pelo
> plano de fases F0–F10 com gates go/no-go verificáveis.
>
> **Por que a mudança de escala:** o H1–H4 era um plano de 24 semanas para
> *chegar ao GA*. O MVP Plan é o recorte para **conseguir os 5–10 primeiros
> clientes** — 22–26 dias de trabalho focalizado, com 10 gates que matam a
> hipótese no ponto certo. O que está fora do MVP foi reclassificado como
> Fase 2 / V2 na §4.2 do MVP Plan, não como "depois do GA".
>
> As fases do MVP Plan são executáveis por IA: cada uma tem arquivos exatos,
> acceptance criteria e comandos de validação.

## 4. Pricing em R$

> ⚠️ **Ver [`docs/MVP-PLAN.md`](MVP-PLAN.md) §5 (Planos e limites), §5.1
> (Justificativa dos preços) e §5.2 (Comparativo de mercado).**
>
> A tabela de pricing que existia aqui usava o modelo antigo de **view-cap**
> (Free 50, Pro 5.000, Business 50.000 views/mês) e **formulário de lead fora do
> Free**. O modelo vigente é **preço fechado por plano com views ilimitadas em
> todos os planos** e **lead form disponível em todos** — decisões D1 e D2.
>
> O motivo está na §2.5 do MVP Plan: é o que o Supademo faz (cobra por creator
> seat, viewers ilimitados) e é o principal churn lever do setor — o cliente
> Aviso é público sobre ter trocado do Storylane por causa de viewer licensing.
> No EasyDemo views ilimitadas não destroem margem porque o Cloudflare R2 não
> cobra egress.

## 5. Diferenciação vs GuiaFlow e players BR

### 5.1 Tabela de posicionamento

| Eixo | **Nosso clone (proposto)** | GuiaFlow Pro | Navattic / Storylane (Enterprise) | Supademo Scale |
|---|---|---|---|---|
| **Posicionamento** | SaaS BR gerenciado + LGPD + WhatsApp | Open-source + BYOK | Enterprise global USD | Global USD, AI-first |
| **Preço entrada** | R$ 49 (≈ $9) | R$ 36 (≈ $7, mas BYOK) | $400+/mês USD | $50/mês USD |
| **Pagamento BR** | PIX/boleto nativo (Asaas) | Stripe (PIX ok) | Stripe USD | Stripe USD |
| **LGPD** | By design, papéis claros, DSR endpoint | Bom, mas sem DSR endpoint | Variável | Adequado |
| **IA inclusa** | TTS pt-BR + AI text sem BYOK | BYOK (sua chave) | AI inclusa USD | AI inclusa USD |
| **Analytics** | Engagement por step + LGPD-safe | Básico | Avançado | Avançado |
| **WhatsApp CTA** | First-class | First-class | App nativo | App nativo |
| **CRM BR** | HubSpot BR, RD Station, Kommo | ❌ | ❌ | HubSpot/Salesforce US |
| **Open source** | Não | Sim (MIT editor + player) | Não | Não |
| **HTML clone** | V2 | ❌ | ✅ | ✅ |
| **AI Demo Agent** | V2 | ❌ | Em beta | ✅ pago |

### 5.2 Por que escolher este clone em vez de GuiaFlow

1. **SaaS gerenciado sem chave de API.** No GuiaFlow Free você usa sua chave OpenAI/Cartesia; no Pro o servidor hospeda. Aqui, **Pro inclui IA inclusa** sem fricção — para o creator BR não-técnico, isso é o diferencial decisivo.
2. **LGPD ponta-a-ponta com DSR endpoint.** GuiaFlow é privacy-friendly mas **não tem endpoint de DSR automatizado**; temos `POST /api/dsr` com token, exportação e deleção auditáveis.
3. **Analytics de engagement reais.** GuiaFlow analytics contam só `views`/`final click`. Medimos **completion rate, drop-off por step, CTR por CTA** — o que importa para o SDR que precisa qualificar lead.
4. **CRM BR nativo.** HubSpot BR, RD Station, Kommo com OAuth — não só Zapier genérico. Lead capturado vira contato + opportunity automaticamente.
5. **Billing 100 % BR com NF-e.** Asaas emite NF-e da plataforma; o creator Pro pode deduzir como despesa. GuiaFlow Pro passa por Stripe, NF-e só mediante pedido.

### 5.3 Por que escolher este clone em vez de Supademo

1. **PIX nativo**, boleto, NF-e em BRL — checkout pensado para o comprador BR, não adaptado de Stripe USD.
2. **75 % mais barato** no tier de entrada (R$ 49 vs R$ 250).
3. **Suporte em PT-BR**, e-mails transacionais em PT-BR, DPO acessível.
4. **Sem bloquear features atrás de "Enterprise custom"** — variáveis, custom domain, branching inclusos no Business de R$ 199.

---

## 6. GTM (Brasil)

> **Premissa:** MVP early-stage, sem brand, sem funil, sem tráfego. Recursos limitados → foco em canais de **baixo capex** e track record comprovado em SaaS B2B BR. **Benchmark:** PLG SaaS BR converte 2–5 % Free→Paid (vs 5–7 % nos EUA), ciclo de venda 30–90 dias, decisor é PMM/Head of Growth/Founder. **Pricing médio de SaaS BR é 30–50 % menor que EUA equivalente (PPP)** — daí o piso baixo do nosso Pro R$ 49. Fonte: `research/pricing/gtm-channels.md`.

### 6.1 Top 3 canais de aquisição (Tier 1)

| Canal | Por que | Como executar |
|---|---|---|
| **1. SEO orgânico (PT-BR) + Chrome Web Store listing** | Compra "demo interativa" / "tour interativo" no Brasil tem concorrência baixa em PT-BR e altíssima intenção (decisor buscando). CWS é canal #1 de aquisição para este tipo de produto — Supademo, Arcade, Storylane, Navattic, Tango todos têm extensão oficial. | Pillar pages para top 5 keywords (mín. 2.000 palavras cada). Compare pages estilo Supademo (vs Navattic, vs Storylane). CWS listing com title/description PT-BR + EN, meta ≥ 4,6 estrelas. Edge Store também. |
| **2. "Powered by" branding em demos publicadas** | Joseph Lee (Supademo) citou como growth tactic core (GetLatka 22:29). Cada demo publicada por usuário tem logo do produto no canto → descoberta orgânica para outros SaaS founders. | Adicionar branding "Feito com [DemoBR]" em todas as demos do free tier. Branding removível só no Business (R$ 199). |
| **3. Cold outbound + LinkedIn orgânico** | Decisor BR = PMM/Head of Growth/Founder. LinkedIn é canal #1 B2B BR. Founder posts 3-5/semana (build in public, lessons learned). | Cold messages hiper-qualificadas: 10–20/mês. Comentar em posts de Avinash Kaushik, Pedro Sobral (Locaweb), Bruno Brasil (RD Station), Bruno Valentim, Ícaro de Paula, Lucas Galvão (NeonPanda). |

### 6.2 5 keywords SEO PT-BR iniciais (Tier 1)

Baseado em `research/pricing/gtm-channels.md` §C (volumes estimados via Google Keyword Planner):

| Keyword | Intenção | Funil |
|---|---|---|
| **como fazer demo interativa** | Comparando ferramentas | Top of funnel (alto volume) |
| **tour interativo de produto** | Implementação | Mid funnel |
| **demonstração interativa de software** | Busca direta | Conversion |
| **alternativa ao Loom para demos** | Switch intent (rival direto) | Conversion |
| **ferramenta de demo para SaaS** | Comparação | Conversion |

Estimativa: pillar page no top 3 do Google para "como fazer demo interativa" = **300–1.500 visitas/mês qualificadas**. Top 3 para "melhor ferramenta de demo interativa" = **100–500 visitas/mês super-qualificadas**.

### 6.3 Canais Tier 2 (segundo sprint)

- **Podcasts fundadores SaaS BR** (founder = host convidado 1×/mês por 6 meses): SaaS BR Club, The BI Guru, 12:34 PM (RD Station), Mercado Binário, Cresça Rápido.
- **Product Hunt + BetaList** (lançamento terça 9h PT, mirar top 100 do dia).
- **Guest posts** em RD Station, Resultados Digitais, SaaS BR Club.
- **Programa de afiliados via Hotmart/Kiwify** (30 % recorrente por 12 meses) — alinhado ao benchmark de SaaS BR.

### 6.4 Canais Tier 3 (após PMF)

- **Compare pages em PT-BR**: "DemoBR vs Navattic", "Melhor ferramenta de demo interativa para SaaS BR", "Demo interativa vs Loom vs Zoom".
- **Integração CRM BR**: webhook nativo RD Station, lead capture → lead scoring, Account Reveal estilo Storylane/Navattic (diferencial competitivo enorme se grátis).

### 6.5 Decisor de compra BR (evidência)

- PMM/Head of Marketing/Head of Growth/Founder — não Engineering Manager.
- Ciclo de venda: 30–90 dias (vs 14–45 EUA). Trial sem cartão é crítico para reduzir fricção.
- **PIX recorrente é fundamental**: ME/EPP prefere PIX > cartão; boleto tem friction operacional; **empresas com PIX/boleto convertem 15–25 % mais trial→paid vs Stripe-only**.

### 6.6 Casos de uso verticais confirmados

1. **SaaS B2B** (MeeTime, Omie, RD Station) — core
2. **ERP/Gestão** (TOTVS, Senior, Sankhya) — forte, especialmente para reduzir ciclo de venda
3. **Educação/treinamento interno** (Tango, Scribe adjacentes) — adjacência
4. **Real estate / imobiliário** (Maestro ABM cita apartamento) — emergente
5. **Healthcare** — relativamente dormindo no BR (diferencial vs Navattic que tem clientes lá)

### 6.7 Orçamento GTM

| Ação | Budget/mês | Fase |
|---|---|---|
| Conteúdo SEO (3-4 posts) | R$ 1.500 (freelancer) | H2-H4 |
| CWS listing | R$ 0 + 1 dev day | H2 |
| LinkedIn orgânico | R$ 0 (founder time) | H1-H4 |
| Google Ads PT-BR | R$ 500 | H4 |
| Afiliados Hotmart | 30 % MRR (variável) | H4 |
| **Total GTM budget H4** | **R$ 2.000/mês + variável** | — |

---

## 7. Riscos

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| 1 | **Adoção baixa do Free por atrito na extensão** (Chrome Web Store review demorado, friction em instalar) | Média | Alta | Submeter extensão com `manifest` enxuto (só `activeTab`+`storage`, sem `<all_urls>`), privacy policy + screenshots. Plano B: editor "colar screenshot manualmente" no MVP se a extensão atrasar. |
| 2 | **Concorrência do GuiaFlow Free (open source MIT) "ser bom o suficiente"** | Alta | Média | Diferenciação por SaaS gerenciado (sem chave API), LGPD DSR, analytics engagement, CRM BR. Nunca competir por preço puro. |
| 3 | **Asaas instável / webhook não confiável** | Baixa | Alta | Plano B: Pagar.me (PIX + cartão), Stripe (EN). Health check em webhook Asaas; retry exponencial em graphile-worker; reconciliação diária com `GET /payments`. |
| 4 | **Receita de leads lenta (LGPD restritiva demais afastar creators)** | Média | Média | Consent text editável por creator; base legal padrão configurada para "execução de contrato" (art. 7º, V) além de consentimento; A/B testar copy do banner. |
| 5 | **VPS único = single point of failure** | Média | Alta | Hetzner Snapshots diários + restore testado mensal; backup pg_dump cifrado em R2. Plano B: failover para 2º VPS Hetzner com `repmgr` se SLA > 99.5 % virar requisito (empresa B2B). Custo: +R$ 80/mês. |

### 7.1 Riscos secundários (monitorar)

- **LGPD enforcement actions contra SaaS pequenos** (ANPD 2025–2026 apertando o cerco): Política de Privacidade revisada por advogado antes do GA; DPO designado.
- **Cloudflare R2 mudar política de preço**: lock-in baixo (S3-API) — migração para Backblaze B2 (S3-compatible) é trivial.
- **ElevenLabs/Cartesia preços subirem**: BYOK no Free + fallback para TTS local (Web Speech API) em pt-BR.
- **Mercado saturar com clones Supademo BR**: foco em diferenciação CRM BR + LGPD DSR + WhatsApp nativo.

---

## 8. Recursos para o primeiro commit

### 8.1 Pacotes npm exatos (versões pinadas)

> **Versões válidas em 2026-10-18.** Antes de instalar, rodar `npm view <pkg> version` para confirmar; patch releases são OK.

```jsonc
{
  "dependencies": {
    "next": "15.0.3",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "typescript": "5.6.3",
    "tailwindcss": "3.4.14",
    "@radix-ui/react-dialog": "1.1.2",
    "@radix-ui/react-dropdown-menu": "2.1.2",
    "@radix-ui/react-popover": "1.1.2",
    "@radix-ui/react-tooltip": "1.1.3",
    "@radix-ui/react-toast": "1.2.2",
    "class-variance-authority": "0.7.0",
    "clsx": "2.1.1",
    "tailwind-merge": "2.5.4",
    "lucide-react": "0.456.0",
    "drizzle-orm": "0.36.0",
    "postgres": "3.4.5",
    "@clerk/nextjs": "6.0.0",
    "graphile-worker": "0.16.6",
    "zod": "3.23.8",
    "react-hook-form": "7.53.1",
    "@hookform/resolvers": "3.9.1",
    "date-fns": "4.1.0",
    "nanoid": "5.0.7",
    "@aws-sdk/client-s3": "3.682.0",
    "@aws-sdk/s3-request-presigner": "3.682.0",
    "sharp": "0.33.5",
    "pino": "9.5.0",
    "pino-pretty": "11.3.0",
    "resend": "4.0.1",
    "@sentry/nextjs": "8.36.0",
    "@upstash/ratelimit": "2.0.3",
    "@vercel/og": "0.6.3",
    "openai": "4.71.1",
    "stripe": "17.3.1"
  },
  "devDependencies": {
    "@biomejs/biome": "1.9.4",
    "@types/node": "22.9.0",
    "@types/react": "19.0.0",
    "@types/react-dom": "19.0.0",
    "vitest": "2.1.4",
    "@vitejs/plugin-react": "4.3.3",
    "@playwright/test": "1.48.2",
    "drizzle-kit": "0.28.0",
    "tsx": "4.19.2",
    "msw": "2.6.4",
    "docker-compose": "1.0.3"
  }
}
```

### 8.2 Estrutura inicial de pastas (Next.js App Router + extensão)

```
easydemo/
├── apps/
│   ├── web/                          # Next.js 15 App Router
│   │   ├── app/
│   │   │   ├── (marketing)/          # Landing, /pricing, /sobre, /blog
│   │   │   │   ├── page.tsx
│   │   │   │   ├── pricing/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (auth)/               # /login, /signup, /verify
│   │   │   ├── (app)/                # /app/[slug]/*  (dashboard autenticado)
│   │   │   │   └── [workspace]/
│   │   │   │       ├── demos/
│   │   │   │       ├── leads/
│   │   │   │       ├── analytics/
│   │   │   │       ├── billing/
│   │   │   │       └── settings/
│   │   │   ├── d/[slug]/             # Player público
│   │   │   ├── c/[slug]/             # Showcase público
│   │   │   ├── embed/[id]/           # Player embeddable
│   │   │   ├── api/
│   │   │   │   ├── clerk/             # Clerk webhooks + sync Org → tenant_id
│   │   │   │   ├── v1/               # REST pública
│   │   │   │   │   ├── demos/route.ts
│   │   │   │   │   ├── leads/route.ts
│   │   │   │   │   └── webhooks/route.ts
│   │   │   │   ├── webhooks/
│   │   │   │   │   └── asaas/route.ts
│   │   │   │   ├── billing/
│   │   │   │   │   ├── checkout/route.ts
│   │   │   │   │   └── portal/route.ts
│   │   │   │   ├── dsr/route.ts
│   │   │   │   ├── og/route.tsx      # @vercel/og dinâmico
│   │   │   │   └── cron/
│   │   │   │       ├── billing-renewal/route.ts
│   │   │   │       └── free-quota-reset/route.ts
│   │   │   ├── layout.tsx            # Root layout
│   │   │   ├── globals.css
│   │   │   └── not-found.tsx
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn-style primitives
│   │   │   ├── editor/               # DemoEditor, StepCard, HotspotPicker
│   │   │   ├── player/               # PlayerShell, HotspotOverlay, CtaButton
│   │   │   ├── analytics/            # DashboardCharts (recharts)
│   │   │   ├── billing/              # PlanCard, CheckoutButton
│   │   │   └── forms/                # LeadForm, ConsentCheckbox
│   │   ├── lib/
│   │   │   ├── auth.ts               # Clerk helpers (auth(), currentUser(), getOrgId())
│   │   │   ├── db.ts                 # Drizzle client
│   │   │   ├── r2.ts                 # S3-compatible client (R2)
│   │   │   ├── queue.ts              # graphile-worker task list (Postgres-only)
│   │   │   ├── asaas.ts              # Asaas SDK wrapper
│   │   │   ├── resend.ts             # E-mail client
│   │   │   ├── sentry.ts             # Sentry init
│   │   │   ├── lgpd/
│   │   │   │   ├── consent.ts        # textos padrão
│   │   │   │   ├── dsr.ts            # export/delete
│   │   │   │   └── retention.ts      # cron jobs
│   │   │   ├── analytics/
│   │   │   │   ├── visitor.ts        # cookie first-party
│   │   │   │   └── events.ts         # insert + batch
│   │   │   ├── ratelimit.ts
│   │   │   ├── i18n/
│   │   │   │   ├── messages.pt-BR.json
│   │   │   │   └── messages.en.json
│   │   │   └── utils.ts              # cn(), formatters BRL, etc.
│   │   ├── server/
│   │   │   ├── actions/              # Server actions (Next 15)
│   │   │   │   ├── demo.ts
│   │   │   │   ├── lead.ts
│   │   │   │   └── billing.ts
│   │   │   └── repositories/         # Drizzle query helpers
│   │   ├── db/
│   │   │   ├── schema/
│   │   │   │   ├── app.ts            # workspaces, members, demos, steps, hotspots, plans, subs, leads
│   │   │   │   ├── analytics.ts      # events
│   │   │   │   └── index.ts
│   │   │   ├── migrations/           # drizzle-kit output
│   │   │   └── seed.ts
│   │   ├── public/                   # estáticos + og default
│   │   ├── messages/                 # i18n JSON
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   ├── e2e/                  # Playwright
│   │   │   └── fixtures/
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.ts
│   │   ├── drizzle.config.ts
│   │   ├── biome.json
│   │   ├── vitest.config.ts
│   │   ├── playwright.config.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   └── extension/                    # Chrome MV3
│       ├── manifest.json
│       ├── service-worker.ts
│       ├── content-script.ts
│       ├── popup/
│       │   ├── popup.html
│       │   └── popup.ts
│       ├── icons/                    # 16/32/48/128
│       ├── lib/
│       │   ├── api.ts                # fetch para a app
│       │   └── storage.ts            # chrome.storage.session
│       └── vite.config.ts
├── packages/
│   ├── shared/                       # types + zod schemas compartilhados
│   │   ├── src/
│   │   │   ├── schemas/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   └── package.json
│   ├── ui/                           # design system compartilhado
│   │   └── package.json
│   └── workers/                      # graphile-worker runner (Postgres-only; sem Redis)
│       ├── src/
│       │   ├── queues/
│       │   │   ├── tts.ts
│       │   │   ├── og-image.ts
│       │   │   ├── webhook.ts
│       │   │   └── dsr.ts
│       │   └── index.ts
│       ├── Dockerfile
│       └── package.json
├── infra/
│   ├── docker-compose.yml            # Next + Postgres + Redis + Workers + Caddy
│   ├── docker-compose.prod.yml
│   ├── caddy/
│   │   └── Caddyfile
│   ├── postgres/
│   │   └── postgresql.conf
│   └── cron/
│       └── crontab
├── scripts/
│   ├── seed.ts
│   ├── backup-pg.sh                  # pg_dump → R2 cifrado
│   └── restore-pg.sh
├── .github/
│   └── workflows/
│       ├── ci.yml                    # lint + test + build
│       ├── deploy.yml                # push image + compose pull/up
│       └── extension-publish.yml
├── docs/
│   ├── RFC-Brazilian-Supademo.md     # ← este documento
│   ├── ARCHITECTURE.md
│   ├── LGPD.md
│   ├── RUNBOOK.md
│   └── ADRs/
├── specs/
│   └── mvp-scope.json
├── research/
│   ├── demos/
│   ├── pricing/
│   └── tech/
├── .env.example
├── .gitignore
├── biome.json
├── package.json                      # workspace root
├── pnpm-workspace.yaml
└── README.md
```

### 8.3 Variáveis de ambiente (`.env.example`)

```dotenv
# ──────── App ────────
NODE_ENV=production
APP_PORT=3000
APP_BASE_URL=https://app.dominio.com.br
PLAYER_BASE_URL=https://app.dominio.com.br       # mesmo host (CNAME separado para embed)
MARKETING_BASE_URL=https://www.dominio.com.br
LOCALE_DEFAULT=pt-BR
LOCALE_SUPPORTED=pt-BR,en

# ──────── Database ────────
DATABASE_URL=postgres://app:CHANGEME@postgres:5432/supademo
DATABASE_POOL_SIZE=10

# ──────── Auth (Clerk) ────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# ──────── Cloudflare R2 ────────
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_PUBLIC=demo-public                  # screenshots, áudio, og (público via CDN)
R2_BUCKET_PRIVATE=demo-private                 # backups cifrados, leads export
R2_PUBLIC_BASE_URL=https://cdn.dominio.com.br

# ──────── Billing Asaas ────────
ASAAS_ENVIRONMENT=sandbox                       # sandbox | production
ASAAS_API_KEY=
ASAAS_WEBHOOK_SECRET=CHANGEME
ASAAS_PIX_ENABLED=true
ASAAS_BOLETO_ENABLED=true
ASAAS_CARD_ENABLED=true

# ──────── Billing Stripe (EN/Enterprise) ────────
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_BUSINESS_MONTHLY=

# ──────── AI ────────
OPENROUTER_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
ELEVENLABS_API_KEY=
CARTESIA_API_KEY=

# ──────── E-mail (Resend) ────────
RESEND_API_KEY=
EMAIL_FROM="DemoBR <noreply@dominio.com.br>"
EMAIL_DPO="dpo@dominio.com.br"

# ──────── Error tracking (Sentry) ────────
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=

# ──────── Rate limit (Upstash) ────────
# Upstash Redis é serverless via HTTP REST, não exige container Redis local.
# Usado por @upstash/ratelimit para limit de API endpoints.
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ──────── Analytics & cookies ────────
VISITOR_COOKIE_NAME=_pk_id
VISITOR_COOKIE_TTL_DAYS=30
ANALYTICS_HASH_SALT_ROTATION_DAYS=30

# ──────── LGPD ────────
LGPD_LEAD_RETENTION_DAYS=90                     # após cancelamento do workspace
LGPD_ANALYTICS_RETENTION_MONTHS=24
LGPD_BACKUP_RETENTION_MONTHS=12
LGPD_DSR_SLA_DAYS=15

# ──────── Cloudflare (CDN) ────────
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
CLOUDFLARE_ACCOUNT_ID=
```

### 8.4 `docker-compose.yml` (esqueleto)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: supademo
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./infra/postgres/postgresql.conf:/etc/postgresql/postgresql.conf:ro
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 10s

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file: .env
    depends_on:
      postgres: { condition: service_healthy }
    ports:
      - "127.0.0.1:3000:3000"
    deploy:
      resources:
        limits: { cpus: '2.0', memory: 2G }

  workers:
    build:
      context: ./packages/workers
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file: .env
    depends_on:
      postgres: { condition: service_healthy }
    deploy:
      resources:
        limits: { cpus: '1.0', memory: 1G }

  caddy:
    image: caddy:2
    restart: unless-stopped
    volumes:
      - ./infra/caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    ports:
      - "80:80"
      - "443:443"

volumes:
  pgdata:
  caddy_data:
  caddy_config:
```

> **Nota:** `graphile-worker` roda no mesmo container `web` OU em um container `workers` separado (recomendado em prod para isolamento de crash). **Sem Redis** — a fila usa tabelas internas do Postgres (`_graphile_worker`). Migration inicial via `graphile-worker --schema-only` cria a estrutura.

### 8.5 `apps/web/Dockerfile` (esqueleto)

```dockerfile
FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile --filter "./apps/*"

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=build /app/apps/web/public ./public
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### 8.6 Comandos iniciais (em ordem)

```bash
# 1. Clonar/init
pnpm dlx create-next-app@15 web --typescript --tailwind --app --src-dir=false --import-alias="@/*"
# (mover para apps/web e ajustar)

# 2. Adicionar deps principais
pnpm add drizzle-orm postgres @clerk/nextjs graphile-worker zod @aws-sdk/client-s3 \
  @aws-sdk/s3-request-presigner sharp pino pino-pretty resend @sentry/nextjs \
  @upstash/ratelimit openai stripe lucide-react class-variance-authority \
  clsx tailwind-merge nanoid date-fns

# 3. Devs
pnpm add -D drizzle-kit @biomejs/biome vitest @playwright/test tsx @types/node

# 4. Banco local
docker compose up -d postgres redis
pnpm exec drizzle-kit generate
pnpm exec drizzle-kit migrate

# 5. Dev
pnpm dev

# 6. Build prod
docker compose -f infra/docker-compose.prod.yml up -d --build
```

---

## 9. Referências (research/)

Esta RFC foi **embasada e validada** contra os artefatos em `research/` (populados por subagentes em 2026-10-18):

### 9.1 Análise de concorrentes (research/demos/)

| Arquivo | Conteúdo |
|---|---|
| `arcade.md` | Arcade: pivot para "AI video playground"; tiers Free/Growth $50/Enterprise; HTML capture só Enterprise |
| `getdemo.md` | GetDemo: agência/serviço BR |
| `guiaflow.md` | **GuiaFlow: rival direto BR**, MIT open-core, Pro R$ 36/mês, MCP server + OpenAPI 3.1, BYOK |
| `loom.md` | Loom: comparativo (Loom = vídeo, Supademo = interativo) |
| `navattic.md` | Navattic: pricing não publicado acima do Free |
| `scribe.md` | Scribe: documentation, não interativo direto |
| `storylane.md` | Storylane: tiers $50/$625/$1500/Enterprise com RepX agent |
| `supademo.md` | **Supademo: alvo de clonagem**, tiers $0/$50/$249/$450/Enterprise, AI Demo Agents |
| `tango.md` | Tango: documentation/SOP, não concorrente direto |
| `README.md` | Sumário dos concorrentes |

### 9.2 Pricing (research/pricing/)

| Arquivo | Conteúdo |
|---|---|
| `supademo-pricing.md` | Tabela detalhada Supademo + add-on AI Demo Agent |
| `competitors-pricing.md` | **FX base R$ 5,50/USD**, comparativo Arcade/Storylane/Navattic/Tango/Scribe/Loom |
| `brazilian-players-pricing.md` | Comparativo players BR (GuiaFlow, Guideflow.com, Karumi, Saleo, GetDemo) |
| `supademo-traction.md` | Tração da Supademo (200k+ profissionais, G2 #5, $50M+ ARR de GH) |

### 9.3 Tecnologia (research/tech/)

| Arquivo | Conteúdo |
|---|---|
| `backend-stack.md` | **Next.js 15 App Router** (escolhido), **graphile-worker** (escolhido), upload R2 presigned, **Clerk** (escolhido) |
| `database-model.md` | **RLS com tenant_id** (escolhido), multi-tenant strategies, Drizzle ORM |
| `payments-brazil.md` | **Asaas** (escolhido), comparativo Mercado Pago/Pagar.me/Stripe Brasil |
| `chrome-extension-mv3.md` | MV3 patterns, `chrome.tabs.captureVisibleTab`, decisão de **NÃO usar tabCapture/offscreen** no MVP |
| `public-player.md` | Player architecture, embed patterns, performance |
| `analytics-stack.md` | LGPD-safe analytics, cookie first-party, eventos engagement |

### 9.4 Fontes primárias (URLs)

- **Supademo:** https://supademo.com, https://supademo.com/pricing, https://supademo.com/features, https://supademo.com/openapi.json
- **GuiaFlow:** https://guiaflow.pro, https://github.com/gugamistri/gflow (MIT, 31⭐), https://app.guiaflow.pro/v1/openapi.json, https://app.guiaflow.pro/mcp
- **Cloudflare R2:** https://developers.cloudflare.com/r2/pricing/ — $0.015/GB-mês, 10 GB free, zero egress
- **Chrome MV3:** https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3
- **LGPD:** Lei nº 13.709/2018 (Brasil)

---

**Fim da RFC v1.0.** Próximos passos: (1) revisão por 1 advogado LGPD antes do H3; (2) compra do domínio `.com.br` no Registro.br; (3) provisionar Hetzner CX31; (4) abertura de CNPJ ME/EPP para Asaas.

---

**Fim da RFC v1.0.** Próximos passos: (1) revisão por 1 advogado LGPD antes do H3; (2) compra do domínio `.com.br` no Registro.br; (3) provisionar Hetzner CX31; (4) abertura de CNPJ ME/EPP para Asaas.