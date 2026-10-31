import { randomUUID } from "node:crypto";
import { Client } from "pg";
/**
 * apps/web/app/api/__tests__/steps-upload.integration.test.ts
 *
 * Gate G1.5 — criação de step pelo upload manual.
 *
 * Usa Postgres real e mocka apenas o Clerk (`requireAuth`). Cobre o que o
 * upload manual depende:
 * - POST /api/v1/demos/{id}/steps cria o step com `screenshotR2Key` e hotspot;
 * - a posição é respeitada e a listagem sai em ordem;
 * - payload inválido (hotspot fora de 0–100, screenshot ausente) → 400;
 * - demo de outro tenant não recebe steps (RLS).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const APP_OWNER_URL =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL?.replace("app_user", "app_owner") ??
  "postgres://app_owner:easydemo@127.0.0.1:55432/easydemo";

const mockRequireAuth = vi.fn();
vi.mock("@/lib/auth", async () => {
  return {
    requireAuth: () => mockRequireAuth(),
  };
});

// O endpoint chama presignPut() ao final; sem credenciais R2 no ambiente de
// teste isso lançaria. Mockamos só essa parte.
vi.mock("@/lib/r2", async () => {
  return {
    presignPut: vi.fn(async (args: { key: string; contentType: string }) => ({
      url: `https://r2.example.com/${args.key}?signature=fake`,
      key: args.key,
      bucket: "public",
      contentType: args.contentType,
    })),
  };
});

let adminClient: Client;
let workspaceId: string;
let demoId: string;

beforeAll(async () => {
  adminClient = new Client({ connectionString: APP_OWNER_URL });
  await adminClient.connect();

  const workspace = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ($1, 'Steps Upload Test', 'free') RETURNING id`,
    [`steps-upload-${randomUUID().slice(0, 8)}`],
  );
  workspaceId = workspace.rows[0].id;

  const demo = await adminClient.query<{ id: string }>(
    `INSERT INTO app.demos (workspace_id, slug, title, status, language)
     VALUES ($1, $2, 'Demo upload manual', 'draft', 'pt-BR') RETURNING id`,
    [workspaceId, `steps-upload-${randomUUID().slice(0, 12)}`],
  );
  demoId = demo.rows[0].id;
});

afterAll(async () => {
  await adminClient.query("DELETE FROM app.workspaces WHERE id = $1", [workspaceId]);
  await adminClient.end();
});

function authAsWorkspace() {
  mockRequireAuth.mockResolvedValueOnce({
    userId: "user_1",
    orgId: workspaceId,
    role: "owner" as const,
  });
}

describe("POST /api/v1/demos/:id/steps — upload manual", () => {
  it("cria o step com screenshotR2Key e hotspot", async () => {
    authAsWorkspace();
    const { POST } = await import("../v1/demos/[id]/steps/route");
    const req = new Request(`http://localhost/api/v1/demos/${demoId}/steps`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        position: 1,
        screenshotR2Key: `demos/${workspaceId}/steps/manual/step-1.png`,
        sourceUrl: "https://easydemo.io/upload/manual.png",
        hotspot: { type: "pointer", x: 50, y: 50 },
      }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: demoId }) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.step.id).toBeTruthy();
    expect(body.step.position).toBe(1);
    expect(body.step.screenshotR2Key).toContain("step-1.png");
    expect(body.step.hotspot).toMatchObject({ type: "pointer", x: 50, y: 50 });
  });

  it("hotspot fora de 0–100 → 400", async () => {
    authAsWorkspace();
    const { POST } = await import("../v1/demos/[id]/steps/route");
    const req = new Request(`http://localhost/api/v1/demos/${demoId}/steps`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        position: 2,
        screenshotR2Key: `demos/${workspaceId}/steps/manual/step-2.png`,
        sourceUrl: "https://easydemo.io/upload/manual.png",
        hotspot: { type: "pointer", x: 140, y: 50 },
      }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: demoId }) });
    expect(res.status).toBe(400);
  });

  it("sem screenshotR2Key → 400", async () => {
    authAsWorkspace();
    const { POST } = await import("../v1/demos/[id]/steps/route");
    const req = new Request(`http://localhost/api/v1/demos/${demoId}/steps`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        position: 3,
        sourceUrl: "https://easydemo.io/upload/manual.png",
        hotspot: { type: "pointer", x: 50, y: 50 },
      }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: demoId }) });
    expect(res.status).toBe(400);
  });

  it("a listagem sai em ordem de posição", async () => {
    authAsWorkspace();
    const { GET } = await import("../v1/demos/[id]/steps/route");
    const req = new Request(`http://localhost/api/v1/demos/${demoId}/steps`, { method: "GET" });
    const res = await GET(req, { params: Promise.resolve({ id: demoId }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    const positions = body.items.map((s: { position: number }) => s.position);
    expect(positions).toEqual([...positions].sort((a: number, b: number) => a - b));
  });

  it("demo de outro tenant não recebe step (RLS)", async () => {
    const other = await adminClient.query<{ id: string }>(
      `INSERT INTO app.workspaces (slug, name, plan_id)
       VALUES ($1, 'Outro Steps Upload', 'free') RETURNING id`,
      [`steps-upload-other-${randomUUID().slice(0, 8)}`],
    );
    const otherWorkspaceId = other.rows[0].id;
    try {
      mockRequireAuth.mockResolvedValueOnce({
        userId: "user_2",
        orgId: otherWorkspaceId,
        role: "owner" as const,
      });
      const { POST } = await import("../v1/demos/[id]/steps/route");
      const req = new Request(`http://localhost/api/v1/demos/${demoId}/steps`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          position: 9,
          screenshotR2Key: `demos/${otherWorkspaceId}/steps/manual/hack.png`,
          sourceUrl: "https://easydemo.io/upload/hack.png",
          hotspot: { type: "pointer", x: 50, y: 50 },
        }),
      });
      const res = await POST(req, { params: Promise.resolve({ id: demoId }) });
      // A policy RLS bloqueia o insert (violates row-level security) → 500.
      expect(res.status).toBe(500);

      const count = await adminClient.query<{ count: string }>(
        "SELECT count(*)::text AS count FROM app.steps WHERE demo_id = $1 AND position = 9",
        [demoId],
      );
      expect(count.rows[0].count).toBe("0");
    } finally {
      await adminClient.query("DELETE FROM app.workspaces WHERE id = $1", [otherWorkspaceId]);
    }
  });
});
