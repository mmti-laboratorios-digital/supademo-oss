"use client";

import { useTranslate } from "@/lib/i18n";
import type { HotspotType, Step } from "@easydemo/shared";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  GitBranch,
  GripVertical,
  Image as ImageIcon,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import * as React from "react";

/**
 * StepList — sidebar esquerda do editor.
 * - Lista vertical de steps com drag-and-drop reordering via @dnd-kit.
 * - Cada step: handle de drag, ícone de tipo, badge com # hotspots,
 *   título editável, botões mover/remover/duplicar.
 * - Click seleciona step; botão "+" entre steps para adicionar.
 */

export type StepListProps = {
  steps: Step[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onUpdate: (id: string, patch: Partial<Step>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddStep?: () => void;
  /** Quando o step contém hotspots do tipo "branch" — UI muda o ícone. */
  detectBranching?: (step: Step) => boolean;
  /** Quando o step foi inserido como slide (vs screenshot). */
  detectSlide?: (step: Step) => boolean;
};

export function StepList({
  steps,
  selectedId,
  onSelect,
  onReorder,
  onUpdate,
  onRemove,
  onDuplicate,
  onAddStep,
  detectBranching,
  detectSlide,
}: StepListProps): React.ReactElement {
  const t = useTranslate();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const fromIndex = steps.findIndex((s) => s.id === active.id);
      const toIndex = steps.findIndex((s) => s.id === over.id);
      if (fromIndex < 0 || toIndex < 0) return;
      onReorder(fromIndex, toIndex);
    },
    [steps, onReorder],
  );

  const ids = React.useMemo(() => steps.map((s) => s.id), [steps]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">
          {t("editor.step")}s ({steps.length})
        </h2>
        {onAddStep ? (
          <button
            type="button"
            onClick={onAddStep}
            aria-label={t("editor.addStep")}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3 w-3" />
            {t("common.create")}
          </button>
        ) : null}
      </div>

      {steps.length === 0 ? (
        <div className="m-4 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <p>{t("editor.noSteps")}</p>
          <p className="mt-1 text-xs">{t("editor.captureHint")}</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ol className="flex-1 overflow-y-auto p-2" aria-label={t("editor.step") + "s"}>
              {steps.map((step, index) => (
                <SortableStepRow
                  step={step}
                  index={index}
                  isSelected={step.id === selectedId}
                  onSelect={() => onSelect(step.id)}
                  onTitleChange={(title) => onUpdate(step.id, { sourceTitle: title })}
                  onMoveUp={() => index > 0 && onReorder(index, index - 1)}
                  onMoveDown={() => index < steps.length - 1 && onReorder(index, index + 1)}
                  onRemove={() => onRemove(step.id)}
                  onDuplicate={() => onDuplicate(step.id)}
                  isBranching={detectBranching?.(step) ?? false}
                  isSlide={detectSlide?.(step) ?? false}
                  key={step.id}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

// ─────────── Sortable row ───────────

type SortableStepRowProps = {
  step: Step;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onTitleChange: (title: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  isBranching: boolean;
  isSlide: boolean;
};

function SortableStepRow({
  step,
  index,
  isSelected,
  onSelect,
  onTitleChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  onDuplicate,
  isBranching,
  isSlide,
}: SortableStepRowProps): React.ReactElement {
  const t = useTranslate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Hotspot count para badge — no schema atual há 1 hotspot por step,
  // mas a UI já trata múltiplos via contagem.
  const hotspotCount = 1;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group mb-2 flex flex-col rounded-md border bg-card text-card-foreground transition-colors ${
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/40"
      }`}
    >
      <div className="flex items-stretch gap-1 p-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={t("editor.dragHandle")}
          className="touch-none cursor-grab rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onSelect}
          aria-pressed={isSelected}
          aria-label={t("editor.stepNumber", { position: index + 1 })}
          className="flex flex-1 items-center gap-2 rounded p-1 text-left"
        >
          <StepTypeIcon type={isBranching ? "branching" : isSlide ? "slide" : "screenshot"} />
          <span className="flex-1 truncate text-sm">{step.sourceTitle ?? step.sourceUrl}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {t("editor.stepHotspotBadge", { count: hotspotCount })}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-1 border-t border-border/50 px-2 py-1">
        <input
          value={step.sourceTitle ?? ""}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t("editor.stepNumber", { position: index + 1 })}
          aria-label={t("editor.stepEditCaption")}
          className="flex-1 bg-transparent px-1 text-xs outline-none placeholder:text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          aria-label={t("editor.stepMoveUp")}
          className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          aria-label={t("editor.stepMoveDown")}
          className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          aria-label={t("editor.stepDuplicate")}
          className="rounded p-1 text-muted-foreground hover:bg-muted"
        >
          <Copy className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("editor.stepDelete")}
          className="rounded p-1 text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </li>
  );
}

// ─────────── Step type icon ───────────

type StepKind = "screenshot" | "slide" | "branching";

function StepTypeIcon({
  type,
}: {
  type: StepKind;
}): React.ReactElement {
  const t = useTranslate();
  const label =
    type === "branching"
      ? t("editor.stepTypeBranching")
      : type === "slide"
        ? t("editor.stepTypeSlide")
        : t("editor.stepTypeScreenshot");
  const Icon = type === "branching" ? GitBranch : type === "slide" ? Layers : ImageIcon;
  return (
    <span
      title={label}
      aria-label={label}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground"
    >
      <Icon className="h-3 w-3" />
    </span>
  );
}

// Re-export type para consumidores que precisem detectar kind.
export type { StepKind };

/**
 * Helper puro: dado um step, conta quantos hotspots (schema legado tem 1,
 * mas mantemos estrutura extensível para lista de hotspots).
 */
export function countHotspots(step: Step): number {
  if (!step.hotspot) return 0;
  return 1;
}

/**
 * Helper puro: detecta se o step é "branching" pela action do hotspot.
 * Não é exportado como prop default porque a UI do editor atual usa
 * action="branch" via LeadFormEditor/BranchingEditor.
 */
export function isBranchingStep(step: Step): boolean {
  return step.hotspot?.action === "branch";
}

/**
 * Helper puro: detecta se o step é "slide" (sem sourceUrl real).
 */
export function isSlideStep(step: Step): boolean {
  return !step.sourceUrl || step.sourceUrl.startsWith("slide://");
}

/**
 * Map de ícones para o canvas — re-exportado para StepCanvas.
 */
export const HotspotTypeIcon: Record<HotspotType, typeof ImageIcon> = {
  pointer: ImageIcon,
  callout: ImageIcon,
  area: ImageIcon,
};
