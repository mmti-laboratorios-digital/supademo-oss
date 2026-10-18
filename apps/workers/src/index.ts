/**
 * Entrypoint do graphile-worker.
 *
 * Roda em processo Node 22 separado do Next.js, conectando ao mesmo Postgres
 * (fila persistida em `_graphile_worker.*`).
 *
 * Tasks: ver `./tasks/*` — cada uma é um arquivo separado com default export.
 */

import { run, type TaskList } from "graphile-worker";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });
loadEnv({ path: "../.env" });

import { processDemo } from "./tasks/process_demo";
import { redactPii } from "./tasks/redact_pii";
import { ttsJob } from "./tasks/tts_job";
import { generateOg } from "./tasks/generate_og";
import { cleanupExpired } from "./tasks/cleanup_expired";
import { syncBilling } from "./tasks/sync_billing";

// Convenção do projeto: porta 55432 no host (não 5432) — ver infra/docker-compose.yml.
const connectionString =
  process.env.DATABASE_URL ?? "postgres://app:CHANGEME@localhost:55432/supademo";

const taskList: TaskList = {
  process_demo: processDemo,
  redact_pii: redactPii,
  tts_job: ttsJob,
  generate_og: generateOg,
  cleanup_expired: cleanupExpired,
  sync_billing: syncBilling,
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