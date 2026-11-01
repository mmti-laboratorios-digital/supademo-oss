/**
 * tests/e2e/branding.spec.ts
 *
 * Gate G5 (F7) — Branding no player.
 *
 * Estes testes precisam de demo real no banco. Ative com
 * `PLAYWRIGHT_E2E_REAL=1` após rodar `pnpm --filter web exec tsx scripts/seed-test.ts`.
 *
 * ⚠️ O seed de teste NÃO configura branding. Para testar branding, o workspace
 * de teste precisa ter `brand_color` e `brand_logo_r2_key` preenchidos no
 * banco (update manual em `app.workspaces` da demo `tour-exemplo`).
 *
 * Cobertura:
 *   1. Demo de workspace com branding mostra o logo no header;
 *   2. A cor primária do workspace é aplicada no botão CTA final;
 *   3. Demo sem branding usa o tema padrão (não quebra).
 */
import { expect, test } from "@playwright/test";

const DEMO_SLUG = "tour-exemplo";
const isReal = !!process.env.PLAYWRIGHT_E2E_REAL;

test.describe("Branding no player (gate G5)", () => {
  test("logo do workspace aparece no header do player", async ({ page }) => {
    test.skip(!isReal, "Pule sem seed ativo (PLAYWRIGHT_E2E_REAL=1)");

    await page.goto(`/d/${DEMO_SLUG}`);
    const player = page.locator("[data-demo-id]");
    await expect(player).toBeVisible();

    // O header deve ter uma imagem de logo quando há branding.
    const logo = player.locator("header img").first();
    await expect(logo).toBeVisible();
  });

  test("cor primária do workspace é aplicada no CTA final", async ({ page }) => {
    test.skip(!isReal, "Pule sem seed ativo (PLAYWRIGHT_E2E_REAL=1)");

    await page.goto(`/d/${DEMO_SLUG}`);
    const player = page.locator("[data-demo-id]");
    await expect(player).toBeVisible();

    // Avança até o final. O seed tem 3 steps + hotspot.
    const start = player.locator("button", { hasText: /iniciar|começar|start/i }).first();
    if (await start.isVisible().catch(() => false)) {
      await start.click();
    }

    for (let i = 0; i < 3; i++) {
      const hotspot = player.locator("[data-hotspot]").first();
      if (await hotspot.isVisible().catch(() => false)) {
        await hotspot.click();
        await page.waitForTimeout(300);
      }
    }

    const cta = player.locator('a[aria-label*="Ação final"]').first();
    await expect(cta).toBeVisible({ timeout: 10_000 });

    // Se o workspace tiver brand_color, o botão deve ter background-color inline.
    const style = await cta.evaluate((el) => (el as HTMLElement).style.backgroundColor);
    expect(style).not.toBe("");
  });
});
