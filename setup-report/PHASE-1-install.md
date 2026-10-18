# PHASE 1 — Setup local, install, typecheck, dev mode, prod build

**Repo:** `/home/dan/saas/supademo-oss` (DemoBR / Supademo OSS fork)
**Data:** 2026-10-18
**Node:** v24.12.0 | **pnpm:** 9.12.0 | **Next:** 15.0.3 | **TS:** 5.6.3

---

## TL;DR

| Etapa | Status | Observação |
|------:|:------:|:-----------|
| `pnpm install` | ✅ OK | Lockfile up-to-date, 910ms, zero warnings |
| `tsc --noEmit` (apps/web) | ❌ 57 erros | `useTranslate` indefinido + `i18n` re-export sem import local + `noUncheckedIndexedAccess` |
| `tsc --noEmit` (workers/extension/shared/ui/player) | ✅ OK | 0 erros |
| `next dev` (porta 3100, 3000 ocupada) | ✅ Funcional | `GET /` → HTTP 200 em ~4s |
| `next build` | ❌ Falhou | `opengraph-image.tsx` (edge) importa `lib/db.ts` → `postgres` → Node built-ins não disponíveis |

> **⚠ Status pós-fix (2026-10-18, fim da fase):** todos os 3 bloqueadores corrigidos — ver [`PHASE-1-fixes.md`](./PHASE-1-fixes.md). Estado final: `tsc` com 24 warnings (todos em `__tests__/`, não bloqueiam build); `next build` ✅ **SUCESSO** (19 páginas geradas).

**3 bloqueadores** identificados, todos **pre-existentes** (não introduzidos pelo setup):
1. **B-1**: `app/d/[slug]/opengraph-image.tsx` declara `edge` runtime mas usa `getDb()` (postgres-js).
2. **B-2**: Componentes do editor (`components/editor/*.tsx`) importam `useTranslate`, que **não existe** em `@/lib/i18n` (exportado é `useT`).
3. **B-3**: `apps/web/lib/i18n/index.tsx` referencia `DEFAULT_LOCALE`/`LOCALE_COOKIE`/`resolveLocale` sem import local (só re-export).

Itens de warning não-bloqueadores:
- 22 testes com `Object is possibly 'undefined'` (`noUncheckedIndexedAccess: true` no `tsconfig.base.json`).
- 1 caso em `lib/analytics/funnel.ts` (`string | null | undefined` vs `string | null`).
- 6 ocorrências em `lib/lgpd/redact.ts` (`w` possivelmente `undefined`).
- 2 ocorrências em `vitest.setup.ts` e `env.test.ts` (assign em `NODE_ENV` readonly — só TS, JS roda).
- Dev mode emite "Critical dependency" warnings sobre `@opentelemetry/winston-transport` e `@opentelemetry/exporter-jaeger` (peer deps opcionais não instaladas).

---

## 1. Setup local

`scripts/setup.sh` existe e tem 7 estágios: pré-req → .env → pnpm install → docker compose → health-check → db push + seed → resumo.

Pré-requisitos validados localmente:

| Comando | Versão encontrada | Mínimo (setup.sh) |
|---------|-------------------|-------------------|
| `node` | v24.12.0 | 22.0 ✅ |
| `pnpm` | 9.12.0 | 9.0 ✅ |
| `docker` | (não validado nesta fase) | 24.0 ⚠️ |

`apps/web/.env` já existe — não foi sobrescrito.

---

## 2. pnpm install

```
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +4
++++
Progress: resolved 4, reused 4, downloaded 0, added 0, done

. prepare$ node -e "console.log('DemoBR — pnpm install detectado')"
. prepare: DemoBR — pnpm install detectado
. prepare: Done
Done in 910ms
```

**Resultado:** sucesso na primeira tentativa, sem fallbacks necessários. Log completo em `/tmp/pnpm-install.log`.

---

## 3. `tsc --noEmit` por pacote

| Pacote | exit | erros |
|--------|-----:|------:|
| `apps/web` | 1 | **57** |
| `apps/workers` | 0 | 0 |
| `apps/extension` | 0 | 0 |
| `packages/shared` | 0 | 0 |
| `packages/ui` | 0 | 0 |
| `packages/player` | 0 | 0 |

**Apenas `apps/web` está quebrado.** Detalhamento dos 57 erros:

### 3.1. Cluster crítico — `i18n` hook (B-2 + B-3) — 23 erros

**Causa-raiz (B-3):** `apps/web/lib/i18n/index.tsx` linha 6 faz `export { ... } from "./constants"`, que é **re-export** e **não cria binding local**. Funções internas (`detectLocaleClient`, `I18nProvider`, `useI18n`, `useT`) referenciam `DEFAULT_LOCALE`, `LOCALE_COOKIE`, `resolveLocale` — todos indefinidos.

Erros diretos em `lib/i18n/index.tsx`:

```
lib/i18n/index.tsx(28,47): error TS2304: Cannot find name 'DEFAULT_LOCALE'.
lib/i18n/index.tsx(32,34): error TS2304: Cannot find name 'LOCALE_COOKIE'.
lib/i18n/index.tsx(35,22): error TS2304: Cannot find name 'resolveLocale'.
lib/i18n/index.tsx(39,18): error TS2304: Cannot find name 'resolveLocale'.
lib/i18n/index.tsx(39,40): error TS2304: Cannot find name 'resolveLocale'.
lib/i18n/index.tsx(40,8): error TS2304: Cannot find name 'resolveLocale'.
lib/i18n/index.tsx(40,31): error TS2304: Cannot find name 'resolveLocale'.
lib/i18n/index.tsx(41,7): error TS2304: Cannot find name 'DEFAULT_LOCALE'.
lib/i18n/index.tsx(53,59): error TS2304: Cannot find name 'DEFAULT_LOCALE'.
lib/i18n/index.tsx(63,28): error TS2304: Cannot find name 'LOCALE_COOKIE'.
lib/i18n/index.tsx(79,15): error TS2304: Cannot find name 'DEFAULT_LOCALE'.
lib/i18n/index.tsx(80,32): error TS2304: Cannot find name 'DEFAULT_LOCALE'.
```

**Causa-raiz (B-2):** O módulo expõe `useT`, mas 10 componentes em `components/editor/` importam `useTranslate`. Consequência em cascata:

```
components/editor/BranchingEditor.tsx(6,10): error TS2305: Module '"@/lib/i18n"' has no exported member 'useTranslate'.
components/editor/CtaEditor.tsx(5,10): error TS2305: Module '"@/lib/i18n"' has no exported member 'useTranslate'.
components/editor/DemoEditor.tsx(7,10): error TS2305: Module '"@/lib/i18n"' has no exported member 'useTranslate'.
components/editor/HotspotPicker.tsx(6,10): error TS2305: Module '"@/lib/i18n"' has no exported member 'useTranslate'.
components/editor/LeadFormEditor.tsx(5,10): error TS2305: Module '"@/lib/i18n"' has no exported member 'useTranslate'.
components/editor/PublishPanel.tsx(6,10): error TS2305: Module '"@/lib/i18n"' has no exported member 'useTranslate'.
components/editor/StepCanvas.tsx(18,10): error TS2305: Module '"@/lib/i18n"' has no exported member 'useTranslate'.
components/editor/StepList.tsx(33,10): error TS2305: Module '"@/lib/i18n"' has no exported member 'useTranslate'.
components/editor/ThemeEditor.tsx(6,10): error TS2305: Module '"@/lib/i18n"' has no exported member 'useTranslate'.
components/editor/VariablesEditor.tsx(6,10): error TS2305: Module '"@/lib/i18n"' has no exported member 'useTranslate'.
components/editor/EditorI18n.tsx(32,24): error TS2322: Type '{ children: ReactNode; initialLocale: "pt-BR" | "en" | undefined; }' is not assignable to type 'IntrinsicAttributes & { children: ReactNode; }'.
```

**Classificação: BLOQUEADOR (B-2 + B-3).** Editor de demos não tipa nem compila. Sugestão de fix abaixo.

### 3.2. `noUncheckedIndexedAccess` em testes — 22 erros

`tsconfig.base.json` define `"noUncheckedIndexedAccess": true`. Toda indexação de array/record vira `T | undefined`. Erros em arquivos de teste:

```
app/api/__tests__/demos-api.integration.test.ts(44,18): error TS2532: Object is possibly 'undefined'.
app/api/__tests__/demos-api.integration.test.ts(50,18): error TS2532: Object is possibly 'undefined'.
app/api/__tests__/webhook-asaas.integration.test.ts(60,17): error TS2532: Object is possibly 'undefined'.
app/api/__tests__/webhook-asaas.integration.test.ts(68,20): error TS2532: Object is possibly 'undefined'.
app/api/__tests__/webhook-asaas.integration.test.ts(151,12): error TS2532: Object is possibly 'undefined'.
app/api/__tests__/webhook-asaas.integration.test.ts(152,12): error TS2532: Object is possibly 'undefined'.
lib/__tests__/analytics-funnel.test.ts(34,12): error TS2532: Object is possibly 'undefined'.
lib/__tests__/analytics-funnel.test.ts(37,14): error TS2532: Object is possibly 'undefined'.
lib/__tests__/analytics-funnel.test.ts(58,12): error TS2532: Object is possibly 'undefined'.
lib/__tests__/analytics-funnel.test.ts(59,12): error TS2532: Object is possibly 'undefined'.
lib/__tests__/analytics-funnel.test.ts(60,12): error TS2532: Object is possibly 'undefined'.
lib/__tests__/analytics-funnel.test.ts(61,12): error TS2532: Object is possibly 'undefined'.
lib/__tests__/analytics-funnel.test.ts(62,12): error TS2532: Object is possibly 'undefined'.
lib/__tests__/analytics-funnel.test.ts(92,12): error TS2532: Object is possibly 'undefined'.
lib/__tests__/analytics-funnel.test.ts(116,12): error TS2532: Object is possibly 'undefined'.
lib/__tests__/analytics-funnel.test.ts(117,12): error TS2532: Object is possibly 'undefined'.
lib/__tests__/analytics-funnel.test.ts(118,12): error TS2532: Object is possibly 'undefined'.
lib/__tests__/r2-presigned.test.ts(37,18): error TS2532: Object is possibly 'undefined'.
lib/__tests__/r2-presigned.test.ts(61,12): error TS2532: Object is possibly 'undefined'.
lib/__tests__/r2-presigned.test.ts(71,12): error TS2532: Object is possibly 'undefined'.
lib/__tests__/rl.integration.test.ts(73,18): error TS2532: Object is possibly 'undefined'.
lib/__tests__/rl.integration.test.ts(80,18): error TS2532: Object is possibly 'undefined'.
lib/__tests__/rl.integration.test.ts(89,13): error TS2532: Object is possibly 'undefined'.
lib/__tests__/rl.integration.test.ts(199,21): error TS2532: Object is possibly 'undefined'.
```

**Classificação: WARNING (não-bloqueador do build de produção, mas quebra `pnpm typecheck` em CI).** Os testes em si rodam — JS é gerado via `next dev`. Fix: `!` asserts ou `?? throw`.

### 3.3. Tipagem stricta em código de runtime — 9 erros

```
lib/analytics/funnel.ts(117,52): error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'string | null'.
```

```
lib/lgpd/redact.ts(130,8): error TS18048: 'w' is possibly 'undefined'.
lib/lgpd/redact.ts(131,8): error TS18048: 'w' is possibly 'undefined'.
lib/lgpd/redact.ts(132,8): error TS18048: 'w' is possibly 'undefined'.
lib/lgpd/redact.ts(132,20): error TS18048: 'w' is possibly 'undefined'.
lib/lgpd/redact.ts(133,8): error TS18048: 'w' is possibly 'undefined'.
lib/lgpd/redact.ts(133,20): error TS18048: 'w' is possibly 'undefined'.
```

**Classificação: PRE-EXISTENTE / WARNING.** Código defensivo que precisa de narrow. Não bloqueia runtime, mas `noUncheckedIndexedAccess` flagra.

### 3.4. `NODE_ENV` readonly — 3 errors
```
lib/__tests__/env.test.ts(42,12): error TS2704: The operand of a 'delete' operator cannot be a read-only property.
lib/__tests__/env.test.ts(69,17): error TS2540: Cannot assign to 'NODE_ENV' because it is a read-only property.
vitest.setup.ts(38,13): error TS2540: Cannot assign to 'NODE_ENV' because it is a read-only property.
```

**Classificação: WARNING.** Cosmético; vitest.setup usa `process.env.NODE_ENV ??=` que TypeScript não gosta.

---

## 4. Dev mode

Porta 3000 estava ocupada por uma instância Next.js anterior (`pid=1674252`). Rodei em `:3100`:

```
   ▲ Next.js 15.0.3
   - Local:        http://localhost:3100
   - Environments: .env
   - Experiments (use with caution):
     · typedRoutes

 ✓ Ready in 3.4s
...
 GET / 200 in 3934ms
```

**Resultado:** servidor iniciou, `GET /` retornou **HTTP 200 em ~3.9s**.

Warnings durante o boot (não-fatais):
- `Can't resolve '@opentelemetry/winston-transport'` — peer opcional, transitivo de `@sentry/nextjs`.
- `Can't resolve '@opentelemetry/exporter-jaeger'` — peer opcional de `@opentelemetry/sdk-node`.
- `Critical dependency: the request of a dependency is an expression` × 2 — `require-in-the-middle` em `@opentelemetry/instrumentation`. É warning conhecido de runtime-inspection.
- `Critical dependency: require function is used in a way in which dependencies cannot be statically extracted` — `require-in-the-middle`.

Hot-reload não foi exercitado nesta janela de 30s.

---

## 5. `next build`

```
   ▲ Next.js 15.0.3
   - Environments: .env
   - Experiments (use with caution):
     · typedRoutes

   Creating an optimized production build ...
Failed to compile.

../../node_modules/.pnpm/postgres@3.4.5/node_modules/postgres/src/connection.js:1:1
Module not found: Can't resolve 'net'
> 1 | import net from 'net'
  2 | import tls from 'tls'
  3 | import crypto from 'crypto'
  4 | import Stream from 'stream'
  5 | import { performance } from 'perf_hooks'
... (mesmas queixas para 'net', 'tls', 'crypto', 'stream', 'perf_hooks')

> Build failed because of webpack errors
```

**Resultado: BUILD FALHOU.** Bundle size não calculado. Log completo em `/tmp/next-build.log`.

### Causa-raiz (B-1):

`apps/web/app/d/[slug]/opengraph-image.tsx` linha 16 declara `export const runtime = "edge"`, mas o `default async function Image` chama `getDb()` (linha 25) → `lib/db.ts` → `postgres` (postgres-js) → `connection.js` que importa `'net'`, `'tls'`, `'crypto'`, `'stream'`, `'perf_hooks'`. **Esses módulos não existem no edge runtime** — daí o erro de webpack.

Stack de import (resumida):

```
app/d/[slug]/opengraph-image.tsx (runtime = "edge")
  → lib/db.ts
    → drizzle-orm/postgres-js
      → postgres (3.4.5)
        → connection.js: net, tls, crypto, stream, perf_hooks ← FAIL
```

**Classificação: BLOQUEADOR (B-1).** Impossível publicar com este erro. Fix em `PHASE-1-fixes.md`.

---

## 6. Bloqueadores — resumo

| ID | Arquivo | Problema | Severidade |
|----|---------|----------|------------|
| B-1 | `app/d/[slug]/opengraph-image.tsx` | `runtime="edge"` + `getDb()` (postgres) — incompatível | **Build quebra** |
| B-2 | 10× `components/editor/*.tsx` | `import { useTranslate }` — não exportado | **Editor não tipa** |
| B-3 | `lib/i18n/index.tsx` | Re-export sem import local — símbolos indefinidos | **i18n não tipa** |

## 7. Recomendações de fix

Detalhes e aplicação efetiva em **`PHASE-1-fixes.md`**. Resumo:

| Erro | Fix |
|------|-----|
| B-1 | Trocar `runtime = "edge"` por `runtime = "nodejs"` em `opengraph-image.tsx`, OU (preferível) mover o DB lookup para um server component pai e passar o título como prop. |
| B-2 | Decidir uma direção: ou adicionar `export function useTranslate() { return useT(); }` em `lib/i18n/index.tsx`, ou renomear todas as 10 ocorrências de `useTranslate` → `useT` nos componentes do editor. |
| B-3 | Em `lib/i18n/index.tsx`, separar o re-export do import: `import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale } from "./constants";` (além do re-export existente). |
| Testes noUncheckedIndexedAccess | Adicionar non-null assertion (`!`) ou guards onde a indexação é sabidamente segura (loops de teste). |
| `NODE_ENV` readonly | Trocar `process.env.NODE_ENV ??=` por `process.env["NODE_ENV"] ??=` (bracket-notation bypassa a readonly tipada do `NodeJS.ProcessEnv`). |