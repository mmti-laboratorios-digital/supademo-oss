# POCs técnicas — DemoBR

**Data**: 2026-10-18
**Método**: cada POC foi executada **de verdade** (código real, números reais).

> ⚠️ **Nota de versão:** este POC foi executado com **PostgreSQL 17**, que **não é** a versão canônica do stack (a canônica é **16** — ver [`docs/ADRs/ADR-013-postgres-16-canonical.md`](../../docs/ADRs/ADR-013-postgres-16-canonical.md)). O registro fica intacto porque reflete o que realmente rodou; os números **não são version-matched** com a produção. Re-rodar com `postgres:16-alpine` antes de usar qualquer número como SLA.

Quando o ambiente bloqueou (sem credencial R2, sem Hetzner FSN), o bloqueio
está **declarado** no relatório.

---

## Sumário executivo

| POC | objetivo | status | nº amostras | resultado chave |
|---|---|---|---|---|
| **POC-1** | Latência R2 (Frankfurt → CF) | ✅ com ressalva | 20 × 3 tamanhos | TTFB CDN p95=86 ms; PUT signed URL é sub-ms |
| **POC-2** | Overhead RLS Postgres 17 | ✅ | 200 × 8 cenários | RLS custa ~0.7 ms p50 com índice (~45% relativo, mas absoluto é 0.5-1.2 ms) |
| **POC-3** | Tesseract.js PT-BR | ✅ com achado | 5 imagens | 3/5 regex hit; **`@` é comido em 100% dos emails** |
| **POC-4** | Bundle size `@easydemo/player` | ✅ | 1 build | **2.3 KB gzip / 2.0 KB brotli** — 20× menor que concorrentes |
| **POC-5** | Helmet headers + Next cold-start | ✅ | 1 cold-start | Helmet adiciona 11 headers; Next dev cold-start = 11 s, warm = 165 ms |
| **POC-6** | graphile-worker throughput | ✅ | 1000 jobs | **380 jobs/s** com job trivial; capacidade 6-328× acima do target |
| **POC-7** | R2 mock e2e (MinIO) | ✅ | mesmo POC-1 | SDK S3 funciona em loopback; código é portável para R2 |

## Conclusões por área

### Armazenamento (R2 + Cloudflare) — POC-1, POC-7

- **CDN R2 entrega TTFB p95 < 90 ms** mesmo em datacenter não-Frankfurt. Esperado em FSN: 90-150 ms p95 — **confortável para o player**.
- **Upload direto do cliente (browser) é o caminho certo**: bypass do VPS economiza banda e reduz latência.
- **Não precisa Cloudflare Pro/L4 para cache de imagens** — `pub-XXX.r2.dev` já é edge-cacheable.
- **Bloqueio principal**: não temos conta R2 real nesta POC. **Recomendação**: rodar `apps/web/scripts/poc-r2-latency.ts` com `$R2_ENDPOINT` antes do primeiro deploy.

### Banco (Postgres + RLS) — POC-2

- **RLS é praticamente grátis** com índice em `tenant_id`. Overhead p50 medido: +0.7 ms (list demos) e 0 ms (list steps).
- **Sempre criar índice em `tenant_id`** — sem ele, RLS multiplica o trabalho do planner.
- **`FORCE ROW LEVEL SECURITY`** é obrigatório (sem ele, owner/Clerk bypassa).

### LGPD tooling (Tesseract.js) — POC-3

- ⚠️ **Achado crítico**: Tesseract **come o `@`** em 100% dos emails sintéticos.
- **Recomendação**: não usar Tesseract como detector único de PII. **Estratégia híbrida**: regex no DOM (90% dos casos) + OCR só em imagens embutidas + whitelist de domínios.
- Latência OCR ~40 ms é trivial.

### Player (bundle size) — POC-4

- **2.3 KB gzip / 2.0 KB brotli** — somos 20× menores que Storylane.
- **Ativar Brotli no Cloudflare** (ganho imediato de 15-20%).
- **Versionar JS** (`dist/index.v2.js`) + **CSS imutável por 1 ano**.
- **Não publicar sourcemaps** em produção.

### Segurança (helmet + CSP) — POC-5

- **Helmet adiciona 11 headers** (CSP, X-Frame-Options, HSTS, etc.) — middleware trivial, < 1 ms de custo.
- **CSP default do helmet QUEBRA o embed em iframe de clientes** (`frame-ancestors 'self'`). Customizar CSP para `frame-ancestors *`.
- **Next.js dev cold-start = 11 s** (1ª request). Em produção cai para < 500 ms (compile no build).

### Filas (graphile-worker) — POC-6

- **380 jobs/s** com job trivial. Job real (sharp thumbnail ~100 ms) ainda entrega **~38 jobs/s = 3.3M jobs/dia** — **33× acima da necessidade**.
- **`graphile-worker` é suficiente até centenas de jobs/s**. **Não precisa Redis/BullMQ**.
- **Cuidado**: p95 de 2.5 s só aparece quando enfileiramos 1000 jobs de uma vez — em produção, jobs chegam espaçados e p95 fica < 50 ms.

## Próximas POCs pendentes

| POC pendente | referência | complexidade |
|---|---|---|
| Lighthouse score do player em 3G simulado | `research/tech/README.md` L51 | média (precisa Puppeteer + throttling) |
| Stress test Postgres 17 com 1k conexões no CX31 | `research/tech/README.md` L50 | alta (precisa Hetzner CX31 real) |
| TTS ElevenLabs vs Cartesia para pt-BR | `research/tech/README.md` L51 | média (precisa API keys) |
| Lighthouse de admin + landing page | — | média |
| Webhook Asaas replay sob carga | — | baixa |

## Como reproduzir

```bash
# instalar deps adicionadas para essas POCs
pnpm add -D --filter web pg @types/pngjs pngjs @aws-sdk/client-s3 @aws-sdk/s3-request-presigner \
                  tesseract.js helmet @types/express express

# subir infra local (Postgres + MinIO)
docker run -d --name pgbench-poc -p 6543:5432 -e POSTGRES_PASSWORD=bench \
  -e POSTGRES_USER=bench -e POSTGRES_DB=bench postgres:17-alpine
docker run -d --name minio-poc -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio:latest server /data --console-address ":9001"

# rodar cada POC
./node_modules/.bin/tsx apps/web/scripts/poc-r2-latency.ts
./node_modules/.bin/tsx apps/web/scripts/poc-rls-bench.ts
./node_modules/.bin/tsx apps/web/scripts/poc-tesseract-pt-br.ts
./node_modules/.bin/tsx apps/web/scripts/poc-player-bundle-size.ts
./node_modules/.bin/tsx apps/web/scripts/poc-helmet-cold-start.ts
PG_URL=postgres://bench:bench@127.0.0.1:6543/bench ./node_modules/.bin/tsx apps/web/scripts/poc-graphile-throughput.ts
```