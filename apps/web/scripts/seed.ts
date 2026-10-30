/* eslint-disable no-console */
/**
 * apps/web/scripts/seed.ts
 * -----------------------------------------------------------------------------
 * Popula o banco com um workspace demo, 1 membro, 3 demos e 1 lead.
 *
 * Idempotente: se já existir workspace.slug=demo, aborta sem inserir.
 *
 * Uso:
 *   pnpm --filter web db:seed
 *   ou
 *   pnpm --filter web exec tsx scripts/seed.ts
 */
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// -----------------------------------------------------------------------------
// Configura
// -----------------------------------------------------------------------------
// Convenção do projeto: porta 55432 no host (não 5432) — ver infra/docker-compose.yml.
const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://app_user:app_user@localhost:55432/easydemo";

if (!/^postgres(?:ql)?:\/\//.test(DATABASE_URL)) {
  console.error("❌ DATABASE_URL inválida:", DATABASE_URL);
  process.exit(1);
}

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client);

// -----------------------------------------------------------------------------
// Tipos mínimos (espelham schema/app.ts, mas sem import para não acoplar)
// -----------------------------------------------------------------------------
type DemoStatus = "draft" | "published" | "archived";

interface HotspotPointer {
  type: "pointer";
  x: number;
  y: number;
  text?: string;
}
interface HotspotCallout {
  type: "callout";
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
}
interface HotspotArea {
  type: "area";
  x: number;
  y: number;
  w: number;
  h: number;
}
type Hotspot = HotspotPointer | HotspotCallout | HotspotArea;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
const PLACEHOLDER_IMG = "placeholders/screenshot-gray-1280x800.png";
const PLACEHOLDER_HOST = "https://www.notion.so";

function makeHotspotPointer(x: number, y: number, text?: string): HotspotPointer {
  return { type: "pointer", x, y, text };
}
function makeHotspotCallout(
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
): HotspotCallout {
  return { type: "callout", x, y, w, h, text };
}

async function tableExists(name: string): Promise<boolean> {
  const rows = await db.execute<{ exists: boolean }>(sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'app' AND table_name = ${name}
    ) AS exists
  `);
  return Boolean(rows[0]?.exists);
}

async function workspaceExistsBySlug(slug: string): Promise<boolean> {
  const rows = await db.execute<{ exists: boolean }>(sql`
    SELECT EXISTS (SELECT 1 FROM app.workspaces WHERE slug = ${slug}) AS exists
  `);
  return Boolean(rows[0]?.exists);
}

// -----------------------------------------------------------------------------
// Seed principal
// -----------------------------------------------------------------------------
async function main() {
  console.log("▶ Conectando ao Postgres…");
  try {
    await db.execute(sql`SELECT 1`);
  } catch (e) {
    console.error("❌ Falha ao conectar no Postgres:", e);
    process.exit(1);
  }

  // Validação mínima de schema
  const haveWorkspaces = await tableExists("workspaces");
  const haveDemos = await tableExists("demos");
  const haveSteps = await tableExists("steps");
  const haveLeads = await tableExists("leads");
  const haveMembers = await tableExists("members");

  if (!(haveWorkspaces && haveDemos && haveSteps && haveLeads && haveMembers)) {
    console.error(
      "❌ Schema 'app' incompleto. Rode antes: pnpm --filter web db:push (ou db:migrate).",
      { haveWorkspaces, haveDemos, haveSteps, haveLeads, haveMembers },
    );
    process.exit(1);
  }

  if (await workspaceExistsBySlug("demo")) {
    console.log("ℹ Workspace 'demo' já existe — seed idempotente, nada a fazer.");
    await client.end();
    return;
  }

  console.log("▶ Criando workspace 'Demo Workspace'…");
  const workspaceId = randomUUID();
  await db.execute(sql`
    INSERT INTO app.workspaces
      (id, slug, name, locale, plan_id, brand_color, created_at, updated_at)
    VALUES
      (${workspaceId}, 'demo', 'Demo Workspace', 'pt-BR', 'pro', '#0066FF', now(), now())
  `);

  console.log("▶ Criando membro demo@easydemo.io…");
  const memberId = randomUUID();
  await db.execute(sql`
    INSERT INTO app.members
      (id, workspace_id, email, name, role, email_verified_at, created_at)
    VALUES
      (${memberId}, ${workspaceId}, 'demo@easydemo.io', 'Demo User', 'owner', now(), now())
  `);

  // ---------------------------------------------------------------------------
  // Demo 1 — Onboarding do CRM (5 steps)
  // ---------------------------------------------------------------------------
  console.log("▶ Demo 1/3: Onboarding do CRM…");
  const d1Id = randomUUID();
  await db.execute(sql`
    INSERT INTO app.demos
      (id, workspace_id, slug, title, description, status, language, lead_form_enabled,
       lead_form_consent_text, final_cta, variables, published_at, created_at, updated_at)
    VALUES
      (${d1Id}, ${workspaceId}, 'onboarding-crm',
       'Onboarding do CRM',
       'Tour de 5 passos mostrando o cadastro de lead, funil de vendas e relatórios do CRM fictício.',
       'published', 'pt-BR', true,
       'Autorizo a EasyDemo a me contatar sobre o CRM demonstrado, conforme LGPD.',
       ${sql.json({ type: "whatsapp", url: "https://wa.me/5511999999999?text=Quero+conhecer+o+CRM", label: "Falar pelo WhatsApp" })}::jsonb,
       ${sql.json({ name: "Visitante", empresa: "Sua empresa" })}::jsonb,
       now(), now(), now())
  `);

  const d1Steps: Array<{
    pos: number;
    title: string;
    caption: string;
    hotspot: Hotspot;
  }> = [
    {
      pos: 1,
      title: "Tela de login",
      caption: "Faça login com seu e-mail corporativo",
      hotspot: makeHotspotCallout(220, 180, 320, 56, "E-mail + senha"),
    },
    {
      pos: 2,
      title: "Dashboard inicial",
      caption: "Veja seu funil em tempo real",
      hotspot: makeHotspotPointer(640, 240, "Funil"),
    },
    {
      pos: 3,
      title: "Cadastro de lead",
      caption: "Adicione leads manualmente",
      hotspot: makeHotspotCallout(120, 420, 240, 64, "Novo lead"),
    },
    {
      pos: 4,
      title: "Kanban de oportunidades",
      caption: "Arraste cards para mudar a etapa",
      hotspot: makeHotspotPointer(800, 360, "Drag & drop"),
    },
    {
      pos: 5,
      title: "Relatórios mensais",
      caption: "Exporte relatórios em PDF",
      hotspot: makeHotspotCallout(960, 120, 200, 48, "Exportar"),
    },
  ];

  for (const s of d1Steps) {
    await db.execute(sql`
      INSERT INTO app.steps
        (id, demo_id, position, screenshot_r2_key, source_url, source_title, caption, hotspot, created_at)
      VALUES
        (${randomUUID()}, ${d1Id}, ${s.pos}, ${PLACEHOLDER_IMG}, ${PLACEHOLDER_HOST},
         ${s.title}, ${s.caption}, ${sql.json(s.hotspot)}::jsonb, now())
    `);
  }

  // ---------------------------------------------------------------------------
  // Demo 2 — Tour do produto (3 steps)
  // ---------------------------------------------------------------------------
  console.log("▶ Demo 2/3: Tour do produto…");
  const d2Id = randomUUID();
  await db.execute(sql`
    INSERT INTO app.demos
      (id, workspace_id, slug, title, description, status, language, lead_form_enabled,
       lead_form_consent_text, final_cta, published_at, created_at, updated_at)
    VALUES
      (${d2Id}, ${workspaceId}, 'tour-do-produto',
       'Tour do produto',
       'Visão geral de 3 passos do produto principal.',
       'published', 'pt-BR', false, null,
       ${sql.json({ type: "link", url: "https://app.demo.br", label: "Começar grátis" })}::jsonb,
       now(), now(), now())
  `);

  const d2Steps = [
    {
      pos: 1,
      title: "Página inicial",
      caption: "Conheça a visão geral",
      hotspot: makeHotspotPointer(50, 50, "Visão"),
    },
    {
      pos: 2,
      title: "Recursos-chave",
      caption: "Veja os 3 pilares",
      hotspot: makeHotspotCallout(200, 200, 880, 240, "Pilares"),
    },
    {
      pos: 3,
      title: "Preços",
      caption: "A partir de R$ 49/mês",
      hotspot: makeHotspotPointer(900, 600, "Pro"),
    },
  ];
  for (const s of d2Steps) {
    await db.execute(sql`
      INSERT INTO app.steps
        (id, demo_id, position, screenshot_r2_key, source_url, source_title, caption, hotspot, created_at)
      VALUES
        (${randomUUID()}, ${d2Id}, ${s.pos}, ${PLACEHOLDER_IMG}, ${PLACEHOLDER_HOST},
         ${s.title}, ${s.caption}, ${sql.json(s.hotspot)}::jsonb, now())
    `);
  }

  // ---------------------------------------------------------------------------
  // Demo 3 — Caso de uso SaaS (4 steps)
  // ---------------------------------------------------------------------------
  console.log("▶ Demo 3/3: Caso de uso SaaS…");
  const d3Id = randomUUID();
  await db.execute(sql`
    INSERT INTO app.demos
      (id, workspace_id, slug, title, description, status, language, lead_form_enabled,
       lead_form_consent_text, final_cta, published_at, created_at, updated_at)
    VALUES
      (${d3Id}, ${workspaceId}, 'caso-uso-saas',
       'Caso de uso SaaS',
       'Demo de 4 passos mostrando um caso de uso SaaS recorrente.',
       'draft', 'pt-BR', true,
       'Autorizo a EasyDemo a entrar em contato conforme LGPD.',
       ${sql.json({ type: "mailto", url: "mailto:contato@dominio.com.br", label: "Falar por e-mail" })}::jsonb,
       null, now(), now())
  `);

  const d3Steps = [
    {
      pos: 1,
      title: "Setup inicial",
      caption: "Crie sua conta em 30s",
      hotspot: makeHotspotCallout(420, 80, 320, 48, "Criar conta"),
    },
    {
      pos: 2,
      title: "Configurar billing",
      caption: "PIX ou boleto recorrente",
      hotspot: makeHotspotPointer(360, 320, "Billing"),
    },
    {
      pos: 3,
      title: "Importar dados",
      caption: "CSV de até 100 MB",
      hotspot: makeHotspotCallout(160, 480, 240, 64, "Upload"),
    },
    {
      pos: 4,
      title: "Convidar time",
      caption: "Convide por e-mail",
      hotspot: makeHotspotPointer(880, 200, "Convidar"),
    },
  ];
  for (const s of d3Steps) {
    await db.execute(sql`
      INSERT INTO app.steps
        (id, demo_id, position, screenshot_r2_key, source_url, source_title, caption, hotspot, created_at)
      VALUES
        (${randomUUID()}, ${d3Id}, ${s.pos}, ${PLACEHOLDER_IMG}, ${PLACEHOLDER_HOST},
         ${s.title}, ${s.caption}, ${sql.json(s.hotspot)}::jsonb, now())
    `);
  }

  // ---------------------------------------------------------------------------
  // Lead capturado
  // ---------------------------------------------------------------------------
  console.log("▶ Lead de exemplo…");
  await db.execute(sql`
    INSERT INTO app.leads
      (id, workspace_id, demo_id, name, email, phone, consent_text, extra, created_at)
    VALUES
      (${randomUUID()}, ${workspaceId}, ${d1Id},
       'Maria Lead', 'maria@lead.com.br', '+5511988887777',
       'Autorizo a EasyDemo a me contatar sobre o CRM demonstrado, conforme LGPD.',
       ${sql.json({ empresa: "Lead S/A", cargo: "Head de Vendas" })}::jsonb,
       now())
  `);

  await client.end();

  // ---------------------------------------------------------------------------
  // Resumo
  // ---------------------------------------------------------------------------
  const banner = "━".repeat(64);
  console.log(`\n${banner}`);
  console.log("✅ Seed concluído");
  console.log(banner);
  console.log("Workspace:    Demo Workspace (slug: demo)");
  console.log("User:         demo@easydemo.io (role: owner)");
  console.log("Demos:");
  console.log("  • /d/onboarding-crm   (publicado, 5 steps, lead-form ON)");
  console.log("  • /d/tour-do-produto  (publicado, 3 steps, lead-form OFF)");
  console.log("  • /d/caso-uso-saas    (rascunho,  4 steps, lead-form ON)");
  console.log("Leads:        1 capturado (maria@lead.com.br → onboarding-crm)");
  console.log(banner);
}

main().catch((e) => {
  console.error("❌ Seed falhou:", e);
  process.exit(1);
});
