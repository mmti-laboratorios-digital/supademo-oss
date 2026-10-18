# Supademo — Alvo de Clonagem

- **URL oficial:** https://supademo.com
- **Preço público:** https://supademo.com/pricing
- **Documentação:** https://docs.supademo.com
- **OpenAPI:** https://supademo.com/openapi.json / https://supademo.com/openapi.yaml
- **Base API:** `https://app.supademo.com` (auth via `Authorization: Bearer <workspace_api_key>`)
- **MCP Server:** https://mcp.supademo.com/mcp (Streamable HTTP, OAuth 2.1)
- **Extensão Chrome:** https://chromewebstore.google.com/detail/supademo-ai-interactive-d/jblbcpkejogbghfdglhfjlplchcnmohm
- **Categorias G2:** "Demo Automation" — Líder por 3+ trimestres consecutivos; G2 "#5 fastest-growing software product of 2025" entre 125.000+ produtos.
- **Fundadores:** Joseph Lee & Koushik Marka (fundada em 2023)
- **Quote:** "Used by 200,000+ professionals" e conta cases com NetApp, WeWork, Plaid, Siemens, Lightspeed, beehiiv, Khan Academy, VRIFY, Bullhorn

## Modelo de negócio
SaaS B2B por **creator seats** (quantos editores), com **views/viewers ilimitados em todos os planos** (inclusive Free). Opcionalmente, vende créditos avulsos para o AI Demo Agent (uso variável). Enterprise (custom a partir de 10 creators). AI Demo Agent é add-on usage-based em todos os planos pagos.

### Planos e preços (USD)
| Plano | Mensal | Anual/mês | Seats | Pontos chave |
| --- | ---: | ---: | --- | --- |
| Free | $0 | $0 | 1 creator | 5 demos, 50 vídeos 4K, unlimited views, sem AI |
| Scale | $50 | $38 | por creator | Ilimitado, AI, MCP, branching, analytics |
| Business | $249 | $199 | 1 + extras $50/mo | HTML capture, AI data editing, priority support |
| Growth | $450 | $350 | 5 creators + $50 extras | Sandbox, Route Hub, voice cloning, versioning |
| Enterprise | custom | custom | 10+ creators | SSO SAML, custom data residency, SOC 2 Type II |

AI Demo Agent: 1.500 créditos grátis (~75 calls). Pacotes: $99/1.4k, $299/5.5k (recomendado), $500/12.5k credits. ~20 credits = 1 call de 15min (~$0.80–$1.41 por call).

## Identidade visual (IDE)
- Logo minimal "Supademo" — wordmark preta/branca, símbolo "↗" usado isoladamente.
- Tipografia: clean sans-serif moderna. Laranja/preto como cores primárias com tons neutros.
- **G2:** 4.7/5 (≈647 reviews). Citações: "interactive, branching demos quickly" / "polished, clickable workflow".
- **Críticas concorrentes:** According to YouTube/Reddit/G2 FAQ, a captura HTML falha em alguns apps React/Next (cf. r/nextjs) e há limite no número de demos no plano free.

## Funcionalidades (5 grupos)

### 1. Máquina de Captura (Demo Recorder)
- **Chrome Extension** com um clique. Captura cliques + ações e adiciona descrição automática a cada step.
- **Guided HTML demos** (clone front-end) — Business+ ($199/mo).
- **Guided screenshot/video demos** — Free / Scale.
- **Sandbox Demo Environments** — pixel-perfect, no-code; Growth ($350/mo).
- **Mobile Demos** — touch-friendly, tap-by-tap.
- **Figma Integration** — plugin oficial para converter protótipos em demos.
- **Loom → interactive demo** — converte gravação em demo clicável via AI Command.

### 2. Editor
- Anotações: tooltips, hotspots, callouts, zoom.
- **Branching & variables** — rotas condicionais a partir de respostas.
- **Personalization** — texto, logos, dados por conta.
- **AI Command** — edição em massa de voiceover, tradução, copy, dados. Requer aprovação humana.
- **Mobile / desktop / browser** (apps Mac e Windows).

### 3. Player
- Screen recorder 4K, webcam, zoom automático, cursor customizado.
- Embed via iframe / link / Showcase Collections / Route Hub.
- Programmatic in-app trigger (`window.Supademo`).
- Templates gamificados ("In-App Demo Hub" launcher).

### 4. Analytics
- Engagement por step, drop-off, completion rate.
- Tracking links / UTM.
- Integração Salesforce (sync to opportunity), HubSpot (contact record), Marketo (campaign report), Slack (alerts), Seismic, Zapier, Webhooks, Google Analytics, GTM, Intercom, Calendly.

### 5. AI (diferencial competitivo)
- **Supademo AI Command** — agente in-app que edita demos em massa, traduz, gera voz, responde perguntas analíticas.
- **Supademo MCP server** — expõe 80+ ações para ChatGPT, Claude, Gemini, Grok, Copilot, Cursor via OAuth. Inclui 23 SKILL.md files.
- **AI Demo Agents** — agentes autônomos 24/7 que qualificam e exibem demos a prospects; voice + text; 50+ idiomas.
- **AI audit** — scoring da demo antes de publicar.
- **Voice cloning**, AI data editing (Business+), AI video editing.

## Diferenciais (vs clones BR + globais)
1. **MCP / SKILL.md público** — único grande player com tools de agente documentadas e o Auth OAuth pronto para conectar Claude/ChatGPT/Cursor na criação de demos.
2. **Capture ANYFLOW**: HTML, screenshot, video, Figma, mobile, sandbox (6 formatos).
3. **AI audit** pré-publicação — não só "AI generating copy".
4. **In-app Product tours** trigger programaticamente via JS SDK.
5. **AI Demo Agents** com créditos avulsos (entrada barata de US$99).
6. **Showcase Collections + Route Hub** — roteamento lógico do "qual demo entregar" baseado em perguntas/respostas.

## Stack detectável
- **Frontend (marketing):** Next.js (renders .md via `Accept: text/markdown` ou `?foo.md`).  
  Fontes: URLs `/_next/static/...`; agente `.well-known/oauth-protected-resource`.
- **App principal (`app.supademo.com`):** SPA React + Vercel (referência aos `?dpl=` Dynamic Parts Loader tokens).
- **Chrome Extension:** Manifest V3, captura via Event Listener de input/click + DOM snapshots.
- **MCP:** Streamable HTTP transport, OAuth 2.1.

## Pontos fracos / reclamações recorrentes
- Plano Free é limitado a **5 demos ativas**; AI e MCP são pagos.
- Quando o produto capturado atualiza, **demos HTML podem quebrar** ("doesn't break when your product updates" é diferencial vendido por eles mesmos).
- Fricção em apps React/Next com custom routing ou hydration pesada (cf. Reddit r/nextjs thread).
- Preços sobem rápido entre tiers (Scale → Business → Growth → Enterprise).
- Brasil sem suporte dedicado, sem Pix, sem nota fiscal visível no checkout, LGPD compliance self-declarada.

## Demos públicas notáveis
- https://supademo.com/showcase
- https://supademo.com/demo-library
- Live training: https://supademo.com/product-demo/live-training
- Academy: https://supademo.com/academy
