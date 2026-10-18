import type { Task } from "graphile-worker";

/**
 * sync_billing — chamado após webhook do Asaas para reconciliar estado
 * de subscription local ↔ Asaas (em caso de retry/falha do webhook).
 *
 * Em prod: chama `GET /subscriptions/{asaas_id}` no Asaas e compara com DB.
 */
export const syncBilling: Task = async (rawPayload) => {
  const payload = rawPayload as { asaasEventId: string };
  console.log(`[sync_billing] asaasEventId=${payload.asaasEventId}`);
};