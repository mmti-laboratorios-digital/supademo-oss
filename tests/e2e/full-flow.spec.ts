/**
 * tests/e2e/full-flow.spec.ts
 *
 * Gate G5/G6 (F10) — E2E do fluxo completo do creator ao viewer.
 *
 * Fluxo:
 *   1. Criar demo autenticada em `/demos/new`.
 *   2. Fazer upload manual de screenshot (F2).
 *   3. Publicar a demo.
 *   4. Abrir `/d/[slug]` em contexto anônimo (nova browserContext).
 *   5. Submeter lead no player (F3).
 *   6. Verificar lead em `/demos/{id}/leads` como creator.
 *
 * ⚠️ Este spec depende de chaves reais do Clerk (`pk_test_` / `sk_test_`) para
 * subir o dev server. Sem elas, o middleware do Clerk rejeita a key e o servidor
 * não inicia. Por isso os testes são **skipados por padrão** e só rodam quando
 * `PLAYWRIGHT_E2E_AUTH` estiver configurado.
 */
import { expect, test } from "@playwright/test";

const E2E_ENABLED = !!process.env.PLAYWRIGHT_E2E_AUTH;

test.describe("Fluxo completo creator → viewer (F10)", () => {
  test.beforeEach(({ skip }) => {
    if (!E2E_ENABLED) {
      skip(
        "Pule sem chaves reais do Clerk (PLAYWRIGHT_E2E_AUTH=1 + NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY válida)",
      );
    }
  });

  test("criar demo, publicar, abrir publicamente e capturar lead", async ({
    browser,
    page,
    request,
  }) => {
    // 1. Criar demo autenticada
    await page.goto("/demos/new");
    await expect(page).toHaveURL(/\/demos\/[a-f0-9-]+/, { timeout: 15_000 });

    const demoUrl = page.url();
    const demoId = demoUrl.split("/demos/")[1]?.split("/")[0];
    if (!demoId) throw new Error("demoId não encontrado na URL");

    // 2. Upload manual de screenshot (F2) — cria 1 step
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page
      .locator("button", { hasText: /Criar|Adicionar step/i })
      .first()
      .click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "step-1.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      ),
    });

    // Aguarda o step aparecer na lista
    await expect(page.locator("[data-step-id]").first()).toBeVisible({ timeout: 15_000 });

    // 3. Publicar
    await page.goto(`/demos/${demoId}/publish`);
    await page
      .locator("button", { hasText: /Publicar/i })
      .first()
      .click();
    await expect(page.locator("text=/publicado|Publicado/i").first()).toBeVisible({
      timeout: 15_000,
    });

    // Captura o slug publicado (está na URL ou no painel)
    const publishedSlug = await page
      .locator("[data-published-slug], a[href^='/d/']")
      .first()
      .getAttribute("href")
      .catch(() => null);
    const slug = publishedSlug?.replace("/d/", "") ?? demoId;

    // 4. Abrir demo publicada em contexto anônimo
    const viewerContext = await browser.newContext();
    const viewerPage = await viewerContext.newPage();
    await viewerPage.goto(`/d/${slug}`);
    await expect(viewerPage.locator("[data-demo-id]")).toBeVisible({ timeout: 15_000 });

    // 5. Submeter lead (F3)
    const leadEmail = `e2e-${Date.now()}@example.com`;
    await viewerPage.locator("input[name='email']").fill(leadEmail);
    await viewerPage.locator("input[name='name']").fill("E2E Lead");
    await viewerPage.locator("input[type='checkbox']").first().check();
    await viewerPage
      .locator("button", { hasText: /Continuar|Enviar/i })
      .first()
      .click();

    // Avança pelo hotspot para concluir
    const hotspot = viewerPage.locator("[data-hotspot]").first();
    if (await hotspot.isVisible().catch(() => false)) {
      await hotspot.click();
    }

    await viewerContext.close();

    // 6. Verificar lead na lista de leads
    await page.goto(`/demos/${demoId}/leads`);
    await expect(page.locator("text=" + leadEmail)).toBeVisible({ timeout: 15_000 });
  });

  test("fluxo publicado retorna 404 para demo inexistente", async ({ page }) => {
    const res = await page.goto("/d/slug-que-nao-existe-e2e");
    expect(res?.status() ?? 0).toBeGreaterThanOrEqual(400);
  });
});
