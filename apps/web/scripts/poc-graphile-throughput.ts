#!/usr/bin/env -S node --experimental-strip-types
/**
 * POC-6: graphile-worker smoke (throughput)
 *
 * Estratégia: sobe um worker contra o Postgres local (mesmo container do
 * POC-2), enfileira N jobs triviais (incrementar um contador e gravar
 * timestamp), aguarda drain e mede:
 *   - tempo total (enqueue → execução)
 *   - throughput (jobs/s)
 *   - latência enqueue→execução (p50, p95, p99)
 *
 * Rodar: PG_URL=postgres://bench:bench@127.0.0.1:6543/bench \
 *        ./node_modules/.bin/tsx apps/web/scripts/poc-graphile-throughput.ts
 */
import { performance as perf } from "node:perf_hooks";
import pg from "pg";
const { Client } = pg;
import { makeWorkerUtils, run, WorkerUtils, WorkerOptions } from "graphile-worker";

const URL = process.env.PG_URL ?? "postgres://bench:bench@127.0.0.1:6543/bench";
const N = Number(process.env.JOBS ?? "1000");
const CONCURRENCY = Number(process.env.CONCURRENCY ?? "10");

async function main() {
  const client = new Client({ connectionString: URL });
  await client.connect();

  // cria tabela de auditoria para o worker medir timestamps reais
  await client.query(`
    DROP TABLE IF EXISTS poc_worker_events;
    CREATE TABLE poc_worker_events (
      id bigserial PRIMARY KEY,
      payload jsonb NOT NULL,
      started_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await client.end();

  const completedAt = new Map<number, number>();
  const enqueuedAt = new Map<number, number>();
  let counter = 0;

  const task: WorkerOptions["taskList"] = {
    ping: async (payload: { id: number }) => {
      const id = payload.id;
      // medir tempo até começar a execução
      completedAt.set(id, perf.now());
      counter++;
      const c2 = new Client({ connectionString: URL });
      await c2.connect();
      try {
        await c2.query("INSERT INTO poc_worker_events (payload) VALUES ($1)", [
          { id, gotAt: new Date().toISOString() },
        ]);
      } finally {
        await c2.end();
      }
    },
  };

  // Sobe worker em background
  const runner = await run({
    connectionString: URL,
    concurrency: CONCURRENCY,
    noHandleSignals: true,
    pollInterval: 50,
    taskList: task,
  });

  // enfileira N jobs o mais rápido possível
  const utils: WorkerUtils = await makeWorkerUtils({ connectionString: URL });
  const t0 = perf.now();
  const jobs: Array<Promise<unknown>> = [];
  for (let i = 0; i < N; i++) {
    enqueuedAt.set(i, perf.now());
    jobs.push(utils.addJob("ping", { id: i }));
  }
  const tEnq = perf.now() - t0;

  await Promise.all(jobs);
  await utils.release();

  // espera drenar — counter = N
  const waitStart = perf.now();
  while (counter < N) {
    if (perf.now() - waitStart > 60_000) throw new Error(`worker não drenou em 60s (counter=${counter}/${N})`);
    await new Promise((r) => setTimeout(r, 50));
  }
  const tDrain = perf.now() - waitStart;
  const totalMs = perf.now() - t0;

  // latências
  const latencies: number[] = [];
  for (let i = 0; i < N; i++) {
    const enq = enqueuedAt.get(i)!;
    const done = completedAt.get(i)!;
    latencies.push(done - enq);
  }
  latencies.sort((a, b) => a - b);
  const pick = (q: number) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * q))];

  await runner.stop();

  console.log("=== POC-6 graphile-worker ===");
  console.log(`- Postgres: ${URL}`);
  console.log(`- jobs enfileirados: ${N}`);
  console.log(`- concurrency do worker: ${CONCURRENCY}`);
  console.log(`- tempo total (enqueue → drain): ${totalMs.toFixed(0)}ms`);
  console.log(`- tempo enqueue puro: ${tEnq.toFixed(0)}ms`);
  console.log(`- tempo aguardando drain: ${tDrain.toFixed(0)}ms`);
  console.log(`- throughput: ${((N / (totalMs / 1000)).toFixed(1))} jobs/s`);
  console.log(
    `- latência enqueue→execução (ms): min=${latencies[0].toFixed(1)} p50=${pick(0.5).toFixed(1)} p95=${pick(0.95).toFixed(1)} p99=${pick(0.99).toFixed(1)} max=${latencies[latencies.length - 1].toFixed(1)}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});