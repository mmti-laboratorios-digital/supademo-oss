# Player público — demos interativas passo a passo

> Pesquisa sobre como construir o **player JS** que renderiza os demos gravados pela extensão no navegador do visitante (lead, prospect, usuário final). Embed em qualquer site do cliente via `<script>` ou `<iframe>`.

---

## 1. Como Storylane / Navattic / Supademo constroem o player

Baseado em engenharia reversa leve (inspeção de DOM dos embeds públicos) e na comparação de Arcade Alternatives 2026 (<https://www.storylane.io/blog/arcade-alternatives>):

### 1.1 Anatomia comum

Todos os 3 players compartilham estes blocos:

1. **`<iframe sandbox>`** que carrega o player — isolado do site host por segurança.
2. **Lista de passos** (array JSON) com `{ image_url, hotspots, captions, transition }`.
3. **Imagem estática** como background (PNG/WebP) servida via CDN.
4. **Hotspots** posicionados com `position: absolute` em **coordenadas fracionárias** (`x`, `y`, `width`, `height` todos entre 0-1) — isso garante responsividade sem recálculo.
5. **Tooltip/modal** que aparece ao clicar no hotspot, com HTML customizado.
6. **State machine** interna: `intro → step1 → step2 → ... → outro ramo via branch`.
7. **Barra de progresso** e botões `Next / Back / Skip`.
8. **Listener de eventos** que dispara `postMessage` para a página host (analytics cross-domain).
9. **Theming CSS variables** (cores, fontes, border-radius) injetadas via props do embed.

### 1.2 Diferenças

| Player | Estilo dominante | Diferencial técnico |
|--------|------------------|---------------------|
| **Storylane** | Screenshots com hotspots, mais recente com HTML | Engine robusta de branching/variáveis |
| **Navattic** | HTML/CSS clonado (sandbox) | Comentários/colaboração, Recapture |
| **Supademo** | Screenshots + sandbox opcional | AI voiceovers, chapters |
| **Arcade** | Screenshots + video curto | UI mais polida para PLG marketing |

---

## 2. Estratégias de renderização

### 2.1 Screenshots + hotspots em coordenadas fracionárias — **RECOMENDADO para MVP**

**Arquivo JSON de demo (formato sugerido):**

```json
{
  "id": "demo_abc123",
  "title": "Onboarding do CRM",
  "version": 1,
  "theme": {
    "primary": "#7c6af7",
    "font": "Inter",
    "borderRadius": 12
  },
  "steps": [
    {
      "id": "s1",
      "image": "https://cdn.demo.br/demos/abc123/s1.webp",
      "width": 1280,
      "height": 800,
      "caption": "Clique em Novo Lead",
      "tooltip": { "title": "Aqui", "body": "Cria um lead novo" },
      "hotspots": [
        {
          "x": 0.42, "y": 0.31,
          "width": 0.022, "height": 0.022,
          "shape": "circle",
          "label": "Novo lead",
          "targetStepId": "s2",
          "ripple": true
        }
      ],
      "branches": [],
      "advance": { "on": "click" }
    }
  ],
  "branding": { "logo": "..." }
}
```

**Vantagens:**
- Player = React component pequeno (~20 KB gzip).
- CDN serve WebP/AVIF.
- Responsivo automaticamente.
- Acessível (botões reais, keyboard nav).
- SEO-friendly (com `<noscript>` fallback).

### 2.2 HTML clonado (modo Sandbox do Supademo/Navattic)

Em vez de screenshot, o player recebe HTML+CSS de cada página clonada. O usuário clica em elementos reais do DOM. Necessita:

- Sandbox rigoroso: `<iframe sandbox="allow-same-origin allow-scripts allow-popups allow-forms">`.
- CSS injetado por página.
- Hotspots invisíveis (botões `<a>` com posição absoluta) que disparam navegação.
- Suporte a `<form>` e JS dentro do sandbox.

**Complexidade: L.** Requer sanitização HTML (DOMPurify), política CSP própria, e deduplicação de IDs entre páginas.

**Recomendação:** implementar **só na Fase 2**, após MVP validado.

### 2.3 rrweb (replay puro)

Player iframe sandboxado que executa `@rrweb/replay`. Mais simples que HTML clonado, mas UX diferente.

**Quando usar:** se o cliente quer que o visitante **interaja com o produto real** (modo Live Demo do Guideflow).

---

## 3. Bibliotecas / abordagens para construir o player

### 3.1 React + custom (nossa escolha)

Stack:
- **React 19** com Server Components para SEO do embed landing.
- **@floating-ui/dom** para posicionar tooltips e popovers.
- **framer-motion** para transições entre passos (lightweight, ~15 KB).
- **Zustand** para state machine interna (ou XState se virar complexo).
- **DOMPurify** se for aceitar HTML customizado em captions.
- **Tailwind** com `important` selectors dentro do iframe para isolar estilos.

Player em React (sugestão de API pública):

```tsx
import { DemoPlayer } from '@demo.br/player';

<DemoPlayer
  demo={demoJson}                          // ou demoUrl="https://..."
  onEvent={(event, step) => {              // analytics
    if (event === 'step_view') track(step);
  }}
  theme={{ primary: '#7c6af7' }}
  autoplay={false}
  startStepId="s1"
/>
```

**Bundle esperado:** ~40-60 KB gzip (React + Framer Motion + Floating UI). HMR-friendly.

### 3.2 `use-prism-react-renderer` ou `html-react-parser`

`html-react-parser` é útil **apenas** se você for aceitar HTML nas captions vindo do usuário (editor rich text). Aí você faz parse com `parse(captionHtml)` e injeta no JSX com `DOMPurify.sanitize()` antes.

**Não usar como base do player** — performance ruim para renderizar hotspots interativos.

### 3.3 `<iframe>` vs embed script-tag

| Método | Prós | Contras |
|--------|------|---------|
| **`<iframe>` HTML estático** | Zero JS no site host; sandbox nativo; isolado; analytics independentes | Comunicação cross-domain via `postMessage`; não pode herdar auth do host |
| **`<script src="cdn/embed.js">` que injeta `<iframe>`** | API mais simples para o cliente (`<script>` + `<div data-demo-id>`); lazy-load; pode passar config via atributos data-* | Pode ser bloqueado por ad-blockers; ainda usa iframe interno |

**Recomendação:** fornecer os dois. O `<script>` é o "modo bonito" para landing pages; o `<iframe>` é o fallback máximo para qualquer site (até CMSs travados).

**Referência:** <https://web.dev/articles/embed-best-practices>

### 3.4 Bibliotecas de tour library — serviriam?

| Lib | Bundle | License | Serve? |
|-----|--------|---------|--------|
| `react-joyride` v3 | ~30 KB | MIT | **Não** — desenhado para overlay sobre sua app, não standalone |
| `driver.js` | ~5 KB | MIT | Parcial — você ainda monta a UI toda |
| `intro.js` | ~10 KB JS + 2.5 KB CSS | **AGPL-3.0 + paid commercial** | **Não** — licença incompatível com SaaS comercial |
| `shepherd.js` | ~15 KB | **AGPL-3.0 + paid commercial** | **Não** |
| `@reactour/tour` | ~12 KB | MIT | Não — mesmo problema do Joyride |

**Veredito:** nenhuma tour library serve para nosso player de demos — todas são desenhadas para overlay na app, não standalone. Construir do zero com React + framer-motion + @floating-ui.

Fontes: <https://driverjs.com/> | <https://react-joyride.com/> | <https://introjs.com/checkout> | <https://inlinemanual.com/blog/driverjs-vs-introjs-vs-shepherdjs-vs-reactour>

---

## 4. Como embedar (a escolha do consumidor do player)

### 4.1 Script-tag embed (modo padrão)

```html
<div data-demo-br-id="abc123" data-demo-br-theme="dark"></div>
<script async src="https://embed.demo.br/v1/loader.js"></script>
```

O `loader.js` (3 KB):
1. Encontra todos `[data-demo-br-id]`.
2. Cria um `<iframe>` apontando para `https://play.demo.br/embed/{id}?theme=...`.
3. Configura `loading="lazy"` para performance.
4. Expõe `window.DemoBR.on(event, cb)` para o host receber analytics.
5. Usa `IntersectionObserver` para autostart quando entra na viewport.

### 4.2 iframe direto

```html
<iframe
  src="https://play.demo.br/embed/abc123?theme=dark"
  width="100%" height="640"
  frameborder="0"
  loading="lazy"
  allow="autoplay"
  title="Demo: Onboarding do CRM"
></iframe>
```

Útil para Notion, Ghost, Medium, Read.cv etc.

### 4.3 Deep links (share)

`https://demo.br/d/abc123?step=s2&token=xxx&var1=Joao&var2=Acme` — player consome query string, salta para o step e aplica variáveis (`{{name}}` → `João`, `{{company}}` → `Acme`).

---

## 5. Acessibilidade, mobile, SEO

### 5.1 Acessibilidade

- Cada hotspot é um `<button>` real (não `<div>` clicável).
- `aria-label` em cada hotspot com o `label` do JSON.
- Tooltips usam `role="tooltip"` e `aria-describedby` no botão.
- Step transitions usam `aria-live="polite"` para anunciar mudança de passo a screen readers.
- Suporte a keyboard: `Tab` navega hotspots, `Esc` sai, `→` avança.
- `prefers-reduced-motion`: desativa animações de slide/zoom; usa fade.
- Fonte: <https://react-joyride.com/docs/accessibility> (boas práticas gerais)

### 5.2 Mobile

- Imagens responsivas: sirva WebP/AVIF em vários tamanhos via R2 (ou Cloudflare Images no futuro).
- Hotspots com hit-area mínimo 44x44 px (Apple HIG, WCAG 2.5.5).
- Touch gestures: swipe ← → para navegar entre passos (sem libs externas, só touch events).
- Viewport meta tag + `image-rendering: -webkit-optimize-contrast`.

### 5.3 SEO do embed

- A **página** `/embed/{id}` (a que o iframe carrega) tem `og:*` meta tags dinâmicas, `<title>` e `<meta description>` por demo.
- Schema.org `VideoObject` ou `Course` para a página pública do demo.
- Sitemap.xml inclui URLs de demos publicados.
- O `<noscript>` do loader mostra um link `<a href="https://demo.br/d/abc123">Ver demo interativo</a>`.
- Lighthouse-friendly: o iframe carrega assets lazy, prefetch DNS de R2.

---

## 6. Variáveis e personalização

Player substitui tokens no JSON antes de renderizar:

```json
{ "caption": "Olá {{name}}, veja como o {{company}} pode usar isso" }
```

```ts
function interpolate(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}
```

Casos:
- Variáveis capturadas via URL (`?var_email=...`) — auto-fill.
- Variáveis capturadas via formulário de lead capture dentro do player.
- Variáveis injetadas pelo embed code do host via `data-demo-br-vars='{"name":"João"}'`.

---

## 7. Analytics cross-domain

O player envia eventos via `postMessage` para o parent (host) e simultaneamente para nosso próprio endpoint:

```js
// Dentro do iframe
function emit(event, payload) {
  parent.postMessage({ source: 'demo-br', event, payload }, '*');
  fetch('https://api.demo.br/v1/events', {
    method: 'POST',
    body: JSON.stringify({ event, payload, demoId, sessionId }),
    keepalive: true,
  });
}
```

**Eventos do player:**
- `demo_view` — primeiro frame visível
- `demo_start` — usuário clicou Play
- `step_view` — passo X ficou visível por >500ms
- `cta_click` — clicou num hotspot CTA
- `demo_complete` — último passo atingido
- `demo_branch` — escolheram caminho alternativo
- `lead_capture` — submerteram formulário
- `demo_exit` — saíram antes do fim (com step_index para funil)

Para tracking no GA4 do **host**: usar `postMessage` + o host escuta e empurra para GTM/dataLayer.

**Referência:** <https://www.graphed.com/blog/how-to-track-iframe-in-google-analytics>

---

## 8. State machine interna

Sugestão: state machine explícita, mesmo com 5 passos. Não usar `useState` ad-hoc.

```ts
type State =
  | { kind: 'idle' }
  | { kind: 'playing'; currentStepId: string; visited: Set<string> }
  | { kind: 'paused'; currentStepId: string }
  | { kind: 'completed'; lastStepId: string }
  | { kind: 'branching'; fromStepId: string; options: BranchOption[] };
```

Eventos: `START`, `ADVANCE`, `GO_BACK`, `GO_TO_STEP`, `BRANCH_SELECTED`, `PAUSE`, `RESUME`, `COMPLETE`, `RESET`.

Mantém `history[]` para suportar "Back" e para analytics de funil.

---

## 9. Stack final do player

| Camada | Lib / versão | Bundle (gzip) |
|--------|--------------|---------------|
| Framework | React 19 | ~45 KB |
| Animações | framer-motion 11 | ~15 KB |
| Posicionamento | @floating-ui/dom 1.6 | ~12 KB |
| State | Zustand 5 | ~1 KB |
| Sanitização (se preciso) | DOMPurify 3 | ~20 KB |
| Build | Vite 5 (lib mode) | n/a |
| Embed | Loader custom (vanilla, 3 KB) | 3 KB |

**Bundle total:** ~80 KB gzip do player + 3 KB do loader. Aceitável.

---

## 10. Estimativa de complexidade

| Tarefa | tamanho |
|---------|---------|
| Player base (image + hotspots + Next/Back) | S |
| Theming CSS vars + responsivo | S |
| Acessibilidade (keyboard, ARIA) | S |
| Suporte a variáveis `{{name}}` | S |
| Embed loader.js + iframe lazy | S |
| Cross-domain analytics + postMessage | M |
| Branching (escolhas) | M |
| Sandbox HTML mode | L (fase 2) |
| Geração de vídeo MP4 server-side (Remotion) | L (fase 2) |

**MVP do player: S.** Acessível em 1 sprint.

---

## 11. Referências citadas

- Storylane Docs: <https://docs.storylane.io/welcome-to-storylane>
- Navattic Docs: <https://docs.navattic.com/>
- Supademo Sandbox Demos: <https://supademo.com/features/sandbox-demos>
- Arcade Alternatives 2026: <https://www.storylane.io/blog/arcade-alternatives>
- web.dev — Best practices for third-party embeds: <https://web.dev/articles/embed-best-practices>
- React Joyride (referência de boas práticas A11y): <https://react-joyride.com/docs/accessibility>
- driver.js: <https://driverjs.com/>
- intro.js license: <https://introjs.com/checkout>
- Guide.js alternatives comparison: <https://guidejs.com/alternatives>
- Tour libraries benchmark 2026: <https://merge.rocks/resources/websites-playbook/react-ux-patterns/react-tour-library-comparison-react-joyride-vs-shepherd-vs-intro-js>
- Bounteous — iframe analytics GA4 guide: <https://www.bounteous.com/insights/2024/06/11/iframe-analytics-ga4-and-gtm-guide>
- Spotlane (referência JSON schema + React player open source): <https://github.com/headlessButSmart/spotlane>
- Remotion fundamentals: <https://www.remotion.dev/docs/the-fundamentals>