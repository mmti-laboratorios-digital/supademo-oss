import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./_layout";

export type WelcomeEmailProps = {
  firstName?: string;
  workspaceName: string;
  dashboardUrl: string;
  guideUrl: string;
  locale?: "pt-BR" | "en";
};

/**
 * Welcome email after sign-up.
 * Subject: "Bem-vindo à DemoBR"
 * Goal: get the user to install the Chrome extension and capture their first
 *       demo in 5 minutes.
 */
export function WelcomeEmail({
  firstName,
  workspaceName,
  dashboardUrl,
  guideUrl,
  locale = "pt-BR",
}: WelcomeEmailProps) {
  return (
    <EmailLayout locale={locale} preheader="5 minutos para sua primeira demo. Sem cartão.">
      <Heading
        as="h2"
        className="m-0 text-2xl font-bold text-ink"
        style={{ fontFamily: "Sora, Inter, sans-serif" }}
      >
        {firstName ? `Bem-vindo, ${firstName}.` : "Bem-vindo."}
      </Heading>

      <Text className="mt-3 leading-6 text-ink-muted">
        A DemoBR está pronta pro <strong>{workspaceName}</strong>. Você tem um plano Free ativo: 3
        demos publicados, 50 views por mês, sem cartão de crédito.
      </Text>

      <Heading
        as="h3"
        className="mt-8 mb-2 text-base font-semibold text-ink"
        style={{ fontFamily: "Sora, Inter, sans-serif" }}
      >
        Seus próximos 5 minutos
      </Heading>

      <ol className="m-0 pl-5 leading-7 text-ink-muted">
        <li>
          <strong>Instale a extensão Chrome</strong> (
          <a
            href="https://chromewebstore.google.com/detail/demobr"
            className="text-brand-primary underline"
          >
            link
          </a>
          ). Ela aparece como um ícone ▶.
        </li>
        <li>
          <strong>Abra seu SaaS</strong>, clique no ícone ▶ e em "Iniciar captura". Cada clique seu
          vira um step do demo.
        </li>
        <li>
          <strong>Publique</strong> e copie o link. Mande pra um lead, embute no seu site, imprime o
          QR code pra um evento.
        </li>
      </ol>

      <Section className="mt-8 text-center">
        <Button
          href={dashboardUrl}
          className="rounded-md bg-brand-primary px-5 py-3 text-sm font-semibold text-white"
        >
          Abrir painel
        </Button>
      </Section>

      <Text className="mt-8 text-sm text-ink-subtle">
        Dúvidas? Veja nosso{" "}
        <a href={guideUrl} className="text-brand-primary underline">
          guia de 5 minutos
        </a>{" "}
        ou escreva pra{" "}
        <a href="mailto:suporte@dominio.com.br" className="text-brand-primary underline">
          suporte@dominio.com.br
        </a>
        .
      </Text>
    </EmailLayout>
  );
}

WelcomeEmail.PreviewProps = {
  firstName: "Bruna",
  workspaceName: "Empresa XYZ S.A.",
  dashboardUrl: "https://easydemo.io/dashboard",
  guideUrl: "https://easydemo.io/blog/como-fazer-demo-interativa",
  locale: "pt-BR",
} satisfies WelcomeEmailProps;

export default WelcomeEmail;
