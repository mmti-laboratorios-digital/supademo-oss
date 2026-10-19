import * as React from "react";

export type HotspotGeometry = {
  type: "pointer" | "callout" | "area";
  x: number;
  y: number;
  w?: number;
  h?: number;
  label?: string;
};

export type HotspotProps = {
  geometry: HotspotGeometry;
  stepId: string;
  onActivate: () => void;
  disabled?: boolean;
};

export function Hotspot({ geometry, stepId, onActivate, disabled }: HotspotProps) {
  if (geometry.type === "area" && geometry.w && geometry.h) {
    return (
      <button
        type="button"
        aria-label="hotspot"
        data-step-id={stepId}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onActivate();
        }}
        className="dbr-hotspot dbr-hotspot--area"
        style={{
          left: `${geometry.x}%`,
          top: `${geometry.y}%`,
          width: `${geometry.w}%`,
          height: `${geometry.h}%`,
        }}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label="hotspot"
      data-step-id={stepId}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
      className="dbr-hotspot dbr-hotspot--pointer"
      style={{ left: `${geometry.x}%`, top: `${geometry.y}%` }}
    />
  );
}
