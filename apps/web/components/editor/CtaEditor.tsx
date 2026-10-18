"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { useTranslate } from "@/lib/i18n";

/**
 * CtaEditor — configuração do CTA final.
 *
 * Tipos suportados:
 *  - whatsapp: input telefone E.164 + mensagem pré-preenchida com `{{vars}}`.
 *  - link: input URL genérico.
 *  - email: input endereço de e-mail (mailto).
 *  - calendly: embed URL do Calendly.
 */

export type FinalCtaType = "whatsapp" | "link" | "email" | "calendly";

export type FinalCtaConfig = {
  type: FinalCtaType;
  value: string;
  label: string;
  whatsappMessage?: string;
};

export type CtaEditorProps = {
  value: FinalCtaConfig | null;
  onChange: (next: FinalCtaConfig) => void;
};

const TYPES: Array<{ id: FinalCtaType; i18n: "typeWhatsapp" | "typeLink" | "typeEmail" | "typeCalendly" }> = [
  { id: "whatsapp", i18n: "typeWhatsapp" },
  { id: "link", i18n: "typeLink" },
  { id: "email", i18n: "typeEmail" },
  { id: "calendly", i18n: "typeCalendly" },
];

const DEFAULT_LABELS: Record<FinalCtaType, { pt: string; en: string }> = {
  whatsapp: { pt: "Falar no WhatsApp", en: "Talk on WhatsApp" },
  link: { pt: "Abrir link", en: "Open link" },
  email: { pt: "Enviar e-mail", en: "Send email" },
  calendly: { pt: "Agendar reunião", en: "Book a meeting" },
};

export function CtaEditor({
  value,
  onChange,
}: CtaEditorProps): React.ReactElement {
  const t = useTranslate();
  const current: FinalCtaConfig = value ?? {
    type: "whatsapp",
    value: "",
    label: DEFAULT_LABELS.whatsapp.pt,
  };

  const setType = (type: FinalCtaType) => {
    const locale =
      typeof navigator !== "undefined" && navigator.language.startsWith("en")
        ? "en"
        : "pt";
    onChange({
      ...current,
      type,
      label: DEFAULT_LABELS[type][locale],
      // limpa campos não-aplicáveis
      ...(type !== "whatsapp" ? { whatsappMessage: undefined } : {}),
    });
  };

  const setValue = (val: string) => onChange({ ...current, value: val });
  const setLabel = (lab: string) => onChange({ ...current, label: lab });
  const setMessage = (msg: string) =>
    onChange({ ...current, whatsappMessage: msg });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-4 p-4">
        <header>
          <h3 className="text-sm font-semibold">{t("editor.cta.title")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("editor.cta.subtitle")}
          </p>
        </header>

        <fieldset role="radiogroup" aria-label={t("editor.cta.type")}>
          <legend className="mb-2 text-xs font-medium text-muted-foreground">
            {t("editor.cta.type")}
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TYPES.map((ty) => (
              <button
                key={ty.id}
                type="button"
                role="radio"
                aria-checked={current.type === ty.id}
                onClick={() => setType(ty.id)}
                className={`rounded-md border px-3 py-2 text-xs font-medium ${
                  current.type === ty.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {t(`editor.cta.${ty.i18n}`)}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="cta-label"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            {t("editor.cta.label")}
          </label>
          <input
            id="cta-label"
            value={current.label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={80}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <TypeFields
          type={current.type}
          value={current.value}
          message={current.whatsappMessage ?? ""}
          onValueChange={setValue}
          onMessageChange={setMessage}
          t={t}
        />
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">
          {t("editor.cta.previewLabel")}
        </h3>
        <CtaPreview config={current} t={t} />
      </Card>
    </div>
  );
}

function TypeFields({
  type,
  value,
  message,
  onValueChange,
  onMessageChange,
  t,
}: {
  type: FinalCtaType;
  value: string;
  message: string;
  onValueChange: (v: string) => void;
  onMessageChange: (m: string) => void;
  t: (k: string, vars?: Record<string, string | number>) => string;
}): React.ReactElement {
  if (type === "whatsapp") {
    return (
      <>
        <div>
          <label
            htmlFor="cta-whatsapp-phone"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            {t("editor.cta.whatsappPhone")}
          </label>
          <input
            id="cta-whatsapp-phone"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="+5511999998888"
            inputMode="tel"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label
            htmlFor="cta-whatsapp-msg"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            {t("editor.cta.whatsappMessage")}
          </label>
          <textarea
            id="cta-whatsapp-msg"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Olá! Vi a demo do {{product}} e gostaria de saber mais."
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Variáveis disponíveis: <code>{`{{lead.name}}`}</code>,{" "}
            <code>{`{{lead.email}}`}</code>, <code>{`{{product}}`}</code>
          </p>
        </div>
      </>
    );
  }

  if (type === "email") {
    return (
      <div>
        <label
          htmlFor="cta-email"
          className="mb-1 block text-xs font-medium text-muted-foreground"
        >
          {t("editor.cta.value")}
        </label>
        <input
          id="cta-email"
          type="email"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={t("editor.cta.emailPlaceholder")}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
    );
  }

  if (type === "calendly") {
    return (
      <div>
        <label
          htmlFor="cta-calendly"
          className="mb-1 block text-xs font-medium text-muted-foreground"
        >
          {t("editor.cta.value")}
        </label>
        <input
          id="cta-calendly"
          type="url"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={t("editor.cta.calendlyPlaceholder")}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
    );
  }

  // link
  return (
    <div>
      <label
        htmlFor="cta-url"
        className="mb-1 block text-xs font-medium text-muted-foreground"
      >
        {t("editor.cta.value")}
      </label>
      <input
        id="cta-url"
        type="url"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={t("editor.cta.urlPlaceholder")}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}

function CtaPreview({
  config,
  t,
}: {
  config: FinalCtaConfig;
  t: (k: string, vars?: Record<string, string | number>) => string;
}): React.ReactElement {
  const href =
    config.type === "whatsapp"
      ? `https://wa.me/${config.value.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(config.whatsappMessage ?? config.label)}`
      : config.type === "email"
        ? `mailto:${config.value}?subject=${encodeURIComponent(config.label)}`
        : config.value;

  return (
    <div className="rounded-md border border-border bg-muted/40 p-4 text-center">
      <a
        href={href || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="neobrutalism-button inline-flex items-center justify-center rounded-md px-6 py-3 font-medium"
      >
        {config.label || t("editor.cta.label")}
      </a>
      <p className="mt-3 text-[10px] text-muted-foreground">
        {config.type} → {href || "(definir destino)"}
      </p>
    </div>
  );
}