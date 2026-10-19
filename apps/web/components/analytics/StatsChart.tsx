"use client";

import * as React from "react";

export type StatsChartProps = {
  stats: Record<string, number>;
};

const LABELS_PT: Record<string, string> = {
  view: "Visualizações",
  step_seen: "Steps vistos",
  cta_click: "Cliques CTA",
  complete: "Conclusões",
  bounce: "Saídas",
  lead_captured: "Leads",
};

export function StatsChart({ stats }: StatsChartProps) {
  const entries = Object.entries(LABELS_PT).map(([key, label]) => ({
    key,
    label,
    value: stats[key] ?? 0,
  }));

  const max = Math.max(1, ...entries.map((e) => e.value));

  const completionRate =
    (stats.view ?? 0) > 0 ? Math.round(((stats.complete ?? 0) / (stats.view ?? 0)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">Taxa de conclusão</p>
        <p className="text-3xl font-bold">{completionRate}%</p>
      </div>

      <div className="space-y-3">
        {entries.map((e) => (
          <div key={e.key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{e.label}</span>
              <span className="font-mono">{e.value}</span>
            </div>
            <div className="h-2 rounded bg-muted">
              <div
                className="h-2 rounded bg-primary"
                style={{ width: `${(e.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
