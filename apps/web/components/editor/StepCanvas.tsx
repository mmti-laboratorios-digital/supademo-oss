"use client";

import * as React from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  Move,
} from "lucide-react";
import {
  HotspotPicker,
  hotspotFromStep,
  type HotspotPickerHotspot,
} from "./HotspotPicker";
import type { Step, HotspotType } from "@demo.br/shared";
import { useTranslate } from "@/lib/i18n";

/**
 * StepCanvas — container central do editor.
 *
 * - Toolbar: zoom (50/75/100/125/150%), pan toggle, fullscreen, rotate.
 * - Alterna entre HotspotPicker (modo edição) e preview read-only.
 * - Em read-only, mostra o screenshot com o hotspot renderizado como no player.
 * - prefers-reduced-motion desativa transições de zoom/pan.
 */

export type StepCanvasProps = {
  step: Step | null;
  mode: "edit" | "preview";
  selectedHotspotId: string | null;
  onSelectHotspot: (id: string | null) => void;
  onCreateHotspot: (geometry: {
    type: HotspotType;
    x: number;
    y: number;
    w?: number;
    h?: number;
  }) => void;
  onUpdateHotspot: (id: string, patch: Partial<HotspotPickerHotspot>) => void;
  onDeleteHotspot: (id: string) => void;
  /** URL da screenshot do step (com fallback R2 → /_static/...). */
  screenshotUrl: string;
};

const ZOOM_STEPS = [50, 75, 100, 125, 150] as const;
type ZoomLevel = (typeof ZOOM_STEPS)[number];

export function StepCanvas({
  step,
  mode,
  selectedHotspotId,
  onSelectHotspot,
  onCreateHotspot,
  onUpdateHotspot,
  onDeleteHotspot,
  screenshotUrl,
}: StepCanvasProps): React.ReactElement {
  const t = useTranslate();
  const [zoom, setZoom] = React.useState<ZoomLevel>(100);
  const [panMode, setPanMode] = React.useState(false);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [rotation, setRotation] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // prefers-reduced-motion — desativa animação de zoom.
  const [reduceMotion, setReduceMotion] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Fullscreen API.
  const toggleFullscreen = React.useCallback(async () => {
    const node = containerRef.current;
    if (!node) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setFullscreen(false);
      } else {
        await node.requestFullscreen();
        setFullscreen(true);
      }
    } catch (err) {
      // Browser pode bloquear (user gesture ausente) — silencioso
      console.warn("[canvas] fullscreen failed:", err);
    }
  }, []);

  // Detecta saída de fullscreen via Esc.
  React.useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const hotspots: HotspotPickerHotspot[] = React.useMemo(
    () => (step ? [hotspotFromStep(step)] : []),
    [step],
  );

  const transitionClass = reduceMotion
    ? ""
    : "transition-[transform] duration-200 ease-out";

  return (
    <div
      ref={containerRef}
      className={`flex h-full flex-col bg-background ${
        fullscreen ? "p-0" : "rounded-lg border border-border"
      }`}
      role="region"
      aria-label={t("editor.canvas.addHotspot")}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label={t("editor.canvas.zoom")}
        >
          <button
            type="button"
            onClick={() => {
              const idx = ZOOM_STEPS.indexOf(zoom);
              if (idx > 0) setZoom(ZOOM_STEPS[idx - 1] ?? 100);
            }}
            disabled={zoom === ZOOM_STEPS[0]}
            aria-label={t("editor.canvas.zoom") + " -"
            }
            className="rounded p-1 hover:bg-muted disabled:opacity-30"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] text-center text-xs font-medium">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => {
              const idx = ZOOM_STEPS.indexOf(zoom);
              if (idx < ZOOM_STEPS.length - 1) setZoom(ZOOM_STEPS[idx + 1] ?? 100);
            }}
            disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]}
            aria-label={t("editor.canvas.zoom") + " +"}
            className="rounded p-1 hover:bg-muted disabled:opacity-30"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          {ZOOM_STEPS.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setZoom(z)}
              aria-pressed={zoom === z}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                zoom === z
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {z}%
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1" role="group" aria-label="tools">
          <button
            type="button"
            onClick={() => setPanMode((v) => !v)}
            aria-pressed={panMode}
            aria-label={t("editor.canvas.pan")}
            className={`rounded p-1 ${
              panMode
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <Move className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            aria-label={t("editor.canvas.rotate")}
            className="rounded p-1 hover:bg-muted"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={
              fullscreen
                ? t("editor.canvas.exitFullscreen")
                : t("editor.canvas.fullscreen")
            }
            className="rounded p-1 hover:bg-muted"
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className={`relative flex flex-1 items-center justify-center overflow-auto ${
          panMode ? "cursor-grab" : ""
        }`}
      >
        {!step ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            {t("editor.noSteps")}
          </div>
        ) : mode === "edit" ? (
          <div
            className={`relative ${transitionClass}`}
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
              width: "min(100%, 1280px)",
              aspectRatio: "16/10",
            }}
          >
            <HotspotPicker
              screenshotUrl={screenshotUrl}
              hotspots={hotspots}
              selectedId={selectedHotspotId}
              onSelect={onSelectHotspot}
              onCreate={onCreateHotspot}
              onUpdate={onUpdateHotspot}
              onDelete={onDeleteHotspot}
            />
          </div>
        ) : (
          <PreviewStep step={step} zoom={zoom} rotation={rotation} />
        )}
      </div>
    </div>
  );
}

/**
 * Preview read-only do step (sem UI de edição).
 * Reusa HotspotPicker com readOnly=true; cliente externo pode customizar
 * passando o `HotspotOverlay` do player se quiser fidelidade exata.
 */
function PreviewStep({
  step,
  zoom,
  rotation,
}: {
  step: Step;
  zoom: number;
  rotation: number;
}): React.ReactElement {
  const t = useTranslate();
  const [reduceMotion, setReduceMotion] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
  }, []);

  return (
    <div
      className={`relative ${reduceMotion ? "" : "transition-[transform] duration-200 ease-out"}`}
      style={{
        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
        transformOrigin: "center center",
        width: "min(100%, 1280px)",
        aspectRatio: "16/10",
      }}
    >
      <HotspotPicker
        screenshotUrl={step.screenshotUrl ?? ""}
        hotspots={[hotspotFromStep(step)]}
        selectedId={null}
        onSelect={() => {
          /* preview-only */
        }}
        onCreate={() => {
          /* preview-only */
        }}
        onUpdate={() => {
          /* preview-only */
        }}
        onDelete={() => {
          /* preview-only */
        }}
        readOnly
      />
      <span className="sr-only">{t("editor.preview")}</span>
    </div>
  );
}