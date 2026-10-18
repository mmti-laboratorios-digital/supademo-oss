#!/usr/bin/env -S node --experimental-strip-types
/**
 * POC-2: Postgres RLS overhead em queries reais do nosso app
 *
 * Modelo: dois tenants A e B com 10k `demos` e 50k `demo_steps` cada.
 * Mede p50/p95 das queries mais comuns com e sem RLS FORCE e com/sem
 * índice em tenant_id.
 *
 * Rodar:
 *   PG_URL=postgres://bench:bench@127.0.0.1:6543/bench \
 *     ./node_modules/.bin/tsx apps/web/scripts/poc-rls-bench.ts
 */
import pg from "pg";
const { Client } = pg;
import { performance as perf } from "node:perf_hooks";

const URL = process.env.PG_URL ?? "postgres://bench:bench@127.0.0.1:6543/bench";
const REPS = Number(process.env.REPS ?? "200");
const WARMUPS = Number(process.env.WARMUPS ?? "20");

type Stats = { p50: number; p95: number; p99: number; mean: number; min: number; max: number };
function stats(v: number[]): Stats {
  if (v.length === 0) return { p50: 0, p95: 0, p99: 0, mean: 0, min: 0, max: 0 };
  const s = [...v].sort((a, b) => a - b);
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  return {
    min: s[0],
    max: s[s.length - 1],
    mean: m,
    p50: s[Math.floor(s.length * 0.5)],
    p95: s[Math.floor(s.length * 0.95)],
    p99: s[Math.floor(s.length * 0.99)],
  };
}
function fmt(s: Stats) {
  return `min=${s.min.toFixed(2)} p50=${s.p50.toFixed(2)} p95=${s.p95.toFixed(2)} p99=${s.p99.toFixed(2)} mean=${s.mean.toFixed(2)} (ms)`;
}

async function bench(name: string, fn: () => Promise<void>, client: Client): Promise<Stats> {
  const samples: number[] = [];
  for (let i = 0; i < WARMUPS; i++) await fn();
  for (let i = 0; i < REPS; i++) {
    const t0 = perf.now();
    await fn();
    samples.push(perf.now() - t0);
  }
  const s = stats(samples);
  console.log(`  ${name.padEnd(38)} ${fmt(s)}`);
  return s;
}

async function setup(client: Client) {
  console.log("→ setup schema + dados sintéticos (10k demos + 50k steps por tenant)");
  await client.query("DROP TABLE IF EXISTS demo_steps, demos CASCADE;");
  await client.query(`
    CREATE TABLE demos (
      id bigserial PRIMARY KEY,
      tenant_id text NOT NULL,
      title text NOT NULL,
      status text NOT NULL DEFAULT 'draft',
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE demo_steps (
      id bigserial PRIMARY KEY,
      tenant_id text NOT NULL,
      demo_id bigint NOT NULL,
      position int NOT NULL,
      payload jsonb NOT NULL DEFAULT '{}'::jsonb
    );
  `);

  // índice em tenant_id será criado depois — primeiro cenário roda SEM índice
  // (simula "esqueci de criar índice"; mede baseline ruim)

  console.log("→ inserindo 10k demos por tenant");
  await client.query(`
    INSERT INTO demos (tenant_id, title, status)
    SELECT 'A',
        'Demo #' || g,
        CASE WHEN g % 7 = 0 THEN 'published' ELSE 'draft' END
    FROM generate_series(1, 10000) g;
    INSERT INTO demos (tenant_id, title, status)
    SELECT 'B',
        'Demo #' || g,
        CASE WHEN g % 7 = 0 THEN 'published' ELSE 'draft' END
    FROM generate_series(1, 10000) g;
  `);

  console.log("→ inserindo 50k demo_steps por tenant");
  await client.query(`
    INSERT INTO demo_steps (tenant_id, demo_id, position, payload)
    SELECT 'A',
        ((g - 1) % 10000) + 1,
        ((g - 1) % 5) + 1,
        jsonb_build_object('caption', 'Step ' || g)
    FROM generate_series(1, 50000) g;
    INSERT INTO demo_steps (tenant_id, demo_id, position, payload)
    SELECT 'B',
        ((g - 1) % 10000) + 1,
        ((g - 1) % 5) + 1,
        jsonb_build_object('caption', 'Step ' || g)
    FROM generate_series(1, 50000) g;
  `);

  await client.query("ANALYZE demos; ANALYZE demo_steps;");
}

async function rlsEnable(client: Client) {
  await client.query("ALTER TABLE demos ENABLE ROW LEVEL SECURITY;");
  await client.query("ALTER TABLE demo_steps ENABLE ROW LEVEL SECURITY;");
  await client.query(`
    CREATE POLICY tenant_isolation_demos ON demos
      USING (tenant_id = current_setting('app.tenant_id', true));
    CREATE POLICY tenant_isolation_steps ON demo_steps
      USING (tenant_id = current_setting('app.tenant_id', true));
    ALTER TABLE demos FORCE ROW LEVEL SECURITY;
    ALTER TABLE demo_steps FORCE ROW LEVEL SECURITY;
  `);
}

async function rlsDisable(client: Client) {
  await client.query(`
    ALTER TABLE demos NO FORCE ROW LEVEL SECURITY;
    ALTER TABLE demo_steps NO FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation_demos ON demos;
    DROP POLICY IF EXISTS tenant_isolation_steps ON demo_steps;
    ALTER TABLE demos DISABLE ROW LEVEL SECURITY;
    ALTER TABLE demo_steps DISABLE ROW LEVEL SECURITY;
  `);
}

async function indexCreate(client: Client) {
  await client.query("CREATE INDEX idx_demos_tenant ON demos (tenant_id);");
  await client.query("CREATE INDEX idx_steps_tenant ON demo_steps (tenant_id);");
  await client.query("CREATE INDEX idx_steps_demo ON demo_steps (demo_id);");
}

async function indexDrop(client: Client) {
  await client.query("DROP INDEX IF EXISTS idx_demos_tenant, idx_steps_tenant, idx_steps_demo;");
}

async function setTenant(client: Client, t: string) {
  await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [t]);
}

async function main() {
  const client = new Client({ connectionString: URL });
  await client.connect();
  const pgver = (await client.query("SELECT version()")).rows[0].version;
  console.log(`Conectado: ${pgver}`);

  const out: Array<{ cenario: string; stats: Stats }> = [];

  await setup(client);
  // começa sem índices (será criado no cenário B)
  await indexDrop(client);

  // ---- cenário A: SEM RLS, SEM ÍNDICE ----
  await rlsDisable(client);
  console.log("\n# A) sem RLS, sem índice em tenant_id");
  await setTenant(client, "A");
  out.push({ cenario: "A1) list demos LIMIT 50 (sem RLS, sem idx)", stats: await bench("list demos LIMIT 50", async () => {
    await client.query("SELECT id, title, status, created_at FROM demos WHERE tenant_id = 'A' ORDER BY created_at DESC LIMIT 50");
  }, client) });
  out.push({ cenario: "A2) list steps of demo (sem RLS, sem idx)", stats: await bench("list steps of demo", async () => {
    const r = await client.query<{ id: string }>("SELECT id FROM demos WHERE tenant_id = 'A' LIMIT 1");
    await client.query("SELECT id, position, payload FROM demo_steps WHERE demo_id = $1 ORDER BY position", [r.rows[0].id]);
  }, client) });

  // ---- cenário B: SEM RLS, COM ÍNDICE ----
  await indexCreate(client);
  await client.query("ANALYZE demos; ANALYZE demo_steps;");
  console.log("\n# B) sem RLS, COM índice");
  out.push({ cenario: "B1) list demos LIMIT 50 (sem RLS, com idx)", stats: await bench("list demos LIMIT 50", async () => {
    await client.query("SELECT id, title, status, created_at FROM demos WHERE tenant_id = 'A' ORDER BY created_at DESC LIMIT 50");
  }, client) });
  out.push({ cenario: "B2) list steps of demo (sem RLS, com idx)", stats: await bench("list steps of demo", async () => {
    const r = await client.query<{ id: string }>("SELECT id FROM demos WHERE tenant_id = 'A' LIMIT 1");
    await client.query("SELECT id, position, payload FROM demo_steps WHERE demo_id = $1 ORDER BY position", [r.rows[0].id]);
  }, client) });

  // ---- cenário C: COM RLS FORCE, COM ÍNDICE ----
  await rlsEnable(client);
  await client.query("ANALYZE demos; ANALYZE demo_steps;");
  console.log("\n# C) COM RLS FORCE, COM índice");
  await setTenant(client, "A");
  out.push({ cenario: "C1) list demos LIMIT 50 (RLS, com idx)", stats: await bench("list demos LIMIT 50", async () => {
    await client.query("SELECT id, title, status, created_at FROM demos ORDER BY created_at DESC LIMIT 50");
  }, client) });
  out.push({ cenario: "C2) list steps of demo (RLS, com idx)", stats: await bench("list steps of demo", async () => {
    const r = await client.query<{ id: string }>("SELECT id FROM demos LIMIT 1");
    await client.query("SELECT id, position, payload FROM demo_steps WHERE demo_id = $1 ORDER BY position", [r.rows[0].id]);
  }, client) });

  // ---- cenário D: COM RLS FORCE, SEM ÍNDICE ----
  await indexDrop(client);
  await client.query("ANALYZE demos; ANALYZE demo_steps;");
  console.log("\n# D) COM RLS FORCE, SEM índice (pior caso)");
  out.push({ cenario: "D1) list demos LIMIT 50 (RLS, sem idx)", stats: await bench("list demos LIMIT 50", async () => {
    await client.query("SELECT id, title, status, created_at FROM demos ORDER BY created_at DESC LIMIT 50");
  }, client) });
  out.push({ cenario: "D2) list steps of demo (RLS, sem idx)", stats: await bench("list steps of demo", async () => {
    const r = await client.query<{ id: string }>("SELECT id FROM demos LIMIT 1");
    await client.query("SELECT id, position, payload FROM demo_steps WHERE demo_id = $1 ORDER BY position", [r.rows[0].id]);
  }, client) });

  console.log("\n=== resumo (ms) ===");
  console.table(out.map((o) => ({ cenario: o.cenario, p50: o.stats.p50, p95: o.stats.p95, p99: o.stats.p99, mean: o.stats.mean })));

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});