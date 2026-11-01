import { createHash, randomBytes } from "node:crypto";
import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import { env } from "../env";
import { VISITOR_ID_HEADER, visitorHashInput } from "./visitor-id";

/**
 * Identifica o visitante via cookie first-party `_pk_id` (30d).
 *
 * LGPD-safe:
 * - ID é random + hasheado com PII_HASH_SALT (rotativo mensal)
 * - NÃO usamos IP
 * - País derivado do Accept-Language apenas (não geolocation)
 *
 * ⚠️ **O cookie é gravado pelo middleware** (`apps/web/middleware.ts`), porque
 * a página do player é um Server Component e Server Components não podem
 * escrever `Set-Cookie`. Aqui só **lemos** o cookie.
 *
 * ⚠️ **Este módulo roda no Node** (Route Handlers e Server Actions). A
 * versão Edge-safe (para o middleware) está em `./visitor-id.ts` — as duas
 * precisam gerar o **mesmo** hash, senão o mesmo visitante contaria como
 * dois. Ver `lib/__tests__/visitor-id.test.ts`.
 */

const COOKIE_NAME_DEFAULT = "_pk_id";

export type VisitorContext = {
  idHash: string;
  deviceClass: "mobile" | "tablet" | "desktop";
  countryCode: string | null;
  referrerHost: string | null;
};

export async function analyticsVisitorCookie(headers: ReadonlyHeaders): Promise<VisitorContext> {
  const e = env();
  const cookieName = e.VISITOR_COOKIE_NAME ?? COOKIE_NAME_DEFAULT;

  const cookieHeader = headers.get("cookie") ?? "";
  const existing = parseCookie(cookieHeader, cookieName);
  const ua = headers.get("user-agent") ?? "";
  const al = headers.get("accept-language") ?? "";
  const ref = headers.get("referer") ?? "";

  // ⚠️ **Prioridade: header injetado > cookie.**
  //
  // O middleware cria o cookie na **primeira** visita e injeta o hash no
  // request header (`x-visitor-id`). Se a página usasse o cookie, ele ainda
  // não existiria na requisição — e ela geraria um hash diferente, contando
  // o mesmo visitante como dois. O header garante que a página e o cookie
  // usem o **mesmo** valor.
  const injected = headers.get(VISITOR_ID_HEADER);

  const idHash =
    injected || existing || hashVisitorId(randomBytes(16).toString("hex"), e.PII_HASH_SALT);

  return {
    idHash,
    deviceClass: detectDevice(ua),
    countryCode: countryFromAcceptLanguage(al),
    referrerHost: ref ? safeHost(ref) : null,
  };
}

/**
 * Grava o cookie de visitante.
 *
 * ⚠️ **Onde pode ser chamado:**
 * - **Route Handlers** e **Server Actions** — sim (`cookies().set()` funciona);
 * - **Server Components** (render) — **NÃO**. O Next lança
 *   "Cookies can only be modified in a Server Action or Route Handler".
 *   Por isso a página do player (`/d/[slug]`, `/embed/[id]`) **não** chama
 *   esta função: quem grava o cookie é o middleware.
 *
 * O cookie é `httpOnly` (o JS da página não precisa dele — e não deve poder
 * ler), `sameSite=lax` (não vaza em iframes de terceiros, o que quebraria o
 * embed) e `secure` só em produção (em dev, o app roda em HTTP).
 *
 * @param idHash o hash do visitante. Se omitido, um novo é gerado.
 * @returns o hash gravado — o caller precisa usá-lo no mesmo request.
 */
export async function setVisitorCookie(
  idHash?: string,
): Promise<{ idHash: string; name: string; value: string; maxAge: number }> {
  const e = env();
  const name = e.VISITOR_COOKIE_NAME ?? COOKIE_NAME_DEFAULT;
  const value = idHash ?? hashVisitorId(randomBytes(16).toString("hex"), e.PII_HASH_SALT);
  const maxAge = e.VISITOR_COOKIE_TTL_DAYS ?? 30;

  const { cookies } = await import("next/headers");
  const store = await cookies();
  store.set({
    name,
    value,
    path: "/",
    maxAge: maxAge * 86400,
    sameSite: "lax",
    httpOnly: true,
    secure: e.NODE_ENV === "production",
  });

  return { idHash: value, name, value, maxAge };
}

/**
 * Helper que define o cookie como string `Set-Cookie`.
 *
 * Use em Route Handlers que montam a resposta manualmente. ⚠️ `Secure` só
 * em produção — em dev o app roda em HTTP e o browser **descarta** o
 * cookie, o que faria cada view contar como um visitor novo.
 */
export function buildVisitorCookieHeader(idHash: string): string {
  const e = env();
  const days = e.VISITOR_COOKIE_TTL_DAYS ?? 30;
  const expires = new Date(Date.now() + days * 86400_000).toUTCString();
  const name = e.VISITOR_COOKIE_NAME ?? COOKIE_NAME_DEFAULT;
  const secure = e.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${idHash}; Path=/; Expires=${expires}; SameSite=Lax${secure}; HttpOnly`;
}

function parseCookie(cookieHeader: string, name: string): string | null {
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const p of parts) {
    const [k, ...v] = p.split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

/**
 * Hash (sincrono, Node) do id do visitante.
 *
 * ⚠️ Usa o **mesmo** formato de input que a versão Edge
 * (`visitor-id.ts` → `visitorHashInput`). Os dois precisam gerar o mesmo
 * hash — o Edge grava o cookie, o Node lê.
 */
function hashVisitorId(id: string, salt: string | undefined): string {
  return createHash("sha256").update(visitorHashInput(id, salt)).digest("hex").slice(0, 32);
}

/**
 * Host do referer — sem `new URL()` explodindo em referer malformado.
 *
 * O `new URL(ref)` original estourava com `TypeError: Invalid URL` quando o
 * navegador mandava um referer relativo ou lixo. Isso quebrava o render do
 * player inteiro (o erro vinha dentro do `try` do `analyticsVisitorCookie`).
 */
function safeHost(ref: string): string | null {
  try {
    return new URL(ref).host;
  } catch {
    return null;
  }
}

function detectDevice(ua: string): "mobile" | "tablet" | "desktop" {
  const u = ua.toLowerCase();
  if (/tablet|ipad/.test(u)) return "tablet";
  if (/mobi|android.*mobile|iphone/.test(u)) return "mobile";
  return "desktop";
}

function countryFromAcceptLanguage(al: string): string | null {
  // Formato: "pt-BR,pt;q=0.9,en;q=0.8" → pegar primeiro "-XX"
  const first = al.split(",")[0]?.trim();
  if (!first) return null;
  const m = first.match(/-([A-Za-z]{2})\b/);
  return m && m[1] ? m[1].toUpperCase() : null;
}
