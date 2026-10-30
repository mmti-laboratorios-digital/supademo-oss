"use client";

import { messagesEn, messagesPtBR } from "@easydemo/shared";
import * as React from "react";

import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale } from "./constants";

export {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  resolveLocale,
  parseAcceptLanguage,
} from "./constants";
export type { Locale } from "./constants";

import type { Locale } from "./constants";

/**
 * Tree de mensagens — type loosely typed (string keys joined by ".").
 * Cada folha é uma string possivelmente com placeholders {varName}.
 */
export type Messages = typeof messagesPtBR;

const PT_BR: Messages = messagesPtBR as Messages;
const EN: Messages = messagesEn as Messages;

function getMessagesFor(locale: Locale): Messages {
  return locale === "en" ? EN : PT_BR;
}

/**
 * Resolve locale a partir de cookie / navigator / default.
 */
function detectLocaleClient(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const cookie = document.cookie
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${LOCALE_COOKIE}=`));
  if (cookie) {
    const value = cookie.split("=")[1];
    const resolved = resolveLocale(value);
    if (resolved) return resolved;
  }
  const nav = typeof navigator !== "undefined" ? navigator.language : null;
  return nav && (resolveLocale(nav) ?? resolveLocale(nav.split("-")[0]))
    ? (resolveLocale(nav) ?? (resolveLocale(nav.split("-")[0]) as Locale))
    : DEFAULT_LOCALE;
}

export type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  setLocale: (next: Locale) => void;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale ?? DEFAULT_LOCALE);

  React.useEffect(() => {
    if (initialLocale) {
      // Respeita a escolha explícita (ex.: EditorI18n).
      return;
    }
    const detected = detectLocaleClient();
    setLocaleState(detected);
  }, [initialLocale]);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof document !== "undefined") {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }
  }, []);

  const value = React.useMemo<I18nContextValue>(
    () => ({ locale, messages: getMessagesFor(locale), setLocale }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      messages: getMessagesFor(DEFAULT_LOCALE),
      setLocale: () => {},
    };
  }
  return ctx;
}

/**
 * Hook para acessar mensagens traduzidas com fallback.
 */
export function useT() {
  const { messages } = useI18n();
  return React.useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const parts = key.split(".");
      let cur: unknown = messages;
      for (const p of parts) {
        if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
          cur = (cur as Record<string, unknown>)[p];
        } else {
          return key;
        }
      }
      if (typeof cur !== "string") return key;
      if (!vars) return cur;
      return cur.replace(/\{(\w+)\}/g, (_m, name) =>
        name in vars ? String(vars[name]) : `{${name}}`,
      );
    },
    [messages],
  );
}

/**
 * Alias semântico de `useT`. Mantido para compatibilidade com componentes
 * do projeto que adotam o nome `useTranslate` (mais i18n-library-ish).
 */
export const useTranslate = useT;
