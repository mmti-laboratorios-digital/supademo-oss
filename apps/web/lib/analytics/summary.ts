/**
 * apps/web/lib/analytics/summary.ts
 * -----------------------------------------------------------------------------
 * Consulta os eventos de uma demo e monta o resumo que o dashboard mostra.
 *
 * ⚠️ **Separado da página (`app/(app)/demos/[id]/analytics/page.tsx`) de
 * propósito:** a query é a parte com SQL (fácil de errar) e a página é a
 * parte com JSX. Assim dá para testar a agregação sem renderizar React.
 *
 * ⚠️ **A agregação é feita no banco** (`COUNT(DISTINCT visitor_id_hash)`),
 * não no Node: um demo popular tem dezenas de milhares de eventos, e
 * carregar tudo para o servidor da aplicação para contar em JS seria
 * desperdício (e o gargalo do dashboard).
 *
 * LGPD: só agregamos hashes. Nenhum PII sai do banco.
 */

import { withTenant } from "@/lib/db";
import type { PlanId } from "@easydemo/shared";
import { sql } from "drizzle-orm";

export type DemoSummary = {
  demoId: string;
  /** Visitantes únicos (hashes distintos). */
  uniqueVisitors: number;
  /** Total de eventos `view` (= visualizações, uma por visita). */
  views: number;
  /** Visitantes que viram pelo menos um `step_seen`. */
  stepSeenVisitors: number;
  /** Visitantes que clicaram no CTA. */
  ctaClickVisitors: number;
  /** Visitantes que concluíram. */
  completers: number;
  /** Visitantes que capturaram lead. */
  leadVisitors: number;
  /** Visitantes que abriram e saíram sem avançar (bounce). */
  bouncedVisitors: number;
  /**
   * Taxa de conclusão: `completers / uniqueVisitors` (%).
   *
   * ⚠️ O denominador é o **visitante único**, não o total de views — uma
   * pessoa que abriu o demo 3 vezes conta como 1. É a métrica que o creator
   * entende ("quantas pessoas chegaram ao fim").
   */
  completionRate: number;
  /**
   * CTA CTR: `ctaClickVisitors / visitors que chegaram ao último step` (%).
   *
   * ⚠️ O denominador **não** é o total de visitors: quem nunca chegou ao
   * último step não tinha chance de clicar no CTA. Usar `uniqueVisitors`
   * daria um número artificialmente baixo e sem sentido comercial.
   */
  ctaCtr: number;
  /** Distribuição por device. */
  byDevice: Array<{ device: string; count: number }>;
  /** Distribuição por país (derivado do Accept-Language). */
  byCountry: Array<{ country: string; count: number }>;
  /** Top referrers. */
  topReferrers: Array<{ host: string; count: number }>;
  /**
   * Funil step→reach, calculado por `computeFunnel` (pure function).
   *
   * ⚠️ `steps` do funil traz `stepId` — o dashboard resolve o nome do step
   * (posição + caption) na página, porque o funnel é puro e não deve tocar
   * o banco.
   */
  funnelSteps: FunnelStepRow[];
  /** Total de sessões no funil (visitantes distintos, segundo o `computeFunnel`). */
  totalSessions: number;
  /**
   * Sessões que concluíram, segundo o `computeFunnel`.
   *
   * ⚠️ Nome diferente de `completers` de propósito: `completers` (acima) é
   * o agregado do banco (`COUNT(DISTINCT visitor_id_hash)`), este é o do
   * funil. Os dois deviam bater, mas são calculados por caminhos
   * diferentes — e comparar os dois é uma checagem de sanidade útil.
   */
  funnelCompleters: number;
};

/** Linha do funil pronta para o dashboard (alias do tipo do `funnel.ts`). */
export type FunnelStepRow = {
  stepId: string | null;
  reach: number;
  pct_continue: number;
  index: number;
};

/**
 * Busca e agrega os eventos de uma demo.
 *
 * ⚠️ **Janela temporal:** por padrão, últimos 30 dias. O plano Free tem
 * "50 views/mês" (na verdade ilimitado — D1), então a janela mensal é a
 * unidade natural de comparação. Passa `since` para mudar.
 *
 * ⚠️ **O `workspaceId` é obrigatório** — a policy `events_select` da
 * migration 0000 exige `app.current_tenant_id()` bater com o workspace da
 * demo. Sem o contexto de tenant (`withTenant`), a query volta **0 linhas**
 * — silenciosamente. Por isso a função exige o workspace e roda tudo
 * dentro de `withTenant`.
 */
export async function getDemoSummary(
  demoId: string,
  opts: { since?: Date; workspaceId: string },
): Promise<DemoSummary> {
  // ⚠️ `postgres-js` (o driver do Drizzle) **não aceita `Date` como
  // parâmetro** — ele tenta converter para string e estoura com
  // "The \"string\" argument must be of type string... Received an instance
  // of Date". Por isso passamos o timestamp em ISO.
  const since = (opts.since ?? new Date(Date.now() - 30 * 86400_000)).toISOString();

  return withTenant(opts.workspaceId, async (db) => {
    // ─── 1. Agregados principais (COUNT DISTINCT por visitor) ───
    const totals = await db.execute<{
      unique_visitors: string;
      views: string;
      step_seen_visitors: string;
      cta_click_visitors: string;
      completers: string;
      lead_visitors: string;
      bounced_visitors: string;
    }>(sql`
    SELECT
      COUNT(DISTINCT visitor_id_hash)::text                                    AS unique_visitors,
      COUNT(*) FILTER (WHERE event_type = 'view')::text                        AS views,
      COUNT(DISTINCT visitor_id_hash) FILTER (WHERE event_type = 'step_seen')::text AS step_seen_visitors,
      COUNT(DISTINCT visitor_id_hash) FILTER (WHERE event_type = 'cta_click')::text AS cta_click_visitors,
      COUNT(DISTINCT visitor_id_hash) FILTER (WHERE event_type = 'complete')::text   AS completers,
      COUNT(DISTINCT visitor_id_hash) FILTER (WHERE event_type = 'lead_captured')::text AS lead_visitors,
      COUNT(DISTINCT visitor_id_hash) FILTER (WHERE event_type = 'bounce')::text AS bounced_visitors
    FROM analytics.events
    WHERE demo_id = ${demoId}::uuid
      AND created_at >= ${since}
  `);

    const row = totals[0];
    const uniqueVisitors = Number(row?.unique_visitors ?? 0);
    const views = Number(row?.views ?? 0);
    const stepSeenVisitors = Number(row?.step_seen_visitors ?? 0);
    const ctaClickVisitors = Number(row?.cta_click_visitors ?? 0);
    const completers = Number(row?.completers ?? 0);
    const leadVisitors = Number(row?.lead_visitors ?? 0);
    const bouncedVisitors = Number(row?.bounced_visitors ?? 0);

    // ─── 2. Visitantes que chegaram ao ÚLTIMO step ───
    //
    // O denominador do CTA CTR. "Último step" = o step com a maior posição
    // da demo — precisa da tabela `app.steps`.
    const lastStep = await db.execute<{ step_id: string | null }>(sql`
    SELECT id AS step_id
    FROM app.steps
    WHERE demo_id = ${demoId}::uuid
    ORDER BY position DESC
    LIMIT 1
  `);

    const lastStepId = lastStep[0]?.step_id ?? null;
    let reachedLastStep = 0;
    if (lastStepId) {
      const r = await db.execute<{ n: string }>(sql`
      SELECT COUNT(DISTINCT visitor_id_hash)::text AS n
      FROM analytics.events
      WHERE demo_id = ${demoId}::uuid
        AND created_at >= ${since}
        AND step_id = ${lastStepId}::uuid
        AND event_type = 'step_seen'
    `);
      reachedLastStep = Number(r[0]?.n ?? 0);
    }

    // ─── 3. Distribuições ───
    const byDevice = await db.execute<{ device: string | null; n: string }>(sql`
    SELECT device_class AS device, COUNT(DISTINCT visitor_id_hash)::text AS n
    FROM analytics.events
    WHERE demo_id = ${demoId}::uuid AND created_at >= ${since}
    GROUP BY device_class
    ORDER BY n DESC
  `);

    const byCountry = await db.execute<{ country: string | null; n: string }>(sql`
    SELECT country_code AS country, COUNT(DISTINCT visitor_id_hash)::text AS n
    FROM analytics.events
    WHERE demo_id = ${demoId}::uuid AND created_at >= ${since}
    GROUP BY country_code
    ORDER BY n DESC
    LIMIT 10
  `);

    const topReferrers = await db.execute<{ host: string | null; n: string }>(sql`
    SELECT referrer_host AS host, COUNT(DISTINCT visitor_id_hash)::text AS n
    FROM analytics.events
    WHERE demo_id = ${demoId}::uuid
      AND created_at >= ${since}
      AND referrer_host IS NOT NULL
    GROUP BY referrer_host
    ORDER BY n DESC
    LIMIT 10
  `);

    // ─── 4. Funil (eventos brutos → `computeFunnel`) ───
    //
    // ⚠️ Aqui carregamos os eventos brutos porque `computeFunnel` é uma
    // **pure function** que já existe e já tem testes (o §8 da F5 proíbe
    // mexer nela). O volume é limitado pela janela de 30 dias.
    //
    // ⚠️ `visitor_id_hash` vira o `sessionId` do funil: um visitante é uma
    // sessão do funil. É a mesma semântica que `computeFunnel` assume.
    const rawEvents = await db.execute<{
      event_type: string;
      visitor_id_hash: string | null;
      step_id: string | null;
      created_at: Date;
    }>(sql`
    SELECT event_type, visitor_id_hash, step_id, created_at
    FROM analytics.events
    WHERE demo_id = ${demoId}::uuid AND created_at >= ${since}
    ORDER BY created_at ASC
  `);

    const { computeFunnel } = await import("@/lib/analytics/funnel");
    const funnel = computeFunnel(
      rawEvents.map((e) => ({
        type: e.event_type as
          | "view"
          | "step_seen"
          | "cta_click"
          | "complete"
          | "bounce"
          | "lead_captured",
        sessionId: e.visitor_id_hash ?? "anon",
        stepId: e.step_id ?? undefined,
        ts: new Date(e.created_at).getTime(),
      })),
    );

    return {
      demoId,
      uniqueVisitors,
      views,
      stepSeenVisitors,
      ctaClickVisitors,
      completers,
      leadVisitors,
      bouncedVisitors,
      completionRate: pct(completers, uniqueVisitors),
      ctaCtr: pct(ctaClickVisitors, reachedLastStep),
      byDevice: byDevice.map((r) => ({ device: r.device ?? "desconhecido", count: Number(r.n) })),
      byCountry: byCountry.map((r) => ({ country: r.country ?? "—", count: Number(r.n) })),
      topReferrers: topReferrers.map((r) => ({ host: r.host ?? "—", count: Number(r.n) })),
      funnelSteps: funnel.steps,
      totalSessions: funnel.totalSessions,
      funnelCompleters: funnel.completers,
    };
  });
}

/**
 * Percentual arredondado a 2 casas. `0` quando o denominador é 0.
 */
function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

/**
 * Planos que o creator pode ter — reexportado para a página formatar.
 */
export type { PlanId };
