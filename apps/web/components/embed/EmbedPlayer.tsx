"use client";

import { DemoPlayer, type DemoPlayerProps } from "@/components/player/DemoPlayer";
import type { DemoEvent } from "@easydemo/shared";
import * as React from "react";

/**
 * apps/web/components/embed/EmbedPlayer.tsx
 * -----------------------------------------------------------------------------
 * Envolve o `DemoPlayer` e repassa os eventos analytics para o `window.parent`
 * via `postMessage`.
 *
 * ⚠️ Este componente só é usado na rota `/embed/[id]`. Ele é Client
 * Component porque precisa de `window`.
 *
 * Segurança:
 * - Só envia se estivermos dentro de um iframe (`window.parent !== window`).
 *   Em top-level, não há para quem repassar.
 * - O payload é pequeno e tipado; a validação do `event.origin` é dever do
 *   site que consome o embed (ver documentação do `postMessage`).
 */

type EmbedPlayerProps = Omit<DemoPlayerProps, "onEvent">;

export function EmbedPlayer(props: EmbedPlayerProps): React.ReactElement {
  const isIframe = typeof window !== "undefined" && window.parent !== window;

  const handleEvent = React.useCallback(
    (event: DemoEvent) => {
      if (!isIframe) return;

      const message: EmbedMessage = {
        type: "easydemo:event",
        event: {
          type: mapEventType(event.type),
          demoId: event.demoId,
          stepId: event.stepId,
          ts: event.ts,
        },
      };

      // Envia para o parent. O parent DEVE validar `event.origin` antes de
      // processar qualquer mensagem.
      window.parent.postMessage(message, "*");
    },
    [isIframe],
  );

  return <DemoPlayer {...props} onEvent={handleEvent} />;
}

/**
 * Mapeia os eventos internos para os nomes públicos documentados do embed.
 */
function mapEventType(type: DemoEvent["type"]): EmbedEventType {
  switch (type) {
    case "step_seen":
      return "step_viewed";
    case "cta_click":
      return "cta_click";
    case "lead_captured":
      return "lead_captured";
    case "complete":
      return "complete";
    default:
      return "step_viewed";
  }
}

type EmbedEventType = "step_viewed" | "cta_click" | "lead_captured" | "complete";

type EmbedMessage = {
  type: "easydemo:event";
  event: {
    type: EmbedEventType;
    demoId: string;
    stepId?: string;
    ts: number;
  };
};
