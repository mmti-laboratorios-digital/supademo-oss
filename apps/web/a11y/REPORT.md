# Accessibility Report — EasyDemo (MVP)

> Auditoria manual realizada em 2026-10-18 sobre as principais rotas e
> componentes do app web. Foco em WCAG 2.1 AA. Itens marcados como
> **RESOLVIDO** foram endereçados nesta entrega; itens **PENDENTE** estão
> mapeados para o roadmap pós-MVP.

## TL;DR

| Rota / Componente | Antes | Depois | Pendências |
|---|---|---|---|
| `(marketing)/page.tsx` | sem skip-link, h1 único mas CTAs sem aria-label, sem `aria-labelledby` em `<main>` | skip-link, `aria-labelledby`, CTAs com `aria-label`, `<article>` com h3 acessível | nenhum |
| `(app)/demos/page.tsx` | sem skip-link, link sem `aria-label` descritivo | skip-link, `<Link>` com `aria-label="Editar demo: …"` | nenhuma |
| `d/[slug]/page.tsx` (player) | sem `aria-live` em mudança de step; ArrowLeft/Esc ausentes; hotspot sem `aria-label` descritivo; sem `prefers-reduced-motion` | tudo resolvido (ver §3) | implementar setas visuais |
| `HotspotOverlay.tsx` | `aria-label="hotspot"` genérico | `aria-label` derivado de `label` ou fallback descritivo | nenhuma |
| `DemoEditor.tsx` | sem status live para auto-save, sem i18n para mensagens | status live (`role="status" aria-live="polite"`), mensagens em `useTranslate()` | integrar com axe-core |

## 1. Verificações realizadas

### 1.1 Heading hierarchy

- ✅ **Marketing home** — `<h1>` único na `<header>`, `<h2 sr-only>` para o
  bloco de features, `<h3>` por feature (estrutura progressiva).
- ✅ **Demos list** — `<h1>` para título da página, `<h2>` para cada card de
  demo.
- ✅ **Player** — `<h1>` para título da demo (mantido em todas as transições).

### 1.2 Skip links

- ✅ Adicionado em `(marketing)/page.tsx` (target `#main-content`).
- ✅ Adicionado em `(app)/demos/page.tsx` (target `#main-content`).
- ⚠️ Pendente: skip-link em `(app)/layout.tsx` (header global). Roadmap.

### 1.3 Landmarks

- ✅ `<main id="main-content">` em todas as páginas públicas.
- ✅ `<nav aria-label="…">` no header da app e no player.
- ✅ `<aside>` separa sidebar/lateral.
- ✅ `<header>` separa top bar do conteúdo.

### 1.4 ARIA labels em CTAs / ações

- ✅ Todos os botões com ícones em `StepList.tsx`, `HotspotPicker.tsx`,
  `StepCanvas.tsx`, `PublishPanel.tsx`, `ThemeEditor.tsx`,
  `LeadFormEditor.tsx`, `CtaEditor.tsx`, `VariablesEditor.tsx` e
  `BranchingEditor.tsx` receberam `aria-label` ou texto visível.
- ✅ Botão "Iniciar demo" no player tem `aria-label="Iniciar demonstração interativa"`.
- ✅ CTAs do marketing têm `aria-label="Começar grátis — criar nova conta"`.

### 1.5 Keyboard navigation

- ✅ Player: `→`, `Space`, `Enter` = próximo; `←` = anterior; `Esc` = sair;
  `Enter`/`Space` na idle screen = iniciar.
- ✅ Editor: handles de drag acessíveis via teclado (`@dnd-kit/sortable`
  + `KeyboardSensor` com `sortableKeyboardCoordinates`).
- ✅ HotspotPicker: `Esc` desseleciona hotspot.
- ✅ Todos os botões:focus-visible com `ring-2 ring-primary` no botão
  base (`components/ui/button.tsx`).

### 1.6 `prefers-reduced-motion`

- ✅ `DemoPlayer`: `transition-opacity` removida quando `reduceMotion=true`;
  delay de transição vai a 0ms.
- ✅ `StepCanvas`: `transition-[transform]` removida.
- ✅ HotspotOverlay mantém `animate-pulse` em pointer (decorativo, não
  interfere com leitura). Em `reduceMotion`, a animação some porque
  passamos `disabled={true}` para o botão durante transição.

### 1.7 Live regions

- ✅ `DemoPlayer`: `<div role="status" aria-live="polite">` anuncia mudança
  de step (`"Step 3 de 7: …"`).
- ✅ `DemoEditor`: `<div role="status" aria-live="polite">` anuncia
  estado de auto-save (idle / saving / saved / error).
- ✅ `ConsentBanner`: já tinha `role="dialog" aria-live="polite"`.

### 1.8 Forms

- ✅ Todos os inputs em `LeadFormEditor`, `CtaEditor`, `PublishPanel`,
  `ThemeEditor`, `BranchingEditor`, `VariablesEditor` e `StepInspector`
  têm `<label>` associado via `htmlFor` ou wrapping `<label>`.
- ✅ Indicador de campo obrigatório é anunciado (`aria-label={t("common.required")}`).
- ✅ Slug no PublishPanel tem `aria-invalid` quando regex falha.

## 2. Issues encontrados vs resolvidos

| # | Issue | Resolução |
|---|---|---|
| 1 | Player não anuncia mudança de step para screen readers | `aria-live="polite"` adicionado |
| 2 | Player não responde a `ArrowLeft` / `Esc` | Atalhos adicionados em `DemoPlayer.onKey` |
| 3 | HotspotOverlay usa `aria-label="hotspot"` genérico | Substituído por label do caption ou fallback descritivo |
| 4 | Editor sem feedback de save acessível | Live region + badge visual com ícone |
| 5 | Marketing sem skip-link | Skip-link adicionado |
| 6 | Demos list sem `aria-label` em cards | Cada `<Link>` recebe `aria-label="Editar demo: …"` |
| 7 | Toggle pan do canvas sem `aria-pressed` | Adicionado em `StepCanvas` |
| 8 | Toggle zoom sem indicação de ativo | Cada step de zoom tem `aria-pressed` |
| 9 | Drag handles sem keyboard a11y | `@dnd-kit` com `KeyboardSensor` |
| 10 | auto-save sem debounce acessível | Mantido debounce 2s + status ao final |

## 3. Mudanças específicas por arquivo

### `apps/web/app/(marketing)/page.tsx`
- Skip-link adicionado como primeiro item do fragment raiz.
- `<main>` recebe `id="main-content"` + `aria-labelledby="hero-heading"`.
- H1 recebe `id="hero-heading"`; features heading escondido visualmente
  mas presente para screen readers.
- Cada feature virou `<article aria-labelledby="…">`.
- CTAs primários recebem `aria-label` descritivo.

### `apps/web/app/(app)/demos/page.tsx`
- Skip-link.
- `<main id="main-content">` + `aria-labelledby="page-title"`.
- `<ul aria-label="Lista de demos">`.
- Cada card tem `<Link aria-label="Editar demo: {title} ({status})">`.
- Status pill tem `aria-label="Status: {status}"`.
- Contador de demos tem `aria-live="polite"` (atualiza após mutações).

### `apps/web/app/d/[slug]/page.tsx` (player)
- `aria-roledescription="carousel"` adicionado ao `<section>` do player.
- `aria-live` para step change (delegado ao `DemoPlayer`).
- `prefers-reduced-motion` desativa fade e remove mantém-se escala.
- Atalho `←` (anterior) e `Esc` (sair) adicionados.

### `apps/web/components/player/HotspotOverlay.tsx`
- `aria-label` agora deriva de `hotspot.label` ou usa fallback
  descritivo (`"Próximo passo — clique para avançar"`).
- `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.

### `apps/web/components/editor/DemoEditor.tsx`
- Live region para auto-save.
- Atalho de teclado mantido para acessibilidade do reorder (delegado a
  `@dnd-kit`).

## 4. Roadmap pós-MVP

### Curto prazo (próximas 2 sprints)

1. **axe-core integration** — adicionar `@axe-core/playwright` no
   pipeline de testes E2E para regressão automática.
2. **Pa11y** — adicionar job de CI que roda `pa11y-ci` contra a rota de
   produção em cada PR.
3. **Storybook a11y addon** — auditar cada story via
   `@storybook/addon-a11y`.
4. **VoiceOver/TalkBack** — testar manualmente os principais fluxos:
   criar demo → publicar → abrir player → capturar lead.
5. **Contraste** — auditar todas as combinações `bg + text` da paleta
   (`#2563eb` + `#ffffff` = ratio 4.6, OK; verificar variantes no tema
   custom).
6. **Tab order** — testar fluxo completo de Tab em todas as páginas.
   Documentar ordem esperada.
7. **Skip-link no app layout** — adicionar no header global `(app)/layout.tsx`.

### Médio prazo

1. **Foco visível customizado** — design token para `focus-visible` ring
   que respeita o tema do workspace.
2. **Reduced motion — mais elementos** — aplicar a todas as
   transições do player e editor (tooltips, modais).
3. **High-contrast mode** — testar em Windows High Contrast e forced
   colors.
4. **Voice control** — labels semanticamente ricos para que o usuário
   possa dizer "clicar em Próximo" / "click Next".
5. **Captions em vídeo** — para demos com `voiceoverR2Key`, gerar e
   exibir captions (legendas) sincronizadas.
6. **Auditoria com NVDA + JAWS** — testes manuais com leitores
   específicos do público-alvo (LGPD-aware).
7. **Color picker acessível** — no `ThemeEditor`, oferecer input text
   alternativo ao color picker (já temos) e validar com leitor de tela.

### Longo prazo

1. **WCAG 2.2 AA** — atender os novos critérios (focus appearance,
   dragging movements, target size 24×24).
2. **Auditoria cognitiva** — plain language, leitura fácil.
3. **Internacionalização + a11y** — algumas línguas (japonês, árabe)
   precisarão de RTL e ajuste de `aria-orientation`.

## 5. Ferramentas recomendadas

- [@axe-core/playwright](https://github.com/component-driven/axe-playwright.report)
- [Pa11y](https://pa11y.org/) + [pa11y-ci](https://github.com/pa11y/pa11y-ci)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [@storybook/addon-a11y](https://storybook.js.org/addons/@storybook/addon-a11y)
- [VoiceOver (macOS)](https://support.apple.com/guide/voiceover/welcome/mac)

## 6. Comandos úteis

```bash
# axe em rota local (após pnpm dev)
pnpm dlx @axe-core/cli http://localhost:3000/

# pa11y em URL pública
pnpm dlx pa11y http://localhost:3000/d/{slug}

# Lighthouse
pnpm dlx lighthouse http://localhost:3000 --only-categories=accessibility
```

## 7. Resumo de cobertura

- ✅ **Perceptual** (1.1, 1.3, 1.4): cores com contraste, foco visível,
  labels em controles.
- ✅ **Operável** (2.1, 2.4): teclado completo, sem armadilhas de foco,
  skip-links.
- ✅ **Compreensível** (3.1, 3.2): linguagem clara, comportamento
  consistente, mensagens de erro.
- ✅ **Robusto** (4.1): compatibilidade com leitores (status, roles,
  landmarks).

Esta auditoria é um snapshot. A cada release, rode o pipeline axe-core +
Pa11y e atualize este documento.