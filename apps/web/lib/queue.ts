import { type TaskList, makeWorkerUtils, quickAddJob } from "graphile-worker";
import { env } from "./env";

/**
 * Wrapper sobre graphile-worker. Define a taskList compartilhada
 * (importada também pelo worker process em `apps/workers`).
 *
 * Tasks implementadas em `apps/workers/src/tasks/*`.
 */

export type JobPayload =
  | { type: "process_demo"; demoId: string }
  | { type: "redact_pii"; demoId: string }
  | { type: "tts_job"; stepId: string; text: string; lang: "pt-BR" | "en" }
  | { type: "generate_og"; demoId: string }
  | { type: "cleanup_expired" }
  | { type: "sync_billing"; asaasEventId: string };

export const taskList: TaskList = {
  process_demo: async () => {
    /* implementado em apps/workers */
  },
  redact_pii: async () => {
    /* implementado em apps/workers */
  },
  tts_job: async () => {
    /* implementado em apps/workers */
  },
  generate_og: async () => {
    /* implementado em apps/workers */
  },
  cleanup_expired: async () => {
    /* implementado em apps/workers */
  },
  sync_billing: async () => {
    /* implementado em apps/workers */
  },
};

let utils: Awaited<ReturnType<typeof makeWorkerUtils>> | null = null;

async function getUtils() {
  if (utils) return utils;
  utils = await makeWorkerUtils({
    connectionString: env().DATABASE_URL,
  });
  return utils;
}

export async function enqueue(payload: JobPayload): Promise<string> {
  const u = await getUtils();
  const jobId = await quickAddJob(
    { connectionString: env().DATABASE_URL },
    payload.type,
    payload as unknown as Record<string, unknown>,
  );
  return String(jobId);
}
