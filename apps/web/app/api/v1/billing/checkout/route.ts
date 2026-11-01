import { subscriptions, workspaces } from "@/db/schema/app";
import { requireAuth } from "@/lib/auth";
import {
  createCustomer,
  createPayment,
  createSubscription,
  todayAsAsaasDate,
} from "@/lib/billing/asaas";
import { withTenant } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

/**
 * POST /api/v1/billing/checkout
 * -----------------------------------------------------------------------------
 * Cria a sessão de assinatura no Asaas e devolve a URL de checkout.
 *
 * O gate G3 depende deste endpoint: o creator clica em "Upgrade via PIX" na
 * página `/billing`, cai aqui, e é levado ao checkout do Asaas (PIX).
 *
 * ⚠️ **`workspaceId` NÃO vem do cliente.** Vem da sessão (`requireAuth()`),
 * pela mesma razão do endpoint de lead (DEC-2026-11-01-024): se o cliente
 * mandasse o `workspaceId`, ele poderia assinar o plano em nome de outro
 * workspace. Aceitamos o campo no body por compatibilidade com o
 * `ctaHref` da página de billing, mas **ignoramos** o valor — se vier
 * diferente da sessão, devolvemos 403.
 *
 * Fluxo:
 *   1. Valida o plano pedido (só "pro" e "business" têm checkout).
 *   2. Lê o preço do plano do banco (`app.plans.price_brl_cents`).
 *   3. Cria (ou reaproveita) o customer no Asaas.
 *   4. Cria a subscription no Asaas.
 *   5. Grava a row em `app.subscriptions` com status "incomplete" — o plano
 *      só é promovido quando o webhook `PAYMENT_RECEIVED`/`PAYMENT_CONFIRMED`
 *      chega.
 *   6. Cria o primeiro pagamento (a cobrança do ciclo) e devolve a URL.
 */

const checkoutSchema = z.object({
  /** Plano desejado. "free" não tem checkout. */
  plan: z.enum(["pro", "business"]),
  /**
   * Aceito por compatibilidade com o `ctaHref` (`?plan=pro&workspaceId=...`),
   * mas **ignorado** — o workspace é sempre o da sessão.
   */
  workspaceId: z.string().uuid().optional(),
  /** Método de cobrança preferido. Default: PIX (Brasil-first, §1 do plano). */
  billingType: z.enum(["PIX", "BOLETO", "CREDIT_CARD"]).default("PIX"),
});

export async function POST(req: Request) {
  try {
    const { orgId } = await requireAuth();

    const body = await readBody(req);
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "BAD_REQUEST", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { plan, billingType } = parsed.data;

    // O `workspaceId` do body, se veio, precisa bater com a sessão.
    if (parsed.data.workspaceId && parsed.data.workspaceId !== orgId) {
      return NextResponse.json({ error: "WORKSPACE_MISMATCH" }, { status: 403 });
    }

    // ─── 1. Preço vem do banco, nunca do cliente ───
    const limits = await getPlanPrice(plan);

    // ─── 2. Já tem assinatura ativa? Não criamos outra. ───
    const existing = await withTenant(orgId, async (db) => {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.workspaceId, orgId))
        .limit(1);
      return sub ?? null;
    });

    if (existing && existing.status === "active" && existing.planId === plan) {
      return NextResponse.json(
        {
          error: "ALREADY_SUBSCRIBED",
          message: "Este workspace já está neste plano.",
          planId: existing.planId,
        },
        { status: 409 },
      );
    }

    // ─── 3. Customer no Asaas ───
    const workspace = await withTenant(orgId, async (db) => {
      const [row] = await db
        .select({ name: workspaces.name })
        .from(workspaces)
        .where(eq(workspaces.id, orgId))
        .limit(1);
      return row ?? null;
    });

    if (!workspace) {
      return NextResponse.json({ error: "NO_WORKSPACE" }, { status: 403 });
    }

    const customer = await createCustomer({
      name: workspace.name,
      // O e-mail do creator: vem do Clerk. Sem e-mail, o Asaas aceita
      // customer só com nome — mas o comprovante PIX precisa de e-mail.
      email: await creatorEmail(),
    });

    // ─── 4. Subscription no Asaas ───
    const asaasSub = await createSubscription({
      planId: plan,
      workspaceId: orgId,
      customer: customer.id,
      valueCents: limits.priceBrlCents,
      billingType,
      cycle: "MONTHLY",
      nextDueDate: todayAsAsaasDate(),
      description: `EasyDemo ${plan}`,
    });

    // ─── 5. Row local (status "incomplete" até o webhook) ───
    await withTenant(orgId, async (db) => {
      await db.insert(subscriptions).values({
        workspaceId: orgId,
        planId: plan,
        asaasSubscriptionId: asaasSub.id,
        status: "incomplete",
        cancelAtPeriodEnd: false,
      });
    });

    // ─── 6. Primeiro pagamento (a cobrança do ciclo) ───
    const payment = await createPayment({
      customer: customer.id,
      subscription: asaasSub.id,
      value: limits.priceBrlCents,
      dueDate: todayAsAsaasDate(),
      billingType,
    });

    const payload = {
      subscriptionId: asaasSub.id,
      paymentId: payment.id,
      planId: plan,
      priceBrlCents: limits.priceBrlCents,
      billingType,
      checkoutUrl: payment.invoiceUrl ?? payment.bankSlipUrl ?? null,
      pixQrCodeId: payment.pixQrCodeId ?? null,
    };

    // Navegador (form da página `/billing`) → redireciona para a tela de
    // checkout. API (`fetch` com JSON) → devolve o payload.
    if (wantsHtml(req)) {
      const target = new URL("/billing/checkout", req.url);
      target.searchParams.set("subscription", asaasSub.id);
      target.searchParams.set("plan", plan);
      return NextResponse.redirect(target, { status: 303 });
    }

    return NextResponse.json(payload, { status: 201 });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
      }
      if (err.message === "NO_WORKSPACE") {
        return NextResponse.json({ error: "NO_WORKSPACE" }, { status: 403 });
      }
    }
    console.error("[/api/v1/billing/checkout] error:", err);
    return NextResponse.json({ error: "BILLING_UNAVAILABLE" }, { status: 502 });
  }
}

/**
 * Detecta se o request veio de um navegador (form submit) em vez de uma
 * chamada de API (`fetch`).
 *
 * O `Accept: text/html` é o sinal padrão — um form do navegador sempre pede
 * HTML de volta. O `Sec-Fetch-Mode: navigate` reforça.
 */
function wantsHtml(req: Request): boolean {
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("text/html")) return true;
  return (req.headers.get("sec-fetch-mode") ?? "") === "navigate";
}

/**
 * Lê o body do request aceitando JSON **e** form-urlencoded.
 *
 * O form da página `/billing` é `<form method="post">` (navegador), mas o
 * checkout também é chamado por `fetch` com JSON. Suportar os dois evita
 * ter dois endpoints.
 *
 * O `plan` pode vir no **query string** (é onde o form o coloca) — por isso
 * lemos a URL também.
 */
async function readBody(req: Request): Promise<Record<string, unknown>> {
  const url = new URL(req.url);
  const fromQuery: Record<string, unknown> = {};
  for (const [key, value] of url.searchParams.entries()) {
    fromQuery[key] = value;
  }

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    const fromForm: Record<string, unknown> = {};
    for (const [key, value] of form.entries()) {
      fromForm[key] = typeof value === "string" ? value : value.name;
    }
    return { ...fromQuery, ...fromForm };
  }

  const json = await req.json().catch(() => null);
  const fromJson = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  return { ...fromQuery, ...fromJson };
}

/**
 * Preço do plano, lido do banco.
 *
 * `app.plans` tem policy de SELECT pública (`plans_public_select`), então
 * não precisa de contexto de tenant — mas lemos via `withTenant` para
 * manter o mesmo padrão do resto do app.
 */
async function getPlanPrice(plan: "pro" | "business"): Promise<{ priceBrlCents: number }> {
  const { getPlanLimits } = await import("@/lib/plans");
  const limits = await getPlanLimits(plan);
  return { priceBrlCents: limits.priceBrlCents };
}

/**
 * E-mail do creator (Clerk). O Asaas usa para emitir o comprovante.
 *
 * Se o Clerk não devolver e-mail, o checkout segue sem ele — o Asaas aceita
 * customer só com nome.
 */
async function creatorEmail(): Promise<string | undefined> {
  try {
    const { currentUser } = await import("@clerk/nextjs/server");
    const user = await currentUser();
    const primary = user?.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId);
    return primary?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  } catch {
    return undefined;
  }
}
