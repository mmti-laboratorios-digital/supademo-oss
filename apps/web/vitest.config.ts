import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    globalSetup: ["./vitest.globalSetup.ts"],
    include: [
      "lib/**/__tests__/**/*.test.ts",
      "components/**/__tests__/**/*.test.ts",
      "app/api/**/__tests__/**/*.test.ts",
      "**/*.test.ts",
      "**/*.test.tsx",
    ],
    exclude: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["lib/**/*.ts", "components/**/*.ts", "components/**/*.tsx", "app/api/**/*.ts"],
      exclude: [
        "**/__tests__/**",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/node_modules/**",
        "**/.next/**",
        "**/db/migrations/**",
        "**/scripts/**",
        "**/instrumentation*.ts",
        "**/middleware.ts",
      ],
      // Thresholds fixados no patamar atual (14-10-2025) para evitar regressão.
      // Subir gradualmente conforme novos testes forem adicionados.
      thresholds: {
        statements: 14,
        branches: 61,
        functions: 37,
        lines: 14,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
