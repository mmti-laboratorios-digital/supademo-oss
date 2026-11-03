/**
 * Entrypoint do graphile-worker.
 *
 * Roda em processo Node 22 separado do Next.js, conectando ao mesmo Postgres
 * (fila persistida em `_graphile_worker.*`).
 *
 * Tasks: ver `./tasks/*` — cada uma é um arquivo separado com default export.
 *
 * ⚠️ **Cron nativo:** o graphile-worker agenda jobs recorrentes sem precisar
 * da extensão `pg_cron` no Postgres. O crontab vive em `../crontab.ts`
 * (TypeScript, versionado) e é validado contra a `taskList` no boot — um
 * task citado que não existe faz o worker **recusar de subir**, em vez de
 * criar jobs silenciosamente ignorados.
 */

import { config as loadEnv } from "dotenv";
import { type TaskList, makeWorkerUtils, parseCrontab, run } from "graphile-worker";

loadEnv({ path: ".env" });
loadEnv({ path: "../.env" });

import { CRONTAB, SCHEDULED_TASKS } from "./crontab";
import { cleanupExpired } from "./tasks/cleanup_expired";
import { generateOg } from "./tasks/generate_og";
import { processDemo } from "./tasks/process_demo";
import { purgeExpiredSubscriptions } from "./tasks/purge_expired_subscriptions";
import { redactPii } from "./tasks/redact_pii";
import { syncBilling } from "./tasks/sync_billing";
import { ttsJob } from "./tasks/tts_job";

// ⚠️ **A fila do graphile-worker usa o `DIRECT_URL` (app_owner), não o
// `DATABASE_URL` (app_user).**
//
// Motivo: o graphile-worker cria as tabelas da fila (`_private_jobs`,
// `_private_known_crontabs`, …) **com RLS habilitado e sem policy** — é o
// design dele: ele espera que o role da conexão seja o **owner** das tabelas
// ou tenha BYPASSRLS. Com o `app_user` (RLS-enforced, NOBYPASSRLS) o worker
// falha no boot:
//
//   ERROR: new row violates row-level security policy for table
//   "_private_known_crontabs"
//
// O `app_owner` tem BYPASSRLS e é justamente o role que a
// `infra/postgres/init-roles.sql` reserva para "jobs assíncronos". As tasks
// que rodam nele cuidem de não vazar dados entre tenants — o job de expurgo
// de assinatura, por exemplo, faz o UPDATE por `workspace_id` explícito.
//
// ⚠️ O `app_user` continua sendo o role do **Next.js** (runtime de request,
// onde o isolamento RLS é obrigatório).
const connectionString =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgres://app:CHANGEME@localhost:55432/easydemo";

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

/**
 * Valida que todo task citado no crontab existe na `taskList`.
 *
 * ⚠️ O graphile-worker **aceita** um crontab com task inexistente — o job
 * simplesmente nunca roda, sem erro visível. Essa validação transforma um
 * erro silencioso em um boot que falha.
 */
function assertCrontabTasksExist(): void {
  const missing = SCHEDULED_TASKS.filter((task) => !(task in taskList));
  if (missing.length > 0) {
    throw new Error(
      `[workers] crontab cita task(s) que não existem na taskList: ${missing.join(", ")}`,
    );
  }
}

/**
 * Instala (ou atualiza) o schema `_graphile_worker.*` da fila.
 *
 * ⚠️ **Por que o `DIRECT_URL` (app_owner) e não o `DATABASE_URL` (app_user):**
 *
 * O `app_user` é o role de runtime do app — respeita RLS e **não** tem
 * permissão de DDL no schema `public`/novos schemas. O graphile-worker cria
 * as tabelas da fila (`_graphile_worker.jobs`, `known_crontabs`, etc.) na
 * primeira execução, e isso falha com:
 *
 * ```
 * ERROR: permission denied for database easydemo (42501)
 * ```
 *
 * O `app_owner` tem BYPASSRLS e é o role de migrations — é ele quem instala
 * o schema da fila. Depois de instalado, o worker roda normalmente com o
 * `app_user`.
 *
 * ⚠️ Se o `DIRECT_URL` não estiver definido, o migrate é pulado (o worker
 * tenta subir com o `DATABASE_URL` e falha com a mensagem do Postgres — o
 * erro fica visível no log).
 */
async function installQueueSchema(): Promise<void> {
  const migrationUrl = process.env.DIRECT_URL;
  if (!migrationUrl) {
    console.warn(
      "[workers] DIRECT_URL não definido — pulando a instalação do schema da fila. " +
        "O worker só sobe se o schema _graphile_worker.* já existir.",
    );
    return;
  }

  const utils = await makeWorkerUtils({ connectionString: migrationUrl });
  try {
    await utils.migrate();
    console.log("[workers] schema da fila (_graphile_worker) atualizado.");
  } finally {
    await utils.release();
  }
}

async function main(): Promise<void> {
  assertCrontabTasksExist();

  // Instala o schema da fila ANTES de subir o worker (ver `installQueueSchema`).
  await installQueueSchema();

  // O parse do crontab acontece fora do `run()` para que um crontab inválido
  // (sintaxe errada) derrube o worker no boot — de novo, em vez de um job
  // que nunca roda.
  const parsedCronItems = parseCrontab(CRONTAB);
  console.log(
    `[workers] cron agendado: ${parsedCronItems.map((i) => `${i.task}@${i.identifier}`).join(", ")}`,
  );

  const runner = await run(
    {
      connectionString,
      concurrency: 5,
      noHandleSignals: false,
      taskList,
      pollInterval: 1000,
    },
    undefined,
    parsedCronItems,
  );

  await runner.promise;
}

main().catch((err) => {
  console.error("[workers] fatal:", err);
  process.exit(1);
});
