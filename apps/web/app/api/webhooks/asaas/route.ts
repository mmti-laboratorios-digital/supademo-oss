import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { getAdminDb } from "@/lib/db";
import { subscriptions, workspaces } from "@/db/schema/app";
import { env } from "@/lib/env";
import { enqueue } from "@/lib/queue";

export const runtime = "nodejs";

type AsaasEvent = {
  event:
    | "PAYMENT_CONFIRMED"
    | "PAYMENT_RECEIVED"
    | "PAYMENT_OVERDUE"
    | "PAYMENT_REFUNDED"
    | "PAYMENT_DELETED"
    | "SUBSCRIPTION_CREATED"
    | "SUBSCRIPTION_UPDATED"
    | "SUBSCRIPTION_DELETED"
    | "SUBSCRIPTION_INACTIVATED";
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

const IDEMPOTENCY = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const e = env();
    const h = await headers();

    // Asaas usa header `asaas-access-token` com token fixo OU HMAC-SHA256 do body
    const token = h.get("asaas-access-token");
    const signature = h.get("asaas-signature");

    const rawBody = await req.text();

    if (signature) {
      // Validação HMAC-SHA256(header.payload) — alguns eventos Asaas incluem isso.
      if (!e.ASAAS_WEBHOOK_SECRET) {
        return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
      }
      const expected = createHmac("sha256", e.ASAAS_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");
      if (
        signature.length !== expected.length ||
        !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
      ) {
        return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
      }
    } else if (token) {
      // Validação por token fixo (header `asaas-access-token`).
      if (!e.ASAAS_API_KEY || token !== e.ASAAS_API_KEY) {
        return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: "MISSING_AUTH" }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as AsaasEvent;
    const idempotencyKey = `${event.event}:${event.payment?.id ?? event.subscription?.id ?? ""}`;
    const last = IDEMPOTENCY.get(idempotencyKey);
    if (last && Date.now() - last < 60_000) {
      return NextResponse.json({ ok: true, deduplicated: true });
    }
    IDEMPOTENCY.set(idempotencyKey, Date.now());

    switch (event.event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        await handlePaymentConfirmed(event.payment);
        break;
      case "PAYMENT_OVERDUE":
        await handlePaymentOverdue(event.payment);
        break;
      case "PAYMENT_REFUNDED":
        await handlePaymentRefunded(event.payment);
        break;
      case "SUBSCRIPTION_CREATED":
      case "SUBSCRIPTION_UPDATED":
        await handleSubscriptionUpdated(event.subscription);
        break;
      case "SUBSCRIPTION_DELETED":
      case "SUBSCRIPTION_INACTIVATED":
        await handleSubscriptionDeleted(event.subscription);
        break;
      default:
        // noop — evento ignorado
        break;
    }

    await enqueue({
      type: "sync_billing",
      asaasEventId: `${event.event}:${event.payment?.id ?? event.subscription?.id ?? ""}`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/webhooks/asaas] error:", err);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}

async function handlePaymentConfirmed(
  payment: AsaasEvent["payment"] | undefined,
) {
  if (!payment?.subscription) return;
  const db = getAdminDb();
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.asaasSubscriptionId, payment.subscription))
    .limit(1);
  if (!sub) return;

  await db
    .update(subscriptions)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(subscriptions.id, sub.id));
  await db
    .update(workspaces)
    .set({ planId: sub.planId, updatedAt: new Date() })
    .where(eq(workspaces.id, sub.workspaceId));
}

async function handlePaymentOverdue(
  payment: AsaasEvent["payment"] | undefined,
) {
  if (!payment?.subscription) return;
  const db = getAdminDb();
  await db
    .update(subscriptions)
    .set({ status: "past_due", updatedAt: new Date() })
    .where(eq(subscriptions.asaasSubscriptionId, payment.subscription));
}

async function handlePaymentRefunded(
  payment: AsaasEvent["payment"] | undefined,
) {
  if (!payment?.subscription) return;
  const db = getAdminDb();
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.asaasSubscriptionId, payment.subscription))
    .limit(1);
  if (!sub) return;
  await db
    .update(subscriptions)
    .set({ status: "canceled", cancelAtPeriodEnd: true, updatedAt: new Date() })
    .where(eq(subscriptions.id, sub.id));
  await db
    .update(workspaces)
    .set({ planId: "free", updatedAt: new Date() })
    .where(eq(workspaces.id, sub.workspaceId));
}

async function handleSubscriptionUpdated(
  sub: AsaasEvent["subscription"] | undefined,
) {
  if (!sub) return;
  const db = getAdminDb();
  await db
    .update(subscriptions)
    .set({
      status: sub.status === "ACTIVE" ? "active" : sub.status.toLowerCase(),
      currentPeriodEnd: sub.nextDueDate ? new Date(sub.nextDueDate) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.asaasSubscriptionId, sub.id));
}

async function handleSubscriptionDeleted(
  sub: AsaasEvent["subscription"] | undefined,
) {
  if (!sub) return;
  const db = getAdminDb();
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.asaasSubscriptionId, sub.id))
    .limit(1);
  if (!row) return;
  await db
    .update(subscriptions)
    .set({ status: "canceled", updatedAt: new Date() })
    .where(eq(subscriptions.id, row.id));
  await db
    .update(workspaces)
    .set({ planId: "free", updatedAt: new Date() })
    .where(eq(workspaces.id, row.workspaceId));
}