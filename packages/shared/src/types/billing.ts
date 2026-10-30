/**
 * Tipos de billing compartilhados.
 */

export type PlanId = "free" | "pro" | "business";

/**
 * Plano do catálogo. Espelha `docs/MVP-PLAN.md` §5 e o bloco `pricing_brl`
 * de `specs/mvp-scope.json`.
 *
 * `null` em um limite significa **ilimitado** — em especial
 * `maxViewsPerMonth`, que é `null` nos 3 planos (decisão D1: cobrança por
 * creator seat, nunca por viewer).
 */
export type Plan = {
  id: PlanId;
  namePtBr: string;
  nameEn: string;
  priceBrlCents: number;
  /** Creators inclusos no plano (decisão D1). */
  maxCreators: number;
  maxDemos: number | null;
  maxStepsPerDemo: number | null;
  maxLeadsPerMonth: number | null;
  maxViewsPerMonth: number | null;
  ttsMinutesPerMonth: number | null;
  aiTextRequestsPerMonth: number | null;
  linkTtlDays: number;
  customDomain: boolean;
  watermarkOnCta: boolean;
  /** D2: o plano Free captura lead. */
  leadForm: boolean;
  features: string[];
};

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trial" | "incomplete";

export type Subscription = {
  id: string;
  workspaceId: string;
  planId: PlanId;
  asaasSubscriptionId: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

export type AsaasWebhookEventType =
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_DELETED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPDATED"
  | "SUBSCRIPTION_DELETED"
  | "SUBSCRIPTION_INACTIVATED";
