/**
 * Tipos de billing compartilhados.
 */

export type PlanId = "free" | "pro" | "business";

export type Plan = {
  id: PlanId;
  namePtBr: string;
  nameEn: string;
  priceBrlCents: number;
  maxDemos: number | null;
  maxStepsPerDemo: number;
  maxLeadsPerMonth: number | null;
  maxViewsPerMonth: number | null;
  ttsMinutesPerMonth: number;
  aiTextRequestsPerMonth: number;
  features: string[];
};

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "trial"
  | "incomplete";

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