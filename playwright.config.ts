/**
 * playwright.config.ts
 *
 * Configuração raiz do Playwright — os testes E2E vivem em tests/e2e.
 * Usa pnpm dev para subir o Next.js e webServer aguarda readiness em :3000.
 *
 * NOTA: testes E2E aqui são focados nas páginas públicas (marketing, demo,
 * sign-up form). Tudo que depende de Clerk auth é SKIPPED em CI local —
 * visto que Clerk requer publishable key válida.
 */
import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // determinismo — alguns testes dependem de fixtures
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // serializa para evitar race em shared DB
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "pnpm --filter web dev",
    url: BASE_URL,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: "test",
      APP_BASE_URL: BASE_URL,
      PLAYER_BASE_URL: BASE_URL,
      MARKETING_BASE_URL: BASE_URL,
      // F10: repassa as chaves do Clerk quando existirem no ambiente.
      //
      // ⚠️ **Não há fallback válido.** O Clerk valida a publishableKey no
      // módulo e derruba o servidor com um placeholder. E a chave sintática
      // (`pk_test_ZXhhbXBsZS5hY2NvdW50cy5kZXYk`, que aponta para
      // `example.accounts.dev`) faz o Clerk JS redirecionar o browser para o
      // **handshake de dev-browser** em qualquer `http://localhost` — é o
      // comportamento documentado das instâncias de desenvolvimento do Clerk
      // (ver `docs/MVP-PLAN.md` F10.1: bloqueado por dependência externa).
      //
      // Sem uma chave real de desenvolvimento, o E2E **não sobe** — a CI
      // mantém `continue-on-error: true` por isso.
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? "",
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        ignoreHTTPSErrors: true,
        launchOptions: {
          args: [
            "--disable-web-security",
            "--ignore-certificate-errors",
            "--allow-insecure-localhost",
            "--no-sandbox",
          ],
        },
      },
    },
  ],
});
