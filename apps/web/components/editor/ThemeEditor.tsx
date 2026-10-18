"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslate } from "@/lib/i18n";

/**
 * ThemeEditor — editor de tema da demo.
 *
 * - Color picker para `primary`, `bg`, `text`.
 * - Font picker (Inter default, Sora, Roboto, system).
 * - Border radius slider.
 * - Live preview side-by-side.
 *
 * TODO billing: este componente é Pro-only. Em produção, checar
 * workspace.planId === "pro" | "business" via usePlan() e renderizar
 * <UpgradeCallout /> se Free. Mantemos a UI completa aqui para o MVP;
 * a gating será adicionada pelo feature flag team.
 */

export type DemoTheme = {
  primary: string;
  bg: string;
  text: string;
  font: "inter" | "sora" | "roboto" | "system";
  borderRadius: number; // px
};

export type ThemeEditorProps = {
  value: DemoTheme;
  onChange: (next: DemoTheme) => void;
  /** Plano atual do workspace — usado para gating de feature. */
  planId?: "free" | "pro" | "business";
};

const DEFAULT_THEME: DemoTheme = {
  primary: "#2563eb",
  bg: "#ffffff",
  text: "#0b1220",
  font: "inter",
  borderRadius: 8,
};

const FONTS: Array<{ id: DemoTheme["font"]; label: string; stack: string }> = [
  { id: "inter", label: "Inter", stack: '"Inter", system-ui, sans-serif' },
  { id: "sora", label: "Sora", stack: '"Sora", system-ui, sans-serif' },
  { id: "roboto", label: "Roboto", stack: '"Roboto", system-ui, sans-serif' },
  { id: "system", label: "System", stack: "system-ui, sans-serif" },
];

export function ThemeEditor({
  value,
  onChange,
  planId = "pro",
}: ThemeEditorProps): React.ReactElement {
  const t = useTranslate();

  // TODO billing — checar plano em runtime.
  if (planId === "free") {
    return (
      <Card className="p-6">
        <h3 className="text-sm font-semibold">{t("editor.theme.title")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("editor.theme.upgradeRequired")}
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-4 p-4">
        <header className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("editor.theme.title")}</h3>
          <button
            type="button"
            onClick={() => onChange(DEFAULT_THEME)}
            className="inline-flex items-center gap-1 rounded text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            {t("editor.theme.resetDefaults")}
          </button>
        </header>

        <ColorRow
          label={t("editor.theme.primary")}
          value={value.primary}
          onChange={(v) => onChange({ ...value, primary: v })}
        />
        <ColorRow
          label={t("editor.theme.bg")}
          value={value.bg}
          onChange={(v) => onChange({ ...value, bg: v })}
        />
        <ColorRow
          label={t("editor.theme.text")}
          value={value.text}
          onChange={(v) => onChange({ ...value, text: v })}
        />

        <div>
          <label
            htmlFor="theme-font"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            {t("editor.theme.font")}
          </label>
          <select
            id="theme-font"
            value={value.font}
            onChange={(e) =>
              onChange({
                ...value,
                font: e.target.value as DemoTheme["font"],
              })
            }
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="theme-radius"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            {t("editor.theme.borderRadius")} ({value.borderRadius}px)
          </label>
          <input
            id="theme-radius"
            type="range"
            min={0}
            max={24}
            step={1}
            value={value.borderRadius}
            onChange={(e) =>
              onChange({ ...value, borderRadius: Number(e.target.value) })
            }
            className="w-full"
          />
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">
          {t("editor.theme.previewLabel")}
        </h3>
        <div
          className="overflow-hidden rounded-lg border"
          style={{
            background: value.bg,
            color: value.text,
            borderRadius: `${value.borderRadius}px`,
            fontFamily:
              FONTS.find((f) => f.id === value.font)?.stack ?? "system-ui",
          }}
        >
          <div className="space-y-3 p-4">
            <div
              className="inline-flex items-center gap-2 rounded px-3 py-1.5 text-xs font-medium"
              style={{
                background: value.primary,
                color: contrastText(value.primary),
                borderRadius: `${value.borderRadius}px`,
              }}
            >
              Primary action
            </div>
            <h4 className="text-lg font-semibold">Como sua demo vai parecer</h4>
            <p className="text-sm opacity-80">
              Esta é uma prévia ao vivo das cores e tipografia escolhidas.
              O player público usará exatamente este tema.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded border px-3 py-1.5 text-xs"
                style={{
                  borderColor: value.primary,
                  color: value.primary,
                  borderRadius: `${value.borderRadius}px`,
                }}
              >
                Outline
              </button>
              <button
                type="button"
                className="rounded px-3 py-1.5 text-xs"
                style={{
                  background: "transparent",
                  color: value.text,
                  borderRadius: `${value.borderRadius}px`,
                }}
              >
                Ghost
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-3">
      <label className="flex-1 text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-8 w-12 cursor-pointer rounded border border-border bg-background"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} (hex)`}
        className="w-24 rounded-md border border-border bg-background px-2 py-1 text-xs font-mono"
      />
    </div>
  );
}

/**
 * Determina a cor de texto (preto/branco) que contrasta com o background.
 * Usa YIQ — bom o suficiente para preview.
 */
function contrastText(bg: string): string {
  const hex = bg.replace("#", "");
  if (hex.length !== 6) return "#ffffff";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#0b1220" : "#ffffff";
}