# Case Study #1 — Fintech X reduz tempo de onboarding em 60%

> **Status:** fictício, baseado em padrão de mercado SaaS B2B fintech BR (referências: Celcoin, CIAL, Qive — ver `research/pricing/brazilian-players-pricing.md`).
> **Quando usar:** blog, landing vertical, deck de vendas, press kit.
> **Métricas marcadas como "estimativa interna"** — confirmar com case real antes de usar em mídia paga.

---

## TL;DR

| Item | Valor |
|---|---|
| **Empresa** | Fintech X (pagamentos recorrentes + split pra marketplaces) |
| **Setor** | Fintech / Pagamentos |
| **Funcionários** | 35 |
| **Plano EasyDemo usado** | Business (R$ 199/mês) |
| **Resultado principal** | **−60% tempo de onboarding** + **+28% conversão trial→paid** |
| **Período** | 6 semanas (ago–set/2026) |

---

## Contexto

Fintech X é uma plataforma de pagamentos para marketplaces (split, recorrência, antecipação). Eles têm **2 personas distintas**:

1. **Marketplaces médios** (R$ 500k–R$ 5M MRR) que precisam de **demo técnica profunda** antes de integrar (API docs, sandbox).
2. **PMEs** (R$ 5k–R$ 50k MRR) que precisam de **demo executiva rápida** antes de assinar.

O time de CS (4 pessoas) fazia **5 calls de 1h cada** para onboardar 1 cliente novo. Resultado: **CS sobrecarregada**, **churn alto em trial** (clientes desistiam antes de completar onboarding), **ciclo longo**.

---

## Problema

> *"Cada nova conta levava 5 calls e 2 semanas para ativar. CS sobrecarregada. Churn alto em trial."*
> — Head de CS, Fintech X

### Métricas antes do EasyDemo (Q2 2026)

| Métrica | Valor |
|---|---|
| Tempo médio de onboarding | **14 dias** |
| Calls/onboarding | **5 calls × 1h** |
| CS sobrecarregada | **70% do tempo em calls de ativação** |
| Conversão trial → paid | **18%** |
| Churn em 30 dias | **22%** |
| NPS pós-onboarding | **34** |

---

## Solução

A Fintech X adotou **EasyDemo Business** (R$ 199/mês) em julho/2026 com 3 objetivos:

1. **Substituir 3 das 5 calls** por demos interativas que o cliente faz sozinho.
2. **Padronizar onboarding** em SaaS B2B mid-market BR (mercado brasileiro).
3. **Medir engajamento real** (não só "o lead viu o PDF").

### O que fizeram

| Ação | Detalhe |
|---|---|
| **Demo de produto (8 steps)** | Capturada com extensão Chrome do EasyDemo — fluxo de "primeira venda em 5 minutos". |
| **Demo de API (12 steps)** | Capturada — fluxo de "integração técnica completa". |
| **Embed no site** | Iframe em `fintechx.com.br/demo` (substituiu vídeo de 4min). |
| **WhatsApp CTA** | Botão "Falar com CS" em todas as demos → wa.me/5511... |
| **Formulário de leads** | Captura email + telefone com consentimento LGPD (default desmarcado). |
| **Personalização `{{empresa}}`** | URL `?empresa=Acme` substitui token na demo. |
| **Analytics de step** | Dashboard interno: completion rate, drop-off, CTR do CTA. |
| **Branching condicional** | "Você é dev?" → demo técnica; "Você é CEO?" → demo executiva. |

### Investimento

| Item | Custo |
|---|---|
| EasyDemo Business | **R$ 199/mês** |
| Tempo de implementação | **8h (1 PMM + 1 dev part-time)** |
| Treinamento CS (1 call de 1h) | **Custo de oportunidade zero** |

---

## Resultados (após 6 semanas)

| Métrica | Antes | Depois | Delta |
|---|---|---|---|
| Tempo médio de onboarding | 14 dias | **5,6 dias** | **−60%** |
| Calls/onboarding | 5 | **2** | **−60%** |
| CS em calls de ativação | 70% | **25%** | **−64%** |
| Conversão trial → paid | 18% | **23%** | **+28%** |
| Churn em 30 dias | 22% | **15%** | **−32%** |
| NPS pós-onboarding | 34 | **52** | **+53%** |

### Por que funcionou

> *"Lead chega na 1ª call já viu a demo. CS gasta tempo tirando dúvida, não explicando o básico."*
> — Head de CS, Fintech X

> *"Embed no site foi o divisor. Conversão trial→paid subiu 28% em 6 semanas."*
> — CMO, Fintech X

### ROI calculado

- **Economia de tempo CS**: 70% × 25% × 4 CS × 160h/mês × R$ 80/h = **R$ 8.960/mês economizado**
- **Receita incremental** (28% mais conversão × 50 trials/mês × R$ 99 ticket médio) = **R$ 1.386/mês incremental**
- **Total economia**: **~R$ 10.300/mês**
- **Custo EasyDemo Business**: R$ 199/mês
- **ROI**: **~52x**

---

## Screenshot conceitual

> **Conceito do screenshot:** Dashboard EasyDemo Analytics mostrando funil de demo:
>
> - 1.247 views únicos na demo "Onboarding Fintech X"
> - 62% completion rate (benchmark: 40%)
> - Drop-off por step: step 1 → step 2 (8%), step 3 → step 4 (12%, **hotspot confuso**), step 7 → step 8 (5%)
> - 94 leads capturados (formulário LGPD)
> - 31 CTR no WhatsApp (33% dos que completaram)
>
> **Mockup textual:**
>
> ```
> ┌────────────────────────────────────────────┐
> │ EasyDemo · Analytics · Onboarding Fintech X  │
> ├────────────────────────────────────────────┤
> │ Views únicos     1.247    ████████████     │
> │ Completion       62%      ███████          │
> │ Leads capturados 94       █               │
> │ CTR WhatsApp     33%      ████            │
> ├────────────────────────────────────────────┤
> │ Funil por step:                           │
> │ Step 1 (intro)    ████████████ 100%       │
> │ Step 2 (login)    ███████████  92%        │
> │ Step 3 (dash)     ██████████   88% ←⚠     │
> │ Step 4 (venda)    █████████    81%        │
> │ ...                                      │
> └────────────────────────────────────────────┘
> ```

---

## Próximos passos (Fintech X)

| Ação | Plano |
|---|---|
| AI voice cloning PT-BR | Adotar Q1 2027 quando EasyDemo incluir (ver roadmap) |
| Demo personalizada por cliente | Usar tokens `{{nome}}` `{{empresa}}` em next-gen |
| Sandbox demo (cliente testa com dados fictícios) | Aguardar EasyDemo Q1 2027 |

---

## Como replicar (playbook)

> Se você é fintech ou SaaS B2B com CS sobrecarregada:

1. **Capture 1 demo de fluxo principal** com extensão Chrome (5 min).
2. **Capture 1 demo técnica** (API, integração) — outra URL.
3. **Embed ambas no site** com iframe.
4. **Configure WhatsApp CTA** em ambas.
5. **Reduza calls de onboarding de 5 → 2** (mantenha 1ª call + check-in final).
6. **Meça completion rate** (meta: ≥ 40%).

> **Investimento:** ~R$ 199/mês (Business) + 8h de setup.
> **Retorno esperado:** 30–60% redução de tempo de onboarding + 20–30% mais conversão.

---

## Disclaimer

> ⚠️ **Case fictício.** Métricas são baseadas em padrões observados em SaaS B2B BR (TOTVS, Meetime, Omie — referências em `research/pricing/gtm-channels.md` §B.6) e em benchmarks públicos de Supademo/G2. Não há cliente real chamado "Fintech X" usando EasyDemo. Substituir por case real antes de usar em mídia paga (Meta Ads, Google Ads).

---

## Referências internas

- Pricing tiers: `research/pricing/SYNTHESIS.md` §3
- ICP Persona 2 (CS/CX): `marketing/ICP-PERSONAS.md`
- Vertical fintech: `marketing/SEO-PILLAR-PAGES.md` §4 (LP vertical e-com)
- Cases públicos de referência: `research/demos/getdemo.md`
- Tom de voz: `marketing/BRAND.md` §1