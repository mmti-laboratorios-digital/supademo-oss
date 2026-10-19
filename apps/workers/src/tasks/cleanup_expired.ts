import type { Task } from "graphile-worker";

/**
 * cleanup_expired — LGPD art. 16.
 *
 * Apaga:
 *  - leads com workspace deletado há > LGPD_LEAD_RETENTION_DAYS
 *  - analytics.events antigos (> LGPD_ANALYTICS_RETENTION_MONTHS * 30 dias)
 *
 * Roda diariamente via graphile-worker cron (configurado fora deste scaffold).
 */
export const cleanupExpired: Task = async () => {
  const leadDays = Number(process.env.LGPD_LEAD_RETENTION_DAYS ?? 90);
  const analyticsMonths = Number(process.env.LGPD_ANALYTICS_RETENTION_MONTHS ?? 24);

  console.log(
    `[cleanup_expired] lead_retention=${leadDays}d analytics_retention=${analyticsMonths}mo`,
  );

  // Em produção:
  // DELETE FROM app.leads WHERE workspace_id IN (
  //   SELECT id FROM app.workspaces WHERE deleted_at < now() - interval '${leadDays} days'
  // );
  // DELETE FROM analytics.events WHERE created_at < now() - interval '${analyticsMonths} months';
};
