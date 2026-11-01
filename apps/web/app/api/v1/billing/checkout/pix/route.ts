/**
 * apps/web/app/api/v1/billing/checkout/pix/route.ts
 * -----------------------------------------------------------------------------
 * Entrega o QR Code do PIX (e o código copia-e-cola) para a tela de checkout.
 *
 * ⚠️ **Por que existe um endpoint no servidor:**
 *
 * O QR Code dinâmico do PIX só é acessível via
 * `GET /v3/payments/{id}/pixQrCode` no Asaas, que exige o header
 * `access_token` (a API key). Chamar isso **do browser** vazaria a key.
 * Então:
 *
 *   1. o browser pede o QR Code aqui (com a sessão do creator);
 *   2. o servidor busca no Asaas usando a key;
 *   3. devolve a imagem em base64 e o código copia-e-cola.
 *
 * A API key nunca sai do servidor. O que sai é a imagem do QR Code — que é
 * pública por natureza (qualquer pessoa com o link de pagamento vê o mesmo
 * QR Code) e o código copia-e-cola, que é o mesmo dado que o QR Code
 * carrega.
 *
 * ⚠️ **Acesso:** só o creator do workspace da assinatura pode pedir o QR
 * Code. O `workspaceId` vem da sessão, nunca do body.
 */
import { subscriptions } from "@/db/schema/app";
import { requireAuth } from "@/lib/auth";
import { getPixQrCode, pixQrCodeDataUrl } from "@/lib/billing/asaas";
import { withTenant } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const { orgId } = await requireAuth();

    // A assinatura mais recente do workspace (a que está sendo cobrada).
    const [sub] = await withTenant(orgId, async (db) =>
      db
        .select({
          id: subscriptions.id,
          asaasPaymentId: subscriptions.asaasPaymentId,
          status: subscriptions.status,
        })
        .from(subscriptions)
        .where(eq(subscriptions.workspaceId, orgId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1),
    );

    if (!sub) {
      return NextResponse.json({ error: "NO_SUBSCRIPTION" }, { status: 404 });
    }

    // Já paga — não há nada a cobrar.
    if (sub.status === "active") {
      return NextResponse.json({ paid: true, qrCode: null, payload: null });
    }

    // ⚠️ Assinaturas criadas antes da migration 0006 não têm o
    // `asaas_payment_id` — nesse caso a UI cai no link de pagamento.
    if (!sub.asaasPaymentId) {
      return NextResponse.json(
        { paid: false, qrCode: null, payload: null, reason: "NO_PAYMENT_ID" },
        { status: 200 },
      );
    }

    const pix = await getPixQrCode(sub.asaasPaymentId);
    const qrCode = pixQrCodeDataUrl(pix?.encodedImage);

    if (!qrCode) {
      // O pagamento pode ser boleto, ou o QR Code ainda não foi gerado.
      return NextResponse.json(
        { paid: false, qrCode: null, payload: null, reason: "QR_CODE_UNAVAILABLE" },
        { status: 200 },
      );
    }

    return NextResponse.json({
      paid: false,
      qrCode,
      payload: pix?.payload ?? null,
      expirationDate: pix?.expirationDate ?? null,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
      }
      if (err.message === "NO_WORKSPACE") {
        return NextResponse.json({ error: "NO_WORKSPACE" }, { status: 403 });
      }
    }
    console.error("[/api/v1/billing/checkout/pix] error:", err);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
