import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
/**
 * apps/web/scripts/seed-test.ts
 *
 * Popula o banco de TESTES com workspace "Teste" + demo "tour-exemplo" + 3 steps.
 *
 * Idempotente — pode rodar múltiplas vezes.
 * Diferente do scripts/seed.ts (que popula dados de produção).
 *
 * Pré-requisito: container docker supademo-test + schema 0000_init.sql aplicado.
 *
 * Uso:
 *   DATABASE_URL=postgres://app_owner:demobr@127.0.0.1:55432/supademo \
 *     pnpm --filter web exec tsx scripts/seed-test.ts
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";
import { demos, leads, plans, steps, workspaces } from "../db/schema/app";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://app_owner:demobr@127.0.0.1:55432/supademo";

const TEST_WORKSPACE_SLUG = "teste";
const TEST_DEMO_SLUG = "tour-exemplo";

async function main() {
  const client = postgres(DATABASE_URL, { max: 1, prepare: false });
  const db = drizzle(client, { schema, casing: "snake_case" });

  console.log("▶ Seeding test workspace + demo…");

  // 1. Plans (já populado pela migration, mas idempotente)
  await db
    .insert(plans)
    .values([
      {
        id: "free",
        namePtBr: "Free",
        nameEn: "Free",
        priceBrlCents: 0,
        features: ["3 demos", "10 steps/demo"],
      },
      {
        id: "pro",
        namePtBr: "Pro",
        nameEn: "Pro",
        priceBrlCents: 4900,
        features: ["Demos ilimitados", "30 steps/demo"],
      },
    ])
    .onConflictDoNothing();

  // 2. Workspace "Teste"
  const [existing] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, TEST_WORKSPACE_SLUG))
    .limit(1);

  let workspaceId: string;
  if (existing) {
    workspaceId = existing.id;
    console.log(`  ✓ Workspace "${TEST_WORKSPACE_SLUG}" já existe (${workspaceId})`);
  } else {
    const [ws] = await db
      .insert(workspaces)
      .values({
        slug: TEST_WORKSPACE_SLUG,
        name: "Workspace Teste",
        planId: "free",
      })
      .returning();
    workspaceId = ws.id;
    console.log(`  ✓ Workspace "${TEST_WORKSPACE_SLUG}" criado (${workspaceId})`);
  }

  // 3. Demo "tour-exemplo" — published (para o player público renderizar)
  const [existingDemo] = await db
    .select()
    .from(demos)
    .where(eq(demos.slug, TEST_DEMO_SLUG))
    .limit(1);

  let demoId: string;
  if (existingDemo) {
    demoId = existingDemo.id;
    console.log(`  ✓ Demo "${TEST_DEMO_SLUG}" já existe (${demoId})`);
  } else {
    const [d] = await db
      .insert(demos)
      .values({
        workspaceId,
        slug: TEST_DEMO_SLUG,
        title: "Tour de Exemplo",
        description: "Demo pública de teste usada pelos testes E2E",
        language: "pt-BR",
        status: "published",
        leadFormEnabled: true,
        finalCta: {
          type: "url",
          value: "https://exemplo.com.br/sign-up",
          label: "Quero testar grátis",
        },
      })
      .returning();
    demoId = d.id;
    console.log(`  ✓ Demo "${TEST_DEMO_SLUG}" criada (${demoId})`);
  }

  // 4. 3 steps — cada um com imagem SVG inline base64
  const existingSteps = await db.select().from(steps).where(eq(steps.demoId, demoId));

  if (existingSteps.length >= 3) {
    console.log(`  ✓ ${existingSteps.length} steps já existem`);
  } else {
    // Limpa steps existentes para re-seed
    await db.execute(sql`DELETE FROM app.steps WHERE demo_id = ${demoId}`);

    const stepData = [
      {
        position: 1,
        sourceUrl: "https://exemplo.com.br/dashboard",
        sourceTitle: "Dashboard principal",
        caption: "Bem-vindo ao nosso produto!",
        screenshotR2Key: "demos/seed-test/step-1.webp",
        hotspot: { type: "pointer", x: 50, y: 50 },
      },
      {
        position: 2,
        sourceUrl: "https://exemplo.com.br/features",
        sourceTitle: "Recursos",
        caption: "Estes são os principais recursos",
        screenshotR2Key: "demos/seed-test/step-2.webp",
        hotspot: { type: "callout", x: 30, y: 40 },
      },
      {
        position: 3,
        sourceUrl: "https://exemplo.com.br/pricing",
        sourceTitle: "Preços",
        caption: "Veja nossos planos",
        screenshotR2Key: "demos/seed-test/step-3.webp",
        hotspot: { type: "area", x: 10, y: 10, w: 80, h: 20 },
      },
    ];

    for (const s of stepData) {
      await db.insert(steps).values({
        demoId,
        ...s,
      });
    }
    console.log(`  ✓ 3 steps criados`);
  }

  // 5. Lead capturado de teste
  const existingLeads = await db.select().from(leads).where(eq(leads.demoId, demoId));

  if (existingLeads.length === 0) {
    await db.insert(leads).values({
      workspaceId,
      demoId,
      name: "Lead de Teste",
      email: "lead-teste@example.com",
      consentText: "Autorizo o contato conforme LGPD. (lead de teste seed-test)",
    });
    console.log(`  ✓ 1 lead de teste criado`);
  } else {
    console.log(`  ✓ ${existingLeads.length} leads já existem`);
  }

  console.log("\n✅ Seed de teste concluído.");
  console.log(`   Workspace: ${TEST_WORKSPACE_SLUG}`);
  console.log(`   Demo:      /d/${TEST_DEMO_SLUG}`);
  await client.end();
}

main().catch((e) => {
  console.error("❌", (e as Error).message);
  process.exit(1);
});
