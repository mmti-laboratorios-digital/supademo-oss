# CONCLAVE — DEV (Persona: Pleno Full-Stack)

> **Data:** 2026-10-18
> **Persona:** Dev front-end pleno (6 anos), full-stack TS/Next.js. Acabou de entrar no time. Code review honesto do scaffold que 14 subagentes geraram.
> **Escopo auditado:**
> - `apps/web/app/` (22 rotas)
> - `apps/web/components/editor/` (13 componentes)
> - `apps/web/components/player/` (state-machine + DemoPlayer + HotspotOverlay)
> - `apps/web/lib/` (analytics, billing, i18n, lgpd, queue, r2, auth, db, env)
> - `apps/web/server/` (actions + repositories)
> - `apps/web/db/schema/` (app.ts, analytics.ts, index.ts)
> - `apps/web/db/migrations/0000_init.sql`
> - `apps/web/middleware.ts`, `instrumentation.ts`
> - `packages/shared/src/` (i18n/messages 479 strings/idioma, types, schemas, translate)
> - 13 arquivos de test cobrindo: analytics-funnel, asaas (billing), r2-presigned, lgpd-redact, env, validators, rl integration, consent-text, state-machine (player), state-machine-helpers (editor), webhook-asaas integration, webhook-asaas sandbox integration, demos-api integration
>
> **Estado da runtime validado por outros agentes:** 135/135 tests passing, `next build` ✅ (com 2 fixes já aplicados: server-only leak no `packages/shared/src/index.ts` + drizzle manual mark). RLS 10/10. Drizzle migrate idempotente após ownership transfer.

---

## Seção 1 · VEREDICTO

> **Code quality: precisa refactor antes de acelerar.**

Pode merge do estado atual **se** for para um piloto fechado com Free-tier e traffic baixo. **Não pode** entrar num sprint de crescimento sem:

1. Quebrar o monólito `DemoEditor.tsx` (933 linhas, 12+ states, 7 abas) em sub-componentes + reducer. Está pedindo bugs de race-condition com autosave.
2. Resolver os 24 warnings de tipagem em `__tests__` no CI (hoje passam localmente mas vão parar pipeline).
3. Converter o `DemoPlayer.tsx` para usar o `playerReducer` puro que já existe em `state-machine.ts` (hoje há **DOIS** state machines: o reducer puro e a implementação inline com `useState`+`setTimeout`). Duplicação intencional? Espero que não.
4. Mover a fila de idempotency (`IDEMPOTENCY = new Map()` em `apps/web/app/api/webhooks/asaas/route.ts:40`) **para Redis/postgres**. In-memory some entre deploys e aceita replay indefinido dentro de 60s. É webhooks de billing — dinheiro em jogo.

Pontos **muito bons** para proteger:
- RLS está sério: 10/10 checks de tenant isolation, BYPASSRLS separado em role, `withTenant` com regex UUID hardcoded antes do `SET LOCAL` (proteção contra injection via `orgId`).
- i18n com **dois** paths complementares: `lib/i18n/index.tsx` (client, contexto React) e `packages/shared/src/i18n/translate.ts` (pure function para RSC/emails). Both work, both typesafe.
- Schema drizzle ↔ SQL inicial está coerente em colunas, defaults e constraints.
- 479 strings × 2 idiomas com `diffCatalogs()` exportado de `translate.ts` (não encontrei teste que valida isso — **mais um gap**).
- 11 dos 13 componentes de editor têm `planId` como prop mas a gating real está em `// TODO billing — gating` (não falha visual hoje, mas feature flag ausente).

**Confirmações sobre as decisões da RFC:**
- ✅ **Concordo** com `runtime = "nodejs"` no `opengraph-image.tsx` (PHASE-1 fix B-1) — sem `node:crypto` + `postgres-js` não roda no edge. Mais simples que trocar de driver.
- ✅ **Concordo** com `useTranslate = useT` (PHASE-1 fix B-2). Decorator honesto, blast radius mínimo.
- ✅ **Concordo** com a separação `packages/shared/src/index.ts` sem re-exportar `test-utils/asaas-payloads` (PHASE-14 fix). Bundle do client agradece.
- ⚠ **Discordo** da decisão "design-first, async patterns depois" para `DemoEditor.tsx`. O `setTimeout` de 220ms no DemoPlayer + autosave de 2s no editor são débitos que vão ranger.

---

## Seção 2 · TOP 10 SMELLS

> Listados por **severidade**, do mais perigoso ao mais bonito-mas-feio.

### 🔴 S-1 · DemoEditor.tsx → monólito de 933 linhas
- **File:** `apps/web/components/editor/DemoEditor.tsx:110-717`
- **Diagnóstico:** O componente-pai concentra 12 `useState` (`steps`, `title`, `description`, `language`, `finalCtaState`, `selectedStepId`, `selectedHotspotId`, `tab`, `saveStatus`, `savedAt`, `lastError`, `leadForm`, `theme`, `variables`, `branching`, `publishState`) + 4 fetch calls manuais + render com switch/ternário aninhado de 100 linhas para escolher tab + sub-componentes `SaveBadge`/`StepInspector` aninhados no mesmo arquivo.
- **Impacto real:** Autosave dispara em **qualquer** mudança de 11 estados. O effect (linha 419) tem 10 deps — qualquer nova state vira mais uma dep. Race condition: usuário muda `title`, em <2s muda `step.position`, dois fetches em paralelo podem chegar fora de ordem e clobber o último save.
- **Refactor mínimo:**
  ```ts
  // Extrair para useDemoEditor() hook em apps/web/components/editor/use-demo-editor.ts
  // Usa useReducer com discriminated union pra actions (substitui 12 useStates).
  // Mantém DemoEditor.tsx como layout puro (~150 linhas): header + tabs + body slot.
  ```
  Sub-componentes prontos a extrair para arquivos próprios: `SaveBadge.tsx`, `StepInspector.tsx`, `HeaderBar.tsx`, `TabNav.tsx`. Cada um já está isolado por dependência.

### 🔴 S-2 · Dois state machines, um apenas testado
- **File:** `apps/web/components/player/state-machine.ts` (110 linhas) vs `apps/web/components/player/DemoPlayer.tsx:19-91` (implementação duplicada com `useState`/`setTimeout`/`setInterval`).
- **Diagnóstico:** `state-machine.ts` foi extraído explicitamente como "pure reducer para testabilidade", os 11 testes em `state-machine.test.ts` passam, **mas o componente nunca importa o reducer**. O DemoPlayer continua com estado manual via `React.useState<State>("idle")` + `React.useState(currentIndex=0)` + `setTimeout` de 220ms para transição.
- **Impacto real:** Comportamento divergente garantido. Ex.: `state-machine.ts` dedup `START` com stepIds vazio, DemoPlayer faz `setCurrentIndex(0)` cego. BRANCH_SELECTED testado no reducer mas sem implementação no componente.
- **Refactor mínimo:**
  ```ts
  // Em DemoPlayer.tsx:
  const [state, dispatch] = React.useReducer(playerReducer, initialState);
  const start = () => dispatch({ type: "START", stepIds: steps.map(s => s.id) });
  // Elimina 3 useState + o setTimeout (delay vira useEffect observando state).
  ```

### 🔴 S-3 · Idempotency in-memory no webhook Asaas
- **File:** `apps/web/app/api/webhooks/asaas/route.ts:40`
- **Diagnóstico:** `const IDEMPOTENCY = new Map<string, number>();` — cresce indefinidamente, some entre deploys, e o filtro `Date.now() - last < 60_000` aceita replay infinito depois de 60s (janela de replay).
- **Impacto real:** Billing. Asaas pode reenviar o mesmo evento (retry por erro de rede). Em deploy com rolling restart, dois pods recebem o mesmo `PAYMENT_CONFIRMED` → dois `UPDATE workspaces SET planId = 'pro'`. Sem dano direto mas polui `subscriptions.updatedAt`.
- **Refactor mínimo:** Usar a tabela `webhook_deliveries` que já existe no schema (`apps/web/db/schema/app.ts:234-248`) com `INSERT ... ON CONFLICT DO NOTHING` keyed em `(webhook_id, payload->>'id')`.

### 🟠 S-4 · 24 warnings `TS2532: Object is possibly 'undefined'` em testes
- **Files:** `apps/web/lib/__tests__/analytics-funnel.test.ts:10`, `app/api/__tests__/webhook-asaas.integration.test.ts:4`, `lib/__tests__/r2-presigned.test.ts:3`, `lib/__tests__/rl.integration.test.ts:5`, `app/api/__tests__/demos-api.integration.test.ts:2`.
- **Diagnóstico:** `noUncheckedIndexedAccess: true` no `tsconfig.base.json:14` é a causa — bom setting, mas os testes usam `arr[i].x` em vez de `arr[i]?.x` ou `if (!arr[i]) throw`. **Hoje não bloqueia** `pnpm build` mas bloqueia `pnpm typecheck` em CI (PHASE-1 §"Não corrigido").
- **Impacto real:** Pipeline CI vai estourar. Se o time adicionar `tsc` ao gate, fica vermelho.
- **Refactor mínimo:**
  ```ts
  // Hoje:
  expect(result.steps[0].pct_continue).toBe(100);
  // Mínimo (preferido — falha o teste se índice sumir):
  expect(result.steps[0]?.pct_continue).toBe(100);
  ```

### 🟠 S-5 · Casting `as unknown as Pick<Demo, ...>` no editor page
- **File:** `apps/web/app/(app)/demos/[id]/edit/page.tsx:46,57`
- **Diagnóstico:**
  ```ts
  demo={result.demo as unknown as Pick<Demo, "id" | "title" | ...>}
  initialSteps={result.stepList as unknown as Step[]}
  ```
  Funciona, mas é uma **máscara para mismatch entre schema Drizzle e tipo compartilhado**. Quando alguém adicionar coluna nova no schema Drizzle, isto silencia o erro e propaga `undefined` no runtime.
- **Refactor mínimo:** Inferir o tipo de retorno de `db.select().from(demos)` via `InferSelectModel` do drizzle e **exportar do schema**:
  ```ts
  // db/schema/app.ts:
  export type DemoRow = InferSelectModel<typeof demos>;
  ```
  Depois `as DemoRow` em vez de `as unknown as Pick<Demo, ...>`. Mesma confiança, mais fácil de manter.

### 🟠 S-6 · `DemoPlayer.tsx` duplica contagem de step + branch + finalCta + leadForm que o state-machine-puro já tem
- **File:** `apps/web/components/player/DemoPlayer.tsx:30-91`
- **Diagnóstico:** O componente inline emite eventos (`emit('view')`, `emit('cta_click')`), controla `setCurrentIndex` manualmente, faz guarda pra overflow com `setState("completed")` inline. Perde 1 coisa importante: a invariante "se stepIds vazio, mantém state" do reducer.
- **Impacto real:** Pra demo rápida ok. Quando o time for adicionar BGM/captura de lead no meio do step (caso de uso real de Free-tier), ter estado espalhado por `useState` torna impossível garantir ordem de eventos.

### 🟠 S-7 · `HotspotPicker` usa `pointermove`/`pointerup` globais + DragState bagunçado
- **File:** `apps/web/components/editor/HotspotPicker.tsx:115-160`
- **Diagnóstico:** Drag state é `kind: "move" | "resize"`, mas o handler de "resize" calcula usando `newW = dx * 100 - hot.geometry.x` — onde `dx` é em px normalizado (0-1), subtraído de `hot.geometry.x` (em 0-100). Math confuso, e tem `void baseX; void baseY` na linha 149-150 admitindo vars mortas.
- **Impacto real:** Em zoom ≠ 100% o resize fica desalinhado. Não é blocker (user resize is not the hot path), mas vira bug "works in 1 laptop mas não em projection".
- **Refactor mínimo:**
  ```ts
  // Extrair `HotspotPicker/utils.ts` com clamp + math testados:
  // Função pura: computeResize({ fromBbox, startPointer, currentPointer, containerRect }) → newBbox
  ```

### 🟡 S-8 · `isPlayerAction` morto ou em lugar errado
- **File:** `apps/web/components/player/state-machine.ts:107-110`
- **Diagnóstico:** Helper de type guard exportado, mas `grep -rn "isPlayerAction" apps/ packages/` (sem node_modules) → **não chama ninguém**. Provavelmente planejado para uma v2 que não chegou.
- **Ação:** Apagar ou usar. Hoje é dead code.

### 🟡 S-9 · CtaEditor.tsx renomeia `link↔url` na unha
- **File:** `apps/web/components/editor/CtaEditor.tsx:647-672` (em `DemoEditor.tsx`)
  ```ts
  type: cfg.type === "link" ? "url" : cfg.type === "calendly" ? "url" : cfg.type,
  ```
- **Diagnóstico:** DemoEditor faz `cfg.type === "link" ? "url" : ...` para mapear entre `FinalCtaConfig.type` (`"link" | "calendly" | "whatsapp" | "email"`) e `FinalCta.type` (`"whatsapp" | "url" | "email"`). Perde **calendly** como tipo final. CTA Calendly salvo vira `url` cru (sem `https://cal.com/seuuser`).
- **Impacto real:** CTA Calendly não funciona. Usuário configura "Agendar reunião" e cai em 404.
- **Refactor mínimo:** Adicionar `"calendly"` no enum `FinalCta` (em `packages/shared/src/types/demo.ts`) e propagar.

### 🟡 S-10 · Copy-paste literal entre `app/d/[slug]/page.tsx` e `app/embed/[id]/page.tsx`
- **Files:** 2 páginas com 30 linhas idênticas (mapeamento de `step.screenshotR2Key` + `step.hotspot` cast) + helper `publicR2Url` duplicado em ambos.
- **Diagnóstico:** `publicR2Url(key)` já existe em `lib/r2.ts:108` (`publicUrl()`). Duplicação apareceu porque na pressa de build alguém abriu o editor, copiou e mudou um parâmetro.
- **Refactor mínimo:** Extrair `lib/public-demo.ts` com `fetchPublicDemo(db, idOrSlug)` retornando o shape normalizado de `DemoPlayerDemo + DemoPlayerStep[]`.

---

## Seção 3 · TEST COVERAGE GAPS — 5 testes prioritários

> Apenas o que **falta hoje** e tem risco real. Não estou pedindo teste genérico.

### T-1 — `diffCatalogs()` coverage de paridade i18n pt-BR ↔ en
- **Por quê:** 479 chaves × 2 idiomas. Existe o helper `diffCatalogs()` em `packages/shared/src/i18n/translate.ts:263-293` mas **zero testes**. Drift entre catálogos = string em inglês mostrada para usuário pt-BR. (Tive que confiar no olho pra auditar — quase perdi uma em `"editor.branching.title"` se existisse.)
- **Onde:** `packages/shared/src/__tests__/catalogs.test.ts` (novo).
- **Esboço:** 
  ```ts
  import { diffCatalogs } from "../i18n/translate";
  it("pt-BR e en têm o mesmo conjunto de chaves", () => {
    const diff = diffCatalogs();
    expect(diff.missingInEN).toEqual([]);
    expect(diff.missingInPtBR).toEqual([]);
    expect(diff.shared).toBeGreaterThan(400);
  });
  ```

### T-2 — BranchingEditor "plan gating"
- **Por quê:** `BranchingEditor.tsx:45` retorna `upgradeRequired` se `planId !== "business"`. Nenhum teste. Quando o time adicionar Business billing de verdade, alguém esquece o teste e a feature vira Free.
- **Onde:** `components/editor/__tests__/branching-editor.test.tsx` (precisa React Testing Library — não está nas deps hoje; **bloqueador secundário**).
- **Esboço:** Renderizar com `planId="free"` → vê mensagem de upgrade; `planId="business"` → vê botão "+ Adicionar opção". Adicionar `vitest-jsdom` + `@testing-library/react` em `package.json:31`.

### T-3 — `analyticsVisitorCookie` com cookie ausente
- **Por quê:** `lib/analytics/visitor.ts:23-45` é a única coisa que decide se um visitante é novo vs. recorrente. Cobertura atual zero. Se `parseCookie` quebrar com cookie multi-valor (RFC 6265 §5.2 aceita `;` em aspas), analytics duplica sessão.
- **Onde:** `lib/__tests__/visitor.test.ts` (novo).
- **Esboço:** mock `headers()` retornando `cookie: "_pk_id=abc; _pk_id2=xyz"`, garante que só pega o `_pk_id`; testar `idHash === hashVisitorId(randomBytes(...), salt)` no caminho "sem cookie"; testar bypass quando já tem cookie.

### T-4 — `cap() && “function cap”` em LeadFormEditor
- **Por quê:** `LeadFormEditor.tsx:198-200`:
  ```ts
  function cap(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  ```
  Para o campo `"phone"`, `"company"`, `"name"`, `"email"` → `"Phone"`, `"Company"` etc. **Cobre:** nenhum. Para string vazia `"".charAt(0).toUpperCase() + "".slice(1)` retorna `""` (ok), mas se alguém adicionar campo `"website"`, vai quebrar?
- **Onde:** inline — adicionar 2 linhas no teste existente se criar, ou trivial.
- **Esboço:** 
  ```ts
  it.each([["name", "Name"], ["email", "Email"], ["phone", "Phone"], ["", ""]]) 
    ("cap(%s) → %s", (input, expected) => expect(cap(input)).toBe(expected));
  ```
  Mas `cap` não é exportada. **Refactor mínimo:** `export function cap` (ou usar `lodash/startCase`).

### T-5 — `HotspotPicker` resize math
- **Por quê:** S-7 acima. Math confuso em `HotspotPicker.tsx:133-148`. Extrair pra pura função testada elimina o `void baseX; void baseY` e dá confidence no zoom.
- **Onde:** extrair `apps/web/components/editor/hotspot-math.ts` com `computeMove`, `computeResize`, `clamp`. Testar com cenários: zoom 50%, zoom 150%, container de 800px e 1920px.

---

## Seção 4 · BUNDLE OPTIMIZATION — 3 wins concretos

### B-1 — Stripe-Editor: lazy-load das 5 abas menos usadas
- **Contexto:** `/demos/[id]/edit` = 55.6 KB / 163 KB First Load. Os 5 sub-editors (`ThemeEditor`, `LeadFormEditor`, `CtaEditor`, `VariablesEditor`, `BranchingEditor`) carregam **mesmo quando você está na aba "steps"**.
- **Win:** `React.lazy(() => import("./ThemeEditor"))` em cada `tab !== "steps"`. Estimativa: ~12-18 KB fora do bundle inicial.
- **Trade-off:** Skeleton de 1 frame ao trocar de aba (já existe skeleton pattern no player).
- **Risco:** Baixo — abas raramente usadas ficam atrás de user intent claro.

### B-2 — Player público fica bem <100 KB
- **Estado atual:** `app/d/[slug]` = 2.9 KB / 103 KB First Load (`PHASE-14`). `app/embed/[id]` = 2.37 KB / 102 KB. Está **dentro** do budget. Não toque!
- **Mas:** quando rrweb virar feature (PHASE-3 POC), o pacote dele está entre 80-120 KB. **Quebra o budget em 2x.** 
- **Ação:** começar plano B (rrweb) **só** em feature flag off-by-default, com `<Suspense>` separado:
  ```ts
  const DemoRecorder = lazy(() =>
    import("./rrweb-recorder").then(m => ({ default: m.RrwebRecorder }))
  );
  ```
  Player sem rrweb fica em ~103 KB; com rrweb + lazy chunk é +80 KB **só sob demanda**.

### B-3 — Shared chunk 99.8 KB é OK mas veja o que puxa
- Breakdown simbólico: Next + React + Clerk = ~70 KB. O que sobra (29 KB) provavelmente é `lucide-react` (tree-shake-friendly?) + `@dnd-kit/core` + `@dnd-kit/sortable` + `zod` + `react-hook-form`.
- **Dica rápida:** importar ícones individualmente do lucide (já está) **verificar** se o editor está fazendo `import { } from "lucide-react"` (que importa todos). No grep vi `import { Save, Eye, AlertCircle }` no DemoEditor e `import { ZoomIn, ZoomOut, ... }` no StepCanvas — bom, já tree-shaking.
- **Mais:** `zod` no client? `DemoEditor.tsx:43-62` declara `z.object({...})` que é usado no `safeParse`. Bundle do client herda zod inteiro (~12 KB). Mover validação pra `/lib/validators/demo.ts` importado em server action `updateDemo`. Editor manda raw payload, server valida. **-10 KB no client bundle**.

---

## Seção 5 · EDITOR UX FLAGS — 3 problemas de UX se eu fosse o usuário

> Não é "code review" — é "olho de usuário".

### UX-1 · "Salvar" é mentiroso
- Auto-save de 2s. Sem indicador visual explícito do "último salvamento confiável" no nível do step.
- Quando o dev faz 50 edições rápidas, o badge pisca `saving/saved/error` mas o usuário não sabe **qual step** está em qual estado.
- **Sugestão:** badge de autosave no nível do **step** também, não só do demo. Se o usuário faz hot-spot + reorder em paralelo, vê que step A está saved e step B está saving.

### UX-2 · Drag de step no mobile é uma aventura
- `@dnd-kit` com `PointerSensor, activationConstraint: { distance: 6 }`. Funciona em tablet/mouse, mas em mobile (touch real) o handle tem 24px (`p-1` + ícone 16px) — polegar erra com facilidade.
- Sem `<DragOverlay>` mostrado — quando arrasta, o step Some visualmente (`opacity: 0.5` no original, mas **sem fantasma na posição de drop**). Usuário arrasta e fica olhando pra tela vazia até soltar.
- **Sugestão:** adicionar `<DragOverlay>` do @dnd-kit:
  ```tsx
  <DndContext ...>
    {activeStep && <DragOverlay><StepCardMini step={activeStep}/></DragOverlay>}
  </DndContext>
  ```

### UX-3 · Auto-save fires no `firstRun` "false", mas se o usuário entrar e **não** editar nada, o autosave nem dispara (correto) — exceto que a UI nunca diz "salvo pela última vez em HH:MM" no primeiro load. Vê só "autoSaved" genérico. Para um criador de demo isso é ansiedade: "será que vai salvar?".
- **Sugestão:** ao carregar demo, fazer 1 fetch inicial `/api/v1/demos/[id]` com `?include=lastUpdatedAt` e mostrar "Sincronizado 13:42" como ponto de partida.

Adicional (não pedido, mas não custa): o **botão "Preview"** abre `/d/[slug]?preview=editor` em nova aba. Bom. Mas se a demo **não está publicada**, o `/d/[slug]` retorna 404. O criador edita uma demo draft, clica em Preview, vê 404, pensa que quebrou. Deveria abrir um **preview interno** (rota `/d/[slug]/preview` com auth + tenant context) que renderiza o player com dados não-publicados.

---

## Seção 6 · MIGRAÇÃO PRIMEIRA SPRINT — 10 tarefas ordenadas

> **Premissa:** time de 2 devs + 1 designer, 2 semanas. Objetivo: desbloquear MVP sem perder o que já funciona.

### Dia 1-2 — Fundação

#### 1. **Refator DemoEditor.tsx → use-demo-editor.ts (reducer) + 4 sub-componentes**
Esforço: 2-3 dias. **Maior ROI de todo o sprint.** Quebra o monólito, elimina race-condition do autosave, destrava todos os outros refactors. **Não comece feature nova antes disso.**

Steps: 
- a) Criar `hooks/use-demo-editor.ts` com reducer + actions tipadas (`UpdateTitle`, `UpdateStepCaption`, `ReorderSteps`, `SetStatus` etc.)
- b) Extrair `SaveBadge.tsx`, `StepInspector.tsx`, `HeaderBar.tsx` pra arquivos próprios
- c) DemoEditor.tsx deve virar **só layout** < 200 linhas
- d) Manter API do `DemoEditor` 100% compatível com a page atual

#### 2. **Conectar DemoPlayer.tsx ao playerReducer (eliminar duplicação)**
Esforço: 0.5 dia. Aplicar S-2.

Steps:
- a) Trocar 3 `useState` por 1 `useReducer(playerReducer, initialState)`
- b) Mover `setTimeout(advance, 220)` pra `useEffect` observando `state === "transitioning"`
- c) Apagar `isPlayerAction` se ficar morto (S-8)

### Dia 3-4 — Robustez

#### 3. **Mover idempotency do webhook Asaas pra DB**
Esforço: 1 dia. Aplicar S-3.

A tabela `webhook_deliveries` já está no schema. Falta usar:
- a) Adicionar coluna `event_id` (unique) em `webhook_deliveries` via migration nova
- b) Trocar `IDEMPOTENCY: Map` por `INSERT ... ON CONFLICT (event_id) DO NOTHING`
- c) Limpar entry órfã no `apps/web/app/api/webhooks/asaas/route.ts:40` (DELETE o `Map`)

#### 4. **Resolver os 24 warnings TS2532 em testes**
Esforço: 0.5 dia (com pair). Aplicar S-4.

- a) `pnpm typecheck` rodando no CI (provavelmente já está, mas ver `package.json:7-15` em `apps/web`)
- b) Cada arquivo de teste seguir a fórmula: `expect(arr[i]?.x).toBe(...)` ou guardar antes. **Mass-fix em um único PR** com diffs por linha.

#### 5. **Adicionar `diffCatalogs()` ao CI** (T-1)
Esforço: 2 horas. **Alta confiança em i18n sem custo.**

- a) `packages/shared/src/__tests__/catalogs.test.ts` (criar)
- b) Adicionar `pnpm --filter shared test` ao CI

### Dia 5-6 — DX + UX

#### 6. **CtaEditor: suportar `calendly` end-to-end** (S-9)
Esforço: 1 dia. **Bug real — CTA Calendly 404a hoje.**

- a) Adicionar `"calendly"` ao union `FinalCta.type` em `packages/shared/src/types/demo.ts`
- b) Adicionar `'calendly'` em `whatsapp | url | email` no zod schema `app/api/v1/demos/[id]/route.ts:19`
- c) Dropar a condicional `cfg.type === "calendly" ? "url" : ...` em DemoEditor.tsx (passa a ser 1:1)
- d) Adicionar teste unitário do mapping

#### 7. **Extrair DRY: `app/d/[slug]` e `app/embed/[id]` compartilham `publicR2Url`** (S-10)
Esforço: 0.5 dia.

- a) `lib/public-demo.ts` com `fetchPublicDemoBySlug(db, slug)` e `fetchPublicDemoById(db, id)`
- b) `lib/r2.ts:108 publicUrl()` é o helper correto — remover os dois `publicR2Url` locais
- c) Reduz ambas pages pra ~40 linhas cada

### Dia 7-8 — Cobertura

#### 8. **Adicionar `vitest-jsdom` + @testing-library/react + testes do BranchingEditor** (T-2)
Esforço: 1 dia.

- a) `pnpm add -D vitest-jsdom @testing-library/react @testing-library/user-event jsdom`
- b) Atualizar `vitest.config.ts` com `environment: 'jsdom'` para `**/*.test.tsx`
- c) 2 testes críticos: `BranchingEditor` gating free vs business; `LeadFormEditor` reset consent template

#### 9. **Bundle win 1: dynamic import dos sub-editors** (B-1)
Esforço: 0.5 dia.

- a) `React.lazy` em cada subeditor
- b) `<Suspense fallback={<EditorSkeleton />}>`
- c) Medir com `pnpm build` antes/depois → esperado -12 KB

### Dia 9-10 — Acabamento UX

#### 10. **Editor UX: indicador de "último save por step" + DragOverlay mobile** (UX-1, UX-2)
Esforço: 1.5 dia. Diferenciação real para o creator experience.

- a) Estado `lastSavedAt` por step (não global) — derivado do reducer
- b) Badge no `SortableStepRow` quando state muda
- c) `<DragOverlay>` do @dnd-kit (`SortableContext` aceita isso nativamente)
- d) Testar em viewport mobile (Chrome DevTools 375px)

---

## Anexo · O QUE FUNCIONA E MERECE SER PROTEGIDO

Não critiquei tudo. Reconhecendo o que o time acertou:

- **RLS sério.** `withTenant()` em `apps/web/lib/db.ts:64-91` valida o UUID com regex antes de fazer `SET LOCAL app.current_tenant_id = '${safeOrgId}'`. Isso é defesa contra injection via OrgId do Clerk — coisa que 9 em 10 times não fazem.
- **Duas roles distintas (`app_owner` BYPASSRLS / `app_user` NOBYPASSRLS).** PHASE-9 + test-rls-admin.ts (recriado em PHASE-14) cobre.
- **`webhooks.clerk` valida assinatura Svix** corretamente (route.ts:64-77) — e separa parsing de payload com type guards manuais (`isOrgData`, `isMemberData`). Esses guards estão certos.
- **`fbdedact PII` retorna só bounds e tipo, não texto puro** — exatamente o que LGPD exige. Defaults sensatos.
- **`HOTSPOT_PICKER` reduz capacidade via `canCreate = step.hotspot == null`** (HotspotPicker.tsx linha 38 — `readOnly` prop), embora o comment do `DemoEditor` diga "MVP suporta 1 só, múltiplos é roadmap".
- **i18n com 479 chaves × 2 idiomas e helper de paridade** — mesmo sem teste, é estrutura pronta pra endurecer.
- **HCaptcha ausente** (não tem, mas também não tem nenhum form sem CSRF — webhook valida HMAC, /api/dsr valida HMAC, /api/v1/* passa por Clerk middleware). **Cobertura de autenticação boa.**
- **0 `@ts-ignore` em código de app.** Único lugar com `@ts-ignore` é `apps/web/scripts/test-pii-redaction.ts:65` (script fora do bundle, OK).
- **Editor usa `Omit<Step, "id">` / `Pick<Step, ...>` corretamente** em props — tipagem honesta.
- **build de produção passa** com 12 rotas estáticas + 9 dinâmicas (PHASE-14 Step 11).

### O que **vai** travar o time em 3 sprints

1. **Sem testes de componente** (vitest-jsdom ausente). Toda feature nova vai virar "edita arquivo, reza, builda".
2. **Auto-save sem conflict resolution.** Quando 2 membros do workspace editam o mesmo demo, último save ganha. Sem UI avisando. Risco real em Business tier (multi-member).
3. **`scripts/poc-*.ts` no repo.** Vejo `poc-r2-latency.ts`, `poc-tesseract-pt-br.ts`, `migrate-from-guiaflow.ts`, `mock-asaas.ts`, `fire-asaas-webhook.ts`, `test-pii-redaction.ts`, `seed-test.ts`, `test-webhook-asaas.ts`, `db/test-rls.ts`, `db/test-rls-admin.ts`. **10 scripts em `apps/web/scripts/` e `db/`.** Misturados com código de prod. Mover pra `apps/web/scripts/dev/` ou `infra/scripts/` (separar de CI).
4. **DDL do `0000_init.sql` precisa de `IF NOT EXISTS` em `CREATE POLICY`** (já documentado em PHASE-14). Segunda vez que outro dev rodar `drizzle-kit migrate` num banco novo, vai estourar — workaround parcial está em PHASE-14 §"Quarta tentativa".

### Resposta rápida para FAQ do próprio time

> **"Podemos usar este scaffold pra vender Pro?"**

Pro **Free**: sim, com S-4 (TS warnings), S-5 (casting), S-9 (CtaEditor calendly) e S-3 (idempotency DB) corrigidos. **4 PRs pequenos.**

Pro **Pro** (com multi-member + Business tier): só depois da tarefa #1 do sprint (reducer no DemoEditor) e #3 (idempotency DB). **Sem isso, primeira venda Pro vai nos expor.**

Pro **Enterprise** (custom domain, white-label): precisa do separador `scripts/dev/` (#3 do anexo) e provavelmente um pacote `packages/enterprise` separado. Não tente vender Enterprise com este scaffold.

---

*Assinado: dev pleno entrando na empresa, sem floreio. Quem herdar esse código vai querer que essas 10 tarefas tenham sido feitas.*
