"use client";

import { useTranslate } from "@/lib/i18n";
import type { Hotspot, HotspotType } from "@easydemo/shared";
import { Plus } from "lucide-react";
import * as React from "react";

/**
 * HotspotPicker — overlay interativo sobre a screenshot do step.
 *
 * - Renderiza a imagem como background.
 * - Click em área vazia → cria novo hotspot (pointer por default).
 * - Click em hotspot existente → seleciona para edição.
 * - Suporta drag dos hotspots pointer/callout (posição livre) e
 *   resize dos hotspots area (canto inferior-direito).
 * - Emite via onChange com a lista atualizada de hotspots.
 *
 * Mantemos uma estrutura de "hotspots extras" além do `step.hotspot`
 * canônico (que é sempre 1). Esses extras ficam locais ao editor até
 * serem persistidos (v2). Para o MVP, editamos APENAS o hotspot canônico
 * do step selecionado — múltiplos hotspots ficam como roadmap.
 */

export type HotspotPickerHotspot = Hotspot & { id: string };

export type HotspotPickerProps = {
  screenshotUrl: string;
  hotspots: HotspotPickerHotspot[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (geometry: {
    type: HotspotType;
    x: number;
    y: number;
    w?: number;
    h?: number;
  }) => void;
  onUpdate: (id: string, patch: Partial<HotspotPickerHotspot>) => void;
  onDelete: (id: string) => void;
  /** Quando true, força pointer (não permite area no MVP). */
  readOnly?: boolean;
};

type DragState =
  | { kind: "move"; id: string; offsetX: number; offsetY: number }
  | { kind: "resize"; id: string; startW: number; startH: number }
  | null;

export function HotspotPicker({
  screenshotUrl,
  hotspots,
  selectedId,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
  readOnly = false,
}: HotspotPickerProps): React.ReactElement {
  const t = useTranslate();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = React.useState<DragState>(null);
  const [hoverId, setHoverId] = React.useState<string | null>(null);

  /**
   * Click no container: se não clicou num hotspot existente, cria novo
   * pointer hotspot na posição fracionária (0-100).
   */
  const handleContainerClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (readOnly) return;
      if (drag) return;
      const target = event.target as HTMLElement;
      if (target.closest("[data-hotspot]")) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      onCreate({ type: "pointer", x, y });
    },
    [drag, onCreate, readOnly],
  );

  /**
   * Início do drag (mover pointer/callout).
   */
  const startMove = React.useCallback(
    (id: string, event: React.PointerEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const target = event.currentTarget;
      const targetRect = target.getBoundingClientRect();
      setDrag({
        kind: "move",
        id,
        offsetX: event.clientX - targetRect.left,
        offsetY: event.clientY - targetRect.top,
      });
      onSelect(id);
    },
    [onSelect],
  );

  const startResize = React.useCallback(
    (id: string, event: React.PointerEvent<HTMLDivElement>) => {
      event.stopPropagation();
      const hot = hotspots.find((h) => h.id === id);
      if (!hot) return;
      setDrag({ kind: "resize", id, startW: hot.geometry.w ?? 20, startH: hot.geometry.h ?? 10 });
      onSelect(id);
    },
    [hotspots, onSelect],
  );

  // Pointer move/up listeners globais para drag.
  React.useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const hot = hotspots.find((h) => h.id === drag.id);
      if (!hot) return;
      if (drag.kind === "move") {
        const x = ((e.clientX - rect.left - drag.offsetX) / rect.width) * 100;
        const y = ((e.clientY - rect.top - drag.offsetY) / rect.height) * 100;
        onUpdate(drag.id, {
          geometry: {
            ...hot.geometry,
            x: clamp(x, 0, 100),
            y: clamp(y, 0, 100),
          },
        });
      } else if (drag.kind === "resize") {
        const startRect = rect;
        const dx = (e.clientX - startRect.left) / startRect.width;
        const dy = (e.clientY - startRect.top) / startRect.height;
        const baseX = (hot.geometry.x / 100) * startRect.width;
        const baseY = (hot.geometry.y / 100) * startRect.height;
        const newW = clamp(dx * 100 - hot.geometry.x, 4, 100 - hot.geometry.x);
        const newH = clamp(dy * 100 - hot.geometry.y, 4, 100 - hot.geometry.y);
        onUpdate(drag.id, {
          geometry: {
            ...hot.geometry,
            w: newW,
            h: newH,
          },
        });
        // silence unused var warnings
        void baseX;
        void baseY;
      }
    };
    const onUp = () => setDrag(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, hotspots, onUpdate]);

  // Esc limpa seleção.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedId) {
        onSelect(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, onSelect]);

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative h-full w-full select-none overflow-hidden rounded-md border border-border bg-muted"
      role="application"
      aria-label={t("editor.canvas.addHotspot")}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={screenshotUrl}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain"
      />

      {hotspots.map((hot) => (
        <HotspotHandle
          key={hot.id}
          hotspot={hot}
          isSelected={hot.id === selectedId}
          isHovered={hot.id === hoverId}
          onMouseEnter={() => setHoverId(hot.id)}
          onMouseLeave={() => setHoverId(null)}
          onSelect={() => onSelect(hot.id)}
          onPointerDown={(e) => startMove(hot.id, e)}
          onResizeStart={(e) => startResize(hot.id, e)}
          onDelete={() => onDelete(hot.id)}
          readOnly={readOnly}
        />
      ))}

      {!readOnly ? (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
          <Plus className="-mt-0.5 mr-1 inline h-3 w-3" />
          {t("editor.canvas.addHotspot")}
        </div>
      ) : null}
    </div>
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

// ─────────── Hotspot visual handle ───────────

type HotspotHandleProps = {
  hotspot: HotspotPickerHotspot;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onResizeStart: (e: React.PointerEvent<HTMLDivElement>) => void;
  onDelete: () => void;
  readOnly: boolean;
};

function HotspotHandle({
  hotspot,
  isSelected,
  isHovered,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  onPointerDown,
  onResizeStart,
  onDelete,
  readOnly,
}: HotspotHandleProps): React.ReactElement {
  const t = useTranslate();
  const baseColor = "var(--primary, hsl(220 90% 56%))";

  if (hotspot.type === "area" && hotspot.geometry.w && hotspot.geometry.h) {
    return (
      <button
        type="button"
        data-hotspot
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerEnter={onMouseEnter}
        onPointerLeave={onMouseLeave}
        aria-label={t("editor.canvas.editHotspot")}
        className={`absolute z-10 rounded-md border-2 transition-colors ${
          isSelected || isHovered
            ? "border-primary bg-primary/30"
            : "border-primary/60 bg-primary/10"
        }`}
        style={{
          left: `${hotspot.geometry.x}%`,
          top: `${hotspot.geometry.y}%`,
          width: `${hotspot.geometry.w}%`,
          height: `${hotspot.geometry.h}%`,
          borderColor: baseColor,
        }}
      >
        <span className="sr-only">{hotspot.label ?? t("editor.canvas.hotspotTypeArea")}</span>
        {isSelected && !readOnly ? (
          <span
            role="button"
            tabIndex={-1}
            onPointerDown={onResizeStart}
            onClick={(e) => e.stopPropagation()}
            className="absolute -bottom-2 -right-1 h-3 w-3 cursor-se-resize rounded-sm bg-primary"
          />
        ) : null}
        {isSelected && !readOnly ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={t("editor.canvas.deleteHotspot")}
            className="absolute -top-3 -right-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground shadow"
          >
            ×
          </button>
        ) : null}
      </button>
    );
  }

  // pointer / callout — círculo arrastável
  return (
    <button
      type="button"
      data-hotspot
      onPointerDown={onPointerDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerEnter={onMouseEnter}
      onPointerLeave={onMouseLeave}
      aria-label={t("editor.canvas.editHotspot")}
      className={`absolute z-10 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-colors ${
        isSelected || isHovered
          ? "scale-110 border-primary bg-primary/40"
          : "border-primary bg-primary/30"
      }`}
      style={{
        left: `${hotspot.geometry.x}%`,
        top: `${hotspot.geometry.y}%`,
        borderColor: baseColor,
      }}
    >
      <span className="sr-only">{hotspot.label ?? t("editor.canvas.hotspotTypePointer")}</span>
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
      />
      {isSelected && !readOnly ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={t("editor.canvas.deleteHotspot")}
          className="absolute -right-3 -top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground shadow"
        >
          ×
        </button>
      ) : null}
    </button>
  );
}

/**
 * Wrapper que gera um hotspot canônico a partir do step.
 * Centraliza a leitura/escrita no schema atual (1 hotspot por step).
 */
export function hotspotFromStep(step: {
  hotspot: Hotspot;
}): HotspotPickerHotspot {
  return {
    id: step.hotspot.id ?? "primary",
    type: step.hotspot.type,
    geometry: step.hotspot.geometry,
    action: step.hotspot.action,
    actionTarget: step.hotspot.actionTarget ?? null,
    label: step.hotspot.label ?? null,
  };
}
