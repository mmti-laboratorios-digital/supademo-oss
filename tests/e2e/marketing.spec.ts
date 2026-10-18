/**
 * tests/e2e/marketing.spec.ts
 *
 * Cobertura E2E das páginas de marketing.
 * Assume pnpm dev rodando em :3000.
 */
import { test, expect } from "@playwright/test";

test.describe("Marketing pages", () => {
  test("Carrega / e tem CTA para /sign-up ou /pricing", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Body renderiza (o CTA pode ser button ou link)
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(100);
    // Procura qualquer link com texto relacionado
    const linkToSignUp = await page
      .getByRole("link", { name: /sign[- ]?up|come[çc]ar|criar conta/i })
      .first()
      .isVisible()
      .catch(() => false);
    const linkToPricing = await page
      .getByRole("link", { name: /pricing|planos|ver planos/i })
      .first()
      .isVisible()
      .catch(() => false);
    expect(linkToSignUp || linkToPricing).toBe(true);
  });

  test("Carrega /pricing e vê 3 tiers (Free, Pro, Business)", async ({
    page,
  }) => {
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
    // Verifica que os 3 tiers aparecem (qualquer elemento, não só heading)
    expect(body!.toLowerCase()).toContain("free");
    expect(body!.toLowerCase()).toContain("pro");
    expect(body!.toLowerCase()).toContain("business");
  });

  test("Carrega /d/inexistente — não é 200 (pode ser 400/404)", async ({
    page,
  }) => {
    const response = await page.goto("/d/esse-slug-nao-existe-de-jeito-nenhum", {
      waitUntil: "domcontentloaded",
    });
    // Next.js pages dinâmicas com erro podem retornar 400 (bad request do notFound).
    // Aceitamos qualquer resposta >= 400 que NÃO seja 200/2xx.
    const status = response?.status() ?? 0;
    expect(status).toBeGreaterThanOrEqual(400);
  });
});