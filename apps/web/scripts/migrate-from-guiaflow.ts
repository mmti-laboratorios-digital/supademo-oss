/* eslint-disable no-console */
/**
 * apps/web/scripts/migrate-from-guiaflow.ts
 * -----------------------------------------------------------------------------
 * Migra um export do GuiaFlow (formato llms.txt / JSON) para o DemoBR via API
 * local (http://localhost:3000/api/v1/demos) — usa credenciais mock + cookies
 * de sessão de dev.
 *
 * Formato esperado de entrada (guiaflow_export.json):
 * {
 *   "workspaces": [{ "name": "...", "demos": [
 *     { "title": "...", "slug": "...", "steps": [
 *         { "title": "...", "url": "https://...", "caption": "...",
 *           "hotspot": { "type": "pointer", "x": 0.4, "y": 0.5 } }
 *       ] }
 *   ] }]
 * }
 *
 * Uso:
 *   pnpm --filter web exec tsx scripts/migrate-from-guiaflow.ts \
 *     --file ./guiaflow_export.json --base http://localhost:3000 --token dev-token
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------
interface GuiaflowHotspot {
  type: "pointer" | "callout" | "area";
  x: number; // 0..1 (fração)
  y: number;
  w?: number;
  h?: number;
  text?: string;
}
interface GuiaflowStep {
  title?: string;
  url: string;
  caption?: string;
  hotspot?: GuiaflowHotspot;
  screenshot_url?: string;
}
interface GuiaflowDemo {
  title: string;
  slug: string;
  description?: string;
  steps: GuiaflowStep[];
  final_cta?: { type: string; url: string; label?: string };
}
interface GuiaflowWorkspace {
  name: string;
  demos: GuiaflowDemo[];
}
interface GuiaflowExport {
  workspaces: GuiaflowWorkspace[];
}

// -----------------------------------------------------------------------------
// Args
// -----------------------------------------------------------------------------
const args = process.argv.slice(2);
function getArg(name: string, fallback?: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return fallback;
}

const FILE = getArg("file", "./guiaflow_export.json");
const BASE = getArg("base", "http://localhost:3000");
const TOKEN = getArg("token", "dev-token");

if (!FILE) {
  console.error("❌ --file é obrigatório");
  process.exit(1);
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function fracToPx(f: number, size = 1280): number {
  return Math.round(f * size);
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} em ${url}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

async function putJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} em ${url}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

interface CreatedDemo {
  id: string;
  slug: string;
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------
async function main() {
  const filePath = resolve(FILE);
  console.log(`▶ Lendo ${filePath}…`);
  const raw = await readFile(filePath, "utf8");
  const data = JSON.parse(raw) as GuiaflowExport;

  if (!data.workspaces?.length) {
    console.error("❌ Nenhum workspace no arquivo.");
    process.exit(1);
  }

  let totalDemos = 0;
  let totalSteps = 0;

  for (const ws of data.workspaces) {
    console.log(`\n▶ Workspace: ${ws.name}`);
    for (const demo of ws.demos) {
      process.stdout.write(`  • "${demo.title}" — criando demo… `);
      try {
        const created = await postJson<CreatedDemo>(`${BASE}/api/v1/demos`, {
          title: demo.title,
          slug: demo.slug,
          description: demo.description,
          status: "draft",
          language: "pt-BR",
        });
        totalDemos++;
        console.log(`ok (id=${created.id}). Adicionando ${demo.steps.length} steps…`);

        for (const [i, step] of demo.steps.entries()) {
          const hs = step.hotspot ?? { type: "pointer", x: 0.5, y: 0.5 };
          await postJson(`${BASE}/api/v1/demos/${created.id}/steps`, {
            position: i + 1,
            screenshot_r2_key: step.screenshot_url ?? `imported/${created.slug}/${i + 1}.png`,
            source_url: step.url,
            source_title: step.title,
            caption: step.caption,
            hotspot: {
              type: hs.type,
              x: fracToPx(hs.x),
              y: fracToPx(hs.y),
              w: hs.w ? fracToPx(hs.w) : undefined,
              h: hs.h ? fracToPx(hs.h) : undefined,
              text: hs.text,
            },
          });
          totalSteps++;
          process.stdout.write(`    step ${i + 1}/${demo.steps.length}\r`);
        }
        process.stdout.write("\n");

        // Publica (opcional)
        await putJson(`${BASE}/api/v1/demos/${created.id}/publish`, {});
        console.log(`    ✓ publicado /d/${demo.slug}`);
      } catch (e) {
        console.error(`    ❌ erro:`, (e as Error).message);
      }
    }
  }

  console.log(`\n✅ Migração GuiaFlow → DemoBR concluída.`);
  console.log(`   Demos criados: ${totalDemos}`);
  console.log(`   Steps adicionados: ${totalSteps}`);
}

main().catch((e) => {
  console.error("❌ Falha na migração:", e);
  process.exit(1);
});
