import { createHash, randomBytes } from "node:crypto";
import { env } from "../env";
import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

/**
 * Identifica o visitante via cookie first-party `_pk_id` (30d).
 *
 * LGPD-safe:
 * - ID é random + hasheado com PII_HASH_SALT (rotativo mensal)
 * - NÃO usamos IP
 * - País derivado do Accept-Language apenas (não geolocation)
 */

const COOKIE_NAME_DEFAULT = "_pk_id";

export type VisitorContext = {
  idHash: string;
  deviceClass: "mobile" | "tablet" | "desktop";
  countryCode: string | null;
  referrerHost: string | null;
};

export async function analyticsVisitorCookie(
  headers: ReadonlyHeaders,
): Promise<VisitorContext> {
  const e = env();
  const cookieName = e.VISITOR_COOKIE_NAME ?? COOKIE_NAME_DEFAULT;

  const cookieHeader = headers.get("cookie") ?? "";
  const existing = parseCookie(cookieHeader, cookieName);
  const ua = headers.get("user-agent") ?? "";
  const al = headers.get("accept-language") ?? "";
  const ref = headers.get("referer") ?? "";

  const idHash = existing
    ? existing
    : hashVisitorId(randomBytes(16).toString("hex"), e.PII_HASH_SALT);

  return {
    idHash,
    deviceClass: detectDevice(ua),
    countryCode: countryFromAcceptLanguage(al),
    referrerHost: ref ? new URL(ref).host : null,
  };
}

/**
 * Helper que define o cookie. Use em Next.js Route Handlers ou Server Actions.
 */
export function buildVisitorCookieHeader(idHash: string): string {
  const e = env();
  const days = e.VISITOR_COOKIE_TTL_DAYS ?? 30;
  const expires = new Date(Date.now() + days * 86400_000).toUTCString();
  const name = e.VISITOR_COOKIE_NAME ?? COOKIE_NAME_DEFAULT;
  return `${name}=${idHash}; Path=/; Expires=${expires}; SameSite=Lax; Secure; HttpOnly`;
}

function parseCookie(cookieHeader: string, name: string): string | null {
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const p of parts) {
    const [k, ...v] = p.split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

function hashVisitorId(id: string, salt: string | undefined): string {
  return createHash("sha256")
    .update(`${salt ?? ""}:${id}`)
    .digest("hex")
    .slice(0, 32);
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