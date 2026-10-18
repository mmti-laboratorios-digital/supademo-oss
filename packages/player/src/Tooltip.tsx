import * as React from "react";
import type { HotspotGeometry } from "./Hotspot";

export type TooltipProps = {
  geometry: HotspotGeometry;
  children: React.ReactNode;
};

export function Tooltip({ geometry, children }: TooltipProps) {
  return (
    <div
      className="dbr-tooltip"
      style={{ left: `${geometry.x}%`, top: `${geometry.y}%` }}
    >
      {children}
    </div>
  );
}