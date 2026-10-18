/**
 * apps/web/lib/__tests__/lgpd-redact.test.ts
 *
 * Testes determinísticos do detector de PII (sem OCR).
 * Cobre: CPF, CNPJ, e-mail, cartão, multi-detecção.
 */
import { describe, it, expect } from "vitest";
import { redactPII, detectPIIKind, maskForLog } from "../lgpd/redact";

describe("redactPII — single patterns", () => {
  it("detecta CPF e retorna bounds", () => {
    const text = "Cliente: CPF 123.456.789-09 cadastrado em 2024";
    const hits = redactPII(text);
    const cpf = hits.find((h) => h.kind === "cpf");
    expect(cpf).toBeDefined();
    expect(cpf?.text).toBe("123.456.789-09");
    expect(cpf?.w).toBeGreaterThan(0);
    expect(cpf?.h).toBeGreaterThan(0);
    expect(cpf?.x).toBeGreaterThanOrEqual(0);
    expect(cpf?.y).toBeGreaterThanOrEqual(0);
  });

  it("detecta CNPJ", () => {
    const hits = redactPII("Empresa 12.345.678/0001-90");
    const cnpj = hits.find((h) => h.kind === "cnpj");
    expect(cnpj).toBeDefined();
    expect(cnpj?.text).toBe("12.345.678/0001-90");
  });

  it("detecta email", () => {
    const hits = redactPII("Contato: joao.silva@exemplo.com.br");
    const email = hits.find((h) => h.kind === "email");
    expect(email).toBeDefined();
    expect(email?.text.toLowerCase()).toBe("joao.silva@exemplo.com.br");
  });

  it("detecta cartão de 16 dígitos", () => {
    const hits = redactPII("Pago com 4111 1111 1111 1111 Visa");
    const cc = hits.find((h) => h.kind === "credit_card");
    expect(cc).toBeDefined();
    expect(cc?.text.replace(/\D/g, "")).toBe("4111111111111111");
  });

  it("detecta múltiplas PIIs no mesmo texto", () => {
    const text = `
      Nome: João Silva
      Email: joao@empresa.com.br
      CPF: 111.222.333-44
      CNPJ: 11.222.333/0001-44
      Cartão: 5500 0000 0000 0004
    `;
    const hits = redactPII(text);
    const kinds = new Set(hits.map((h) => h.kind));
    expect(kinds.has("email")).toBe(true);
    expect(kinds.has("cpf")).toBe(true);
    expect(kinds.has("cnpj")).toBe(true);
    expect(kinds.has("credit_card")).toBe(true);
    expect(hits.length).toBeGreaterThanOrEqual(4);
  });
});

describe("redactPII — edge cases", () => {
  it("retorna lista vazia em texto sem PII", () => {
    const hits = redactPII("Olá, como vai?");
    expect(hits).toEqual([]);
  });

  it("ignora CEP de 8 dígitos (não é cartão)", () => {
    const hits = redactPII("CEP 01310-100 São Paulo");
    const cc = hits.find((h) => h.kind === "credit_card");
    expect(cc).toBeUndefined();
  });

  it("detecta cartão sem espaços (4111111111111111)", () => {
    const hits = redactPII("CC=4111111111111111 ok");
    const cc = hits.find((h) => h.kind === "credit_card");
    expect(cc).toBeDefined();
  });
});

describe("detectPIIKind", () => {
  it.each([
    ["123.456.789-09", ["cpf"]],
    ["12.345.678/0001-90", ["cnpj"]],
    ["user@example.com", ["email"]],
    ["(11) 98888-7777", ["phone_br"]],
    ["4111 1111 1111 1111", ["credit_card"]],
  ])("input %s → kinds %s", (input, expected) => {
    expect(detectPIIKind(input)).toEqual(expect.arrayContaining(expected));
  });
});

describe("maskForLog", () => {
  it("substitui PII por placeholders", () => {
    const masked = maskForLog("Email joao@x.com CPF 123.456.789-09");
    expect(masked).not.toContain("joao@x.com");
    expect(masked).not.toContain("123.456.789-09");
    expect(masked).toContain("[REDACTED:email]");
    expect(masked).toContain("[REDACTED:cpf]");
  });
});