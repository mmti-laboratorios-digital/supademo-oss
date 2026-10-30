"use client";

import { Button } from "@/components/ui/button";
import { useTranslate } from "@/lib/i18n";
import type { Demo, FinalCta, Hotspot, HotspotType, Step } from "@easydemo/shared";
import { AlertCircle, Eye, Save } from "lucide-react";
import * as React from "react";
import { z } from "zod";
import { BranchingEditor } from "./BranchingEditor";
import { CtaEditor } from "./CtaEditor";
import { HotspotPicker, type HotspotPickerHotspot, hotspotFromStep } from "./HotspotPicker";
import { LeadFormEditor } from "./LeadFormEditor";
import { PublishPanel } from "./PublishPanel";
import { StepCanvas } from "./StepCanvas";
import { StepList } from "./StepList";
import { ThemeEditor } from "./ThemeEditor";
import { VariablesEditor } from "./VariablesEditor";

/**
 * DemoEditor — orquestrador do editor.
 *
 * Layout 3 colunas (sidebar steps + canvas central + painel direito).
 * Auto-save com debounce (2s) chamando server actions.
 * Indicador visual: saved / saving / error.
 * Pré-visualização "Play" abre `/d/[slug]?preview=editor` em nova aba.
 *
 * Validação: cada bloco de edição roda contra schemas zod antes de chamar
 * o autoSave; falha fica visível no badge de status.
 */

// ─────────── Schemas ───────────

const titleSchema = z.object({
  title: z.string().min(3).max(180),
  description: z.string().max(2000).optional().default(""),
  language: z.enum(["pt-BR", "en"]),
});

const hotspotGeometrySchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  w: z.number().min(0).max(100).optional(),
  h: z.number().min(0).max(100).optional(),
});

const hotspotSchema = z.object({
  type: z.enum(["pointer", "callout", "area"]),
  geometry: hotspotGeometrySchema,
  action: z.enum(["next", "branch", "url", "form"]),
  actionTarget: z.record(z.unknown()).nullable().optional(),
  label: z.string().nullable().optional(),
});

// ─────────── Types ───────────

type SaveStatus = "idle" | "saving" | "saved" | "error";

type EditorTab = "steps" | "theme" | "leadForm" | "cta" | "variables" | "branching" | "publish";

export type DemoEditorProps = {
  demo: Pick<
    Demo,
    "id" | "title" | "description" | "finalCta" | "language" | "status" | "slug" | "leadFormEnabled"
  >;
  initialSteps: Step[];
  workspaceSlug?: string;
  workspacePlan?: "free" | "pro" | "business";
  versions?: Array<{
    id: string;
    number: number;
    publishedAt: string;
    publishedBy: string;
  }>;
  currentVersion?: number | null;
  initialVariables?: Array<{ key: string; defaultValue: string; description?: string }>;
  initialBranching?: {
    question: string;
    options: Array<{ id: string; label: string; targetStepId: string | null }>;
  };
};

// ─────────── Component ───────────

const AUTOSAVE_DELAY_MS = 2000;

export function DemoEditor({
  demo,
  initialSteps,
  workspaceSlug = "workspace",
  workspacePlan = "pro",
  versions = [],
  currentVersion = null,
  initialVariables = [],
  initialBranching,
}: DemoEditorProps): React.ReactElement {
  const t = useTranslate();

  // Core state
  const [steps, setSteps] = React.useState<Step[]>(initialSteps);
  const [title, setTitle] = React.useState(demo.title);
  const [description, setDescription] = React.useState(demo.description ?? "");
  const [language] = React.useState<"pt-BR" | "en">(demo.language);

  const [finalCtaState, setFinalCta] = React.useState<FinalCta | null>(demo.finalCta);

  // Editor selection
  const [selectedStepId, setSelectedStepId] = React.useState<string | null>(
    initialSteps[0]?.id ?? null,
  );
  const [selectedHotspotId, setSelectedHotspotId] = React.useState<string | null>("primary");
  const [tab, setTab] = React.useState<EditorTab>("steps");

  // Save state
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const [lastError, setLastError] = React.useState<string | null>(null);

  // Lead form local state (Pro)
  const leadFormInitial: {
    enabled: boolean;
    fields: Array<{
      id: "name" | "email" | "phone" | "company";
      required: boolean;
      enabled: boolean;
    }>;
    consentText: string;
  } = React.useMemo(
    () => ({
      enabled: demo.leadFormEnabled,
      fields: [
        { id: "name", required: true, enabled: true },
        { id: "email", required: true, enabled: true },
        { id: "phone", required: false, enabled: false },
        { id: "company", required: false, enabled: false },
      ],
      consentText: "",
    }),
    [demo.leadFormEnabled],
  );
  const [leadForm, setLeadForm] = React.useState(leadFormInitial);

  // Theme (Pro)
  const [theme, setTheme] = React.useState<{
    primary: string;
    bg: string;
    text: string;
    font: "inter" | "sora" | "roboto" | "system";
    borderRadius: number;
  }>({
    primary: "#2563eb",
    bg: "#ffffff",
    text: "#0b1220",
    font: "inter",
    borderRadius: 8,
  });

  // Variables (Business)
  const [variables, setVariables] = React.useState(initialVariables);

  // Branching (Business)
  const [branching, setBranching] = React.useState(
    initialBranching ?? { question: "", options: [] },
  );

  // Publish panel
  const [publishState, setPublishState] = React.useState<PublishPanelStateLocal>({
    slug: demo.slug,
    slugTaken: false,
    coverR2Key: null,
    visibility: "public",
    password: "",
    status: demo.status === "published" ? "published" : "draft",
    currentVersion,
    versions,
  });

  const selectedStep = React.useMemo(
    () => steps.find((s) => s.id === selectedStepId) ?? null,
    [steps, selectedStepId],
  );

  const screenshotUrl = React.useMemo(() => {
    if (!selectedStep) return "";
    if (selectedStep.screenshotUrl) return selectedStep.screenshotUrl;
    return `/_static/${selectedStep.screenshotR2Key}`;
  }, [selectedStep]);

  // ─────────── Mutations ───────────

  const updateStep = React.useCallback((id: string, patch: Partial<Step>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const handleReorder = React.useCallback((from: number, to: number) => {
    setSteps((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      if (!moved) return prev;
      next.splice(to, 0, moved);
      return next.map((s, i) => ({ ...s, position: i + 1 }));
    });
  }, []);

  const handleRemoveStep = React.useCallback(
    (id: string) => {
      setSteps((prev) =>
        prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, position: i + 1 })),
      );
      if (selectedStepId === id) setSelectedStepId(null);
    },
    [selectedStepId],
  );

  const handleDuplicateStep = React.useCallback((id: string) => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const original = prev[idx];
      if (!original) return prev;
      const dup: Step = {
        ...original,
        id: crypto.randomUUID(),
        position: idx + 2,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, dup);
      return next.map((s, i) => ({ ...s, position: i + 1 }));
    });
  }, []);

  // Hotspot CRUD on selected step
  const updateStepHotspot = React.useCallback((id: string, patch: Partial<Hotspot>) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          hotspot: { ...s.hotspot, ...patch },
        };
      }),
    );
  }, []);

  const handleCreateHotspot = React.useCallback(
    (geometry: { type: HotspotType; x: number; y: number; w?: number; h?: number }) => {
      if (!selectedStep) return;
      updateStepHotspot(selectedStep.id, {
        type: geometry.type,
        geometry: {
          x: geometry.x,
          y: geometry.y,
          w: geometry.w,
          h: geometry.h,
        },
        action: "next",
        actionTarget: null,
        label: null,
      });
      setSelectedHotspotId("primary");
    },
    [selectedStep, updateStepHotspot],
  );

  const handleUpdateHotspot = React.useCallback(
    (_id: string, patch: Partial<HotspotPickerHotspot>) => {
      if (!selectedStep) return;
      const geom = patch.geometry ? { ...patch.geometry } : selectedStep.hotspot.geometry;
      const merged: Hotspot = {
        ...selectedStep.hotspot,
        ...patch,
        geometry: geom,
      };
      const parsed = hotspotSchema.safeParse(merged);
      if (!parsed.success) return;
      updateStepHotspot(selectedStep.id, parsed.data);
    },
    [selectedStep, updateStepHotspot],
  );

  const handleDeleteHotspot = React.useCallback(
    (_id: string) => {
      if (!selectedStep) return;
      // Reset to default central pointer.
      updateStepHotspot(selectedStep.id, {
        type: "pointer",
        geometry: { x: 50, y: 50 },
        action: "next",
        actionTarget: null,
        label: null,
      });
      setSelectedHotspotId(null);
    },
    [selectedStep, updateStepHotspot],
  );

  // ─────────── Auto-save (debounced) ───────────

  const autosaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = React.useRef(true);

  const performSave = React.useCallback(async () => {
    setSaveStatus("saving");
    setLastError(null);

    // Validate title block
    const titleParsed = titleSchema.safeParse({
      title,
      description,
      language,
    });
    if (!titleParsed.success) {
      setSaveStatus("error");
      setLastError(t("errors.generic"));
      return;
    }

    // Validate final CTA
    if (finalCtaState) {
      const ctaResult = z
        .object({
          type: z.enum(["whatsapp", "url", "email"]),
          value: z.string().min(1).max(500),
          label: z.string().min(1).max(80),
        })
        .safeParse(finalCtaState);
      if (!ctaResult.success) {
        setSaveStatus("error");
        setLastError(t("errors.generic"));
        return;
      }
    }

    try {
      const res = await fetch(`/api/v1/demos/${demo.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: titleParsed.data.title,
          description: titleParsed.data.description,
          language: titleParsed.data.language,
          leadFormEnabled: leadForm.enabled,
          finalCta: finalCtaState,
          variables,
          branching,
          theme,
          publish: publishState,
          steps: steps.map((s) => ({
            id: s.id,
            position: s.position,
            sourceTitle: s.sourceTitle,
            caption: s.caption,
            hotspot: s.hotspot,
          })),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status.toString()}`);

      setSaveStatus("saved");
      setSavedAt(new Date());
    } catch (err) {
      console.error("[autosave]", err);
      setSaveStatus("error");
      setLastError(err instanceof Error ? err.message : t("errors.generic"));
    }
  }, [
    demo.id,
    title,
    description,
    language,
    finalCtaState,
    leadForm.enabled,
    variables,
    branching,
    theme,
    publishState,
    steps,
    t,
  ]);

  React.useEffect(() => {
    // Não dispara auto-save no primeiro mount (estado inicial já está "salvo").
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void performSave();
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [
    title,
    description,
    steps,
    finalCtaState,
    leadForm,
    theme,
    variables,
    branching,
    publishState,
    performSave,
  ]);

  // ─────────── Publish actions ───────────

  const handlePublish = React.useCallback(async () => {
    await performSave();
    try {
      const res = await fetch(`/api/v1/demos/${demo.id}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: publishState.slug,
          visibility: publishState.visibility,
          password: publishState.password || null,
          coverR2Key: publishState.coverR2Key,
        }),
      });
      if (!res.ok) throw new Error("Publish failed");
      setPublishState((s) => ({ ...s, status: "published" }));
    } catch (err) {
      setSaveStatus("error");
      setLastError(err instanceof Error ? err.message : t("errors.generic"));
    }
  }, [performSave, demo.id, publishState, t]);

  const handleUnpublish = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/demos/${demo.id}/unpublish`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Unpublish failed");
      setPublishState((s) => ({ ...s, status: "draft" }));
    } catch (err) {
      setSaveStatus("error");
      setLastError(err instanceof Error ? err.message : t("errors.generic"));
    }
  }, [demo.id, t]);

  const handlePublishVersion = React.useCallback(async () => {
    await performSave();
    try {
      const res = await fetch(`/api/v1/demos/${demo.id}/versions`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Version publish failed");
      // Atualiza lista local (re-fetch pode ser feito em prod)
    } catch (err) {
      setSaveStatus("error");
      setLastError(err instanceof Error ? err.message : t("errors.generic"));
    }
  }, [performSave, demo.id, t]);

  // ─────────── Render ───────────

  return (
    <div
      className="flex h-[calc(100dvh-3.5rem)] flex-col"
      data-editor-root
      aria-label={t("editor.title")}
    >
      {/* Top header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
        <div className="flex flex-1 items-center gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full max-w-xl bg-transparent text-xl font-bold outline-none placeholder:text-muted-foreground"
            placeholder="Título da demo"
            aria-label={t("editor.title")}
          />
        </div>
        <div className="flex items-center gap-3">
          <SaveBadge status={saveStatus} savedAt={savedAt} error={lastError} />
          <Button asChild variant="outline" size="sm" aria-label={t("editor.previewInNewTab")}>
            <a
              href={`/d/${publishState.slug}?preview=editor`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Eye className="h-4 w-4" />
              {t("editor.preview")}
            </a>
          </Button>
          <Button
            variant={publishState.status === "published" ? "outline" : "default"}
            size="sm"
            onClick={() =>
              publishState.status === "published"
                ? void handlePublishVersion()
                : void handlePublish()
            }
            disabled={saveStatus === "saving"}
          >
            {publishState.status === "published"
              ? t("editor.publish.publishVersionButton")
              : t("editor.publish.publishButton")}
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <nav
        role="tablist"
        aria-label={t("editor.title")}
        className="flex flex-wrap gap-1 border-b border-border bg-muted/40 px-4 py-1 text-xs"
      >
        {(
          ["steps", "theme", "leadForm", "cta", "variables", "branching", "publish"] as EditorTab[]
        ).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-t-md px-3 py-1.5 font-medium transition-colors ${
              tab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`editor.tabs.${id}`)}
          </button>
        ))}
      </nav>

      {/* Body — depends on selected tab */}
      <div className="flex flex-1 overflow-hidden">
        {tab === "steps" ? (
          <>
            <aside className="w-72 shrink-0 border-r border-border bg-muted/20">
              <StepList
                steps={steps}
                selectedId={selectedStepId}
                onSelect={setSelectedStepId}
                onReorder={handleReorder}
                onUpdate={updateStep}
                onRemove={handleRemoveStep}
                onDuplicate={handleDuplicateStep}
              />
            </aside>

            <main className="flex-1 overflow-hidden p-4">
              <StepCanvas
                step={selectedStep}
                mode="edit"
                selectedHotspotId={selectedHotspotId}
                onSelectHotspot={setSelectedHotspotId}
                onCreateHotspot={handleCreateHotspot}
                onUpdateHotspot={handleUpdateHotspot}
                onDeleteHotspot={handleDeleteHotspot}
                screenshotUrl={screenshotUrl}
              />
            </main>

            <aside className="w-80 shrink-0 overflow-y-auto border-l border-border bg-muted/20 p-4">
              {selectedStep ? (
                <StepInspector
                  step={selectedStep}
                  onCaptionChange={(c) => updateStep(selectedStep.id, { caption: c })}
                  onHotspotChange={(patch) => updateStepHotspot(selectedStep.id, patch)}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  {t("editor.noSteps")}
                </div>
              )}
            </aside>
          </>
        ) : (
          <main className="flex-1 overflow-y-auto p-4">
            {tab === "theme" ? (
              <ThemeEditor value={theme} onChange={setTheme} planId={workspacePlan} />
            ) : tab === "leadForm" ? (
              <LeadFormEditor
                value={leadForm}
                onChange={setLeadForm}
                workspaceName={workspaceSlug}
                locale={language}
                planId={workspacePlan}
              />
            ) : tab === "cta" ? (
              <CtaEditor
                value={
                  finalCtaState
                    ? {
                        type:
                          finalCtaState.type === "url"
                            ? "link"
                            : (finalCtaState.type as "whatsapp" | "link" | "email" | "calendly"),
                        value: finalCtaState.value,
                        label: finalCtaState.label,
                      }
                    : null
                }
                onChange={(cfg) =>
                  setFinalCta({
                    type: cfg.type === "link" ? "url" : cfg.type === "calendly" ? "url" : cfg.type,
                    value: cfg.value,
                    label: cfg.label,
                  })
                }
              />
            ) : tab === "variables" ? (
              <VariablesEditor value={variables} onChange={setVariables} planId={workspacePlan} />
            ) : tab === "branching" ? (
              <BranchingEditor
                value={branching}
                onChange={setBranching}
                steps={steps.map((s) => ({
                  id: s.id,
                  sourceTitle: s.sourceTitle ?? null,
                  position: s.position,
                }))}
                planId={workspacePlan}
              />
            ) : (
              <PublishPanel
                value={publishState}
                onChange={setPublishState}
                onPublish={() => void handlePublish()}
                onUnpublish={() => void handleUnpublish()}
                onPublishVersion={() => void handlePublishVersion()}
                publishing={saveStatus === "saving"}
                workspaceSlug={workspaceSlug}
              />
            )}
          </main>
        )}
      </div>

      {/* Hidden live region for screen readers announcing save status */}
      <div role="status" aria-live="polite" className="sr-only">
        {saveStatus === "saving"
          ? t("common.saving")
          : saveStatus === "saved"
            ? t("common.saved")
            : saveStatus === "error"
              ? (lastError ?? t("common.error"))
              : ""}
      </div>
    </div>
  );
}

// ─────────── Sub-components ───────────

function SaveBadge({
  status,
  savedAt,
  error,
}: {
  status: SaveStatus;
  savedAt: Date | null;
  error: string | null;
}): React.ReactElement {
  const t = useTranslate();
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Save className="h-3 w-3 animate-pulse" />
        {t("common.saving")}
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-destructive"
        title={error ?? undefined}
      >
        <AlertCircle className="h-3 w-3" />
        {t("editor.autoSaveError")}
      </span>
    );
  }
  if (status === "saved" && savedAt) {
    return (
      <span className="text-xs text-muted-foreground">
        {t("common.savedAt", { time: savedAt.toLocaleTimeString() })}
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">{t("editor.autoSaved")}</span>;
}

function StepInspector({
  step,
  onCaptionChange,
  onHotspotChange,
}: {
  step: Step;
  onCaptionChange: (caption: string) => void;
  onHotspotChange: (patch: Partial<Hotspot>) => void;
}): React.ReactElement {
  const t = useTranslate();
  return (
    <div className="space-y-4 text-sm">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t("editor.caption")}
        </label>
        <textarea
          value={step.caption ?? ""}
          onChange={(e) => onCaptionChange(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t("editor.canvas.hotspotType")}
        </label>
        <select
          value={step.hotspot.type}
          onChange={(e) => onHotspotChange({ type: e.target.value as HotspotType })}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="pointer">{t("editor.canvas.hotspotTypePointer")}</option>
          <option value="callout">{t("editor.canvas.hotspotTypeCallout")}</option>
          <option value="area">{t("editor.canvas.hotspotTypeArea")}</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t("editor.canvas.hotspotPosition")}
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={Math.round(step.hotspot.geometry.x)}
            onChange={(e) =>
              onHotspotChange({
                geometry: {
                  ...step.hotspot.geometry,
                  x: Number(e.target.value),
                },
              })
            }
            aria-label="x"
            className="w-1/2 rounded-md border border-border bg-background px-2 py-1 text-xs"
          />
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={Math.round(step.hotspot.geometry.y)}
            onChange={(e) =>
              onHotspotChange({
                geometry: {
                  ...step.hotspot.geometry,
                  y: Number(e.target.value),
                },
              })
            }
            aria-label="y"
            className="w-1/2 rounded-md border border-border bg-background px-2 py-1 text-xs"
          />
        </div>
      </div>

      {step.hotspot.type === "area" ? (
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("editor.canvas.hotspotSize")}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={Math.round(step.hotspot.geometry.w ?? 20)}
              onChange={(e) =>
                onHotspotChange({
                  geometry: {
                    ...step.hotspot.geometry,
                    w: Number(e.target.value),
                  },
                })
              }
              aria-label="w"
              className="w-1/2 rounded-md border border-border bg-background px-2 py-1 text-xs"
            />
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={Math.round(step.hotspot.geometry.h ?? 10)}
              onChange={(e) =>
                onHotspotChange({
                  geometry: {
                    ...step.hotspot.geometry,
                    h: Number(e.target.value),
                  },
                })
              }
              aria-label="h"
              className="w-1/2 rounded-md border border-border bg-background px-2 py-1 text-xs"
            />
          </div>
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t("editor.canvas.hotspotText")}
        </label>
        <input
          value={step.hotspot.label ?? ""}
          onChange={(e) => onHotspotChange({ label: e.target.value })}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1 rounded bg-muted/30 p-2 text-[10px] text-muted-foreground">
        <div>
          ID: <code className="font-mono">{step.id}</code>
        </div>
        <div className="truncate">URL: {step.sourceUrl}</div>
      </div>
    </div>
  );
}

// ─────────── Local type ───────────

type PublishPanelStateLocal = {
  slug: string;
  slugTaken: boolean;
  coverR2Key: string | null;
  visibility: "public" | "unlisted" | "password" | "workspace";
  password: string;
  status: "draft" | "published";
  currentVersion: number | null;
  versions: Array<{
    id: string;
    number: number;
    publishedAt: string;
    publishedBy: string;
  }>;
};

// Re-export for callers that want a stable type alias.
export type PublishPanelStateAlias = PublishPanelStateLocal;

// Re-export pure helper from HotspotPicker for convenience.
export { hotspotFromStep };
