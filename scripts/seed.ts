/**
 * scripts/seed.ts
 *
 * Popula o banco com workspace demo + 1 demo com 3 steps fictícios.
 * Idempotente — pode rodar múltiplas vezes.
 *
 * Uso:
 *   DATABASE_URL=postgres://app_owner:CHANGEME_owner@localhost:55432/supademo \
 *     tsx scripts/seed.ts
 *
 * Nota: porta 55432 (não 5432) é convenção do projeto — ver infra/docker-compose.yml.
 */

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { demos, members, plans, steps, subscriptions, workspaces } from "../apps/web/db/schema/app";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://app_owner:CHANGEME_owner@localhost:55432/supademo";

async function main() {
  const sql = postgres(DATABASE_URL, { max: 1, prepare: false });
  const db = drizzle(sql, { casing: "snake_case" });

  console.log("🌱 Seeding…");

  // 1) Workspace demo
  const [ws] = await db
    .insert(workspaces)
    .values({
      clerkOrgId: "seed_clerk_org_demo",
      slug: "acme",
      name: "Acme Demo Workspace",
      locale: "pt-BR",
      planId: "pro",
    })
    .onConflictDoUpdate({
      target: workspaces.slug,
      set: { name: "Acme Demo Workspace" },
    })
    .returning();

  console.log(`  ✓ workspace: ${ws.slug} (${ws.id})`);

  // 2) Member (owner)
  const [member] = await db
    .insert(members)
    .values({
      workspaceId: ws.id,
      email: "owner@acme.com.br",
      name: "Owner Acme",
      role: "owner",
      emailVerifiedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();
  if (member) console.log(`  ✓ member: ${member.email}`);

  // 3) Subscription Pro
  await db
    .insert(subscriptions)
    .values({
      workspaceId: ws.id,
      planId: "pro",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000),
    })
    .onConflictDoNothing();

  // 4) Demo com 3 steps
  const [demo] = await db
    .insert(demos)
    .values({
      workspaceId: ws.id,
      slug: "demo-tour-do-produto",
      title: "Tour do produto — Acme",
      description: "Conheça as principais funcionalidades da plataforma Acme.",
      status: "published",
      language: "pt-BR",
      leadFormEnabled: true,
      leadFormConsentText:
        "Autorizo o Acme a me contatar sobre o produto demonstrado, conforme LGPD.",
      finalCta: {
        type: "whatsapp",
        value: "5511999999999",
        label: "Falar com um especialista",
      },
      publishedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  if (demo) {
    console.log(`  ✓ demo: ${demo.slug} (${demo.id})`);

    const seedSteps = [
      {
        position: 1,
        screenshotR2Key: `demos/${demo.id}/steps/1.webp`,
        sourceUrl: "https://app.acme.com/dashboard",
        sourceTitle: "Dashboard — Acme",
        caption: "Bem-vindo! Veja aqui um resumo da sua operação.",
        hotspot: { type: "pointer" as const, x: 30, y: 40 },
      },
      {
        position: 2,
        screenshotR2Key: `demos/${demo.id}/steps/2.webp`,
        sourceUrl: "https://app.acme.com/clients",
        sourceTitle: "Clientes",
        caption: "Gerencie todos os clientes em um só lugar.",
        hotspot: { type: "area" as const, x: 10, y: 20, w: 80, h: 50 },
      },
      {
        position: 3,
        screenshotR2Key: `demos/${demo.id}/steps/3.webp`,
        sourceUrl: "https://app.acme.com/reports",
        sourceTitle: "Relatórios",
        caption: "Relatórios prontos para enviar ao seu time.",
        hotspot: { type: "callout" as const, x: 60, y: 60 },
      },
    ];

    for (const s of seedSteps) {
      await db
        .insert(steps)
        .values({ ...s, demoId: demo.id })
        .onConflictDoNothing();
    }
    console.log(`  ✓ 3 steps criados`);
  } else {
    console.log(`  · demo já existia, pulando`);
  }

  // 5) Plans
  await db
    .insert(plans)
    .values([
      {
        id: "free",
        namePtBr: "Free",
        nameEn: "Free",
        priceBrlCents: 0,
        maxStepsPerDemo: 10,
        maxLeadsPerMonth: 0,
        maxViewsPerMonth: 50,
        ttsMinutesPerMonth: 0,
        aiTextRequestsPerMonth: 0,
        features: ["3 demos", "links 30d", "analytics anônimo"],
      },
      {
        id: "pro",
        namePtBr: "Pro",
        nameEn: "Pro",
        priceBrlCents: 4900,
        maxStepsPerDemo: 30,
        maxLeadsPerMonth: 100,
        maxViewsPerMonth: 5000,
        ttsMinutesPerMonth: 30,
        aiTextRequestsPerMonth: 500,
        features: ["Demos ilimitados", "100 leads/mês", "PIX + boleto + cartão"],
      },
      {
        id: "business",
        namePtBr: "Business",
        nameEn: "Business",
        priceBrlCents: 19900,
        maxStepsPerDemo: 60,
        maxLeadsPerMonth: null,
        maxViewsPerMonth: 50000,
        ttsMinutesPerMonth: 200,
        aiTextRequestsPerMonth: 2000,
        features: ["Custom domain", "CRM BR", "Branching", "White-label", "Suporte 24h"],
      },
    ])
    .onConflictDoNothing();

  console.log("  ✓ plans: free, pro, business");
  console.log("✅ Seed concluído.");

  await sql.end();
}

main().catch((err) => {
  console.error("seed failed:", err);
  process.exit(1);
});

void eq;
