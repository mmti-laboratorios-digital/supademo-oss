import { randomUUID } from "node:crypto";
import pg from "pg";
/**
 * apps/web/lib/__tests__/branding.integration.test.ts
 *
 * Gate G5 (F7) — branding no player.
 *
 * - O player deve ler o branding do **workspace** (logo + cor primária),
 *    não da demo.
 * - Sem branding, o player usa o tema padrão (valores null/undefined).
 * - A leitura é **pública** (sem tenant) para `/d/[slug]` e `/embed/[id]`.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const mockRequireAuth = vi.fn();
vi.mock("@/lib/auth", async () => {
  return {
    requireAuth: () => mockRequireAuth(),
  };
});

const APP_OWNER_URL =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL?.replace("app_user", "app_owner") ??
  "postgres://app_owner:easydemo@127.0.0.1:55432/easydemo";

let adminClient: pg.Client;
let workspaceId: string;
let demoId: string;

beforeAll(async () => {
  adminClient = new pg.Client({ connectionString: APP_OWNER_URL });
  await adminClient.connect();

  const slug = `f7-branding-${randomUUID().slice(0, 8)}`;
  const ws = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id, brand_color, brand_logo_r2_key)
     VALUES ($1, 'F7 Branding Test', 'pro', '#ff0000', 'logos/f7-test.webp')
     RETURNING id`,
    [slug],
  );
  workspaceId = ws.rows[0].id;

  const demo = await adminClient.query<{ id: string }>(
    `INSERT INTO app.demos (workspace_id, slug, title, status, language)
     VALUES ($1, $2, 'Demo Branding F7', 'published', 'pt-BR')
     RETURNING id`,
    [workspaceId, `demo-${randomUUID().slice(0, 12)}`],
  );
  demoId = demo.rows[0].id;
});

afterAll(async () => {
  await adminClient.query("DELETE FROM app.demos WHERE workspace_id = $1", [workspaceId]);
  await adminClient.query("DELETE FROM app.workspaces WHERE id = $1", [workspaceId]);
  await adminClient.end();
});

describe("getBrandingByDemoSlug / getBrandingByDemoId", () => {
  it("devolve logo e cor do workspace para uma demo publicada", async () => {
    const { getBrandingByDemoSlug, getBrandingByDemoId } = await import("@/lib/branding");

    const bySlug = await getBrandingByDemoSlug(
      (
        await adminClient.query<{ slug: string }>("SELECT slug FROM app.demos WHERE id = $1", [
          demoId,
        ])
      ).rows[0].slug,
    );
    expect(bySlug).toMatchObject({
      name: "F7 Branding Test",
      brandColor: "#ff0000",
      logoUrl: expect.stringContaining("logos/f7-test.webp"),
    });

    const byId = await getBrandingByDemoId(demoId);
    expect(byId).toMatchObject({
      name: "F7 Branding Test",
      brandColor: "#ff0000",
    });
  });

  it("devolve null para demo inexistente", async () => {
    const { getBrandingByDemoSlug, getBrandingByDemoId } = await import("@/lib/branding");

    expect(await getBrandingByDemoSlug("slug-que-nao-existe")).toBeNull();
    expect(await getBrandingByDemoId(randomUUID())).toBeNull();
  });

  it("devolve null quando a demo NAO esta publicada", async () => {
    const { getBrandingByDemoSlug } = await import("@/lib/branding");

    const draft = await adminClient.query<{ slug: string }>(
      `INSERT INTO app.demos (workspace_id, slug, title, status, language)
       VALUES ($1, $2, 'Draft Branding', 'draft', 'pt-BR')
       RETURNING slug`,
      [workspaceId, `draft-${randomUUID().slice(0, 12)}`],
    );

    expect(await getBrandingByDemoSlug(draft.rows[0].slug)).toBeNull();

    await adminClient.query("DELETE FROM app.demos WHERE slug = $1", [draft.rows[0].slug]);
  });

  it("workspace sem branding devolve logoUrl null e brandColor null", async () => {
    const { getBrandingByDemoSlug } = await import("@/lib/branding");

    const cleanWs = await adminClient.query<{ id: string }>(
      `INSERT INTO app.workspaces (slug, name, plan_id)
       VALUES ($1, 'Clean Workspace', 'free')
       RETURNING id`,
      [`clean-${randomUUID().slice(0, 8)}`],
    );
    const cleanDemo = await adminClient.query<{ slug: string }>(
      `INSERT INTO app.demos (workspace_id, slug, title, status, language)
       VALUES ($1, $2, 'Clean Demo', 'published', 'pt-BR')
       RETURNING slug`,
      [cleanWs.rows[0].id, `clean-demo-${randomUUID().slice(0, 12)}`],
    );

    const branding = await getBrandingByDemoSlug(cleanDemo.rows[0].slug);
    expect(branding).toMatchObject({
      name: "Clean Workspace",
      logoUrl: null,
      brandColor: null,
    });

    await adminClient.query("DELETE FROM app.demos WHERE workspace_id = $1", [cleanWs.rows[0].id]);
    await adminClient.query("DELETE FROM app.workspaces WHERE id = $1", [cleanWs.rows[0].id]);
  });
});
