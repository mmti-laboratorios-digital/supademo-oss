import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { subscriptions, workspaces } from "@/db/schema/app";
import { requireAuth } from "@/lib/auth";
import { formatPriceBrl } from "@/lib/billing/asaas";
import { withTenant } from "@/lib/db";
import type { PlanId } from "@easydemo/shared";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Página de checkout — mostra os dados da cobrança (PIX/boleto) criada.
 *
 * O fluxo do MVP (Brasil-first, §1 do plano):
 *
 *   1. o creator clica em "Assinar Pro via PIX" na página `/billing`;
 *   2. `POST /api/v1/billing/checkout` cria customer + subscription +
 *      pagamento no Asaas e redireciona para cá;
 *   3. esta página mostra o QR Code / link do PIX;
 *   4. quando o creator paga, o webhook `PAYMENT_RECEIVED` promove o plano.
 *
 * ⚠️ O plano **só** muda no webhook. A cobrança é assíncrona (PIX pode
 * demorar minutos) — a página mostra "aguardando pagamento".
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ subscription?: string; plan?: string; status?: string }>;
}) {
  const { orgId } = await requireAuth();
  const params = await searchParams;

  const sub = await withTenant(orgId, async (db) => {
    const [row] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.workspaceId, orgId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return row ?? null;
  });

  const [ws] = await withTenant(orgId, async (db) =>
    db.select({ name: workspaces.name }).from(workspaces).where(eq(workspaces.id, orgId)).limit(1),
  );

  // O workspace é o dono da assinatura — garantimos que a row exibida é a
  // dele (o `subscriptionId` do query string é apenas informativo).
  if (!sub) {
    return (
      <main className="container max-w-2xl py-12">
        <Card className="p-8 text-center">
          <h1 className="mb-2 text-2xl font-bold">Nenhuma cobrança em andamento</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Não encontramos nenhuma assinatura para este workspace.
          </p>
          <Button asChild>
            <Link href="/billing">Voltar para cobrança</Link>
          </Button>
        </Card>
      </main>
    );
  }

  const planId = sub.planId as PlanId;
  const paid = sub.status === "active";

  return (
    <main className="container max-w-2xl py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          {paid ? "Pagamento confirmado" : "Finalize o pagamento"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {paid
            ? `Seu plano ${planId.toUpperCase()} já está ativo.`
            : `Assinatura do plano ${planId.toUpperCase()} para ${ws?.name ?? "seu workspace"}.`}
        </p>
      </header>

      <Card className="mb-6 p-6">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Plano</dt>
            <dd className="font-medium uppercase">{planId}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Valor</dt>
            <dd className="font-medium">
              {formatPriceBrl(planId === "business" ? 19900 : planId === "pro" ? 4900 : 0)}
              /mês
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{sub.status}</dd>
          </div>
          {sub.currentPeriodEnd ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Próxima cobrança</dt>
              <dd className="font-medium">
                {new Date(sub.currentPeriodEnd).toLocaleDateString("pt-BR")}
              </dd>
            </div>
          ) : null}
        </dl>
      </Card>

      {!paid ? (
        <Card className="mb-6 p-6">
          <h2 className="mb-2 text-lg font-semibold">Pague com PIX</h2>
          <p className="text-sm text-muted-foreground">
            Use o app do seu banco para pagar o QR Code do Asaas. Assim que o pagamento é
            confirmado, seu plano é liberado automaticamente — não precisa fazer mais nada.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Se o QR Code não aparecer, abra o link de pagamento enviado por e-mail.
          </p>
        </Card>
      ) : null}

      <Button asChild variant="outline">
        <Link href="/billing">Voltar para cobrança</Link>
      </Button>
    </main>
  );
}
