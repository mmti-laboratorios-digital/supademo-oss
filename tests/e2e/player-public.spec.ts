/**
 * tests/e2e/player-public.spec.ts
 *
 * Cobertura E2E do player público em /d/[slug].
 *
 * Para testes com demo real, execute seed-test antes e marque
 * PLAYWRIGHT_E2E_REAL=1.
 */
import { expect, test } from "@playwright/test";

test.describe("Player público", () => {
  test("Carrega /d/<slug-fictício> e resposta não-2xx", async ({ page }) => {
    // Sem seed ativo, esperamos erro (404 ou 400 do notFound())
    const response = await page.goto("/d/tour-exemplo-ficticio-e2e", {
      waitUntil: "domcontentloaded",
    });
    const status = response?.status() ?? 0;
    expect(status).toBeGreaterThanOrEqual(400);
  });

  test("Player markup completo em demo real (se seed estiver rodando)", async ({ page }) => {
    test.skip(
      !process.env.PLAYWRIGHT_E2E_REAL,
      "Pule este teste sem seed ativo (PLAYWRIGHT_E2E_REAL=1)",
    );
    await page.goto("/d/tour-exemplo");
    await expect(page.locator("body")).toBeVisible();
    // Player deve ter algum conteúdo (caption "Bem-vindo")
    const body = await page.locator("body").textContent();
    expect(body).toContain("Bem-vindo");
  });

  test("Página não-encontrada renderiza body não-vazio (Next.js notFound)", async ({
    page,
    request,
  }) => {
    // Faz request direto para evitar redirects e capturar status puro
    const resp = await request.get("/d/zzzzz-not-found-zzzzz");
    const status = resp.status();
    expect(status).toBeGreaterThanOrEqual(400);

    await page.goto("/d/zzzzz-not-found-zzzzz", {
      waitUntil: "domcontentloaded",
    });
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length ?? 0).toBeGreaterThan(0);
  });
});
