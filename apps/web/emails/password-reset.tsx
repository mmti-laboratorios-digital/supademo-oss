import * as React from "react";
import { Heading, Text, Button, Section } from "@react-email/components";
import { EmailLayout } from "./_layout";

export type PasswordResetEmailProps = {
  firstName?: string;
  resetUrl: string;
  expiresInMinutes: number;
  ipAddress?: string;
  userAgent?: string;
  locale?: "pt-BR" | "en";
};

/**
 * Password reset email. Pure transactional.
 * Subject: "Redefinição de senha"
 *
 * Security notes:
 *   - We do NOT include the old password (we never see it, just the hash).
 *   - The link is single-use and expires in 30 minutes.
 *   - For high-value workspaces, surface the IP/UA that requested the reset.
 */
export function PasswordResetEmail({
  firstName,
  resetUrl,
  expiresInMinutes,
  ipAddress,
  userAgent,
  locale = "pt-BR",
}: PasswordResetEmailProps) {
  return (
    <EmailLayout
      locale={locale}
      preheader="Redefina sua senha. Esse link expira em 30 minutos."
    >
      <Heading
        as="h2"
        className="m-0 text-2xl font-bold text-ink"
        style={{ fontFamily: "Sora, Inter, sans-serif" }}
      >
        Redefinição de senha
      </Heading>

      <Text className="mt-3 leading-6 text-ink-muted">
        {firstName ? `Oi, ${firstName}.` : "Oi."} Recebemos um pedido pra
        redefinir a senha da sua conta. Se foi você, é só clicar no botão
        abaixo em até {expiresInMinutes} minutos.
      </Text>

      <Section className="mt-6 text-center">
        <Button
          href={resetUrl}
          className="rounded-md bg-brand-primary px-5 py-3 text-sm font-semibold text-white"
        >
          Redefinir senha
        </Button>
      </Section>

      <Text className="mt-8 text-sm text-ink-subtle">
        Se o botão não funcionar, cole este link no seu navegador:
      </Text>
      <Text className="mt-1 break-all font-mono text-xs text-ink-muted">
        {resetUrl}
      </Text>

      {(ipAddress || userAgent) && (
        <Section className="mt-6 rounded-md border border-surface-border bg-surface-muted p-3">
          <Text className="m-0 text-xs uppercase tracking-wider text-ink-subtle">
            Pedido originado de
          </Text>
          {ipAddress ? (
            <Text className="mt-1 mb-0 font-mono text-xs text-ink">
              IP: {ipAddress}
            </Text>
          ) : null}
          {userAgent ? (
            <Text className="mt-1 mb-0 break-all font-mono text-xs text-ink">
              Navegador: {userAgent}
            </Text>
          ) : null}
        </Section>
      )}

      <Text className="mt-8 text-sm text-ink-subtle">
        Não pediu essa redefinição? Ignore este e-mail. Sua senha continua a
        mesma e ninguém conseguiu entrar na sua conta.
      </Text>
    </EmailLayout>
  );
}

PasswordResetEmail.PreviewProps = {
  firstName: "Bruna",
  resetUrl: "https://demobr.com.br/reset?token=eyJhbGciOi...",
  expiresInMinutes: 30,
  ipAddress: "201.20.34.10",
  userAgent: "Chrome 130 (macOS)",
  locale: "pt-BR",
} satisfies PasswordResetEmailProps;

export default PasswordResetEmail;
