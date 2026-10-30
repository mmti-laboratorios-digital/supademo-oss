import { sql } from "drizzle-orm";
/**
 * apps/web/scripts/db/test-rls-admin.ts
 *
 * Verifica que `app_owner` tem BYPASSRLS (pode ler/escrever sem contexto de tenant)
 * enquanto `app_user` é RLS-enforced.
 *
 * Estratégia:
 *  - Como app_owner (BYPASSRLS) → cria 1 demo e espera ver todos os demos.
 *  - Como app_user sem contexto → espera ver 0 demos (RLS bloqueia).
 *  - Como app_user com tenant context → vê apenas os próprios.
 *
 * Exit code: 0 = BYPASSRLS + RLS OK, 1 = vazou.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../db/schema";
import { demos, workspaces } from "../../db/schema/app";

const ADMIN_URL =
  process.env.ADMIN_URL ??
  process.env.DIRECT_URL ??
  "postgres://app_owner:easydemo@127.0.0.1:55432/easydemo";

const RUNTIME_URL =
  process.env.DATABASE_URL ?? "postgres://app_user:easydemo@127.0.0.1:55432/easydemo";

type StepLog = { step: string; ok: boolean; detail: string };
const log: StepLog[] = [];

function record(step: string, ok: boolean, detail = ""): void {
  const mark = ok ? "✅" : "❌";
  console.log(`${mark} ${step}${detail ? ` — ${detail}` : ""}`);
  log.push({ step, ok, detail });
}

async function main(): Promise<void> {
  const adminClient = postgres(ADMIN_URL, { max: 1, prepare: false });
  const runtimeClient = postgres(RUNTIME_URL, { max: 1, prepare: false });
  const adminDb = drizzle(adminClient, { schema, casing: "snake_case" });
  const runtimeDb = drizzle(runtimeClient, { schema, casing: "snake_case" });

  try {
    // 0. Verifica atributos dos roles
    console.log("▶ Verificando atributos dos roles…");
    const roles = await adminClient<
      { rolname: string; rolsuper: boolean; rolbypassrls: boolean }[]
    >`
      SELECT rolname, rolsuper, rolbypassrls
      FROM pg_roles
      WHERE rolname IN ('app_owner', 'app_user', 'readonly')
      ORDER BY rolname
    `;
    const owner = roles.find((r) => r.rolname === "app_owner");
    const user = roles.find((r) => r.rolname === "app_user");
    console.log(`  · app_owner: superuser=${owner?.rolsuper}, bypassrls=${owner?.rolbypassrls}`);
    console.log(`  · app_user:  superuser=${user?.rolsuper}, bypassrls=${user?.rolbypassrls}`);
    record("app_owner tem BYPASSRLS", owner?.rolbypassrls === true && owner?.rolsuper === false);
    record(
      "app_user NÃO tem BYPASSRLS (RLS-enforced)",
      user?.rolbypassrls === false && user?.rolsuper === false,
    );

    // 1. Setup: limpar workspaces de testes anteriores
    console.log("\n▶ Setup: limpando tenants de teste…");
    await adminDb.execute(sql`
      DELETE FROM app.workspaces WHERE slug IN ('tenant-admin-a', 'tenant-admin-b')
    `);

    // 2. Cria 2 workspaces como admin_owner (BYPASSRLS ok)
    const [tenantA] = await adminDb
      .insert(workspaces)
      .values({ slug: "tenant-admin-a", name: "Admin Tenant A", planId: "free" })
      .returning();
    const [tenantB] = await adminDb
      .insert(workspaces)
      .values({ slug: "tenant-admin-b", name: "Admin Tenant B", planId: "free" })
      .returning();
    if (!tenantA || !tenantB) {
      console.error("❌ Falha ao criar tenants");
      process.exit(2);
    }

    // Insere 1 demo em cada tenant (via app_owner)
    await adminDb.insert(demos).values({
      workspaceId: tenantA.id,
      slug: "admin-demo-a",
      title: "Demo Admin A",
      status: "published",
    });
    await adminDb.insert(demos).values({
      workspaceId: tenantB.id,
      slug: "admin-demo-b",
      title: "Demo Admin B",
      status: "published",
    });

    // 3. Como app_owner (BYPASSRLS) → vê TODOS os demos sem contexto de tenant
    console.log("\n▶ [app_owner] Lendo TODOS os demos (BYPASSRLS — sem contexto)…");
    await adminClient`SELECT set_config('app.current_tenant_id', '', false)`;
    const seenByAdmin = await adminDb.select().from(demos);
    console.log(`  · app_owner vê ${seenByAdmin.length} demos (BYPASSRLS — vê tudo)`);
    record(
      "app_owner (BYPASSRLS) vê todos os demos sem contexto",
      seenByAdmin.length >= 2,
      `viu ${seenByAdmin.length} demo(s)`,
    );

    // 4. Como app_user sem contexto → RLS bloqueia → 0 resultados
    console.log("\n▶ [app_user] Lendo demos sem contexto (RLS bloqueia)…");
    await runtimeClient`SELECT set_config('app.current_tenant_id', '', false)`;
    const seenByUserNull = await runtimeDb.select().from(demos);
    console.log(`  · app_user vê ${seenByUserNull.length} demos (RLS bloqueia sem contexto)`);
    record(
      "app_user sem contexto vê 0 demos — RLS bloqueia default",
      seenByUserNull.length === 0,
      `viu ${seenByUserNull.length} demo(s) (esperado 0)`,
    );

    // 5. Como app_user com tenant_a → vê só o próprio
    console.log("\n▶ [app_user + tenant_a] Lendo demos…");
    await runtimeClient`SELECT set_config('app.current_tenant_id', ${tenantA.id}, false)`;
    const seenByA = await runtimeDb.select().from(demos);
    const onlyA = seenByA.every((d) => d.workspaceId === tenantA.id);
    record(
      "app_user com tenant_a vê APENAS demos do próprio tenant",
      seenByA.length === 1 && onlyA,
      `viu ${seenByA.length} demo(s) (esperado 1, all tenantA=${onlyA})`,
    );

    // 6. Como app_user com tenant_b → vê só o próprio (NÃO o do A)
    console.log("\n▶ [app_user + tenant_b] Lendo demos…");
    await runtimeClient`SELECT set_config('app.current_tenant_id', ${tenantB.id}, false)`;
    const seenByB = await runtimeDb.select().from(demos);
    const onlyB = seenByB.every((d) => d.workspaceId === tenantB.id);
    record(
      "app_user com tenant_b vê APENAS demos do próprio tenant",
      seenByB.length === 1 && onlyB,
      `viu ${seenByB.length} demo(s) (esperado 1, all tenantB=${onlyB})`,
    );

    // 7. Resumo
    console.log("\n────────────── RESUMO ──────────────");
    for (const entry of log) {
      console.log(`${entry.ok ? "OK   " : "FAIL "} ${entry.step}`);
    }
    console.log("────────────────────────────────────");

    const failed = log.filter((l) => !l.ok);
    if (failed.length > 0) {
      console.error(
        `\n❌ ${failed.length}/${log.length} checks falharam — BYPASSRLS/RLS não está configurado corretamente.`,
      );
      process.exit(1);
    }

    console.log("\n✅ app_owner BYPASSRLS confirmado + app_user RLS-enforced confirmado.");

    // Cleanup
    console.log("\n▶ Cleanup…");
    await adminDb.execute(sql`
      DELETE FROM app.workspaces WHERE slug IN ('tenant-admin-a', 'tenant-admin-b')
    `);
    console.log("✅ cleanup");
  } finally {
    await adminClient.end();
    await runtimeClient.end();
  }
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(2);
});
