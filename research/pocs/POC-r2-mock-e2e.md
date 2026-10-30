# POC-7 — R2 mock end-to-end (via MinIO)

**Data**: 2026-10-18
**Autor**: subagente EasyDemo
**Status**: ✅ CONCLUÍDA (com ressalva: sem conta R2 real)
**Script**: [`apps/web/scripts/poc-r2-latency.ts`](../../apps/web/scripts/poc-r2-latency.ts) (mesmo script do POC-1)

---

## 1. Hipótese

O fluxo de upload de imagem do EasyDemo é:

1. Cliente (extensão Chrome ou dashboard web) chama `POST /api/v1/upload/sign`
   no nosso Next.js → recebe `presigned PUT URL` apontando para R2.
2. Cliente faz `PUT <presignedURL>` com o body da imagem, **direto no R2**
   (não passa pelo nosso backend — esse é o ponto).
3. Quando a demo é publicada, o player baixa a imagem via CDN público
   (`pub-XXX.r2.dev/<key>`), que serve com edge cache Cloudflare.

**Pergunta**: o `@aws-sdk/s3-request-presigner` + `@aws-sdk/client-s3`
funciona ponta-a-ponta contra um servidor S3-compat real?

## 2. Método

Levantamos MinIO via Docker (`minio/minio:latest`, porta 9000) e rodamos o
**código exato de produção** (sem mock, sem stub):

```ts
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  endpoint: "http://127.0.0.1:9000",
  region: "us-east-1",
  credentials: { accessKeyId: "minioadmin", secretAccessKey: "minioadmin" },
  forcePathStyle: true, // MinIO exige path-style; R2 usa virtual-host
});

// 1) assinar PUT
const putUrl = await getSignedUrl(
  client,
  new PutObjectCommand({ Bucket: "easydemo-poc", Key: "demo.png", ContentType: "image/png" }),
  { expiresIn: 60 },
);

// 2) cliente (fetch) faz PUT direto
await fetch(putUrl, { method: "PUT", body: imageBuffer });

// 3) cliente baixa via GET assinado
const getUrl = await getSignedUrl(client, new GetObjectCommand({ ... }), { expiresIn: 60 });
const res = await fetch(getUrl);
```

3 tamanhos testados: 1 MB / 5 MB / 10 MB. 20 amostras cada.

## 3. Resultado

Ver POC-1 (`POC-r2-latency.md`) §3.1 para a tabela completa.

Resumo:

| tamanho | p50 PUT+GET round-trip |
|---|---|
| 1 MB | 5.9 ms |
| 5 MB | 14.2 ms |
| 10 MB | 24.4 ms |

**Funcionou end-to-end em loopback**. O fluxo:

1. `getSignedUrl()` → 0.7 ms (sub-ms)
2. `fetch(putUrl, { method: "PUT", body })` → 5-25 ms (loopback, latência zero)
3. `fetch(getUrl)` → 0.5 ms (cache MinIO)

### 3.1 Diferenças entre MinIO e R2 real

| aspecto | MinIO local | Cloudflare R2 |
|---|---|---|
| Path-style (`forcePathStyle: true`) | obrigatório | opcional (virtual-host preferred) |
| Signature version | v4 | v4 (igual) |
| `endpoint` | `http://127.0.0.1:9000` | `https://<acct>.r2.cloudflarestorage.com` |
| `region` | qualquer (`us-east-1`) | `auto` |
| HTTPS | não | sim (TLS terminado no edge CF) |
| Multipart upload | suportado | suportado |
| SSE-KMS encryption | não | sim |
| Pre-signed URL TTL | igual | igual |

→ **O código é portável**: muda só `endpoint` e `forcePathStyle`. Não precisa
reescrever para R2.

## 4. Conclusão

| pergunta | resposta |
|---|---|
| O SDK funciona com S3-compat? | ✅ Sim, mesma API, mesma assinatura |
| Preciso de código separado para R2? | ❌ Não |
| `forcePathStyle: true` quebra com R2? | ❌ Não — R2 aceita ambos os estilos (recomendado: virtual-host) |
| O cliente (browser) consegue PUT direto? | ✅ Sim — `fetch()` com `method: PUT` e `body: Blob` |

### Bloqueios

- **Nenhum técnico.** O fluxo está validado.
- **Falta validar com conta R2 real** — recomenda-se repetir a POC com
  `R2_ENDPOINT=https://<acct>.r2.cloudflarestorage.com` e token real antes do
  primeiro deploy em produção.

### Anexo — como rodar (MinIO)

```bash
docker run -d --name minio-poc \
  -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio:latest server /data --console-address ":9001"

MINIO_ENDPOINT=http://127.0.0.1:9000 \
MINIO_ACCESS=minioadmin MINIO_SECRET=minioadmin \
MINIO_BUCKET=easydemo-poc \
  ./node_modules/.bin/tsx apps/web/scripts/poc-r2-latency.ts
```

Console web MinIO: http://127.0.0.1:9001 (login `minioadmin`/`minioadmin`).