import * as React from "react";
import { Hotspot } from "./Hotspot";
import { Tooltip } from "./Tooltip";
import { type PlayerState } from "./state-machine";
import type { DemoEvent } from "./events";
import "./styles.css";

export type DemoData = {
  id: string;
  title: string;
  description?: string;
  language?: "pt-BR" | "en";
};

export type StepData = {
  id: string;
  position: number;
  screenshotUrl: string;
  sourceTitle?: string;
  caption?: string;
  hotspot: {
    type: "pointer" | "callout" | "area";
    x: number;
    y: number;
    w?: number;
    h?: number;
    label?: string;
  };
};

export type DemoPlayerProps = {
  demo: DemoData;
  steps: StepData[];
  locale?: "pt-BR" | "en";
  onEvent?: (e: DemoEvent) => void;
};

export function DemoPlayer({
  demo,
  steps,
  locale = "pt-BR",
  onEvent,
}: DemoPlayerProps) {
  const [state, setState] = React.useState<PlayerState>("idle");
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const emit = React.useCallback(
    (type: DemoEvent["type"], extra: Partial<DemoEvent> = {}) => {
      const step = steps[currentIndex];
      const event: DemoEvent = {
        type,
        demoId: demo.id,
        stepId: step?.id,
        ts: Date.now(),
        ...extra,
      };
      onEvent?.(event);
    },
    [demo.id, steps, currentIndex, onEvent],
  );

  const start = () => {
    setCurrentIndex(0);
    setState("playing");
    emit("view");
  };

  const advance = () => {
    setState("transitioning");
    setTimeout(() => {
      setCurrentIndex((i) => {
        const next = i + 1;
        if (next >= steps.length) {
          setState("completed");
          emit("complete");
          return i;
        }
        emit("step_seen", { stepId: steps[next]?.id });
        return next;
      });
      setState("playing");
    }, 200);
  };

  const currentStep = steps[currentIndex];

  if (state === "idle" || !currentStep) {
    return (
      <section className="dbr-player dbr-player--idle">
        <h1 className="dbr-player__title">{demo.title}</h1>
        {demo.description ? (
          <p className="dbr-player__desc">{demo.description}</p>
        ) : null}
        <button
          type="button"
          onClick={start}
          className="dbr-player__btn dbr-player__btn--primary"
        >
          {locale === "pt-BR" ? "Iniciar demo" : "Start demo"}
        </button>
      </section>
    );
  }

  return (
    <section className="dbr-player" aria-label={demo.title}>
      <header className="dbr-player__topbar">
        <span className="dbr-player__title">{demo.title}</span>
        <span className="dbr-player__counter">
          {currentIndex + 1} / {steps.length}
        </span>
      </header>

      <div className="dbr-player__stage">
        <img
          src={currentStep.screenshotUrl}
          alt={currentStep.caption ?? currentStep.sourceTitle ?? ""}
          className={`dbr-player__img ${state === "transitioning" ? "is-fading" : ""}`}
        />
        <Hotspot
          geometry={currentStep.hotspot}
          stepId={currentStep.id}
          onActivate={advance}
          disabled={state !== "playing"}
        />
        {currentStep.hotspot.label ? (
          <Tooltip geometry={currentStep.hotspot}>
            {currentStep.hotspot.label}
          </Tooltip>
        ) : null}
      </div>

      {currentStep.caption ? (
        <footer className="dbr-player__caption">{currentStep.caption}</footer>
      ) : null}
    </section>
  );
}