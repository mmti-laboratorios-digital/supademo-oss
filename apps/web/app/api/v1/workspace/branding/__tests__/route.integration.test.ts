/**
 * apps/web/app/api/v1/workspace/branding/__tests__/route.integration.test.ts
 *
 * F7.6 — o branding do workspace (cor primária + logo) é lido pelo player
 * público desde a F7, mas **não havia UI nem endpoint** para gravar. O
 * branding era inserido manualmente no banco.
 *
 * Este teste cobre o endpoint que fecha o loop.
 */
import { randomUUID } from "node:crypto";
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
  await adminClient.query("DELETE FROM app.workspaces WHERE slug LIKE 'branding-api-%'");

  const ws = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ('branding-api-test', 'Branding API Test', 'pro') RETURNING id`,
  );
  workspaceId = ws.rows[0].id;
});

afterAll(async () => {
  await adminClient.query("DELETE FROM app.workspaces WHERE id = $1", [workspaceId]);
  await adminClient.end();
});

function authAs(wsId: string) {
  mockRequireAuth.mockResolvedValueOnce({ userId: "user_1", orgId: wsId, role: "owner" });
}

describe("/api/v1/workspace/branding", () => {
  it("GET devolve o branding atual do workspace", async () => {
    authAs(workspaceId);
    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      brandColor: null,
      brandLogoR2Key: null,
    });
  });

  it("PATCH salva a cor primária", async () => {
    authAs(workspaceId);
    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/v1/workspace/branding", {
      method: "PATCH",
      body: JSON.stringify({ brandColor: "#2B6CB0" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ brandColor: "#2B6CB0" });

    // Persistiu de verdade?
    const { rows } = await adminClient.query<{ brand_color: string }>(
      "SELECT brand_color FROM app.workspaces WHERE id = $1",
      [workspaceId],
    );
    expect(rows[0]?.brand_color).toBe("#2B6CB0");
  });

  it("PATCH aceita cor de 3 dígitos e `null` para remover", async () => {
    authAs(workspaceId);
    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/v1/workspace/branding", {
      method: "PATCH",
      body: JSON.stringify({ brandColor: "#fff" }),
    });
    expect((await PATCH(req)).status).toBe(200);

    authAs(workspaceId);
    const req2 = new Request("http://localhost/api/v1/workspace/branding", {
      method: "PATCH",
      body: JSON.stringify({ brandColor: null }),
    });
    expect((await PATCH(req2)).status).toBe(200);

    const { rows } = await adminClient.query<{ brand_color: string | null }>(
      "SELECT brand_color FROM app.workspaces WHERE id = $1",
      [workspaceId],
    );
    expect(rows[0]?.brand_color).toBeNull();
  });

  it("PATCH salva a key do logo (apenas no prefixo do próprio tenant)", async () => {
    const key = `branding/${workspaceId}/logo-123.png`;
    authAs(workspaceId);
    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/v1/workspace/branding", {
      method: "PATCH",
      body: JSON.stringify({ brandLogoR2Key: key }),
    });
    expect((await PATCH(req)).status).toBe(200);

    const { rows } = await adminClient.query<{ brand_logo_r2_key: string }>(
      "SELECT brand_logo_r2_key FROM app.workspaces WHERE id = $1",
      [workspaceId],
    );
    expect(rows[0]?.brand_logo_r2_key).toBe(key);
  });

  it("PATCH rejeita key de logo de outro tenant", async () => {
    const foreignKey = `branding/${randomUUID()}/logo-999.png`;
    authAs(workspaceId);
    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/v1/workspace/branding", {
      method: "PATCH",
      body: JSON.stringify({ brandLogoR2Key: foreignKey }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: "KEY_OUTSIDE_TENANT" });
  });

  it("PATCH rejeita key de logo com prefixo fora do padrão branding/", async () => {
    authAs(workspaceId);
    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/v1/workspace/branding", {
      method: "PATCH",
      body: JSON.stringify({ brandLogoR2Key: "demos/qualquer-coisa/logo.png" }),
    });
    expect((await PATCH(req)).status).toBe(400);
  });

  it("PATCH rejeita cor fora do formato hex", async () => {
    authAs(workspaceId);
    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/v1/workspace/branding", {
      method: "PATCH",
      body: JSON.stringify({ brandColor: "azul" }),
    });
    expect((await PATCH(req)).status).toBe(400);
  });

  it("PATCH rejeita body sem nenhum campo reconhecível", async () => {
    authAs(workspaceId);
    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/v1/workspace/branding", {
      method: "PATCH",
      body: JSON.stringify({ outraCoisa: "x" }),
    });
    expect((await PATCH(req)).status).toBe(400);
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
    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/v1/workspace/branding", {
      method: "PATCH",
      body: JSON.stringify({ brandColor: "#123456" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: "NO_WORKSPACE" });
  });
});
