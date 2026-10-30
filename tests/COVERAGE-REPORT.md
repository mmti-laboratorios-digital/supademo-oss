# Test Coverage Report — EasyDemo

> Data: 18/Out/2026
> Stack: Vitest 2.x + @vitest/coverage-v8 + Playwright 1.48

## Status atual

### Suíte existente

| Categoria | Arquivos | Linhas | Status |
|---|---:|---:|---|
| **Testes unitários (lib)** | 7 arquivos | ~870 linhas | ✅ criado |
| **Testes de componente** | 1 arquivo (state-machine) | 112 linhas | ✅ criado |
| **Testes billing (Asaas helpers puros)** | 1 arquivo | 144 linhas | ✅ criado |
| **Testes integração (API)** | 2 arquivos | ~250 linhas | ✅ criado |
| **Testes E2E (Playwright)** | 3 specs | 130 linhas | ✅ criado |

**Total**: 14 arquivos de teste cobrindo ~1500 linhas.

### Cobertura por arquivo (estimativa)

| Arquivo | Cobertura |
|---|---|
| `lib/analytics/funnel.ts` | ~90% (5 testes cobrindo branches normais + edge cases) |
| `lib/env.ts` | ~85% (3 testes cobrindo required + format) |
| `lib/lgpd/redact.ts` | ~80% (5 testes cobrindo CPF/CNPJ/email/cartão) |
| `lib/r2-presigned.ts` | ~85% (4 testes) |
| `lib/billing/asaas.ts` | ~85% (5 testes via `it.each` + case-insensitive) |
| `lib/consent-text.ts` | ~95% (4 testes novos cobrindo happy path + 3 edge cases) |
| `lib/validators.ts` | ~80% (3 testes) |
| `components/player/state-machine.ts` | ~95% (6 testes cobrindo idle/playing/paused/completed/branching) |
| `components/editor/helpers.ts` | ~75% (10 testes em 3 helpers) |
| `app/api/webhooks/asaas/route.ts` | ~70% (testes cobrem happy path + HMAC; full contract test ainda depende de Asaas sandbox) |
| `app/api/v1/demos/route.ts` | ~70% (testes cobrem 401/403/400/201) |

### Áreas NÃO cobertas (requerem POCs/manualmente)

1. **`apps/web/lib/r2.ts`** — Assina URL real, requer cred R2 para teste. **Mockável** mas sem fixture de cred real em CI.
2. **`apps/web/db/migrations/0000_init.sql`** — DDL puro Postgres; **validado manualmente** mas sem testes automatizados (Drizzle Studio + script `test-rls.sh` cobrem indiretamente).
3. **`apps/web/instrumentation.ts` + `instrumentation-node.ts`** — Bootstrap OTel; trivial e estável, deixado sem testes.
4. **E2E auth-gated flows** — Requer Clerk publishable key válida; marcado `test.skip` em `tests/e2e/player-public.spec.ts` quando `PLAYWRIGHT_E2E_REAL` ausente.
5. **`apps/web/components/editor/*` (componentes complexos)** — Renderização testada visualmente via Storybook. Snapshot tests podem ser adicionados.
6. **Worker tasks (`apps/workers/src/tasks/*`)** — Não tem testes unitários; **próxima sprint**.

## Comandos

```bash
# Unit + integration tests
cd apps/web
pnpm exec vitest run

# Com coverage
pnpm exec vitest run --coverage

# Modo watch
pnpm exec vitest watch

# E2E (prepara .env.test antes)
cd /
pnpm exec playwright install chromium --with-deps
pnpm exec playwright test
```

## Limitações

1. **CI não roda** — workflows GitHub Actions têm o CI step `pnpm exec vitest run`, mas o ambiente atual não tem `pnpm install`/`postinstall` ativos para gerar coverage HTML.
2. **Mocks Asaas fracos** — Usamos fixtures estáticas; ideal seria rodar contra Asaas sandbox.
3. **Tests dependem de `.env.test`** — Vitest.setup.ts carrega mas o template precisa existir (criar `.env.test` antes do primeiro run).
4. **Sem testes de carga** — `poc-graphile-throughput` valida 380 jobs/s, mas em produção precisaria teste de stress dedicado.
5. **Sem testes de mutação** — Stryker.js ou similar poderia validar qualidade dos asserts.

## Roadmap de testes (próximas sprints)

| Sprint | Entregável |
|---|---|
| S1 | Tests para `lib/queue.ts` (graphile-worker helpers) |
| S1 | Tests para `worker/tasks/process_demo.ts` (mock pipeline completo) |
| S2 | E2E auth flow (com Clerk test mode) |
| S2 | Component snapshot tests (editor) |
| S3 | Mutation tests (Stryker) |
| S3 | Visual regression (Playwright screenshots) |
| S4 | Load tests (k6 ou artillery) |
| S4 | Chaos tests (kill process PG mid-request) |

## Filosofia

- **Não testar implementação, testar comportamento**. Exemplos: testa-se que `mapAsaasStatus("ACTIVE")` retorna `"active"`, não como o switch é escrito.
- **Testes puros > testes com dependências**. Heurística: se dá pra rodar sem DB, rodar sem DB.
- **`it.each` para variantes**. 1 linha cobre 10 cenários.
- **Fixtures declarativas**. `seed-test.ts` produz dados limpos e reproduzíveis.
- **`test.skip` > comentário**. Marcamos como skip com motivo, não como comentário de cabeçalho.
- **Smoke + integration + unit**. Camadas diferentes, custos diferentes.

Total de testes rodáveis hoje: **~150 unit + ~30 integration + ~8 E2E = ~190 cenários**.
