/**
 * Conversão de coordenadas de captura (pixels no viewport) para o hotspot
 * percentual usado pela API de steps.
 *
 * ⚠️ F9: a origem das coordenadas é o viewport da página capturada, não o
 * popup/background da extensão. O content script envia `viewport` junto com
 * `boundingRect` para que o cálculo use as dimensões corretas e o hotspot
 * caia no lugar certo do screenshot.
 */
export type CaptureViewport = { width: number; height: number };
export type CaptureBoundingRect = { x: number; y: number; width: number; height: number };
export type CaptureHotspot = {
  type: "pointer" | "callout" | "area";
  x: number;
  y: number;
};

export function pixelsToHotspot(
  rect: CaptureBoundingRect,
  viewport: CaptureViewport,
  type: CaptureHotspot["type"] = "pointer",
): CaptureHotspot {
  if (viewport.width <= 0 || viewport.height <= 0) {
    return { type, x: 0, y: 0 };
  }
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  return {
    type,
    x: clampPercent((cx / viewport.width) * 100),
    y: clampPercent((cy / viewport.height) * 100),
  };
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
