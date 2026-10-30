import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./_layout";

export type SharedWithTeamEmailProps = {
  inviterName: string;
  workspaceName: string;
  role: "admin" | "editor" | "viewer";
  inviteUrl: string;
  expiresInDays: number;
  locale?: "pt-BR" | "en";
};

const ROLE_PT: Record<SharedWithTeamEmailProps["role"], string> = {
  admin: "administrador",
  editor: "editor",
  viewer: "visualizador",
};

const ROLE_PT_DESCRIPTION: Record<SharedWithTeamEmailProps["role"], string> = {
  admin: "Acesso total: editar, publicar, convidar, billing.",
  editor: "Pode criar e editar demos, mas não gerencia billing nem membros.",
  viewer: "Pode assistir demos e ver analytics, sem editar.",
};

/**
 * Workspace invitation email. Replaces/extends the simpler
 * `invitation.tsx` to use the shared layout (Inter, brand colors, footer).
 * Subject: "<inviterName> convidou você pro workspace <workspaceName>"
 */
export function SharedWithTeamEmail({
  inviterName,
  workspaceName,
  role,
  inviteUrl,
  expiresInDays,
  locale = "pt-BR",
}: SharedWithTeamEmailProps) {
  return (
    <EmailLayout
      locale={locale}
      preheader={`${inviterName} convidou você para colaborar em ${workspaceName}.`}
    >
      <Heading
        as="h2"
        className="m-0 text-2xl font-bold text-ink"
        style={{ fontFamily: "Sora, Inter, sans-serif" }}
      >
        Você foi convidado.
      </Heading>

      <Text className="mt-3 leading-6 text-ink-muted">
        <strong>{inviterName}</strong> convidou você para colaborar no workspace{" "}
        <strong>{workspaceName}</strong> como <strong>{ROLE_PT[role]}</strong>.
      </Text>

      <Section className="my-6 rounded-md border border-surface-border bg-surface-muted p-4">
        <Text className="m-0 text-xs uppercase tracking-wider text-ink-subtle">Seu papel</Text>
        <Text className="mt-1 mb-0 text-base font-semibold text-ink">{ROLE_PT[role]}</Text>
        <Text className="mt-1 mb-0 text-sm text-ink-muted">{ROLE_PT_DESCRIPTION[role]}</Text>
      </Section>

      <Section className="mt-6 text-center">
        <Button
          href={inviteUrl}
          className="rounded-md bg-brand-primary px-5 py-3 text-sm font-semibold text-white"
        >
          Aceitar convite
        </Button>
      </Section>

      <Text className="mt-8 text-sm text-ink-subtle">
        Esse link expira em {expiresInDays} dias. Se você não conhece {inviterName} ou acha que foi
        engano, ignore este e-mail — o convite não cria conta automaticamente.
      </Text>
    </EmailLayout>
  );
}

SharedWithTeamEmail.PreviewProps = {
  inviterName: "Bruna",
  workspaceName: "Empresa XYZ S.A.",
  role: "editor",
  inviteUrl: "https://easydemo.io/invite/abc123",
  expiresInDays: 7,
  locale: "pt-BR",
} satisfies SharedWithTeamEmailProps;

export default SharedWithTeamEmail;
