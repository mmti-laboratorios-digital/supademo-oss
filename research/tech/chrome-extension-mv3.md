# Chrome Extension MV3 — Captura de tela + cliques

> Pesquisa sobre como construir a extensão que captura páginas, cliques e gera passos para o editor do nosso SaaS de demos interativas (clone BR do Supademo).
>
> **Restrições do brief:** MV3 é obrigatório (Chrome Web Store não aceita mais MV2), extensão precisa funcionar em qualquer site, com atenção a LGPD (máscaras e dados sensíveis) e baixa complexidade (1 dev pequeno time).

---

## 1. APIs essenciais do MV3

### 1.1 `chrome.tabs.captureVisibleTab`

API central para tirar screenshot do que está visível na aba ativa.

- Sintaxe: `chrome.tabs.captureVisibleTab(windowId?, options?, callback?): Promise<string>`
- Retorna **data URL** (base64 PNG/JPEG), não blob.
- Restrição de rate: **máximo 2 chamadas por segundo** (`MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND`, Chrome 92+).
- Precisa da permissão `activeTab` (caso mais comum) ou `all_urls` (mais invasivo).
  - `activeTab`: dá acesso temporário ao site atual apenas quando o usuário invoca a extensão (clique no ícone ou comando de teclado). Padrão recomendado.
  - `all_urls`: permite captura em sites sensíveis (chrome://, outras extensões, etc.). Necessário para Sandbox Demos ou casos avançados.

```js
// popup.js ou service worker
async function captureActiveTab(format = 'jpeg', quality = 85) {
  const dataUrl = await chrome.tabs.captureVisibleTab(undefined, {
    format, // 'png' | 'jpeg'
    quality, // 0-100, ignorado em PNG
  });
  return dataUrl; // "data:image/jpeg;base64,..."
}
```

**Fonte oficial:** <https://developer.chrome.com/docs/extensions/reference/api/tabs#method-captureVisibleTab> | MDN: <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/captureVisibleTab>

### 1.2 `chrome.scripting.executeScript`

Injeta código no contexto da página alvo (DOM acessível). Usamos para:

1. Detectar clique/hover e capturar seletor CSS, bounding rect, texto, atributos do elemento.
2. Capturar propriedades de estilo computadas para posterior reprodução.
3. Coletar eventos DOM (`mousedown`, `input`, `navigation`) durante gravação.

```js
// Inserir content script programaticamente
await chrome.scripting.executeScript({
  target: { tabId: tab.id },
  func: (selector) => {
    const el = document.querySelector(selector);
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, html: el.outerHTML.slice(0, 2000) };
  },
  args: ['.btn-primary'],
});
```

Permissão necessária: `"scripting"` (não confundir com `scripting.executeScript` legado do MV2).

**Fonte:** <https://developer.chrome.com/docs/extensions/reference/api/scripting>

### 1.3 `chrome.tabCapture` (para gravar vídeo/áudio)

Diferente de `captureVisibleTab`: retorna um `MediaStream` da aba, permitindo gravação contínua (usado por Loom, Arcade em alguns casos).

```js
// No service worker
const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
// streamId é enviado para o offscreen document, que cria MediaRecorder
```

**Limitação MV3:** `tabCapture` precisa ser invocado após gesto do usuário e o `MediaStream` precisa ser consumido num **offscreen document** (vide §2).

**Fonte:** <https://developer.chrome.com/docs/extensions/reference/api/tabCapture>

### 1.4 Outras APIs úteis

| API | Uso |
|-----|-----|
| `chrome.storage.local` | Buffer de eventos (limite ~10 MB; cap em quotaExceeded) |
| `chrome.storage.session` | Dados em memória (desaparecem no reload do SW) |
| `chrome.runtime.sendMessage` / `onMessage` | Comunicação SW ↔ content ↔ offscreen ↔ popup |
| `chrome.action.onClicked` | Disparar gravação ao clicar no ícone |
| `chrome.commands` | Atalhos de teclado (`Ctrl+Shift+Y` para começar a gravar) |
| `chrome.webNavigation.onCommitted` | Detectar mudança de URL entre passos |
| `chrome.tts` | Narração por voz (alternativa barata ao ElevenLabs) |

---

## 2. Limitações do MV3 — service worker, offscreen, storage

### 2.1 Service Worker (background) — o divisor de águas

MV3 substituiu a background page persistente por um **Service Worker** baseado em eventos. Implicações reais:

| Antes (MV2) | Agora (MV3) |
|-------------|-------------|
| Background page viva sempre | SW dorme após ~30s sem eventos; acorda com evento |
| `window`, `document`, DOM livre | **Sem DOM, sem `window`** no SW |
| `localStorage` global | só `chrome.storage.*` (async, quota-based) |
| Listeners registrados a qualquer hora | Listeners **devem ser registrados sincronicamente no top-level do SW** — não dentro de callbacks async |
| `setTimeout` confiável | Pode ser morto no meio; use `chrome.alarms` para tarefas > 5min |

**Crítico:** se você usa `chrome.runtime.onMessage.addListener(...)` dentro de `await fetch(...)`, ele só registra depois do fetch e pode perder eventos. Registre sempre no topo do arquivo.

**Fonte:** <https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers> | <https://developer.chrome.com/docs/extensions/mv3/service_workers>

### 2.2 Offscreen Documents (Chrome 109+)

API desenhada para casos onde o SW não tem DOM (`Audio Playback`, `Clipboard`, `DOM Scraping`, `Tab Capture`).

- `chrome.offscreen.createDocument({ url, reasons: ['USER_MEDIA' | 'CLIPBOARD' | ...], justification })`
- **Apenas `chrome.runtime` é exposto ao offscreen.** Outras APIs Chrome não funcionam.
- **Uma instância por perfil/produto** (não dá para rodar 2 offscreens simultâneos).
- `offscreen.html` precisa ser um arquivo empacotado (não URL remota).
- Para nossa arquitetura: usamos offscreen como "sala de mídia" — recebe `streamId` do SW, faz `MediaRecorder` no DOM e retorna chunks.

```js
// sw.js
let creating; // singleton promise
async function ensureOffscreen() {
  const existing = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('offscreen.html')],
  });
  if (existing.length) return;
  if (creating) return creating;
  creating = chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Recording tab for demo creation',
  });
  await creating;
  creating = null;
}
```

**Fonte:** <https://developer.chrome.com/docs/extensions/reference/api/offscreen> | Blog: <https://developer.chrome.com/blog/Offscreen-Documents-in-Manifest-v3>

### 2.3 `chrome.storage.local` — limites

- **Quota padrão:** ~10 MB por extensão (UNLIMITED_STORAGE aumenta).
- **Operações são assíncronas** (Promises em MV3).
- Atingiu quota? `chrome.storage.onChanged` para de atualizar silenciosamente — sempre cheque.
- Para upload de imagens grandes (screenshots full-page), faça upload imediatamente em vez de tentar bufferizar.

### 2.4 Outras pegadinhas MV3

- **`host_permissions` precisam estar separadas** de `permissions` no manifest. `activeTab` dispensa host_permissions para a sessão atual.
- **`web_accessible_resources`** agora são arrays com `matches` (CSP-safe) — não funciona URLs cruzadas sem isso.
- **`content_security_policy`** é estrito: nada de `eval`, nada de inline script em extension pages.
- **Service worker pode matar mid-upload** — uploads longos devem ser **resumíveis** (tus.io protocol ou chunked PUT para R2/S3).

---

## 3. Alternativas de captura — quando usar cada uma

### 3.1 `chrome.tabs.captureVisibleTab` + clique via content script

**Quando usar:** demos baseadas em **screenshots estáticas** com hotspots clicáveis (modelo Supademo/Storylane clássico, **nossa escolha para o MVP**).

| Prós | Contras |
|------|---------|
| Simples — 1 chamada por passo | Resolução limitada ao viewport (~16:9 padrão) |
| Sem dependência pesada | Não captura full-page automaticamente |
| Não exige offscreen | 2 cap/seg — passos muito rápidos podem perder |
| Imagem leve, fácil de cachear no CDN | Não captura animações/transições de verdade |

**Bibliotecas úteis:**
- `chrome-screenshot-api` (<https://github.com/theluckystrike/chrome-screenshot-api>) — wrapper TS fino, expõe `captureVisibleTab`, `captureAndDownload`, `captureToBlob`, `captureToClipboard`, `captureMultipleTabs`. **~3 KB, MIT.**
- Exemplo minimalista `hacess/chrome-extension-manifestv3-screenshot` (<https://github.com/hacess/chrome-extension-manifestv3-screenshot>) — bom ponto de partida.

### 3.2 `html2canvas` (full-page screenshot)

Renderiza o DOM inteiro para canvas via JS no contexto da página.

- Bom para full-page quando você precisa "esticar" além do viewport.
- **Limitação conhecida:** sofre com `position: fixed`, iframes cross-origin, web fonts não carregadas, e Shadow DOM.
- Bundle ~45 KB minified. Use se realmente precisar full-page; nosso player normalmente recorta para uma janela 1280x720.

**Fonte:** <https://html2canvas.hertzen.com/>

### 3.3 rrweb (session replay)

Biblioteca open-source de **gravação de DOM e replay** — captura cada mutation e evento, depois reproduz em qualquer browser.

| Prós | Contras |
|------|---------|
| Reproduz interações reais (clique, scroll, typing) | Bundle grande (`@rrweb/record` ~80 KB) |
| Tamanho compacto (10 KB/min típico) | Requer renderização via `<iframe sandboxed>` |
| Players oficiais (`@rrweb/replay`, `rrweb-player`) com UI | Não é screenshot, é replay — UX diferente de Supademo |
| Case PostHog/Navattic usam (Navattic é cliente gold) | Sandbox precisa `allow-scripts` para canvas |
| Hot spots podem ser inferidos de eventos `mousedown` | Curva de aprendizado maior |

**Fonte:** <https://www.rrweb.io/> | <https://github.com/rrweb-io/rrweb>

**Recomendação para nosso projeto:** considerar **rrweb como plano B / "modo sandbox"**. Storylane e Supademo usam principalmente screenshots; rrweb brilha quando o produto do cliente é altamente interativo (SaaS dinâmico). Para o MVP, manter `captureVisibleTab` é mais barato e familiar.

### 3.4 Comparativo

| Necessidade | Solução recomendada |
|-------------|---------------------|
| Passo-a-passo estático com hotspots (MVP) | `chrome.tabs.captureVisibleTab` + content script |
| Full-page screenshot único | `html2canvas` (edge) ou `chrome.tabs.captureVisibleTab` + scroll manual + stitch |
| Reprodução fiel da interação do usuário (modo sandbox) | rrweb (`@rrweb/record` + `@rrweb/replay`) |
| Geração de vídeo MP4 final (marketing) | Remotion renderizando no backend Node |

---

## 4. Bibliotecas utilitárias para a extensão

| Lib | Versão | Uso | Tamanho |
|-----|--------|-----|---------|
| `chrome-screenshot-api` | `^1.0.0` | Wrapper `captureVisibleTab` | ~3 KB |
| `@rrweb/record` | `^2.0.0` | Modo sandbox | ~80 KB |
| `@rrweb/replay` | `^2.0.0` | Player interno (preview) | ~60 KB |
| `rrweb-player` | `^2.0.0` | UI pronta de replay | ~80 KB |
| `@floating-ui/dom` | `^1.6.0` | Posicionar tooltips sobre elementos-alvo (hotspots) | ~12 KB |
| `webextension-polyfill` | `^0.10.0` | Compatibilidade Firefox (se quiser expandir) | ~3 KB |
| `nanoid` | `^5.0.0` | IDs curtos para passos | <1 KB |
| `zod` | `^3.23.0` | Validar JSON do manifesto antes de salvar | ~12 KB |
| `comlink` | `^4.4.0` | RPC ergonômico entre SW ↔ content ↔ offscreen | ~5 KB |

**Remotion** (no backend, não na extensão): para gerar **vídeos MP4/GIF** de demos a partir dos passos JSON. `remotion ^4.0.0`, `@remotion/cli ^4.0.0`, `@remotion/renderer ^4.0.0`. Roda Puppeteer/Chromium headless no servidor. Documentação: <https://www.remotion.dev/docs/the-fundamentals>.

---

## 5. Como Supademo / Arcade / Storylane fazem — engenharia reversa leve

Baseado em observação dos produtos + blogs públicos:

### 5.1 Supademo
- **Chrome extension** roda `chrome.tabs.captureVisibleTab` em cada clique para gerar passo.
- Usa `chrome.scripting.executeScript` para ler DOM/bounding rect do alvo do clique.
- **Sandbox Demo:** copia HTML/CSS das páginas via `document.documentElement.outerHTML` + assets; salva em blob storage. (Fonte: <https://supademo.com/features/sandbox-demos>)
- Adiciona camada de **personalização** (`{{name}}`, `{{company}}`) via template replacement no player.
- Editor web faz o upload para R2/S3 + indexa passo em Postgres.
- Blog: <https://supademo.com/blog/7-chrome-extensions-to-make-your-work-easier>

### 5.2 Storylane
- **HTML capture** (`<canvas>` rasterization) é o diferencial pago. Para planos mais baratos, usa screenshot estático.
- Player usa coordenadas relativas (%) para hotspots — responsivo.
- Mantém a stack Next.js + Postgres + S3 (referência pública: <https://docs.storylane.io/welcome-to-storylane>).

### 5.3 Navattic
- Foco em HTML/CSS capture (founder defende ser "the right way").
- É cliente **gold sponsor** do rrweb — provavelmente usa rrweb em alguma feature de replay.
- Players servem HTML renderizado com hotspots como `<button>` absolutos em coordenadas fracionárias.

### 5.4 Arcade
- Tem tanto `capture` (estático) quanto `record` (vídeo curto). O modelo clássico de "Arcade demo" é uma série de screenshots com hotspots clicáveis + tooltip.

**Conclusão para nosso projeto:** a abordagem **screenshots + hotspots** é a mais simples, barata e testada. Sandbox HTML e rrweb ficam como **features futuras**.

---

## 6. Arquitetura recomendada para nossa extensão

```
┌─────────────────────────────────────────────────┐
│ Service Worker (sw.js)                          │
│  - Orquestrador (singleton de listeners)        │
│  - decide: offscreen? content script? storage?  │
│  - mantém fila de eventos (gravações)           │
└────────────┬─────────────────┬───────────────────┘
             │                 │
   ┌─────────▼──────┐   ┌──────▼──────────────┐
   │ Content Script │   │ Offscreen Document  │
   │ - DOM events   │   │ - MediaRecorder     │
   │ - bounding box │   │ - HTML2Canvas       │
   │ - selector     │   │ - clipboard         │
   │ - highlight    │   │                     │
   └────────────────┘   └─────────────────────┘
             │
   ┌─────────▼──────────┐
   │ Popup / Sidepanel  │ - start/stop rec, status
   └─────────┬──────────┘
             │ chrome.runtime.sendMessage
   ┌─────────▼──────────┐
   │ Upload para API    │ - chunked, resumable
   │ POST /v1/demos     │
   └────────────────────┘
```

**Fluxo do usuário:**
1. Clica no ícone da extensão → SW abre painel.
2. Clica "Gravar" → SW injeta content script no tab ativo.
3. Content script escuta `mousedown`/`input`/`navigation`; para cada evento relevante:
   - Captura screenshot via `chrome.tabs.captureVisibleTab` (content script manda mensagem pro SW que captura).
   - Captura `{x, y, w, h, selector, text, html}` via `executeScript`.
   - Envia para SW que enfileira em `chrome.storage.session`.
4. Clica "Parar" → SW faz POST chunked para `/api/demos` com array de passos + uploads de imagens.
5. Backend (Next.js) faz upload para R2, persiste no Postgres, retorna `demoId`.

---

## 7. Manifest mínimo (MV3)

```jsonc
{
  "manifest_version": 3,
  "name": "EasyDemo Capture",
  "version": "0.1.0",
  "description": "Capture interactive product demos in seconds.",
  "action": {
    "default_popup": "popup.html",
    "default_title": "EasyDemo"
  },
  "background": {
    "service_worker": "sw.js",
    "type": "module"          // ES modules no SW
  },
  "permissions": [
    "activeTab",
    "tabs",
    "scripting",
    "storage",
    "offscreen",
    "alarms"
  ],
  "host_permissions": [
    "<all_urls>"              // só se for Sandbox mode
  ],
  "commands": {
    "_execute_action": { "suggested_key": { "default": "Ctrl+Shift+Y" } }
  },
  "web_accessible_resources": [{
    "resources": ["offscreen.html", "styles.css"],
    "matches": ["<all_urls>"]
  }],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

---

## 8. Estimativa de complexidade

| Tarefa | tamanho | notas |
|---------|---------|-------|
| Manifest + popup + ícones | S | boilerplate |
| Service worker base + offscreen scaffolding | S | seguir docs do Chrome |
| Content script de captura (click/select/bounding) | M | precisa dedupe e normalizar seletores |
| Upload chunked/resumable para API | M | implementar retry/backoff |
| Sandbox mode (rrweb ou HTML clone) | L | só construir pós-MVP |
| Integração com editor web (deep link, autofill) | S | |

**Complexidade total da extensão (MVP): M.** Cabe num sprint de 2 semanas para 1 dev sênior.

---

## 9. Referências citadas

- Chrome Developers — Tabs API: <https://developer.chrome.com/docs/extensions/reference/api/tabs>
- MDN — `tabs.captureVisibleTab`: <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/captureVisibleTab>
- Chrome Developers — Service Worker lifecycle: <https://developer.chrome.com/docs/extensions/mv3/service_workers>
- Chrome Developers — Offscreen API: <https://developer.chrome.com/docs/extensions/reference/api/offscreen>
- Chrome Developers — Tab Capture: <https://developer.chrome.com/docs/extensions/reference/api/tabCapture>
- Chrome Developers — `scripting.executeScript`: <https://developer.chrome.com/docs/extensions/reference/api/scripting>
- Chrome Developers — Differences between background scripts and service workers: <https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers>
- Chrome Developers — Offscreen Documents in MV3 (blog): <https://developer.chrome.com/blog/Offscreen-Documents-in-Manifest-v3>
- chrome-screenshot-api: <https://github.com/theluckystrike/chrome-screenshot-api>
- hacess/chrome-extension-manifestv3-screenshot: <https://github.com/hacess/chrome-extension-manifestv3-screenshot>
- rrweb: <https://github.com/rrweb-io/rrweb> | <https://www.rrweb.io/>
- Remotion: <https://www.remotion.dev/docs/the-fundamentals>
- Supademo Sandbox Demos: <https://supademo.com/features/sandbox-demos>
- Storylane Docs: <https://docs.storylane.io/welcome-to-storylane>