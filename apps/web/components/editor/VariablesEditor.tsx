"use client";

import { Card } from "@/components/ui/card";
import { useTranslate } from "@/lib/i18n";
import { Plus, Trash2 } from "lucide-react";
import type * as React from "react";

/**
 * VariablesEditor — gerencia variáveis dinâmicas disponíveis para uso
 * via `{{var}}` em legendas, CTAs e mensagens WhatsApp.
 *
 * TODO billing: feature Business. Em produção, gating via planId === "business".
 */

export type DemoVariable = {
  key: string;
  defaultValue: string;
  description?: string;
};

export type VariablesEditorProps = {
  value: DemoVariable[];
  onChange: (next: DemoVariable[]) => void;
  planId?: "free" | "pro" | "business";
};

export function VariablesEditor({
  value,
  onChange,
  planId = "business",
}: VariablesEditorProps): React.ReactElement {
  const t = useTranslate();

  // TODO billing — gating.
  if (planId !== "business") {
    return (
      <Card className="p-6">
        <h3 className="text-sm font-semibold">{t("editor.variables.title")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("editor.variables.upgradeRequired")}
        </p>
      </Card>
    );
  }

  const addVar = () => {
    const newKey = `var${value.length + 1}`;
    onChange([...value, { key: newKey, defaultValue: "", description: "" }]);
  };

  const updateVar = (idx: number, patch: Partial<DemoVariable>) => {
    onChange(value.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  };

  const removeVar = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <Card className="space-y-4 p-4">
      <header>
        <h3 className="text-sm font-semibold">{t("editor.variables.title")}</h3>
        <p className="text-xs text-muted-foreground">{t("editor.variables.subtitle")}</p>
      </header>

      {value.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          {t("editor.variables.previewLabel")}: <code>{`{{product}}`}</code>,{" "}
          <code>{`{{customer_name}}`}</code>
        </div>
      ) : (
        <ul className="space-y-2">
          {value.map((v, idx) => (
            <li
              key={`${v.key}-${idx}`}
              className="grid grid-cols-1 gap-2 rounded-md border border-border bg-background p-3 sm:grid-cols-3"
            >
              <input
                value={v.key}
                onChange={(e) => updateVar(idx, { key: e.target.value })}
                placeholder={t("editor.variables.key")}
                aria-label={`${t("editor.variables.key")} ${idx + 1}`}
                className="rounded border border-border bg-background px-2 py-1 text-sm font-mono"
              />
              <input
                value={v.defaultValue}
                onChange={(e) => updateVar(idx, { defaultValue: e.target.value })}
                placeholder={t("editor.variables.defaultValue")}
                aria-label={`${t("editor.variables.defaultValue")} ${idx + 1}`}
                className="rounded border border-border bg-background px-2 py-1 text-sm"
              />
              <div className="flex items-center gap-2">
                <input
                  value={v.description ?? ""}
                  onChange={(e) => updateVar(idx, { description: e.target.value })}
                  placeholder={t("editor.variables.description")}
                  aria-label={`${t("editor.variables.description")} ${idx + 1}`}
                  className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeVar(idx)}
                  aria-label={`${t("common.delete")} ${v.key}`}
                  className="rounded p-1 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={addVar}
        className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/70"
      >
        <Plus className="h-3 w-3" />
        {t("editor.variables.addVariable")}
      </button>

      <div className="rounded bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        {t("editor.variables.previewLabel")}:{" "}
        <code className="rounded bg-background px-1">{`{{${value[0]?.key ?? "product"}}}`}</code>
        {value[0]?.defaultValue ? <span> → {value[0].defaultValue}</span> : null}
      </div>
    </Card>
  );
}
