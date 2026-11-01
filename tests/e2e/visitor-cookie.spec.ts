/**
 * tests/e2e/visitor-cookie.spec.ts
 *
 * Gate G5 — "duas views do mesmo navegador = 1 visitor".
 *
 * ⚠️ **Por que este teste é E2E e não de integração:** o cookie do visitante
 * é criado pelo **middleware** do Next (Edge runtime). Não dá para testar
 * isso importando a função — o middleware só roda dentro do servidor. Este
 * teste sobe o app (o `webServer` do `playwright.config.ts`) e faz requests
 * HTTP de verdade.
 *
 * O que ele cobre:
 *   1. a 1ª visita numa rota do player **recebe** o cookie `_pk_id`;
 *   2. o cookie tem os atributos certos (httpOnly, SameSite=Lax, path=/);
 *   3. a 2ª visita **reusa** o mesmo cookie (mesmo visitor);
 *   4. duas requests sem cookie entre si são visitors **diferentes**.
 */
import { expect, test } from "@playwright/test";

const VISITOR_COOKIE = "_pk_id";

/** Uma rota do player — o middleware cria o cookie nela. */
const PLAYER_PATH = "/d/tour-exemplo-ficticio-para-cookie";

/**
 * Extrai o header `Set-Cookie` do visitante da resposta.
 *
 * ⚠️ O Playwright devolve `headersArray()` com `{ name, value }` — o `name`
 * é o **nome do header** (`set-cookie`) e o `value` é o cookie completo.
 * Filtrar por `h.name === "set-cookie"` (e não por "o value contém
 * `_pk_id=`") é o que separa o cookie do visitante do `NEXT_LOCALE`.
 */
function visitorCookieHeader(response: {
  headersArray(): Array<{ name: string; value: string }>;
}): { name: string; value: string } | undefined {
  return response
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .find((h) => h.value.startsWith(`${VISITOR_COOKIE}=`));
}

/** Valor (hash) do cookie do visitante. */
function visitorValue(header: { value: string }): string {
  return header.value.split(`${VISITOR_COOKIE}=`)[1]?.split(";")[0] ?? "";
}

test.describe("Cookie de visitante (analytics)", () => {
  test("a 1ª visita recebe o cookie _pk_id", async ({ request }) => {
    const response = await request.get(PLAYER_PATH, {
      // Sem `failOnStatusCode` — a demo pode não existir (404), mas o
      // middleware **já** rodou e criou o cookie.
      failOnStatusCode: false,
    });

    const visitorHeader = visitorCookieHeader(response);
    expect(
      visitorHeader,
      "o middleware deveria gravar o cookie _pk_id nas rotas do player",
    ).toBeTruthy();
    expect(visitorValue(visitorHeader!)).toMatch(/^[a-f0-9]{32}$/);
  });

  test("o cookie tem httpOnly, SameSite=Lax e path=/", async ({ request }) => {
    const response = await request.get(PLAYER_PATH, { failOnStatusCode: false });
    const visitorHeader = visitorCookieHeader(response);

    expect(visitorHeader).toBeTruthy();
    const raw = visitorHeader!.value;
    expect(raw).toMatch(/HttpOnly/i);
    expect(raw).toMatch(/SameSite=Lax/i);
    expect(raw).toMatch(/Path=\//i);
    // ⚠️ `secure` NÃO deve aparecer em dev (o app roda em HTTP — o browser
    // descartaria o cookie e todo visitor viraria "novo").
    expect(raw).not.toMatch(/;\s*Secure/i);
  });

  test("a 2ª visita reusa o mesmo cookie (mesmo visitor)", async ({ request }) => {
    // 1ª visita — cria o cookie.
    const first = await request.get(PLAYER_PATH, { failOnStatusCode: false });
    const firstHeader = visitorCookieHeader(first);
    expect(firstHeader).toBeTruthy();
    const firstValue = visitorValue(firstHeader!);

    // 2ª visita — envia o cookie; o middleware NÃO deve criar outro.
    const second = await request.get(PLAYER_PATH, {
      failOnStatusCode: false,
      headers: { cookie: `${VISITOR_COOKIE}=${firstValue}` },
    });
    const secondHeader = visitorCookieHeader(second);

    // Sem cookie novo (ou, se reenviado, o **mesmo** valor).
    if (secondHeader) {
      expect(visitorValue(secondHeader)).toBe(firstValue);
    }
  });

  test("visitas sem cookie entre si são visitors diferentes", async ({ request, playwright }) => {
    // ⚠️ O `request` do Playwright **persiste cookies entre requests** (é
    // um `APIRequestContext` com cookie jar). Para simular dois
    // navegadores diferentes, criamos contexts isolados via
    // `playwright.request.newContext()` — cada um com o seu cookie jar
    // (e, aqui, vazio).
    const ctxA = await playwright.request.newContext();
    const ctxB = await playwright.request.newContext();

    const resA = await ctxA.get(PLAYER_PATH, { failOnStatusCode: false });
    const resB = await ctxB.get(PLAYER_PATH, { failOnStatusCode: false });

    const valueA = visitorValue(visitorCookieHeader(resA)!);
    const valueB = visitorValue(visitorCookieHeader(resB)!);

    expect(valueA).toMatch(/^[a-f0-9]{32}$/);
    expect(valueB).toMatch(/^[a-f0-9]{32}$/);
    // Navegadores diferentes → hashes diferentes.
    expect(valueA).not.toBe(valueB);

    await ctxA.dispose();
    await ctxB.dispose();
  });
});
