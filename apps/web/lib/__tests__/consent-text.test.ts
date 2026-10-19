/**
 * apps/web/lib/__tests__/consent-text.test.ts
 *
 * Validação do texto de consentimento LGPD.
 */
import { describe, expect, it } from "vitest";

const LGPD_KEYWORDS = ["autorizo", "LGPD", "lei 13.709", "contato", "consent"];

function validateConsentText(text: string): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (text.length < 20) reasons.push("Mínimo 20 caracteres");
  if (text.length > 1000) reasons.push("Máximo 1000 caracteres");
  const textLower = text.toLowerCase();
  if (!LGPD_KEYWORDS.some((k) => textLower.includes(k.toLowerCase()))) {
    reasons.push("Texto deve mencionar LGPD ou lei 13.709");
  }
  return { valid: reasons.length === 0, reasons };
}

describe("validateConsentText", () => {
  it("aceita texto padrão LGPD", () => {
    const res = validateConsentText("Autorizo o envio de contatos conforme LGPD - Lei 13.709/2018");
    expect(res.valid).toBe(true);
    expect(res.reasons).toEqual([]);
  });

  it("rejeita texto sem menção a LGPD", () => {
    const res = validateConsentText("Aceito receber comunicados promocionais");
    expect(res.valid).toBe(false);
    expect(res.reasons.length).toBeGreaterThan(0);
  });

  it("rejeita texto muito curto", () => {
    const res = validateConsentText("ok LGPD");
    expect(res.valid).toBe(false);
    expect(res.reasons).toContain("Mínimo 20 caracteres");
  });

  it("rejeita texto muito longo", () => {
    const res = validateConsentText("a".repeat(1001) + " LGPD");
    expect(res.valid).toBe(false);
    expect(res.reasons).toContain("Máximo 1000 caracteres");
  });
});
