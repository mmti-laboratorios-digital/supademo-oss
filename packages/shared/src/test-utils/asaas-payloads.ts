/**
 * packages/shared/src/test-utils/asaas-payloads.ts
 * -----------------------------------------------------------------------------
 * Fakers + helpers para construir payloads de webhook Asaas válidos.
 *
 * Estes helpers produzem o EXATO formato que o nosso handler
 * `/api/webhooks/asaas` espera. O mock server em
 * `apps/web/scripts/mock-asaas.ts` produz objetos no mesmo schema
 * (Asaas v3) para customers/subscriptions/payments.
 *
 * Mantemos aqui apenas o subset que este projeto consome — não tentamos
 * replicar 100% da spec do Asaas.
 */
import { createHmac, randomUUID } from "node:crypto";

// -----------------------------------------------------------------------------
// Event types
// -----------------------------------------------------------------------------
export type AsaasWebhookEvent =
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_DELETED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPDATED"
  | "SUBSCRIPTION_DELETED"
  | "SUBSCRIPTION_INACTIVATED";

export type BillingType = "CREDIT_CARD" | "PIX" | "BOLETO" | "UNDEFINED";

// -----------------------------------------------------------------------------
// Payload builders
// -----------------------------------------------------------------------------
export type AsaasWebhookPayload = {
  event: AsaasWebhookEvent;
  payment?: {
    id: string;
    customer: string;
    subscription?: string;
    value: number;
    netValue?: number;
    billingType: BillingType;
    status: string;
    dueDate?: string;
    confirmedDate?: string;
  };
  subscription?: {
    id: string;
    customer: string;
    status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "OVERDUE";
    value: number;
    nextDueDate?: string;
  };
};

export type AsaasWebhookPayloadOpts = {
  event: AsaasWebhookEvent;
  /** Optional override — defaults to a deterministic-ish unique id. */
  paymentId?: string;
  subscriptionId: string;
  customerId: string;
  /** Optional override — defaults to random. */
  value?: number;
  /** Optional override — defaults to PIX. */
  billingType?: BillingType;
};

/**
 * Build a webhook payload matching the shape consumed by
 * `apps/web/app/api/webhooks/asaas/route.ts`.
 *
 * Coverage of events:
 *   - PAYMENT_RECEIVED      → returns payload with `payment.status = "RECEIVED"`
 *   - PAYMENT_OVERDUE       → returns payload with `payment.status = "OVERDUE"`
 *   - PAYMENT_REFUNDED      → returns payload with `payment.status = "REFUNDED"`
 *   - PAYMENT_CONFIRMED     → returns payload with `payment.status = "CONFIRMED"`
 *   - PAYMENT_DELETED       → returns payload with `payment.status = "DELETED"`
 *   - SUBSCRIPTION_INACTIVATED → returns payload with `subscription.status = "INACTIVE"`
 *   - SUBSCRIPTION_CREATED / UPDATED → returns payload with `subscription.status = "ACTIVE"`
 *   - SUBSCRIPTION_DELETED  → returns payload with `subscription.status = "INACTIVE"`
 */
export function asaasWebhookPayload(opts: AsaasWebhookPayloadOpts): AsaasWebhookPayload {
  const paymentId = opts.paymentId ?? `pay_${randomUUID().slice(0, 14)}`;
  const value = opts.value ?? 4900;
  const billingType = opts.billingType ?? "PIX";
  const dueDate = new Date().toISOString().slice(0, 10);

  // Pure-subscription events: only build the `subscription` field
  if (opts.event === "SUBSCRIPTION_INACTIVATED" || opts.event === "SUBSCRIPTION_DELETED") {
    return {
      event: opts.event,
      subscription: {
        id: opts.subscriptionId,
        customer: opts.customerId,
        status: "INACTIVE",
        value,
        nextDueDate: dueDate,
      },
    };
  }
  if (opts.event === "SUBSCRIPTION_CREATED" || opts.event === "SUBSCRIPTION_UPDATED") {
    return {
      event: opts.event,
      subscription: {
        id: opts.subscriptionId,
        customer: opts.customerId,
        status: "ACTIVE",
        value,
        nextDueDate: dueDate,
      },
    };
  }

  // Payment events
  const paymentStatus = paymentStatusForEvent(opts.event);
  const payload: AsaasWebhookPayload = {
    event: opts.event,
    payment: {
      id: paymentId,
      customer: opts.customerId,
      subscription: opts.subscriptionId,
      value,
      netValue: value - 100,
      billingType,
      status: paymentStatus,
      dueDate,
      confirmedDate: paymentStatus === "RECEIVED" || paymentStatus === "CONFIRMED"
        ? new Date().toISOString()
        : undefined,
    },
  };
  return payload;
}

function paymentStatusForEvent(event: AsaasWebhookEvent): string {
  switch (event) {
    case "PAYMENT_RECEIVED":
      return "RECEIVED";
    case "PAYMENT_CONFIRMED":
      return "CONFIRMED";
    case "PAYMENT_OVERDUE":
      return "OVERDUE";
    case "PAYMENT_REFUNDED":
      return "REFUNDED";
    case "PAYMENT_DELETED":
      return "DELETED";
    default:
      return "PENDING";
  }
}

// -----------------------------------------------------------------------------
// Signature helpers
// -----------------------------------------------------------------------------
/**
 * Compute the HMAC-SHA256 hex digest of a payload using the webhook secret.
 *
 * The handler at `apps/web/app/api/webhooks/asaas/route.ts` reads the signature
 * from the `asaas-signature` header and compares it to `HMAC(secret, rawBody)`.
 * Use this helper in tests and the manual fire script to sign payloads.
 */
export function asaasWebhookSignature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Convenience: sign + serialize in one call.
 */
export function asaasSignedBody(
  opts: AsaasWebhookPayloadOpts,
  secret: string,
): { rawBody: string; signature: string } {
  const payload = asaasWebhookPayload(opts);
  const rawBody = JSON.stringify(payload);
  const signature = asaasWebhookSignature(rawBody, secret);
  return { rawBody, signature };
}