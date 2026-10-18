# SEO Pillar Pages — Estratégia PT-BR (DemoBR)

> **Data:** 2026-10-18.
> **Premissa:** DemoBR compete em PT-BR com players globais (Supademo, Navattic, Storylane, Arcade) e 1 player BR confirmado (Getdemo) + 1 OSS BR (GuiaFlow). Captura de SEO long-tail em PT-BR é o canal #1 declarado em `research/pricing/gtm-channels.md` §A.
> **Volumes de busca:** **estimados** via Google Keyword Planner / tendências setoriais; números reais podem variar ±30%. Marcar como "estimativa".

---

## 0. Estratégia-mestre

| Eixo | Decisão | Origem |
|---|---|---|
| **Idioma** | PT-BR default, EN como secundário | RFC §1.1, `specs/mvp-scope.json` |
| **Estrutura** | 5 pillar pages (cornerstone) + 5 compare pages (mid-funnel) + 15 blog posts (long-tail) + 5 landing verticais (segmentação) | Supademo USA playbook + `research/pricing/SYNTHESIS.md` §5 |
| **Métricas-alvo W12** | 1.000 visitas orgânicas/mês via pilares indexados | meta derivada de `research/pricing/SYNTHESIS.md` §7 (1.000 signups free no Q1, ~30% via orgânico) |
| **Cadência** | 1 pilar + 1 compare + 2 blog posts por semana (12 semanas = cobertura completa) | detalhado em `CONTENT-CALENDAR.md` |
| **Stack de SEO** | Next.js App Router + sitemap.xml dinâmico + JSON-LD FAQ schema + OG image por post | implícito em `apps/web/app/` da RFC §8.2 |

---

## 1. Pillar Pages (5)

> Cada pilar mira 1 keyword canônica + 5–8 variações semânticas. Estimativa de volume baseada em tendências de busca SaaS BR (sem GKP direto).

### P1 — "Como fazer demo interativa de produto"

- **Slug:** `/blog/como-fazer-demo-interativa`
- **Intenção:** informational ("como fazer")
- **Funil:** Top of Funnel (captura curiosidade)
- **Volume estimado (PT-BR):** **800–1.500 buscas/mês** (proxy: tendência de "como fazer demo" em SaaS, conforme `gtm-channels.md` §C)
- **Dificuldade:** Média — Supademo USA tem artigo similar, mas em inglês. Espaço PT-BR aberto.
- **H1:** "Como fazer uma demo interativa de produto em 2026 (guia completo)"
- **Meta description:** "Aprenda o que é uma demo interativa, quais ferramentas usar (BR e globais), quanto custa e como criar uma em 5 minutos sem saber programar."
- **Keywords target:**
  - canônica: "como fazer demo interativa" (1.0–1.5k/mês)
  - L1: "como criar demo interativa" (~500/mês), "como gravar demo de software" (~300/mês), "como fazer tour de produto" (~200/mês)
  - L2: "demo interativa para SaaS", "tutorial demo interativa", "ferramenta para criar demo"
- **Estrutura (2.500–3.500 palavras):**
  1. **O que é uma demo interativa** (definição + 3 exemplos reais com prints)
  2. **Por que PMMs brasileiros estão adotando agora** (3 estatísticas: redução de ciclo, conversão, leads qualificados — *marcar como "meta/estimativa"* se não verificadas)
  3. **Como criar uma em 5 passos** (capturar → editar → publicar → medir → melhorar)
  4. **Quais ferramentas existem no Brasil e no mundo** (tabela comparativa: DemoBR, Getdemo, GuiaFlow, Supademo, Navattic, Storylane, Arcade, Loom)
  5. **Quanto custa** (free vs pago, faixa BR R$0–R$ 199, faixa global $0–$450)
  6. **Erros comuns** (5 armadilhas + como evitar)
  7. **LGPD: o que você precisa saber antes de capturar** (consentimento, papéis, DSR)
  8. **CTA final:** "Crie sua primeira demo grátis em 5 minutos" → link para signup
- **FAQ Schema (3 perguntas):**
  - "Quanto custa uma demo interativa?" (R$0 a R$ 199/mês no Brasil; US$0 a US$450 globalmente)
  - "Preciso saber programar?" (Não, todas as ferramentas atuais são no-code)
  - "Funciona para qualquer segmento?" (Sim, com adaptações para SaaS B2B, imóveis, edtech, e-commerce, agências)
- **CTA primário:** Botão "Criar minha primeira demo grátis" → `/signup`
- **CTA secundário:** "Ver exemplo de demo" → `/d/exemplo-saas-b2b`
- **Internos linkados:**
  - → `/blog/tour-interativo-de-produto` (P2)
  - → `/comparar/demobr-vs-supademo`
  - → `/para/saas-b2b` (landing vertical)

### P2 — "Tour interativo de produto: o que é e como criar"

- **Slug:** `/blog/tour-interativo-de-produto`
- **Intenção:** informational ("o que é")
- **Funil:** Top of Funnel
- **Volume estimado:** **~1.500 buscas/mês** (proxy: "tour virtual" tem 14k adjacente, "tour interativo" mais nichado)
- **Dificuldade:** Baixa-média — espaço PT-BR mais vazio.
- **H1:** "Tour interativo de produto: o que é, como criar e quanto custa"
- **Meta description:** "Tour interativo é uma demo clicável do seu SaaS. Veja como PMMs usam pra reduzir ciclo de venda em 30%, com exemplos reais e ferramentas BR."
- **Keywords target:**
  - canônica: "tour interativo de produto" (~1.5k/mês)
  - L1: "tour interativo" (~3k/mês, alto ruído com turismo — segmentar), "tour de produto SaaS" (~300/mês), "tour guiado de software" (~200/mês)
  - L2: "tour clicável", "tour de onboarding", "walkthrough de produto"
- **Estrutura (2.000–2.500 palavras):**
  1. **Definição simples:** tour interativo ≠ tour virtual (cuidado com keyword ambiguous)
  2. **3 tipos:** guiado por cliques / sandbox / híbrido
  3. **Por que SaaS BR está adotando** (3 cases: TOTVS, Meetime, Omie — baseados em `gtm-channels.md` §B.6)
  4. **Passo a passo para criar o seu** (capturar com extensão Chrome → editar hotspots → publicar → embedar)
  5. **Ferramentas BR vs globais** (DemoBR, Getdemo, Supademo, Navattic)
  6. **Métricas que importam** (completion rate, drop-off por step, CTR do CTA)
  7. **CTA:** "Crie seu tour em 5 min" → `/signup`
- **FAQ Schema (3 perguntas):**
  - "Qual a diferença entre demo e tour?" (Demo = apresentação; tour = experiência clicável pelo lead)
  - "Funciona em celular?" (Sim, players são responsivos; captura mobile é limitada no MVP)
  - "Dá pra colocar no meu domínio?" (Sim, em planos Business — CNAME `demo.suaempresa.com.br`)
- **CTA:** DemoBR Pro trial
- **Linka para:**
  - P1 (`como fazer demo interativa`)
  - P5 (`quanto custa plataforma demo`)
  - `/comparar/demobr-vs-guiaflow`

### P3 — "Captura de tela interativa para vendas"

- **Slug:** `/blog/captura-de-tela-interativa-vendas`
- **Intenção:** commercial investigation (comparativo)
- **Funil:** Mid Funnel
- **Volume estimado:** **~400 buscas/mês**
- **Dificuldade:** Média — Supademo e Arcade têm artigos em EN; PT-BR é menos saturado.
- **H1:** "Captura de tela interativa para vendas: 7 ferramentas comparadas (2026)"
- **Meta description:** "Comparamos 7 ferramentas de captura de tela interativa usadas por times de vendas BR: preço, features, prós e contras, com tabela."
- **Keywords target:**
  - canônica: "captura de tela interativa para vendas" (~400/mês)
  - L1: "captura interativa", "ferramenta de captura para vendas", "ferramenta de demo para vendas"
  - L2: "alternativa ao Loom", "captura de tela com hotspot", "screenshot interativo"
- **Estrutura (2.500 palavras):**
  1. **O que é captura interativa** (screenshot + hotspots + simulação de clique)
  2. **Como funciona tecnicamente** (extensão Chrome MV3, JSON manifest, storage em CDN)
  3. **Tabela comparativa** (7 ferramentas: DemoBR, Getdemo, GuiaFlow, Supademo, Navattic, Storylane, Arcade) — preço BR, features, link
  4. **Comparação por uso:**
     - PMM solo / PME → DemoBR Free ou Pro
     - Time mid-market BR → DemoBR Business ou Getdemo Pro
     - Enterprise global → Supademo ou Storylane
  5. **LGPD + captura: como ficar em conformidade** (banner de consentimento, IP não armazenar, DSR endpoint)
  6. **CTA:** "Testar DemoBR grátis"
- **FAQ Schema (3 perguntas):**
  - "Captura de tela interativa é a mesma coisa que vídeo?" (Não — vídeo é passivo; captura interativa é clicável)
  - "Preciso instalar algo?" (Sim, extensão Chrome; desktop apps existem mas maioria usa extensão)
  - "Funciona no celular?" (Visualização sim; captura nativa mobile ainda é limitada)
- **CTA:** Signup Free + comparativo PDF

### P4 — "Alternativas ao Supademo no Brasil"

- **Slug:** `/blog/alternativas-supademo-brasil`
- **Intenção:** commercial investigation (alternativas)
- **Funil:** Mid Funnel (alta conversão)
- **Volume estimado:** **~300 buscas/mês**
- **Dificuldade:** Alta intenção — quem busca "alternativa Supademo Brasil" está pronto para converter.
- **H1:** "Alternativas ao Supademo no Brasil: 5 opções com PIX, NF-e e suporte em PT-BR"
- **Meta description:** "Supademo é top global mas cobra em USD sem Pix. Veja 5 alternativas BR-friendly com preço em R$, incluindo DemoBR, Getdemo e GuiaFlow."
- **Keywords target:**
  - canônica: "alternativas ao Supademo Brasil" (~300/mês)
  - L1: "alternativa Supademo" (~500/mês), "Supademo Brasil" (~200/mês), "concorrente Supademo" (~100/mês)
  - L2: "demo interativa em português", "supademo em reais", "plataforma demo pix"
- **Estrutura (2.500 palavras):**
  1. **Por que buscar alternativa ao Supademo no Brasil** (preço USD, sem Pix, suporte em inglês, LGPD self-declared)
  2. **5 alternativas ranqueadas:**
     - **DemoBR** (R$ 49/mês Pro, PIX/boleto, LGPD by design)
     - **Getdemo** (sales-led, premium, cases TOTVS/Sankhya)
     - **GuiaFlow** (open source MIT, R$ 36/mês Pro)
     - **Fluidz Demos** (R$ 105+/mês, vertical Bitrix24 — *verificar se ainda opera*)
     - **Interdemo** (status desconhecido em Out/2026 — *declarar limitação*)
  3. **Tabela comparativa:** preço, features, idioma, pagamento BR, LGPD
  4. **Quando escolher cada uma** (PME, mid-market, enterprise, dev/OSS)
  5. **CTA:** "Testar DemoBR Pro por 14 dias" + comparativo via WhatsApp
- **FAQ Schema (3 perguntas):**
  - "Supademo aceita PIX?" (Não — Stripe USD)
  - "Qual a alternativa mais barata ao Supademo?" (GuiaFlow Pro R$ 36/mês)
  - "Tem alternativa gratuita ao Supademo?" (Sim — DemoBR Free, GuiaFlow Free, Supademo Free, Navattic Starter)
- **CTA:** Trial Pro + link para compare page dedicada

### P5 — "Quanto custa uma plataforma de demo interativa"

- **Slug:** `/blog/quanto-custa-plataforma-demo-interativa`
- **Intenção:** commercial investigation ("preço")
- **Funil:** Mid-Bottom Funnel (decisor)
- **Volume estimado:** **~250 buscas/mês**
- **Dificuldade:** Alta — decisor B2B pesquisa preço.
- **H1:** "Quanto custa uma plataforma de demo interativa em 2026 (BR + global)"
- **Meta description:** "Tabela comparativa de preços: DemoBR (R$ 49), Supademo ($50), Navattic (sob consulta), Storylane ($50), Arcade ($50), Loom ($18). Tudo em R$ e USD."
- **Keywords target:**
  - canônica: "quanto custa plataforma demo interativa" (~250/mês)
  - L1: "preço demo interativa", "custo demo interativa", "plataforma demo preço"
  - L2: "supademo preço reais", "navattic preço brasil", "demo interativa barato"
- **Estrutura (2.000 palavras):**
  1. **Por que o preço varia tanto** (PLG vs sales-led, com/sem IA, BR vs global)
  2. **Tabela mestra** (8 players × 4 tiers = 32 SKUs, com valor em R$ e USD, conversão R$ 5,50/USD *— taxa de câmbio declarada como premissa da pesquisa*)
  3. **3 faixas de preço para o PMM brasileiro:**
     - Free (R$ 0): DemoBR, GuiaFlow, Supademo, Navattic, Storylane, Arcade
     - Pro PME (R$ 49–R$ 197): DemoBR Pro, GuiaFlow Pro, Supademo Scale ($50 ≈ R$ 275), Storylane Starter ($50 ≈ R$ 275)
     - Mid-market (R$ 800–R$ 1.500): DemoBR Business, Supademo Business ($249 ≈ R$ 1.370), Storylane Growth ($625 ≈ R$ 3.438)
  4. **Custo-benefício: o que justifica pagar** (IA inclusa, HTML capture, suporte em PT-BR, LGPD DSR, payment BR)
  5. **Como DemoBR se posiciona** (R$ 49 vs Supademo $50 ≈ 82% mais barato + LGPD + PIX)
  6. **CTA:** "Calcular minha economia" → calculadora simples + signup
- **FAQ Schema (3 perguntas):**
  - "Qual a plataforma de demo mais barata?" (GuiaFlow R$ 36/mês Pro; DemoBR Free R$ 0)
  - "DemoBR é mais barato que Supademo?" (Sim, ~82% mais barato no tier de entrada)
  - "Tem plano gratuito?" (Sim — DemoBR Free, Supademo Free, Navattic Starter, Storylane Free, Arcade Free)
- **CTA:** Trial Pro + página de pricing detalhada

---

## 2. Compare Pages (5)

> Formato canônico replicado de Supademo USA: tabela comparativa + parágrafo de "quando escolher cada" + CTA.

### C1 — DemoBR vs Navattic
- **Slug:** `/comparar/demobr-vs-navattic`
- **Por que escrever:** Navattic é G2 #1 marketing demo, mas USD-only, sales-led acima do Starter.
- **Posicionamento:** DemoBR ganha em **preço BR + LGPD + PIX**; Navattic ganha em **AI Copilot maduro + Sandbox demos + Buyer Circle Discovery**.
- **CTA:** "Testar DemoBR Pro por 14 dias grátis"

### C2 — DemoBR vs Arcade
- **Slug:** `/comparar/demobr-vs-arcade`
- **Por que:** Arcade é "AI product stories", forte em video + visual + demo.
- **Posicionamento:** Arcade ganha em **AI video/visuals + brand kits**; DemoBR ganha em **preço BR + PT-BR + LGPD + CRM BR nativo**.
- **CTA:** "Ver demo de comparação" + Signup Free

### C3 — DemoBR vs Storylane
- **Slug:** `/comparar/demobr-vs-storylane`
- **Por que:** Storylane tem RepX (AI agent autônomo) e Hubs (digital sales rooms).
- **Posicionamento:** Storylane ganha em **RepX + Hubs + UX polida**; DemoBR ganha em **preço + PT-BR + WhatsApp CTA + pagamento PIX**.
- **CTA:** "Falar com especialista DemoBR"

### C4 — DemoBR vs Supademo
- **Slug:** `/comparar/demobr-vs-supademo`
- **Por que:** Supademo é o alvo de clonagem declarado; compare direta é defensiva (SEO contra quem busca "alternativa Supademo").
- **Posicionamento:** DemoBR ganha em **preço BR + PIX/boleto/NF-e + LGPD by design + suporte PT-BR**; Supademo ganha em **6 formatos de captura + AI Demo Agent + marketplace 200k+ usuários**.
- **CTA:** "Migrar do Supademo para DemoBR — guia gratuito" + trial Pro

### C5 — DemoBR vs GuiaFlow
- **Slug:** `/comparar/demobr-vs-guiaflow`
- **Por que:** GuiaFlow é o OSS BR; o público é dev-friendly, técnico, quer BYOK. Honestidade conta.
- **Posicionamento:** GuiaFlow ganha em **open source + BYOK + export single-file HTML + R$ 36/mês**; DemoBR ganha em **SaaS gerenciado sem chave + LGPD DSR + CRM BR OAuth + IA inclusa sem BYOK**.
- **CTA:** "Testar DemoBR" + link "Ver DemoBR no GitHub" (placeholder V2)

---

## 3. Blog Posts Iniciais (15)

> Foco long-tail, captura tráfego de baixa-fricção.

| # | Title | Slug | Meta description | Outline (5 bullets) |
|---|---|---|---|---|
| 1 | "5 exemplos reais de demo interativa que converteram 30%+ de leads" | `/blog/exemplos-demo-interativa` | "Veja 5 exemplos de SaaS BR que usaram demo interativa pra aumentar conversão: Meetime, Omie, RD Station, etc." | • Definição do que é demo interativa • 3 exemplos SaaS B2B • 1 exemplo imobiliário • 1 exemplo edtech • Como aplicar |
| 2 | "Demo interativa vs Loom vs Zoom: qual escolher em 2026?" | `/blog/demo-interativa-vs-loom-vs-zoom` | "Comparativo: quando usar demo interativa, quando usar Loom, quando usar Zoom. Tabela + prós e contras." | • Diferença fundamental • Demo interativa: vendas async • Loom: explicação rápida • Zoom: call ao vivo • Quando misturar |
| 3 | "Como medir se sua demo está funcionando (5 métricas)" | `/blog/metricas-demo-interativa` | "5 métricas que PMMs usam pra medir demo: completion rate, drop-off, CTR do CTA, tempo médio, leads gerados." | • Completion rate (meta >40%) • Drop-off por step • CTR do CTA WhatsApp • Tempo médio no tour • Leads/demo |
| 4 | "LGPD para demos interativas: o guia completo" | `/blog/lgpd-demo-interativa` | "Como captar leads via demo sem violar LGPD: consentimento, papéis operador/controlador, DSR endpoint, retenção." | • Base legal (consentimento vs contrato) • Banner de consentimento • DSR (export + delete) • Retenção de dados • Checklist ANPD |
| 5 | "Onboarding assíncrono: como ativar clientes sem 5 calls" | `/blog/onboarding-assincrono` | "CS/CX pode ativar 80% dos clientes sem call usando demo interativa + checklist in-app. Veja como." | • Custo de call por onboard • Demo como onboarding • Checklist in-app • Caso SaaS mid-market • Métricas de ativação |
| 6 | "Demo interativa para imobiliárias: tour de apartamento" | `/blog/demo-interativa-imobiliarias` | "Imobiliárias no Brasil estão usando demo interativa pra tour de apartamento à distância. Cases + como fazer." | • Vertical imob no BR • Tour de apê vs tour virtual 360° • Captura com extensão • WhatsApp CTA • Cases (Maestro ABM) |
| 7 | "Edtech: como treinar 500 alunos sem reunião" | `/blog/edtech-treinamento-demo-interativa` | "Edtechs podem usar demo interativa pra treinar novos usuários em horas, não dias. Veja passo a passo + casos." | • Custo de onboarding em edtech • Demo + SCORM export • Casos (Udemy, Hotmart) • Passo a passo • Métrica de completion |
| 8 | "E-commerce: como usar demo interativa pra reduzir devolução" | `/blog/ecommerce-demo-interativa-devolucao` | "E-com BR perde 12% em devolução. Demo interativa do produto reduz em até 30%. Veja cases e como aplicar." | • Taxa de devolução BR • Demo de produto físico (mockup) • Captura de manuais • WhatsApp CTA pós-demo • Métricas |
| 9 | "Agência de marketing: como multiplicar fechamento em 3x" | `/blog/agencia-marketing-demo-interativa` | "Agências podem usar demo interativa pra mostrar plano de marketing ao cliente antes de fechar. Cases reais." | • Demo de proposta • Antes vs depois • DemoBR Pro vs conta de agência • Cases (3 agências BR) • Modelo de cobrança |
| 10 | "Como capturar uma demo com a extensão Chrome (passo a passo)" | `/blog/como-capturar-demo-extensao-chrome` | "Tutorial passo a passo: instalar extensão Chrome de demo, capturar cliques, editar, publicar em 5 minutos." | • Instalar DemoBR Capture • Iniciar captura • Clicar nos elementos • Editar no app • Publicar |
| 11 | "Como embedar uma demo no seu site (WordPress, Webflow, Shopify)" | `/blog/embedar-demo-site` | "3 formas de embedar demo interativa no seu site: iframe, script, link. Inclui código copy-paste." | • Iframe básico • Script embed.ly • Apps por plataforma (WP, Webflow, Shopify) • Custom domain (Business) • Performance |
| 12 | "10 erros que matam sua demo interativa" | `/blog/erros-demo-interativa` | "10 erros comuns que PMMs cometem ao criar demo: textos longos, sem CTA, hotspots demais, etc." | • Erro 1-3 (conteúdo) • Erro 4-6 (estrutura) • Erro 7-9 (técnico) • Erro 10 (LGPD) • Checklist |
| 13 | "WhatsApp como CTA final da demo (case + implementação)" | `/blog/whatsapp-cta-demo` | "Por que WhatsApp converte 3x mais que email como CTA final de demo. Como configurar no DemoBR." | • WhatsApp no Brasil (90% mindshare) • wa.me/?text= template • Comparar com e-mail • Case (3 SaaS BR) • Setup |
| 14 | "Como o time de vendas usa demo interativa no outbound" | `/blog/sdr-demo-outbound` | "SDR pode enviar demo interativa em vez de vídeo no cold email. Veja cadência + script + métricas." | • Problema: vídeo morre no link • Solução: demo clicável • Cadência 5-touch • Script SDR • Métricas (open, reply, demo-to-call) |
| 15 | "De TOTVS a Zenvia: como PMMs BR estão usando demo" | `/blog/cases-pmm-br-demo` | "6 cases reais de PMMs brasileiros usando demo interativa: TOTVS, Meetime, Zenvia, Omie, Sankhya, Onfly." | • Cases por setor • Métricas reportadas • Padrões comuns • Lições aprendidas • Como replicar |

---

## 4. Landing Pages Verticais (5)

> Cada uma adapta a copy do produto ao segmento. Estrutura comum: hero + problema + solução + case + pricing + CTA.

### LV1 — `/para/saas-b2b`
- **Title (H1):** "Demos interativas para SaaS B2B brasileiro"
- **Subhead:** "Reduza o ciclo de venda em até 30%, qualifique leads antes da call e venda mais sem contratar mais AEs."
- **Problema:** "Cada demo ao vivo custa 1h do AE. Lead não qualificado atrasa fechamento. Vídeo no YouTube é esquecido em 24h."
- **Solução:** "Demo interativa assíncrona que o lead assiste sozinho. Você só fala com quem já viu."
- **Case link:** Meetime (case fictício com métricas)
- **CTA:** "Testar DemoBR Pro grátis por 14 dias"

### LV2 — `/para/imobiliarias`
- **Title:** "Tour interativo de apartamento pra vender mais sem sair do escritório"
- **Subhead:** "Imobiliárias brasileiras estão usando demo interativa pra tour à distância — WhatsApp no botão final."
- **Problema:** "Levar cliente 4h pra ver apê que ele não fecha. Broker perde tempo. Cliente sério vai pro concorrente."
- **Solução:** "Tour clicável que cliente abre no celular, navega sozinho, e clica WhatsApp pra marcar visita presencial."
- **Case link:** Maestro ABM (referência pública em `gtm-channels.md` §B.6)
- **CTA:** "Criar tour do meu apê grátis"

### LV3 — `/para/edtech`
- **Title:** "Onboarding interativo pra edtech: 500 alunos em horas, não em semanas"
- **Subhead:** "Treine novos usuários de edtech com tour interativo + SCORM export pra LMS TOTVS/Senior."
- **Problema:** "Onboarding manual custa 1 CS por 100 alunos. Churn alto na primeira semana. Suporte sobrecarregado."
- **Solução:** "Demo interativa + checklist in-app + SCORM export. Aluno se ativa sozinho, CS só intervém quando trava."
- **Case link:** Hotmart, Udemy (referências)
- **CTA:** "Testar DemoBR Pro com SCORM"

### LV4 — `/para/ecommerce`
- **Title:** "Demo interativa pra e-commerce: reduza devolução em até 30%"
- **Subhead:** "Mostre produto físico em uso, com manuais clicáveis e WhatsApp como CTA final. Menos devolução, mais upsell."
- **Problema:** "12% de devolução em e-com BR. Cliente não entende o produto. Vendedor precisa explicar 5x."
- **Solução:** "Tour interativo do produto: como usar, dimensões reais, comparativo com similares. WhatsApp pra tirar dúvida."
- **Case link:** Genérico (sem case público confirmado em Out/2026)
- **CTA:** "Criar primeira demo do meu produto"

### LV5 — `/para/agencias-marketing`
- **Title:** "Proposta interativa pra agência: feche 3x mais sem fazer deckinho"
- **Subhead:** "Mostre plano de marketing, escopo e timeline como demo interativa. Cliente aprova 3x mais rápido."
- **Problema:** "Deck PDF é chato, vai pra lixeira. Cliente demora 14 dias pra responder. Concorrência fecha antes."
- **Solução:** "Proposta como demo clicável: cliente navega, vê cases, clica pra agendar kickoff. Você fecha em 7 dias."
- **Case link:** 3 agências BR (fictício até case real)
- **CTA:** "Fazer proposta interativa grátis"

---

## 5. Schema & SEO técnico

### 5.1 Schema.org
- **Article** em todos os blog posts.
- **FAQPage** (3 perguntas) em todos os pilares e comparativos.
- **Product** + **Offer** em `/pricing`.
- **Organization** + **Logo** no header global.
- **SoftwareApplication** em home.
- **BreadcrumbList** em todas as páginas internas.

### 5.2 Meta tags (canônicas)
- Title: **55–60 chars**, keyword no início.
- Description: **150–160 chars**, CTA no final.
- OG image: **1200×630**, primary background, "▶ DemoBR" centralizado.
- Canonical: absoluto, lowercase, trailing slash off.

### 5.3 Sitemap & robots
- `sitemap.xml` dinâmico via Next.js (atualiza por ISR).
- `robots.txt`: permitir tudo, bloquear `/app/*`, `/api/*`, `/embed/*` (preview), `/d/preview-*`.

### 5.4 Core Web Vitals (meta)
- **LCP** < 2.5s (next/image + Cloudflare CDN)
- **INP** < 200ms (evitar JS blocking)
- **CLS** < 0.1 (size em imagens)

---

## 6. Métricas de SEO (W1–W12)

| Semana | Tráfego orgânico estimado | Páginas indexadas | Posição média top 10 |
|---|---|---|---|
| W1 | 0 (acumulado) | 5 pilares | — |
| W4 | 50–200/mês | 5 pilares + 5 compare | posição média 25–40 |
| W8 | 200–600/mês | 5 pilares + 5 compare + 10 blog | posição média 12–25 |
| W12 | 500–1.500/mês | 5 pilares + 5 compare + 15 blog + 5 LP | posição média 5–15 |

> **Caveat:** números são estimativas baseadas em cadência de produção + benchmark SaaS BR; **não há dados reais até W12**. Métricas reais devem ser lidas via Google Search Console.

---

## 7. Limitações declaradas

- Volumes de busca são **estimados** (proxy de tendências; Google Keyword Planner não acessado diretamente).
- Métricas de tráfego projetadas são **modeladas**, não históricas.
- Dificuldade de SEO é **heurística** baseada em densidade competitiva observada em PT-BR (pesquisa qualitativa, não análise de SERP programática).
- Schema.org e Core Web Vitals são **boas práticas assumidas**; auditoria técnica será feita após MVP.
- 5 landing pages verticais são scaffolds — copy final depende de feedback de ICPs reais.

---

## 8. Referências internas

- ICPs: `marketing/ICP-PERSONAS.md`
- Concorrentes (comparativos): `research/demos/SUMMARY.md`
- Pricing: `research/pricing/SYNTHESIS.md` §3
- Canais priorizados: `research/pricing/gtm-channels.md` §A
- Keywords iniciais: `research/pricing/gtm-channels.md` §C
- Calendário de publicação: `marketing/CONTENT-CALENDAR.md`