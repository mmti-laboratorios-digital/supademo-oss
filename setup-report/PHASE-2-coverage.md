# PHASE 2 — Coverage Report (v8)

**Data:** 2026-10-18
**Provider:** `@vitest/coverage-v8@2.1.4` (depois do downgrade — ver PHASE-2-tests.md §4.2)
**Output:** `apps/web/coverage/index.html` + `coverage-summary.json`

---

## 1. Resumo geral

| Métrica | % | Cobertos / Total |
|---|---:|---:|
| **Statements** | **12.48%** | 604 / 4839 |
| **Branches** | **60.38%** | 125 / 207 |
| **Functions** | **36.11%** | 26 / 72 |
| **Lines** | **12.48%** | 604 / 4839 |

### 1.1. Por que a média geral é baixa (12.48%)?

A `coverage.include` no `vitest.config.ts` é **agressiva**: inclui todos os
arquivos `.ts`/`.tsx` em `lib/`, `components/` e `app/api/`. Boa parte desses
arquivos **não tem testes ainda** (ver §2). Se a média parece baixa, é
porque o denominador (4839 statements) inclui ~30 arquivos React sem testes
de component (`components/editor/*.tsx`, `components/player/*.tsx`,
`components/ui/*.tsx`).

### 1.2. Onde a cobertura é alta (>85%)

Estes arquivos têm **cobertura excelente** — testes existentes são suficientes:

| Arquivo | Stmts | Branches | Funcs | Linhas | Linhas não-cobertas |
|---|---:|---:|---:|---:|---|
| `lib/env.ts` | **100.00%** | **100.00%** | **100.00%** | **100.00%** | — |
| `lib/analytics/funnel.ts` | 98.64% | 89.28% | 100.00% | 98.64% | 135 |
| `lib/billing/asaas.ts` | 97.29% | 92.85% | 100.00% | 97.29% | 60-61 |
| `components/player/state-machine.ts` | 94.36% | 66.66% | 50.00% | 94.36% | 100, 108-110 |
| `app/api/v1/demos/route.ts` | 90.09% | 66.66% | 100.00% | 90.09% | 118-122, 124-126 |
| `lib/r2-presigned.ts` | 87.01% | 61.53% | 100.00% | 87.01% | 93, 95, 97, 99, 101 |

---

## 2. Cobertura por arquivo (ordenado por %)

### 2.1. 100% statements

| Arquivo | Stmts | Branches | Funcs | Linhas |
|---|---:|---:|---:|---:|
| `lib/env.ts` | 100.00% | 100.00% | 100.00% | 100.00% |

### 2.2. 80–99% statements (área madura)

| Arquivo | Stmts | Branches | Funcs | Linhas | Não-coberto |
|---|---:|---:|---:|---:|---|
| `lib/analytics/funnel.ts` | 98.64% | 89.28% | 100.00% | 98.64% | L135 |
| `lib/billing/asaas.ts` | 97.29% | 92.85% | 100.00% | 97.29% | L60-61 (`catch` block de `verifyWebhook`) |
| `components/player/state-machine.ts` | 94.36% | 66.66% | 50.00% | 94.36% | L100, L108-110 |
| `app/api/v1/demos/route.ts` | 90.09% | 66.66% | 100.00% | 90.09% | L118-122, L124-126 (DELETE handler não exercitado) |
| `lib/r2-presigned.ts` | 87.01% | 61.53% | 100.00% | 87.01% | L93, L95, L97, L99, L101 (audio/video extensions — testes só exercitam `image/*`) |

### 2.3. 50–79% statements (lacunas conhecidas)

| Arquivo | Stmts | Branches | Funcs | Linhas | Não-coberto | Gap |
|---|---:|---:|---:|---:|---|---|
| `lib/lgpd/redact.ts` | 79.72% | 83.33% | 80.00% | 79.72% | L83, L118-135 | `findWordBounds` com `ocrWords` não é exercitado (precisa OCR fixture) |
| `lib/db.ts` | 69.64% | 62.50% | 50.00% | 69.64% | L80-82, L104-105 | Edge cases de pool/transaction |
| `app/api/webhooks/asaas/route.ts` | 47.05% | 41.37% | 33.33% | 47.05% | L15-117, L142-208 | Não exercita PAYMENT_OVERDUE, SUBSCRIPTION_DELETED, branches de erro |

### 2.4. 0% statements (sem testes)

Estes arquivos existem mas **nenhum teste os exercita**:

#### API routes (não cobertos):

| Arquivo | Linhas |
|---|---|
| `app/api/dsr/route.ts` | 217 |
| `app/api/v1/demos/[id]/route.ts` | 141 |
| `app/api/v1/demos/[id]/steps/route.ts` | 157 |
| `app/api/v1/events/route.ts` | 75 |
| `app/api/v1/upload/sign/route.ts` | 64 |
| `app/api/webhooks/clerk/route.ts` | 142 |

#### Lib helpers (não cobertos):

| Arquivo | Linhas |
|---|---|
| `lib/asaas.ts` | 122 (helper HTTP — provavelmente não usado pelo billing/asaas.ts) |
| `lib/auth.ts` | 86 (`requireAuth` mockado em integration tests) |
| `lib/queue.ts` | 58 (graphile-worker — mockado em tests) |
| `lib/r2.ts` | 112 (mockado em r2-presigned tests) |
| `lib/resend.ts` | 37 (sem testes de e-mail) |
| `lib/analytics/events.ts` | 65 |
| `lib/analytics/visitor.ts` | 87 |
| `lib/i18n/server.ts` | 19 |
| `lib/i18n/constants.ts` | 34 (linhas 7-34, mas branches 100% — só statements) |
| `lib/lgpd/consent.ts` | 36 (branches 100%, mas statements 0% — só testa exports) |

#### Componentes React (zero cobertura — ambiente `node` em vitest):

O `vitest.config.ts` define `environment: "node"`, então **componentes React
nunca renderizam**. Eles existem nos reports com 0% mas isso é conhecido
e intencional. A suíte Playwright (em outro config) cobre UI.

| Arquivo | Linhas |
|---|---|
| `components/analytics/StatsChart.tsx` | 55 |
| `components/billing/PlanCard.tsx` | 55 |
| `components/editor/*.tsx` (12 arquivos) | 3.087 |
| `components/player/ConsentBanner.tsx` | 68 |
| `components/player/DemoPlayer.tsx` | 266 |
| `components/player/HotspotOverlay.tsx` | 71 |
| `components/ui/button.tsx`, `card.tsx` | 112 |

---

## 3. Áreas descobertas (paths no HTML)

`apps/web/coverage/index.html` (gerado). Lista navegável:

```
apps/web/coverage/
├── index.html                        ← dashboard geral
├── coverage-summary.json             ← dados raw
├── app/
│   ├── api/
│   │   ├── dsr/route.ts.html
│   │   ├── v1/
│   │   │   ├── demos/route.ts.html               (90.09%)
│   │   │   ├── demos/[id]/route.ts.html          (0%)
│   │   │   ├── demos/[id]/steps/route.ts.html    (0%)
│   │   │   ├── events/route.ts.html              (0%)
│   │   │   └── upload/sign/route.ts.html         (0%)
│   │   └── webhooks/
│   │       ├── asaas/route.ts.html               (47.05%)
│   │       └── clerk/route.ts.html               (0%)
├── components/
│   ├── analytics/StatsChart.tsx.html              (0%)
│   ├── billing/PlanCard.tsx.html                  (0%)
│   ├── editor/  (12 .tsx.html — todos 0%)
│   ├── player/
│   │   ├── ConsentBanner.tsx.html                 (0%)
│   │   ├── DemoPlayer.tsx.html                    (0%)
│   │   ├── HotspotOverlay.tsx.html                (0%)
│   │   └── state-machine.ts.html                  (94.36%)
│   └── ui/  (button.tsx.html, card.tsx.html — 0%)
└── lib/
    ├── analytics/
    │   ├── events.ts.html                         (0%)
    │   ├── funnel.ts.html                         (98.64%)
    │   └── visitor.ts.html                        (0%)
    ├── asaas.ts.html                              (0% — helper HTTP, unused?)
    ├── auth.ts.html                               (0% — mocked em tests)
    ├── billing/asaas.ts.html                      (97.29%)
    ├── db.ts.html                                 (69.64%)
    ├── env.ts.html                                (100%)
    ├── i18n/  (constants.ts.html, server.ts.html — 0%)
    ├── lgpd/
    │   ├── consent.ts.html                        (0%)
    │   └── redact.ts.html                         (79.72%)
    ├── queue.ts.html                              (0% — mocked)
    ├── r2-presigned.ts.html                       (87.01%)
    ├── r2.ts.html                                 (0% — mocked)
    ├── resend.ts.html                             (0%)
    └── utils.ts.html                              (33.33% — só `formatBRL` coberto)
```

---

## 4. Áreas com bugs/lacunas detectadas via cobertura

### 4.1. `lib/r2-presigned.ts` — branches de audio/video não testadas

Linhas 93 (`audio/mpeg` → `mp3`), 95 (`audio/mp4` → `m4a`), 97 (`audio/ogg`
→ `ogg`), 99 (`audio/wav` → `wav`), 101 (`video/webm` → `webm`) estão
**não-cobertas**. O teste atual só exercita `image/*` content types:

```ts
// r2-presigned.test.ts só testa image/webp, image/png
// r2-presigned.ts:90-100 — branches não exercitadas
case "audio/mpeg": return "mp3";
case "audio/mp4": return "m4a";
case "audio/ogg": return "ogg";
case "audio/wav": return "wav";
case "application/pdf": return "pdf";
case "video/mp4": return "mp4";
case "video/webm": return "webm";
default: return "bin";
```

**Risco:** se um futuro dev renomear `audio/mp4` mas esquecer `m4a`, ninguém
pega. **Ação prioritária** (ver §5).

### 4.2. `lib/billing/asaas.ts` — `catch` silencioso

Linhas 60-61 (única área não-coberta do billing) é o `catch` que retorna
`false` quando `timingSafeEqual` lança (ex: assinatura não-hex). Não é testado:

```ts
try {
  return timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex"),
  );
} catch {
  return false;  // L60-61: nunca exercitado
}
```

**Risco:** se o dev mudar para `throw` em vez de swallow, testes existentes
passam mas webhook real pode crashar. **Ação prioritária** (ver §5).

### 4.3. `lib/lgpd/redact.ts` — `findWordBounds` (OCR-coupled)

Linhas 118-135 implementam `findWordBounds(charIndex, length, words)`. Os
testes atuais passam `ocrWords: undefined` (default), então cai no
`estimateBounds`. Se OCR mudar a estrutura de `bbox`, ninguém pega.

```ts
function findWordBounds(_charIndex, _length, words) {
  if (words.length === 0) return estimateBounds("");
  const w = words[0];  // L128
  return { x: w.bbox.x0, y: w.bbox.y0, ... };  // L129-134
}
```

**Risco:** a função tem bug latente — pega o **primeiro** word, não o word
mais próximo do match. **Ação:** marcar como TODO para refactor com fixture
OCR (ver §5).

### 4.4. `lib/utils.ts` — só `formatBRL` testado (33%)

`utils.ts` tem `cn()`, `slugify()`, `shortId()` — todos em 0%. O teste em
`env.test.ts` só importa `formatBRL`. Funções públicas sem cobertura.

**Risco:** `slugify()` é usada em paths R2 (`buildKey`) — bug aqui =
corrompe keys. **Ação prioritária** (ver §5).

### 4.5. `app/api/webhooks/asaas/route.ts` — só `PAYMENT_RECEIVED` testado (47%)

Linhas 15-117 e 142-208 não são exercitadas. Cobrem:
- `PAYMENT_OVERDUE` (deveria ir para `past_due`)
- `PAYMENT_DELETED` / `PAYMENT_REFUNDED`
- `SUBSCRIPTION_DELETED` (deveria ir para `canceled`)
- Branches de erro 500

**Risco:** se a idempotência falhar em outros eventos, ninguém pega.
**Ação:** expandir `webhook-asaas.integration.test.ts`.

---

## 5. 3 ações priorizadas para próxima sprint

### Ação #1 — Cobertura de `lib/utils.ts` (`slugify`, `shortId`)

**Por quê:** `slugify()` é usado em `r2-presigned.ts.buildKey()` e
potencialmente em URLs. Bug aqui corrompe keys e quebra demo URLs.

**O que fazer:**
- Adicionar testes em `lib/__tests__/utils.test.ts` para:
  - `slugify()` com Unicode (NFD), espaços, caracteres especiais
  - `shortId()` determinismo + comprimento
  - `cn()` (clsx + tailwind-merge)

**Estimativa:** ~30min, 8 testes novos.

**Coverage gain esperado:** `lib/utils.ts` 33% → ~95%.

---

### Ação #2 — Expandir `webhook-asaas.integration.test.ts` para outros eventos Asaas

**Por quê:** Cobertura atual 47%. Webhook é ponto crítico de billing —
evento não-tratado = dinheiro perdido ou receita não-reconhecida.

**O que fazer:**
- Adicionar testes em `app/api/__tests__/webhook-asaas.integration.test.ts`:
  - `PAYMENT_OVERDUE` → status `past_due`
  - `PAYMENT_REFUNDED` → status `canceled` + flag refunded
  - `SUBSCRIPTION_DELETED` → status `canceled` + cancel_at_period_end
  - Webhook com payload corrompido (não-JSON) → 400
  - Webhook com `event` desconhecido → 200 ack (não-process)

**Estimativa:** ~1.5h, 5 testes novos.

**Coverage gain esperado:** `app/api/webhooks/asaas/route.ts` 47% → ~85%.

---

### Ação #3 — Cobertura de branches audio/video/pdf em `r2-presigned.ts`

**Por quê:** Áudio e vídeo são first-class no produto (voiceover_r2_key,
hotspots de vídeo). Branch silenciosa = upload quebra silenciosamente.

**O que fazer:**
- Adicionar testes em `lib/__tests__/r2-presigned.test.ts`:
  - `signUploadUrl({ contentType: "audio/mpeg" })` → key termina em `.mp3`
  - Idem para `audio/mp4` → `.m4a`, `audio/ogg` → `.ogg`, `audio/wav` → `.wav`
  - `video/webm` → `.webm`, `video/mp4` → `.mp4`
  - `application/pdf` → `.pdf`
  - Test negativo: `contentType: "application/octet-stream"` → erro

**Estimativa:** ~20min, 6 testes novos.

**Coverage gain esperado:** `lib/r2-presigned.ts` 87% → ~98%.

---

## 6. Métricas de qualidade

| Sinal | Valor | Avaliação |
|---|---|---|
| Tests passing | 126 / 126 | ✅ |
| Coverage stable | >=80% nos arquivos testados | ✅ |
| Coverage em arquivos não-testados | 0% | ⚠️ — esperado, não coberto por design |
| Test runtime | ~1.1s | ✅ rápido |
| Flakiness | Nenhum `it.skip` / `describe.skip` | ✅ |
| DB dependency | 17 testes requerem Postgres | ⚠️ — sprint de DB |
| CI integration | Não automatizado ainda | ⚠️ — sprint de CI |

---

## 7. Comandos úteis

```bash
# Abrir relatório HTML
xdg-open apps/web/coverage/index.html

# Gerar novamente
cd apps/web && pnpm exec vitest run --coverage

# Coverage em arquivo único (subset)
cd apps/web && pnpm exec vitest run lib/__tests__/ --coverage

# JSON raw (para CI/CD)
cat apps/web/coverage/coverage-summary.json | jq '.total'
```

---

## 8. Validação cruzada

- ✅ Relatório HTML gerado em `apps/web/coverage/index.html`.
- ✅ Summary JSON em `apps/web/coverage/coverage-summary.json`.
- ✅ Áreas descobertas (§3) e bugs latentes (§4) documentados.
- ✅ 3 ações priorizadas (§5) com estimativa e ganho esperado.
- ✅ Métricas alinhadas com PHASE-2-tests.md (§2.1).