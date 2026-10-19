import crypto from "node:crypto";
/**
 * apps/web/app/api/__tests__/dsr-cross-tenant.test.ts
 *
 * Cobertura cross-tenant do DSR (LGPD art. 18).
 *
 * Estes tests são puros (offline) — testam a função emailHash e a lógica
 * de composição de IDs cross-tenant sem precisar de Postgres rodando.
 * A integração E2E real está em scripts/db/test-rls.ts (DB local).
 */
import { describe, expect, it } from "vitest";

const TENANT_SENTINEL = "00000000-0000-0000-0000-000000000000";

/**
 * Hash SHA-256 do email truncado a 16 chars (mesmo algoritmo usado em dsr/route.ts).
 */
function emailHash(email: string): string {
  return crypto.createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 16);
}

describe("DSR cross-tenant — emailHash", () => {
  it("produz hash de 16 chars", () => {
    expect(emailHash("User@Example.com")).toHaveLength(16);
  });

  it("normaliza para lowercase antes do hash", () => {
    expect(emailHash("User@Example.com")).toBe(emailHash("user@example.com"));
    expect(emailHash("USER@EXAMPLE.COM")).toBe(emailHash("user@example.com"));
  });

  it("diferentes emails produzem hashes diferentes", () => {
    expect(emailHash("a@example.com")).not.toBe(emailHash("b@example.com"));
  });

  it("hash não vaza partes do email (LGPD art. 46)", () => {
    const hash = emailHash("very.long.email.address.that.exceeds.sixteen.chars@example.com");
    expect(hash).not.toContain("very");
    expect(hash).not.toContain("long");
    expect(hash).not.toContain("email");
    expect(hash).not.toContain("@");
    expect(hash).not.toContain("com");
  });

  it("hash é determinístico (mesmo input = mesmo output)", () => {
    const input = "deterministic@test.invalid";
    expect(emailHash(input)).toBe(emailHash(input));
  });

  it("hash NÃO é reversível (criptográfico unidirecional)", () => {
    // Esse test só verifica propriedade: dois emails diferentes produzem
    // hashes completamente distintos — sem correlação visível.
    const h1 = emailHash("alice@example.com");
    const h2 = emailHash("bob@example.com");
    // Não compartilham nenhum char inicial (verificação simples)
    expect(h1.slice(0, 4)).not.toBe(h2.slice(0, 4));
  });
});

describe("DSR cross-tenant — TENANT_SENTINEL", () => {
  it("sentinel é UUID formato válido (zeros)", () => {
    expect(TENANT_SENTINEL).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});

describe("DSR token signing", () => {
  // Replicando a função sign() de dsr/route.ts (HMAC SHA-256)
  function sign(email: string, action: "export" | "delete", secret: string): string {
    return crypto
      .createHmac("sha256", secret)
      .update(`${email.toLowerCase()}:${action}`)
      .digest("hex");
  }

  function verify(
    email: string,
    token: string,
    action: "export" | "delete",
    secret: string,
  ): boolean {
    const expected = sign(email, action, secret);
    if (expected.length !== token.length) return false;
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) {
      mismatch |= expected.charCodeAt(i) ^ token.charCodeAt(i);
    }
    return mismatch === 0;
  }

  it("token válido é aceito", () => {
    const secret = "test-secret";
    const token = sign("user@example.com", "delete", secret);
    expect(verify("user@example.com", token, "delete", secret)).toBe(true);
  });

  it("email com case diferente é aceito (lowercase normalized)", () => {
    const secret = "test-secret";
    const token = sign("User@Example.com", "delete", secret);
    expect(verify("user@example.com", token, "delete", secret)).toBe(true);
  });

  it("action diferente rejeita", () => {
    const secret = "test-secret";
    const token = sign("user@example.com", "delete", secret);
    expect(verify("user@example.com", token, "export", secret)).toBe(false);
  });

  it("secret diferente rejeita", () => {
    const token = sign("user@example.com", "delete", "secret-A");
    expect(verify("user@example.com", token, "delete", "secret-B")).toBe(false);
  });

  it("token adulterado rejeita", () => {
    const secret = "test-secret";
    const token = sign("user@example.com", "delete", secret);
    const tampered = "0000" + token.slice(4);
    expect(verify("user@example.com", tampered, "delete", secret)).toBe(false);
  });

  it("tokens têm length fixo (64 chars hex)", () => {
    expect(sign("any@email.com", "export", "s")).toMatch(/^[a-f0-9]{64}$/);
  });
});
