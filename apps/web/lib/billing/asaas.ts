/**
 * apps/web/lib/billing/asaas.ts
 *
 * Helpers de billing (Asaas) — status mapping, HMAC webhook, serialization.
 *
 * NOTA: este módulo vive fora de lib/asaas.ts (que é o wrapper HTTP). Aqui ficam
 * as funções PURAS — testáveis sem mockar fetch.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { SubscriptionStatus } from "@demo.br/shared";

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
