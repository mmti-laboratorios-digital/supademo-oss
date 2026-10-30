import { translate } from "@easydemo/shared/i18n/translate";
import { Container, Heading, Hr, Link, Section, Tailwind, Text } from "@react-email/components";
import type * as React from "react";

/**
 * Shared email layout. Renders:
 *   - Logo "▶ DemoBR" header.
 *   - Children (the email body).
 *   - Footer with company info + preference/legal/help links (PT-BR).
 *
 * Uses @react-email/tailwind for utility classes (Inter as the system stack).
 *
 * `preheader` is invisible text shown in inbox previews — keep it under 90ch.
 *
 * Note: For emails that are NOT transactional (e.g., the newsletter),
 * include an unsubscribe link. We default the footer to include both:
 *   - Preferences (always present; transactional emails can link here)
 *   - Unsubscribe (only present for non-transactional, eg `kind: "newsletter"`)
 */
export type EmailLayoutProps = {
  preheader: string;
  locale?: "pt-BR" | "en";
  kind?: "transactional" | "newsletter";
  unsubscribeHref?: string;
  /** Optional custom footer text override (rare). */
  footerNote?: string;
  children: React.ReactNode;
};

export function EmailLayout({
  preheader,
  locale = "pt-BR",
  kind = "transactional",
  unsubscribeHref,
  footerNote,
  children,
}: EmailLayoutProps) {
  const t = (k: string, vars: Record<string, string | number> = {}) => translate(locale, k, vars);

  return (
    <Tailwind
      config={{
        theme: {
          extend: {
            fontFamily: {
              sans: [
                "Inter",
                "-apple-system",
                "BlinkMacSystemFont",
                "Segoe UI",
                "Roboto",
                "sans-serif",
              ],
            },
            colors: {
              brand: {
                primary: "#2B6CB0",
                secondary: "#38B2AC",
                accent: "#ED8936",
              },
              ink: {
                DEFAULT: "#1A202C",
                muted: "#2D3748",
                subtle: "#718096",
              },
              surface: {
                DEFAULT: "#FFFFFF",
                muted: "#F7FAFC",
                border: "#E2E8F0",
              },
            },
          },
        },
      }}
    >
      {/* Preheader — invisible preview text */}
      <div
        style={{
          display: "none",
          fontSize: "1px",
          lineHeight: "1px",
          maxHeight: "0",
          maxWidth: "0",
          opacity: 0,
          overflow: "hidden",
        }}
      >
        {preheader}
      </div>

      <Section className="bg-surface-muted">
        <Container className="mx-auto my-0 max-w-[600px] bg-surface px-8 py-10">
          {/* Brand header */}
          <Section className="mb-6 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              width="28"
              height="28"
              aria-label={t("emails.footerCompany")}
            >
              <rect width="32" height="32" rx="6" fill="#2B6CB0" />
              <path
                d="M11 8 L24 16 L11 24 Z"
                fill="#FFFFFF"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
            <Heading
              as="h1"
              className="m-0 text-xl font-bold text-ink"
              style={{ fontFamily: "Sora, Inter, sans-serif" }}
            >
              Demo<strong style={{ color: "#2B6CB0" }}>BR</strong>
            </Heading>
          </Section>

          {/* Body */}
          <Section>{children}</Section>

          {/* Footer */}
          <Hr className="my-8 border-surface-border" />
          <Section className="text-xs text-ink-subtle">
            <Text className="m-0 font-semibold text-ink">{t("emails.footerCompany")}</Text>
            <Text className="mt-1 m-0 leading-5">{t("emails.footerAddress")}</Text>

            <Text className="mt-4 m-0">
              <Link
                href="https://easydemo.io/account/preferences"
                className="text-brand-primary underline"
              >
                {t("emails.footerPreferences")}
              </Link>
              {" · "}
              <Link href="mailto:suporte@dominio.com.br" className="text-brand-primary underline">
                {t("emails.footerHelp")}
              </Link>
              {" · "}
              <Link href="https://easydemo.io/lgpd" className="text-brand-primary underline">
                {t("emails.footerLegal")}
              </Link>
            </Text>

            {kind === "newsletter" && unsubscribeHref ? (
              <Text className="mt-3 m-0">
                <Link href={unsubscribeHref} className="text-ink-subtle underline">
                  Cancelar inscrição
                </Link>
              </Text>
            ) : null}

            {footerNote ? (
              <Text className="mt-4 m-0 italic">{footerNote}</Text>
            ) : kind === "transactional" ? (
              <Text className="mt-4 m-0 italic">{t("emails.transactorNotice")}</Text>
            ) : null}
          </Section>
        </Container>
      </Section>
    </Tailwind>
  );
}

export const EmailPreviewProps: EmailLayoutProps = {
  preheader: "DemoBR — Demos interativas em PT-BR.",
  children: null,
};
