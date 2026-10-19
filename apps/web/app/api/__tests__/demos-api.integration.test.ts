import { randomUUID } from "node:crypto";
import { Client } from "pg";
/**
 * apps/web/app/api/__tests__/demos-api.integration.test.ts
 *
 * Testes de INTEGRAÇÃO do endpoint /api/v1/demos — usa Postgres real
 * mas mocka Clerk auth (requireAuth) para evitar dependência externa.
 *
 * Pré-requisito: container docker supademo-test + schema aplicado.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const APP_OWNER_URL =
  process.env.DATABASE_URL?.replace("app_user", "app_owner") ??
  "postgres://app_owner:demobr@127.0.0.1:55432/supademo";

// Mock Clerk auth antes de importar o route
const mockRequireAuth = vi.fn();
vi.mock("@/lib/auth", async () => {
  return {
    requireAuth: () => mockRequireAuth(),
  };
});

const APP_USER_URL =
  process.env.DATABASE_URL ?? "postgres://app_user:demobr@127.0.0.1:55432/supademo";

let adminClient: Client;
let workspaceAId: string;
let workspaceBId: string;

beforeAll(async () => {
  adminClient = new Client({ connectionString: APP_OWNER_URL });
  await adminClient.connect();
  await adminClient.query("DELETE FROM app.demos WHERE slug LIKE 'api-int-%'");
  await adminClient.query("DELETE FROM app.workspaces WHERE slug LIKE 'api-int-%'");

  const a = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ('api-int-a', 'API Test A', 'free') RETURNING id`,
  );
  workspaceAId = a.rows[0].id;

  const b = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ('api-int-b', 'API Test B', 'free') RETURNING id`,
  );
  workspaceBId = b.rows[0].id;
});

afterAll(async () => {
  await adminClient.query("DELETE FROM app.demos WHERE workspace_id IN ($1, $2)", [
    workspaceAId,
    workspaceBId,
  ]);
  await adminClient.query("DELETE FROM app.workspaces WHERE id IN ($1, $2)", [
    workspaceAId,
    workspaceBId,
  ]);
  await adminClient.end();
});

describe("/api/v1/demos — POST", () => {
  it("POST sem auth → 401", async () => {
    mockRequireAuth.mockRejectedValueOnce(new Error("UNAUTHORIZED"));
    const { POST } = await import("../v1/demos/route");
    const req = new Request("http://localhost/api/v1/demos", {
      method: "POST",
      body: JSON.stringify({ title: "Foo", slug: "foo" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: "UNAUTHORIZED" });
  });

  it("POST com auth mas sem workspace → 403", async () => {
    mockRequireAuth.mockRejectedValueOnce(new Error("NO_WORKSPACE"));
    const { POST } = await import("../v1/demos/route");
    const req = new Request("http://localhost/api/v1/demos", {
      method: "POST",
      body: JSON.stringify({ title: "Foo", slug: "foo" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: "NO_WORKSPACE" });
  });

  it("POST com payload inválido → 400", async () => {
    mockRequireAuth.mockResolvedValueOnce({
      userId: "user_1",
      orgId: workspaceAId,
      role: "owner" as const,
    });
    const { POST } = await import("../v1/demos/route");
    const req = new Request("http://localhost/api/v1/demos", {
      method: "POST",
      body: JSON.stringify({ slug: "Bad Slug", title: "x" }), // title < 3 + slug com espaço
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("BAD_REQUEST");
  });

  it("POST válido → 201 com demo.id", async () => {
    mockRequireAuth.mockResolvedValueOnce({
      userId: "user_1",
      orgId: workspaceAId,
      role: "owner" as const,
    });
    const { POST } = await import("../v1/demos/route");
    const slug = `api-int-${randomUUID().slice(0, 8)}`;
    const req = new Request("http://localhost/api/v1/demos", {
      method: "POST",
      body: JSON.stringify({
        title: "Demo de teste API",
        slug,
        language: "pt-BR",
        leadFormEnabled: true,
      }),
    });
    // Capturar stderr para descobrir o erro real
    const origErr = console.error;
    console.error = (...args: unknown[]) => {
      origErr("[CAPTURED]", ...args);
    };
    let res: Response;
    try {
      res = await POST(req);
    } finally {
      console.error = origErr;
    }
    if (res.status !== 201) {
      console.error("Response body:", await res.clone().text());
    }
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.demo.id).toBeDefined();
    expect(body.demo.slug).toBe(slug);
    expect(body.demo.workspaceId).toBe(workspaceAId);
  });
});

describe("/api/v1/demos — GET (RLS via tenant scope)", () => {
  it("GET lista do tenant A NÃO inclui demos do tenant B", async () => {
    // Insere 1 demo em A e 1 em B (via owner)
    const slugA = `api-int-list-a-${randomUUID().slice(0, 8)}`;
    const slugB = `api-int-list-b-${randomUUID().slice(0, 8)}`;
    await adminClient.query(
      `INSERT INTO app.demos (workspace_id, slug, title, status, language)
       VALUES ($1, $2, 'A Demo', 'published', 'pt-BR')`,
      [workspaceAId, slugA],
    );
    await adminClient.query(
      `INSERT INTO app.demos (workspace_id, slug, title, status, language)
       VALUES ($1, $2, 'B Demo', 'published', 'pt-BR')`,
      [workspaceBId, slugB],
    );

    mockRequireAuth.mockResolvedValueOnce({
      userId: "user_1",
      orgId: workspaceAId,
      role: "owner" as const,
    });
    const { GET } = await import("../v1/demos/route");
    const req = new Request("http://localhost/api/v1/demos?limit=100", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    const slugs = body.items.map((d: { slug: string }) => d.slug);
    expect(slugs).toContain(slugA);
    expect(slugs).not.toContain(slugB);
  });

  it("GET query inválida → 400", async () => {
    mockRequireAuth.mockResolvedValueOnce({
      userId: "user_1",
      orgId: workspaceAId,
      role: "owner" as const,
    });
    const { GET } = await import("../v1/demos/route");
    const req = new Request("http://localhost/api/v1/demos?limit=invalid", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
