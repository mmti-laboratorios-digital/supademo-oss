# ADR-006: Cloudflare R2 + Cloudflare CDN para object storage e serving público

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Tech lead EasyDemo, Founding engineer

## Context and Problem Statement

EasyDemo armazena **assets binários** públicos e privados:

- **Screenshots de steps** (~50 KB cada, 1–50 por demo) — público, hot path.
- **Audio TTS (narração)** (~200 KB por step) — público.
- **OG images geradas** — público, cache-friendly.
- **Backups pgBackRest** (1–10 GB compactados) — privado, write-only.
- **Avatares de usuário** (workspace branding) — público.

Estimativa inicial: 100 GB storage + **5 TB egress/mês** (cada demo vista 1k vezes × 1 MB = 1 TB; 1000 demos = 1 PB teórico; capamos com cache no CDN).

Custos de egress são o **maior vilão** em SaaS com mídia (S3 cobra $0.09/GB egress). Precisamos decidir o provedor de storage.

## Decision Drivers

- **Custo de egress** (público é dominado por leitura).
- **Latência para o BR** (precisa ser < 100 ms de cache edge).
- **Compatibilidade S3** (presigned URLs, multipart upload, SDKs prontos).
- **Integração com Cloudflare** (CDN, Workers, WAF).
- **Conformidade LGPD** (residência de dados).

## Considered Options

1. **Cloudflare R2** (S3-compatible, egress grátis).
2. **AWS S3** (padrão da indústria, $0.09/GB egress).
3. **MinIO self-hosted** no mesmo VPS Hetzner.
4. **Backblaze B2** (S3-compatible, $0.01/GB egress).
5. **DigitalOcean Spaces** ($5/mês + $0.02/GB egress).

## Decision Outcome

**Chosen option: "Cloudflare R2 + Cloudflare CDN/Workers"**, porque **egress grátis** é decisivo em SaaS público de mídia. Em 1 TB egress/mês, S3 custaria $90 vs R2 $0 — economia anual > R$ 5.000.

Estrutura de buckets:

- `demo-public` — screenshots, OG images, áudio TTS — CDN habilitado, custom domain `cdn.easydemo.io`.
- `demo-private` — backups pgBackRest, exports DSR — CDN desabilitado, acesso via presigned URL curta (TTL 5 min).

Integração:

- **SDK oficial**: `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (R2 é S3-API compatível).
- **Custom domain** `cdn.easydemo.io` apontando para `demo-public.r2.dev` (ou bucket-level domain) — CNAME via Cloudflare.
- **Cache rules**: `Cache-Control: public, max-age=31536000, immutable` para imagens (versionadas por path com hash).
- **Privacy regions** habilitado (EU) para backups de DSR — garante residência UE.

### Positive Consequences

- **Egress zero** para servir assets públicos.
- Latência ~30 ms do Brasil via PoPs Cloudflare (São Paulo, Rio).
- S3 API = ecossistema gigante (presigned URL, multipart, SDKs em qualquer linguagem).
- Integração nativa com Cloudflare Workers (edge logic sem servidor).
- Storage barato ($0.015/GB/mês).
- R2 suporta **event notifications** (queue) via Cloudflare Queues — futuro.

### Negative Consequences

- **Operação A** (PUT, LIST, COPY) custa $4.50 por milhão (vs S3 $5).
- Vendor lock-in **moderado** (R2 não é 100% S3 — alguns edge cases diferentes, ex.: sem ACLs granulares).
- Custom domain só via Cloudflare (lock-in de provedor de DNS).
- Limite de 1000 PUTs/segundo por chave (mitigável com sharding `key/<hash>`).
- **LGPD**: backups em R2 ficam em região `EEUR` (EU); adequado para clientes UE. Para clientes BR, considerar replicar para `LA' ou região específica se exigido.

### Follow-ups

- Configurar **Access policy** com Cloudflare Access para o bucket privado (acesso só por service token da VPS).
- Adotar **Cloudflare Images** para variantes responsivas se necessário (Fase 2).

## Pros and Cons of the Options

### Cloudflare R2 (escolhido)

- Good, egress grátis.
- Good, S3 API.
- Good, CDN integrada.
- Good, residência UE disponível.
- Bad, vendor lock-in DNS.
- Bad, PUT custa (mitigável).

### AWS S3

- Good, padrão de mercado, integra com tudo.
- Good, ecossistema enorme (Athena, Glue, Lambda@Edge).
- Bad, egress $0.09/GB — proibitivo em escala.
- Bad, requer AWS account + IAM cuidado.

### MinIO self-hosted

- Good, S3 API, self-hosted, controle total.
- Good, custo zero marginal.
- Bad, consome RAM do VPS (~200 MB).
- Bad, **ainda tem custo de egress** se servido direto (precisa Cloudflare como proxy, vira arquitetura complexa).
- Bad, precisa de backup próprio do MinIO (meta-recursivo).
- Bad, single point of failure no VPS.

### Backblaze B2

- Good, $0.005/GB storage, $0.01/GB egress (10× mais barato que S3).
- Good, S3 API.
- Bad, sem CDN integrada (precisa BunnyCDN ou Cloudflare na frente — soma complexidade).
- Bad, PoPs limitados (US + EU).

### DigitalOcean Spaces

- Good, $5/mês fixo + CDN básica.
- Good, UI simples.
- Bad, $0.02/GB egress.
- Bad, CDN básica (sem Workers, sem rules avançadas).
- Bad, sem multi-region storage.

## References

- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Cloudflare R2 S3 API](https://developers.cloudflare.com/r2/api/s3/api/)
- [AWS S3 pricing](https://aws.amazon.com/s3/pricing/)
- [Backblaze B2 pricing](https://www.backblaze.com/b2/cloud-storage-pricing.html)
- RFC EasyDemo §2.2 — Storage e CDN
- `research/tech/backend-stack.md` §5 — storage comparison