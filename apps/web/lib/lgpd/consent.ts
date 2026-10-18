/**
 * Textos de consentimento LGPD padrão.
 * O creator pode customizar via demo.lead_form_consent_text.
 */

export const CONSENT_TEXT_PT_BR_DEFAULT =
  "Autorizo o {workspace_name} a me contatar sobre o produto demonstrado, conforme Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Posso revogar este consentimento a qualquer momento.";

export const CONSENT_TEXT_EN_DEFAULT =
  "I authorize {workspace_name} to contact me about the demonstrated product, in accordance with the Brazilian General Data Protection Law (Law nº 13.709/2018). I may revoke this consent at any time.";

export function getDefaultConsentText(
  workspaceName: string,
  locale: "pt-BR" | "en",
): string {
  const template =
    locale === "pt-BR" ? CONSENT_TEXT_PT_BR_DEFAULT : CONSENT_TEXT_EN_DEFAULT;
  return template.replaceAll("{workspace_name}", workspaceName);
}

/**
 * Banner de analytics anônimo exibido no primeiro load do demo.
 */
export const ANALYTICS_BANNER_PT_BR = {
  title: "Analytics anônimos",
  body: "Este demo usa cookies first-party para medir engajamento (LGPD-safe, sem IP). Você pode aceitar ou recusar.",
  accept: "Aceitar",
  reject: "Recusar",
};

export const ANALYTICS_BANNER_EN = {
  title: "Anonymous analytics",
  body: "This demo uses first-party cookies to measure engagement (LGPD-safe, no IP). You can accept or decline.",
  accept: "Accept",
  reject: "Decline",
};