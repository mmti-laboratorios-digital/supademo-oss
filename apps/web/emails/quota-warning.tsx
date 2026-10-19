import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./_layout";

export type QuotaMetric = {
  label: string;
  used: number;
  limit: number;
  unit?: string;
};

export type QuotaWarningEmailProps = {
  firstName?: string;
  workspaceName: string;
  planName: string;
  metrics: QuotaMetric[];
  upgradeUrl: string;
  billingUrl: string;
  percentUsed: number;
  locale?: "pt-BR" | "en";
};

/**
 * Quota warning. Sent when usage hits >= 80% of any plan metric.
 * Subject: "Você está perto do limite do plano <plan>"
 *
 * Marketing-style CTA but cleanly transactional: link goes to upgrade flow.
 */
export function QuotaWarningEmail({
  firstName,
  workspaceName,
  planName,
  metrics,
  upgradeUrl,
  billingUrl,
  percentUsed,
  locale = "pt-BR",
}: QuotaWarningEmailProps) {
  return (
    <EmailLayout
      locale={locale}
      preheader={`Você está em ${percentUsed}% da cota do plano ${planName}. Considere upgrade.`}
    >
      <Heading
        as="h2"
        className="m-0 text-2xl font-bold text-ink"
        style={{ fontFamily: "Sora, Inter, sans-serif" }}
      >
        Você está perto do limite.
      </Heading>

      <Text className="mt-3 leading-6 text-ink-muted">
        {firstName ? `Oi, ${firstName}.` : "Oi."} O workspace <strong>{workspaceName}</strong> já
        usou <strong>{percentUsed}%</strong> da cota mensal do plano <strong>{planName}</strong>.
        Quando chegar a 100%, alguns recursos param de funcionar até o próximo ciclo.
      </Text>

      <Section className="my-6 rounded-md border border-surface-border bg-surface-muted p-4">
        <Text className="m-0 text-xs uppercase tracking-wider text-ink-subtle">Cota deste mês</Text>
        <table
          cellPadding={0}
          cellSpacing={0}
          style={{
            width: "100%",
            marginTop: 8,
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            {metrics.map((m) => {
              const pct = Math.min(100, Math.round((m.used / m.limit) * 100));
              const pctColor =
                pct >= 100 ? "#E53E3E" : pct >= 90 ? "#DD6B20" : pct >= 80 ? "#D69E2E" : "#38B2AC";
              return (
                <tr key={m.label}>
                  <td
                    style={{
                      padding: "8px 0",
                      color: "#1A202C",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    {m.label}
                  </td>
                  <td
                    style={{
                      padding: "8px 0",
                      fontSize: "13px",
                      color: "#4A5568",
                      textAlign: "right",
                    }}
                  >
                    {m.unit === "BRL"
                      ? `R$ ${m.used.toLocaleString("pt-BR")} / R$ ${m.limit.toLocaleString("pt-BR")}`
                      : `${m.used.toLocaleString("pt-BR")} / ${m.limit.toLocaleString("pt-BR")}${m.unit ? ` ${m.unit}` : ""}`}
                  </td>
                  <td
                    style={{
                      padding: "8px 0 8px 12px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: pctColor,
                      width: 56,
                      textAlign: "right",
                    }}
                  >
                    {pct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      <Section className="mt-6 text-center">
        <Button
          href={upgradeUrl}
          className="rounded-md bg-brand-primary px-5 py-3 text-sm font-semibold text-white"
        >
          Fazer upgrade
        </Button>
      </Section>

      <Text className="mt-6 text-sm text-ink-subtle">
        Não quer upgrade agora? Você pode ver o consumo detalhado em{" "}
        <a href={billingUrl} className="text-brand-primary underline">
          billing
        </a>{" "}
        e ajustar limites.
      </Text>

      <Hr className="my-6 border-surface-border" />
      <Text className="m-0 text-xs text-ink-subtle">
        Lembrando: clientes Pro têm garantia de 14 dias. Se você fizer upgrade e em até 14 dias não
        gostar, devolvemos seu dinheiro.
      </Text>
    </EmailLayout>
  );
}

QuotaWarningEmail.PreviewProps = {
  firstName: "Bruna",
  workspaceName: "Empresa XYZ S.A.",
  planName: "Pro",
  metrics: [
    { label: "Visualizações", used: 4123, limit: 5000 },
    { label: "Leads capturados", used: 81, limit: 100 },
    { label: "Minutos TTS pt-BR", used: 24, limit: 30, unit: "min" },
    { label: "Requisições AI text", used: 412, limit: 500 },
  ],
  upgradeUrl: "https://demobr.com.br/billing?intent=upgrade",
  billingUrl: "https://demobr.com.br/billing",
  percentUsed: 87,
  locale: "pt-BR",
} satisfies QuotaWarningEmailProps;

export default QuotaWarningEmail;
