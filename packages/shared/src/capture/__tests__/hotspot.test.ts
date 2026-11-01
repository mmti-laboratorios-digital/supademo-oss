/**
 * packages/shared/src/capture/__tests__/hotspot.test.ts
 *
 * Gate G5 (F9) — precisão do hotspot da extensão.
 *
 * O content script envia o bounding box em pixels + viewport da página
 * capturada. A conversão para percentual deve usar essas dimensões, não
 * `window.innerWidth` do popup/background.
 */
import { describe, expect, it } from "vitest";
import { pixelsToHotspot } from "../hotspot";

describe("pixelsToHotspot", () => {
  it("converte centro de um retângulo para percentual", () => {
    const rect = { x: 100, y: 200, width: 40, height: 60 };
    const viewport = { width: 1000, height: 1000 };
    const hotspot = pixelsToHotspot(rect, viewport, "pointer");

    // centro = (120, 230) → (12%, 23%)
    expect(hotspot).toEqual({ type: "pointer", x: 12, y: 23 });
  });

  it("clampa em 0 quando as coordenadas são negativas", () => {
    const rect = { x: -50, y: -30, width: 20, height: 20 };
    const viewport = { width: 1000, height: 1000 };
    expect(pixelsToHotspot(rect, viewport)).toEqual({ type: "pointer", x: 0, y: 0 });
  });

  it("clampa em 100 quando ultrapassa o viewport", () => {
    const rect = { x: 950, y: 980, width: 100, height: 100 };
    const viewport = { width: 1000, height: 1000 };
    // centro = (1000, 1030) → (100%, 103%) → clamp 100
    expect(pixelsToHotspot(rect, viewport)).toEqual({ type: "pointer", x: 100, y: 100 });
  });

  it("usa viewport pequeno sem estourar escala", () => {
    const rect = { x: 250, y: 150, width: 100, height: 100 };
    const viewport = { width: 500, height: 400 };
    // centro = (300, 200) → (60%, 50%)
    expect(pixelsToHotspot(rect, viewport)).toEqual({ type: "pointer", x: 60, y: 50 });
  });

  it("evita divisão por zero em viewport inválido", () => {
    const rect = { x: 0, y: 0, width: 10, height: 10 };
    const viewport = { width: 0, height: 0 };
    expect(pixelsToHotspot(rect, viewport)).toEqual({ type: "pointer", x: 0, y: 0 });
  });
});
