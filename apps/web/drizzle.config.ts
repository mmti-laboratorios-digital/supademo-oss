import type { Config } from "drizzle-kit";

/**
 * Configuração do drizzle-kit para gerar migrations a partir do schema.
 *
 * Uso:
 *   pnpm db:generate   → gera SQL em ./db/migrations
 *   pnpm db:migrate    → aplica migrations no banco
 */
export default {
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgres://app_owner:CHANGEME_owner@localhost:55432/easydemo",
  },
  verbose: true,
  strict: true,
} satisfies Config;
