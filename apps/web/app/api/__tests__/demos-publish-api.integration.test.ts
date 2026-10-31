import { randomUUID } from "node:crypto";
import { Client } from "pg";
/**
 * apps/web/app/api/__tests__/demos-publish-api.integration.test.ts
 *
 * Gate G1 — contrato HTTP da publicação.
 *
 * Usa Postgres real e mocka apenas o Clerk (`requireAuth`) para evitar
 * dependência externa. Cobre:
 * - slug inválido → 400 com mensagem;
 * - demo sem steps → 400;
 * - slug duplicado → 409;
 * - publicação válida → 200 + status published;
 * - despublicação → 200 + status draft.
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

let adminClient: Client;
let workspaceId: string;

beforeAll(async () => {
  adminClient = new Client({ connectionString: APP_OWNER_URL });
  await adminClient.connect();

  const workspace = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ($1, 'Publish API Test', 'free') RETURNING id`,
    [`publish-api-${randomUUID().slice(0, 8)}`],
  );
  workspaceId = workspace.rows[0].id;
});

afterAll(async () => {
  await adminClient.query("DELETE FROM app.workspaces WHERE id = $1", [workspaceId]);
  await adminClient.end();
});

async function createDemo(withStep: boolean): Promise<string> {
  const slug = `publish-api-${randomUUID().slice(0, 12)}`;
  const demo = await adminClient.query<{ id: string }>(
    `INSERT INTO app.demos (workspace_id, slug, title, status, language)
     VALUES ($1, $2, 'Demo de teste', 'draft', 'pt-BR') RETURNING id`,
    [workspaceId, slug],
  );
  const demoId = demo.rows[0].id;
  if (withStep) {
    await adminClient.query(
      `INSERT INTO app.steps (demo_id, position, screenshot_r2_key, source_url, hotspot)
       VALUES ($1, 1, $2, 'https://example.com', $3::jsonb)`,
      [
        demoId,
        `demos/${workspaceId}/steps/test.webp`,
        JSON.stringify({ type: "pointer", x: 50, y: 50 }),
      ],
    );
  }
  return demoId;
}

function authAsWorkspace() {
  mockRequireAuth.mockResolvedValueOnce({
    userId: "user_1",
    orgId: workspaceId,
    role: "owner" as const,
  });
}

describe("/api/v1/demos/:id/publish — gate G1", () => {
  it("slug inválido → 400 com mensagem", async () => {
    const demoId = await createDemo(true);
    authAsWorkspace();
    const { POST } = await import("../v1/demos/[id]/publish/route");
    const req = new Request(`http://localhost/api/v1/demos/${demoId}/publish`, {
      method: "POST",
      body: JSON.stringify({ slug: "Slug Inválido" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: demoId }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("BAD_REQUEST");
    expect(body.message).toBeTruthy();
  });

  it("slug com 1 caractere → 400", async () => {
    const demoId = await createDemo(true);
    authAsWorkspace();
    const { POST } = await import("../v1/demos/[id]/publish/route");
    const req = new Request(`http://localhost/api/v1/demos/${demoId}/publish`, {
      method: "POST",
      body: JSON.stringify({ slug: "a" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: demoId }) });
    expect(res.status).toBe(400);
  });

  it("demo sem step → 400", async () => {
    const demoId = await createDemo(false);
    authAsWorkspace();
    const { POST } = await import("../v1/demos/[id]/publish/route");
    const req = new Request(`http://localhost/api/v1/demos/${demoId}/publish`, {
      method: "POST",
      body: JSON.stringify({ slug: `sem-step-${randomUUID().slice(0, 8)}` }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: demoId }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("NO_STEPS");
    expect(body.message).toBeTruthy();
  });

  it("slug duplicado → 409", async () => {
    const firstId = await createDemo(true);
    const slug = `dup-${randomUUID().slice(0, 8)}`;

    authAsWorkspace();
    const { POST } = await import("../v1/demos/[id]/publish/route");
    const firstReq = new Request(`http://localhost/api/v1/demos/${firstId}/publish`, {
      method: "POST",
      body: JSON.stringify({ slug }),
    });
    expect((await POST(firstReq, { params: Promise.resolve({ id: firstId }) })).status).toBe(200);

    const secondId = await createDemo(true);
    authAsWorkspace();
    const secondReq = new Request(`http://localhost/api/v1/demos/${secondId}/publish`, {
      method: "POST",
      body: JSON.stringify({ slug }),
    });
    const res = await POST(secondReq, { params: Promise.resolve({ id: secondId }) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("SLUG_TAKEN");
  });

  it("publicação válida → 200 com status published", async () => {
    const demoId = await createDemo(true);
    const slug = `ok-${randomUUID().slice(0, 8)}`;
    authAsWorkspace();
    const { POST } = await import("../v1/demos/[id]/publish/route");
    const req = new Request(`http://localhost/api/v1/demos/${demoId}/publish`, {
      method: "POST",
      body: JSON.stringify({ slug }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: demoId }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.demo.status).toBe("published");
    expect(body.demo.slug).toBe(slug);
    expect(body.demo.publishedAt).toBeTruthy();
  });
});

describe("/api/v1/demos/:id/unpublish — gate G1", () => {
  it("despublica → 200 com status draft", async () => {
    const demoId = await createDemo(true);
    const slug = `unpub-${randomUUID().slice(0, 8)}`;

    authAsWorkspace();
    const { POST: publish } = await import("../v1/demos/[id]/publish/route");
    const publishReq = new Request(`http://localhost/api/v1/demos/${demoId}/publish`, {
      method: "POST",
      body: JSON.stringify({ slug }),
    });
    expect((await publish(publishReq, { params: Promise.resolve({ id: demoId }) })).status).toBe(
      200,
    );

    authAsWorkspace();
    const { POST: unpublish } = await import("../v1/demos/[id]/unpublish/route");
    const unpublishReq = new Request(`http://localhost/api/v1/demos/${demoId}/unpublish`, {
      method: "POST",
    });
    const res = await unpublish(unpublishReq, { params: Promise.resolve({ id: demoId }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.demo.status).toBe("draft");
    expect(body.demo.publishedAt).toBeNull();
  });
});
