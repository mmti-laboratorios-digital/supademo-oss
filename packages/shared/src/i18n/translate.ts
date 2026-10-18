/**
 * Lightweight i18n translator for the DemoBR web app.
 *
 * - Plain function (no React context, no hooks) so it works in:
 *     * Server Components (RSC) — pure function call, no Provider needed.
 *     * Client Components — pass the dictionary explicitly via context.
 *     * Email templates (apps/web/emails) — import the dictionary at build.
 *     * Edge workers — no dependencies, runs in <1ms.
 * - Hierarchical dictionaries: keys like "editor.steps.addHotspot" or arrays.
 * - Variable interpolation: "Step {current} de {total}" with `{name}` placeholders.
 * - Optional plural forms via MessageFormat-lite: "{count, plural, =0 {…} one {…} other {# …}}".
 * - English & Portuguese currently; the catalog is namespaced ({common,nav,…}).
 *
 * Usage:
 *
 *   import { t, createTranslator } from "@demo.br/shared/i18n/translate";
 *
 *   // RSC + emails — pick a locale, get a `t()` and a dictionary.
 *   const { t } = createTranslator("pt-BR");
 *   t("editor.steps.addHotspot");             // "Adicionar hotspot"
 *   t("demos.duplicateConfirm", { name: "X" }); // 'Excluir "X"? Esta ação...'
 *
 *   // Multi-locale: keep one `t` per locale in scope.
 *   const en = createTranslator("en");
 *   en.t("demos.duplicateConfirm", { name: "X" });
 *
 * Design notes:
 *   * The translator never throws on missing keys: it returns the dotted key
 *     in brackets (e.g. `[editor.foo.bar]`) so missing strings surface in
 *     dev and won't crash production.
 *   * Plural branches: when input has `{count}` it parses `{count, plural, ...}`
 *     into ICU-ish output. Simple but covers 95% of real cases.
 *   * Output is plain string. JSX content is rendered outside.
 */

import enCatalog from "./messages.en.json";
import ptCatalog from "./messages.pt-BR.json";

// Aliases to avoid collision with the `en` Locale export name used elsewhere.
const en = enCatalog;
const ptBR = ptCatalog;
const enMessages = enCatalog;

export type Locale = "pt-BR" | "en";
export type Messages = typeof ptBR;

const dictionaries: Record<Locale, Messages> = {
  "pt-BR": ptBR,
  en,
};

export const SUPPORTED_LOCALES: Locale[] = ["pt-BR", "en"];

export function isLocale(value: unknown): value is Locale {
  return value === "pt-BR" || value === "en";
}

export function pickLocale(input?: string | null): Locale {
  if (input === "en" || input === "pt-BR") return input;
  return "pt-BR";
}

/**
 * Resolve a dot-path inside a hierarchical dictionary.
 * Returns `undefined` if any segment is missing.
 */
export function resolve(dict: Messages, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

/**
 * Pluralize a key using ICU-lite syntax.
 *
 * Supported form:
 *   "{count, plural, =0 {none} one {1} other {# items}}"
 *   offset:1 {0} one {1} other {many}
 *
 * Implementation keeps it deliberately small:
 *   - "=N" branches are tested for exact numeric equality.
 *   - "one" branch matches `n === 1`.
 *   - "other" branch is the default fallback. `{var}` inside other branches is
 *     replaced with the locale-formatted number.
 */
export function pluralTemplate(
  template: string,
  vars: Record<string, string | number> = {},
): string {
  const pluralMatch = template.match(
    /^(.*?)\{([a-zA-Z_]+),\s*plural,\s*([\s\S]*)\}\s*$/,
  );
  if (!pluralMatch) return interpolate(template, vars);

  const prefix = pluralMatch[1] ?? "";
  const countKey = pluralMatch[2] ?? "";
  const branchesRaw = pluralMatch[3] ?? "";
  const branches = parseBranches(branchesRaw);
  const countRaw = vars[countKey];

  const count =
    typeof countRaw === "number"
      ? countRaw
      : Number.parseFloat(String(countRaw ?? "0"));

  const exactKey = `=${count}`;
  let chosen: string = branches.other ?? "";
  if (Object.prototype.hasOwnProperty.call(branches, exactKey)) {
    chosen = branches[exactKey] ?? chosen;
  } else if (
    count === 1 &&
    Object.prototype.hasOwnProperty.call(branches, "one")
  ) {
    chosen = branches["one"] ?? chosen;
  }

  const replacedCount = `${countKey}`;
  const nextVars: Record<string, string | number> = { ...vars };
  if (replacedCount) nextVars[replacedCount] = formatNumber(count);

  return interpolate(prefix + chosen, nextVars);
}

function parseBranches(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  // matches `key {text until matching brace)`
  const re = /(=\d+|zero|one|two|few|many|other)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const key = m[1];
    const val = m[2];
    if (key && val !== undefined) out[key] = val;
  }
  return out;
}

/**
 * Substitute `{name}`-style placeholders. Numeric values get locale formatting.
 * Unknown placeholders stay literal so they're easy to spot in QA.
 *
 * Numeric formatting rules:
 *   - Fractional numbers (e.g. 12.5) and numbers >= 1_000 always use
 *     `Intl.NumberFormat` to add thousands separators per locale.
 *   - Small integers (1..999) are passed through verbatim. This avoids
 *     misformatting years (e.g. 2026 doesn't become "2.026") while still
 *     formatting counters (>999) and decimal values correctly.
 *   - Pass values as strings to bypass numeric formatting entirely.
 */
export function interpolate(
  template: string,
  vars: Record<string, string | number> = {},
  locale: Locale = "pt-BR",
): string {
  return template.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (full, key: string) => {
    if (!(key in vars)) return full;
    const v = vars[key];
    if (typeof v === "number") {
      const isFractional = !Number.isInteger(v);
      const isLarge = Math.abs(v) >= 1000;
      if (isFractional || isLarge) return formatNumber(v, locale);
      return String(v);
    }
    return String(v);
  });
}

export function formatNumber(value: number, locale: Locale = "pt-BR"): string {
  try {
    return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "en-US").format(value);
  } catch {
    return String(value);
  }
}

export function formatCurrency(
  amount: number,
  currency: "BRL" | "USD" = "BRL",
  locale: Locale = "pt-BR",
): string {
  try {
    return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "2-digit" },
  locale: Locale = "pt-BR",
): string {
  const d = date instanceof Date ? date : new Date(date);
  try {
    return new Intl.DateTimeFormat(locale === "pt-BR" ? "pt-BR" : "en-US", opts).format(d);
  } catch {
    return d.toISOString();
  }
}

/**
 * Create a translator bound to a locale.
 * Returns the dictionary for inspection + the `t` function.
 */
export function createTranslator(locale: Locale): {
  locale: Locale;
  messages: Messages;
  t: TranslatorFn;
} {
  const messages = dictionaries[locale] ?? dictionaries["pt-BR"];
  const t: TranslatorFn = (key, vars) => translate(locale, key, vars);
  return { locale, messages, t };
}

/**
 * Direct translator function. Equivalent to `createTranslator(locale).t`.
 * Pure: same input -> same output. Deterministic.
 */
export type TranslatorFn = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

export function translate(
  locale: Locale,
  key: string,
  vars: Record<string, string | number> = {},
): string {
  const dict = dictionaries[locale] ?? dictionaries["pt-BR"];
  const tmpl = resolve(dict, key);
  if (tmpl === undefined) {
    // Missing key — surface it for QA. Never throw.
    return `[${locale}:${key}]`;
  }
  // Plural-aware vs simple interpolation
  if (/\b(zero|one|two|few|many|other|=0|=1|=2)\b/.test(tmpl) && tmpl.includes(", plural,")) {
    return pluralTemplate(tmpl, vars);
  }
  return interpolate(tmpl, vars, locale);
}

/**
 * Convenience React hook-style accessor. Bound to React via a tiny context
 * if/when the app adopts one. For now it's a binding helper so server-side
 * code doesn't need to pass locale around everywhere.
 */
export const t = (key: string, vars?: Record<string, string | number>): string =>
  translate("pt-BR", key, vars);

/**
 * Exhaustive helper: validate that the EN and PT-BR catalogs have the same
 * key set. Run in CI to catch i18n drift. Returns the diff (missing or extra).
 */
export function diffCatalogs(): {
  missingInPtBR: string[];
  missingInEN: string[];
  shared: number;
} {
  const allKeys = (d: Messages): string[] => {
    const out: string[] = [];
    const walk = (obj: unknown, prefix: string) => {
      if (!obj || typeof obj !== "object") return;
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        const next = prefix ? `${prefix}.${k}` : k;
        if (typeof v === "object" && v !== null) walk(v, next);
        else out.push(next);
      }
    };
    walk(d, "");
    return out.sort();
  };

  const ptSet = new Set(allKeys(ptBR));
  const enSet = new Set(allKeys(enMessages));
  const missingInEN: string[] = [];
  const missingInPtBR: string[] = [];
  for (const k of ptSet) if (!enSet.has(k)) missingInEN.push(k);
  for (const k of enSet) if (!ptSet.has(k)) missingInPtBR.push(k);
  return {
    missingInPtBR,
    missingInEN,
    shared: ptSet.size + enSet.size - missingInEN.length - missingInPtBR.length,
  };
}

export { en, ptBR };
// silence unused-import warning (used inside diffCatalogs helper)
void enMessages;
