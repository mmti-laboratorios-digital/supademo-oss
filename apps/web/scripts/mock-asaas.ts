import { randomUUID } from "node:crypto";
/* eslint-disable no-console */
/**
 * apps/web/scripts/mock-asaas.ts
 * -----------------------------------------------------------------------------
 * Mock server local que imita o subset da API Asaas usado por este projeto:
 *
 *   POST   /v3/customers          → 201 + { id, ... }
 *   POST   /v3/subscriptions      → 201 + { id, status: "ACTIVE", ... }
 *   POST   /v3/payments           → 201 + { id, status: "PENDING", ... }
 *   GET    /v3/subscriptions/:id  → 200 + { id, status, ... }
 *   DELETE /v3/subscriptions/:id  → 200 + { id, status: "INACTIVE" ... }
 *
 * Suporta todos os billing types: CREDIT_CARD | PIX | BOLETO.
 *
 * Não dispara webhooks reais — os testes/scripts que usam este mock
 * disparam o webhook manualmente contra /api/webhooks/asaas.
 *
 * Uso standalone (smoke manual):
 *   $ pnpm --filter web exec tsx scripts/mock-asaas.ts
 *   $ PORT=65501 pnpm --filter web exec tsx scripts/mock-asaas.ts
 *
 * Uso programático (vitest globalSetup ou outros):
 *   import { startMockAsaas } from "./scripts/mock-asaas";
 *   const server = await startMockAsaas({ port: 65500 });
 *   ...
 *   await server.stop();
 */
import { type IncomingMessage, type Server, type ServerResponse, createServer } from "node:http";

// -----------------------------------------------------------------------------
// Types — mirrors the real Asaas v3 schema for the subset we use.
// -----------------------------------------------------------------------------
type BillingType = "CREDIT_CARD" | "PIX" | "BOLETO" | "UNDEFINED";
type SubscriptionCycle =
  | "MONTHLY"
  | "YEARLY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "QUARTERLY"
  | "SEMIANNUALLY";

type AsaasCustomer = {
  id: string;
  name: string;
  email?: string;
  cpfCnpj?: string;
  dateCreated: string;
};

type AsaasSubscription = {
  id: string;
  customer: string;
  billingType: BillingType;
  value: number;
  cycle: SubscriptionCycle;
  nextDueDate: string; // YYYY-MM-DD
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "OVERDUE";
  description?: string;
  dateCreated: string;
};

type AsaasPayment = {
  id: string;
  customer: string;
  subscription?: string;
  billingType: BillingType;
  value: number;
  netValue: number;
  status: "PENDING" | "RECEIVED" | "CONFIRMED" | "OVERDUE" | "REFUNDED" | "DELETED";
  dueDate: string;
  confirmedDate?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCodeId?: string;
  dateCreated: string;
};

// -----------------------------------------------------------------------------
// In-memory store
// -----------------------------------------------------------------------------
type Store = {
  customers: Map<string, AsaasCustomer>;
  subscriptions: Map<string, AsaasSubscription>;
  payments: Map<string, AsaasPayment>;
};

function newStore(): Store {
  return {
    customers: new Map(),
    subscriptions: new Map(),
    payments: new Map(),
  };
}

// -----------------------------------------------------------------------------
// HTTP helpers
// -----------------------------------------------------------------------------
function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error(`invalid JSON body: ${(err as Error).message}`));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(payload),
    "access-control-allow-origin": "*",
  });
  res.end(payload);
}

function sendError(res: ServerResponse, status: number, error: string, description?: string): void {
  const body: Record<string, unknown> = { error };
  if (description) body.description = description;
  sendJson(res, status, body);
}

// -----------------------------------------------------------------------------
// Route handlers
// -----------------------------------------------------------------------------
type Ctx = { store: Store; req: IncomingMessage; res: ServerResponse; body: unknown; url: URL };

async function handleCreateCustomer(ctx: Ctx): Promise<void> {
  const { res, store, body } = ctx;
  const b = body as Partial<AsaasCustomer>;
  if (!b?.name) {
    return sendError(res, 400, "name_required", "Field 'name' is required");
  }
  const id = `cus_${randomUUID().slice(0, 14)}`;
  const customer: AsaasCustomer = {
    id,
    name: b.name,
    email: b.email,
    cpfCnpj: b.cpfCnpj,
    dateCreated: new Date().toISOString(),
  };
  store.customers.set(id, customer);
  sendJson(res, 201, customer);
}

async function handleCreateSubscription(ctx: Ctx): Promise<void> {
  const { res, store, body } = ctx;
  const b = body as Partial<AsaasSubscription>;
  if (
    !b?.customer ||
    !b?.billingType ||
    typeof b?.value !== "number" ||
    !b?.cycle ||
    !b?.nextDueDate
  ) {
    return sendError(
      res,
      400,
      "invalid_subscription",
      "Required fields: customer, billingType, value, cycle, nextDueDate",
    );
  }
  if (!["CREDIT_CARD", "PIX", "BOLETO"].includes(b.billingType)) {
    return sendError(res, 400, "invalid_billing_type", `Unsupported billingType: ${b.billingType}`);
  }
  if (!store.customers.has(b.customer)) {
    return sendError(res, 404, "customer_not_found", `Customer ${b.customer} does not exist`);
  }
  const id = `sub_${randomUUID().slice(0, 14)}`;
  const subscription: AsaasSubscription = {
    id,
    customer: b.customer,
    billingType: b.billingType,
    value: b.value,
    cycle: b.cycle,
    nextDueDate: b.nextDueDate,
    status: "ACTIVE",
    description: b.description,
    dateCreated: new Date().toISOString(),
  };
  store.subscriptions.set(id, subscription);
  sendJson(res, 201, subscription);
}

async function handleGetSubscription(ctx: Ctx): Promise<void> {
  const { res, store, url } = ctx;
  const id = url.pathname.split("/").pop();
  if (!id) return sendError(res, 400, "id_required");
  const sub = store.subscriptions.get(id);
  if (!sub) {
    return sendError(res, 404, "subscription_not_found", `Subscription ${id} does not exist`);
  }
  sendJson(res, 200, sub);
}

async function handleDeleteSubscription(ctx: Ctx): Promise<void> {
  const { res, store, url } = ctx;
  const id = url.pathname.split("/").pop();
  if (!id) return sendError(res, 400, "id_required");
  const sub = store.subscriptions.get(id);
  if (!sub) {
    return sendError(res, 404, "subscription_not_found", `Subscription ${id} does not exist`);
  }
  const updated: AsaasSubscription = { ...sub, status: "INACTIVE" };
  store.subscriptions.set(id, updated);
  sendJson(res, 200, {
    id,
    status: updated.status,
    dateDeleted: new Date().toISOString(),
  });
}

async function handleCreatePayment(ctx: Ctx): Promise<void> {
  const { res, store, body } = ctx;
  const b = body as Partial<AsaasPayment>;
  if (!b?.customer || !b?.billingType || typeof b?.value !== "number" || !b?.dueDate) {
    return sendError(
      res,
      400,
      "invalid_payment",
      "Required fields: customer, billingType, value, dueDate",
    );
  }
  if (!["CREDIT_CARD", "PIX", "BOLETO"].includes(b.billingType)) {
    return sendError(res, 400, "invalid_billing_type", `Unsupported billingType: ${b.billingType}`);
  }
  if (!store.customers.has(b.customer)) {
    return sendError(res, 404, "customer_not_found", `Customer ${b.customer} does not exist`);
  }
  if (b.subscription && !store.subscriptions.has(b.subscription)) {
    return sendError(
      res,
      404,
      "subscription_not_found",
      `Subscription ${b.subscription} does not exist`,
    );
  }
  const id = `pay_${randomUUID().slice(0, 14)}`;
  const payment: AsaasPayment = {
    id,
    customer: b.customer,
    subscription: b.subscription,
    billingType: b.billingType,
    value: b.value,
    netValue: b.netValue ?? b.value,
    status: "PENDING",
    dueDate: b.dueDate,
    invoiceUrl: `https://mock.asaas/invoices/${id}`,
    bankSlipUrl: b.billingType === "BOLETO" ? `https://mock.asaas/boleto/${id}` : undefined,
    pixQrCodeId: b.billingType === "PIX" ? `pix_${randomUUID().slice(0, 10)}` : undefined,
    dateCreated: new Date().toISOString(),
  };
  store.payments.set(id, payment);
  sendJson(res, 201, payment);
}

// -----------------------------------------------------------------------------
// Server bootstrap
// -----------------------------------------------------------------------------
export type MockAsaasServer = {
  port: number;
  url: string;
  stop: () => Promise<void>;
  /** Test-only: reset all in-memory state without restarting the server. */
  reset: () => void;
};

export type StartOptions = {
  port?: number;
  host?: string;
  /** Override for tests; defaults to a fresh store. */
  store?: Store;
  /** Quiet by default; set true to silence per-request logs. */
  silent?: boolean;
};

export async function startMockAsaas(opts: StartOptions = {}): Promise<MockAsaasServer> {
  const port = opts.port ?? Number(process.env.MOCK_ASAAS_PORT ?? 65500);
  const host = opts.host ?? process.env.MOCK_ASAAS_HOST ?? "127.0.0.1";
  const store = opts.store ?? newStore();
  const silent = opts.silent ?? false;

  const server: Server = createServer(async (req, res) => {
    try {
      if (!req.url || !req.method) {
        return sendError(res, 400, "bad_request");
      }
      // CORS preflight (loose — local dev only)
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
          "access-control-allow-headers":
            "content-type,access_token,asaas-access-token,asaas-signature",
        });
        return res.end();
      }

      const url = new URL(req.url, `http://${req.headers.host ?? `${host}:${port}`}`);
      const route = `${req.method} ${url.pathname}`;
      let body: unknown = {};
      if (req.method === "POST" || req.method === "PUT") {
        body = await readJsonBody(req);
      }
      const ctx: Ctx = { store, req, res, body, url };

      if (!silent) {
        console.log(`[mock-asaas] ← ${route}`);
      }

      // Routes — order matters
      if (req.method === "POST" && url.pathname === "/v3/customers") {
        return handleCreateCustomer(ctx);
      }
      if (req.method === "POST" && url.pathname === "/v3/subscriptions") {
        return handleCreateSubscription(ctx);
      }
      if (req.method === "POST" && url.pathname === "/v3/payments") {
        return handleCreatePayment(ctx);
      }
      if (req.method === "GET" && /^\/v3\/subscriptions\/[^/]+$/.test(url.pathname)) {
        return handleGetSubscription(ctx);
      }
      if (req.method === "DELETE" && /^\/v3\/subscriptions\/[^/]+$/.test(url.pathname)) {
        return handleDeleteSubscription(ctx);
      }
      return sendError(res, 404, "route_not_found", route);
    } catch (err) {
      console.error("[mock-asaas] handler error:", err);
      sendError(res, 500, "internal_error", (err as Error).message);
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve());
  });

  const url = `http://${host}:${port}`;
  if (!silent) {
    console.log(`[mock-asaas] ✓ listening on ${url}`);
  }

  return {
    port,
    url,
    stop: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
    reset: () => {
      store.customers.clear();
      store.subscriptions.clear();
      store.payments.clear();
    },
  };
}

// -----------------------------------------------------------------------------
// CLI entry
// -----------------------------------------------------------------------------
async function main(): Promise<void> {
  const server = await startMockAsaas();
  console.log(`[mock-asaas] ready — POST /v3/customers, /v3/subscriptions, /v3/payments`);
  console.log(`[mock-asaas] press Ctrl+C to stop`);

  const shutdown = async (signal: string) => {
    console.log(`\n[mock-asaas] ${signal} received, shutting down…`);
    await server.stop();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

// Run when invoked directly (not when imported)
const isDirect = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isDirect) {
  main().catch((err) => {
    console.error("[mock-asaas] fatal:", err);
    process.exit(1);
  });
}
