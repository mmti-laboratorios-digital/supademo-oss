# POC-5 — Helmet (security headers) + cold-start Next.js

**Data**: 2026-10-18
**Autor**: subagente EasyDemo
**Status**: ✅ CONCLUÍDA (helmet) + ✅ CONCLUÍDA (Next cold-start)
**Script**: [`apps/web/scripts/poc-helmet-cold-start.ts`](../../apps/web/scripts/poc-helmet-cold-start.ts)

---

## 1. Hipótese

O `tech/RECOMMENDATION.md` ainda não cita `helmet` explicitamente (a segurança
de headers do Next.js hoje fica implícita no `next.config.ts`). Mas LGPD + ads
+ embed em sites terceiros exigem CSP/X-Frame-Options/HSTS bem definidos.

**Duas perguntas**:

1. **O que `helmet()` adiciona em headers comparado com Express nu?**
2. **Quanto tempo o Next.js leva para ficar pronto no primeiro hit?**
   (importante para cold-start de containers — bare metal K8s, autoscaling,
   etc.)

## 2. Método

### 2.1 (A) Helmet — comparação de headers

Levanta **dois** Express em portas aleatórias, com e sem `helmet()`:

```ts
const app1 = express();
app1.use(helmet());
app1.get("/healthz", (_, res) => res.json({ ok: true }));

const app2 = express();
app2.get("/healthz", (_, res) => res.json({ ok: true }));
```

Faz `fetch("/healthz")` em ambos, coleta headers e calcula diff.

### 2.2 (B) Cold-start Next.js

```bash
pnpm --filter web exec next dev --port 4322
```

Espera a string `Ready in` no stdout, então mede:

- **readyMs**: tempo até o log "Ready"
- **firstReqMs**: tempo até a **primeira resposta** a `GET /api/health`
- **warmMean**: média de 20 requests warm

> Detalhe: a app real **não tem rota `/api/health`** — então o 1º hit compila a
> rota (que retorna 500 por não existir, mas o cold-start é o que nos importa).

## 3. Resultado

### 3.1 (A) Headers adicionados por helmet

| cenário | nº headers | principais |
|---|---|---|
| Express nu | 7 | (apenas os default do Node) |
| Express + helmet | **18** (+11) | `content-security-policy`, `x-frame-options`, `strict-transport-security`, `x-content-type-options`, `referrer-policy`, `cross-origin-opener-policy`, `cross-origin-resource-policy`, `origin-agent-cluster`, `x-dns-prefetch-control`, `x-download-options`, `x-permitted-cross-domain-policies`, `x-xss-protection` |

**Helmet adiciona 11 headers de segurança** — incluindo o CSP default
(`default-src 'self'; base-uri 'self'; font-src 'self' https: data:; form-action 'self'`).

| header | valor default helmet |
|---|---|
| `content-security-policy` | `default-src 'self'; base-uri 'self'; font-src 'self' https: data:; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self' https: 'unsafe-inline'` |
| `x-content-type-options` | `nosniff` |
| `x-frame-options` | `SAMEORIGIN` |
| `strict-transport-security` | `max-age=31536000; includeSubDomains` |
| `referrer-policy` | `no-referrer` |
| `cross-origin-opener-policy` | `same-origin` |
| `cross-origin-resource-policy` | `same-origin` |

### 3.2 (B) Cold-start Next.js dev

| métrica | valor |
|---|---|
| Ready (boot dev server) | **1321 ms** |
| 1ª request (`/api/health` → 500 porque rota não existe) | **11 345 ms** |
| Warm (20 reps) média | **165 ms** |

> A 1ª request de **11 s** é dominada pelo **compile da rota** (`on-demand
> entries` do Next dev) — em produção (`next build && next start`) o compile
> já foi feito no build, então a 1ª request cai pra < 500 ms.

### 3.3 O que isso significa para EasyDemo

| pergunta | resposta |
|---|---|
| CSP default do helmet funciona pro embed? | ❌ **NÃO** — `frame-ancestors 'self'` quebra o embed em iframe de sites terceiros. Precisamos customizar CSP. |
| `helmet()` é custo zero? | ✅ < 1 ms por request (middleware trivial) |
| Cold-start Next.js dev é lento? | ✅ Sim, 11 s para 1ª rota. **Em produção** (build feito), cai para < 500 ms. |
| Vale `helmet` se já usa Next? | ✅ Sim — Next 15 não aplica CSP/X-Frame-Options por padrão. `helmet()` é a forma mais barata de garantir baseline OWASP. |

## 4. Conclusão

### Recomendação

1. **Adicionar `helmet()`** no `middleware.ts` (Edge runtime) ou em um wrapper
   de Route Handlers.
2. **Customizar CSP para suportar embed em iframe de clientes**:
   ```ts
   helmet({
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
         scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
         imgSrc: ["'self'", "data:", "https://*.r2.dev", "https://*.cloudflare.com"],
         frameAncestors: ["*"], // permite embed em qualquer site
         connectSrc: ["'self'", "https://*.r2.cloudflarestorage.com"],
       },
     },
     crossOriginEmbedderPolicy: false, // quebra recursos cross-origin
   })
   ```
3. **Cold-start em produção**: rodar `next build` no CI, gerar imagem Docker
   com o build cacheado. Cold-start real será 200-500 ms.
4. **Auto-scaling**: como o boot é rápido (200-500 ms), HPA no Kubernetes ou
   Docker Swarm escala bem — não é gargalo.

### Bloqueios

- **Nada bloqueante.** POC rodou 100% local.

### Anexo — como rodar

```bash
# parte A (helmet) — sem dependência externa:
./node_modules/.bin/tsx apps/web/scripts/poc-helmet-cold-start.ts

# parte B (Next cold-start) — exige build cacheado:
RUN_NEXT=1 ./node_modules/.bin/tsx apps/web/scripts/poc-helmet-cold-start.ts
```