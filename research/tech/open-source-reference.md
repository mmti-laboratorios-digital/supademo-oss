# Referências open-source — concorrentes e bibliotecas reusáveis

> Levantamento de projetos open-source que podemos estudar (clones Supademo) e bibliotecas que podemos reutilizar (tour, overlay, embed).

---

## 1. Projetos de interactive demo SaaS open-source

### 1.1 GuideFlow (o "concorrente open-source" do Supademo)

#### 1.1.1 Dois projetos com nome parecido

Atenção: existem **dois projetos** diferentes com nomes parecidos:

| Projeto | URL | Tipo | Stack | Status |
|---------|-----|------|-------|--------|
| **GuideFlow.js** (RealNerdZW) | <https://github.com/RealNerdZW/GuideFlow> | Biblioteca JS pura (não SaaS) | TypeScript, Turborepo monorepo, ~10 packages | Open source, MIT |
| **GuideFlow Local Step Recorder** (SubwatG) | <https://github.com/SubwatG/GuideFlow> | Extensão Chrome local + standalone viewer | MV3, vanilla JS | Open source, MIT |
| Guideflow.com (empresa) | <https://guideflow.com> | SaaS comercial | Privado | NÃO open source |

#### 1.1.2 GuideFlow.js (biblioteca)

Documentação: <https://www.npmjs.com/package/@guideflow/core>

**O que é:** framework-agnostic product tour library com FSM engine, AI integration, analytics, A/B testing.

**Pacotes:**

| Package | Tamanho (gzip) | Função |
|---------|----------------|--------|
| `@guideflow/core` | 15.13 KB | FSM engine + spotlight + persistence + i18n |
| `@guideflow/react` | — | `TourProvider`, `useTour`, `useTourStep`, `useHotspot`, `TourStep`, `GuidePopover` |
| `@guideflow/vue` | — | Plugin para Vue |
| `@guideflow/svelte` | — | Stores para Svelte |
| `@guideflow/ai` | — | GuideBrain (OpenAI/Anthropic/Ollama providers) |
| `@guideflow/analytics` | — | `AnalyticsCollector`, transport adapters, `ExperimentEngine` |
| `@guideflow/checklist` | — | Docked checklist widget |
| `@guideflow/banner` | — | Announcement banners |
| `@guideflow/survey` | — | NPS/CSAT surveys |
| `@guideflow/mcp` | — | MCP server para AI agents |
| `@guideflow/cli` | — | init, export, validate commands |
| `@guideflow/devtools` | — | Browser extension MV3 |

**Arquitetura (monorepo):**

```
GuideFlow/
├── apps/         # exemplos / docs / playground
├── packages/
│   ├── core/     # FSM puro, framework-agnostic
│   ├── react/
│   ├── vue/
│   ├── svelte/
│   ├── ai/
│   ├── analytics/
│   ├── checklist/
│   ├── banner/
│   ├── survey/
│   ├── mcp/
│   ├── cli/
│   └── devtools/
├── scripts/
├── turbo.json    # Turborepo build
└── pnpm-workspace.yaml
```

**O que podemos aprender/inspirar:**
1. **FSM core framework-agnostic** é o padrão certo — primeiro codifica o state machine, depois adiciona bindings por framework.
2. **Tamanho agressivo** do core (15 KB) — gzip+budget via `size-limit`.
3. **Separação `@guideflow/analytics` como transport adapter** — bom pattern para enviar eventos para nosso analytics stack sem acoplar.
4. **MCP server** para AI agents — visionário, mas útil no contexto de AI agents editando demos.
5. **Devtools como extension MV3** — confirma nossa abordagem.

**Limitação:** é biblioteca de **product tour** (overlay no DOM real), não **demo interativo standalone** (player iframe). Modelos diferentes.

#### 1.1.3 GuideFlow Local Step Recorder (extensão)

URL: <https://github.com/SubwatG/GuideFlow>

**Funcionalidades:**
- Detecta cliques, inputs via DOM events.
- Captura viewport via Chrome extension APIs.
- 3 modos de captura: Visible Part / Full Page / Selected Area.
- Exporta HTML standalone portátil.
- Tudo local no browser (sem servidor).

**Arquitetura:**

```
guide-flow/
├── extension/             # MV3
│   ├── manifest.json
│   ├── background.js      # service worker + tab capture
│   ├── content.js         # DOM click listener + bounding box
│   ├── popup.html / .js   # UI control
│   ├── viewer.html / .js  # interactive editor + viewer
│   └── icons/
├── viewer/                # standalone demo template
│   └── demo-guide-standalone.html
├── LICENSE                # MIT
└── README.md
```

**O que podemos aprender:**
- Arquitetura mínima MV3 viável (background + content + popup + viewer).
- Workflow de captura com 3 modos (visible, full-page, selected area) é exatamente o que precisamos.
- Editor standalone (viewer.html) — sem servidor para preview rápido.

**Limitação:** é client-side only. Não tem SaaS, multi-tenant, analytics, billing. Para nosso caso serve como **referência de arquitetura da extensão**.

### 1.2 Spotlane (outro open-source interessante)

URL: <https://github.com/headlessButSmart/spotlane>

Interactive demo builder + React player com JSON export.

**O que ele faz:**
- Editor web para criar demos a partir de screenshots.
- Hotspots com coordenadas fracionárias (x, y, w, h entre 0-1).
- Exporta demo como JSON puro (sem vendor lock-in).
- Player React consome JSON via fetch.
- **Stack:** React + Vite, sem backend próprio.

**Formato JSON do Spotlane (referência para nosso schema):**

```json
{
  "screens": [
    {
      "id": "screen-uuid-1",
      "image": "https://cdn.example/s1.png",
      "description": "Optional markdown",
      "hotspots": [
        {
          "x": 0.42, "y": 0.31,
          "width": 0.022, "height": 0.022,
          "shape": "circle",
          "label": "Click here",
          "description": "Opens settings",
          "targetScreenId": "screen-uuid-2",
          "color": "#7c6af7",
          "rippleScale": 2.6
        }
      ]
    }
  ]
}
```

**Pontos fortes:**
- Coordenadas fracionárias (responsivo automático).
- Plugin-free — JSON puro, hospeda onde quiser.
- Player React mínimo.

**Limitação:** sem backend, sem multi-tenant, sem editor para captura automática. Mas **excelente referência para o formato JSON e para o player**.

---

## 2. Storylane / Navattic / Supademo — código fechado

Os três grandes SaaS comerciais **não são open source**. Mas têm blogs de engenharia que podemos minerar:

### 2.1 Storylane
- Site: <https://www.storylane.io>
- Docs: <https://docs.storylane.io>
- Blog: <https://www.storylane.io/blog/arcade-alternatives>
- **Stack inferida:** Next.js + Postgres + S3 (via job postings e engenharia reversa leve do player).

### 2.2 Navattic
- Site: <https://www.navattic.com>
- Docs: <https://docs.navattic.com>
- Sponsor gold do rrweb (logo na home do rrweb.io).
- **Stack inferida:** React + Node + Postgres + CDN. Foco em HTML capture (sandbox).
- **Dica de produto:** mantêm modelo "demo center" + branching + lead capture.

### 2.3 Supademo
- Site: <https://supademo.com>
- About: <https://supademo.com/about> (fundadores ex-startup, fundaram 2023).
- Blog: <https://supademo.com/blog>
- Chrome Web Store: <https://chromewebstore.google.com/detail/supademo-ai-interactive-d/jblbcpkejogbghfdglhfjlplchcnmohm>
- **Features notáveis:** AI voiceover (ElevenLabs), AI translation, AI Command, chapters, autoplay, sandbox demos.
- **Stack inferida:** Next.js + Postgres + S3 + ElevenLabs API.

### 2.4 Arcade
- Site: <https://www.arcade.software>
- **Features:** step screenshots + interactive demos + HTML capture em planos superiores.
- **Stack inferida:** Next.js + Postgres + CDN.

**Nenhum tem blog técnico profundo**, então engenharia reversa leve pelos embeds públicos + reviews em G2/Capterra são as fontes.

---

## 3. Bibliotecas reusáveis

### 3.1 `rrweb` — sessão/replay JS

URL: <https://www.rrweb.io/> | Repo: <https://github.com/rrweb-io/rrweb>

**Função:** grava DOM mutations e eventos, depois reproduz em qualquer browser. 19.8k stars.

**Por que reusar:**
- Já maduro, patrocinado por Sentry, PostHog, Mixpanel, Pendo, Highlight.
- Players oficiais: `@rrweb/replay`, `rrweb-player`.
- ~10 KB/min de tamanho típico.
- **Quem usa:** Navattic (gold sponsor), PostHog (replays), Sentry, birdeatsbug (plataforma de demos), Smartlook.

**Como usaríamos:**
- Modo "Sandbox Live" no editor: gravamos sessão do criador enquanto ele navega no produto dele → geramos demo interativo **diferente** do screenshot (mais dinâmico).
- Player público servindo `@rrweb/replay` dentro de iframe sandbox.

**Pacotes npm:**
- `@rrweb/record` `^2.0.0` (~80 KB)
- `@rrweb/replay` `^2.0.0` (~60 KB)
- `rrweb-player` `^2.0.0` (~80 KB com UI)
- `@rrweb/all` `^2.0.0` (ambos)

**Docs:** <https://rrweb.io/docs/recipes>

### 3.2 `react-joyride` — tour library React

URL: <https://react-joyride.com/>

**Função:** overlay tooltips passo-a-passo sobre sua própria app.

**Tamanho:** ~30 KB gzip. MIT. v3 (mar 2026) com hooks + TS first-class + Floating UI.

**Quando usaríamos:**
- **Tour no nosso próprio editor** (admin): "Aqui você adiciona hotspots, aqui você publica, aqui você vê analytics".
- **Tour no embed do cliente** se o demo tiver onboarding dentro do player.

**Quando NÃO usaríamos:**
- Como base do player público (overlay na própria app é diferente de iframe standalone).
- Para demos interativos de produto de terceiro.

**Source:** <https://github.com/gilbarbara/react-joyride>

### 3.3 `driver.js` — tour library vanilla

URL: <https://driverjs.com/>

**Função:** similar ao Joyride, mas vanilla JS. MIT, ~5 KB.

**Tamanho:** 156 KB unpacked (~5 KB gzip). MIT. Sem dependências.

**Quando usaríamos:**
- Tour **dentro do iframe** do player público (se quizermos adicionar walkthrough do próprio demo).
- Lightweight alternative a Joyride se não precisarmos de hooks React.

**Source:** <https://github.com/nilbuild/driver.js>

### 3.4 `intro.js` e `shepherd.js` — ⚠️ evitar por licença

| Lib | Licença | Issue |
|-----|---------|-------|
| `intro.js` | AGPL-3.0 + commercial | **AGPL é viral** — usar em SaaS comercial é legalmente arriscado |
| `shepherd.js` | AGPL-3.0 + commercial ($19 one-time) | Mesmo problema |

**Recomendação:** **NÃO usar** em produto comercial. AGPL exige que TODO o seu app seja GPL se você distribuir (em SaaS não é tão agudo, mas ainda é ambiguidade jurídica). Prefira react-joyride ou driver.js.

**Fonte comparativo:** <https://inlinemanual.com/blog/driverjs-vs-introjs-vs-shepherdjs-vs-reactour>

### 3.5 `@floating-ui/dom` — posicionamento

URL: <https://floating-ui.com/>

**Função:** posicionar tooltips, popovers, dropdowns em relação a um anchor. **Biblioteca fundamental** para o nosso player.

**Por que reusar:**
- MIT, ~12 KB gzip, framework-agnostic.
- Mantida por Radix UI team.
- Usada por Radix UI, Floating UI, Headless UI, react-joyride v3.

**Onde usaríamos:**
- Posicionar tooltip do hotspot acima/abaixo/lado do alvo.
- Posicionar caption do passo.
- Posicionar lead capture form.

**Versão:** `@floating-ui/dom` `^1.6.0`

### 3.6 `framer-motion` — animações

URL: <https://www.framer.com/motion/>

**Função:** animações declarativas em React. Step transitions, hover, layout.

**Tamanho:** ~15 KB gzip (tree-shakeable).

**Onde usaríamos:**
- Transição entre passos do player (slide, fade, zoom).
- Ripple animation dos hotspots.
- Hover/active feedback.

**Versão:** `framer-motion` `^11.0.0`

### 3.7 `Remotion` — vídeos programáticos

URL: <https://www.remotion.dev/>

**Função:** renderiza vídeos MP4 a partir de componentes React (headless Chrome).

**Onde usaríamos:**
- Exportar demo como vídeo MP4 (compartilhar em redes sociais, YouTube).
- Marketing video generator (AI gera copy + Remotion renderiza).
- Preview em GIF para thumbnail.

**Versão:** `remotion` `^4.0.0`, `@remotion/cli` `^4.0.0`, `@remotion/renderer` `^4.0.0`.

**Custo:** render leva ~3-4s para 30s de vídeo 1080x1920. Em VPS nosso: ok.

### 3.8 `tesseract.js` — OCR no browser/Node

URL: <https://github.com/naptha/tesseract.js>

**Função:** extrair texto de imagens. Usar para detectar PII em screenshots.

**Onde usaríamos:**
- Job graphile-worker `redact_sensitive_fields` no backend.
- Identifica CPF, CNPJ, cartão de crédito, email via regex nos blocos OCR.

**Versão:** `tesseract.js` `^5.1.0` (Node).

**Custo:** ~500ms por imagem em VPS 8GB. Aceitável.

### 3.9 `sharp` — processamento de imagem

URL: <https://sharp.pixelplumbing.com/>

**Função:** redimensionar, converter, composite imagens em Node.

**Onde usaríamos:**
- Thumbnail generation de cada step (200x125 para grid).
- Conversão PNG → WebP/AVIF.
- Aplicar blur overlay sobre regiões detectadas pelo OCR.

**Versão:** `sharp` `^0.33.0`

### 3.10 `shadcn/ui` — componentes React

URL: <https://ui.shadcn.com/>

**Função:** coleção de componentes acessíveis (Radix + Tailwind). Copie e customize.

**Onde usaríamos:**
- Admin dashboard (botões, modais, tabelas, forms).
- Pricing page (cards, badges).
- Player controls (toolbar, popovers).

**Versão:** CLI `npx shadcn@latest init`

---

## 4. Outros projetos menores que valem leitura

| Projeto | URL | Relevância |
|---------|-----|-----------|
| `Onborda` | <https://github.com/onborda/onborda> | Next.js App Router tour (~8 KB + Framer Motion). Boa referência |
| `reactour` | <https://github.com/elrumordelaluz/reactour> | Tour React stateful, MIT, ~12 KB |
| `shepard.js` | (já coberto — AGPL, evitar) | — |
| `Guide.js` | <https://guidejs.com/> | Tour MIT, ~8 KB |
| `intro.js` | (já coberto — AGPL) | — |
| `Spotlane` | <https://github.com/headlessButSmart/spotlane> | Editor + JSON + player — referência de schema |

---

## 5. Bibliotecas de analytics / session replay

| Lib | Função | Custo |
|-----|--------|-------|
| `posthog-js` | SDK PostHog web | Free até 1M eventos |
| `rrweb` | Session replay | OSS (já coberto) |
| `sentry/nextjs` | Error tracking | Free até 5k errors/mês |
| `openreplay` | Session replay OSS | Alternativa rrweb |

Para nosso projeto, vamos com PostHog (analytics + replay) + Sentry (errors).

---

## 6. Resumo — o que adotar vs estudar

### 6.1 Adotar (bibliotecas testadas)

| Lib | Versão | Função |
|-----|--------|--------|
| `@rrweb/record` + `@rrweb/replay` | `^2.0.0` | Modo sandbox/replay (Fase 2) |
| `@floating-ui/dom` | `^1.6.0` | Posicionar tooltips/popovers |
| `framer-motion` | `^11.0.0` | Animações de transição |
| `remotion` | `^4.0.0` | Render de vídeo (Fase 2) |
| `tesseract.js` | `^5.1.0` | OCR backend (redaction) |
| `sharp` | `^0.33.0` | Imagem processing |
| `shadcn/ui` | latest | Componentes admin |

### 6.2 Estudar (referências de design)

| Projeto | O que aprender |
|---------|----------------|
| **GuideFlow.js** | FSM core framework-agnostic, monorepo com `@guideflow/*` packages, MCP integration |
| **SubwatG/GuideFlow** | Arquitetura mínima da extensão MV3 (background + content + popup + viewer) |
| **Spotlane** | Schema JSON do demo, coordenadas fracionárias, player React standalone |
| **rrweb docs/recipes** | Como modelar eventos de replay |

### 6.3 NÃO adotar

| Lib | Razão |
|-----|-------|
| `intro.js` | AGPL-3.0 (risco jurídico) |
| `shepherd.js` | AGPL-3.0 + paid |
| Navattic, Storylane, Supademo, Arcade | Código fechado, só referência de produto |

---

## 7. Estimativa de complexidade

| Tarefa | tamanho |
|---------|---------|
| Setup monorepo (Turborepo + pnpm) | S |
| Portar `@guideflow/core` (FSM) como `@easydemo/core` | M |
| Implementar `@easydemo/player` baseado em Spotlane | M |
| Implementar `@easydemo/editor` (extensão MV3) baseado em SubwatG/GuideFlow | M |
| Render de vídeo via Remotion (Fase 2) | L |
| OCR pipeline com Tesseract.js | M |
| Sandbox mode com rrweb (Fase 2) | L |

---

## 8. Referências

- GuideFlow.js (RealNerdZW): <https://github.com/RealNerdZW/GuideFlow>
- GuideFlow Local Step Recorder (SubwatG): <https://github.com/SubwatG/GuideFlow>
- Guideflow.com (SaaS): <https://guideflow.com>
- Spotlane: <https://github.com/headlessButSmart/spotlane>
- rrweb: <https://www.rrweb.io/> | <https://github.com/rrweb-io/rrweb>
- React Joyride: <https://react-joyride.com/> | <https://github.com/gilbarbara/react-joyride>
- driver.js: <https://driverjs.com/> | <https://github.com/nilbuild/driver.js>
- intro.js: <https://introjs.com/>
- Shepherd.js: <https://shepherdjs.dev/>
- Onborda: <https://github.com/onborda/onborda>
- reactour: <https://github.com/elrumordelaluz/reactour>
- Floating UI: <https://floating-ui.com/>
- Framer Motion: <https://www.framer.com/motion/>
- Remotion: <https://www.remotion.dev/>
- Tesseract.js: <https://github.com/naptha/tesseract.js>
- Sharp: <https://sharp.pixelplumbing.com/>
- shadcn/ui: <https://ui.shadcn.com/>
- Tour library showdown 2026: <https://merge.rocks/resources/websites-playbook/react-ux-patterns/react-tour-library-comparison-react-joyride-vs-shepherd-vs-intro-js>
- Driver.js vs Intro.js vs Shepherd.js vs Reactour: <https://inlinemanual.com/blog/driverjs-vs-introjs-vs-shepherdjs-vs-reactour>
- Guide.js alternatives: <https://guidejs.com/alternatives>