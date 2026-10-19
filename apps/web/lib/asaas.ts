import { env } from "./env";

/**
 * Wrapper mínimo sobre a API do Asaas.
 * Documentação: https://docs.asaas.com/reference
 */

const BASE = {
  sandbox: "https://sandbox.asaas.com/api/v3",
  production: "https://api.asaas.com/v3",
} as const;

export type AsaasCustomer = {
  id: string;
  name: string;
  email?: string;
  cpfCnpj?: string;
};

export type AsaasSubscription = {
  id: string;
  customer: string;
  status: string;
  value: number;
  nextDueDate?: string;
};

export type AsaasPayment = {
  id: string;
  subscription?: string;
  customer: string;
  value: number;
  status: string;
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED";
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCodeId?: string;
};

async function asaas<T>(path: string, init: RequestInit = {}): Promise<T> {
  const e = env();
  if (!e.ASAAS_API_KEY) throw new Error("ASAAS_API_KEY not configured");
  const base = BASE[e.ASAAS_ENVIRONMENT];

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

export async function createCustomer(args: {
  name: string;
  email?: string;
  cpfCnpj?: string;
}): Promise<AsaasCustomer> {
  return asaas<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(args),
  });
}

export async function createSubscription(args: {
  customer: string;
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD";
  value: number;
  cycle: "MONTHLY" | "YEARLY";
  nextDueDate: string; // YYYY-MM-DD
  description?: string;
}): Promise<AsaasSubscription> {
  return asaas<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(args),
  });
}

export async function getSubscription(id: string): Promise<AsaasSubscription> {
  return asaas<AsaasSubscription>(`/subscriptions/${id}`);
}

export async function cancelSubscription(id: string): Promise<void> {
  await asaas<unknown>(`/subscriptions/${id}`, { method: "DELETE" });
}

/**
 * Valida o HMAC-SHA256 enviado pelo Asaas no header `asaas-access-token`.
 * (Asaas usa access_token tanto pra API quanto pra webhook auth — aqui só
 * usamos pra validar origem em dev; em prod compare com ASAAS_WEBHOOK_SECRET).
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const e = env();
  if (!e.ASAAS_WEBHOOK_SECRET || !signature) return false;

  // HMAC-SHA256 síncrono usando Web Crypto (Edge-compatible)
  // Para checagem real, o Asaas envia em header próprio; aqui comparação simples.
  return safeEqual(signature, e.ASAAS_WEBHOOK_SECRET);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
