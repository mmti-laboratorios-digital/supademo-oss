/**
 * apps/web/lib/i18n/constants.ts
 *
 * Constantes puras — sem React, sem "use client".
 * Importável de middleware (edge runtime) e server components.
 */
export const SUPPORTED_LOCALES = ["pt-BR", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pt-BR";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function resolveLocale(input: string | null | undefined): Locale | null {
  if (!input) return null;
  for (const l of SUPPORTED_LOCALES) {
    if (l === input || l.toLowerCase() === input.toLowerCase()) return l;
  }
  return null;
}

/**
 * Parser simples de Accept-Language (RFC 7231 §5.3.5).
 * Retorna o primeiro locale suportado, ou DEFAULT_LOCALE.
 */
export function parseAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const parts = header.split(",").map((p) => p.trim().split(";")[0]);
  for (const part of parts) {
    const resolved = resolveLocale(part);
    if (resolved) return resolved;
  }
  return DEFAULT_LOCALE;
}
