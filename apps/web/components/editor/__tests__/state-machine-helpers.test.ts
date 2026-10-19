/**
 * apps/web/components/editor/__tests__/state-machine-helpers.test.ts
 *
 * Helpers puros do editor: slug validation, hotspot bounds clamping,
 * variable interpolation.
 */
import { describe, expect, it } from "vitest";

const slugPattern = /^[a-z0-9-]{3,32}$/;
function isValidSlug(s: string): boolean {
  return slugPattern.test(s);
}

function clampFractions(b: { x: number; y: number; w: number; h: number }) {
  return {
    x: Math.max(0, Math.min(1, b.x)),
    y: Math.max(0, Math.min(1, b.y)),
    w: Math.max(0, Math.min(1, b.w)),
    h: Math.max(0, Math.min(1, b.h)),
  };
}

function interpolateVars(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

describe("slug validation", () => {
  it.each([
    ["meu-demo", true],
    ["tour-do-produto", true],
    ["tour-do-produto-muito-longo-para-caber", false],
    ["Demo Com Espaço", false],
    ["DemoComMaiuscula", false],
    ["ab", false],
    ["slug_valido_com_underscore", false],
  ])("isValidSlug(%j) → %j", (slug, expected) => {
    expect(isValidSlug(slug)).toBe(expected);
  });
});

describe("hotspot bounds clamping", () => {
  it("clamp [0,1] - normal bounds", () => {
    const clamped = clampFractions({ x: 0.5, y: 0.5, w: 0.02, h: 0.02 });
    expect(clamped).toEqual({ x: 0.5, y: 0.5, w: 0.02, h: 0.02 });
  });

  it("clamp [0,1] - out-of-range values", () => {
    const clamped = clampFractions({ x: -0.5, y: 1.5, w: 1.5, h: 0 });
    expect(clamped).toEqual({ x: 0, y: 1, w: 1, h: 0 });
  });
});

describe("variable interpolation", () => {
  it("substitui variáveis conhecidas", () => {
    expect(interpolateVars("Olá {{name}}", { name: "João" })).toBe("Olá João");
  });

  it("mantém tokens não-resolvidos no output", () => {
    expect(interpolateVars("{{name}} - {{empresa}}", { name: "Ana" })).toBe("Ana - {{empresa}}");
  });

  it("substitui múltiplas ocorrências", () => {
    expect(interpolateVars("{{name}} & {{name}}", { name: "X" })).toBe("X & X");
  });
});
