"use client";

import * as React from "react";

export type HotspotGeometry = {
  type: "pointer" | "callout" | "area";
  x: number; // 0-100 (%)
  y: number; // 0-100 (%)
  w?: number; // 0-100 (%)
  h?: number; // 0-100 (%)
  label?: string | null;
};

export type HotspotOverlayProps = {
  hotspot: HotspotGeometry;
  stepId: string;
  onActivate: () => void;
  disabled?: boolean;
};

export function HotspotOverlay({
  hotspot,
  stepId,
  onActivate,
  disabled,
}: HotspotOverlayProps) {
  const ariaLabel =
    hotspot.label ??
    (hotspot.type === "area"
      ? "Área interativa — clique para avançar"
      : "Próximo passo — clique para avançar");

  if (hotspot.type === "area" && hotspot.w && hotspot.h) {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        data-step-id={stepId}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onActivate();
        }}
        className="absolute z-10 cursor-pointer rounded-md border-2 border-primary/70 bg-primary/10 transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          left: `${hotspot.x}%`,
          top: `${hotspot.y}%`,
          width: `${hotspot.w}%`,
          height: `${hotspot.h}%`,
        }}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      data-step-id={stepId}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
      className="absolute z-10 h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-2 border-primary bg-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:animate-none disabled:opacity-50"
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
    >
      <span className="absolute inset-0 m-auto h-3 w-3 rounded-full bg-primary" />
    </button>
  );
}