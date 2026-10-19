import { DEFAULT_LOCALE, type Locale, resolveLocale } from "@/lib/i18n";
import { headers } from "next/headers";

/**
 * Server-side: lê locale do header `x-locale` injetado pelo middleware.
 * Fallback: DEFAULT_LOCALE.
 *
 * Use em Server Components e Server Actions:
 *   const locale = await getServerLocale();
 */
export async function getServerLocale(): Promise<Locale> {
  const h = await headers();
  const raw = h.get("x-locale");
  return resolveLocale(raw) ?? DEFAULT_LOCALE;
}
