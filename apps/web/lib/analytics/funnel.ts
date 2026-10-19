/**
 * apps/web/lib/analytics/funnel.ts
 *
 * Calcula funil de conversão a partir de eventos analytics LGPD-safe.
 *
 * Pure function — não toca DB. Recebe array de eventos e retorna step→reach.
 *
 * Step "view" é o topo do funil. Cada step_seen subsequente avança um nível.
 * `pct_continue` é a % de quem avançou do step N-1 para o step N.
 */

export type FunnelEvent = {
  type: "view" | "step_seen" | "cta_click" | "complete" | "bounce" | "lead_captured";
  sessionId: string;
  stepId?: string;
  ts: number;
};

export type FunnelStep = {
  stepId: string | null;
  /** Quantos sessions chegaram a este step (1 para view, demais para step_seen) */
  reach: number;
  /** % dos sessions que saíram do step anterior para cá */
  pct_continue: number;
  /** Posição no funil (0 = topo) */
  index: number;
};

export type FunnelResult = {
  steps: FunnelStep[];
  /** Total de sessions que viram o demo */
  totalSessions: number;
  /** Total de sessions que concluíram (chegaram em complete) */
  completers: number;
  /** conversion rate global */
  conversionRate: number;
};

/**
 * Calcula funil a partir de eventos. Assume eventos ordenados por ts (crescente).
 * Sessões são identificadas por `sessionId`.
 *
 * Algoritmo:
 *  1. group events by sessionId
 *  2. para cada session, monta a sequência única de stepIds
 *     (primeira ocorrência de cada stepId)
 *  3. agrega reach por stepId
 *  4. pct_continue[i] = reach[i] / reach[i-1]
 */
export function computeFunnel(events: FunnelEvent[]): FunnelResult {
  if (events.length === 0) {
    return {
      steps: [],
      totalSessions: 0,
      completers: 0,
      conversionRate: 0,
    };
  }

  // 1. agrupa por session
  const bySession = new Map<string, FunnelEvent[]>();
  for (const e of events) {
    if (!bySession.has(e.sessionId)) bySession.set(e.sessionId, []);
    bySession.get(e.sessionId)!.push(e);
  }

  // 2. sequência única de stepIds por session (na ordem temporal)
  const sequences = new Map<string, { steps: (string | null)[]; completed: boolean }>();
  for (const [sessionId, evs] of bySession) {
    evs.sort((a, b) => a.ts - b.ts);
    const seenSteps = new Set<string | null>();
    const steps: (string | null)[] = [];
    let completed = false;

    // Garantir 'view' como step 0 (null)
    if (evs.some((e) => e.type === "view")) {
      if (!seenSteps.has(null)) {
        seenSteps.add(null);
        steps.push(null);
      }
    }

    for (const e of evs) {
      if (e.type === "step_seen" && e.stepId) {
        if (!seenSteps.has(e.stepId)) {
          seenSteps.add(e.stepId);
          steps.push(e.stepId);
        }
      }
      if (e.type === "complete") {
        completed = true;
      }
    }
    sequences.set(sessionId, { steps, completed });
  }

  // 3. agrega reach por step (na ordem de primeira ocorrência)
  const reachOrder: (string | null)[] = [];
  const reachCount = new Map<string | null, number>();

  for (const { steps } of sequences.values()) {
    for (const stepId of steps) {
      if (!reachCount.has(stepId)) {
        reachOrder.push(stepId);
        reachCount.set(stepId, 0);
      }
      reachCount.set(stepId, reachCount.get(stepId)! + 1);
    }
  }

  // 4. monta resultado com pct_continue
  const totalSessions = sequences.size;
  const completers = Array.from(sequences.values()).filter((s) => s.completed).length;

  const stepsOut: FunnelStep[] = reachOrder.map((stepId, idx) => {
    const reach = reachCount.get(stepId)!;
    const prev =
      idx === 0
        ? null
        : (() => {
            const prevId = reachOrder[idx - 1];
            return prevId === undefined ? null : (reachCount.get(prevId) ?? null);
          })();
    const pct_continue = idx === 0 ? 100 : prev && prev > 0 ? (reach / prev) * 100 : 0;
    return {
      stepId,
      reach,
      pct_continue: Math.round(pct_continue * 100) / 100,
      index: idx,
    };
  });

  return {
    steps: stepsOut,
    totalSessions,
    completers,
    conversionRate: totalSessions > 0 ? Math.round((completers / totalSessions) * 10000) / 100 : 0,
  };
}
