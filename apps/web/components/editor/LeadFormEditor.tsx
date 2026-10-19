"use client";

import { Card } from "@/components/ui/card";
import { useTranslate } from "@/lib/i18n";
import type * as React from "react";

/**
 * LeadFormEditor — configuração do formulário de lead.
 *
 * TODO billing: feature Pro/Business. Em produção, gating via planId.
 */

export type LeadFormField = "name" | "email" | "phone" | "company";

export type LeadFormConfig = {
  enabled: boolean;
  fields: Array<{
    id: LeadFormField;
    required: boolean;
    enabled: boolean;
  }>;
  consentText: string;
};

export type LeadFormEditorProps = {
  value: LeadFormConfig;
  onChange: (next: LeadFormConfig) => void;
  workspaceName: string;
  locale: "pt-BR" | "en";
  planId?: "free" | "pro" | "business";
};

const DEFAULT_CONSENT_PT_BR =
  "Autorizo o {workspace_name} a me contatar sobre o produto demonstrado, conforme Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Posso revogar este consentimento a qualquer momento.";

const DEFAULT_CONSENT_EN =
  "I authorize {workspace_name} to contact me about the demonstrated product, in accordance with the Brazilian General Data Protection Law (Law nº 13.709/2018). I may revoke this consent at any time.";

export function LeadFormEditor({
  value,
  onChange,
  workspaceName,
  locale,
  planId = "pro",
}: LeadFormEditorProps): React.ReactElement {
  const t = useTranslate();

  // TODO billing — gating Free.
  if (planId === "free") {
    return (
      <Card className="p-6">
        <h3 className="text-sm font-semibold">{t("editor.leadForm.title")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t("editor.leadForm.upgradeRequired")}</p>
      </Card>
    );
  }

  const setField = (id: LeadFormField, patch: Partial<LeadFormConfig["fields"][number]>) => {
    onChange({
      ...value,
      fields: value.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  };

  const restoreConsentTemplate = () => {
    const tpl = locale === "en" ? DEFAULT_CONSENT_EN : DEFAULT_CONSENT_PT_BR;
    onChange({ ...value, consentText: tpl.replace("{workspace_name}", workspaceName) });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-4 p-4">
        <h3 className="text-sm font-semibold">{t("editor.leadForm.title")}</h3>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
            className="h-4 w-4 rounded border-border"
          />
          {t("editor.leadForm.enabled")}
        </label>

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-muted-foreground">
            {t("editor.leadForm.fields")}
          </legend>
          {value.fields.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded border border-border/60 px-3 py-2"
            >
              <span className="text-sm">{t(`editor.leadForm.field${cap(f.id)}`)}</span>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={f.enabled}
                    onChange={(e) => setField(f.id, { enabled: e.target.checked })}
                    className="h-3 w-3"
                  />
                  {t("common.optional")}
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={f.required}
                    disabled={!f.enabled}
                    onChange={(e) => setField(f.id, { required: e.target.checked })}
                    className="h-3 w-3"
                  />
                  {t("editor.leadForm.fieldRequired")}
                </label>
              </div>
            </div>
          ))}
        </fieldset>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="lead-consent" className="text-xs font-medium text-muted-foreground">
              {t("editor.leadForm.consentText")}
            </label>
            <button
              type="button"
              onClick={restoreConsentTemplate}
              className="text-xs text-primary hover:underline"
            >
              {t("editor.leadForm.consentTemplate")}
            </button>
          </div>
          <textarea
            id="lead-consent"
            value={value.consentText}
            onChange={(e) => onChange({ ...value, consentText: e.target.value })}
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
          />
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">{t("editor.leadForm.previewLabel")}</h3>
        <div className="rounded-md border border-border bg-card p-4">
          <h4 className="mb-3 text-base font-semibold">{t("player.leadFormTitle")}</h4>
          {value.fields
            .filter((f) => f.enabled)
            .map((f) => (
              <div key={f.id} className="mb-2">
                <label className="mb-1 block text-xs text-muted-foreground">
                  {t(`player.leadForm${cap(f.id)}`)}
                  {f.required ? (
                    <span aria-label={t("common.required")} className="ml-1 text-destructive">
                      *
                    </span>
                  ) : (
                    <span className="ml-1 text-muted-foreground">({t("common.optional")})</span>
                  )}
                </label>
                <input
                  disabled
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                />
              </div>
            ))}
          <p className="mt-3 text-xs text-muted-foreground">{value.consentText}</p>
          <button
            type="button"
            disabled
            className="mt-3 w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground"
          >
            {t("player.leadFormSubmit")}
          </button>
        </div>
      </Card>
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
