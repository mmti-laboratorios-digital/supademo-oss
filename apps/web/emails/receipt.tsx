import * as React from "react";

export type ReceiptEmailProps = {
  workspaceName: string;
  planName: string;
  amountBRL: number;
  invoiceUrl?: string;
  paymentMethod: "PIX" | "BOLETO" | "CREDIT_CARD";
  locale: "pt-BR" | "en";
};

export function ReceiptEmail({
  workspaceName,
  planName,
  amountBRL,
  invoiceUrl,
  paymentMethod,
  locale,
}: ReceiptEmailProps) {
  const fmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const copy =
    locale === "pt-BR"
      ? {
          title: "Recebemos seu pagamento",
          body: `O pagamento da assinatura do plano ${planName} do workspace ${workspaceName} foi confirmado via ${paymentMethod}.`,
          cta: "Baixar NF-e",
          thanks: "Obrigado por usar o DemoBR!",
        }
      : {
          title: "We received your payment",
          body: `Your ${planName} subscription payment for ${workspaceName} was confirmed via ${paymentMethod}.`,
          cta: "Download invoice",
          thanks: "Thanks for using DemoBR!",
        };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "24px" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "12px" }}>{copy.title}</h1>
      <p style={{ color: "#475569", marginBottom: "16px" }}>{copy.body}</p>
      <p style={{ fontSize: "24px", fontWeight: 700, marginBottom: "16px" }}>
        {fmt.format(amountBRL)}
      </p>
      {invoiceUrl ? (
        <a
          href={invoiceUrl}
          style={{
            background: "#2563eb",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: "6px",
            textDecoration: "none",
          }}
        >
          {copy.cta}
        </a>
      ) : null}
      <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "16px" }}>
        {copy.thanks}
      </p>
    </div>
  );
}