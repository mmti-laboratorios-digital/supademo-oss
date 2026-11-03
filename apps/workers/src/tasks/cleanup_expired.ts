import type { Task } from "graphile-worker";
// ⚠️ `pg` é CommonJS — `import { Client } from "pg"` quebra em ESM
// ("does not provide an export named 'Client'"). O import default + destructure
// é o que funciona (mesma armadilha registrada na F3).
import pg from "pg";

const { Client } = pg;

/**
 * cleanup_expired — LGPD art. 16 (retenção).
 *
 * -----------------------------------------------------------------------------
 * Apaga:
 *   - leads de workspaces deletados há mais de `LGPD_LEAD_RETENTION_DAYS`;
 *   - eventos de analytics com mais de `LGPD_ANALYTICS_RETENTION_MONTHS` meses.
 *
 * ⚠️ **Sem isso, o prazo de retenção é só uma promessa no papel.** O art. 16
 * da LGPD diz que o controlador deve terminar o tratamento quando a
 * finalidade se exaurir — e "guardar para sempre" é o oposto disso. A
 * retenção declarada em `legal/privacy-policy.md` precisa de um processo
 * que a aplique.
 *
 * ⚠️ **O que NÃO é apagado:**
 *   - dados de workspace **ativo** (o `deleted_at IS NULL` é obrigatório) —
 *     apagar lead de um cliente que ainda está pagando seria destruição de
 *     dado em guarda;
 *   - eventos de analytics de demos **publicadas** — o dashboard histórico
 *     do creator depende deles. O criterion é puramente temporal.
 *
 * ⚠️ **A conexão usa o `DIRECT_URL` (app_owner, BYPASSRLS).** O `app_user` é
 * RLS-enforced e não enxergaria as rows de outros tenants — a retenção
 * precisa varrer o banco inteiro. Ver `src/index.ts` para o porquê.
 *
 * Idempotente e segura para rodar em paralelo: os DELETEs são por faixa de
 * tempo, então dois workers simultâneos deletam o mesmo conjunto sem
 * duplicar trabalho (o segundo não acha mais nada).
 */
export const cleanupExpired: Task = async () => {
  const leadDays = Number(process.env.LGPD_LEAD_RETENTION_DAYS ?? 90);
  const analyticsMonths = Number(process.env.LGPD_ANALYTICS_RETENTION_MONTHS ?? 24);

  // Sanidade: config absurda apagaria dado vivo.
  if (!Number.isFinite(leadDays) || leadDays <= 0) {
    throw new Error(`LGPD_LEAD_RETENTION_DAYS inválido: ${String(leadDays)}`);
  }
  if (!Number.isFinite(analyticsMonths) || analyticsMonths <= 0) {
    throw new Error(`LGPD_ANALYTICS_RETENTION_MONTHS inválido: ${String(analyticsMonths)}`);
  }

  const connectionString =
    process.env.DIRECT_URL ??
    process.env.DATABASE_URL ??
    "postgres://app_owner:easydemo@127.0.0.1:55432/easydemo";

  const client = new Client({ connectionString });

  try {
    await client.connect();

    // 1. Leads de workspaces deletados há mais de `leadDays`.
    //
    // ⚠️ `w.deleted_at IS NOT NULL` — só apaga lead de workspace que **saiu**
    // (soft delete). Lead de workspace ativo está em guarda.
    const { rowCount: leadsDeleted } = await client.query(
      `
      DELETE FROM app.leads l
      USING app.workspaces w
      WHERE w.id = l.workspace_id
        AND w.deleted_at IS NOT NULL
        AND w.deleted_at < now() - ($1 || ' days')::interval
      `,
      [String(leadDays)],
    );

    // 2. Eventos de analytics antigos.
    const { rowCount: eventsDeleted } = await client.query(
      `
      DELETE FROM analytics.events
      WHERE created_at < now() - ($1 || ' months')::interval
      `,
      [String(analyticsMonths)],
    );

    console.log(
      `[cleanup_expired] lead_retention=${leadDays}d analytics_retention=${analyticsMonths}mo ` +
        `→ leads=${leadsDeleted ?? 0} events=${eventsDeleted ?? 0}`,
    );
  } catch (err) {
    console.error("[cleanup_expired] erro:", err);
    throw err;
  } finally {
    await client.end().catch(() => undefined);
  }
};
