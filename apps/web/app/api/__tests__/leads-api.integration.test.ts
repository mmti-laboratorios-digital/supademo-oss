import { randomUUID } from "node:crypto";
import { Client } from "pg";
/**
 * apps/web/app/api/__tests__/leads-api.integration.test.ts
 *
 * Gate G2 — contrato HTTP da captura de lead.
 *
 * Usa Postgres real e mocka apenas o Clerk (`requireAuth`). Cobre:
 * - demo publicada → lead criado com consentimento registrado;
 * - submit sem consentimento → 400;
 * - demo em draft → 404 (não é pública);
 * - demo inexistente → 404;
 * - o `workspaceId` é derivado do demo (lead não cai em outro workspace);
 * - export CSV devolve os leads do próprio tenant.
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

// O server action `captureLead` lê `headers()` do Next (IP/UA para hash).
// Fora de um request scope isso lança — mockamos com headers vazios.
vi.mock("next/headers", async () => {
  return {
    headers: async () => ({
      get: () => null,
    }),
  };
});

let adminClient: Client;
let workspaceId: string;
let otherWorkspaceId: string;
let publishedDemoId: string;
let draftDemoId: string;

beforeAll(async () => {
  adminClient = new Client({ connectionString: APP_OWNER_URL });
  await adminClient.connect();

  const a = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ($1, 'Leads API Test', 'free') RETURNING id`,
    [`leads-api-${randomUUID().slice(0, 8)}`],
  );
  workspaceId = a.rows[0].id;

  const b = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ($1, 'Outro Leads API', 'free') RETURNING id`,
    [`leads-api-other-${randomUUID().slice(0, 8)}`],
  );
  otherWorkspaceId = b.rows[0].id;

  const published = await adminClient.query<{ id: string }>(
    `INSERT INTO app.demos (workspace_id, slug, title, status, language, lead_form_enabled)
     VALUES ($1, $2, 'Demo publicada', 'published', 'pt-BR', true) RETURNING id`,
    [workspaceId, `leads-api-${randomUUID().slice(0, 12)}`],
  );
  publishedDemoId = published.rows[0].id;

  const draft = await adminClient.query<{ id: string }>(
    `INSERT INTO app.demos (workspace_id, slug, title, status, language, lead_form_enabled)
     VALUES ($1, $2, 'Demo rascunho', 'draft', 'pt-BR', true) RETURNING id`,
    [workspaceId, `leads-api-draft-${randomUUID().slice(0, 12)}`],
  );
  draftDemoId = draft.rows[0].id;
});

afterAll(async () => {
  await adminClient.query("DELETE FROM app.workspaces WHERE id = ANY($1::uuid[])", [
    [workspaceId, otherWorkspaceId],
  ]);
  await adminClient.end();
});

function post(body: unknown) {
  return new Request("http://localhost/api/v1/leads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/leads — gate G2", () => {
  it("demo publicada + consentimento → 201 e lead gravado com consentText/consentAt", async () => {
    const { POST } = await import("../v1/leads/route");
    const res = await POST(
      post({
        demoId: publishedDemoId,
        name: "Ana Souza",
        email: "ana@example.com",
        phone: "+55 11 99999-0000",
        consent: true,
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.leadId).toBeTruthy();

    const row = await adminClient.query<{
      name: string;
      email: string;
      phone: string;
      consent_text: string;
      consent_at: Date;
      workspace_id: string;
      demo_id: string;
    }>(
      `SELECT name, email, phone, consent_text, consent_at, workspace_id, demo_id
       FROM app.leads WHERE id = $1`,
      [body.leadId],
    );
    expect(row.rows[0]?.name).toBe("Ana Souza");
    expect(row.rows[0]?.email).toBe("ana@example.com");
    expect(row.rows[0]?.consent_text).toContain("13.709/2018");
    expect(row.rows[0]?.consent_at).toBeInstanceOf(Date);
    // workspaceId vem do demo, não do cliente.
    expect(row.rows[0]?.workspace_id).toBe(workspaceId);
    expect(row.rows[0]?.demo_id).toBe(publishedDemoId);
  });

  it("sem consentimento → 400", async () => {
    const { POST } = await import("../v1/leads/route");
    const res = await POST(
      post({
        demoId: publishedDemoId,
        name: "Sem Consentimento",
        email: "sem@example.com",
        consent: false,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("BAD_REQUEST");
    expect(body.message).toContain("Consentimento");
  });

  it("demo em draft → 404", async () => {
    const { POST } = await import("../v1/leads/route");
    const res = await POST(
      post({
        demoId: draftDemoId,
        name: "Rascunho",
        email: "rascunho@example.com",
        consent: true,
      }),
    );
    expect(res.status).toBe(404);
  });

  it("demo inexistente → 404", async () => {
    const { POST } = await import("../v1/leads/route");
    const res = await POST(
      post({
        demoId: randomUUID(),
        name: "Fantasma",
        email: "fantasma@example.com",
        consent: true,
      }),
    );
    expect(res.status).toBe(404);
  });

  it("e-mail inválido → 400", async () => {
    const { POST } = await import("../v1/leads/route");
    const res = await POST(
      post({
        demoId: publishedDemoId,
        name: "Email Ruim",
        email: "nao-e-email",
        consent: true,
      }),
    );
    expect(res.status).toBe(400);
  });

  it("o cliente não consegue escolher o workspace — o lead cai no demo", async () => {
    const { POST } = await import("../v1/leads/route");
    const res = await POST(
      post({
        demoId: publishedDemoId,
        workspaceId: otherWorkspaceId,
        name: "Tentativa de Injeção",
        email: "injection@example.com",
        consent: true,
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();

    const row = await adminClient.query<{ workspace_id: string }>(
      "SELECT workspace_id FROM app.leads WHERE id = $1",
      [body.leadId],
    );
    expect(row.rows[0]?.workspace_id).toBe(workspaceId);
  });
});

describe("GET /api/v1/demos/:id/leads/export — gate G2", () => {
  it("devolve CSV dos leads do tenant", async () => {
    mockRequireAuth.mockResolvedValue({
      userId: "user_1",
      orgId: workspaceId,
      role: "owner" as const,
    });
    const { GET } = await import("../v1/demos/[id]/leads/export/route");
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: publishedDemoId }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");

    const csv = await res.text();
    expect(csv).toContain("nome,email,telefone");
    expect(csv).toContain("ana@example.com");
  });

  it("demo de outro tenant → 404 (RLS)", async () => {
    mockRequireAuth.mockResolvedValue({
      userId: "user_2",
      orgId: otherWorkspaceId,
      role: "owner" as const,
    });
    const { GET } = await import("../v1/demos/[id]/leads/export/route");
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: publishedDemoId }),
    });
    expect(res.status).toBe(404);
  });
});
