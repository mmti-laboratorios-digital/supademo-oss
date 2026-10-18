# SUMMARY — Matriz comparativa e Gap analysis para o Supademo BR

> Pesquisa conduzida em 18-out-2026 a partir de fontes primárias (sites oficiais, OKFs, OpenAPIs, view-source, GitHub, llms.txt e páginas de pricing) e fontes secundárias (G2 reviews agregadas via busca, Reddit, comparativos third-party).
>
> **Fontes oficiais consultadas:**  
> Supademo — https://supademo.com, /pricing, /okf/index.md, docs.supademo.com  
> Arcade — https://www.arcade.software, /pricing, app.arcade.software HTML (`/_next/static/...`)  
> Storylane — https://www.storylane.io, /plans  
> Navattic — https://www.navattic.com, /pricing  
> Tango — https://tango.us, /pricing  
> Scribe — https://scribehow.com, /pricing  
> Loom — https://www.loom.com (parte demo)  
> Getdemo — https://www.getdemo.com.br, /planos (Webflow)  
> Interdemo — https://interdemo.com.br (SPA Vite/React)  
> Fluidz Demos — https://demos.fluidz.com.br, /pricing (Next.js + Tailwind)  
> GuiaFlow — https://guiaflow.pro, /editor (vanilla+Electron), github.com/gugamistri/gflow, llms.txt  
> Demohub — domínio https://demohub.com.br não respondeu → marcado como "slot aberto"  

---

## 1. Matriz comparativa (linhas = features, colunas = produtos)

✅ = tem na free / tier inicial · 💰 = pago · 🟡 = só em tiers altos · ❌ = não tem · 🔓 = OSS / BYOK

| Feature / Categoria | Supademo | Arcade | Storylane | Navattic | Tango | Scribe | Loom | Getdemo | Interdemo | Fluidz | GuiaFlow |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Captura screenshot/print** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (só vídeo) | ✅ | ✅ | ✅ | ✅ |
| **Captura HTML (clone front-end)** | 💰 Business+ | 🟡 Enterprise | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | 🟡 | ❌ | ❌ |
| **Sandbox demo (free-roam)** | 💰 Growth+ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 Pro+ | ❌ | ❌ | ❌ |
| **Captura Mobile** | ✅ | ✅ (apps) | ✅ | ✅ | ❌ | ✅ (mobile capture) | ✅ (iOS/Android) | 🟡 | ❌ | ❌ | ❌ |
| **Extensão Chrome** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ |
| **Desktop app** | ✅ Mac/Win | ✅ Mac/Win | ✅ Mac | 🟡 | ✅ Mac/Win | ✅ Mac/Win | ✅ Mac/Win | ❌ | ❌ | ❌ | ✅ Electron |
| **Figma plugin** | ✅ | ✅ | 🟡 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Hotspots/Callouts** | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 Pro+ | ❌ | ✅ | ✅ | ✅ | ✅ (highlight) |
| **Simulated click** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | 🟡 | ✅ | ✅ |
| **Branching logic** | 💰 Scale+ | 🟡 Growth+ | ✅ | ✅ | 🟡 Enterprise (multi-path) | ❌ | ❌ | ✅ (Storylines) | ❌ | ❌ | ❌ |
| **Voiceover (AI)** | 💰 | ✅ | ✅ | ✅ | ✅ (voice transcription) | 🟡 Pro+ | ✅ transcrição 50+ | 🟡 Standard+ | ❌ | ❌ | ✅ (Cartesia) |
| **Voice cloning** | 💰 Growth+ | ❌ | 🟡 | 🟡 (avatar) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **AI geração de texto** | 💰 AI Command | ✅ Avery | ✅ | ✅ Copilot | ✅ Optimize | 🟡 Pro Optimize | ✅ Loom AI | 🟡 | ❌ | ❌ | 🔓 BYOK |
| **Tradução automática** | 💰 | 🟡 Growth+ | ✅ | 🟡 | 🟡 Enterprise (15 langs) | ✅ | ✅ captions 50+ | 🟡 | ❌ | ❌ | ❌ |
| **AI Demo Agent autônomo** | 💰 add-on créditos | ❌ | ✅ RepX | ✅ Navattic Agents | ❌ (mas tem Tango Agents) | ❌ | ❌ | ✅ SaaS Copilot | ❌ | ❌ | ❌ |
| **Captura de leads (form pré-demo)** | ✅ | 🟡 Growth+ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ (Pro) |
| **Account identification** | 🟡 | 🟡 | ✅ Buyer circle | ✅ (Pro+) | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Demo Hub / Showcase** | ✅ Showcase/Routes | ✅ Collections | ✅ Hubs | ✅ | ❌ | ❌ | ❌ | ✅ DemoHub | ❌ | ❌ | ❌ |
| **Embed iframe** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Pro) |
| **Onboarding in-app guides** | ✅ in-app hub | 🟡 (Pins-like?) | ❌ | 🟡 checklists | ✅ Pins/Guide Me | ❌ | ❌ | ✅ Onboarding Guiado | ❌ | ❌ | ❌ |
| **Browser automation (executar)** | ❌ | ❌ | ❌ | ❌ | ✅ Automations | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Analytics básicos** | ✅ Scale+ | ✅ Free | ✅ | ✅ | 🟡 Pro+ | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ (Pro) |
| **Analytics avançado (A/B, funil)** | 💰 | 🟡 Growth+ | ✅ A/B | ✅ A/B | ✅ Org | ✅ | 🟡 | ✅ Account ID | ❌ | ❌ | ❌ |
| **Integrações CRM (Salesforce, HubSpot, etc)** | ✅ | ✅ Salesforce | ✅ | ✅ | ❌ | 🟡 | 🟡 | ✅ | ❌ | 🟡 Bitrix24 nativo | ❌ |
| **Zapier / Make** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | 🟡 | ✅ | 🟡 | 🟡 (webhook) | ❌ |
| **MCP server (Claude/ChatGPT/Cursor)** | ✅ (Scale+) | ✅ Free | ✅ | ✅ (Base+) | ❌ | ✅ Optimize MCP | ❌ | ❌ | ❌ | ❌ | ✅ Free |
| **API REST pública + OpenAPI** | ✅ OpenAPI.yaml | 🟡 | 🟡 | ✅ | ❌ | 🟡 | 🟡 | ❌ | ❌ | ❌ | ✅ OpenAPI 3.1 |
| **Open source (código aberto)** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ MIT |
| **BYOK (sua chave OpenAI/Cartesia)** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Preço self-serve mais barato** | $0 Free | $0 Free | $0 Free | $0 Starter | $0 Free | $0 Basic | $0 Starter | Sob consulta | Sob consulta | R$1.264/ano | R$0 Free (BR ideal) |
| **Tier mais barato pago** | $38/mês Scale | $42.50/mês Growth (seat) | ~$50/mês | Sob consulta | $15/mês Pro | $23/mês Pro Team | Sob consulta | Sob consulta | Sob consulta | R$1.264/ano Essencial | **R$36/mês** Pro |
| **Pagamento em Pix / Boleto / NF BR** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | 🟡 | ✅ | Stripe (Pix via Stripe) |
| **LGPD compliance explícita** | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | ✅ HIPAA+GDPR+FERPA | 🟡 | ✅ | ✅ analytics pós-consent | 🟡 | ✅ |
| **Templates/SCORM export** | ✅ SCORM | 🟡 | ✅ | ✅ | ✅ | ✅ PDF/MD/HTML/Word | ✅ vídeo | ✅ | ❌ | ❌ | ❌ |
| **Single-file HTML export** | ❌ | ✅ (step-by-step guides) | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **MP4 export** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ (já é vídeo) | ✅ | 🟡 | ❌ | ✅ WebCodecs |
| **Custom domain** | 🟡 | 🟡 Enterprise | ✅ | 🟡 | ❌ | 🟡 Enterprise | 🟡 | 🟡 Enterprise | ❌ | 🟡 Profissional | ❌ |
| **Brand Kit / Custom branding** | ✅ Scale+ | 🟡 Growth+ | ✅ | ✅ | ✅ Pro+ | 🟡 Pro+ | ✅ | ✅ Standard+ | 🟡 | ❌ | ✅ (themes) |

---

## 2. Top 5 features MUST-HAVE (presentes em TODOS os players globais)

Estas features aparecem em **Supademo + Arcade + Storylane + Navattic + Tango + Scribe** ou em ao menos 4 dos 5 grandes concorrentes globais — sinalizam a "tabela de complexidade mínima" do MVP.

1. **Captura de screenshot/print + chrome extension** — base de toda a categoria. Fluidz, Getdemo, GuiaFlow e Interdemo também têm.
2. **Editor de hotspots / tooltips** com highlight + simulated click no passo.
3. **Compartilhamento via link público + embed iframe**.
4. **Analytics básico** (views, completion rate, drop-off).
5. **Publicação permanente (URL com slug)** + algum tipo de Hub/Showcase.

> **Ou seja:** um MVP BR precisa, no mínimo: (extensão Chrome que tira print por clique) → editor de tour com highlight + click simulado → publish em link público → dashboard de "quantos viram e quantos terminaram". GuiaFlow já entrega (1)-(5) com MIT + R$0.

---

## 3. Top 5 features DIFERENCIAIS (só alguns têm)

1. **MCP server** com tools publicados (Supademo, Storylane, Navattic, Scribe, **GuiaFlow**). Quem não tem, perde a faixa de "AI agent-friendly". GuiaFlow é o **único open-source** com MCP nativo.
2. **AI Demo Agent autônomo (conversacional)** — Supademo (AI Demo Agent), Storylane (RepX), Navattic (Navattic Agents), Getdemo (SaaS Copilot). É a camada "AI vende por você".
3. **AI audit pré-publicação** (Supademo exclusivo).
4. **Sandbox demos (clone HTML com dados fictícios)** — só Storylane, Navattic, Supademo (Growth+). Custo alto, valor alto pra enterprise.
5. **Open-source + BYOK + export single-file HTML** — exclusivo do GuiaFlow hoje.

---

## 4. Gap Analysis: GuiaFlow (open source) vs Supademo

### O que o **GuiaFlow** (open-source) faz que o **Supademo** NÃO faz (ou faz pior):

| Capacidade | GuiaFlow | Supademo |
| --- | --- | --- |
| **Open source MIT** | ✅ | ❌ |
| **BYOK (sua chave OpenAI/Cartesia)** — privacidade/custo | ✅ | ❌ (só chave deles) |
| **Export single-file HTML navegável** | ✅ | ❌ |
| **Desktop Electron** com captura integrada (sem precisar de extension) | ✅ | 🟡 só via Mac/Win app |
| **Links permanentes grátis** (no Pro R$36/mês) | ✅ | 💰 Scale+ $38/mo |
| **MCP server + OpenAPI publicado** sem paywall (desde Free) | ✅ | 💰 Scale+ |
| **Strip persistente de analytics** (counts only) | ✅ Pro | 🟡 |
| **LGPD first-class + i18n pt/es/en** desde MVP | ✅ | ❌ |

### O que o **Supademo** faz que o **GuiaFlow** NÃO faz:

| Capacidade | Supademo | GuiaFlow |
| --- | --- | --- |
| **Captura HTML (clone front-end)** | ✅ Business+ | ❌ |
| **Sandbox demo (free-roam)** | ✅ Growth+ | ❌ |
| **AI Demo Agent autônomo** (rep AI 24/7) | ✅ | ❌ |
| **Mobile demos** | ✅ | ❌ |
| **Figma plugin oficial** | ✅ | ❌ |
| **Personalization (variables, branching, account ID)** | ✅ Scale+ | ❌ |
| **Showcase Collections + Route Hub** (roteamento lógico) | ✅ | ❌ |
| **Capture 6 formatos** (HTML, screenshot, mobile, Figma, video, sandbox) | ✅ | só screenshot+upload |
| **AI audit, voice cloning, AI video editing** | ✅ | ❌ |
| **Integrações CRM nativas (Salesforce, HubSpot, Marketo)** | ✅ | ❌ (só webhook)
| **Marca / confiança (200k+ pros, NetApp, Khan Academy)** | ✅ | ❌ |
| **G2 #5 fastest growing + G2 demo automation leader** | ✅ | ❌ |
| **Programa de testers + Pro testado** | ✅ | 🟡 beta |

### **Implicação para o Supademo BR MVP**

- **Tier 1 (MVP "lite")**: o que GuiaFlow entrega hoje (screenshot, hotspots, WhatsApp CTA, analytics básico, MCP, REST, OSS).
  - É replicável em ~6-10 semanas por 1 dev senior; barreira: **tráfego, marca, casos brasileiros**.
- **Tier 2 (paywall)**: Voice cloning, Account ID, AI audit, Personalization — onde Supademo ganha.
  - **Onde está a oportunidade BR**: capturar HTML + sandbox demo **sem precisar replicar a stack deles** → usar Puppeteer/Playwright headless em ambiente isolado.
- **Tier 3 (futuro)**: AI Demo Agent autônomo em PT-BR, com integração nativa Calendly/HubSpot BR/WhatsApp Business API.

---

## 5. Features que NENHUM dos players BR tem (oportunidade de mercado)

> Baseado em Getdemo + Interdemo + Fluidz + GuiaFlow (todos os players BR verificados).

### 5.1 **AI Demo Agent conversacional em PT-BR com WhatsApp Business API**
- Supademo/Storylane/Navattic têm AI Agent, mas **não abrem WhatsApp**: rodam só como widget web.
- **Oportunidade**: Agente que entende "me explica seu produto" em PT-BR e responde com demos interativas + leva o lead pra fechar no **WhatsApp Business** com Pix como próximo passo.
- **Por que ninguém fez**: combo "WhatsApp Business API oficial + LLM com function-calling + demo interativa" ainda não tem case maduro no BR.

### 5.2 **Capture HTML server-side com Playwright + idioma pt-BR only**
- Supademo/Storylane fazem HTML clone, mas são globais e cobram caro.
- **Oportunidade**: Oferecer captura HTML **incluída no Pro R$97/mês** (entre GuiaFlow R$36 e Supademo $38+), focada em SaaS BR de pequeno/médio porte.
- **Diferencial técnico**: usar Playwright em cluster próprio + storage em S3 + manifest JSON com imagens substitutas (não precisa de clone perfeito, mas responsivo).

### 5.3 **Demo Hub público "Made in Brazil" (Showcase aberto)**
- Storylane e Supademo têm Hubs privados.
- **Ninguém no BR tem um showcase público tipo Product Hunt-meets-demo** onde empresas BR publicam demos e ranqueiam por indústria (Edtech, Fintech, Retail, SaaS B2B).
- **SEO long-tail**: cada demo seria uma landing indexada.

### 5.4 **Integração nativa com Pix dinâmico + Checkout transparente**
- Nenhum player integra Pix dinâmico como "call-to-action final" no demo → lead termina o demo → gera Pix QR code pra pagar onboarding.
- **Por que ninguém fez**: regulação Pix dinâmico do Banco Central exige homologação específica; poucos SaaS BR estão dispostos a se credenciar.

### 5.5 **AI Voice Cloning em PT-BR com vozes "brasileiras"**
- Supademo Growth+ tem voice cloning, mas vozes são em inglês.
- **Oportunidade**: clonar vozes brasileiras conhecidas ou vozes neurais em PT-BR (ex.: integração com ElevenLabs/PlayHT voices BR, ou Cartesia com modelo TTS-BR).
- **Use case**: roteiros de demo narrados com voz PT-BR natural para treinamento de SDR.

### 5.6 **SCORM + LMS BR (Totvs LMS, Uoou, Demois**)
- Supademo exporta SCORM, mas **não cita LMS BR**.
- **Oportunidade**: pacote SCORM + integração nativa com LMS usados por TOTVS/Senior/Omie.

### 5.7 **"Demo Gratuita" como canal de marketing SEM**
- Getdemo, Interdemo, Fluidz têm cases bonitos mas zero programa de SEO/afiliados.
- **Oportunidade**: programa "Crie um demo público no subdomínio seu.empresa.guiaflow.br" → link indexado no Google → gera SEO orgânico pra empresas pequenas.

### 5.8 **Compliance prova: Certificação LGPD auditada + selo**
- Todos falam de LGPD, ninguém tem selo auditado por ANPD /Privacy Tools.
- **Oportunidade**: conduzir auditoria externa (ex.: Deciclo, Privally) e exibir selo público.

---

## 6. Pricing BR positioning table (referência out/2026)

| Player | Free | 1º Pago | Tier "completo" | Pagamento BR |
| --- | --- | --- | --- | --- |
| **GuiaFlow** | R$0 full-features | **R$36/mês** (R$359/ano) | R$36 (Pro) | Stripe (Pix OK) |
| **Getdemo** | Não | Sob consulta | Sob consulta (Pro = API+SSO) | Pix/Boleto/Cartão explícito |
| **Fluidz** | Trial 7d | **R$105,33/mês** (R$1.264/ano) | R$329/mês (Profissional) | Pix/Boleto/Cartão 12x |
| **Interdemo** | Não | Sob consulta | Sob consulta | Desconhecido |
| **Supademo** | $0 Free (5 demos) | $50/mo Scale ($38 annual) | $450/mo Growth | Cartão internacional |
| **Storylane** | Free Demo Suite | ~$50/mo | ~$625/mo Growth | Cartão |
| **Arcade** | Free (1 demo+1 vídeo) | $50/mo seat Growth | Custom Enterprise | Cartão |
| **Navattic** | Free Starter (1 demo) | Sob consulta Base | Custom Enterprise | Cartão |
| **Tango** | Free (10 users) | **$15/mo Pro Team** (anual) | Custom | Cartão |
| **Scribe** | Free Basic | $23/mo Pro Team (annual) | Custom Enterprise | Cartão |

> **Insight:** GuiaFlow é o **mais barato entre os pagos**, e o único com **preço público visível** entre os BR — todos os outros exigem contato. **Espaço claro para posicionar um Supademo BR entre R$99 e R$199/mês com feature parity Tier 2 (HTML capture, branching, AI text, lead capture, analytics).**

---

## 7. Resumo executivo (1 página)

- **Setor é validado**: 200k+ usuários pagantes só no Supademo, G2 Demo Automation tem 100+ vendors ranqueados.
- **Top 3 globais** (Supademo, Storylane, Navattic) brigam por AI capabilities (MCP, AI Demo Agents, AI Copilot) e captura HTML.
- **BR é fragmentado**: Getdemo é o líder de gabinete mas vende consultivamente; Interdemo/Fluidz são early; **GuiaFlow é open-source e já tem R$36/mês publicado** com MCP/OpenAPI.
- **Gap de mercado BR**: nenhum player BR combina (a) WhatsApp Business API + Pix dinâmico, (b) AI Demo Agent PT-BR com voz BR, (c) SCORM para LMS BR, (d) Capture HTML acessível.
- **Risco de construção**: a barreira técnica é baixa (GuiaFlow prova isso em MIT); a barreira real é **distribuição, marca e primeiros casos brasileiros**.

### Recomendação prática para o MVP do "Supademo BR":

1. **Stack base**: TypeScript/Next.js (como Fluidz) + plain JS para o player (como GuiaFlow), extensível a React.
2. **Tier 1 (MVP)**: clone do core do GuiaFlow com **Pagamento em Pix via Stripe**, **domínio .com.br**, **suporte em PT-BR**, **LGPD explícito**.
3. **Tier 2 (3–4 meses)**: HTML capture server-side (Playwright), branching, Account ID.
4. **Tier 3 (6–12 meses)**: AI Demo Agent em PT-BR com integração WhatsApp Business + Pix dinâmico.

**Fontes citadas neste SUMÁRIO (URLs primárias):**
- https://supademo.com, https://supademo.com/pricing, https://supademo.com/okf/index.md, https://docs.supademo.com, https://supademo.com/openapi.json, https://supademo.com/compare/guideflow-alternative
- https://www.arcade.software, https://www.arcade.software/pricing, https://app.arcade.software/auth (HTML)
- https://www.storylane.io, https://www.storylane.io/mcp
- https://www.navattic.com, https://www.navattic.com/pricing, https://www.navattic.com/compare/outgrow
- https://tango.us, https://tango.us/pricing
- https://scribehow.com, https://scribehow.com/pricing
- https://www.loom.com
- https://getdemo.com.br, https://www.getdemo.com.br/planos (Webflow HTML)
- https://interdemo.com.br (Vite/React SPA HTML)
- https://demos.fluidz.com.br, https://demos.fluidz.com.br/pricing (Next.js + Tailwind HTML)
- https://guiaflow.pro, https://guiaflow.pro/editor (vanilla JS HTML), https://guiaflow.pro/llms.txt, https://github.com/gugamistri/gflow
- Relatos secundários: G2 reviews agregados (https://www.g2.com/products/arcade-software-arcade/reviews, https://www.g2.com/compare/guideflow-2023-08-01-vs-supademo, https://www.g2.com/compare/guideflow-2023-08-01-vs-storylane), Reddit (r/nextjs sobre Arcade), levelupdemo.com (Storylane review), Gralio.ai (Supademo vs Guideflow compare), Hirelike insights (Arcade Pros and Cons).
