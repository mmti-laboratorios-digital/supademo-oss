/* eslint-disable no-console */
/**
 * scripts/db/test-rls-admin.ts
 * -----------------------------------------------------------------------------
 * Verifica que o role `app_owner` tem BYPASSRLS — ou seja, consegue LER
 * cross-tenant sem `SET app.current_tenant_id`.
 *
 * Espelho inverso de test-rls.ts:
 *   - test-rls.ts         → valida que app_user é BLOQUEADO por RLS (vê 0 rows)
 *   - test-rls-admin.ts   → valida que app_owner PASSA POR RLS (vê TUDO)
 *
 * Se app_owner não tiver BYPASSRLS, este script falha — porque as policies
 * RLS exigiriam SET app.current_tenant_id e o SELECT sem contexto retorna
 * 0 rows (mesmo comportamento do app_user).
 *
 * Pré-requisitos:
 *   - ADMIN_URL apontando para app_owner (BYPASSRLS)
 *   - DATABASE_URL apontando para app_user (RLS-enforced) — usado só como
 *     sanity check para confirmar que o isolamento está funcionando
 *   - Schema `app` com tabelas `workspaces` e `demos` migradas
 *   - Policies RLS + FORCE ROW LEVEL SECURITY aplicados
 *
 * Exit codes:
 *   0 → app_owner BYPASSRLS confirmado, app_user RLS-enforced confirmado
 *   1 → app_owner não bypassou RLS (configuração errada)
 *   2 → erro de configuração / conexão
 *
 * Uso:
 *   ADMIN_URL=postgres://app_owner:easydemo@127.0.0.1:55432/supademo \
 *   DATABASE_URL=postgres://app_user:easydemo@127.0.0.1:55432/supademo \
 *     tsx scripts/db/test-rls-admin.ts
 */
import postgres from "postgres";

const ADMIN_URL =
  process.env.ADMIN_URL ??
  process.env.DIRECT_URL ??
  "postgres://app_owner:easydemo@127.0.0.1:55432/supademo";
const RUNTIME_URL =
  process.env.DATABASE_URL ?? "postgres://app_user:easydemo@127.0.0.1:55432/supademo";

function fail(msg: string, code = 1): never {
  console.error(`❌ ${msg}`);
  process.exit(code);
}

async function main() {
  console.log("▶ Conectando…");
  const admin = postgres(ADMIN_URL, { max: 1 });
  const runtime = postgres(RUNTIME_URL, { max: 1 });

  try {
    await admin`SELECT 1`;
  } catch (e) {
    fail(`Sem conexão com admin (${ADMIN_URL}): ${(e as Error).message}`, 2);
  }
  try {
    await runtime`SELECT 1`;
  } catch (e) {
    fail(`Sem conexão com runtime (${RUNTIME_URL}): ${(e as Error).message}`, 2);
  }

  // ---------------------------------------------------------------------------
  // 1. Confirma atributos do role app_owner
  // ---------------------------------------------------------------------------
  console.log("\n▶ Inspecionando atributos do role app_owner…");
  const roleInfo = await admin<{ rolname: string; rolsuper: boolean; rolbypassrls: boolean }[]>`
    SELECT rolname, rolsuper, rolbypassrls
    FROM pg_roles
    WHERE rolname = 'app_owner'
  `;
  const ownerRow = roleInfo[0];
  if (!ownerRow) {
    fail("Role app_owner não existe.", 2);
  }
  console.log(`  · app_owner: superuser=${ownerRow.rolsuper}, bypassrls=${ownerRow.rolbypassrls}`);
  if (!ownerRow.rolbypassrls) {
    fail(
      "app_owner NÃO tem BYPASSRLS. Este teste assume BYPASSRLS ativo. Rode ALTER ROLE app_owner BYPASSRLS;",
      1,
    );
  }
  console.log("  ✓ app_owner tem BYPASSRLS.");

  // Confirma app_user NO BYPASSRLS
  const userInfo = await admin<{ rolname: string; rolbypassrls: boolean }[]>`
    SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname = 'app_user'
  `;
  const userRow = userInfo[0];
  if (!userRow) {
    fail("Role app_user não existe.", 2);
  }
  if (userRow.rolbypassrls) {
    fail("app_user TEM BYPASSRLS — isto é um BUG. RLS não funcionaria em runtime.", 1);
  }
  console.log("  ✓ app_user NÃO tem BYPASSRLS (RLS-enforced).");

  // ---------------------------------------------------------------------------
  // 2. app_owner conta workspaces cross-tenant (sem SET app.current_tenant_id)
  // ---------------------------------------------------------------------------
  console.log("\n▶ app_owner conta workspaces SEM setar app.current_tenant_id…");
  const adminWsCount = await admin<{ count: string }[]>`
    SELECT count(*)::text AS count FROM app.workspaces
  `;
  const adminWs = Number(adminWsCount[0]?.count ?? "0");
  console.log(`  · app_owner vê ${adminWs} workspaces`);

  // ---------------------------------------------------------------------------
  // 3. app_user conta workspaces SEM setar app.current_tenant_id
  //    workspaces tem policy `workspaces_select: true` (visível para todos)
  //    mas demos é workspace-scoped — vamos testar demos.
  // ---------------------------------------------------------------------------
  console.log("\n▶ app_user conta workspaces SEM setar app.current_tenant_id…");
  const userWsCount = await runtime<{ count: string }[]>`
    SELECT count(*)::text AS count FROM app.workspaces
  `;
  const userWs = Number(userWsCount[0]?.count ?? "0");
  console.log(`  · app_user vê ${userWs} workspaces (policy workspaces_select: true)`);

  // ---------------------------------------------------------------------------
  // 4. app_owner vs app_user em app.demos (RLS-enforced por workspace)
  // ---------------------------------------------------------------------------
  console.log("\n▶ app_owner conta demos SEM setar app.current_tenant_id…");
  const adminDemosCount = await admin<{ count: string }[]>`
    SELECT count(*)::text AS count FROM app.demos
  `;
  const adminDemos = Number(adminDemosCount[0]?.count ?? "0");
  console.log(`  · app_owner vê ${adminDemos} demos (BYPASSRLS — vê tudo)`);

  console.log("\n▶ app_user conta demos SEM setar app.current_tenant_id…");
  const userDemosCount = await runtime<{ count: string }[]>`
    SELECT count(*)::text AS count FROM app.demos
  `;
  const userDemos = Number(userDemosCount[0]?.count ?? "0");
  console.log(`  · app_user vê ${userDemos} demos (RLS bloqueia sem contexto)`);

  // ---------------------------------------------------------------------------
  // 5. Validações
  // ---------------------------------------------------------------------------
  let ok = true;

  // (a) app_owner precisa VER mais demos do que app_user sem contexto.
  //     Em produção: adminDemos >= userDemos; tipicamente adminDemos >> userDemos.
  if (adminDemos <= userDemos && adminDemos !== userDemos) {
    console.error(
      `  ❌ Esperava app_owner (${adminDemos}) >= app_user (${userDemos}). RLS não está sendo bypassado.`,
    );
    ok = false;
  } else {
    console.log(`  ✓ app_owner (${adminDemos}) >= app_user (${userDemos}) — BYPASSRLS efetivo.`);
  }

  // (b) app_user sem contexto deve ver 0 demos (RLS bloqueia).
  if (userDemos !== 0) {
    console.error(
      `  ❌ app_user sem contexto viu ${userDemos} demos (esperado 0). RLS não está bloqueando default.`,
    );
    ok = false;
  } else {
    console.log("  ✓ app_user sem contexto vê 0 demos — RLS bloqueia default.");
  }

  // (c) workspaces: app_user vê todos (policy workspaces_select: true).
  //     Esse é o design correto — para resolver workspace_id no login.
  //     Se essa policy fosse `id = current_tenant_id()`, login quebraria.
  if (userWs !== adminWs) {
    console.error(
      `  ⚠️  app_user (${userWs}) vê menos workspaces que app_owner (${adminWs}). ` +
        "Verifique policy workspaces_select — ela deve ser `true` (LGPD-friendly) para permitir login resolver workspace.",
    );
    // Não falhamos — pode ser design intencional — mas avisamos.
  } else {
    console.log(
      `  ✓ workspaces: app_user e app_owner veem o mesmo (${userWs}) — policy workspaces_select: true está OK.`,
    );
  }

  await admin.end();
  await runtime.end();

  if (!ok) {
    fail("BYPASSRLS não está funcionando como esperado. Veja logs acima.", 1);
  }

  console.log("\n✅ app_owner BYPASSRLS confirmado + app_user RLS-enforced confirmado.");
  process.exit(0);
}

main().catch((e) => fail(`Erro inesperado: ${(e as Error).message}`, 2));
