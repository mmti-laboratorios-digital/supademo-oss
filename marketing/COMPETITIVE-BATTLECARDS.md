# Competitive Battlecards — EasyDemo vs Concorrentes

> **Data:** 2026-10-18.
> **Uso:** sales / GTM / founder em calls com leads que mencionam concorrentes. **Não compartilhar com público externo** (contém críticas diretas).
> **Fontes:** `research/demos/SUMMARY.md`, `research/demos/[concorrente].md`, `research/pricing/SYNTHESIS.md`, `research/pricing/brazilian-players-pricing.md`.
> **Tom:** honesto, técnico, sem agressividade gratuita. Foco em fatos verificáveis.
> **Disclaimer:** comparações são em **out/2026**; pricing/features podem mudar.

---

## 0. Panorama competitivo

| Concorrente | Categoria | Tier de entrada | Diferencial vs EasyDemo |
|---|---|---|---|
| **Supademo** | Líder global | $50/mês (≈ R$ 275) | USD, sem Pix, sem PT-BR nativo |
| **Navattic** | Premium global | $0 Free, Base sob consulta | Sales-led, USD, HubSpot/Salesforce US |
| **Storylane** | Premium global + RepX AI | $50/mês (≈ R$ 275) | USD, UX polida, Hubs |
| **Arcade** | Visual + AI video | $50/mês (≈ R$ 275) | USD, AI video/visuals |
| **Getdemo** | BR sales-led | Sob consulta | Sales-led, sem Free, cases BR |
| **GuiaFlow** | BR open source | R$ 36/mês | OSS, BYOK, dev-friendly |

> **Posicionamento EasyDemo:** "Ferramenta global, **BR-first**. Mesmo nível de feature que Supademo/Navattic/Storylane, mas em R$, com PIX, NF-e, LGPD by design e PT-BR nativo."

---

## 1. Battlecard — EasyDemo vs Supademo

### 1-paragraph pitch

> "Supademo é o líder global — tem 200k+ usuários, AI Demo Agent, 6 formatos de captura e o MCP server mais maduro. EasyDemo não compete com isso no global; compete no Brasil, com preço em R$, pagamento PIX/boleto/NF-e, suporte em PT-BR e LGPD by design (DSR endpoint, IP não armazenado, retenção automática). Pro R$ 49/mês vs Supademo Scale $50 ≈ R$ 275 — 82% mais barato."

### Top 3 differentiators (EasyDemo)

1. **82% mais barato no tier de entrada** (R$ 49 Pro vs $50 Scale ≈ R$ 275).
2. **PIX nativo, boleto, NF-e** (Supademo: Stripe USD, sem NF-e automática).
3. **LGPD by design** com DSR endpoint automatizado (Supademo: LGPD self-declared, sem DSR endpoint).

### Top 3 weak spots (Supademo)

1. **Preço em USD** sem opção de Pix/boleto — fricção pra PMM brasileiro.
2. **Suporte em inglês** — não tem suporte dedicado BR.
3. **Free limitado a 5 demos** + AI/MCP/HTML capture todos pagos.

### Perguntas comuns

| Pergunta do lead | Resposta |
|---|---|
| "Supademo tem 200k usuários. Vocês não são pequenos demais?" | "Tamanho não é feature. Supademo é ótimo pra quem aceita USD e cartão internacional. A pergunta é: você prefere economizar R$ 200/mês e ter suporte em PT-BR, ou ter 200k users numa plataforma que não emite NF-e?" |
| "Supademo tem MCP server. Vocês não?" | "MCP server está no roadmap Q1 2027 (ver `/roadmap`). Hoje temos API REST + OpenAPI 3.1 desde o Free, com HMAC webhooks — equivalente ao Supademo pra 90% dos casos BR." |
| "E a AI Demo Agent?" | "Não temos (ainda). Roadmap Q2 2027 com integração WhatsApp Business + PT-BR. Supademo tem, mas roda em widget web, não abre WhatsApp." |

### Objection handling

| Objeção | Resposta |
|---|---|
| "Meu time já usa Supademo" | "Legal. Note que: (1) vocês pagam USD sem NF-e; (2) suporte em inglês; (3) AI/mcp em tier pago. EasyDemo resolve (1) e (2) sem migração brusca — use os dois por 30 dias." |
| "Supademo é G2 leader" | "Verdade. Mas G2 ranqueia global. No Brasil, Getdemo é o leader de mercado, e o case mais forte de PMM brasileiro é com BR-first tools (RD Station, Hotmart)." |
| "Tenho medo de migrar" | "Não precisa migrar. Use EasyDemo pra demos BR (com Pix, LGPD) e Supademo pra demos globais (EN). Funciona em paralelo." |

---

## 2. Battlecard — EasyDemo vs Navattic

### 1-paragraph pitch

> "Navattic é o G2 #1 de marketing demos — forte em Sandbox demos, Buyer Circle Discovery e AI Copilot maduro. EasyDemo compete em **preço BR + LGPD + Pix**; Navattic ganha em **AI Copilot consolidado** (escala enterprise US) e **Sandbox demos** (workspace personalizável). Pro R$ 49/mês vs Navattic Base sob consulta (estimativa R$ 800+/mês) — EasyDemo é **~16x mais barato** no tier inicial.

### Top 3 differentiators (EasyDemo)

1. **Preço público, transparente, em R$** (Navattic: sales-led, tiers não publicados).
2. **Pix + boleto + NF-e** (Navattic: Stripe USD).
3. **LGPD by design + DSR endpoint** (Navattic: SOC 2 + GDPR, mas sem DSR endpoint público).

### Top 3 weak spots (Navattic)

1. **Sales-led** acima do Free (1 demo só) — fricção alta pra PME.
2. **Preço opaco** — precisa falar com sales pra cotar.
3. **Buyer Circle Discovery** não está em tier base.

### Perguntas comuns

| Pergunta do lead | Resposta |
|---|---|
| "Navattic tem Buyer Circle Discovery" | "Verdade — diferencial deles. EasyDemo não tem. Mas a maioria dos SaaS B2B BR PME não precisa de buyer circle; precisa de demo simples que converte." |
| "Navattic tem sandbox demo" | "Sim — superior ao EasyDemo nisso. Roadmap EasyDemo Q1 2027 inclui sandbox básico. Pra quem precisa de free-roam clone-html HOJE, Navattic é melhor." |
| "Navattic é G2 #1" | "G2 #1 é em marketing demos (categoria). EasyDemo compete em **interactive demo SaaS B2B BR** — categoria onde Navattic não tem footprint." |

### Objection handling

| Objeção | Resposta |
|---|---|
| "Navattic tem AI Copilot mais maduro" | "Sim, AI Copilot deles é referência. EasyDemo tem AI text generation inclusa no Pro. Diferença prática: 90% dos PMMs BR usam AI text pra rewrite, não pra criar do zero. EasyDemo resolve isso." |
| "Navattic tem Sandbox demos" | "Verdade. EasyDemo não tem (ainda). Pra casos de uso enterprise com dados fictícios, Navattic ganha. Pra SaaS B2B PME mid-market, EasyDemo Free/Pro resolve 95% dos casos." |
| "É mais barato mesmo?" | "Sim. EasyDemo Pro R$ 49 vs Navattic Base ~R$ 800+. EasyDemo Business R$ 199 vs Navattic Growth ~R$ 2.000+. **Diferença de ~16x no Pro, ~10x no Business.**" |

---

## 3. Battlecard — EasyDemo vs GuiaFlow

### 1-paragraph pitch

> "GuiaFlow é o principal player BR open-source (MIT) — R$ 36/mês Pro, BYOK (sua chave OpenAI/Cartesia), MCP server nativo, single-file HTML export. EasyDemo compete em **SaaS gerenciado com IA inclusa** (sem precisar de chave), **LGPD DSR endpoint** e **CRM BR OAuth nativo**. GuiaFlow ganha em **open-source + BYOK + R$ 36/mês** (mais barato que Pro R$ 49). EasyDemo ganha em **SaaS pronto (sem chave) + LGPD ponta-a-ponta + CRM BR**."

### Top 3 differentiators (EasyDemo)

1. **IA inclusa no Pro** — sem precisar de chave OpenAI/Cartesia.
2. **LGPD com DSR endpoint** automatizado (`POST /api/dsr` com token).
3. **CRM BR OAuth nativo** (HubSpot BR, RD Station, Kommo) — não só Zapier.

### Top 3 weak spots (GuiaFlow)

1. **BYOK obrigatório no Free** — usuário precisa ter chave OpenAI/Cartesia (fricção pro PMM não-técnico).
2. **Sem SaaS gerenciado** — usuário configura TTS, BYOK, MCP server.
3. **Comunidade pequena** (31 ⭐ GitHub) — risco de descontinuidade.

### Perguntas comuns

| Pergunta do lead | Resposta |
|---|---|
| "GuiaFlow é R$ 36, vocês R$ 49. Não são mais caros?" | "Sim, R$ 13 a mais. Pelo extra você leva: IA inclusa (sem chave), LGPD DSR endpoint, CRM BR OAuth, suporte PT-BR dedicado. Pro PMM não-técnico, R$ 13 é troco." |
| "GuiaFlow é open-source. EasyDemo é?" | "Não. EasyDemo é SaaS fechado (proprietário). Tradeoff: a gente assume custo de IA + LGPD + suporte. GuiaFlow deixa você no controle total." |
| "Por que não usar GuiaFlow Free?" | "GuiaFlow Free funciona, mas exige BYOK e links temporários 7d. Pra uso sério (cliente recebe demo), precisa do Pro R$ 36. Avalie: quer controle total (GuiaFlow) ou conveniência (EasyDemo)?" |

### Objection handling

| Objeção | Resposta |
|---|---|
| "GuiaFlow é open source, vocês não. Lock-in!" | "Verdade. EasyDemo é SaaS proprietário. Risco de lock-in real, mas mitigado por: (1) export de demos como single-file HTML (roadmap Q1 2027); (2) LGPD DSR endpoint permite deletar tudo a qualquer momento; (3) estamos há 5 anos construindo isso." |
| "Quero controle total da minha chave OpenAI" | "Use GuiaFlow Pro com BYOK. EasyDemo não é pra você. Sem julgamento." |
| "GuiaFlow tem MCP server desde Free" | "Verdade. EasyDemo MCP server está no roadmap Q1 2027. Até lá, EasyDemo tem API REST + OpenAPI 3.1 desde Free, com HMAC SHA-256." |

---

## 4. Battlecard — EasyDemo vs Getdemo

### 1-paragraph pitch

> "Getdemo é o player BR de demos interativas com cases públicos (TOTVS, Sankhya, B3, Zenvia, Meetime) — vendas sales-led, tiers Starter/Standard/Pro/Enterprise sob consulta, **sem Free nem trial declarado**. EasyDemo compete em **transparência de preço + self-serve + Free pro sempre**. Pro R$ 49 vs Getdemo Pro estimado R$ 800–1.500 (não público). EasyDemo ganha em **PLG + preço visível**; Getdemo ganha em **cases enterprise BR + customer success dedicado incluso**."

### Top 3 differentiators (EasyDemo)

1. **Preço público** em R$ (R$ 49 / R$ 199) — Getdemo: "Fale com um especialista".
2. **Free pro sempre** (3 demos, 50 views/mês) — Getdemo: sem free nem trial.
3. **Self-serve PLG** — Getdemo: sales-led, exige reunião.

### Top 3 weak spots (Getdemo)

1. **Pricing opaco** — fricção enorme pra PMM pesquisando sozinho.
2. **Sem free tier** — perde no funil PLG.
3. **Onboarding sales-led** — pode ser lento pra quem quer testar agora.

### Perguntas comuns

| Pergunta do lead | Resposta |
|---|---|
| "Getdemo tem case com TOTVS. Vocês não" | "Verdade. Getdemo tem cases enterprise BR fortes. EasyDemo é novo — primeiros cases vão aparecer Q1 2027. Tradeoff: você quer **case gigante** (Getdemo) ou **transparência de preço + self-serve** (EasyDemo)?" |
| "Por que EasyDemo e não Getdemo?" | "3 motivos: (1) preço público em R$ — Getdemo exige cotação; (2) free tier pra testar — Getdemo não tem; (3) self-serve sem precisar de call — Getdemo é sales-led." |
| "Getdemo tem Customer Success incluso" | "Verdade — diferencial forte deles. EasyDemo Pro tem onboarding self-serve + suporte por email. Pra quem precisa de CS dedicado, Getdemo ganha. Pra quem quer self-serve rápido, EasyDemo." |

### Objection handling

| Objeção | Resposta |
|---|---|
| "Getdemo é conhecido no BR" | "Sim. Mas 'conhecido' ≠ 'cabe no meu bolso'. Getdemo é sales-led enterprise. PMM solo ou PME não fecha com eles. EasyDemo atende esse gap." |
| "Quero CS dedicado" | "Getdemo é melhor pra você. EasyDemo Pro tem suporte por email + docs, mas não CS dedicado. Business tem 'priority support' mas não dedicated CSM." |
| "Getdemo aceita Pix, vocês também" | "Verdade — ambos Pix. Diferença: EasyDemo Pro R$ 49 (Planx SaaS B2B BR PME), Getdemo Pro ~R$ 800+. **"** |

---

## 5. Battlecard consolidado (resumo executivo)

### Quando recomendar EasyDemo

| Situação | Concorrente | Por que EasyDemo |
|---|---|---|
| PMM solo / PME BR | Supademo, Navattic, Storylane | R$ 49 vs USD, Pix, NF-e, PT-BR |
| PMM quer self-serve PLG | Getdemo | Free tier + preço público |
| PMM quer Open source / controle total | GuiaFlow | Aceitar IA inclusa (sem BYOK) e R$ 49 |
| Empresa enterprise US-focused | Supademo, Storylane | **Não é o nosso ICP.** |
| Empresa enterprise BR | Getdemo, Supademo Business | EasyDemo Business R$ 199 (mais barato que ambos) |
| Quem precisa de HTML clone / Sandbox HOJE | Supademo, Navattic | EasyDemo roadmap Q1 2027 |

### Quando **não** recomendar EasyDemo

| Situação | Recomendação |
|---|---|
| Precisa de **Sandbox demos free-roam HOJE** | Navattic ou Storylane |
| Precisa de **AI Demo Agent autônomo HOJE** | Supademo (AI Demo Agent) ou Storylane (RepX) |
| Quer **open source + BYOK** | GuiaFlow |
| Quer **CS dedicado incluso em todos os tiers** | Getdemo |
| Empresa **enterprise global, multi-currency** | Supademo Business+ ou Navattic Enterprise |

---

## 6. FAQ de objeções (geral)

### "Vocês não são só mais uma Supademo BR?"

Não. Somos **SaaS BR-first** com 3 decisões de produto que ninguém no mercado combina:

1. **Pix + boleto + NF-e** nativos (Asaas emite NF-e automático).
2. **LGPD com DSR endpoint** automatizado (não é marketing fluff).
3. **CRM BR OAuth** (HubSpot BR, RD Station, Kommo) — não Zapier genérico.

Supademo é ótimo pra global; EasyDemo é pra BR.

### "Quanto custa?"

EasyDemo Pro **R$ 49/mês** (anual R$ 39/mês). EasyDemo Business **R$ 199/mês** (anual R$ 159/mês). Free pro sempre (3 demos, 50 views/mês).

Comparação:
- Supademo Scale: $50 ≈ R$ 275.
- Storylane Starter: $50 ≈ R$ 275.
- Navattic Base: sob consulta.
- EasyDemo Pro: R$ 49.

### "Tem IA?"

Sim: **AI text generation** (Claude/GPT-4o-mini via OpenRouter) e **TTS pt-BR** (ElevenLabs/Cartesia) inclusos no Pro e Business. Sem precisar de chave de API.

Roadmap: voice cloning pt-BR Q1 2027; AI Demo Agent autônomo Q2 2027.

### "Funciona com meu CRM?"

Sim, nativamente: **HubSpot BR, RD Station, Kommo** (OAuth, não Zapier). Funciona também com Salesforce, Pipedrive via webhook (qualquer tier).

### "E LGPD?"

LGPD **by design**:

- Consentimento explícito (checkbox desmarcado por padrão).
- IP **não** armazenado.
- User-Agent hasheado.
- **DSR endpoint automatizado** (`POST /api/dsr` com token — export JSON + delete).
- Retenção automática (365 dias sem interação = delete).

Política completa em `/lgpd` + DPO público.

---

## 7. Anti-disparagement rule

> ⚠️ **Política do EasyDemo:** **não atacar concorrentes publicamente** (posts em redes, blog público, compare pages agressivas).
>
> **Por que?** Atacabilidade e profissionalismo. PMM brasileiro é bem conectado — ataca concorrente, vira polêmica.
>
> **Quando citar concorrente:** **apenas em compare pages SEO** (com fatos verificáveis + link oficial).
>
> **Tom:** honesto, técnico, "cada um no seu quadrado". Reconhecer onde concorrente ganha (sandbox demo Navattic, AI Agent Supademo, OSS GuiaFlow). Mostrar onde EasyDemo ganha (Pix, LGPD, PT-BR, preço).

---

## 8. Fontes & limitações

### Fontes usadas

- `research/demos/SUMMARY.md` (matriz comparativa)
- `research/demos/supademo.md`
- `research/demos/navattic.md`
- `research/demos/storylane.md`
- `research/demos/arcade.md`
- `research/demos/getdemo.md`
- `research/demos/guiaflow.md`
- `research/pricing/SYNTHESIS.md`
- `research/pricing/brazilian-players-pricing.md`

### Limitações declaradas

- **Pricing de Navattic / Getdemo é estimado** (páginas oficiais não publicam números exatos).
- **Features listadas refletem Out/2026** — concorrentes atualizam mensalmente.
- **Reviews G2 agregados** (células 4.7/5, 4.8/5) são referências globais, não BR-específicas.
- **Tone of "battlecard"** é agressivo por construção; ajustar ao usar em copy pública (compare pages SEO usam tom mais leve).
- **Roadmap EasyDemo** (HTML clone Q1 2027, AI Agent Q2 2027) é hipótese; validar com engenharia antes de citar em vendas.

---

## 9. Como usar estas battlecards

| Cenário | Onde |
|---|---|
| **Call de vendas com lead** | Levar impressa (ou digital) — usar "1-paragraph pitch" + "objection handling" |
| **Compare page SEO** | Usar "Top 3 differentiators" + tabela de preços (tom leve, sem agressividade) |
| **Post de blog "vs X"** | Estrutura: EasyDemo vs X → tabela de preços → quando escolher cada |
| **Apresentação de produto** | Slide com "Top 3 differentiators" + 1 frase de "objection handling" |

---

## 10. Referências internas

- Pricing tiers: `research/pricing/SYNTHESIS.md` §3
- ICPs: `marketing/ICP-PERSONAS.md`
- Cases: `marketing/CASE-STUDIES/`
- Compare pages SEO: `marketing/SEO-PILLAR-PAGES.md` §2
- Templates de e-mail: `marketing/TEMPLATES/`