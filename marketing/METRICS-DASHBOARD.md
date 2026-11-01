# Metrics Dashboard — EasyDemo (primeiros 90 dias)

> **Data:** 2026-10-18.
> **Premissa:** MVP live em T-0 (terça-feira). Métricas acompanhadas diariamente na primeira semana, semanalmente até W12, mensalmente após.
> **Fontes de dados:** Plausible + Google Analytics 4 + Postgres events (LGPD-safe) + Stripe/Asaas webhooks + dashboards internos (Metabase ou similar).
> **Snapshot via CLI:** `pnpm --filter web exec tsx scripts/metrics-snapshot.ts` gera workspaces ativos, demos publicadas, leads/views (30d), MRR estimado e tier mix direto do Postgres.
> **Limiar de alerta:** ver §7 (red flags).

---

## 0. North-star

> **NSM (North Star Metric):** **Workspaces com ≥ 1 demo publicada + ≥ 10 views orgânicos/mês.**
>
> Essa métrica captura **valor entregue ao creator** (publicou uma demo) **e tração real** (views orgânicos indicam uso, não vanity).
>
> Meta NSM W12: **150 workspaces ativos.** Meta M6: **1.000 workspaces ativos.**

---

## 1. Aquisição

### 1.1 CAC por canal

| Canal | Métrica primária | Ferramenta | Meta W12 |
|---|---|---|---|
| **Chrome Web Store** | Instalações / custo de revisar/atualizar listing | CWS dashboard + DevOps time | **CAC ≤ R$ 80/customer** |
| **SEO orgânico** | Visits → signups (via UTM source=organic) | GA4 | **CAC ≤ R$ 150/customer** |
| **Cold outreach** | Replies → calls → signups | Lemlist + CRM | **CAC ≤ R$ 550/customer** |
| **Compare pages** | Visits → signups (UTM source=compare) | GA4 | **CAC ≤ R$ 175/customer** |
| **Affiliate** | Cliques → signups → MRR | Hotmart/Lemon dashboard | **CAC ≤ R$ 100/customer** |
| **Product Hunt** | Spike de signups em 24h | GA4 + UTM | **CAC ≤ R$ 250/customer** |
| **Direct** | Type-in + bookmarks | GA4 | (não atribuível) |

**CAC blended meta W12: R$ 200–350/customer** (alinhado com `research/pricing/SYNTHESIS.md` §4.B).

### 1.2 Volume de signups

| Métrica | Definição | Meta W4 | Meta W12 |
|---|---|---|---|
| **Signups Free/mês** | Novos workspaces Free criados | 200 | 1.000 |
| **CVR Free → Paid** | % de Free que assinam Pro ou Business | 1,5% | 3% |
| **Custo por signup** | Total gasto GTM / signups | — | ≤ R$ 30 |
| **Signup velocity** | Taxa de signups/dia (média móvel 7d) | 7/dia | 35/dia |

### 1.3 Origem do signup

| Origem | Esperado W12 | Esperado M6 |
|---|---|---|
| **Orgânico (SEO)** | 30% | 50% |
| **Chrome Web Store** | 25% | 20% |
| **Direct (type-in)** | 15% | 10% |
| **Compare pages** | 10% | 8% |
| **Cold outreach** | 8% | 5% |
| **Affiliate** | 5% | 5% |
| **Product Hunt** | 5% | 1% |
| **Outros** | 2% | 1% |

---

## 2. Engagement

### 2.1 Métricas por workspace

| Métrica | Definição | Meta W4 | Meta W12 |
|---|---|---|---|
| **Demos criados/workspace (mediana)** | `count(demos)` por workspace ativo | 1 | 3 |
| **Steps médios/demo (mediana)** | `count(steps) / count(demos)` | 8 | 12 |
| **% demos publicados vs criados** | Demos com `status='published'` / total | 30% | 50% |
| **Tempo até 1ª demo publicada** | `first_demo_published_at - signup_at` | 7 dias | 5 dias |
| **Views/demo/mês (mediana)** | Eventos `view` por demo | 10 | 25 |
| **Completion rate médio** | % de viewers que chegam no step final | 30% | 45% |

### 2.2 Funil de ativação (Free user)

```
Signup Free (100%)
   ↓ [instalar extensão Chrome]
Criou workspace (95%)
   ↓ [primeira captura]
Iniciou demo (40%)
   ↓ [editar + publicar]
Publicou demo (15%) ← EVENTO CRÍTICO
   ↓ [compartilhar]
Demo recebeu 1+ view (10%)
   ↓ [upgrade]
Upgrade para Pro (2–5%)
```

### 2.3 Cohort analysis (por mês de signup)

Acompanhar, por cohort de signup:
- **Retenção D1, D7, D14, D30** (% que voltou a logar)
- **Activation rate** (% que publicou 1 demo em 14 dias)
- **Upgrade rate** (% que virou Pro em 30 dias)

---

## 3. Retenção

### 3.1 Churn por tier

| Tier | Definição | Meta W12 | Meta M6 |
|---|---|---|---|
| **Free** | % de Free users que zeraram atividade em 30 dias | 60% (esperado, é Free) | 50% |
| **Pro** | Churn mensal (cancelou assinatura) | 5% | 4% |
| **Business** | Churn mensal | 3% | 2% |

### 3.2 NRR (Net Revenue Retention)

| Tier | Definição | Meta W12 | Meta M6 |
|---|---|---|---|
| **NRR** | (MRR início + expansion - churn) / MRR início | 95% | 110% |
| **GRR** | (MRR início - churn) / MRR início | 92% | 95% |

> **NRR > 100%** = expansion (upgrade Pro → Business) compensa churn. Target SaaS B2B top-decile.

### 3.3 LTV / CAC ratio

| Métrica | Meta W12 | Meta M6 |
|---|---|---|
| **LTV/CAC (12 meses)** | ≥ 5x | ≥ 10x |
| **Payback period** | ≤ 12 meses | ≤ 6 meses |

(Alinhado com `research/pricing/SYNTHESIS.md` §4.D)

---

## 4. Receita

### 4.1 MRR / ARR

| Métrica | Meta W4 | Meta W12 | Meta M6 |
|---|---|---|---|
| **MRR** | R$ 1.500 | R$ 10.000 | R$ 60.000 |
| **ARR (anualizado)** | R$ 18.000 | R$ 120.000 | R$ 720.000 |
| **ARPU (média)** | R$ 100 | R$ 100 | R$ 150 |

### 4.2 Tier mix

| Tier | Esperado W12 | Esperado M6 |
|---|---|---|
| **Free** | 95% de workspaces | 85% |
| **Pro** (R$ 49) | 4% (~40 workspaces) | 12% (~700) |
| **Business** (R$ 199) | 1% (~10 workspaces) | 3% (~150) |

### 4.3 Receita por canal

| Canal | Esperado W12 |
|---|---|
| **Self-serve** (Stripe/Asaas direto) | 90% |
| **Sales-led** (Enterprise) | 10% |

---

## 5. Funil completo (do install ao upgrade)

```
Chrome Web Store install
   ↓ [% ativa extensão]
   ↓  Meta: 80%
Extensão ativa
   ↓ [% faz signup]
   ↓  Meta: 30%
Signup Free
   ↓ [% publica 1 demo em 14d]
   ↓  Meta: 15%
Publicou 1 demo
   ↓ [% upgrade Pro em 30d]
   ↓  Meta: 8% (de quem publicou)
Upgrade Pro

= Funil completo: install → upgrade ≈ 0,29% (otimista)
```

| Etapa | Conversão esperada | Bloqueio típico |
|---|---|---|
| Install → ativa | 80% | Extensão não funciona (raro se CWS aprovar) |
| Ativa → signup | 30% | Fricção no signup (pedir cartão?) |
| Signup → publica demo | 15% | Fricção técnica + falta de uso |
| Publica → upgrade | 8% | Custo (R$ 49 vs Free suficiente) |

---

## 6. Métricas por canal de aquisição (detail)

### Chrome Web Store

| Métrica | Meta |
|---|---|
| **Installs** | 50+ na 1ª semana, 200+/mês |
| **Rating médio** | ≥ 4,6 ⭐ |
| **Reviews totais** | ≥ 20 no W4 |
| **Search rank** (PT-BR "demo interativa") | Top 5 |

### SEO orgânico

| Métrica | Meta W12 |
|---|---|
| **Visitas orgânicas/mês** | 500–1.500 |
| **Páginas indexadas** | 30+ (pilares + compare + blog + LP) |
| **Posição média top 10** | 5–15 |
| **CTR médio SERP** | 5% |

### Product Hunt

| Métrica | Meta |
|---|---|
| **Upvotes** | ≥ 100 |
| **Comments** | ≥ 20 |
| **Rank do dia** | Top 10 |
| **Signups atribuídos (UTM)** | ≥ 200 em 7 dias |

### Cold outreach

| Métrica | Meta |
|---|---|
| **Emails enviados/mês** | 200 |
| **Open rate** | ≥ 50% |
| **Reply rate** | ≥ 12% |
| **Positive reply** | ≥ 4% |
| **Calls agendadas** | ≥ 8/mês |
| **Signups** | ≥ 4/mês |

---

## 7. Limiares de alerta (red flags)

> Revisar dashboard **diariamente** na W1–W4; **semanalmente** após.

| Métrica | 🟢 OK | 🟡 Atenção | 🔴 Crítico |
|---|---|---|---|
| **Signups Free/dia** | ≥ 10 | 5–9 | < 5 |
| **CVR Free → Paid (W4)** | ≥ 2% | 1–2% | < 1% |
| **Churn mensal Pro** | ≤ 4% | 4–6% | > 6% |
| **Demos publicadas/signup (D14)** | ≥ 15% | 8–14% | < 8% |
| **NPS** | ≥ 40 | 30–39 | < 30 |
| **Uptime** | ≥ 99,5% | 99–99,5% | < 99% |
| **Erro 5xx rate** | ≤ 0,1% | 0,1–1% | > 1% |
| **Latência p95 (player)** | ≤ 500ms | 500–1000ms | > 1000ms |
| **Asaas webhook failed** | 0 | 1–2 | ≥ 3 |
| **LGPD DSR pendente (>15 dias)** | 0 | 1 | ≥ 2 |

> **Ação crítica:** qualquer item 🔴 por 3 dias seguidos → escalar para founder + plano de mitigação em < 24h.

---

## 8. Ferramentas de tracking

| Camada | Ferramenta | Custo estimado/mês |
|---|---|---|
| **Web analytics** | Plausible + GA4 | R$ 50 (Plausible) |
| **Product analytics** | Postgres events (custom) + Metabase | R$ 0 (self-hosted) |
| **Email tracking** | Resend + Postmark | R$ 100 (até 100k emails) |
| **CRM** | HubSpot Free ou Kommo Free | R$ 0–500 |
| **Error tracking** | Sentry | R$ 0 (free tier) |
| **Uptime** | Uptime Kuma (self-hosted) + Better Stack | R$ 0–100 |
| **Heatmap** | Microsoft Clarity (free) | R$ 0 |
| **A/B testing** | PostHog (self-hosted) ou VWO | R$ 0–300 |

---

## 9. Cadência de revisão

| Cadência | O que revisar | Quem |
|---|---|---|
| **Diária** (W1–W4) | Signups, churn, erros críticos, uptime | Founder |
| **Semanal** (W5–W12) | Dashboard completo, CAC, funnel, cohort | Founder + marketing |
| **Mensal** (M3+) | Coorte, NRR, LTV/CAC, roadmap | Founder + advisors |
| **Trimestral** (Q2+) | Estratégia, pricing, novos canais | Founder + advisors + investidor |

---

## 10. Relatórios mensais (template)

```markdown
# EasyDemo — Relatório Mensal — [mês/ano]

## TL;DR
- 1 linha: o que melhorou, o que piorou, decisão principal.

## Aquisição
- Signups Free: X (meta Y, +Z%)
- CAC blended: R$ X (meta R$ Y)
- Top 3 canais: A (R$ X), B (R$ Y), C (R$ Z)

## Engagement
- Demos publicadas/workspace: X (meta Y)
- Completion rate médio: X% (meta Y%)
- Tempo até 1ª demo: X dias (meta Y dias)

## Retenção
- Churn Pro: X% (meta Y%)
- NRR: X% (meta Y%)
- LTV/CAC: X (meta Y)

## Receita
- MRR: R$ X (meta R$ Y)
- ARPU: R$ X (meta R$ Y)
- Tier mix: Free X% / Pro Y% / Business Z%

## Plano de ação
- [3 bullets concretos pro próximo mês]
```

---

## 11. Limitações declaradas

- **Metas são projeções** baseadas em `research/pricing/SYNTHESIS.md` §7 e benchmarks SaaS B2B BR 2026; não há dado histórico real.
- **CVR Free→Paid BR 2–5%** é benchmark setorial (`gtm-channels.md` §B); EasyDemo pode estar acima ou abaixo.
- **NSM "150 workspaces com ≥10 views/mês no W12"** é ambiciosa — pode precisar de ajuste após W4.
- **Churn Pro 5%/mês** é hipótese pessimista; benchmark top-decile SaaS B2B é 3–4%.
- **LTV/CAC ≥ 5x** assume churn controlado; se churn for maior, LTV cai.
- **Tooling stack assume orçamento zero a baixo** (R$ 50–R$ 500/mês total). Se aumentar, recalcular unit economics.

---

## 12. Referências internas

- Pricing tiers: `research/pricing/SYNTHESIS.md` §3
- Unit economics: `research/pricing/SYNTHESIS.md` §4
- Funil: `marketing/LAUNCH-PLAN.md` §3 e §5
- ICPs: `marketing/ICP-PERSONAS.md`
- Casos: `marketing/CASE-STUDIES/`
- LGPD compliance: `research/tech/lgpd-recording.md` §4
- Infra (VPS, monitoring): `research/tech/infra-vps.md`