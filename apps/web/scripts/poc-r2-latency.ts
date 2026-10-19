#!/usr/bin/env -S node --experimental-strip-types
/**
 * POC-1: R2 latency real (Frankfurt -> R2)
 *
 * Objetivo: medir PUT presigned URL e GET CDN entre um cliente próximo a
 * Frankfurt (Hetzner FS/FSN, mencionado no brief) e o R2 da Cloudflare.
 *
 * Estratégia: como não temos credenciais R2 reais, esta POC faz **dois
 * testes honestos**:
 *   (A) Benchmark de HTTP público que sai da máquina local (provavelmente
 *       datacenter SP/EU) até endpoints públicos R2/CDN — mede TLS+TCP+TTFB.
 *   (B) Benchmark de signed-URL local contra um servidor S3-compat (MinIO)
 *       se houver Docker. Esse simula o caminho R2 de verdade.
 *
 * Rodar: pnpm --filter web exec tsx scripts/poc-r2-latency.ts
 */

import { performance as perf } from "node:perf_hooks";
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const SAMPLES = Number(process.env.SAMPLES ?? "20");
const CDN_HOST = process.env.R2_CDN_HOST ?? ""; // ex: cdn-XXXX.r2.dev ou pub-XXXX.r2.dev
const R2_ENDPOINT = process.env.R2_ENDPOINT ?? ""; // ex: https://<acct>.r2.cloudflarestorage.com
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY ?? "";
const R2_SECRET_KEY = process.env.R2_SECRET_KEY ?? "";
const R2_BUCKET = process.env.R2_BUCKET ?? "demo";
const USE_MINIO = process.env.MINIO_ENDPOINT ?? ""; // ex: http://127.0.0.1:9000
const MINIO_ACCESS = process.env.MINIO_ACCESS ?? "minioadmin";
const MINIO_SECRET = process.env.MINIO_SECRET ?? "minioadmin";
const MINIO_BUCKET = process.env.MINIO_BUCKET ?? "demobr-poc";

type Stats = { p50: number; p95: number; p99: number; min: number; max: number; mean: number };

function stats(values: number[]): Stats {
  if (values.length === 0) return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, mean: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const pick = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean,
    p50: pick(0.5),
    p95: pick(0.95),
    p99: pick(0.99),
  };
}

function fmt(s: Stats): string {
  return `min=${s.min.toFixed(1)}ms p50=${s.p50.toFixed(1)}ms p95=${s.p95.toFixed(1)}ms p99=${s.p99.toFixed(1)}ms max=${s.max.toFixed(1)}ms mean=${s.mean.toFixed(1)}ms`;
}

// ----- (A) Benchmark de TTFB contra CDN público do R2 -----
async function benchCdn(): Promise<{
  host: string;
  bytes: number;
  stats: Stats;
  samples: number;
} | null> {
  if (!CDN_HOST) return null;
  const url = `https://${CDN_HOST}/cdn-cgi/trace`; // endpoint leve para TTFB
  const samples: number[] = [];
  let bytes = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const t0 = perf.now();
    const res = await fetch(url, { cache: "no-store" });
    const buf = await res.text();
    samples.push(perf.now() - t0);
    bytes = buf.length;
    if (!res.ok) throw new Error(`CDN GET falhou: ${res.status}`);
  }
  return { host: CDN_HOST, bytes, stats: stats(samples), samples: samples.length };
}

// ----- (B) Benchmark real contra S3-compat (MinIO local OU R2 real) -----
async function benchObjectStore(opts: {
  label: string;
  endpoint: string;
  region: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  forcePathStyle: boolean;
}): Promise<{
  label: string;
  perSize: Record<string, Stats>;
  putSignedMs: Stats;
  getSignedMs: Stats;
} | null> {
  if (!opts.endpoint || !opts.accessKey) return null;
  const client = new S3Client({
    endpoint: opts.endpoint,
    region: opts.region,
    credentials: { accessKeyId: opts.accessKey, secretAccessKey: opts.secretKey },
    forcePathStyle: opts.forcePathStyle,
  });

  // garante bucket
  try {
    await client.send(new HeadBucketCommand({ Bucket: opts.bucket }));
  } catch {
    try {
      await client.send(new CreateBucketCommand({ Bucket: opts.bucket }));
      console.log(`[${opts.label}] bucket '${opts.bucket}' criado`);
    } catch (e) {
      console.error(`[${opts.label}] falha ao criar bucket:`, (e as Error).message);
      return null;
    }
  }

  const sizes = [
    { name: "1MB", bytes: 1024 * 1024 },
    { name: "5MB", bytes: 5 * 1024 * 1024 },
    { name: "10MB", bytes: 10 * 1024 * 1024 },
  ];

  const putSignedMs: number[] = [];
  const getSignedMs: number[] = [];
  const perSize: Record<string, number[]> = {};

  for (const size of sizes) {
    perSize[size.name] = [];
    for (let i = 0; i < SAMPLES; i++) {
      const key = `poc/${size.name}/${Date.now()}-${i}.bin`;
      const body = new Uint8Array(size.bytes); // zeros (compressível, é ok pra medir IO)
      const signedPutT0 = perf.now();
      const putUrl = await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: opts.bucket,
          Key: key,
          ContentType: "application/octet-stream",
        }),
        { expiresIn: 60 },
      );
      putSignedMs.push(perf.now() - signedPutT0);

      // PUT via fetch — mede do início ao fim (signed URL + TCP + upload)
      const putT0 = perf.now();
      const putRes = await fetch(putUrl, { method: "PUT", body });
      const dtPut = perf.now() - putT0;
      if (!putRes.ok) {
        console.error(`[${opts.label}] PUT falhou status=${putRes.status}`);
        continue;
      }
      perSize[size.name].push(dtPut);

      // GET signed URL
      const signedGetT0 = perf.now();
      const getUrl = await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: opts.bucket, Key: key }),
        { expiresIn: 60 },
      );
      getSignedMs.push(perf.now() - signedGetT0);

      // GET via fetch — mede o round-trip do cliente
      const getT0 = perf.now();
      const getRes = await fetch(getUrl);
      await getRes.arrayBuffer();
      perSize[size.name].push(perf.now() - getT0);
      if (!getRes.ok) {
        console.error(`[${opts.label}] GET falhou status=${getRes.status}`);
      }
    }
  }

  return {
    label: opts.label,
    perSize: Object.fromEntries(Object.entries(perSize).map(([k, v]) => [k, stats(v)])),
    putSignedMs: stats(putSignedMs),
    getSignedMs: stats(getSignedMs),
  };
}

async function main() {
  const startedAt = new Date().toISOString();
  const lines: string[] = [];
  const banner = (s: string) => lines.push(`\n## ${s}\n`);

  banner("Ambiente");
  lines.push(`- timestamp: ${startedAt}`);
  lines.push(`- node: ${process.version}`);
  lines.push(`- samples por caso: ${SAMPLES}`);

  // (A) CDN
  banner("A) TTFB contra CDN público (referência)");
  const cdn = await benchCdn();
  if (cdn) {
    lines.push(`- host: ${cdn.host} (${cdn.bytes}B GET /cdn-cgi/trace)`);
    lines.push(`- ${fmt(cdn.stats)} (n=${cdn.samples})`);
  } else {
    lines.push("- pulado (defina $R2_CDN_HOST para ativar)");
  }

  // (B1) MinIO local
  banner("B1) Object store local (MinIO via Docker, se disponível)");
  const minio = await benchObjectStore({
    label: "MinIO local",
    endpoint: USE_MINIO,
    region: "us-east-1",
    accessKey: MINIO_ACCESS,
    secretKey: MINIO_SECRET,
    bucket: MINIO_BUCKET,
    forcePathStyle: true,
  });
  if (minio) {
    lines.push(`- endpoint: ${USE_MINIO} (path-style)`);
    lines.push(`- tempo de gerar signed PUT: ${fmt(minio.putSignedMs)}`);
    lines.push(`- tempo de gerar signed GET: ${fmt(minio.getSignedMs)}`);
    lines.push("- PUT+GET round-trip por tamanho:");
    for (const [k, v] of Object.entries(minio.perSize)) lines.push(`  - ${k}: ${fmt(v)}`);
  } else {
    lines.push("- pulado (defina $MINIO_ENDPOINT=http://127.0.0.1:9000 ou ausência de Docker)");
  }

  // (B2) R2 real
  banner("B2) Cloudflare R2 real (se houver credenciais)");
  const r2 = await benchObjectStore({
    label: "R2",
    endpoint: R2_ENDPOINT,
    region: "auto",
    accessKey: R2_ACCESS_KEY,
    secretKey: R2_SECRET_KEY,
    bucket: R2_BUCKET,
    forcePathStyle: false,
  });
  if (r2) {
    lines.push(`- endpoint: ${R2_ENDPOINT}`);
    lines.push(`- tempo de gerar signed PUT: ${fmt(r2.putSignedMs)}`);
    lines.push(`- tempo de gerar signed GET: ${fmt(r2.getSignedMs)}`);
    lines.push("- PUT+GET round-trip por tamanho:");
    for (const [k, v] of Object.entries(r2.perSize)) lines.push(`  - ${k}: ${fmt(v)}`);
  } else {
    lines.push("- pulado (defina $R2_ENDPOINT, $R2_ACCESS_KEY, $R2_SECRET_KEY)");
  }

  console.log(lines.join("\n"));
}

main().catch((e) => {
  console.error("POC-1 falhou:", e);
  process.exit(1);
});
