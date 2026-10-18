#!/usr/bin/env -S node --experimental-strip-types
/**
 * POC-5: Helmet + cold-start de um servidor Next.js real (mínimo)
 *
 * Estratégia (dois blocos):
 *  (A) Express + helmet vs Express puro: comparação de headers retornados
 *      em /healthz. Mostrar quais headers de segurança aparecem.
 *  (B) Cold-start do Next.js real: roda `next dev` numa porta isolada,
 *      espera a mensagem "Ready", mede tempo até 1ª resposta.
 *
 *  Bloco B é **opcional** (controlado por RUN_NEXT=1) — `next dev` no
 *  monorepo DemoBR puxa todo o build cache, então o cold-start real só
 *  é confiável em CI limpo.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { performance as perf } from "node:perf_hooks";
import express from "express";
import helmet from "helmet";
import { setTimeout as sleep } from "node:timers/promises";

const RUN_NEXT = process.env.RUN_NEXT === "1";
const NEXT_PORT = Number(process.env.NEXT_PORT ?? "4321");
const PROBE = "/api/health";
const REPS = Number(process.env.REPS ?? "20");

function spawnNext(): ChildProcess {
  return spawn("pnpm", ["--filter", "web", "exec", "next", "dev", "--port", String(NEXT_PORT)], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });
}

async function waitForReady(child: ChildProcess, timeoutMs = 60_000): Promise<number> {
  const t0 = perf.now();
  return new Promise<number>((resolve, reject) => {
    let settled = false;
    const onData = (b: Buffer) => {
      const s = b.toString();
      // dev mode mostra "Ready in" quando termina o boot do dev server
      if ((s.includes("Ready") || s.includes("Local:") || s.includes("started server")) && !settled) {
        settled = true;
        resolve(perf.now() - t0);
      }
    };
    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);
    setTimeout(() => {
      if (!settled) reject(new Error(`timeout esperando Next ready: ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

async function fetchOnce(port: number, path: string): Promise<{ status: number; t: number; headers: Record<string, string> }> {
  const t0 = perf.now();
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => (headers[k] = v));
  return { status: res.status, t: perf.now() - t0, headers };
}

async function measureHelmet() {
  console.log("\n=== (A) helmet: headers com/sem ===");
  const app1 = express();
  app1.use(helmet());
  app1.get("/healthz", (_req, res) => res.json({ ok: true }));
  const s1 = app1.listen(0);

  const app2 = express();
  app2.get("/healthz", (_req, res) => res.json({ ok: true }));
  const s2 = app2.listen(0);

  try {
    const p1 = (s1.address() as { port: number }).port;
    const p2 = (s2.address() as { port: number }).port;

    const r1 = await fetch(`http://127.0.0.1:${p1}/healthz`);
    const h1: Record<string, string> = {};
    r1.headers.forEach((v, k) => (h1[k] = v));

    const r2 = await fetch(`http://127.0.0.1:${p2}/healthz`);
    const h2: Record<string, string> = {};
    r2.headers.forEach((v, k) => (h2[k] = v));

    // diferença
    const diff = Object.keys(h1).filter((k) => !(k in h2));
    const summary = {
      withHelmet_n: Object.keys(h1).length,
      withoutHelmet_n: Object.keys(h2).length,
      addedHeaders: diff,
      spot: {
        contentSecurityPolicy: h1["content-security-policy"]?.slice(0, 80),
        xContentTypeOptions: h1["x-content-type-options"],
        xFrameOptions: h1["x-frame-options"],
        referrerPolicy: h1["referrer-policy"],
        strictTransportSecurity: h1["strict-transport-security"]?.slice(0, 80),
        crossOriginOpenerPolicy: h1["cross-origin-opener-policy"],
        crossOriginResourcePolicy: h1["cross-origin-resource-policy"],
        originAgentCluster: h1["origin-agent-cluster"],
      },
    };
    console.log(JSON.stringify(summary, null, 2));
    return summary;
  } finally {
    s1.close();
    s2.close();
  }
}

async function measureNextColdStart() {
  console.log("\n=== (B) Next.js dev cold-start ===");
  const child = spawnNext();
  let readyMs = 0;
  let firstReqMs = 0;
  const warm: number[] = [];
  try {
    readyMs = await waitForReady(child);
    console.log(`  Next reported ready em ${readyMs.toFixed(0)}ms`);

    const first = await fetchOnce(NEXT_PORT, PROBE);
    firstReqMs = first.t;
    console.log(`  1ª req (${PROBE}): ${firstReqMs.toFixed(0)}ms status=${first.status}`);
    if (first.status === 404) {
      console.log(`  (rota ${PROBE} não existe — é esperado se a app não tem healthcheck)`);
    }

    for (let i = 0; i < REPS; i++) {
      const r = await fetchOnce(NEXT_PORT, PROBE);
      warm.push(r.t);
    }
    const warmMean = warm.reduce((a, b) => a + b, 0) / warm.length;
    console.log(`  warm (n=${REPS}) média=${warmMean.toFixed(1)}ms`);

    return { readyMs, firstReqMs, warmMean };
  } catch (e) {
    console.log(`  cold-start skipped: ${(e as Error).message}`);
    return null;
  } finally {
    child.kill("SIGTERM");
    await sleep(200);
    child.kill("SIGKILL");
  }
}

async function main() {
  const a = await measureHelmet();
  const b = RUN_NEXT ? await measureNextColdStart() : null;

  console.log("\n=== resumo POC-5 ===");
  console.log(JSON.stringify({ helmet: a, nextColdStart: b }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});