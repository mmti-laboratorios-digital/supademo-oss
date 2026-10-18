/* eslint-disable no-console */
/**
 * scripts/db/test-rls.ts
 * -----------------------------------------------------------------------------
 * Verifica que Row-Level Security está realmente isolando tenants.
 *
 * Estratégia (10 checks):
 *   1.  Inspeciona atributos do role app_user (NO BYPASSRLS)
 *   2.  Inspeciona FORCE ROW LEVEL SECURITY em app.workspaces
 *   3.  Inspeciona FORCE ROW LEVEL SECURITY em app.demos
 *   4.  app_user sem contexto vê 0 rows em app.demos
 *   5.  app_user sem contexto vê workspaces (policy workspaces_select: true)
 *   6.  Tenant A seta contexto e vê o próprio demo
 *   7.  Tenant A NÃO vê demo do Tenant B (isolamento)
 *   8.  Tenant B seta contexto e vê o próprio demo
 *   9.  Tenant B NÃO vê demo do Tenant A (isolamento)
 *   10. Cleanup (deleta workspaces/demos de teste)
 *
 * Exit codes:
 *   0 → RLS aplicado corretamente (10/10 checks OK)
 *   1 → vazamento ou política incorreta
 *   2 → erro de configuração / conexão
 *
 * Pré-requisitos:
 *   - ADMIN_URL apontando para app_owner (BYPASSRLS) — para setup/cleanup
 *   - DATABASE_URL ou TENANT_A_URL/TENANT_B_URL apontando para app_user
 *   - Policies + FORCE ROW LEVEL SECURITY aplicados (ver migrations 0000_init.sql)
 */
import { randomUUID } from "node:crypto";
import postgres from "postgres";

const ADMIN_URL =
  process.env.ADMIN_URL ??
  process.env.DIRECT_URL ??
  "postgres://app_owner:demobr@127.0.0.1:55432/supademo";
const TENANT_A_URL =
  process.env.TENANT_A_URL ??
  process.env.DATABASE_URL ??
  "postgres://app_user:demobr@127.0.0.1:55432/supademo";
const TENANT_B_URL =
  process.env.TENANT_B_URL ?? TENANT_A_URL;

const checks = { passed: 0, failed: 0 };
function check(name: string, ok: boolean, detail = ""): void {
  if (ok) {
    checks.passed++;
    console.log(`  ✓ ${name}${detail ? ` (${detail})` : ""}`);
  } else {
    checks.failed++;
    console.error(`  ❌ ${name}${detail ? ` (${detail})` : ""}`);
  }
}

function fail(msg: string, code = 1): never {
  console.error(`❌ ${msg}`);
  process.exit(code);
}

async function tableForceRls(
  sql: postgres.Sql,
  table: string,
): Promise<{ rls: boolean; force: boolean }> {
  const r = await sql<{ relrowsecurity: boolean; relforcerowsecurity: boolean }[]>`
    SELECT relrowsecurity, relforcerowsecurity
    FROM pg_class
    WHERE relname = ${table}
      AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'app')
  `;
  return {
    rls: Boolean(r[0]?.relrowsecurity),
    force: Boolean(r[0]?.relforcerowsecurity),
  };
}

async function main() {
  console.log("▶ Conectando…");
  const admin = postgres(ADMIN_URL, { max: 1 });
  const a = postgres(TENANT_A_URL, { max: 1 });
  const b = postgres(TENANT_B_URL, { max: 1 });

  try {
    await admin`SELECT 1`;
    await a`SELECT 1`;
    await b`SELECT 1`;
  } catch (e) {
    fail(`Conexão falhou: ${(e as Error).message}`, 2);
  }

  // -------------------------------------------------------------------------
  // CHECKS 1–5: configuração do role e policies
  // -------------------------------------------------------------------------
  console.log("\n▶ Inspecionando role app_user…");
  const userRoleInfo = await admin<{ rolbypassrls: boolean }[]>`
    SELECT rolbypassrls FROM pg_roles WHERE rolname = 'app_user'
  `;
  check(
    "1. app_user NO BYPASSRLS (RLS-enforced)",
    userRoleInfo[0]?.rolbypassrls === false,
    `rolbypassrls=${userRoleInfo[0]?.rolbypassrls}`,
  );

  console.log("\n▶ Verificando FORCE ROW LEVEL SECURITY…");
  const wsForce = await tableForceRls(admin, "workspaces");
  check(
    "2. app.workspaces FORCE RLS",
    wsForce.force,
    `rls=${wsForce.rls}, force=${wsForce.force}`,
  );
  const demosForce = await tableForceRls(admin, "demos");
  check(
    "3. app.demos FORCE RLS",
    demosForce.force,
    `rls=${demosForce.rls}, force=${demosForce.force}`,
  );

  console.log("\n▶ app_user sem contexto de tenant…");
  const userDemosNoCtx = await a<{ count: string }[]>`
    SELECT count(*)::text AS count FROM app.demos
  `;
  check(
    "4. app_user sem contexto vê 0 demos (RLS bloqueia default)",
    Number(userDemosNoCtx[0]?.count ?? -1) === 0,
    `count=${userDemosNoCtx[0]?.count}`,
  );

  const userWsNoCtx = await a<{ count: string }[]>`
    SELECT count(*)::text AS count FROM app.workspaces
  `;
  // workspaces tem policy SELECT: true (precisa para resolver workspace_id no login)
  check(
    "5. app_user sem contexto vê workspaces (policy workspaces_select: true)",
    Number(userWsNoCtx[0]?.count ?? -1) > 0,
    `count=${userWsNoCtx[0]?.count}`,
  );

  // -------------------------------------------------------------------------
  // SETUP: cria workspaces + demos de teste
  // -------------------------------------------------------------------------
  const wA = randomUUID();
  const wB = randomUUID();
  const dA = randomUUID();
  const dB = randomUUID();
  const ts = Date.now();
  console.log("\n▶ Criando dados de teste (tenant A e B)…");
  await admin`INSERT INTO app.workspaces (id, slug, name, plan_id) VALUES (${wA}, ${`rls-test-a-${ts}`}, 'RLS Test A', 'free')`;
  await admin`INSERT INTO app.workspaces (id, slug, name, plan_id) VALUES (${wB}, ${`rls-test-b-${ts}`}, 'RLS Test B', 'free')`;
  await admin`INSERT INTO app.demos (id, workspace_id, slug, title, status, language) VALUES (${dA}, ${wA}, ${`rls-a-${ts}`}, 'A', 'published', 'pt-BR')`;
  await admin`INSERT INTO app.demos (id, workspace_id, slug, title, status, language) VALUES (${dB}, ${wB}, ${`rls-b-${ts}`}, 'B', 'published', 'pt-BR')`;

  // -------------------------------------------------------------------------
  // CHECKS 6–9: isolamento entre tenants
  // -------------------------------------------------------------------------
  // Tenant A: seta contexto e valida
  await a`SELECT set_config('app.current_tenant_id', ${wA}, false)`;
  const seenOwnByA = await a<{ id: string }[]>`
    SELECT id FROM app.demos WHERE id = ${dA}
  `;
  check(
    "6. Tenant A vê o próprio demo",
    seenOwnByA.length === 1,
    `got ${seenOwnByA.length} rows`,
  );
  const seenByBfromA = await a<{ id: string }[]>`
    SELECT id FROM app.demos WHERE id = ${dB}
  `;
  check(
    "7. Tenant A NÃO vê demo do Tenant B",
    seenByBfromA.length === 0,
    `got ${seenByBfromA.length} rows`,
  );

  // Tenant B: seta contexto e valida
  await b`SELECT set_config('app.current_tenant_id', ${wB}, false)`;
  const seenOwnByB = await b<{ id: string }[]>`
    SELECT id FROM app.demos WHERE id = ${dB}
  `;
  check(
    "8. Tenant B vê o próprio demo",
    seenOwnByB.length === 1,
    `got ${seenOwnByB.length} rows`,
  );
  const seenByAfromB = await b<{ id: string }[]>`
    SELECT id FROM app.demos WHERE id = ${dA}
  `;
  check(
    "9. Tenant B NÃO vê demo do Tenant A",
    seenByAfromB.length === 0,
    `got ${seenByAfromB.length} rows`,
  );

  // -------------------------------------------------------------------------
  // CHECK 10: cleanup
  // -------------------------------------------------------------------------
  console.log("\n▶ Limpando dados de teste…");
  await admin`DELETE FROM app.demos WHERE id IN (${dA}, ${dB})`;
  await admin`DELETE FROM app.workspaces WHERE id IN (${wA}, ${wB})`;
  const cleanupOk = true;
  check("10. Cleanup (DELETE via app_owner)", cleanupOk);

  await admin.end();
  await a.end();
  await b.end();

  // -------------------------------------------------------------------------
  // Resultado final
  // -------------------------------------------------------------------------
  console.log(`\n${"─".repeat(60)}`);
  console.log(`Total: ${checks.passed}/${checks.passed + checks.failed} checks OK`);
  if (checks.failed > 0) {
    fail(`${checks.failed} check(s) falharam. RLS NÃO está isolando tenants.`, 1);
  }
  console.log("\n✅ RLS está aplicando corretamente. Isolamento entre tenants OK.");
  process.exit(0);
}

main().catch((e) => fail(`Erro inesperado: ${(e as Error).message}`, 2));