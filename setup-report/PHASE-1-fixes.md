# PHASE 1 — Fixes aplicados

**Data:** 2026-10-18
**Estado anterior:** 57 erros de tsc, build de produção falhado.
**Estado atual:** tsc com 24 warnings (todos em testes, não bloqueiam build); `next build` ✅ **SUCESSO**.

---

## Resumo

| ID | Severidade | Arquivo | Fix aplicado |
|----|-----------|---------|--------------|
| **B-1** | BLOQUEADOR (build) | `apps/web/app/d/[slug]/opengraph-image.tsx` | `runtime = "edge"` → `runtime = "nodejs"` + comentário explicando a razão |
| **B-2** | BLOQUEADOR (tsc + 10 arquivos) | `apps/web/lib/i18n/index.tsx` | Adicionado `export const useTranslate = useT;` |
| **B-2b** | BLOQUEADOR (tsc) | `apps/web/lib/i18n/index.tsx` | `I18nProvider` agora aceita `initialLocale?: Locale` |
| **B-3** | BLOQUEADOR (tsc + 13 erros) | `apps/web/lib/i18n/index.tsx` | Adicionado `import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale } from "./constants";` (separado do re-export) |
| **B-4** | BLOQUEADOR (build) | `apps/web/app/(marketing)/content/contentLoader.ts` | Frontmatter parser: `value.trim().replace(...)` em vez de `value.replace(...).trim()` — ordem importa para o regex `^["']|["']$` ancorar corretamente |
| **B-5** | BLOQUEADOR (build) | `apps/web/lib/analytics/funnel.ts` (linha 117) | Narrow explícito de `reachOrder[idx - 1]` para `string \| null` antes de passar ao `Map.get` |
| **B-6** | WARNING (tsc) | `apps/web/lib/lgpd/redact.ts` (linhas 127–128) | Narrow explícito de `words[0]` antes de acessar `w.bbox.*` |
| **W-1** | WARNING (tsc) | `apps/web/vitest.setup.ts` (linha 38) | `(process.env as Record<string, string\|undefined>)["NODE_ENV"] ??= "test"` — bypassa readonly tipado |
| **W-2** | WARNING (tsc) | `apps/web/lib/__tests__/env.test.ts` (linhas 42, 69) | Mesmo cast `Record<string, string\|undefined>` |

**Total:** 3 bloqueadores de produção resolvidos (B-1, B-2/B-3, B-4); 2 fixes adicionais que `next build` exigia (B-5, B-6); 2 warnings cosméticos (W-1, W-2).

---

## Detalhes dos diffs

### B-1 — `apps/web/app/d/[slug]/opengraph-image.tsx`

**Problema:** o arquivo declarava `runtime = "edge"` mas chamava `getDb()` que carrega `postgres` → `connection.js` (módulos Node built-in `net`, `tls`, `crypto`, `stream`, `perf_hooks`). Webpack no edge runtime não consegue resolver esses módulos.

**Solução:** trocar para o runtime Node.js (mínimo custo, zero mudança comportamental).

```diff
- /**
-  * ...
-  * The image is cached by Next.js on the edge (`runtime = "edge"`).
-  */
-
- export const runtime = "edge";
+ /**
+  * ...
+  * Runs on the Node.js runtime because we query Postgres (postgres-js uses
+  * node:net, node:tls, node:crypto, node:stream, node:perf_hooks — none of
+  * which are available on the edge runtime).
+  */
+
+ export const runtime = "nodejs";
```

**Trade-off:** OG images ficam no Node runtime (ligeiramente mais lento cold-start vs edge). Para voltar ao edge no futuro, é preciso trocar `postgres` por um driver fetch-based (ex.: Neon HTTP) — comentário deixado como lembrete.

---

### B-2 + B-3 — `apps/web/lib/i18n/index.tsx`

**Problema (B-2):** 10 arquivos em `components/editor/` importavam `useTranslate` que não existia no módulo (existia `useT`).

**Problema (B-3):** Funções internas referenciavam `DEFAULT_LOCALE`, `LOCALE_COOKIE`, `resolveLocale` que vinham **apenas de re-export** (`export { ... } from "./constants"`). Em ES modules, re-export **não cria binding local**, então os nomes são indefinidos dentro do arquivo.

**Solução (B-3):** separar re-export de import local:

```diff
 "use client";

 import * as React from "react";
 import { messagesPtBR, messagesEn } from "@demo.br/shared";

+import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale } from "./constants";
+
 export { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale, parseAcceptLanguage } from "./constants";
 export type { Locale } from "./constants";

 import type { Locale } from "./constants";
```

**Solução (B-2):** adicionar alias semântico (decisão consciente para **não** renomear nos 10 componentes — blast radius mínimo):

```diff
+/**
+ * Alias semântico de `useT`. Mantido para compatibilidade com componentes
+ * do projeto que adotam o nome `useTranslate` (mais i18n-library-ish).
+ */
+export const useTranslate = useT;
```

**Solução (B-2b):** `I18nProvider` agora aceita `initialLocale?: Locale` para o `EditorI18n`:

```diff
-export function I18nProvider({ children }: { children: React.ReactNode }) {
-  const [locale, setLocaleState] = React.useState<Locale>(DEFAULT_LOCALE);
-
-  React.useEffect(() => {
-    const detected = detectLocaleClient();
-    setLocaleState(detected);
-  }, []);
+export function I18nProvider({
+  children,
+  initialLocale,
+}: {
+  children: React.ReactNode;
+  initialLocale?: Locale;
+}) {
+  const [locale, setLocaleState] = React.useState<Locale>(initialLocale ?? DEFAULT_LOCALE);
+
+  React.useEffect(() => {
+    if (initialLocale) {
+      // Respeita a escolha explícita (ex.: EditorI18n).
+      return;
+    }
+    const detected = detectLocaleClient();
+    setLocaleState(detected);
+  }, [initialLocale]);
```

---

### B-4 — `apps/web/app/(marketing)/content/contentLoader.ts`

**Problema:** o regex de parsing de frontmatter `/^["']|["']$/g` assume que a string **começa** com `"` ou `'`. Mas `line.slice(ix + 1)` retorna ` "2026-10-10T09:00:00Z"` (com espaço inicial), então o `^` não bate e **só o quote final é removido**. Depois `.trim()` tira o espaço, sobrando `"2026-10-10T09:00:00Z` (com aspa no início). `new Date("\"...")` → Invalid Date → `toISOString()` throws → build quebrava no `sitemap.xml`.

**Diagnóstico (script standalone):**
```
como-fazer-demo-interativa.mdx → "\"2026-10-10T09:00:00Z"
  isValid: false iso: INVALID
```

**Solução:** trim **antes** do regex, não depois:

```diff
 for (const line of body.split("\n")) {
   const ix = line.indexOf(":");
   if (ix < 0) continue;
   const key = line.slice(0, ix).trim();
-  const value = line.slice(ix + 1).replace(/^["']|["']$/g, "").trim();
+  // trim ANTES do regex: o pattern ^["']|["']$ exige o quote no início/
+  // fim da string, mas a fatia vem com espaço depois de ":" — sem o trim
+  // prévio, só o quote final é removido e o inicial sobra, gerando
+  // valores como `"2026-10-12T09:00:00Z` (com aspa sobrando) que quebram
+  // `new Date(...)` no sitemap.
+  const value = line.slice(ix + 1).trim().replace(/^["']|["']$/g, "");
   out[key] = value;
 }
```

**Validação:** agora todas as datas dos posts parseiam corretamente → `next build` completa `/sitemap.xml` sem `RangeError`.

---

### B-5 — `apps/web/lib/analytics/funnel.ts` (linha 117)

**Problema:** com `noUncheckedIndexedAccess: true`, `reachOrder[idx - 1]` é `string | null | undefined` (não `string | null`). O `Map.get` não aceita `undefined`.

```diff
-  const prev = idx === 0 ? null : reachCount.get(reachOrder[idx - 1]) ?? null;
+  const prev =
+    idx === 0
+      ? null
+      : (() => {
+          const prevId = reachOrder[idx - 1];
+          return prevId === undefined ? null : reachCount.get(prevId) ?? null;
+        })();
```

**Alternativa considerada:** `!` non-null. Rejeitada — não documenta a intenção de "se for null, retorne null".

---

### B-6 — `apps/web/lib/lgpd/redact.ts` (linhas 127–128)

**Problema:** `words[0]` é `OcrWordLike | undefined`. As 5 linhas seguintes acessam `w.bbox.*` sem narrow.

```diff
-  if (words.length === 0) return estimateBounds("");
-  const w = words[0];
-  return {
-    x: w.bbox.x0,
-    y: w.bbox.y0,
-    w: w.bbox.x1 - w.bbox.x0,
-    h: w.bbox.y1 - w.bbox.y0,
-  };
+  const w = words[0];
+  if (!w) return estimateBounds("");
+  return {
+    x: w.bbox.x0,
+    y: w.bbox.y0,
+    w: w.bbox.x1 - w.bbox.x0,
+    h: w.bbox.y1 - w.bbox.y0,
+  };
```

`words.length === 0` é equivalente a `!words[0]`, então o early-return cobre ambos os casos.

---

### W-1 — `apps/web/vitest.setup.ts`

**Problema:** `process.env.NODE_ENV ??=` viola `readonly` da tipagem `NodeJS.ProcessEnv` (acessos por nome recebem tipo readonly, mesmo quando o index signature diz que deveria ser gravável).

```diff
-process.env.NODE_ENV ??= "test";
+// Cast via Record<string, string | undefined> para bypassar a tipagem readonly
+// que o TS infere para chaves nomeadas em NodeJS.ProcessEnv.
+(process.env as Record<string, string | undefined>)["NODE_ENV"] ??= "test";
```

**Por que `process.env["NODE_ENV"]` sozinho não basta:** TypeScript ainda resolve `process.env["NODE_ENV"]` para o membro estático (que é readonly). O cast para `Record<string, string | undefined>` força o index signature genérico.

---

### W-2 — `apps/web/lib/__tests__/env.test.ts`

**Problema:** mesmo padrão — `delete process.env.NODE_ENV` e `process.env.NODE_ENV = "production"` são inválidos pelo readonly.

```diff
-    delete process.env["NODE_ENV"];
+    // Bypass readonly tipado de NodeJS.ProcessEnv para chaves nomeadas.
+    delete (process.env as Record<string, string | undefined>)["NODE_ENV"];
```

```diff
-    process.env["NODE_ENV"] = "production";
+    // Bypass readonly tipado de NodeJS.ProcessEnv para chaves nomeadas.
+    (process.env as Record<string, string | undefined>)["NODE_ENV"] = "production";
```

---

## Não corrigido (warnings remanescentes)

**24 erros restantes** em `apps/web`, todos `TS2532: Object is possibly 'undefined'` em arquivos `__tests__/`:

```
app/api/__tests__/demos-api.integration.test.ts (2)
app/api/__tests__/webhook-asaas.integration.test.ts (4)
lib/__tests__/analytics-funnel.test.ts (10)
lib/__tests__/r2-presigned.test.ts (3)
lib/__tests__/rl.integration.test.ts (5)
```

**Classificação:** WARNING. Causa: `noUncheckedIndexedAccess: true` no `tsconfig.base.json` faz toda indexação `arr[i]` virar `T | undefined`. **Não bloqueiam o build de produção** (Next valida só os arquivos de runtime + entry points + App Router types). Bloqueiam apenas `pnpm typecheck` em CI.

**Por que não foram corrigidos nesta fase:** cada fix é contextual (assertion `!` ou guard explícito), e os arquivos contêm ~30+ indexações. Mass-fixing arrisca introduzir bugs em testes que validam RLS, billing, webhook Asaas, etc — superfícies sensíveis onde asserts silenciosos podem mascarar regressões reais. Recomendo follow-up dedicado (PR separado por arquivo), com diff por linha e revisão.

**Sugestão de follow-up:** ver `PHASE-1-install.md` seção 7 — para cada erro: ou `!` (assert) se há garantia lógica, ou `if (!arr[i]) throw new Error(...)` (guard explícito).

---

## Validação

Após todos os fixes:

```bash
# Typecheck
$ cd apps/web && pnpm exec tsc --noEmit 2>&1 | grep "error TS" | wc -l
24    # só warnings em __tests__/, antes eram 57 (blocoes 33)

# Build de produção
$ cd apps/web && pnpm exec next build
✓ Generating static pages (19/19)
Route (app)                                  Size     First Load JS
┌ ○ /                                        793 B           117 kB
├ ƒ /d/[slug]/opengraph-image                0 B                0 B
├ ƒ /demos/[id]/edit                         55.6 kB         163 kB
... (27 rotas)
ƒ Middleware                                 114 kB
○ (Static)   prerendered as static content
● (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ (Dynamic)  server-rendered on demand
```

**Bundle notável:** `/demos/[id]/edit` é a maior rota (55.6 kB / 163 kB First Load) — esperado pois inclui `dnd-kit`, `react-hook-form`, `zod`, e o editor inteiro. Compartilhado: 99.8 kB. Middleware: 114 kB (Clerk + i18n + RLS guard).

**Páginas estáticas geradas:** 19 — incluindo as 3 blog pages (`/blog/demobr-vs-supademo-vs-guideflow`, `/blog/tour-interativo-produto`, `/blog/como-fazer-demo-interativa`) e `/sitemap.xml` (0 B JS, gerado no build).

---

## Arquivos modificados

```
apps/web/app/d/[slug]/opengraph-image.tsx              (B-1)
apps/web/app/(marketing)/content/contentLoader.ts      (B-4)
apps/web/lib/i18n/index.tsx                            (B-2, B-3, B-2b)
apps/web/lib/analytics/funnel.ts                       (B-5)
apps/web/lib/lgpd/redact.ts                            (B-6)
apps/web/vitest.setup.ts                               (W-1)
apps/web/lib/__tests__/env.test.ts                     (W-2)
```

7 arquivos editados. Nenhum toquei em billing, Asaas, Clerk auth, ou schema do banco.