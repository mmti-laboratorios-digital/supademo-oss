/**
 * apps/web/vitest.setup.ts
 *
 * Carrega variáveis de ambiente de teste antes de qualquer import que use env().
 * Usa dotenv builtin via process.loadEnvFile (Node 22+).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envFile = resolve(process.cwd(), ".env.test");
const fallbackEnv = resolve(process.cwd(), "../../.env.test");

const path = existsSync(envFile) ? envFile : fallbackEnv;

if (existsSync(path)) {
  const content = readFileSync(path, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

// Garantir defaults para env() — DATABASE_URL é a única obrigatória.
// Cast via Record<string, string | undefined> para bypassar a tipagem readonly
// que o TS infere para chaves nomeadas em NodeJS.ProcessEnv.
(process.env as Record<string, string | undefined>)["NODE_ENV"] ??= "test";
process.env.APP_BASE_URL ??= "http://localhost:3000";
process.env.PLAYER_BASE_URL ??= "http://localhost:3000";
process.env.MARKETING_BASE_URL ??= "http://localhost:3000";
process.env.LOCALE_DEFAULT ??= "pt-BR";
process.env.LOCALE_SUPPORTED ??= "pt-BR,en";
process.env.CLERK_SECRET_KEY ??= "sk_test_placeholder";
process.env.CLERK_WEBHOOK_SIGNING_SECRET ??= "whsec_placeholder";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??= "pk_test_placeholder";
