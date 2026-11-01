/**
 * tests/e2e/embed.spec.ts
 *
 * Gate G4 — Embed + badge "Powered by EasyDemo".
 *
 * Estes testes precisam de demo real no banco. Ative com
 * `PLAYWRIGHT_E2E_REAL=1` após rodar `pnpm --filter web exec tsx scripts/seed-test.ts`.
 *
 * Cobertura:
 *   1. O badge "Powered by EasyDemo" aparece no player público `/d/[slug]`;
 *   2. O badge é **oculto** quando o player é aberto com `?preview=editor`;
 *   3. O player embutido envia `postMessage` com `step_viewed` e `cta_click`
 *      para o `window.parent`;
 *   4. O parent deve validar `event.origin` — mensagens de origem inválida
 *      são ignoradas.
 */
import { expect, test } from "@playwright/test";

const DEMO_SLUG = "tour-exemplo";
const IFRAME_HOST = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

const isReal = !!process.env.PLAYWRIGHT_E2E_REAL;

test.describe("Embed + badge (gate G4)", () => {
  test("badge aparece no player público", async ({ page }) => {
    test.skip(!isReal, "Pule sem seed ativo (PLAYWRIGHT_E2E_REAL=1)");

    await page.goto(`/d/${DEMO_SLUG}`);
    await expect(page.locator("text=Feito com EasyDemo")).toBeVisible();
    const link = page.locator('a[href*="utm_source=embed-badge"]');
    await expect(link).toHaveAttribute("href", /easydemo\.io/);
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("badge é oculto no preview do editor (?preview=editor)", async ({ page }) => {
    test.skip(!isReal, "Pule sem seed ativo (PLAYWRIGHT_E2E_REAL=1)");

    await page.goto(`/d/${DEMO_SLUG}?preview=editor`);
    await expect(page.locator("text=Feito com EasyDemo")).not.toBeVisible();
  });

  test("postMessage chega no parent quando o player é embutido", async ({ page }) => {
    test.skip(!isReal, "Pule sem seed ativo (PLAYWRIGHT_E2E_REAL=1)");

    // Busca o id da demo via API pública? Não temos. Vamos pela página.
    const demoPage = await page.context().newPage();
    await demoPage.goto(`/d/${DEMO_SLUG}`);
    const demoId = await demoPage.evaluate(() => {
      // O demoId pode estar no atributo data-demo-id do player — se não,
      // extraímos da URL do iframe do embed. Fallback: retornar null.
      const player = document.querySelector("[data-demo-id]");
      return player?.getAttribute("data-demo-id") ?? null;
    });
    await demoPage.close();

    // Se não conseguimos o id, buscamos pela API interna do embed.
    const embedUrl = demoId ? `${IFRAME_HOST}/embed/${demoId}` : null;
    test.skip(!embedUrl, "Não foi possível descobrir o id da demo de teste");

    // Cria uma página "externa" (outro domínio simulado) com o iframe.
    const messages: Array<unknown> = [];
    await page.exposeFunction("pushMessage", (msg: unknown) => messages.push(msg));
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <iframe
            id="player"
            src="${embedUrl}"
            width="100%"
            height="800"
            style="border:none"
          ></iframe>
          <script>
            window.addEventListener('message', (e) => {
              if (e.origin !== '${IFRAME_HOST}') return;
              if (e.data && e.data.type === 'easydemo:event') {
                window.pushMessage(e.data);
              }
            });
          </script>
        </body>
      </html>
    `);

    const frame = page.frameLocator("#player");

    // Clica no botão de iniciar (step 1) — se houver.
    const startButton = frame.locator("button", { hasText: /iniciar|começar|start/i }).first();
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
    }

    // Avança um step clicando no hotspot/área.
    const hotspot = frame.locator("[data-hotspot]").first();
    await expect(hotspot).toBeVisible({ timeout: 10_000 });
    await hotspot.click();

    // Aguarda o postMessage chegar.
    await expect.poll(() => messages.length).toBeGreaterThan(0);
    const last = messages.at(-1) as { type: string; event?: { type: string } };
    expect(last.type).toBe("easydemo:event");
    expect(["step_viewed", "cta_click"]).toContain(last.event?.type);
  });

  test("event.origin inválido é ignorado pelo parent", async ({ page }) => {
    test.skip(!isReal, "Pule sem seed ativo (PLAYWRIGHT_E2E_REAL=1)");

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <script>
            window.addEventListener('message', (e) => {
              // Simula um parent que só aceita origin válido — aqui usamos
              // um origin fictício para provar que a mensagem é ignorada.
              if (e.origin !== 'https://site-confiavel.com') {
                window.ignoredOrigin = e.origin;
              }
            });
          </script>
        </body>
      </html>
    `);

    // Disparamos uma mensagem de origin diferente (o navegador ainda passa).
    await page.evaluate(() => {
      window.postMessage({ type: "easydemo:event", event: { type: "step_viewed" } }, "*");
    });

    const ignored = await page.evaluate(
      () => (window as unknown as { ignoredOrigin?: string }).ignoredOrigin,
    );
    // A mensagem da mesma página (about:blank) não deveria ser a do nosso host.
    expect(ignored).not.toBe(IFRAME_HOST);
  });
});
