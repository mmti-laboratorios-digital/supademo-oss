# Analytics stack — funis, eventos e dashboards

> Como capturar, armazenar e visualizar eventos do player (views, step_views, cta_clicks, completion) para o dashboard do cliente SaaS.

---

## 1. Self-host vs SaaS — decisão

### 1.1 Comparativo

| Opção | Self-host? | Custo até 100k eventos/mês | DX | Lock-in | Indicado |
|-------|-----------|----------------------------|----|---------|----------|
| **PostHog** (self-host ou cloud) | ✅ (Docker Compose oficial) | Free tier cloud: 1M eventos; self-host: grátis (mas precisa infra) | Bom (SQL access) | Baixo (open-source MIT) | SaaS B2B que precisa funil + replays + flags |
| Plausible | ✅ | $9/mo cloud; self-host grátis | Simples | Baixo (AGPL) | Site analytics (marketing) |
| Umami | ✅ | Free cloud; self-host grátis | Simples | Baixo (MIT) | Alternativa Plausible |
| Matomo | ✅ | Free (open-source) | Verboso | Baixo (GPL) | GDPR-focused, enterprise |
| Mixpanel | ❌ | Free 20M eventos | Excelente | Alto | Sem restrições LGPD/equipe |
| Amplitude | ❌ | Free 10M eventos | Bom | Alto | Produto grande |

**Fontes:**
- PostHog vs Mixpanel: <https://posthog.com/blog/posthog-vs-mixpanel>
- PostHog vs Plausible: <https://posthog.com/compare/posthog-vs-plausible>
- PostHog self-host docs: <https://posthog.com/docs/self-host>
- Plausible repo: <https://github.com/plausible/analytics>

### 1.2 Decisão: **PostHog Cloud (free tier), self-host se escala**

**Por quê PostHog e não Plausible:**
- Plausible é **web analytics** (pageviews, sessions). Não tem funil customizado por passo de demo.
- PostHog tem **product analytics**: você cria eventos custom (`step_view`, `cta_click`, etc.) e funis arrastáveis.
- PostHog também tem **session replay** (free tier: 5k/mês web + 2.5k mobile) — útil para entender onde o lead trava no demo.
- Free tier generous: 1M eventos/mês + 5k replays/mês. Mais que suficiente para começar.
- SDK JS é leve (~45 KB) e já respeita cookieless / GDPR.

**Quando self-host:**
- > 1M eventos/mês.
- LGPD exige dados dentro do BR (PostHog Cloud tem região EU e US; não tem BR).
- 1 VPS nosso suporta o deploy hobby (recomendado 4 GB RAM).

PostHog self-host: <https://posthog.com/docs/self-host> — escala para ~100k eventos/mês em Docker Compose.

---

## 2. Event schema

### 2.1 Eventos emitidos pelo player

Definidos em `public-player.md` §7. Aqui definimos o **schema canônico** que vai para Postgres + PostHog.

```ts
type DemoEvent =
  | { type: 'demo_view'; demoId: string; sessionId: string; variant?: string }
  | { type: 'demo_start'; demoId: string; sessionId: string; stepId: string }
  | { type: 'step_view'; demoId: string; sessionId: string; stepId: string; position: number; dwellMs: number }
  | { type: 'cta_click'; demoId: string; sessionId: string; stepId: string; hotspotId: string; ctaUrl?: string }
  | { type: 'demo_branch'; demoId: string; sessionId: string; fromStepId: string; branchId: string; chosen: string }
  | { type: 'demo_complete'; demoId: string; sessionId: string; lastStepId: string; totalDwellMs: number }
  | { type: 'lead_capture'; demoId: string; sessionId: string; email: string; name?: string; company?: string }
  | { type: 'demo_exit'; demoId: string; sessionId: string; lastStepId: string; lastPosition: number; totalDwellMs: number };
```

### 2.2 Schema no Postgres

Tabela `demo_events` (particionada por mês) — definida em `database-model.md` §2.2.

Colunas:
- `id` UUID
- `tenant_id` UUID (workspace que publicou o demo)
- `demo_id` UUID
- `session_id` TEXT (cookie do visitante)
- `type` TEXT (enum-like)
- `step_id` UUID NULL
- `payload` JSONB (campos extras)
- `user_agent`, `country`, `referer`, `device_type`
- `created_at` TIMESTAMPTZ

Índices:
- `(demo_id, created_at DESC)` — funil
- `(tenant_id, created_at DESC)` — agregado por workspace
- `(session_id, created_at)` — replay de sessão individual

### 2.3 Schema no PostHog

PostHog aceita qualquer evento + properties. Vamos mandar os mesmos eventos mas com propriedade extra `tenant_id` e `plan` para filtrar globalmente.

```js
// SDK JS do player
posthog.capture('step_view', {
  distinct_id: sessionId,        // visitor anonymous ID
  tenant_id:       DemoBR.tenantId,
  demo_id:        DemoBR.demoId,
  step_id:        currentStep.id,
  position:       currentStep.position,
  dwell_ms:       stepDwellMs,
});
```

---

## 3. Como capturar funil "passo a passo onde abandonou"

### 3.1 Query SQL para funil por demo

```sql
WITH ordered_events AS (
  SELECT
    session_id,
    type,
    step_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at) AS rn
  FROM demo_events
  WHERE demo_id = $1
    AND type IN ('demo_start', 'step_view')
    AND created_at >= now() - interval '30 days'
),
funnel AS (
  SELECT
    step_id,
    COUNT(DISTINCT session_id) FILTER (WHERE rn >= 1) AS reached
  FROM ordered_events
  GROUP BY step_id
)
SELECT
  ds.position,
  ds.id AS step_id,
  ds.caption,
  f.reached,
  LAG(f.reached) OVER (ORDER BY ds.position) AS prev_reached,
  ROUND(100.0 * f.reached / NULLIF(LAG(f.reached) OVER (ORDER BY ds.position), 0), 1) AS pct_continue
FROM demo_steps ds
LEFT JOIN funnel f USING (step_id)
WHERE ds.demo_id = $1
ORDER BY ds.position;
```

### 3.2 Métricas-chave

| Métrica | Definição | Por que importa |
|---------|-----------|-----------------|
| **Demo start rate** | `demo_start / demo_view` | Quantos viram e começaram |
| **Step-through rate** | `step_view(N+1) / step_view(N)` | Onde abandonaram |
| **Median dwell per step** | `median(dwell_ms) by step_id` | Passos confusos (alto dwell) ou pulados (baixo) |
| **CTA click-through** | `cta_click / step_view(step with CTA)` | Eficácia dos hotspots |
| **Completion rate** | `demo_complete / demo_start` | Funil macro |
| **Branching distribution** | `count by branch_id` | Qual caminho preferido |
| **Time-to-convert** | `demo_complete.created_at - demo_view.created_at` | Engajamento profundo |

### 3.3 Visualização

Dashboard no PostHog:
- **Insight 1: Funnel** `demo_view → demo_start → step_1_view → ... → step_N_view → demo_complete`
- **Insight 2: Step-by-step drop-off** com tabela por posição mostrando reached e %.
- **Insight 3: Trends** dos eventos por dia/semana.
- **Insight 4: Top demos** por views/completions.

No nosso próprio dashboard (Next.js + shadcn):
- Server-side query ao nosso Postgres (`demo_events`) com materialized views.
- Atualização hourly via `graphile-worker` (`refresh_demo_analytics`).
- Embedar PostHog dashboard via iframe (`share_url`) ou construir com Tremor.

---

## 4. Privacidade & LGPD

- **Não coletar PII nos eventos a menos que necessário.** `session_id` é um UUID random (cookie first-party HttpOnly).
- **IP address** coletar apenas em agregado (truncate /24) ou via Cloudflare CF-IPCountry header.
- **Email** só no evento `lead_capture` — necessário para o cliente entrar em contato.
- **Opt-out**: DNT/GPC respeitados (PostHog tem flag `disable_persistence`).
- **Retenção**: events > 90 dias viram agregados; > 365 dias apagados (via cron).

```ts
// middleware analytics
if (navigator.doNotTrack === '1' || (navigator as any).globalPrivacyControl === true) {
  posthog.opt_out_capturing();
}
```

---

## 5. Session replay de quem assistiu o demo

PostHog session replay grava **a sessão de quem viu o demo** (não de quem editou).

Setup mínimo:

```js
posthog.init('phc_xxx', {
  api_host: 'https://eu.i.posthog.com',
  person_profiles: 'identified_only',  // só identifica quem preencheu lead form
  session_recording: {
    recordCrossOriginIframes: true,    // captura iframe do nosso player
    maskAllInputs: true,
  },
});
```

**Uso:** quando um lead preenche form, identificamos o distinct_id → abrimos o replay no PostHog e vemos o lead interagindo com cada passo. Insights de UX inestimáveis.

**Limites free tier:** 5k replays/mês web + 2.5k mobile. Para SaaS com poucos leads, suficiente.

---

## 6. Integração com dashboards

### 6.1 PostHog embed no nosso dashboard

```html
<iframe
  src="https://eu.posthog.com/embedded/<share_token>"
  width="100%" height="900"
  frameborder="0"
></iframe>
```

Nossa API gera share URLs com escopo por demo (`person.allowlist` = só eventos do demo X).

### 6.2 Custom dashboard (alternativa)

Construir com:
- **Tremor** (React dashboard components): <https://www.tremor.so/>
- **Recharts** (gráficos): <https://recharts.org/>
- **Drizzle** queries diretas ao Postgres (com RLS).

A vantagem é controle total + nativo no nosso app. Desvantagem: construir do zero.

**Recomendação:** para MVP, embedar PostHog iframe. Para Fase 2, construir dashboard custom (diferencial competitivo).

---

## 7. Eventos coletados pelo admin (uso interno)

Além do player, coletar eventos do **lado admin** para product analytics nosso:

| Evento | Onde |
|--------|------|
| `workspace.created` | sign-up |
| `demo.created` | editor |
| `demo.published` | editor |
| `demo.shared` | editor (copy share link) |
| `demo.embedded` | settings |
| `invite.sent` | members |
| `invite.accepted` | callback |
| `subscription.created` | checkout success |
| `subscription.cancelled` | cancel webhook |

Esses vão **só para PostHog** (não para nosso Postgres — não são tenant-scoped).

---

## 8. Estimativa de complexidade

| Tarefa | tamanho |
|---------|---------|
| Schema `demo_events` + particionamento | M |
| SDK PostHog no player (10 min) | S |
| Custom queries SQL para funil | M |
| Dashboard embed PostHog | S |
| Session replay + LGPD compliance | M |
| Dashboard custom (Tremor/Recharts) | L (fase 2) |

**MVP analytics: S-M.** Cabe em 1 sprint.

---

## 9. Referências

- PostHog self-host: <https://posthog.com/docs/self-host>
- PostHog vs Mixpanel: <https://posthog.com/blog/posthog-vs-mixpanel>
- PostHog vs Plausible: <https://posthog.com/compare/posthog-vs-plausible>
- Plausible repo: <https://github.com/plausible/analytics>
- Best Plausible alternatives: <https://posthog.com/compare/best-plausible-alternatives>
- Matomo (alternativa self-host): <https://matomo.org/>
- Self-Hosted Mixpanel alternatives: <https://openpanel.dev/articles/self-hosted-product-analytics>
- PostHog session replay: <https://posthog.com/docs/session-replay>