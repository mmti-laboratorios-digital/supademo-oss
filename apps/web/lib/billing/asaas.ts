/**
 * apps/web/lib/billing/asaas.ts
 *
 * Helpers de billing (Asaas) — status mapping, HMAC webhook, serialization,
 * criação de assinatura e mapeamento de preço.
 *
 * NOTA: este módulo vive fora de lib/asaas.ts (que é o wrapper HTTP). Aqui ficam
 * as funções PURAS — testáveis sem mockar fetch — e a camada de DTO do Asaas.
 * O `lib/asaas.ts` foi consolidado aqui na F4 (ver DEC-2026-11-01-025).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import type { PlanId, SubscriptionStatus } from "@easydemo/shared";

/**
 * Mapeia status Asaas → status interno (canonical).
 * Asaas retorna ACTIVE, INACTIVE, OVERDUE, EXPIRED, CANCELLED.
 */
export function mapAsaasStatus(asaas: string): SubscriptionStatus {
  switch (asaas.toUpperCase()) {
    case "ACTIVE":
      return "active";
    case "OVERDUE":
      return "past_due";
    case "INACTIVE":
    case "EXPIRED":
    case "CANCELLED":
      return "canceled";
    case "TRIAL":
      return "trial";
    default:
      return "incomplete";
  }
}

/**
 * Gera assinatura HMAC-SHA256 do payload com o secret.
 * O Asaas envia isso no header `asaas-signature`.
 */
export function signWebhook(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verifica assinatura do webhook. Const-time compare.
 */
export function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = signWebhook(payload, secret);
  if (signature.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

/**
 * Serializa dados de subscription para o formato aceito por Drizzle.
 * Trata campos opcionais com cuidado para não quebrar o schema.
 */
export type AsaasSubscriptionPayload = {
  workspaceId: string;
  planId: string;
  asaasSubscriptionId: string;
  status: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
};

export type DrizzleSubscriptionInsert = {
  workspaceId: string;
  planId: string;
  asaasSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  updatedAt: Date;
};

export function serializeSubscription(
  payload: AsaasSubscriptionPayload,
  opts: { cancelAtPeriodEnd?: boolean } = {},
): DrizzleSubscriptionInsert {
  return {
    workspaceId: payload.workspaceId,
    planId: payload.planId,
    asaasSubscriptionId: payload.asaasSubscriptionId,
    status: mapAsaasStatus(payload.status),
    currentPeriodStart: payload.currentPeriodStart ? new Date(payload.currentPeriodStart) : null,
    currentPeriodEnd: payload.currentPeriodEnd ? new Date(payload.currentPeriodEnd) : null,
    cancelAtPeriodEnd: opts.cancelAtPeriodEnd ?? false,
    updatedAt: new Date(),
  };
}

/**
 * Parseia payload de webhook Asaas com validação básica.
 * Lança erro em payload malformado.
 */
export type AsaasEvent = {
  event: string;
  payment?: {
    id: string;
    subscription?: string;
    customer: string;
    value: number;
    billingType: string;
    status: string;
  };
  subscription?: {
    id: string;
    customer: string;
    status: string;
    value: number;
    nextDueDate?: string;
  };
};

export function parseAsaasEvent(raw: string): AsaasEvent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Malformed JSON payload");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Malformed payload: not an object");
  }
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.event !== "string") {
    throw new Error("Malformed payload: missing `event` field");
  }
  return obj as unknown as AsaasEvent;
}

// ────────────────────────────────────────────────────────────────────────────
// Criação de assinatura (F4.2)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Método de cobrança suportado no MVP. O Brasil é PIX-first (§1 do plano),
 * mas boleto e cartão entram no mesmo endpoint — o `Asaas` decide o que
 * mostrar no checkout.
 */
export type BillingType = "PIX" | "BOLETO" | "CREDIT_CARD";

/** Ciclo de cobrança. O MVP vende mensal; anual fica para Fase 2. */
export type BillingCycle = "MONTHLY" | "YEARLY";

/**
 * DTO do customer Asaas. Espelha o subset que a API v3 usa.
 */
export type AsaasCustomer = {
  id: string;
  name: string;
  email?: string;
  cpfCnpj?: string;
};

/**
 * DTO da subscription Asaas.
 */
export type AsaasSubscription = {
  id: string;
  customer: string;
  status: string;
  value: number;
  nextDueDate?: string;
};

/**
 * DTO do payment Asaas (usado para montar a sessão de checkout).
 */
export type AsaasPayment = {
  id: string;
  subscription?: string;
  customer: string;
  value: number;
  status: string;
  billingType: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCodeId?: string;
};

/**
 * Converte BRL em centavos — a unidade que o Asaas espera.
 *
 * ⚠️ **Armadilha**: o `app.plans.price_brl_cents` JÁ está em centavos
 * (4900 = R$ 49,00). Esta função serve para o caso oposto (quando alguém
 * tem o preço em reais e precisa converter), e por isso arredonda.
 *
 * @param brl valor em reais (49.0 → 4900)
 */
export function brlToCents(brl: number): number {
  if (!Number.isFinite(brl)) {
    throw new Error(`Preço BRL inválido: ${brl}`);
  }
  return Math.round(brl * 100);
}

/**
 * Converte centavos em BRL — o inverso de `brlToCents`.
 */
export function centsToBrl(cents: number): number {
  if (!Number.isFinite(cents)) {
    throw new Error(`Preço em centavos inválido: ${cents}`);
  }
  return cents / 100;
}

/**
 * Argumentos de `createSubscription`.
 *
 * `valueCents` vem **do plano lido do banco** (`app.plans.price_brl_cents`),
 * nunca de um valor hardcoded no código — o preço é uma decisão comercial
 * que muda sem deploy.
 */
export type CreateSubscriptionArgs = {
  /** Planos que podem ser comprados. O Free não tem checkout. */
  planId: Exclude<PlanId, "free">;
  /** Workspace que está assinando — gravado no `app.subscriptions`. */
  workspaceId: string;
  /** Customer Asaas já criado. */
  customer: string;
  /** Preço em centavos (4900 = R$ 49,00). */
  valueCents: number;
  billingType?: BillingType;
  cycle?: BillingCycle;
  /** Data do primeiro vencimento — YYYY-MM-DD. Default: hoje. */
  nextDueDate?: string;
  description?: string;
};

/**
 * Monta o body da criação de subscription no Asaas.
 *
 * Função PURA (sem rede) — testável direto. O `createSubscription` de verdade
 * faz o POST.
 *
 * O `workspaceId` **não vai para o Asaas**: a API não conhece nosso modelo
 * multi-tenant. O vínculo com o workspace é feito localmente, na tabela
 * `app.subscriptions`, via `asaas_subscription_id`.
 */
export function buildSubscriptionPayload(args: CreateSubscriptionArgs): {
  customer: string;
  billingType: BillingType;
  value: number;
  cycle: BillingCycle;
  nextDueDate: string;
  description: string;
} {
  if (!Number.isInteger(args.valueCents) || args.valueCents <= 0) {
    throw new Error(`Valor da assinatura inválido: ${args.valueCents}`);
  }
  if (!args.customer) {
    throw new Error("Customer Asaas é obrigatório");
  }

  return {
    customer: args.customer,
    billingType: args.billingType ?? "PIX",
    value: args.valueCents,
    cycle: args.cycle ?? "MONTHLY",
    nextDueDate: args.nextDueDate ?? todayAsAsaasDate(),
    description: args.description ?? `EasyDemo ${args.planId}`,
  };
}

/**
 * Data de hoje no formato que o Asaas espera: `YYYY-MM-DD`.
 */
export function todayAsAsaasDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Formata um preço em centavos como label PT-BR: `4900` → `"R$ 49"`.
 *
 * Usado na página de billing (o `PlanCard` recebe `priceLabel` pronto).
 */
export function formatPriceBrl(cents: number): string {
  const value = centsToBrl(cents);
  const hasCents = Math.round((value % 1) * 100) !== 0;
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Camada HTTP (F4.3 — consolidada de `lib/asaas.ts`)
// ────────────────────────────────────────────────────────────────────────────

const ASAAS_BASE = {
  sandbox: "https://sandbox.asaas.com/api/v3",
  production: "https://api.asaas.com/v3",
} as const;

/**
 * Base da API do Asaas, com override para o mock local (`MOCK_ASAAS_URL`).
 *
 * O override existe para os testes de integração: o `mock-asaas.ts` sobe um
 * servidor em `127.0.0.1:65500` com o mesmo contrato da API v3. Sem isso, os
 * testes precisariam de rede.
 */
export function asaasBaseUrl(): string {
  const mock = process.env.MOCK_ASAAS_URL;
  if (mock) return `${mock.replace(/\/$/, "")}/v3`;
  const e = env();
  return ASAAS_BASE[e.ASAAS_ENVIRONMENT];
}

/**
 * `fetch` com autenticação no Asaas.
 *
 * O Asaas autentica com o header `access_token` (o mesmo token da API).
 * Erros da API são propagados com o body em texto — útil para o log, mas
 * nunca para o cliente (o route handler devolve 502 genérico).
 */
export async function asaasRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const e = env();
  if (!e.ASAAS_API_KEY) throw new Error("ASAAS_API_KEY not configured");
  const base = asaasBaseUrl();

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      access_token: e.ASAAS_API_KEY,
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Asaas ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

/**
 * Cria (ou reaproveita) um customer no Asaas.
 *
 * O Asaas não deduplica customers por e-mail. Para não criar um customer
 * novo a cada checkout, chamamos `GET /customers` filtrando por e-mail
 * primeiro. Se o `GET` falhar (ex.: customer inexistente), caímos no `POST`.
 */
export async function createCustomer(args: {
  name: string;
  email?: string;
  cpfCnpj?: string;
}): Promise<AsaasCustomer> {
  if (args.email) {
    const existing = await findCustomerByEmail(args.email);
    if (existing) return existing;
  }
  return asaasRequest<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(args),
  });
}

/**
 * Busca um customer pelo e-mail. Devolve `null` quando não existe.
 *
 * O endpoint de listagem do Asaas não tem filtro por e-mail — filtramos no
 * cliente. `GET /customers` devolve a lista paginada; o `limit` alto cobre o
 * caso de uso (um creator = poucos customers).
 */
export async function findCustomerByEmail(email: string): Promise<AsaasCustomer | null> {
  type ListResponse = { data?: AsaasCustomer[] };
  try {
    const res = await asaasRequest<ListResponse>("/customers?limit=100&offset=0");
    const list = res?.data ?? [];
    const match = list.find((c) => c.email?.toLowerCase() === email.toLowerCase());
    return match ?? null;
  } catch {
    // Listagem indisponível — seguimos para o POST (cria customer novo).
    return null;
  }
}

/**
 * Cria a assinatura no Asaas.
 *
 * O `workspaceId` é **apenas local** (vai para `app.subscriptions`); o Asaas
 * só conhece customer + valor + ciclo.
 */
export async function createSubscription(args: CreateSubscriptionArgs): Promise<AsaasSubscription> {
  const payload = buildSubscriptionPayload(args);
  return asaasRequest<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getSubscription(id: string): Promise<AsaasSubscription> {
  return asaasRequest<AsaasSubscription>(`/subscriptions/${id}`);
}

/**
 * Cancela a assinatura no Asaas.
 *
 * ⚠️ O Asaas **cobra o ciclo já pago** — cancelar não gera estorno. O
 * workspace volta para o Free no fim do ciclo (ver `cancelAtPeriodEnd` no
 * schema e o tratamento de `SUBSCRIPTION_INACTIVATED` no webhook).
 */
export async function cancelSubscription(id: string): Promise<void> {
  await asaasRequest<unknown>(`/subscriptions/${id}`, { method: "DELETE" });
}

/**
 * Cria o primeiro pagamento da assinatura (a cobrança do ciclo).
 *
 * É o pagamento que o Asaas manda no webhook `PAYMENT_RECEIVED` /
 * `PAYMENT_CONFIRMED` — é ele que promove o workspace para o plano pago.
 */
export async function createPayment(args: {
  customer: string;
  subscription?: string;
  value: number;
  dueDate?: string;
  billingType?: BillingType;
}): Promise<AsaasPayment> {
  return asaasRequest<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: args.customer,
      subscription: args.subscription,
      billingType: args.billingType ?? "PIX",
      value: args.value,
      dueDate: args.dueDate ?? todayAsAsaasDate(),
    }),
  });
}
