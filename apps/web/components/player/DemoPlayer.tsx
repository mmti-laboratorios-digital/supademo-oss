"use client";

import * as React from "react";
import { HotspotOverlay } from "./HotspotOverlay";
import type {
  DemoPlayerStep,
  DemoPlayerDemo,
  DemoEvent,
} from "@demo.br/shared";

export type DemoPlayerProps = {
  demo: DemoPlayerDemo;
  steps: DemoPlayerStep[];
  locale: "pt-BR" | "en";
  embedded?: boolean;
  onEvent?: (e: DemoEvent) => void;
};

type State = "idle" | "playing" | "transitioning" | "completed";

export function DemoPlayer({
  demo,
  steps,
  locale,
  embedded = false,
  onEvent,
}: DemoPlayerProps) {
  const [state, setState] = React.useState<State>("idle");
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const totalSteps = steps.length;
  const currentStep = steps[currentIndex];

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

  const emit = React.useCallback(
    (type: DemoEvent["type"], extra: Partial<DemoEvent> = {}) => {
      const event: DemoEvent = {
        type,
        demoId: demo.id,
        stepId: currentStep?.id,
        ts: Date.now(),
        ...extra,
      };
      onEvent?.(event);
    },
    [demo.id, currentStep, onEvent],
  );

  const start = React.useCallback(() => {
    setCurrentIndex(0);
    setState("playing");
    emit("view");
  }, [emit]);

  const advance = React.useCallback(() => {
    setState("transitioning");
    const delay = reduceMotion ? 0 : 220;
    setTimeout(() => {
      setCurrentIndex((i) => {
        const next = i + 1;
        if (next >= totalSteps) {
          setState("completed");
          emit("complete");
          return i;
        }
        emit("step_seen", { stepId: steps[next]?.id });
        return next;
      });
      setState("playing");
    }, delay);
  }, [emit, steps, totalSteps, reduceMotion]);

  const previous = React.useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
    setState("playing");
  }, []);

  const restart = React.useCallback(() => {
    setCurrentIndex(0);
    setState("playing");
    emit("view");
  }, [emit]);

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
        setState("idle");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, previous, start, state]);

  if (state === "idle") {
    return (
      <section
        className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8"
        aria-label={demo.title}
      >
        <div className="max-w-md text-center">
          <h1 className="mb-3 text-3xl font-bold">{demo.title}</h1>
          {demo.description ? (
            <p className="text-muted-foreground">{demo.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={start}
          aria-label={
            locale === "pt-BR"
              ? "Iniciar demonstração interativa"
              : "Start interactive demo"
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
      ? `Step ${currentIndex + 1} de ${totalSteps}: ${currentStep.caption || currentStep.sourceTitle || ""}`
      : `Step ${currentIndex + 1} of ${totalSteps}: ${currentStep.caption || currentStep.sourceTitle || ""}`;

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
                ? `Step ${currentIndex + 1} de ${totalSteps}`
                : `Step ${currentIndex + 1} of ${totalSteps}`
            }
          >
            {currentIndex + 1} / {totalSteps}
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
          disabled={state !== "playing"}
        />
      </div>

      {currentStep.caption ? (
        <footer className="border-t border-border bg-background px-4 py-3">
          <p className="text-sm">{currentStep.caption}</p>
        </footer>
      ) : null}

      {state === "completed" && demo.finalCta ? (
        <FinalCta cta={demo.finalCta} locale={locale} />
      ) : null}
    </section>
  );
}

function FinalCta({
  cta,
  locale,
}: {
  cta: NonNullable<DemoPlayerDemo["finalCta"]>;
  locale: "pt-BR" | "en";
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
        aria-label={
          locale === "pt-BR"
            ? `Ação final: ${cta.label}`
            : `Final action: ${cta.label}`
        }
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