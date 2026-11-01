"use client";

import { useAnalytics } from "@/lib/analytics/use-analytics";
import { getDefaultConsentText } from "@/lib/lgpd/consent";
import type { DemoEvent, DemoPlayerDemo, DemoPlayerStep } from "@easydemo/shared";
import * as React from "react";
import { HotspotOverlay } from "./HotspotOverlay";
import { LeadForm, type LeadFormValues } from "./LeadForm";
import { initialState, playerReducer } from "./state-machine";

export type DemoPlayerProps = {
  demo: DemoPlayerDemo;
  steps: DemoPlayerStep[];
  locale: "pt-BR" | "en";
  embedded?: boolean;
  onEvent?: (e: DemoEvent) => void;
  /**
   * Texto de consentimento LGPD do demo. Cai no texto padrão quando
   * ausente — o player é público e não depende do creator configurar.
   */
  leadFormConsentText?: string | null;
  /** Nome do workspace, usado no texto de consentimento padrão. */
  workspaceName?: string;
  /** Callback do submit do lead form (F3). */
  onLeadSubmit?: (values: LeadFormValues) => void | Promise<void>;
};

export function DemoPlayer({
  demo,
  steps,
  locale,
  embedded = false,
  onEvent,
  leadFormConsentText,
  workspaceName = "EasyDemo",
  onLeadSubmit,
}: DemoPlayerProps) {
  // Fonte única de verdade do estado de navegação. O reducer puro
  // (./state-machine.ts) é coberto por testes; aqui só despachamos ações.
  const [player, dispatch] = React.useReducer(playerReducer, initialState);
  const { state, currentStepId } = player;

  const stepIds = React.useMemo(() => steps.map((s) => s.id), [steps]);
  const totalSteps = steps.length;

  // O step exibido vem do ID (fonte da verdade do reducer), não do índice —
  // assim BRANCH_SELECTED, que troca o step mantendo o índice, funciona.
  const currentStep = React.useMemo(
    () => steps.find((s) => s.id === currentStepId),
    [steps, currentStepId],
  );
  // Índice resolvido do step exibido: mantém o contador "X / Y" coerente com
  // a tela quando um branch troca o step.
  const resolvedIndex = currentStep ? steps.indexOf(currentStep) : player.currentIndex;

  // prefers-reduced-motion — desativa transição fade do step.
  const [reduceMotion, setReduceMotion] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // stepId explícito: evita closure obsoleta nos callbacks de transição.
  //
  // ⚠️ **Analytics (F5.2):** o player emite `view`, `step_seen`, `cta_click`
  // e `complete`. O envio é feito **aqui dentro** (o player já é um Client
  // Component) porque o `onEvent` das páginas `/d/[slug]` e `/embed/[id]` é
  // uma Server Component — passar função de Server Component para Client
  // Component dá erro. O hook `useAnalytics` faz o POST fire-and-forget.
  //
  // A prop `onEvent` continua existindo: quem embute o player (ex.: o
  // player do pacote `@easydemo/player`) pode querer os eventos.
  const trackEvent = useAnalytics(demo.id);

  const emit = React.useCallback(
    (type: DemoEvent["type"], stepId?: string) => {
      const event: DemoEvent = { type, demoId: demo.id, stepId, ts: Date.now() };
      trackEvent(event);
      onEvent?.(event);
    },
    [demo.id, onEvent, trackEvent],
  );

  // Timeout de transição precisa ser cancelado no unmount e a cada avanço,
  // senão um clique rápido enfileira timers e o índice salta steps.
  const advanceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );

  const start = React.useCallback(() => {
    dispatch({ type: "START", stepIds });
    emit("view", stepIds[0]);
  }, [emit, stepIds]);

  const advance = React.useCallback(() => {
    dispatch({ type: "TRANSITION" });
    const delay = reduceMotion ? 0 : 220;
    advanceTimer.current = setTimeout(() => {
      const nextIndex = resolvedIndex + 1;
      const nextStepId = steps[nextIndex]?.id;
      // O reducer decide entre avançar e concluir — dispacha completed quando
      // não há próximo step.
      dispatch({ type: "ADVANCE", stepIds });
      if (nextStepId) emit("step_seen", nextStepId);
      else emit("complete");
    }, delay);
  }, [emit, reduceMotion, resolvedIndex, stepIds, steps]);

  const previous = React.useCallback(() => {
    dispatch({ type: "GO_BACK", stepIds });
  }, [stepIds]);

  const restart = React.useCallback(() => {
    dispatch({ type: "RESTART", stepIds });
    emit("view", stepIds[0]);
  }, [emit, stepIds]);

  const reset = React.useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // ─── Analytics: detecção de bounce (F5.2) ───
  //
  // ⚠️ **O que é "bounce" aqui:** o visitante abriu o demo mas **não avançou
  // para o segundo step**. É a métrica que diz "a primeira tela não prendeu
  // a atenção" — a mais acionável para o creator.
  //
  // ⚠️ **Como detectamos:** quando o componente é desmontado (o visitor
  // fechou a aba, navegou para fora, ou o embed saiu da tela) **sem** o
  // demo ter sido completado. Não depende de timer nem de heurística de
  // tempo — é o sinal mais confiável disponível no client.
  //
  // ⚠️ `pagehide` também dispara: o visitor fecha a aba. Cobrimos os dois
  // (o unmount do React e o pagehide do browser) e usamos uma flag para não
  // contar duas vezes.
  const maxStepSeen = React.useRef(0);
  const completedRef = React.useRef(false);
  const bounceSent = React.useRef(false);

  // Marca o step mais avançado que o visitor viu.
  React.useEffect(() => {
    const idx = steps.findIndex((s) => s.id === currentStepId);
    if (idx > maxStepSeen.current) maxStepSeen.current = idx;
  }, [currentStepId, steps]);

  React.useEffect(() => {
    if (state === "completed") completedRef.current = true;
  }, [state]);

  const sendBounce = React.useCallback(() => {
    if (bounceSent.current) return;
    if (completedRef.current) return;
    // Bounce = viu o primeiro step e não avançou.
    if (maxStepSeen.current > 0) return;
    bounceSent.current = true;
    emit("bounce", stepIds[0]);
  }, [emit, stepIds]);

  // Keyboard nav: setas + Espaço + Enter + Esc para sair.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (state !== "playing") {
        if (state === "idle" && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          start();
        }
        return;
      }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        advance();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        previous();
      } else if (e.key === "Escape") {
        reset();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, previous, reset, start, state]);

  // Envia o bounce quando o visitor sai sem completar.
  React.useEffect(() => {
    // `pagehide` cobre "fechou a aba" e o back/forward do browser.
    const onPageHide = () => sendBounce();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      // Unmount do React (navegou para outra rota, embed saiu da tela).
      sendBounce();
    };
  }, [sendBounce]);

  if (state === "idle") {
    return (
      <section
        className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8"
        aria-label={demo.title}
      >
        <div className="max-w-md text-center">
          <h1 className="mb-3 text-3xl font-bold">{demo.title}</h1>
          {demo.description ? <p className="text-muted-foreground">{demo.description}</p> : null}
        </div>
        <button
          type="button"
          onClick={start}
          aria-label={
            locale === "pt-BR" ? "Iniciar demonstração interativa" : "Start interactive demo"
          }
          className="neobrutalism-button rounded-md px-6 py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {locale === "pt-BR" ? "Iniciar demo" : "Start demo"}
        </button>
      </section>
    );
  }

  if (!currentStep) {
    return null;
  }

  // Step announcement for screen readers
  const stepAnnouncement =
    locale === "pt-BR"
      ? `Step ${resolvedIndex + 1} de ${totalSteps}: ${currentStep.caption || currentStep.sourceTitle || ""}`
      : `Step ${resolvedIndex + 1} of ${totalSteps}: ${currentStep.caption || currentStep.sourceTitle || ""}`;

  // ─────────── Lead form (F3) ───────────

  const [leadSubmitted, setLeadSubmitted] = React.useState(false);
  const [leadSubmitting, setLeadSubmitting] = React.useState(false);
  const [leadError, setLeadError] = React.useState<string | null>(null);

  const consentText = React.useMemo(() => {
    if (leadFormConsentText && leadFormConsentText.trim().length > 0) {
      return leadFormConsentText;
    }
    return getDefaultConsentText(workspaceName, locale);
  }, [leadFormConsentText, workspaceName, locale]);

  /**
   * O form é **gate do step 1**: enquanto o lead não foi capturado, o
   * visitante não avança. É o que o Supademo faz ("create gated sections
   * that unlock after form completion").
   */
  const leadGateActive = demo.leadFormEnabled && !leadSubmitted;

  const handleLeadSubmit = React.useCallback(
    async (values: LeadFormValues) => {
      if (!onLeadSubmit) {
        setLeadError(
          locale === "pt-BR"
            ? "Não foi possível enviar agora. Tente novamente."
            : "Could not submit right now. Please try again.",
        );
        return;
      }
      setLeadSubmitting(true);
      setLeadError(null);
      try {
        await onLeadSubmit(values);
        setLeadSubmitted(true);
      } catch (err) {
        setLeadError(err instanceof Error ? err.message : null);
      } finally {
        setLeadSubmitting(false);
      }
    },
    [locale, onLeadSubmit],
  );

  return (
    <section
      className={`relative flex min-h-dvh w-full flex-col bg-background ${
        embedded ? "" : "border-x border-border"
      }`}
      aria-label={demo.title}
      aria-roledescription="carousel"
      data-state={state}
    >
      <header className="flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium">{demo.title}</h1>
          <span
            className="text-xs text-muted-foreground"
            aria-label={
              locale === "pt-BR"
                ? `Step ${resolvedIndex + 1} de ${totalSteps}`
                : `Step ${resolvedIndex + 1} of ${totalSteps}`
            }
          >
            {resolvedIndex + 1} / {totalSteps}
          </span>
        </div>
        <button
          type="button"
          onClick={restart}
          aria-label={locale === "pt-BR" ? "Reiniciar do início" : "Restart from beginning"}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {locale === "pt-BR" ? "Reiniciar" : "Restart"}
        </button>
      </header>

      {/* Live region announcing step changes */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {stepAnnouncement}
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-muted/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentStep.screenshotUrl}
          alt={
            currentStep.caption ||
            currentStep.sourceTitle ||
            (locale === "pt-BR" ? "Screenshot do produto" : "Product screenshot")
          }
          className={`max-h-full max-w-full object-contain ${
            reduceMotion ? "" : "transition-opacity"
          } ${state === "transitioning" ? "opacity-30" : "opacity-100"}`}
        />
        <HotspotOverlay
          hotspot={currentStep.hotspot}
          stepId={currentStep.id}
          onActivate={() => {
            emit("cta_click");
            advance();
          }}
          disabled={state !== "playing" || leadGateActive}
        />
      </div>

      {currentStep.caption ? (
        <footer className="border-t border-border bg-background px-4 py-3">
          <p className="text-sm">{currentStep.caption}</p>
        </footer>
      ) : null}

      {leadGateActive ? (
        <LeadForm
          consentText={consentText}
          locale={locale}
          submitting={leadSubmitting}
          serverError={leadError}
          onSubmit={handleLeadSubmit}
        />
      ) : null}

      {state === "completed" && demo.finalCta ? (
        <FinalCta
          cta={demo.finalCta}
          locale={locale}
          onClick={() => emit("cta_click", currentStep.id)}
        />
      ) : null}
    </section>
  );
}

function FinalCta({
  cta,
  locale,
  onClick,
}: {
  cta: NonNullable<DemoPlayerDemo["finalCta"]>;
  locale: "pt-BR" | "en";
  onClick?: () => void;
}) {
  const href =
    cta.type === "whatsapp"
      ? `https://wa.me/${cta.value.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(cta.label)}`
      : cta.type === "email"
        ? `mailto:${cta.value}?subject=${encodeURIComponent(cta.label)}`
        : cta.value;

  return (
    <div className="border-t border-border bg-muted/30 p-6 text-center">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        // ⚠️ Analytics (F5.2): o clique no CTA final é a conversão. O
        // `onClick` dispara o evento **antes** da navegação — o request
        // usa `keepalive`, então sobrevive à saída do visitor.
        onClick={onClick}
        aria-label={locale === "pt-BR" ? `Ação final: ${cta.label}` : `Final action: ${cta.label}`}
        className="neobrutalism-button inline-flex items-center justify-center rounded-md px-6 py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {cta.label}
      </a>
      <p className="mt-3 text-xs text-muted-foreground">
        {locale === "pt-BR"
          ? "Demo concluída — obrigado por assistir."
          : "Demo complete — thanks for watching."}
      </p>
    </div>
  );
}
