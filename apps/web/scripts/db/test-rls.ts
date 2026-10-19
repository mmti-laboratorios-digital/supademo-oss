import { sql } from "drizzle-orm";
/**
 * apps/web/scripts/db/test-rls.ts
 *
 * Verifica isolamento de Row-Level Security entre tenants.
 *
 * Estratégia:
 *  - Usa `app_owner` (BYPASSRLS) APENAS para criar tenants — fora de policies.
 *  - Usa `app_user` (RLS-enforced) para TODOS os testes de leitura/escrita.
 *
 * Cenário:
 *  1. Cria 2 workspaces (tenant_a, tenant_b) via app_owner.
 *  2. Como app_user + tenant_a → insere demo + vê o próprio demo.
 *  3. Como app_user + tenant_b → NÃO vê o demo do tenant_a.
 *  4. Como app_user sem contexto → zero resultados.
 *  5. Como app_user + tenant_b tentando ler workspaces do tenant_a → bloqueado.
 *  6. Como app_user sem contexto tentando INSERT → bloqueado pela WITH CHECK.
 *
 * Exit code: 0 = RLS ok, 1 = vazou, 2 = erro de setup.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../db/schema";
import { demos, workspaces } from "../../db/schema/app";

const ADMIN_URL =
  process.env.ADMIN_URL ??
  process.env.DIRECT_URL ??
  "postgres://app_owner:demobr@127.0.0.1:55432/supademo";

const RUNTIME_URL =
  process.env.DATABASE_URL ?? "postgres://app_user:demobr@127.0.0.1:55432/supademo";

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
    // 0. Limpa tenants de testes anteriores
    console.log("▶ Setup: limpando tenants de teste…");
    await adminDb.execute(sql`
      DELETE FROM app.workspaces WHERE slug IN ('tenant-a', 'tenant-b')
    `);

    // 1. Criar 2 workspaces via admin (BYPASSRLS ok, isso é setup legítimo)
    console.log("\n▶ Criando tenant_a e tenant_b (via app_owner/BYPASSRLS)…");
    const [tenantA] = await adminDb
      .insert(workspaces)
      .values({ slug: "tenant-a", name: "Tenant A RLS Test", planId: "free" })
      .returning();
    const [tenantB] = await adminDb
      .insert(workspaces)
      .values({ slug: "tenant-b", name: "Tenant B RLS Test", planId: "free" })
      .returning();
    record("tenant_a criado (admin)", Boolean(tenantA?.id), tenantA?.id ?? "");
    record("tenant_b criado (admin)", Boolean(tenantB?.id), tenantB?.id ?? "");

    if (!tenantA || !tenantB) {
      console.error("❌ Falha ao criar tenants");
      process.exit(2);
    }

    // Verifica role ativo
    const who = await runtimeClient<{ current_user: string; usename: string }[]>`
      SELECT current_user, current_user AS usename
    `;
    console.log(`\n▶ Rodando testes como: ${who[0]?.current_user} (sem BYPASSRLS)`);

    // 2. Como app_user + tenant_a → insere demo + vê o próprio
    console.log("\n▶ [tenant_a] Inserindo demo…");
    await runtimeClient`SELECT set_config('app.current_tenant_id', ${tenantA.id}, false)`;
    const [demo] = await runtimeDb
      .insert(demos)
      .values({
        workspaceId: tenantA.id,
        slug: "rls-demo-tenant-a",
        title: "Demo do Tenant A",
        status: "published",
      })
      .returning();
    record("demo em tenant_a", Boolean(demo?.id), demo?.id ?? "");

    // 3. Como tenant_a → deve ver o demo
    console.log("\n▶ [tenant_a] Lendo o próprio demo…");
    await runtimeClient`SELECT set_config('app.current_tenant_id', ${tenantA.id}, false)`;
    const seenByA = await runtimeDb.select().from(demos).where(sql`slug = 'rls-demo-tenant-a'`);
    record("tenant_a vê o próprio demo", seenByA.length === 1, `viu ${seenByA.length} demo(s)`);

    // 4. Como tenant_b → NÃO deve ver o demo (CRÍTICO)
    console.log("\n▶ [tenant_b] Lendo demos (não deve ver nada do tenant_a)…");
    await runtimeClient`SELECT set_config('app.current_tenant_id', ${tenantB.id}, false)`;
    const seenByB = await runtimeDb.select().from(demos).where(sql`slug = 'rls-demo-tenant-a'`);
    record(
      "tenant_b NÃO vê demo do tenant_a",
      seenByB.length === 0,
      `viu ${seenByB.length} demo(s) (esperado 0)`,
    );

    // 5. Workspaces têm policy `workspaces_select USING (true)` por design
    //    (descoberta pública via slug). Mas a policy de MODIFY restringe
    //    ao próprio tenant. Aqui verificamos que tenant_b consegue LER
    //    (descoberta) mas NÃO consegue MODIFICAR workspaces alheios.
    console.log("\n▶ [tenant_b] UPDATE workspace do tenant_a (deve falhar)…");
    await runtimeClient`SELECT set_config('app.current_tenant_id', ${tenantB.id}, false)`;
    let updateBlocked = false;
    let updateErr = "";
    try {
      await runtimeDb
        .update(workspaces)
        .set({ name: "HACKED by tenant_b" })
        .where(sql`slug = 'tenant-a'`);
      // Se update "passou", checamos se o nome realmente mudou
      const after = await runtimeDb.select().from(workspaces).where(sql`slug = 'tenant-a'`);
      if (after[0]?.name !== "HACKED by tenant_b") {
        updateBlocked = true;
        updateErr = "0 rows affected (RLS filtered)";
      }
    } catch (e) {
      updateBlocked = true;
      updateErr = (e as Error).message.split("\n")[0];
    }
    record(
      "tenant_b NÃO consegue UPDATE workspace do tenant_a",
      updateBlocked,
      updateErr ? `(${updateErr})` : "",
    );

    // 6. SELECT sem contexto (null tenant) → deve zerar
    console.log("\n▶ [null] Lendo demos sem contexto de tenant…");
    await runtimeClient`SELECT set_config('app.current_tenant_id', '', false)`;
    const seenNull = await runtimeDb.select().from(demos).where(sql`slug = 'rls-demo-tenant-a'`);
    record(
      "sem tenant → zero resultados",
      seenNull.length === 0,
      `viu ${seenNull.length} demo(s) (esperado 0)`,
    );

    // 7. INSERT sem contexto de tenant → deve falhar (WITH CHECK)
    console.log("\n▶ [null] INSERT demo sem contexto (deve falhar)…");
    await runtimeClient`SELECT set_config('app.current_tenant_id', '', false)`;
    let insertBlocked = false;
    let insertErr = "";
    try {
      await runtimeDb.insert(demos).values({
        workspaceId: tenantA.id,
        slug: "rls-orphan-insert",
        title: "Orphan",
      });
    } catch (e) {
      insertBlocked = true;
      insertErr = (e as Error).message.split("\n")[0];
    }
    record("INSERT sem tenant é bloqueado", insertBlocked, insertErr ? `(${insertErr})` : "");

    // 8. INSERT com contexto errado (tenant_b tentando inserir em tenant_a)
    console.log("\n▶ [tenant_b] INSERT demo apontando workspace do tenant_a (deve falhar)…");
    await runtimeClient`SELECT set_config('app.current_tenant_id', ${tenantB.id}, false)`;
    let wrongInsertBlocked = false;
    let wrongErr = "";
    try {
      await runtimeDb.insert(demos).values({
        workspaceId: tenantA.id,
        slug: "rls-cross-tenant",
        title: "Cross-tenant",
      });
    } catch (e) {
      wrongInsertBlocked = true;
      wrongErr = (e as Error).message.split("\n")[0];
    }
    record("INSERT cross-tenant é bloqueado", wrongInsertBlocked, wrongErr ? `(${wrongErr})` : "");

    // 9. Cleanup via admin
    console.log("\n▶ Cleanup…");
    await adminDb.execute(sql`
      DELETE FROM app.workspaces WHERE slug IN ('tenant-a', 'tenant-b')
    `);
    record("cleanup", true);

    // Sumário
    const failed = log.filter((l) => !l.ok);
    console.log("\n────────────── RESUMO ──────────────");
    for (const l of log) {
      const mark = l.ok ? "OK   " : "FAIL ";
      console.log(`${mark} ${l.step}`);
    }
    console.log("────────────────────────────────────");

    if (failed.length > 0) {
      console.error(`\n❌ ${failed.length} check(s) falharam — RLS vazou!`);
      process.exit(1);
    }

    console.log("\n✅ RLS OK — isolamento de tenant funcional.");
  } catch (e) {
    console.error("❌ Erro durante o teste:", (e as Error).message);
    process.exit(2);
  } finally {
    await adminClient.end();
    await runtimeClient.end();
  }
}

main().catch((e) => {
  console.error("❌", (e as Error).message);
  process.exit(2);
});
