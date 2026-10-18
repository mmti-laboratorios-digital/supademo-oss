/**
 * apps/web/lib/billing/__tests__/asaas.test.ts
 *
 * Cobertura dos helpers Asaas puros — sem rede.
 */
import { describe, it, expect } from "vitest";
import {
  mapAsaasStatus,
  signWebhook,
  verifyWebhook,
  serializeSubscription,
  parseAsaasEvent,
} from "../asaas";

describe("mapAsaasStatus", () => {
  it.each([
    ["ACTIVE", "active"],
    ["INACTIVE", "canceled"],
    ["OVERDUE", "past_due"],
    ["CANCELLED", "canceled"],
    ["EXPIRED", "canceled"],
    ["TRIAL", "trial"],
    ["UNKNOWN", "incomplete"],
  ])("mapeia %s → %s", (asaas, expected) => {
    expect(mapAsaasStatus(asaas)).toBe(expected);
  });

  it("é case-insensitive", () => {
    expect(mapAsaasStatus("active")).toBe("active");
    expect(mapAsaasStatus("overdue")).toBe("past_due");
  });
});

describe("signWebhook + verifyWebhook", () => {
  const secret = "test-secret-do-not-use-in-prod";

  it("gera HMAC-SHA256 válido (64 hex chars)", () => {
    const sig = signWebhook('{"event":"PAYMENT_RECEIVED"}', secret);
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });

  it("verifyWebhook aceita assinatura correta", () => {
    const payload = '{"event":"PAYMENT_RECEIVED","payment":{"id":"pay_123"}}';
    const sig = signWebhook(payload, secret);
    expect(verifyWebhook(payload, sig, secret)).toBe(true);
  });

  it("verifyWebhook rejeita assinatura adulterada", () => {
    const payload = '{"event":"PAYMENT_RECEIVED"}';
    const sig = signWebhook(payload, secret);
    const tampered = `${sig.slice(0, -1)}0`;
    expect(verifyWebhook(payload, tampered, secret)).toBe(false);
  });

  it("verifyWebhook rejeita assinatura de outro payload", () => {
    const sig1 = signWebhook("payload-a", secret);
    expect(verifyWebhook("payload-b", sig1, secret)).toBe(false);
  });

  it("verifyWebhook rejeita quando secret é vazio", () => {
    expect(verifyWebhook("payload", "abc", "")).toBe(false);
  });

  it("verifyWebhook rejeita quando signature é vazio", () => {
    expect(verifyWebhook("payload", "", secret)).toBe(false);
  });
});

describe("serializeSubscription", () => {
  it("mapeia payload Asaas para Drizzle insert", () => {
    const out = serializeSubscription({
      workspaceId: "ws_123",
      planId: "pro",
      asaasSubscriptionId: "asaas_sub_abc",
      status: "ACTIVE",
      currentPeriodStart: "2024-01-01T00:00:00Z",
      currentPeriodEnd: "2024-02-01T00:00:00Z",
    });
    expect(out.workspaceId).toBe("ws_123");
    expect(out.planId).toBe("pro");
    expect(out.asaasSubscriptionId).toBe("asaas_sub_abc");
    expect(out.status).toBe("active");
    expect(out.currentPeriodStart).toBeInstanceOf(Date);
    expect(out.currentPeriodEnd).toBeInstanceOf(Date);
    expect(out.cancelAtPeriodEnd).toBe(false);
    expect(out.updatedAt).toBeInstanceOf(Date);
  });

  it("lida com campos opcionais ausentes", () => {
    const out = serializeSubscription({
      workspaceId: "ws_123",
      planId: "free",
      asaasSubscriptionId: "asaas_sub_xyz",
      status: "INACTIVE",
    });
    expect(out.status).toBe("canceled");
    expect(out.currentPeriodStart).toBeNull();
    expect(out.currentPeriodEnd).toBeNull();
  });

  it("respeita cancelAtPeriodEnd explicit", () => {
    const out = serializeSubscription(
      {
        workspaceId: "ws_1",
        planId: "pro",
        asaasSubscriptionId: "asaas_sub_1",
        status: "ACTIVE",
      },
      { cancelAtPeriodEnd: true },
    );
    expect(out.cancelAtPeriodEnd).toBe(true);
  });
});

describe("parseAsaasEvent", () => {
  it("parseia payload válido", () => {
    const raw = JSON.stringify({
      event: "PAYMENT_RECEIVED",
      payment: {
        id: "pay_1",
        subscription: "sub_1",
        customer: "cus_1",
        value: 4900,
        billingType: "PIX",
        status: "RECEIVED",
      },
    });
    const ev = parseAsaasEvent(raw);
    expect(ev.event).toBe("PAYMENT_RECEIVED");
    expect(ev.payment?.id).toBe("pay_1");
  });

  it("lança em JSON malformado", () => {
    expect(() => parseAsaasEvent("{not-json")).toThrow(/Malformed JSON/i);
  });

  it("lança em payload sem campo `event`", () => {
    expect(() => parseAsaasEvent('{"foo":"bar"}')).toThrow(/event/i);
  });

  it("lança em payload não-objeto", () => {
    expect(() => parseAsaasEvent("null")).toThrow();
    expect(() => parseAsaasEvent("\"string\"")).toThrow();
  });
});