import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  SUPPORTED_LOCALES,
  parseAcceptLanguage,
  resolveLocale,
  type Locale,
} from "@/lib/i18n/constants";

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