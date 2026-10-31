import { Client } from "pg";
/**
 * apps/web/lib/__tests__/rl.integration.test.ts
 *
 * Testes de INTEGRAÇÃO com Postgres real — verifica que RLS está ativo
 * em `app.demos` e bloqueia SELECT/UPDATE entre tenants.
 *
 * Pré-requisito: container docker easydemo-test rodando em 127.0.0.1:55432
 * com schema 0000_init.sql aplicado.
 *
 * Uso:
 *   pnpm --filter web exec vitest run lib/__tests__/rl.integration.test.ts
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const DB_URL = process.env.DATABASE_URL ?? "postgres://app_user:easydemo@127.0.0.1:55432/easydemo";

// app_user = respeita RLS, app_owner = bypassa RLS.
// `DIRECT_URL` é a conexão app_owner canônica; o replace por username só
// funciona quando ambos os roles compartilham a mesma senha.
const APP_USER_URL = DB_URL;
const APP_OWNER_URL = process.env.DIRECT_URL ?? DB_URL.replace("app_user", "app_owner");

let adminClient: Client;
let workspaceAId: string;
let workspaceBId: string;
let demoAId: string;

async function asAppUser(fn: (client: Client) => Promise<void>, tenantId?: string) {
  const c = new Client({ connectionString: APP_USER_URL });
  await c.connect();
  try {
    if (tenantId) {
      await c.query("BEGIN");
      await c.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
    }
    await fn(c);
    if (tenantId) await c.query("COMMIT");
  } finally {
    await c.end();
  }
}

async function asAppOwner(fn: (client: Client) => Promise<void>) {
  const c = new Client({ connectionString: APP_OWNER_URL });
  await c.connect();
  try {
    await fn(c);
  } finally {
    await c.end();
  }
}

beforeAll(async () => {
  adminClient = new Client({ connectionString: APP_OWNER_URL });
  await adminClient.connect();

  // Limpa dados de testes anteriores (idempotente)
  await adminClient.query("DELETE FROM app.demos WHERE slug LIKE 'rl-test-%'");
  await adminClient.query("DELETE FROM app.workspaces WHERE slug LIKE 'rl-test-%'");

  // Cria workspace A
  const a = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ('rl-test-a', 'RL Test A', 'free') RETURNING id`,
  );
  workspaceAId = a.rows[0].id;

  // Cria workspace B
  const b = await adminClient.query<{ id: string }>(
    `INSERT INTO app.workspaces (slug, name, plan_id)
     VALUES ('rl-test-b', 'RL Test B', 'free') RETURNING id`,
  );
  workspaceBId = b.rows[0].id;

  // Cria demo em A — usando 'draft' para que a policy `demos_public_select`
  // (status='published') não exponha o demo a outros tenants neste teste.
  // O teste de isolamento RLS valida rows que NÃO são public-readable.
  const d = await adminClient.query<{ id: string }>(
    `INSERT INTO app.demos (workspace_id, slug, title, status, language)
     VALUES ($1, 'rl-test-demo-1', 'Demo Tenant A', 'draft', 'pt-BR')
     RETURNING id`,
    [workspaceAId],
  );
  demoAId = d.rows[0].id;
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

describe("RLS — isolamento entre tenants", () => {
  it("Tenant A vê seu próprio demo", async () => {
    await asAppUser(async (c) => {
      const res = await c.query("SELECT id, slug FROM app.demos WHERE id = $1", [demoAId]);
      expect(res.rows).toHaveLength(1);
      expect(res.rows[0].slug).toBe("rl-test-demo-1");
    }, workspaceAId);
  });

  it("Tenant B NÃO vê o demo de Tenant A (SELECT)", async () => {
    await asAppUser(async (c) => {
      const res = await c.query("SELECT id, slug FROM app.demos WHERE id = $1", [demoAId]);
      expect(res.rows).toHaveLength(0);
    }, workspaceBId);
  });

  it("Tenant B NÃO consegue UPDATE no demo de A (afeta 0 rows)", async () => {
    await asAppUser(async (c) => {
      const res = await c.query("UPDATE app.demos SET title = $1 WHERE id = $2", [
        "Hacked by B",
        demoAId,
      ]);
      expect(res.rowCount).toBe(0);
    }, workspaceBId);

    // Confirma que título original permanece
    const verify = await adminClient.query("SELECT title FROM app.demos WHERE id = $1", [demoAId]);
    expect(verify.rows[0].title).toBe("Demo Tenant A");
  });

  it("Tenant B NÃO consegue DELETE no demo de A", async () => {
    await asAppUser(async (c) => {
      const res = await c.query("DELETE FROM app.demos WHERE id = $1", [demoAId]);
      expect(res.rowCount).toBe(0);
    }, workspaceBId);

    // Demo ainda existe
    const verify = await adminClient.query("SELECT id FROM app.demos WHERE id = $1", [demoAId]);
    expect(verify.rows).toHaveLength(1);
  });

  it("Tenant B NÃO consegue INSERT com workspace_id de A (WITH CHECK)", async () => {
    await asAppUser(async (c) => {
      await expect(
        c.query(
          `INSERT INTO app.demos (workspace_id, slug, title, status, language)
             VALUES ($1, 'rl-test-evil', 'Cross-tenant insert', 'draft', 'pt-BR')`,
          [workspaceAId],
        ),
      ).rejects.toThrow(/row-level security|policy/i);
    }, workspaceBId);
  });

  it("Sem SET tenant_id, app_user vê 0 rows em app.demos (RLS bloqueia default)", async () => {
    await asAppUser(async (c) => {
      // Como nenhum tenant está configurado, RLS deve bloquear rows de tenants.
      // ATENÇÃO: a policy `demos_public_select` permite SELECT quando status='published',
      // então validamos APENAS rows não-public (status='draft') — esses DEVEM ser 0.
      const res = await c.query("SELECT COUNT(*)::int FROM app.demos WHERE status != 'published'");
      expect(res.rows[0].count).toBe(0);
    });
  });

  it("app_owner (BYPASSRLS) vê todos os tenants", async () => {
    await asAppOwner(async (c) => {
      const res = await c.query<{ count: string }>(
        "SELECT COUNT(*)::int AS count FROM app.workspaces WHERE slug LIKE 'rl-test-%'",
      );
      expect(Number(res.rows[0].count)).toBeGreaterThanOrEqual(2);
    });
  });
});
