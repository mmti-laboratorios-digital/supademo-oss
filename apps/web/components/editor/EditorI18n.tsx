"use client";

import { I18nProvider, type Locale, SUPPORTED_LOCALES } from "@/lib/i18n";
import type * as React from "react";

/**
 * Wrap do editor com I18nProvider.
 *
 * Aceita o locale do workspace/demo via prop e expõe-o via `useT()` para
 * todos os sub-componentes do editor. Se locale for inválido, cai no default.
 */
export type EditorI18nProps = {
  locale?: string | null;
  children: React.ReactNode;
};

function normalizeLocale(raw: string | null | undefined): Locale | undefined {
  if (!raw) return undefined;
  for (const supported of SUPPORTED_LOCALES) {
    if (raw.toLowerCase().startsWith(supported.toLowerCase().slice(0, 2))) {
      return supported;
    }
  }
  return undefined;
}

export function EditorI18n({ locale, children }: EditorI18nProps): React.ReactElement {
  const initial = normalizeLocale(locale);
  return <I18nProvider initialLocale={initial}>{children}</I18nProvider>;
}
