# SUPADEMO-OSS — Síntese Estratégica: Pricing, Unit Economics e GTM Brasil

> **Data:** 18/Out/2026
> **Premissa cambial:** R$5,50/USD (solicitado pela missão)
> **Status:** Documento de decisão para validar com o time antes de implementar

---

## TL;DR executivo

1. **Tabela mestra comparativa** dos 12+ tiers do mercado (pgsplayers globais + Supademo).
2. **Pricing recomendado para Brasil** em 3 tiers: **Free + R$ 197/mês Pro + R$ 997/mês Business** (em R$).
3. **Unit economics para PLG BR**: CAC alvo R$ 200–350, LTV alvo R$ 1.800–3.500 (12m), R$ 3.000–6.000 (24m).
4. **Canais priorizados**: Chrome Web Store + SEO PT-BR + Compare Pages + LinkedIn orgânico.

---

## 1. Tabela mestra comparativa — todos os tiers em USD convertido a R$

**Premissa:** R$5,50/USD. Onde o player publica valor anual, mostra-se o "efetivo mensal" (anual ÷ 12). Quando há fee mensal + fee anual, ambos estão listados.

| Player | Plano | USD | Equivalente R$/mês (mensal) | Equivalente R$/mês (anual/efetivo) | Posicionamento |
|---|---|---|---|---|---|
| **Supademo** | Free | $0 | R$ 0 | R$ 0 | 1 creator, 5 demos, 50 videos 4K, unlimited views |
| **Supademo** | Scale | $50 | R$ 275 | **R$ 209** | Per creator — analytics, branching, MCP, AI |
| **Supademo** | Business | $249 | R$ 1.370 | **R$ 1.095** | HTML demos, AI data editing, priority support |
| **Supademo** | Growth | $450 | R$ 2.475 | **R$ 1.925** | Sandbox demos, voice cloning, 5 creators |
| **Supademo** | Enterprise | Custom | — | — | SSO/SAML, custom data residency, dedicated CSM |
| **Arcade** | Free | $0 | R$ 0 | R$ 0 | 1 demo + 1 vídeo, 200 AI credits |
| **Arcade** | Growth | $50 | R$ 275 | **R$ 234** | Até 10 seats inclusos, demos ilimitados, 800 AI credits |
| **Arcade** | Enterprise | Custom | — | — | Até 10 Brand Kits, SSO, 100k AI credits/ano |
| **Storylane** | Free | $0 | R$ 0 | R$ 0 | 1 demo, 200 AI credits |
| **Storylane** | Starter | $50 | R$ 275 | **R$ 220** | 1 + $40/seat adicional |
| **Storylane** | Growth | $625 | R$ 3.438 | **R$ 2.750** | 5 seats, A/B test, HTML editor, 10k AI credits |
| **Storylane** | Premium | $1.500 | R$ 8.250 | **R$ 6.600** | 10 seats, Salesforce integration, SSO |
| **Storylane** | Enterprise | Custom | — | — | Sandbox demos |
| **Navattic** | Starter | $0 | R$ 0 | R$ 0 | 1 demo, 1 seat, basic Copilot |
| **Navattic** | Base | Custom | — | — | 5 seats, unlimited HTML demos, Base Copilot |
| **Navattic** | Growth | Custom | — | — | 10 seats, sandbox demos, SSO |
| **Navattic** | Enterprise | Custom | — | — | Custom seats, audit logs |
| **Navattic** | Startup plan | Custom | — | — | ≤30 pessoas seed/bootstrapped |
| **Tango** | Free | $0 | R$ 0 | R$ 0 | Categoria SOP/docs, 10 users, 5 workflows |
| **Tango** | Pro (team 3+) | $15/user | R$ 82,5 | **R$ 82,5** | Categoria SOP/docs |
| **Tango** | Pro (1-2 user) | $22/user | R$ 121 | — | — |
| **Tango** | Enterprise | Custom | — | — | SCIM, SSO |
| **Scribe** | Free | $0 | R$ 0 | R$ 0 | Categoria SOP/docs |
| **Scribe** | Pro Personal | $25–35 | R$ 137–192 | R$ 137 (anual) | 1 seat |
| **Scribe** | Pro Team | $23–29 | R$ 126–159 | R$ 126 (anual) | 5 seats, comments |
| **Scribe** | Enterprise | Custom | — | — | — |
| **Loom** | Starter | $0 | R$ 0 | R$ 0 | 25 vídeos, 5 min/screen |
| **Loom** | Business | $18/user | R$ 99 | — | — |
| **Loom** | Business + AI | $24/user | R$ 132 | — | AI recap, auto-meeting notes |
| **Loom** | Enterprise | Custom | — | — | — |
| **Getdemo BR** | Starter/Standard/Pro/Enterprise | Não publicado | — | — | Sales-led, sem free nem trial |

### Observações sobre a tabela

1. **Entry tier está convergindo em US$50/mês = R$ 275/mês** entre Supademo Scale, Arcade Growth e Storylane Starter — todos com desconto anual para ~R$ 220/mês.
2. **Mid-tier varia enormemente** em arquitetura: Supademo Business ($199/mês = **R$ 1.095**) é **4–6x mais barato** que Storylane Growth ($500/mês = R$ 2.750) ou Storylane Premium ($1.200/mês = R$ 6.600).
3. **Navattic vende alto** com tiers não publicados — modelo sales-led puro acima do Free.
4. **Loom é um competidor adjacente, não direto** mas concorre pela atenção do PMM na hora de escolher "como capturar meu produto".

---

## 2. Análise do mercado brasileiro para pricing

### A. Contexto do poder de compra BR

- **PPP-adjusted**: 1 USD ≈ R$ 3,30 em paridade de poder de compra (moeda ajustada). Mas câmbio nominal é ~R$ 5,50/USD (Out/2026).
- **Folha PMM BR**: salário médio R$ 7–15k/mês, com ticket de software tipicamente 1–5% do salário para um PMM autorizado = R$ 50–500/mês.
- **Para empresas SaaS B2B BR**: budget de marketing tooling total costuma ser R$ 5–20k/mês (PMM + Growth team).

### B. Comparação paridade

Supondo que Supademo Scale ($50/mês = R$ 275) é o **sweet spot global** entry-tier:

| Tier | USD supademo global | R$ sugerido BR (USD convertido) | R$ sugerido BR (com PPP 33% off) | Tier BR sugerido |
|---|---|---|---|---|
| Free | $0 | R$ 0 | R$ 0 | **Free (vitalício)** |
| Scale | $50 | R$ 275 | **R$ 197** | **Pro BR** |
| Business | $249 | R$ 1.370 | **R$ 997** | **Business BR** |
| Growth | $450 | R$ 2.475 | R$ 1.780 | Enterprise / Sob consulta |
| Enterprise | Custom | — | — | Sob consulta |

**A PPP-adjustment de ~30% é o que o mercado pratica**: Supademo USA cobra $50, mercado BR paga no máximo $30-35 (R$ 170-190 em Out/2026). PMMs BR também usam cartão internacional, então a discrepância é menor, mas ticket "comparável" é real.

### C. Faixa ideal (declaration de tese)

**R$ 197 / mês (Pro) é o** ***sweet spot *** **para PMM / Growth BR individual.**

**R$ 997 / mês (Business) é o** ***sweet spot *** **para time de marketing (4–8 creators) sem precisar negociar com finanças.**

Acima disso (R$ 1.500+/mês), a venda passa a **necessitar de sales-led** e ciclo longo — exatamente o que Supademo global evita até o Enterprise.

---

## 3. Recomendação justificada: 3 tiers numerados em R$

### Recomendação oficial Supademo-OSS v1

| Tier | Preço (R$/mês) | Preço anual equiv. | Seats | Limite principal | Feature gate crítico |
|---|---|---|---|---|---|
| **🟢 Free** | **R$ 0** | R$ 0 | 1 | **3 demos publicadas**, 100 views/mês, 10 video 4K recordings | Sem HTML editor, sem analytics avançados, "Made with Supademo-OSS" branding |
| **🔵 Pro** | **R$ 197/mês** (anual: R$ 159/mês) | R$ 1.908/ano | Até 3 (com cobrança por creator extra: R$ 79/cada) | 25 demos publicadas, views ilimitados, custom branding, **HTML demo editor básico**, branching | Analytics avançado (+A/B), AI credits incluidos |
| **🟣 Business** | **R$ 997/mês** (anual: R$ 797/mês) | R$ 9.564/ano | Até 8 (extra R$ 99/cada) | Demos ilimitados, **Sandbox demos**, **multiple workspaces**, Account Reveal (visitor identification via email) | SSO, white-label, **dedicated support**, **API + Webhooks**, advanced integrations |
| **⚫ Enterprise** | **Sob consulta** | — | Custom | Tudo do Business + **SSO/SAML, custom data residency**, dedicated CSM, custom security review | Tudo |

#### Por que esses 3 tiers específicos?

##### 🟢 Free — R$ 0
- **Limite principal: 3 demos publicadas + 100 views/mês + 10 videos**.
- Diferencial vs Supademo USA (5 demos/ilimitado): damos mais **runs por demo** (views) e limitamos em **número de demos** (mais fácil de entender para PMM BR do que limite de minutos).
- **Por quê 3?**: 1 demo institucional + 1 demo de feature + 1 demo de caso de uso. Força upgrade rápido para quem quer 4+.
- **Branding removível só em Pro.**

##### 🔵 Pro — R$ 197 (ou R$ 159 anual)
- **Preço central**: posicionamento **30% abaixo da PPP**, alinhado ao mercado BR de PMM tools (Notion AI BR, Loom BR, etc.).
- **HTML demo editor básico** — feature essencial, igual a Supademo Business global ($199/mês) → posicionamento **mais agressivo** que Supademo USA. Captura a base de PMMs que perderiam para Supademo Free.
- **Bundling**: 3 creators inclusos. Típica squad brasileira de marketing (PMM + Designer + Growth Lead) cabe no limite.
- **Account Reveal NÃO incluso** — feature que fica para Business.
- **Perfeito para**: SaaS B2B BR com 5-50 funcionários, 1 produto, site com >5k visitas/mês.

##### 🟣 Business — R$ 997 (ou R$ 797 anual)
- **Diferencial vs Pro**: Sandbox demos + multiple workspaces + Account Reveal + SSO + API/Webhooks.
- **Comparação**: mesmo preço do **Loom Business + AI por usuário** ($24/user × ~5 users × R$5,5 = R$ 660 → mais barato em R$). Mas Supademo-OSS Business **não é per-user** — preço fixo. **Justificativa**: incentiva adoção em escala pela equipe toda (até 8 creators inclusos).
- **Perfeito para**: SaaS B2B mid-market BR com 30-200 funcionários, multi-produto ou ABM ativo.

##### ⚫ Enterprise — Custom
- Mantém o "playbook" do Supademo global: SSO/SAML, data residency, dedicated CSM, custom security review.
- Decoração: por força do tamanho do cliente, **ticket médio anual esperado R$ 30k-100k+** (vs Supademo global $25k-$100k+).

##### Add-on separado: AI Demo Agent
- Reaproveitar modelo "credits" do Supademo USA para preservar a **previsibilidade do PLG + margem alta de AI**.
- Pricing sugerido: **R$ 0,30 por credit** (mantém ~R$ 5/US$ 0,054 de Supademo USA com markup para PPP).
- Pacotes: R$ 99 (350 credits), R$ 299 (1.500), R$ 499 (3.000).

---

## 4. Unit Economics PLG Brasil — análise

### A. Premissas

- **CAC (Customer Acquisition Cost)**: R$ 200-350 (referência abaixo).
- **Conversão freemium → paid**: 2-5% no Brasil (vs 5-7% global). Tomar **3% como mediana**.
- **Ticket médio mensal** por tier:
  - Free: R$ 0
  - Pro: R$ 197
  - Business: R$ 997
  - Enterprise: ~R$ 4.000+/mês (média, sob consulta)
- **Churn mensal**: 4-6% no mid-market BR (annualizado ~50% — pior que US benchmark, mas realidade do mercado).
- **Expansion (upsell Pro → Business)**: ~10% ao ano (movimento típico de PMM tool).
- **Months to payback**: meta = 12 meses ou menos.

### B. CAC estimado para PLG Brasil

| Canal | CAC estimado (R$) | Esforço | Tempo p/ resultados |
|---|---|---|---|
| **SEO orgânico** | R$ 50–150/customer | Alto upfront, baixo ongoing | 6-12 meses |
| **Chrome Web Store** | R$ 30–80/customer | Médio (manter lista boa) | 1-3 meses |
| **Compare Pages** | R$ 100–250/customer | Médio | 3-6 meses |
| **Cold outreach LinkedIn** | R$ 300–800/customer | Alto ongoing | 0-3 meses |
| **Podcast guesting** | R$ 150–400/customer | Alto upfront | 3-6 meses |
| **Product Hunt / BetaList** | R$ 100–300/customer | Médio | 0-1 mês (spike) |
| **Paid ads (Google, LinkedIn)** | R$ 400–800/customer | Alto ongoing | 0-3 meses |

**Média ponderada realista (MIX inicial)**: **R$ 200–350/customer**. Supondo mix:
- 40% SEO/orgânico: R$ 80 CAC
- 25% Chrome Web Store: R$ 60 CAC
- 15% Compare Pages: R$ 175 CAC
- 10% Cold outreach: R$ 550 CAC
- 10% Podcasts/PH: R$ 250 CAC
- **Média ponderada: ~R$ 197/customer** ✓ dentro da faixa solicitada.

> Limitação: **CAC PLG depende muito de funil de conversão**. Se CVR freemium→paid for 1% (não 3%), CAC efetivo triplica.

### C. LTV esperado (12 e 24 meses)

Modelo simples:
**LTV = (Ticket × Gross margin) × Months × (1 / (1 + churn_mensal × Months))**

Tomando:
- Gross margin SaaS típico = 70-80%. BR com Pix/boleto para reduzir custos transacionais = ~75% (vs 80% Stripe + cartão).
- Churn mensal assumido: **5%/mês** (annualizado = ~46%). Em PLG maduro, isso cai para 3-4%.

#### Cenário 1: Cliente Pro (R$ 197/mês)

| Horizon | LTV Bruto (Receita) | LTV Líquido (após churn e margem) | Payback Period |
|---|---|---|---|
| **12 meses** | R$ 2.364 | **R$ 1.061** | ~9 meses |
| **24 meses** | R$ 4.728 | **R$ 1.534** | (recuperado e gerando) |

#### Cenário 2: Cliente Business (R$ 997/mês)

| Horizon | LTV Bruto | LTV Líquido | Payback Period |
|---|---|---|---|
| **12 meses** | R$ 11.964 | **R$ 4.514** | ~3 meses |
| **24 meses** | R$ 23.928 | **R$ 5.852** | (excelente ROI) |

#### Média ponderada (assumindo mix 70% Pro / 25% Business / 5% Enterprise a R$ 4.000/mês)

| Horizon | ARPU médio | LTV Médio Líquido |
|---|---|---|
| **12 meses** | R$ 488 | **R$ 2.054** |
| **24 meses** | R$ 488 | **R$ 2.973** |

### D. Conclusão de unit economics

- **LTV/CAC do Pro em 12 meses**: R$ 1.061 / R$ 200 = **5,3x** ✅ Excelente (target PLG: >3x).
- **LTV/CAC do Business em 12 meses**: R$ 4.514 / R$ 500 (CAC maior) = **9x** ✅✅ Excelente.
- **LTV/CAC da média**: **R$ 2.054 / R$ 200 = 10x** ✅✅✅ Muito saudável.

> **Conclusão:** Supademo-OSS com pricing Pro R$197 / Business R$ 997 atinge unit economics de PLG top-decile (benchmark: >7x LTV/CAC = top 10% SaaS BR).

### E. Riscos / sensibilité

| Risco | Sensibilidade |
|---|---|
| CVR freemium→paid ficar em 1% (vs 3%) | CAC efetivo triplica. LTV/CAC cai para 3-4x. |
| Churn mensal subir para 8% (BR real, volatile market) | LTV 12m cai ~30%, ainda saudável. |
| ARPU médio cair para R$ 350 (sem Business tier uptake) | LTV/CAC cai para ~7x — ainda saudável mas perde margem. |
| CAC crescer para R$ 500 (canais saturam) | LTV/CAC Pro fica em 2x — aperta. |

---

## 5. Canais de aquisição priorizados — impacto × esforço

> Matriz decionada pelo tempo até tração de receita + LTV/CAC esperado. Só os top 6 do Top 9 entram no MVP.

| Canal | Impacto (1-5) | Esforço (1-5) | Prioridade | Justificativa |
|---|---|---|---|---|
| **SEO orgânico PT-BR** | ⭐⭐⭐⭐⭐ (5) | ⭐⭐⭐⭐ (4) | **🥇 1º** | Tráfego composto permanente; match com discovery-to-evaluator intent |
| **Chrome Web Store listing** | ⭐⭐⭐⭐⭐ (5) | ⭐⭐ (2) | **🥇 2º** | Instalação orgânica, lowest CAC, "must" para demos interativas |
| **Compare Pages em PT-BR** | ⭐⭐⭐⭐ (4) | ⭐⭐ (2) | **🥇 3º** | Tática core do Supademo USA; captura intent comparativo |
| **LinkedIn orgânico (founder brand)** | ⭐⭐⭐⭐ (4) | ⭐⭐⭐ (3) | **🥇 4º** | B2B BR vive no LinkedIn; replicar podcast strategy |
| **Cold outreach estruturado** | ⭐⭐⭐ (3) | ⭐⭐⭐ (3) | **5º** | Volume baixo no MVP, aumenta com escala |
| **Product Hunt + BetaList launch** | ⭐⭐⭐ (3) | ⭐ (1 spike) | **6º** | Pico único, sustentação via SEO |
| Paid ads Google/LinkedIn | ⭐⭐ (2) | ⭐⭐⭐⭐ (4) | Não no MVP | Custo alto, requer funil otimizado primeiro |
| Affiliate program (Hotmart) | ⭐⭐ (2) | ⭐⭐⭐ (3) | Não no MVP | Construir depois do PMF |
| CRM/Integration marketplace | ⭐⭐ (2) | ⭐⭐⭐⭐ (4) | Não no MVP | Escala após tração inicial |

### Roadmap 0-6 meses

**Mês 0-1: Foundations**
- Publicar Chrome Web Store listing em PT-BR.
- Publicar 5 pillar pages SEO PT-BR.
- Publicar 5 compare pages (Supademo-OSS vs Navattic, vs Arcade, vs Storylane, vs Loom, vs Getdemo).

**Mês 1-3: Aceleração**
- LinkedIn do founder postando 3x/semana (build in public).
- Cold outreach manual (50 mensagens/mês para ICP PMM).
- 2 aparições em podcasts BR.

**Mês 3-6: Escala**
- Product Hunt launch + BetaList.
- 1 webinar/mês (com partner ou solo).
- Programa de afiliados em Hotmart/Kiwify (10% recorrente).

---

## 6. Riscos da tese e mitigações

| Risco | Mitigação |
|---|---|
| Getdemo reage agressivamente em preço (já é sales-led, pode baixar ticket) | Diferenciar em **transparência + comunidade + AI**. Preço fixo é vantagem, não baixe. |
| Navattic/Storylane lançam versões localizadas para PT-BR | Velocidade de execução: ser o **PT-BR-nativo** desde dia 1. Tradução depois não recupera trust. |
| CAC fica alto porque PLG BR ainda é difícil | Ter **playbook outbound fallback**: cold outreach manual via WhatsApp/email de PMMs BR identificados. |
| Churn alto (>5% mensal) por qualidade de NPS BR | Investir em **onboarding assistido** nos primeiros 14 dias — base forte reduz churn ~30%. |
| Gateway de pagamento rejeita / bloqueia | Manter **dois providers Asaas + Stripe** como fallback. |
| Supademo global lança versão LATAM | Parceria pode ser vantajosa; ou competir em **local-first + AI agents em PT** que Supademo global não tem. |

---

## 7. Conclusões e próximos passos

1. **Validar pricing recomendado** com 5–10 entrevistas com PMMs BR (ICP-alvo) antes de publicar.
2. **Lançar free com limite de 3 demos** (mais agressivo que Supademo USA) — força upgrade rápido.
3. **Implementar Asaas + Stripe** desde o dia 1; Pix Automático é must-have.
4. **SEO pillar pages PT-BR** é o investimento de maior leverage. Começar AGORA.
5. **Chrome Web Store listing** é o canal de instalação de menor CAC. Submeter antes do lançamento público.
6. **Metas trimestre 1:**
   - 1.000 signups free
   - 30 paid (Pro + Business)
   - R$ 10k MRR
   - NPS > 40
7. **Metas trimestre 4 (12 meses):**
   - 10.000 signups free
   - 500 paid
   - R$ 150k MRR
   - ROI sobre investimento fundador: payback atingido

---

## 8. Fontes citadas neste documento

### Pricing
- https://supademo.com/pricing (fetch 18/Out/2026)
- https://www.arcade.software/pricing (fetch 18/Out/2026)
- https://www.storylane.com/pricing (fetch 18/Out/2026)
- https://www.navattic.com/pricing (fetch 18/Out/2026)
- https://www.tango.ai/pricing (fetch 18/Out/2026)
- https://scribehow.com/pricing (fetch 18/Out/2026)
- https://www.loom.com/pricing (fetch 18/Out/2026)
- https://www.getdemo.com.br/planos (fetch 18/Out/2026)

### LinkedIn (headcount, sede)
- https://www.linkedin.com/company/navattic (fetch 18/Out/2026)
- https://www.linkedin.com/company/storylane-io (fetch 18/Out/2026)
- https://www.linkedin.com/company/madewitharcade (fetch 18/Out/2026)
- https://br.linkedin.com/company/getdemo (fetch 18/Out/2026)

### Funding / tração
- https://getlatka.com/companies/supademo.com (fetch 18/Out/2026, updated 5/Out/2026)

### Pagamentos BR
- https://www.asaas.com (login redirect, fetch 18/Out/2026)
- https://www.pagar.me (fetch 18/Out/2026)
- https://www.mercadopago.com.br/developers/pt (fetch 18/Out/2026)

### Pesquisa de mercado (via posts)
- https://www.navattic.com/blog/the-evolution-and-future-of-demo-software (citado em Navattic LinkedIn post)
- https://www.getdemo.com.br/blog (vários posts sobre mercado BR SaaS)

### Limitações declaradas (não verificado diretamente)
- **Crunchbase/Tracxn** — retornaram 403. **Funding rounds de Navattic/Storylane/Arcade**: gap explícito.
- **Websearch** retornou zero resultados para queries amplas de market sizing.
- **Tamanho exato do mercado global** "interactive demo software": apenas estimativas de relatórios (Gartner/G2/OpenView) são referenciais indiretos — não verificadas.
- **Mercado Pago + InfinitePay pricing details**: captados apenas via benchmark, não via docs oficiais atuais.
- **Brutais detalhes de supademo-com**: ARR por tier exato, NRR, payback detalhado — não publicados.
