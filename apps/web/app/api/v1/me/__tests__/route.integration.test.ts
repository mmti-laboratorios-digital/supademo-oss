/**
 * apps/web/app/api/v1/me/__tests__/route.integration.test.ts
 *
 * Gate G5 (F9) — endpoint `/api/v1/me` para a extensão Chrome.
 *
 * Usa Postgres real mas mocka Clerk auth (`requireAuth`) para evitar
 * dependência de conta/sandbox externa.
 */
import { Client } from "pg";
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

let adminClient: Client;
let workspaceId: string;

beforeAll(async () => {
  adminClient = new Client({ connectionString: APP_OWNER_URL });
  await adminClient.connect();
  await adminClient.query("DELETE FROM app.workspaces WHERE slug LIKE 'me-int-%'");

  const ws = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ('me-int-ext', 'Extension Workspace', 'pro') RETURNING id`,
  );
  workspaceId = ws.rows[0].id;
});

afterAll(async () => {
  await adminClient.query("DELETE FROM app.workspaces WHERE id = $1", [workspaceId]);
  await adminClient.end();
});

describe("/api/v1/me — GET", () => {
  it("retorna userId, workspaceId e workspaceName do usuário logado", async () => {
    mockRequireAuth.mockResolvedValueOnce({
      userId: "user_123",
      orgId: workspaceId,
      role: "owner",
    });

    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toMatchObject({
      userId: "user_123",
      workspaceId,
      workspaceName: "Extension Workspace",
    });
  });

  it("retorna 401 quando não autenticado", async () => {
    mockRequireAuth.mockRejectedValueOnce(new Error("UNAUTHORIZED"));

    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: "UNAUTHORIZED" });
  });

  it("retorna 403 quando o usuário não tem workspace", async () => {
    mockRequireAuth.mockRejectedValueOnce(new Error("NO_WORKSPACE"));

    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: "NO_WORKSPACE" });
  });

  it("retorna 404 quando o workspace não existe no banco", async () => {
    mockRequireAuth.mockResolvedValueOnce({
      userId: "user_123",
      orgId: "00000000-0000-0000-0000-000000000000",
      role: "owner",
    });

    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: "WORKSPACE_NOT_FOUND" });
  });
});
