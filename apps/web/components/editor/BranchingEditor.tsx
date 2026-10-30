"use client";

import { Card } from "@/components/ui/card";
import { useTranslate } from "@/lib/i18n";
import type { Step } from "@easydemo/shared";
import { Plus, Trash2 } from "lucide-react";
import type * as React from "react";

/**
 * BranchingEditor — define uma pergunta de múltipla escolha que decide
 * qual step o visitante verá em seguida.
 *
 * TODO billing: feature Business. Em produção, gating via planId === "business".
 */

export type BranchingOption = {
  id: string;
  label: string;
  targetStepId: string | null; // null = fim da demo
};

export type BranchingConfig = {
  question: string;
  options: BranchingOption[];
};

export type BranchingEditorProps = {
  value: BranchingConfig;
  onChange: (next: BranchingConfig) => void;
  steps: Pick<Step, "id" | "sourceTitle" | "position">[];
  planId?: "free" | "pro" | "business";
};

const MAX_OPTIONS = 4;

export function BranchingEditor({
  value,
  onChange,
  steps,
  planId = "business",
}: BranchingEditorProps): React.ReactElement {
  const t = useTranslate();

  // TODO billing — gating.
  if (planId !== "business") {
    return (
      <Card className="p-6">
        <h3 className="text-sm font-semibold">{t("editor.branching.title")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("editor.branching.upgradeRequired")}
        </p>
      </Card>
    );
  }

  const setQuestion = (q: string) => onChange({ ...value, question: q });

  const addOption = () => {
    if (value.options.length >= MAX_OPTIONS) return;
    onChange({
      ...value,
      options: [
        ...value.options,
        {
          id: crypto.randomUUID(),
          label: "",
          targetStepId: null,
        },
      ],
    });
  };

  const updateOption = (id: string, patch: Partial<BranchingOption>) => {
    onChange({
      ...value,
      options: value.options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
  };

  const removeOption = (id: string) => {
    onChange({
      ...value,
      options: value.options.filter((o) => o.id !== id),
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-4 p-4">
        <header>
          <h3 className="text-sm font-semibold">{t("editor.branching.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("editor.branching.subtitle")}</p>
        </header>

        <div>
          <label
            htmlFor="branch-question"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            {t("editor.branching.question")}
          </label>
          <input
            id="branch-question"
            value={value.question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Qual caminho você quer seguir?"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-medium text-muted-foreground">
            {t("editor.branching.options")}
          </legend>
          <div className="space-y-2">
            {value.options.map((opt, idx) => (
              <div
                key={opt.id}
                className="flex flex-col gap-2 rounded-md border border-border bg-background p-2 sm:flex-row sm:items-center"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {t("editor.branching.optionLabel", { index: idx + 1 })}
                </span>
                <input
                  value={opt.label}
                  onChange={(e) => updateOption(opt.id, { label: e.target.value })}
                  placeholder="Label da opção"
                  aria-label={t("editor.branching.optionLabel", {
                    index: idx + 1,
                  })}
                  className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
                />
                <select
                  value={opt.targetStepId ?? ""}
                  onChange={(e) =>
                    updateOption(opt.id, {
                      targetStepId: e.target.value || null,
                    })
                  }
                  aria-label={t("editor.branching.targetStep")}
                  className="rounded border border-border bg-background px-2 py-1 text-xs"
                >
                  <option value="">{t("editor.branching.noTarget")}</option>
                  {steps.map((s) => (
                    <option key={s.id} value={s.id}>
                      #{s.position} — {s.sourceTitle ?? "Step sem título"}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  aria-label={t("common.delete")}
                  className="rounded p-1 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            disabled={value.options.length >= MAX_OPTIONS}
            className="mt-2 inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/70 disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            {t("editor.branching.addOption")}
          </button>
        </fieldset>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">{t("editor.branching.title")}</h3>
        <div className="rounded-md border border-border bg-muted/30 p-4">
          <p className="mb-3 text-sm font-medium">
            {value.question || "Qual caminho você quer seguir?"}
          </p>
          <ul className="space-y-2">
            {value.options.length === 0 ? (
              <li className="text-xs text-muted-foreground">—</li>
            ) : (
              value.options.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    {opt.label || "(sem label)"}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </Card>
    </div>
  );
}
