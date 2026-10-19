import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./_layout";

export type DpoPublishedEmailProps = {
  firstName?: string;
  demoTitle: string;
  demoSlug: string;
  publishedUrl: string;
  embedCode: string;
  editUrl: string;
  locale?: "pt-BR" | "en";
};

/**
 * Sent right after a demo is published. Tells the user:
 *   - Public URL is live
 *   - Embed iframe snippet
 *   - Where to edit / share further
 * Subject: "Seu demo \"<title>\" está no ar"
 */
export function DpoPublishedEmail({
  firstName,
  demoTitle,
  demoSlug,
  publishedUrl,
  embedCode,
  editUrl,
  locale = "pt-BR",
}: DpoPublishedEmailProps) {
  return (
    <EmailLayout
      locale={locale}
      preheader={`Seu demo "${demoTitle}" está no ar. Compartilhe em qualquer canal.`}
    >
      <Heading
        as="h2"
        className="m-0 text-2xl font-bold text-ink"
        style={{ fontFamily: "Sora, Inter, sans-serif" }}
      >
        Seu demo está no ar.
      </Heading>

      <Text className="mt-3 leading-6 text-ink-muted">
        {firstName ? `Oi, ${firstName}.` : "Oi."} Acabamos de publicar{" "}
        <strong>"{demoTitle}"</strong>. O link já tá funcionando e o player carrega em &lt; 2s pela
        CDN global.
      </Text>

      <Section className="my-6 rounded-md border border-surface-border bg-surface-muted p-4">
        <Text className="m-0 text-xs uppercase tracking-wider text-ink-subtle">Link público</Text>
        <Text className="mt-1 mb-0 break-all font-mono text-sm text-ink">
          <a href={publishedUrl} className="text-brand-primary underline">
            {publishedUrl}
          </a>
        </Text>
        <Text className="mt-4 m-0 text-xs uppercase tracking-wider text-ink-subtle">Slug</Text>
        <Text className="mt-1 mb-0 font-mono text-sm text-ink">demobr.com.br/d/{demoSlug}</Text>
      </Section>

      <Section className="mt-6 text-center">
        <Button
          href={publishedUrl}
          className="rounded-md bg-brand-primary px-5 py-3 text-sm font-semibold text-white"
        >
          Ver demo no ar
        </Button>
      </Section>

      <Heading
        as="h3"
        className="mt-10 mb-2 text-base font-semibold text-ink"
        style={{ fontFamily: "Sora, Inter, sans-serif" }}
      >
        Embed em qualquer página
      </Heading>
      <Text className="m-0 leading-6 text-ink-muted">
        Cole este snippet no seu site, blog, Notion ou landing page (aceita Webflow, Framer,
        WordPress):
      </Text>
      <Section className="my-4 rounded-md border border-surface-border bg-surface-muted p-4">
        <Text className="m-0 break-all font-mono text-xs text-ink">{embedCode}</Text>
      </Section>

      <Text className="mt-6 text-sm text-ink-subtle">
        Quer ajustar caption, ordem de steps ou adicionar narração?{" "}
        <a href={editUrl} className="text-brand-primary underline">
          Abrir editor
        </a>
        .
      </Text>
    </EmailLayout>
  );
}

DpoPublishedEmail.PreviewProps = {
  firstName: "Bruna",
  demoTitle: "Tour do CRM para PMEs",
  demoSlug: "crm-tour-pmes",
  publishedUrl: "https://demobr.com.br/d/crm-tour-pmes",
  embedCode:
    '<iframe src="https://demobr.com.br/embed/crm-tour-pmes" width="100%" height="540" frameborder="0" allowfullscreen></iframe>',
  editUrl: "https://demobr.com.br/demos/crm-tour-pmes/edit",
  locale: "pt-BR",
} satisfies DpoPublishedEmailProps;

export default DpoPublishedEmail;
