import { defineConfig } from "vitest/config";

/**
 * vitest.config.ts — apps/workers
 *
 * Os testes das tasks rodam contra o Postgres real (mesmo padrão do
 * `apps/web`): o job de expurgo de assinatura faz UPDATE em
 * `app.workspaces`, e um mock esconderia exatamente a lógica que importa
 * (RLS, `cancel_at_period_end`, o "não rebaixar quem renovou").
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/__tests__/**/*.test.ts", "src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
