# GuiaFlow (guiaflow.pro) — PRINCIPAL RIVAL OPEN-SOURCE

- **URL:** https://guiaflow.pro (PT default) / https://guiaflow.pro/en
- **Editor:** https://guiaflow.pro/editor
- **Ajuda:** https://guiaflow.pro/ajuda
- **Integrações:** https://guiaflow.pro/integracoes
- **API & MCP guide:** https://guiaflow.pro/ajuda/api
- **OpenAPI:** https://app.guiaflow.pro/v1/openapi.json
- **MCP server:** https://app.guiaflow.pro/mcp (Streamable HTTP, OAuth 2.1 + PKCE + DCR + CIMD)
- **GitHub:** https://github.com/gugamistri/gflow (open source sob MIT license)
- **Product Hunt:** https://www.producthunt.com/products/guiaflow (Featured)
- **Smithery badge:** listed em https://smithery.ai/servers/gmistrinelli/guiaflow
- **Stars/Forks:** 31 ⭐ / 11 forks (out/2026) — 156 commits.

## Modelo de negócio
**Open-core**: editor + player + desktop app (Electron) + Chrome extension **100% grátis e MIT** forever. Moneta via **GuiaFlow Pro** (R$36/mês ou R$359/ano), que libera links permanentes, IA/TTS hosted, analytics, lead capture, embed sem brand e accesso ao MCP server.

### Planos
| Plano | Preço | Highlights |
| --- | --- | --- |
| **Grátis** | R$0 | Editor completo no browser; projetos salvos no browser; links temporários 7d; CTA WhatsApp ou link; BYOK para IA/TTS (OpenRouter/OpenAI/custom ou Cartesia); sem conta |
| **Pro** | R$36/mês ou **R$359/ano** (2 meses grátis) | Tudo do Grátis + links permanentes com cover/preview; lead capture; embed; **analytics**; IA/TTS inclusa; projetos guardados na conta; vídeo export sem marca; **MCP server** |

Pagamento via Stripe; cancele quando quiser. Tem um **Programa de Testers** onde usuários ganham Pro grátis em troca de feedback.

## Identidade visual (IDE)
- Logo **deep teal** (`#1A4D6D`) como primary. Modo claro "documento" e modo escuro "social" — toggle.
- Logo: "GuiaFlow" wordmark minúscula + simbolo SVG simples (`/brand/symbol-simple.svg`).
- Site é bem "minimal indie" — chama a si mesmo "código aberto (MIT)" como diferencial. Tom: dev-friendly, técnico, mas com UX clara.
- Tipografia: Inter.
- Feedback via Tally.so embedado no editor.

## Funcionalidades

### 1. Captura
- **Extensão Chrome** ("GuiaFlow — Captura") em Chrome Web Store.
- **Desktop app (Electron)** — built-in capture window (Chromium dentro do Electron captura a página sem precisar de extension).
- **BYOK (Bring Your Own Key)** para AI text (OpenRouter, OpenAI ou custom OpenAI-compatible base URL) e voice (Cartesia). Keys ficam só no browser (IndexedDB) — request sai do browser direto para o provider.

### 2. Editor
- Hosted em `editor.html` com **vanilla JS modular** (estilo "small web" tradicional).
- Hotspot (highlight) + simulated click.
- Step text + step audio.
- **Scenes** — agrupamento de steps.
- **Themes e fonts** customizáveis.
- **Start step** — captura lead (name/email/phone, LGPD).
- **End step** — CTA WhatsApp (em formato E.164, ex: +5511999998888) ou link.

### 3. Player
- **Single-file HTML navegável** exportável (1 arquivo .html).
- **MP4 export** via WebCodecs (`vendor/mp4-muxer`), fallback para `MediaRecorder` (WebM).
- **Links temporários `/v/...`** válidos por 7 dias.
- **Links permanentes** via Plano Pro (Ex: `https://guiaflow.pro/p/{slug}`).
- Embed iframe.
- Custom cover image (og:image) para preview em WhatsApp/LinkedIn.

### 4. AI
- `generate_step_text` — escreve título/descrição olhando o screenshot.
- `generate_narration` — salva MP3 mono 64 kbps da narração do step.
- Limites mensais no Pro: **100 texts + 30 minutos de áudio**.

### 5. **MCP server + REST API**
- **REST base:** `https://app.guiaflow.pro/v1`
- **OpenAPI 3.1 publicado** em `/v1/openapi.json`.
- Auth: OAuth 2.1 com PKCE, dynamic client registration, Client ID Metadata Documents.
- API key alternativo: `gf_live_...` via menu.
- Scopes: `tours:read`, `tours:write`, `publish`, `ai`, `analytics:read`.
- Suporta Idempotency-Key em POSTs.
- Listing em **smithery.ai** (`gmistrinelli/guiaflow`).
- Tools: `create_tour`, `upload_media`, `add_step`, `set_theme`, `set_lead_capture`, `set_end_cta`, `generate_step_text`, `generate_narration`, `publish`, `get_analytics`, `list_tours`, etc.

### 6. Analytics (Pro)
- views, completions, CTA clicks, leads count, daily series, per-step funnel.
- Apenas "counts" (não privacidade-invasiva).

### 7. Compliance & LGPD
- Compliance LGPD explícita: "LGPD (Lei Geral de Proteção de Dados)".
- BYOK significa que a chave OpenAI fica no seu browser — o provider processa imagens diretamente.
- GDPR explícito no FAQ.

### 8. UI multilíngue
- PT, ES, EN com i18n nativo no editor e na extensão.

## Diferenciais (decisivos vs Supademo e rivais)

1. **Open source MIT** — único grande player a ter código aberto. Trust & lock-in zero.
2. **BYOK-first** — usuário controla sua chave OpenAI/Cartesia. Margem de privacidade/custo.
3. **MCP server nativo** + **OpenAPI 3.1 publicado** — equivale ao Supademo MCP, só que open.
4. **Export single-file HTML** navegável — único player BR que dá o tour inteiro num .html estático.
5. **Desktop Electron** independente de extension — captura qualquer app.
6. **LGPD-first** — explicitamente declarado desde v1.
7. **R$36/mês** — preço mais baixo entre Premium dos players.
8. **Stack minimal** — sem build pipeline pesado, dev-friendly.

## Pontos fracos
- 31 ⭐ e 11 forks no GitHub (out/2026) → comunidade ainda pequena vs Loom (millions of users).
- Sem captura HTML (só screenshot). Sem Sandbox.
- Sem AI Demo Agent autônomo tipo RepX.
- Sem embed via showcase collection; cada demo = 1 link.
- Sem MCP para Salesforce/HubSpot nativo (a integração seria via webhook).
- Analytics básicas (counts apenas).
- Sem suporte corporativo (single founder = Gugamistri).
- Sem app mobile / mobile capture.

## Stack detectável
- **Marketing** (site `index.html`): vanilla HTML + JS, i18n próprio em `/locale-src/`. Plain CSS + SVG. Hospedado Vercel (`vercel.json`, redirect antigo `guiaflow-seven.vercel.app`). Tally.so embed para feedback.
- **Editor (editor.html)**: vanilla JS modular (sem React/Vue), com **driver.js** (`vendor/driver/driver.js`) para onboarding UX, **mp4-muxer** para export MP4, **Tally.so widget** para NPS interno.
- **Desktop:** **Electron** (Chromium + Node) — built-in `Capturar` window.
- **API/MCP:** OpenAPI 3.1; backend autenticado via OAuth 2.1 (escalável com PKCE + DCR).
- **Storage:** Browser IndexedDB (BYOK) + cloud no plano Pro (Vercel Blob).
- **Tokens/limits:** 60 req/min/key; 600 writes + 30 publishes/hora/conta.

## Casos públicos
- Featured Product Hunt badge.
- Programa de testers ativo no formulário de Pro.
- Conta anônima Studio de demo exemplo: "Fluidz/exemplo" (cliente BR).
