/**
 * apps/workers/crontab.ts
 * -----------------------------------------------------------------------------
 * Agendamento das tasks recorrentes do EasyDemo.
 *
 * ⚠️ **Por que o crontab fica no código (e não em `crontab.txt` na raiz):**
 *
 * O graphile-worker tem **cron nativo** — não precisa da extensão `pg_cron`
 * nem de nada instalado no Postgres. O worker recebe os itens de cron e
 * garante (via transação ACID) que **não** duplica agendamento, mesmo com
 * vários workers rodando.
 *
 * Manter o crontab em TypeScript (e não em arquivo de texto solto) tem duas
 * vantagens:
 *   1. o typecheck garante que **todo task citado existe** na `taskList` —
 *      um typo vira erro de compilação, não um job silenciosamente ignorado;
 *   2. o diff fica no histórico do git junto com o resto do código.
 *
 * ⚠️ **Fuso horário:** o graphile-worker interpreta o crontab em **UTC**.
 * Os horários abaixo estão em UTC — 03:00 UTC = 00:00 em Brasília (UTC-3).
 */

/**
 * Crontab do EasyDemo.
 *
 * Formato do graphile-worker (não é o cron do sistema — o payload faz parte
 * da linha):
 *
 * ```
 * <min> <hora> <dia-do-mês> <mês> <dia-da-semana> <task> [?<opts>] {<payload>}
 * ```
 *
 * - `cleanup_expired` — LGPD art. 16 (retensão de leads e eventos).
 *   ⚠️ A task hoje é um **stub** (só loga as configs) — o DELETE real ainda
 *   não foi implementado. Deixamos agendada para que, quando implementada,
 *   ela rode sozinha.
 * - `purge_expired_subscriptions` — expurgo de assinatura (débito da F4):
 *   rebaixa para Free o workspace cuja subscription cancelada já passou do
 *   `current_period_end` e que não tem outra assinatura viva.
 *
 * ⚠️ **Horários escolhidos para não concorrer:** os jobs rodam de madrugada
 * (UTC), quando o tráfego é baixo e o backup do pgBackRest já terminou.
 */
export const CRONTAB = `
# ─── EasyDemo — jobs recorrentes (UTC) ───────────────────────────────────────
# Fuso: UTC. 03:00 UTC = 00:00 em Brasília (UTC-3).

# Expurgo de assinatura — todo dia às 03:00 UTC.
# Regressão de plano: o creator cancelado ficaria no plano pago para sempre
# se o webhook SUBSCRIPTION_INACTIVATED do Asaas não chegasse.
0 3 * * * purge_expired_subscriptions

# Retenção LGPD (art. 16) — todo dia às 03:30 UTC.
# ⚠️ Task ainda em stub: registra as configs de retenção, não apaga nada.
30 3 * * * cleanup_expired
`;

/**
 * IDs das tasks agendadas — útil para log e para validar que o crontab
 * não cita uma task inexistente.
 */
export const SCHEDULED_TASKS = ["purge_expired_subscriptions", "cleanup_expired"] as const;
