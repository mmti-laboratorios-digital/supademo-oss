/**
 * tests/e2e/signup.spec.ts
 *
 * Cobertura E2E do /sign-up.
 *
 * NOTA: O componente Clerk SignUp faz fetch para api.clerk.com.
 * Em ambiente isolado, o form pode não renderizar até JS do Clerk
 * carregar. Os testes abaixo verificam que a rota existe e responde.
 */
import { test, expect } from "@playwright/test";

test.describe("Sign-up page", () => {
  test("Vai para /sign-up e a página carrega", async ({ page }) => {
    await page.goto("/sign-up", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/sign-up/);
    // Body não-vazio
    const body = await page.locator("body").textContent();
    expect(body?.length ?? 0).toBeGreaterThan(0);
  });

  test("Acessar /sign-up não retorna 500", async ({ page }) => {
    const res = await page.goto("/sign-up", {
      waitUntil: "domcontentloaded",
    });
    const status = res?.status() ?? 0;
    expect(status).toBeLessThan(500);
    // Aceitamos 200 (componente Clerk) ou 400 (algum edge case)
    expect(status).toBeGreaterThanOrEqual(200);
  });
});