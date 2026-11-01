"use client";

import * as React from "react";

/**
 * apps/web/components/analytics/StatsChart.tsx
 * -----------------------------------------------------------------------------
 * Dashboard de analytics da demo.
 *
 * ⚠️ **Antes:** este componente recebia um `Record<string, number>` com a
 * contagem bruta de eventos e mostrava 6 barras + uma taxa de conclusão
 * calculada como `complete / view`. Isso não dizia nada acionável:
 *
 * - "Taxa de conclusão" usava **views** no denominador, mas um visitante
 *   que abre o demo 3 vezes conta como 3 — a taxa ficava artificialmente
 *   baixa;
 * - não havia **drop-off por step** (onde o visitante desiste), que é a
 *   informação que o creator mais precisa;
 * - não havia **CTA CTR**, que é a métrica comercial do produto.
 *
 * Agora o componente recebe o resumo já calculado
 * (`lib/analytics/summary.ts`) e renderiza:
 *   1. as métricas-chave (visitantes, conclusão, CTA CTR, leads);
 *   2. o **funil com drop-off por step**;
 *   3. a distribuição por device e país.
 */

export type StatsChartProps = {
  /** Resumo pronto — vem de `getDemoSummary()`. */
  summary: {
    uniqueVisitors: number;
    views: number;
    stepSeenVisitors: number;
    ctaClickVisitors: number;
    completers: number;
    leadVisitors: number;
    bouncedVisitors: number;
    completionRate: number;
    ctaCtr: number;
    byDevice: Array<{ device: string; count: number }>;
    byCountry: Array<{ country: string; count: number }>;
    topReferrers: Array<{ host: string; count: number }>;
    funnelSteps: Array<{
      stepId: string | null;
      reach: number;
      pct_continue: number;
      index: number;
    }>;
    totalSessions: number;
  };
  /**
   * Rótulo de cada step do funil, indexado pela posição no funil.
   *
   * ⚠️ O funil (`computeFunnel`) devolve `stepId` (null = "view"). O
   * dashboard resolve o nome — "Step 3" + o caption — para o creator
   * entender **onde** o visitante desiste.
   */
  stepLabels?: Record<number, string>;
};

export function StatsChart({ summary, stepLabels = {} }: StatsChartProps) {
  const { funnelSteps } = summary;
  const maxReach = Math.max(1, ...funnelSteps.map((s) => s.reach));

  return (
    <div className="space-y-8">
      {/* ─── Métricas-chave ─── */}
      <section aria-labelledby="metricas-chave" className="space-y-3">
        <h2 id="metricas-chave" className="text-lg font-semibold">
          Métricas-chave
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Visitantes"
            value={summary.uniqueVisitors}
            hint={`${summary.views} visualizações`}
          />
          <MetricCard
            label="Taxa de conclusão"
            value={summary.completionRate}
            suffix="%"
            hint={`${summary.completers} concluíram`}
          />
          <MetricCard
            label="CTA CTR"
            value={summary.ctaCtr}
            suffix="%"
            hint={`${summary.ctaClickVisitors} cliques no CTA`}
          />
          <MetricCard
            label="Leads"
            value={summary.leadVisitors}
            hint={`${summary.bouncedVisitors} saíram no primeiro step`}
          />
        </div>
      </section>

      {/* ─── Funil com drop-off ─── */}
      <section aria-labelledby="funil" className="space-y-3">
        <h2 id="funil" className="text-lg font-semibold">
          Funil
        </h2>
        {funnelSteps.length === 0 ? (
          <p className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
            Ainda não há eventos registrados. Compartilhe o link da demo para coletar dados.
          </p>
        ) : (
          <ol className="space-y-2">
            {funnelSteps.map((step) => {
              const label = stepLabels[step.index] ?? defaultStepLabel(step);
              // Drop-off: quanto do público que chegou ao step anterior
              // NÃO chegou neste.
              const dropOff =
                step.index === 0
                  ? null
                  : Math.max(0, 100 - (step.pct_continue > 100 ? 100 : step.pct_continue));

              return (
                <li key={`${step.index}-${step.stepId ?? "view"}`} className="space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium">{label}</span>
                    <span className="font-mono text-muted-foreground">
                      {step.reach} visitante{step.reach === 1 ? "" : "s"}
                      {step.index > 0 ? ` · ${step.pct_continue}%` : ""}
                    </span>
                  </div>
                  <div
                    className="h-3 overflow-hidden rounded bg-muted"
                    role="img"
                    aria-label={`${label}: ${step.reach} visitantes`}
                  >
                    <div
                      className="h-3 rounded bg-primary"
                      style={{ width: `${(step.reach / maxReach) * 100}%` }}
                    />
                  </div>
                  {dropOff !== null && dropOff > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {dropOff}% desiste{step.index === 1 ? " no primeiro step" : " aqui"}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* ─── Distribuições ─── */}
      <div className="grid gap-6 md:grid-cols-3">
        <Breakdown
          title="Dispositivo"
          items={summary.byDevice.map((d) => ({ label: deviceLabel(d.device), count: d.count }))}
          emptyLabel="Sem dados de dispositivo."
        />
        <Breakdown
          title="País"
          items={summary.byCountry.map((c) => ({ label: c.country, count: c.count }))}
          emptyLabel="Sem dados de país."
        />
        <Breakdown
          title="Origem do tráfego"
          items={summary.topReferrers.map((r) => ({ label: r.host, count: r.count }))}
          emptyLabel="Sem referrers — o tráfego é direto."
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold">
        {value}
        {suffix ? <span className="text-lg font-normal">{suffix}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Breakdown({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: Array<{ label: string; count: number }>;
  emptyLabel: string;
}) {
  const total = items.reduce((acc, i) => acc + i.count, 0);
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <section aria-labelledby={`breakdown-${title}`} className="space-y-2">
      <h3 id={`breakdown-${title}`} className="text-sm font-semibold">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((i) => (
            <li key={i.label} className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="truncate">{i.label}</span>
                <span className="font-mono text-muted-foreground">
                  {i.count} ({total > 0 ? Math.round((i.count / total) * 100) : 0}%)
                </span>
              </div>
              <div className="h-1.5 rounded bg-muted">
                <div
                  className="h-1.5 rounded bg-muted-foreground/60"
                  style={{ width: `${(i.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Rótulo padrão quando a página não resolve o nome do step. */
function defaultStepLabel(step: { index: number; stepId: string | null }): string {
  if (step.stepId === null) return "Visualização";
  return `Step ${step.index}`;
}

function deviceLabel(device: string): string {
  switch (device) {
    case "mobile":
      return "Celular";
    case "tablet":
      return "Tablet";
    case "desktop":
      return "Computador";
    default:
      return "Desconhecido";
  }
}
