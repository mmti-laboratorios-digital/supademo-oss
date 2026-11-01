/**
 * tests/e2e/legal-pages.spec.ts
 *
 * F9.6 — a Chrome Web Store exige que a política de privacidade esteja
 * acessível **sem login** e retorne HTTP 200. Se qualquer uma dessas rotas
 * quebrar, a extensão é rejeitada na revisão.
 *
 * ⚠️ **Por que os testes são condicionais:**
 *
 * O Clerk **valida a publishableKey no módulo** e derruba o dev server com
 * uma chave placeholder. E uma chave de desenvolvimento (qualquer `pk_test_`
 * de uma instância `*.accounts.dev`) faz o Clerk JS redirecionar o browser
 * para o **handshake de dev-browser** em `http://localhost` — é o
 * comportamento documentado das instâncias de desenvolvimento do Clerk, não um
 * bug do app. Resultado: o Playwright segue o redirect e recebe 404 do Clerk
 * em vez do conteúdo da página.
 *
 * Ou seja: **sem uma chave real do Clerk não há E2E de browser possível** —
 * o mesmo bloqueio de F10.1 na CI. Por isso:
 *
 * - `PLAYWRIGHT_E2E_REAL=1` (com chave real no ambiente) → roda.
 * - sem a env var → **skipa**.
 *
 * A validação que **foi** feita e é determinística:
 * - `apps/web/app/(marketing)/content/legalLoader.ts` lê `legal/*.md`.
 * - As 4 rotas respondem 200 via request de servidor (curl), inclusive
 *   dentro do container de produção (`docker build` + `docker run`).
 * - O `Dockerfile` copia `legal/` para a imagem final (o standalone do Next
 *   não inclui arquivos fora de `apps/web`).
 */
import { expect, test } from "@playwright/test";

const E2E_ENABLED = !!process.env.PLAYWRIGHT_E2E_REAL;

const PUBLIC_LEGAL_ROUTES = [
  { path: "/privacidade", expect: /pol.tica de privacidade/i },
  { path: "/termos", expect: /termos/i },
  { path: "/cookies", expect: /cookies/i },
  { path: "/suporte", expect: /suporte/i },
];

test.describe("Páginas públicas de compliance", () => {
  test.beforeEach(({ skip }) => {
    if (!E2E_ENABLED) {
      skip("Pule sem chave real do Clerk (PLAYWRIGHT_E2E_REAL=1 + chaves de dev válidas)");
    }
  });

  for (const route of PUBLIC_LEGAL_ROUTES) {
    test(`${route.path} responde 200 sem login e renderiza conteúdo`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      expect(response?.status() ?? 0).toBe(200);

      const body = await page.locator("body").textContent();
      expect(body ?? "").toMatch(route.expect);
    });
  }

  test("/privacidade não exige login e não redireciona para /sign-in", async ({ page }) => {
    const response = await page.goto("/privacidade", { waitUntil: "domcontentloaded" });
    expect(response?.status() ?? 0).toBe(200);
    expect(page.url()).not.toMatch(/sign-in|sign-up/);
  });

  test("/privacidade renderiza as seções obrigatórias da LGPD", async ({ page }) => {
    await page.goto("/privacidade");
    const body = (await page.locator("body").textContent()) ?? "";

    // Seções que a ANPD e a CWS esperam encontrar.
    expect(body).toMatch(/dados pessoais/i);
    expect(body).toMatch(/base legal/i);
    expect(body).toMatch(/direitos do titular/i);
    expect(body).toMatch(/reten..o/i);
    expect(body).toMatch(/subprocessador/i);
  });

  test("as páginas legais estão linkadas entre si (navegação por rodapé)", async ({ page }) => {
    await page.goto("/privacidade");
    const footer = page.locator("footer");
    await expect(footer.locator('a[href="/termos"]')).toBeVisible();
    await expect(footer.locator('a[href="/cookies"]')).toBeVisible();
    await expect(footer.locator('a[href="/suporte"]')).toBeVisible();
  });
});
