import type { Task } from "graphile-worker";
import { Client } from "pg";

/**
 * purge_expired_subscriptions — expurgo de assinatura (débito da F4).
 *
 * -----------------------------------------------------------------------------
 * ⚠️ **Por que este job é necessário:**
 *
 * O cancelamento no EasyDemo segue a semântica do Asaas: o creator **pagou o
 * ciclo**, então continua com o plano até o fim do período. O cancelamento
 * marca a subscription como `canceled` com `cancel_at_period_end = true` e
 * **mantém** o `workspaces.plan_id`.
 *
 * O rebaixamento para "free" acontece quando `current_period_end` passa. Até
 * hoje isso só acontecia se o Asaas mandasse o webhook
 * `SUBSCRIPTION_INACTIVATED` depois do vencimento — o que **não é garantido**:
 * webhook perdido, retry que não chega, ou workspace em trial sem qualquer
 * evento. O resultado era o creator **preso no plano pago para sempre**, sem
 * pagar.
 *
 * Este job é a rede de segurança: varre as subscriptions expiradas e rebaixa.
 * Roda diariamente (cron do graphile-worker) e é idempotente.
 *
 * -----------------------------------------------------------------------------
 * ⚠️ **Regra de segurança — nunca rebaixar quem pagou:**
 *
 * Rebaixar um workspace que tem **outra** subscription ativa (renovação) seria
 * cobrar PlanLimitError num creator que pagou. A query exige que **não exista**
 * nenhuma outra subscription ativa para o mesmo workspace.
 */

/** Status que contam como "assinatura viva" (renovação em curso). */
const ACTIVE_STATUSES = ["active", "past_due", "incomplete"];

export const purgeExpiredSubscriptions: Task = async () => {
  const connectionString =
    process.env.DIRECT_URL ??
    process.env.DATABASE_URL ??
    "postgres://app_owner:easydemo@127.0.0.1:55432/easydemo";

  const client = new Client({ connectionString });

  try {
    await client.connect();

    // 1. Seleciona as subscriptions expiradas que ainda seguram o plano.
    //
    // ⚠️ `current_period_end IS NOT NULL` — sem o fim do período não há como
    // saber se o ciclo acabou. `cancel_at_period_end = true` garante que só
    // assinaturas **canceladas** entram (uma subscription ativa com o período
    // passado é um caso de webhook perdido — tratada pelo `sync_billing`).
    const { rows: expired } = await client.query<{
      id: string;
      workspace_id: string;
      plan_id: string;
    }>(
      `
      SELECT s.id, s.workspace_id, s.plan_id
      FROM app.subscriptions s
      WHERE s.cancel_at_period_end = true
        AND s.status = 'canceled'
        AND s.current_period_end IS NOT NULL
        AND s.current_period_end <= now()
      ORDER BY s.current_period_end ASC
      LIMIT 500
      `,
    );

    if (expired.length === 0) {
      console.log("[purge_expired_subscriptions] nada a expurgar.");
      return;
    }

    let purged = 0;
    let skipped = 0;

    for (const sub of expired) {
      // 2. Verifica se existe OUTRA subscription viva para o mesmo workspace.
      //    Se existir (renovação), o workspace **não** pode ser rebaixado.
      const { rows: stillActive } = await client.query<{ count: number }>(
        `
        SELECT COUNT(*)::int AS count
        FROM app.subscriptions s2
        WHERE s2.workspace_id = $1
          AND s2.id <> $2
          AND s2.status = ANY($3::text[])
        `,
        [sub.workspace_id, sub.id, ACTIVE_STATUSES],
      );

      if ((stillActive[0]?.count ?? 0) > 0) {
        skipped++;
        continue;
      }

      // 3. Rebaixa o workspace para Free.
      //
      // ⚠️ Só rebaixa se o workspace **ainda está** no plano desta
      // subscription. Se o creator fez upgrade para um plano superior depois
      // (ex.: Business), rebaixar para Free seria errado — e o `plan_id`
      // atual já não é o desta subscription.
      const { rowCount: updated } = await client.query(
        `
        UPDATE app.workspaces
        SET plan_id = 'free', updated_at = now()
        WHERE id = $1 AND plan_id = $2
        `,
        [sub.workspace_id, sub.plan_id],
      );

      if ((updated ?? 0) > 0) {
        purged++;
      } else {
        // O workspace já estava em outro plano (upgrade) — nada a fazer.
        skipped++;
      }
    }

    console.log(
      `[purge_expired_subscriptions] expiradas=${expired.length} rebaixadas=${purged} ignoradas=${skipped}`,
    );
  } catch (err) {
    console.error("[purge_expired_subscriptions] erro:", err);
    throw err;
  } finally {
    await client.end().catch(() => undefined);
  }
};
