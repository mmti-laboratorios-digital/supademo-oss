"use client";

import { Button } from "@/components/ui/button";
import * as React from "react";

/**
 * QR Code do PIX na tela de checkout.
 *
 * ⚠️ **Por que é um Client Component:** o QR Code é dinâmico — o Asaas pode
 * levar alguns segundos para gerá-lo depois da cobrança ser criada. O
 * componente busca no servidor (`/api/v1/billing/checkout/pix`), que por sua
 * vez chama o Asaas com a API key (que **nunca** vai para o browser).
 *
 * Se o QR Code ainda não estiver pronto, ele **tenta de novo** — sem isso, o
 * creator cairia na tela de "sem QR Code" e teria de recarregar a página
 * (e o checkout é assíncrono por natureza: o plano só é liberado no webhook).
 */

type PixState =
  | { status: "loading" }
  | { status: "ready"; qrCode: string; payload: string | null }
  | { status: "paid" }
  | { status: "unavailable"; reason: string };

const RETRY_DELAYS_MS = [1500, 3000, 6000];

export function PixQrCodePanel(): React.ReactElement {
  const [state, setState] = React.useState<PixState>({ status: "loading" });
  const [copied, setCopied] = React.useState(false);
  const attemptRef = React.useRef(0);

  const fetchQrCode = React.useCallback(async (attempt: number) => {
    try {
      const res = await fetch("/api/v1/billing/checkout/pix", { cache: "no-store" });
      if (!res.ok) {
        setState({ status: "unavailable", reason: `HTTP ${res.status}` });
        return;
      }
      const body = (await res.json()) as {
        paid?: boolean;
        qrCode?: string | null;
        payload?: string | null;
        reason?: string;
      };

      if (body.paid) {
        setState({ status: "paid" });
        return;
      }
      if (body.qrCode) {
        setState({ status: "ready", qrCode: body.qrCode, payload: body.payload ?? null });
        return;
      }

      // Ainda não disponível — tenta de novo com backoff.
      const delay = RETRY_DELAYS_MS[attempt];
      if (delay !== undefined) {
        attemptRef.current = attempt + 1;
        setTimeout(() => void fetchQrCode(attempt + 1), delay);
        return;
      }
      setState({ status: "unavailable", reason: body.reason ?? "QR_CODE_UNAVAILABLE" });
    } catch {
      setState({ status: "unavailable", reason: "NETWORK_ERROR" });
    }
  }, []);

  React.useEffect(() => {
    void fetchQrCode(0);
  }, [fetchQrCode]);

  async function copyPayload(): Promise<void> {
    if (state.status !== "ready" || !state.payload) return;
    try {
      await navigator.clipboard.writeText(state.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  if (state.status === "paid") {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
        <p className="text-sm font-medium">Pagamento confirmado.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Seu plano já está ativo — não precisa pagar mais nada.
        </p>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="rounded-lg border border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">Gerando o QR Code do PIX…</p>
      </div>
    );
  }

  if (state.status === "unavailable") {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-6">
        <p className="text-sm font-medium">O QR Code não pôde ser carregado.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Você pode pagar pelo link enviado por e-mail ou pelo app do seu banco. Em caso de dúvida,{" "}
          <a href="/suporte" className="underline">
            fale com o suporte
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL do Asaas; não passa pelo optimizer do Next */}
        <img
          src={state.qrCode}
          alt="QR Code para pagamento via PIX"
          width={200}
          height={200}
          className="rounded-lg border border-border bg-white p-2"
        />

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Pague com PIX</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Abra o app do seu banco, escolha pagar com PIX e aponte a câmera para o QR Code.
            </p>
          </div>

          {state.payload ? (
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">
                Ou use o código copia e cola:
              </span>
              <code className="block max-h-24 overflow-y-auto break-all rounded bg-muted p-2 text-xs">
                {state.payload}
              </code>
              <Button type="button" size="sm" variant="outline" onClick={copyPayload}>
                {copied ? "Copiado!" : "Copiar código"}
              </Button>
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Assim que o pagamento é confirmado, seu plano é liberado automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
