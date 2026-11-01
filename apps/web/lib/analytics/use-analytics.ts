"use client";

import type { DemoEvent } from "@easydemo/shared";
import * as React from "react";

/**
 * apps/web/lib/analytics/use-analytics.ts
 * -----------------------------------------------------------------------------
 * Envia os eventos do player para `/api/v1/events`.
 *
 * ⚠️ **Por que um hook e não um callback inline?**
 *
 * O player (`DemoPlayer.tsx`) é um **Client Component** e emite eventos via
 * a prop `onEvent`. Quem consome essa prop também precisa ser client-side —
 * e o `onEvent` das páginas `/d/[slug]` e `/embed/[id]` é uma **Server
 * Component**. Passar uma função de Server Component para um Client
 * Component dá erro ("Functions cannot be passed directly to Client
 * Components").
 *
 * A solução: o hook é client-side, mora dentro do `DemoPlayer` (que já é
 * client) e faz o POST. O Server Component só passa dados **serializáveis**
 * (o `demoId`).
 *
 * ⚠️ **Fire-and-forget.** Um evento de analytics **nunca** pode quebrar a
 * experiência do visitante: falha de rede, timeout ou 500 não podem
 * travar o player. Por isso `keepalive: true` (o request sobrevive à
 * navegação) e o erro é engolido.
 */

/**
 * Envia um evento para o endpoint de analytics.
 *
 * Fire-and-forget por design — nunca lança.
 */
export function sendAnalyticsEvent(event: DemoEvent): void {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    demoId: event.demoId,
    stepId: event.stepId,
    eventType: event.type,
  });

  try {
    void fetch("/api/v1/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      // `keepalive` deixa o request completar mesmo se o visitor navegar
      // logo em seguida (é comum: clicar no CTA leva para fora).
      keepalive: true,
    }).catch(() => {
      // Silencioso por design — analytics não pode quebrar o player.
    });
  } catch {
    // Silencioso por design (ver acima).
  }
}

/**
 * Hook que devolve um `onEvent` pronto para o `DemoPlayer`.
 *
 * ⚠️ **Deduplicação do `view`.** O player emite `view` no `START` e no
 * `RESTART`. Cada emission vira uma linha em `analytics.events`. Isso é
 * intencional: um restart é uma **nova visita** ao demo. Mas duas views do
 * **mesmo** visitante não podem virar dois visitantes — isso é garantido
 * pelo cookie `_pk_id` (F5.1), não por aqui.
 */
export function useAnalytics(demoId: string): (event: DemoEvent) => void {
  const handler = React.useCallback(
    (event: DemoEvent) => {
      // O `demoId` do evento tem precedência — mas o prop é a fonte da
      // verdade (protege contra evento de outro demo).
      sendAnalyticsEvent({ ...event, demoId });
    },
    [demoId],
  );

  return handler;
}
