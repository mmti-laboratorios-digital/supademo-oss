import { headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  resolveLocale,
  type Locale,
} from "@/lib/i18n";

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