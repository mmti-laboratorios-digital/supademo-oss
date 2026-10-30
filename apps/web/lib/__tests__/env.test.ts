/**
 * apps/web/lib/__tests__/env.test.ts
 *
 * Cobertura mínima do módulo env:
 *  - rejeita env sem DATABASE_URL
 *  - aceita NODE_ENV=production com todas as vars obrigatórias
 *  - formatBRL() formata corretamente (não depende de env)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatBRL } from "../utils";

describe("formatBRL", () => {
  // Intl.NumberFormat usa NBSP (U+00A0) antes do símbolo — esperado
  const NBSP = "\u00A0";
  it.each([
    [123450, `R$${NBSP}1.234,50`],
    [0, `R$${NBSP}0,00`],
    [100000, `R$${NBSP}1.000,00`],
    [99, `R$${NBSP}0,99`],
    [1234567, `R$${NBSP}12.345,67`],
  ])("formata %i centavos como %s", (cents, expected) => {
    expect(formatBRL(cents)).toBe(expected);
  });

  it("usa separador pt-BR (vírgula)", () => {
    const out = formatBRL(100);
    expect(out).toContain(",");
    expect(out).toMatch(/R\$/);
  });
});

describe("env()", () => {
  // O cache do módulo persiste entre describes — resetamos via vi.resetModules()
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Salva process.env original e limpa todas as variáveis potencialmente relevantes
    delete process.env.DATABASE_URL;
    delete process.env.CLERK_SECRET_KEY;
    delete process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    // Bypass readonly tipado de NodeJS.ProcessEnv para chaves nomeadas.
    delete (process.env as Record<string, string | undefined>)["NODE_ENV"];
    // Limpa opcionais para verificar defaults
    delete process.env.R2_BUCKET_PUBLIC;
    delete process.env.R2_BUCKET_PRIVATE;
    delete process.env.EMAIL_FROM;
    delete process.env.APP_BASE_URL;
    delete process.env.ASAAS_ENVIRONMENT;
    vi.resetModules();
  });

  afterEach(() => {
    // Restaura environment
    for (const k of Object.keys(process.env)) delete process.env[k];
    Object.assign(process.env, originalEnv);
    vi.resetModules();
  });

  it("rejeita env sem DATABASE_URL", async () => {
    process.env.CLERK_SECRET_KEY = "sk_test";
    process.env.CLERK_WEBHOOK_SIGNING_SECRET = "whsec_test";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test";

    const { env } = await import("../env");
    expect(() => env()).toThrow(/Invalid environment variables/i);
  });

  it("aceita NODE_ENV=production com DATABASE_URL e vars Clerk", async () => {
    // Bypass readonly tipado de NodeJS.ProcessEnv para chaves nomeadas.
    (process.env as Record<string, string | undefined>)["NODE_ENV"] = "production";
    process.env.DATABASE_URL = "postgres://app_user:easydemo@127.0.0.1:55432/easydemo";
    process.env.CLERK_SECRET_KEY = "sk_test_prod";
    process.env.CLERK_WEBHOOK_SIGNING_SECRET = "whsec_test_prod";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_prod";

    const { env } = await import("../env");
    const parsed = env();
    expect(parsed.NODE_ENV).toBe("production");
    expect(parsed.DATABASE_URL).toMatch(/easydemo/);
    // Defaults aplicados via schema
    expect(parsed.LOCALE_DEFAULT).toBe("pt-BR");
    expect(parsed.ASAAS_ENVIRONMENT).toBe("sandbox");
  });

  it("aplica defaults quando variáveis opcionais estão ausentes", async () => {
    process.env.DATABASE_URL = "postgres://app_user:easydemo@127.0.0.1:55432/easydemo";
    process.env.CLERK_SECRET_KEY = "sk_test";
    process.env.CLERK_WEBHOOK_SIGNING_SECRET = "whsec_test";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test";

    const { env } = await import("../env");
    const parsed = env();
    expect(parsed.NODE_ENV).toBe("development");
    expect(parsed.APP_BASE_URL).toBe("http://localhost:3000");
    expect(parsed.R2_BUCKET_PUBLIC).toBe("demo-public");
    expect(parsed.EMAIL_FROM).toBe("EasyDemo <noreply@dominio.com.br>");
  });
});
