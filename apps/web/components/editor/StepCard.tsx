"use client";

import type { Step } from "@demo.br/shared";
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";
import * as React from "react";

export type StepCardProps = {
  step: Step;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onCaptionChange: (caption: string) => void;
};

export function StepCard({
  step,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  onCaptionChange,
}: StepCardProps) {
  return (
    <li className="flex gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-col items-center gap-1 pt-2 text-muted-foreground">
        <button type="button" aria-label="rearrastar" className="cursor-grab" title="Arrastar">
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="font-mono text-xs">{index + 1}</span>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">{step.sourceUrl}</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={index === 0}
              className="rounded p-1 hover:bg-muted disabled:opacity-30"
              aria-label="mover para cima"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={index === total - 1}
              className="rounded p-1 hover:bg-muted disabled:opacity-30"
              aria-label="mover para baixo"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="rounded p-1 text-destructive hover:bg-destructive/10"
              aria-label="remover"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
        <input
          value={step.caption ?? ""}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Legenda deste step"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
    </li>
  );
}
