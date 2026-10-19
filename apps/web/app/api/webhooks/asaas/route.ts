import { subscriptions, webhookEvents, workspaces } from "@/db/schema/app";
import { verifyWebhook } from "@/lib/billing/asaas";
import { getAdminDb } from "@/lib/db";
import { env } from "@/lib/env";
import { enqueue } from "@/lib/queue";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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

export async function POST(req: Request) {
  try {
    const e = env();
    const h = await headers();

    // Asaas usa header `asaas-access-token` com token fixo OU HMAC-SHA256 do body
    const token = h.get("asaas-access-token");
    const signature = h.get("asaas-signature");

    const rawBody = await req.text();

    // Defesa em profundidade — sem nenhum segredo configurado, recusamos.
    if (!e.ASAAS_WEBHOOK_SECRET && !e.ASAAS_API_KEY) {
      return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
    }

    if (signature) {
      // Validação HMAC-SHA256 — delega para a função pura testada em
      // lib/billing/asaas.ts (que usa timingSafeEqual com encoding hex correto).
      if (!e.ASAAS_WEBHOOK_SECRET) {
        return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
      }
      if (!verifyWebhook(rawBody, signature, e.ASAAS_WEBHOOK_SECRET)) {
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

    // ─────────── Idempotência persistente ───────────
    // Chave estável: provider + (event id composto). Usamos o Asaas `payment.id`
    // ou `subscription.id` quando presentes; senão caímos no par (event, customer).
    const asaasEventId =
      event.payment?.id ??
      event.subscription?.id ??
      `${event.event}:${event.subscription?.customer ?? event.payment?.customer ?? "unknown"}`;

    const idempotencyKey = `${event.event}:${asaasEventId}`;

    const db = getAdminDb();
    const inserted = await db
      .insert(webhookEvents)
      .values({
        provider: "asaas",
        eventId: idempotencyKey,
        eventType: event.event,
        // tenantId: tabela exige NOT NULL — webhook Asaas é multi-tenant; o
        // tenant real é resolvido depois (via asaasSubscriptionId → subscription
        // → workspace). Usamos um sentinel estável até a resolução.
        tenantId: "00000000-0000-0000-0000-000000000000",
        payload: event as unknown as Record<string, unknown>,
      })
      .onConflictDoNothing({
        target: [webhookEvents.provider, webhookEvents.eventId],
      })
      .returning({ id: webhookEvents.id });

    if (inserted.length === 0) {
      // Já vimos esse evento antes — não reprocessar side-effects.
      return NextResponse.json({ ok: true, deduplicated: true });
    }

    const insertedId = inserted[0]?.id;
    const markProcessed = async (error?: string) => {
      try {
        await db
          .update(webhookEvents)
          .set({
            processedAt: new Date(),
            payload: {
              ...(event as unknown as Record<string, unknown>),
              __processingError: error ?? null,
            },
          })
          .where(
            and(
              eq(webhookEvents.id, insertedId ?? "00000000-0000-0000-0000-000000000000"),
              eq(webhookEvents.provider, "asaas"),
              eq(webhookEvents.eventId, idempotencyKey),
            ),
          );
      } catch (err) {
        // Falha ao marcar é não-fatal — próxima replay será deduplicada.
        console.error("[/api/webhooks/asaas] markProcessed falhou:", err);
      }
    };

    // Helper para garantir que falhas também persistam um erro na linha.
    const guarded = async (fn: () => Promise<void>) => {
      try {
        await fn();
      } catch (err) {
        await markProcessed(err instanceof Error ? err.message : String(err));
        throw err;
      }
    };

    await guarded(async () => {
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
    });

    await enqueue({
      type: "sync_billing",
      asaasEventId: idempotencyKey,
    });

    // Marca o evento como processado (best-effort).
    void markProcessed();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/webhooks/asaas] error:", err);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}

async function handlePaymentConfirmed(payment: AsaasEvent["payment"] | undefined) {
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

async function handlePaymentOverdue(payment: AsaasEvent["payment"] | undefined) {
  if (!payment?.subscription) return;
  const db = getAdminDb();
  await db
    .update(subscriptions)
    .set({ status: "past_due", updatedAt: new Date() })
    .where(eq(subscriptions.asaasSubscriptionId, payment.subscription));
}

async function handlePaymentRefunded(payment: AsaasEvent["payment"] | undefined) {
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

async function handleSubscriptionUpdated(sub: AsaasEvent["subscription"] | undefined) {
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

async function handleSubscriptionDeleted(sub: AsaasEvent["subscription"] | undefined) {
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
