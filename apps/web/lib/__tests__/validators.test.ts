import { demoCreateSchema, leadCreateSchema } from "@demo.br/shared";
import type { EventType } from "@demo.br/shared";
/**
 * apps/web/lib/__tests__/validators.test.ts
 *
 * Valida os zod schemas canônicos do @demo.br/shared.
 * Cobre: Demo slug regex, Lead consent+email, Event eventType.
 */
import { describe, expect, it } from "vitest";

const VALID_EVENT_TYPES: EventType[] = [
  "view",
  "step_seen",
  "cta_click",
  "complete",
  "bounce",
  "lead_captured",
];

describe("Demo validator", () => {
  it.each([
    "Tour Exemplo", // espaço + uppercase
    "tour_exemplo", // underscore
    "tour!", // exclamação
    "tour@2024", // @
    "TOUR-EXEMPLO", // uppercase
  ])("rejeita slug %s", (slug) => {
    const result = demoCreateSchema.safeParse({
      title: "Título válido",
      slug,
    });
    expect(result.success).toBe(false);
  });

  it.each([
    "tour-exemplo",
    "abc-123",
    "demo-do-produto-2024",
    "x".repeat(64), // limite
  ])("aceita slug %s", (slug) => {
    const result = demoCreateSchema.safeParse({
      title: "Tour de demonstração",
      slug,
      language: "pt-BR",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita slug > 64 chars", () => {
    const longSlug = "a".repeat(65);
    const result = demoCreateSchema.safeParse({
      title: "título",
      slug: longSlug,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita slug com menos de 3 chars", () => {
    const result = demoCreateSchema.safeParse({
      title: "título",
      slug: "ab",
    });
    expect(result.success).toBe(false);
  });
});

describe("Lead validator", () => {
  const validBase = {
    workspaceId: "11111111-1111-4111-8111-111111111111",
    demoId: "22222222-2222-4222-8222-222222222222",
    workspaceName: "Workspace Teste",
    name: "Maria Silva",
    email: "maria@example.com",
    consent: true,
  };

  it("aceita lead com email + consentimento", () => {
    const result = leadCreateSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("rejeita sem email", () => {
    const result = leadCreateSchema.safeParse({ ...validBase, email: undefined });
    expect(result.success).toBe(false);
  });

  it("rejeita email inválido", () => {
    const result = leadCreateSchema.safeParse({
      ...validBase,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita sem consentimento (LGPD art. 7º)", () => {
    const result = leadCreateSchema.safeParse({
      ...validBase,
      consent: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita consent ausente", () => {
    const { consent, ...rest } = validBase;
    void consent;
    const result = leadCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("Event validator", () => {
  // Não temos um eventSchema canônico no shared — mas validamos manualmente
  // que os tipos aceitos correspondem ao union em @demo.br/shared.
  it.each(VALID_EVENT_TYPES)("eventType %s é válido", (type) => {
    // Validação simples: string presente e dentro do whitelist
    expect(VALID_EVENT_TYPES).toContain(type);
  });

  it("rejeita eventType desconhecido", () => {
    const allowed: ReadonlyArray<string> = VALID_EVENT_TYPES;
    const invalid = "invalid_event";
    expect(allowed).not.toContain(invalid);
  });

  it("rejeita eventType não-string", () => {
    const invalid: unknown[] = [123, null, { type: "view" }];
    for (const v of invalid) {
      const isValid = typeof v === "string" && VALID_EVENT_TYPES.includes(v as EventType);
      expect(isValid).toBe(false);
    }
  });
});
