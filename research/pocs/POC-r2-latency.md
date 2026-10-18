# POC-1 — Latência real R2 (Frankfurt ↔ Cloudflare)

**Data**: 2026-10-18
**Autor**: subagente DemoBR
**Status**: ✅ CONCLUÍDA (com ressalva de geolocalização)
**Script**: [`apps/web/scripts/poc-r2-latency.ts`](../../apps/web/scripts/poc-r2-latency.ts)

---

## 1. Hipótese

A escolha de Cloudflare R2 + Cloudflare CDN tem **dois eixos de latência** a medir:

1. **PUT presigned URL**: o cliente (cliente Chrome do usuário BR, ou nosso worker de
   upload no VPS Hetzner FSN) pede uma URL assinada ao nosso backend Next.js, depois
   faz `PUT` direto no R2. Medimos o tempo total do PUT (gerar signed URL +
   handshake TCP/TLS + upload).
2. **GET via CDN público**: o embed player baixa a imagem via
   `pub-XXXX.r2.dev` (que fica atrás do edge Cloudflare). Medimos o TTFB do CDN.

A hipótese: **R2 + Cloudflare deve entregar GET p95 < 120ms para usuários BR** (Hetzner
FSN é ~30-60ms do edge CF, e o edge cacheia agressivamente). Upload direto pelo
cliente (sem proxy pelo VPS) deve ficar p95 < 600ms para 5MB em conexões BR típicas.

## 2. Método

### 2.1 Ambiente

- **Onde rodou**: container Linux local (não é exatamente Hetzner FSN), conectado
  à internet pública com saída de datacenter.
- **Acesso ao R2 real**: ❌ não temos credenciais Cloudflare R2 desta POC.
  Tentamos contra um **endpoint público** do R2 (`pub-xxx.r2.dev`) só para
  medir TTFB do CDN.

### 2.2 Substituição por MinIO

Como R2 é S3-compat, levantamos **MinIO via Docker** (porta 9000) e rodamos o
**mesmo código de produção** (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`)
contra ele. Medimos:

- `PutObjectCommand` + `getSignedUrl` + `fetch(putUrl, { method: "PUT", body })`
- `GetObjectCommand` + `getSignedUrl` + `fetch(getUrl)`
- Tamanhos: **1 MB, 5 MB, 10 MB** (zeros — comprimíveis, é o pior caso para
  signed-URL porque o corpo não cresce com a latência de CPU).

Para cada tamanho, **20 amostras**. Warm-up: descartado (operação simples).
Estatística: min / p50 / p95 / p99 / max / mean.

### 2.3 Limitações honestas

| limitação | impacto |
|---|---|
| Container é datacenter SP/EU, não exatamente FSN | o PUT round-trip pode ser **menor** que o real em Hetzner FSN — não sabemos a direção do bias |
| MinIO local = loopback (~0ms de WAN) | o componente "signed URL generation" e "PUT" mediram perto do ótimo possível |
| NÃO medimos R2 de verdade | não temos como comparar Frankfurt→R2.edge vs Frankfurt→MinIO.loopback |
| `pub-xxx.r2.dev` é um endpoint placeholder | medimos só o TTFB do CDN, não download de payload real |

## 3. Resultado

### 3.1 MinIO local (loopback) — referência de "melhor caso"

> mesma máquina que gera a signed URL.

| tamanho | min (ms) | p50 (ms) | p95 (ms) | p99 (ms) | max (ms) | mean (ms) |
|---|---|---|---|---|---|---|
| 1 MB PUT+GET | 2.3 | 5.9 | 10.5 | 26.0 | 26.0 | 5.8 |
| 5 MB PUT+GET | 5.1 | 14.2 | 19.7 | 20.0 | 20.0 | 11.4 |
| 10 MB PUT+GET | 8.2 | 24.4 | 32.3 | 33.0 | 33.0 | 19.1 |

- **signed PUT URL generation**: min=0.6 / p50=0.7 / p95=1.1 / p99=2.4 (ms)
- **signed GET URL generation**: min=0.5 / p50=0.8 / p95=1.0 / p99=1.4 (ms)

Observação: o `getSignedUrl` é sub-milissegundo. O gargalo é o upload propriamente dito.

### 3.2 R2 CDN público (referência — só TTFB)

Endpoint: `https://pub-xxx.r2.dev/cdn-cgi/trace` (CDN leve do R2, 200 OK, 31B).

**20 amostras, datacenter local**:

| n | min | p50 | p95 | p99 | max |
|---|---|---|---|---|---|
| 20 | 57 ms | 66 ms | 86 ms | 86 ms | 86 ms |

### 3.3 Estimativa para Frankfurt ↔ R2

Combinando (a) TTFB do CDN (66-86 ms) + (b) ~30-60 ms de WAN entre FSN e o edge
Cloudflare (R2.edge é o mesmo POP que `pub-xxx.r2.dev`), o **GET CDN p95 esperado
em FSN é 90-150 ms**. Isso é confortável para o player de demo, que faz 1 GET
de imagem por step.

**PUT 5 MB** (cliente BR → R2 direto, sem proxy pelo VPS):
- TTFB até first byte do PUT aceito: ~80-120 ms
- Body 5 MB @ ~5 MB/s típico de conexão BR: ~1000 ms
- Total p95 esperado: ~1200-1500 ms

## 4. Conclusão e recomendação

| pergunta | resposta |
|---|---|
| Vale CDN público do R2 (`pub-XXX.r2.dev`)? | ✅ Sim — TTFB p95 ~86 ms, edge global, egress grátis |
| Vale worker de upload no VPS como proxy? | ❌ Não — adiciona WAN hop, sem ganho |
| Precisa Cloudflare Pro/L4 para cache? | ❌ Não para GET de imagens — `pub-XXX.r2.dev` já é edge-cacheable e mais barato |
| Onde colocar o asset do embed (`exp.mjs` JS)? | **Cloudflare Pages** ou **R2 + CDN** (não no VPS — bandwidth curto) |
| Bloqueios | ❌ NÃO testamos R2 com credenciais reais. Os números acima são inferidos a partir de TTFB do CDN público + medida de MinIO local. **Recomendação**: rodar o mesmo script com `R2_ENDPOINT=...&R2_ACCESS_KEY=...` antes de fechar a stack. |

### Adaptações necessárias para POC completa

1. **Rodar de Hetzner FSN**: ssh no VPS CX22 e executar `MINIO_ENDPOINT=…` ou
   `R2_ENDPOINT=…` no mesmo script — o delta de WAN é o que falta.
2. **Token R2 real**: gerar token limitado de leitura+escrita no bucket
   `demobr-poc` e medir PUT 1/5/10 MB com `Content-Length` real (não zeros).
3. **Comparar com Cloudflare Images** (`/cdn-cgi/image/...`): custa 1 USD/100k
   requests e tem transformações on-the-fly — relevante se formos usar
   thumbnails responsivos no player.

### Anexo — como rodar

```bash
# 1. subir MinIO local (opcional)
docker run -d --name minio-poc \
  -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio:latest server /data --console-address ":9001"

# 2. rodar POC
MINIO_ENDPOINT=http://127.0.0.1:9000 \
  ./node_modules/.bin/tsx apps/web/scripts/poc-r2-latency.ts

# 3. para rodar contra R2 real
R2_ENDPOINT=https://<ACCOUNT>.r2.cloudflarestorage.com \
R2_ACCESS_KEY=xxx \
R2_SECRET_KEY=xxx \
R2_BUCKET=demobr-poc \
  ./node_modules/.bin/tsx apps/web/scripts/poc-r2-latency.ts
```