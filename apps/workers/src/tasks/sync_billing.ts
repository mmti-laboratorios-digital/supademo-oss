import type { Task } from "graphile-worker";
// ⚠️ `pg` é CommonJS — `import { Client } from "pg"` quebra em ESM
// ("does not provide an export named 'Client'"). O import default + destructure
// é o que funciona (mesma armadilha registrada na F3).
import pg from "pg";
import { getSubscription, mapAsaasStatus } from "../lib/asaas";

const { Client } = pg;

/**
 * sync_billing — reconcilia a subscription local com o Asaas.
 *
 * -----------------------------------------------------------------------------
 * ⚠️ **Por que este job é necessário:**
 *
 * O estado do plano do workspace no EasyDemo é derivado de **eventos** do
 * Asaas (`PAYMENT_RECEIVED`, `SUBSCRIPTION_INACTIVATED`, …). Cada evento é
 * processado por um handler do webhook, que atualiza `app.subscriptions` e
 * (em alguns casos) `app.workspaces.plan_id`.
 *
 * Webhook **segue** se perdendo: retry que não chega, timeout do Asaas,
 * evento anterior ao deploy, falha momentânea do nosso banco. E cada falha
 * tem consequência diferente:
 *
 *   1. **Pagamento confirmado perdido** → o creator **pagou** e continua no
 *      Free. Pior: o job de expurgo (`purge_expired_subscriptions`) **não**
 *      corrige isso de propósito — ele só rebaixa, nunca promove (promover
 *      quem não pagou seria dar Pro de graça). Sem este job, ninguém
 *      promove.
 *   2. **Inativação perdida** → o creator cancelou e continua no plano pago
 *      para sempre (sem pagar). O job de expurgo cobre *parte* desse caso
 *      (quando `cancel_at_period_end` já está local), mas não cobre o
 *      caso em que o cancelamento **só existe no Asaas**.
 *
 * Este job é a reconciliação periódica: o Asaas é a **fonte da verdade**,
 * e o banco local converge para ele.
 *
 * -----------------------------------------------------------------------------
 * ⚠️ **Três modos de execução:**
 *
 *   1. **Sweep (cron diário)** — varre todas as subscriptions com
 *      `asaas_subscription_id` e reconcilia uma a uma. É o modo que fecha o
 *      buraco do "webhook perdido que ninguém percebe".
 *   2. **Pontual (payload com `asaasSubscriptionId`)** — reconcilia uma
 *      assinatura específica. É o modo que o webhook usa.
 *   3. **Payload com `asaasEventId`** (legado) — o webhook antigo mandava
 *      só o id do *evento*, que não identifica a assinatura. Nesse caso o
 *      job faz o **sweep** (o id do evento não é consultável no Asaas).
 *
 * -----------------------------------------------------------------------------
 * ⚠️ **Regra de segurança — nunca rebaixar quem pagou:**
 *
 * Rebaixar para Free uma assinatura que o Asaas diz estar `ACTIVE` seria
 * cobrar `PlanLimitError` num creator que pagou. Por isso o downgrade
 * acontece **só** quando o Asaas confirma que a assinatura morreu **e** o
 * ciclo já pago acabou. Mesma semântica do `handleSubscriptionDeleted` do
 * webhook e do `purge_expired_subscriptions`.
 */

/** Limite de assinaturas reconciliadas por execução (evita estourar a API). */
const SWEEP_LIMIT = 500;

type SubscriptionRow = {
  id: string;
  workspace_id: string;
  plan_id: string;
  asaas_subscription_id: string;
  status: string;
  current_period_end: Date | null;
  cancel_at_period_end: boolean;
};

export const syncBilling: Task = async (rawPayload) => {
  const payload = (rawPayload ?? {}) as {
    asaasSubscriptionId?: string;
    asaasEventId?: string;
  };

  const connectionString =
    process.env.DIRECT_URL ??
    process.env.DATABASE_URL ??
    "postgres://app_owner:easydemo@127.0.0.1:55432/easydemo";

  const client = new Client({ connectionString });

  try {
    await client.connect();

    // ─────────── Modo 1/3: sweep (cron, ou payload legado com só eventId) ───────────
    if (!payload.asaasSubscriptionId) {
      // ⚠️ **A query filtra por `workspace_id` implicitamente via JOIN**, e
      // cada UPDATE/UPDATE de workspace é feito por `id` explícito. O job roda
      // com `app_owner` (BYPASSRLS) — o isolamento entre tenants vem da
      // reconciliação linha a linha, não de RLS. Ver `src/index.ts`.
      const { rows: subs } = await client.query<SubscriptionRow>(
        `
        SELECT s.id, s.workspace_id, s.plan_id, s.asaas_subscription_id,
               s.status, s.current_period_end, s.cancel_at_period_end
        FROM app.subscriptions s
        WHERE s.asaas_subscription_id IS NOT NULL
        ORDER BY s.updated_at ASC
        LIMIT $1
        `,
        [SWEEP_LIMIT],
      );

      if (subs.length === 0) {
        console.log("[sync_billing] nada a reconciliar.");
        return;
      }

      let reconciled = 0;
      let promoted = 0;
      let downgraded = 0;
      let failed = 0;

      for (const sub of subs) {
        const outcome = await reconcileOne(client, sub);
        if (outcome === "failed") {
          failed++;
          continue;
        }
        reconciled++;
        if (outcome === "promoted") promoted++;
        if (outcome === "downgraded") downgraded++;
      }

      console.log(
        `[sync_billing] sweep: total=${subs.length} reconciliadas=${reconciled} ` +
          `promovidas=${promoted} rebaixadas=${downgraded} falhas=${failed}`,
      );
      return;
    }

    // ─────────── Modo 2: pontual (payload com asaasSubscriptionId) ───────────
    const { rows } = await client.query<SubscriptionRow>(
      `
      SELECT s.id, s.workspace_id, s.plan_id, s.asaas_subscription_id,
             s.status, s.current_period_end, s.cancel_at_period_end
      FROM app.subscriptions s
      WHERE s.asaas_subscription_id = $1
      LIMIT 1
      `,
      [payload.asaasSubscriptionId],
    );

    const sub = rows[0];
    if (!sub) {
      console.warn(
        `[sync_billing] assinatura ${payload.asaasSubscriptionId} não encontrada no banco.`,
      );
      return;
    }

    const outcome = await reconcileOne(client, sub);
    console.log(`[sync_billing] ${sub.asaas_subscription_id} (${sub.workspace_id}) → ${outcome}`);
  } catch (err) {
    console.error("[sync_billing] erro:", err);
    throw err;
  } finally {
    await client.end().catch(() => undefined);
  }
};

/**
 * Reconcilia uma assinatura local com o Asaas.
 *
 * Retorna o que aconteceu: `unchanged` | `updated` | `promoted` |
 * `downgraded` | `skipped` | `failed`.
 */
async function reconcileOne(
  client: pg.Client,
  sub: SubscriptionRow,
): Promise<"unchanged" | "updated" | "promoted" | "downgraded" | "skipped" | "failed"> {
  let asaasSub;
  try {
    asaasSub = await getSubscription(sub.asaas_subscription_id);
  } catch (err) {
    // ⚠️ Falha da API do Asaas **não** pode derrubar o job inteiro — uma
    // assinatura específica (ex.: removida no Asaas) não pode impedir a
    // reconciliação das outras. Logamos e seguimos.
    console.error(
      `[sync_billing] falha ao ler ${sub.asaas_subscription_id} no Asaas:`,
      err instanceof Error ? err.message : err,
    );
    return "failed";
  }

  const asaasStatus = mapAsaasStatus(asaasSub.status);
  const asaasCanceling = asaasSub.cancelAtPeriodEnd === true;

  // ─────────── Reconciliação da row da subscription ───────────
  // O `nextDueDate` do Asaas é a data da **próxima** cobrança — o fim do
  // ciclo corrente. ⚠️ Quando o plano é mensal e o vencimento é dia 10, o
  // Asaas devolve o dia 10 do mês que vem; o fim do ciclo local é o dia 10
  // do mês **atual**. Por isso comparamos por **dia** (não por instante):
  // usar o `nextDueDate` cru empurraria o fim do período para frente e o
  // expurgo nunca rebaixaria a assinatura.
  const nextDue = asaasSub.nextDueDate ? parseAsaasDate(asaasSub.nextDueDate) : null;
  const subscriptionIsLive = asaasStatus === "active";
  const periodEnd = reconcilePeriodEnd(sub.current_period_end, nextDue, subscriptionIsLive);

  const statusChanged = asaasStatus !== sub.status;
  const cancelChanged = asaasCanceling !== sub.cancel_at_period_end;
  const periodChanged = !sameInstant(periodEnd, sub.current_period_end);

  // ⚠️ **O `updated_at` é atualizado SEMPRE, mesmo quando nada mudou.**
  //
  // O sweep ordena por `updated_at ASC` e tem um limite (`SWEEP_LIMIT`).
  // Se só as rows que mudaram tivessem o `updated_at` atualizado, as rows
  // **estáveis** ficariam eternamente na frente do limite — e as assinaturas
  // novas (no fim da fila) nunca seriam reconciliadas. Atualizar sempre faz o
  // sweep **rotacionar**: cada execução pega as mais antigas, que saem da
  // frente, e as seguintes entram.
  if (statusChanged || cancelChanged || periodChanged) {
    await client.query(
      `
      UPDATE app.subscriptions
      SET status = $1,
          cancel_at_period_end = $2,
          current_period_end = $3,
          updated_at = now()
      WHERE id = $4
      `,
      [asaasStatus, asaasCanceling, periodEnd, sub.id],
    );
  } else {
    await client.query("UPDATE app.subscriptions SET updated_at = now() WHERE id = $1", [sub.id]);
  }

  // ─────────── Reconciliação do plano do workspace ───────────
  //
  // ⚠️ O job roda com BYPASSRLS — toda escrita é por `workspace_id`
  // explícito, nunca por um filtro amplo.

  // **Promoção:** o Asaas confirma que a assinatura está viva. É o caso do
  // creator que **pagou** mas cujo webhook `PAYMENT_RECEIVED` se perdeu.
  //
  // ⚠️ Só promove quando o status **local** não é "pago/vivo" — ou seja, a
  // row local está `incomplete` (checkout iniciado, pagamento nunca
  // confirmado), `past_due`, `canceled` ou `trial`. Se o local já está
  // `active`, não há o que promover (e o guard evita UPDATE desnecessário).
  //
  // ⚠️ E **nunca** promove quando o Asaas **não** diz `active`:
  // `past_due` (inadimplente), `incomplete` (pagamento pendente) e `trial`
  // **não** dão direito ao plano pago — quem não pagou não recebe Pro.
  const localAlreadyPaid = sub.status === "active";
  if (asaasStatus === "active" && !localAlreadyPaid) {
    const { rowCount } = await client.query(
      `
      UPDATE app.workspaces
      SET plan_id = $1, updated_at = now()
      WHERE id = $2 AND plan_id <> $1
      `,
      [sub.plan_id, sub.workspace_id],
    );
    if ((rowCount ?? 0) > 0) {
      console.log(
        `[sync_billing] workspace ${sub.workspace_id} promovido para ${sub.plan_id} ` +
          `(assinatura ${sub.asaas_subscription_id} ativa no Asaas, local=${sub.status}).`,
      );
      return "promoted";
    }
  }

  // **Rebaixamento:** o Asaas diz que a assinatura morreu **e** o ciclo já
  // pago acabou. Enquanto o creator estiver dentro do ciclo que pagou, ele
  // **mantém** o plano (semântica do cancelamento no Asaas).
  if (asaasStatus === "canceled" && asaasCanceling) {
    const periodFinished = periodEnd !== null && periodEnd.getTime() <= Date.now();
    if (periodFinished) {
      // ⚠️ Só rebaixa se o workspace **ainda está** no plano desta
      // assinatura — quem fez upgrade para um plano superior não é rebaixado.
      const { rowCount } = await client.query(
        `
        UPDATE app.workspaces
        SET plan_id = 'free', updated_at = now()
        WHERE id = $1 AND plan_id = $2
        `,
        [sub.workspace_id, sub.plan_id],
      );
      if ((rowCount ?? 0) > 0) {
        console.log(
          `[sync_billing] workspace ${sub.workspace_id} rebaixado para free ` +
            `(assinatura ${sub.asaas_subscription_id} cancelada no Asaas, período encerrado).`,
        );
        return "downgraded";
      }
    }
  }

  if (!statusChanged && !cancelChanged && !periodChanged) {
    return "unchanged";
  }
  return "updated";
}

/**
 * Converte a data do Asaas (`YYYY-MM-DD`) para `Date`.
 *
 * ⚠️ `new Date("2026-11-10")` é interpretado como **UTC midnight**, e o
 * `toISOString()` do Postgres converte de volta para timestamptz. Para não
 * deslocar o dia por causa do fuso, ancoramos no **meio-dia UTC** — o dia
 * calendar continua o mesmo em qualquer fuso entre -12 e +12.
 */
function parseAsaasDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00.000Z`);
}

/**
 * Calcula o fim do período local a partir do `nextDueDate` do Asaas.
 *
 * ⚠️ O `nextDueDate` é a **próxima** cobrança. Para um plano mensal com
 * vencimento no dia 10:
 *
 *   - em 2026-11-04, o `nextDueDate` é `2026-11-10` → o ciclo atual vai até
 *     **2026-11-10** (este mês), e a próxima cobrança é 10/12;
 *   - em 2026-11-15, o `nextDueDate` é `2026-12-10` → o ciclo atual (que já
 *     foi pago em 10/11) vai até **2026-12-10**.
 *
 * Ou seja: o `nextDueDate` é o fim do ciclo **somente se ainda estiver no
 * futuro**; se já passou, ele é a próxima cobrança e o fim do ciclo é o
 * **mês seguinte** (mesmo dia).
 *
 * ⚠️ **Exceção — assinatura morta.** Quando o Asaas diz que a assinatura
 * **não está mais ativa** (`INACTIVE`/`EXPIRED`/`CANCELLED`), não há
 * renovação happening: o `nextDueDate` no passado é a **última** cobrança
 * que rolou, e o ciclo acabou. Nesse caso o fim do período é o próprio
 * `nextDueDate` (sem deslocar para o mês seguinte) — deslocar faria o job
 * **nunca** rebaixar a assinatura, e o creator ficaria preso no plano pago.
 *
 * @param local         Fim do período já conhecido localmente.
 * @param nextDue       `nextDueDate` do Asaas (já parseado).
 * @param subscriptionIsLive `true` quando o Asaas diz que a assinatura está ativa.
 */
function reconcilePeriodEnd(
  local: Date | null,
  nextDue: Date | null,
  subscriptionIsLive: boolean,
): Date | null {
  if (!nextDue) return local;

  const now = new Date();
  if (nextDue.getTime() >= now.getTime()) {
    // A próxima cobrança ainda está no futuro → é o fim do ciclo corrente.
    return nextDue;
  }

  // A próxima cobrança já passou.
  if (!subscriptionIsLive) {
    // A assinatura morreu: o `nextDueDate` foi a **última** cobrança — o
    // ciclo acabou e o fim do período é essa data.
    return nextDue;
  }

  // A assinatura está viva: o `nextDueDate` é a cobrança do próximo ciclo,
  // então o ciclo corrente vai até o mesmo dia, no mês seguinte.
  const end = new Date(nextDue);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return end;
}

/** Compara dois instantes (null-safe). */
function sameInstant(a: Date | null, b: Date | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.getTime() === b.getTime();
}
