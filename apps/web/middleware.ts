import {
  VISITOR_ID_HEADER,
  hashVisitorId,
  randomVisitorId,
  visitorCookieConfig,
} from "@/lib/analytics/visitor-id";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  type Locale,
  SUPPORTED_LOCALES,
  parseAcceptLanguage,
  resolveLocale,
} from "@/lib/i18n/constants";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/demos(.*)",
  "/billing(.*)",
  "/workspace(.*)",
  "/api/v1(.*)",
  "/onboarding(.*)",
]);

const isPublicApiRoute = createRouteMatcher([
  "/api/webhooks/(.*)",
  "/api/dsr(.*)",
  "/api/v1/upload/sign(.*)",
]);

/**
 * Rotas públicas do player — as que precisam do cookie de visitante.
 *
 * ⚠️ O cookie do visitante é criado **aqui** (middleware) e não na página:
 * `/d/[slug]` e `/embed/[id]` são Server Components, e Server Components
 * **não** podem escrever `Set-Cookie` (o Next lança "Cookies can only be
 * modified in a Server Action or Route Handler"). O middleware tem acesso à
 * resposta, então é o lugar certo.
 */
const isPlayerRoute = createRouteMatcher(["/d/(.*)", "/embed/(.*)"]);

/**
 * Detecta locale do usuário via:
 *   1. cookie NEXT_LOCALE (preferência explícita)
 *   2. path prefix /pt-BR ou /en (forçado)
 *   3. header Accept-Language (browser)
 *   4. DEFAULT_LOCALE ("pt-BR")
 *
 * Não reescreve rotas — apenas anexa `x-locale` em request headers para
 * que Server Components leiam via headers(). Rotas públicas `/d/[slug]`
 * continuam usando o locale do DB (idioma da demo).
 */
function detectLocale(req: NextRequest): Locale {
  // 1. cookie
  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale) {
    const resolved = resolveLocale(cookieLocale);
    if (resolved) return resolved;
  }

  // 2. path prefix (apenas em marketing/admin para evitar conflito com /d/[slug])
  const pathname = req.nextUrl.pathname;
  for (const loc of SUPPORTED_LOCALES) {
    if (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) {
      return loc;
    }
  }

  // 3. Accept-Language
  const accept = req.headers.get("accept-language");
  const parsed = parseAcceptLanguage(accept);
  if (parsed !== DEFAULT_LOCALE || accept) return parsed;

  // 4. fallback
  return DEFAULT_LOCALE;
}

export default clerkMiddleware(async (auth, req) => {
  // Webhooks + DSR + upload sign nunca exigem sessão (validados por HMAC/token)
  if (isPublicApiRoute(req)) return;

  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Injeta locale em request headers (lido em Server Components via headers()).
  const locale = detectLocale(req);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-locale", locale);

  // Garante cookie persistente para próximas visitas (best-effort).
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  if (!req.cookies.get(LOCALE_COOKIE)) {
    res.cookies.set({
      name: LOCALE_COOKIE,
      value: locale,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  // ─── Cookie de visitante (analytics) ───
  // Sem isso, cada view do player conta como um visitor diferente e o
  // funil de conversão fica quebrado (ver F5.1 do MVP-PLAN).
  //
  // ⚠️ **Por que injetar no request header (`x-visitor-id`)?**
  //
  // A página do player (`/d/[slug]`) é um Server Component: ela lê o
  // cookie via `headers()`. Mas na **primeira** visita o cookie ainda não
  // existe na requisição — ele está sendo criado agora, na resposta. Se a
  // página gerasse um hash novo, ela registraria o evento `view` com um
  // hash **diferente** do cookie que acabamos de gravar → o mesmo visitante
  // contaria como dois.
  //
  // Por isso o middleware injeta o hash no **request header**: a página lê
  // `x-visitor-id` (quando presente) e cai no cookie quando não está. Os
  // dois caminhos convergem para o mesmo valor.
  //
  // ⚠️ `sameSite=lax` (não `none`): o embed roda em iframe de outro
  // domínio, e `SameSite=None` exigiria `Secure` — que quebraria o dev em
  // HTTP. `lax` mantém o cookie no primeiro acesso (navegação) e evita o
  // vazamento em iframes de terceiros.
  if (isPlayerRoute(req)) {
    const cfg = visitorCookieConfig();
    const existing = req.cookies.get(cfg.name)?.value;
    let idHash = existing;

    if (!idHash) {
      // Gera o hash no Edge (Web Crypto) — o Node lê o mesmo formato.
      idHash = await hashVisitorId(randomVisitorId(), cfg.salt);
      res.cookies.set({
        name: cfg.name,
        value: idHash,
        path: "/",
        maxAge: cfg.ttlDays * 86400,
        sameSite: "lax",
        httpOnly: true,
        secure: cfg.secure,
      });
    }

    // Injeta no request header para a página ler o MESMO hash.
    const headersWithVisitor = new Headers(requestHeaders);
    headersWithVisitor.set(VISITOR_ID_HEADER, idHash);
    const res2 = NextResponse.next({ request: { headers: headersWithVisitor } });
    // Preserva os cookies já montados no `res` (locale + visitante).
    for (const cookie of res.cookies.getAll()) {
      res2.cookies.set(cookie);
    }
    return res2;
  }

  return res;
});

export const config = {
  matcher: [
    // Pula Next internals e arquivos estáticos
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Sempre roda para rotas de API/trpc
    "/(api|trpc)(.*)",
  ],
};
