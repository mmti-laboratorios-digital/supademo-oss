/**
 * Entrypoint do graphile-worker.
 *
 * Roda em processo Node 22 separado do Next.js, conectando ao mesmo Postgres
 * (fila persistida em `_graphile_worker.*`).
 *
 * Tasks: ver `./tasks/*` — cada uma é um arquivo separado com default export.
 */

import { config as loadEnv } from "dotenv";
import { type TaskList, run } from "graphile-worker";

loadEnv({ path: ".env" });
loadEnv({ path: "../.env" });

import { cleanupExpired } from "./tasks/cleanup_expired";
import { generateOg } from "./tasks/generate_og";
import { processDemo } from "./tasks/process_demo";
import { purgeExpiredSubscriptions } from "./tasks/purge_expired_subscriptions";
import { redactPii } from "./tasks/redact_pii";
import { syncBilling } from "./tasks/sync_billing";
import { ttsJob } from "./tasks/tts_job";

// Convenção do projeto: porta 55432 no host (não 5432) — ver infra/docker-compose.yml.
const connectionString =
  process.env.DATABASE_URL ?? "postgres://app:CHANGEME@localhost:55432/easydemo";

const taskList: TaskList = {
  process_demo: processDemo,
  redact_pii: redactPii,
  tts_job: ttsJob,
  generate_og: generateOg,
  cleanup_expired: cleanupExpired,
  sync_billing: syncBilling,
  // Expurgo de assinatura (débito da F4): rebaixa para Free o workspace cuja
  // subscription cancelada já passou do `current_period_end` e que não tem
  // outra assinatura viva. Sem isso, um webhook perdido deixa o creator
  // preso no plano pago para sempre.
  purge_expired_subscriptions: purgeExpiredSubscriptions,
};

async function main(): Promise<void> {
  const runner = await run({
    connectionString,
    concurrency: 5,
    noHandleSignals: false,
    taskList,
    pollInterval: 1000,
  });

  await runner.promise;
}

main().catch((err) => {
  console.error("[workers] fatal:", err);
  process.exit(1);
});
