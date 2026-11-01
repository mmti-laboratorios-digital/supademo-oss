"use client";

import * as React from "react";

/**
 * LeadForm — formulário de captura de lead no player público.
 *
 * Regras do MVP (F3):
 * - campos: nome (obrigatório), e-mail (obrigatório), telefone (opcional);
 * - consentimento LGPD **desmarcado por padrão** — submit sem marcar é bloqueado;
 * - o texto do consentimento vem do demo (`leadFormConsentText`), com fallback
 *   para o texto padrão do `lib/lgpd/consent.ts`;
 * - acessibilidade: label real associated, `aria-describedby` ligando input,
 *   mensagem de erro e texto do consentimento; erro com `role="alert"`.
 *
 * O componente é "controlado" por quem o hospeda: `onSubmit` recebe os dados
 * já validados no client e decide o que fazer (chamar a API, mostrar erro).
 */

export type LeadFormValues = {
  name: string;
  email: string;
  phone: string;
  consent: boolean;
};

export type LeadFormProps = {
  /** Texto de consentimento configurado pelo creator. */
  consentText: string;
  locale?: "pt-BR" | "en";
  /** Habilita/desabilita o botão enquanto o submit está em andamento. */
  submitting?: boolean;
  /** Erro vindo do servidor (ex.: LGPD/consentimento inválido). */
  serverError?: string | null;
  onSubmit: (values: LeadFormValues) => void | Promise<void>;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LeadForm({
  consentText,
  locale = "pt-BR",
  submitting = false,
  serverError = null,
  onSubmit,
}: LeadFormProps): React.ReactElement {
  const [values, setValues] = React.useState<LeadFormValues>({
    name: "",
    email: "",
    phone: "",
    // Consentimento nunca vem marcado — o usuário tem que marcar.
    consent: false,
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof LeadFormValues, string>>>({});

  const t = (pt: string, en: string) => (locale === "en" ? en : pt);

  const setField = <K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof LeadFormValues, string>> = {};
    if (values.name.trim().length === 0) {
      next.name = t("Informe seu nome.", "Enter your name.");
    }
    if (!EMAIL_REGEX.test(values.email.trim())) {
      next.email = t("Informe um e-mail válido.", "Enter a valid email.");
    }
    if (values.phone.trim().length > 0 && !/^[\d\s+()-]{8,32}$/.test(values.phone.trim())) {
      next.phone = t(
        "Informe um telefone válido ou deixe em branco.",
        "Enter a valid phone or leave it blank.",
      );
    }
    if (!values.consent) {
      next.consent = t(
        "É preciso autorizar o contato para continuar.",
        "You must authorize contact to continue.",
      );
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    void onSubmit({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      consent: values.consent,
    });
  };

  const errorId = (field: keyof LeadFormValues) => `lead-form-${field}-error`;
  const hintId = "lead-form-consent-text";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="border-t border-border bg-background p-4"
      aria-label={t("Deixe seu contato", "Leave your contact")}
    >
      <h3 className="mb-3 text-sm font-semibold">
        {t("Deixe seu contato para continuar", "Leave your contact to continue")}
      </h3>

      {serverError ? (
        <p
          role="alert"
          className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive"
        >
          {serverError}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label htmlFor="lead-form-name" className="mb-1 block text-xs font-medium">
            {t("Nome", "Name")} <span aria-hidden="true">*</span>
          </label>
          <input
            id="lead-form-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? errorId("name") : undefined}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          {errors.name ? (
            <p id={errorId("name")} role="alert" className="mt-1 text-xs text-destructive">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="lead-form-email" className="mb-1 block text-xs font-medium">
            {t("E-mail", "Email")} <span aria-hidden="true">*</span>
          </label>
          <input
            id="lead-form-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? errorId("email") : undefined}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          {errors.email ? (
            <p id={errorId("email")} role="alert" className="mt-1 text-xs text-destructive">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="lead-form-phone" className="mb-1 block text-xs font-medium">
            {t("Telefone", "Phone")}{" "}
            <span className="text-muted-foreground">({t("opcional", "optional")})</span>
          </label>
          <input
            id="lead-form-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => setField("phone", e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? errorId("phone") : undefined}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          {errors.phone ? (
            <p id={errorId("phone")} role="alert" className="mt-1 text-xs text-destructive">
              {errors.phone}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="lead-form-consent" className="flex items-start gap-2 text-xs">
          <input
            id="lead-form-consent"
            name="consent"
            type="checkbox"
            checked={values.consent}
            onChange={(e) => setField("consent", e.target.checked)}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={`${hintId}${errors.consent ? ` ${errorId("consent")}` : ""}`}
            className="mt-0.5 h-4 w-4 rounded border-border"
          />
          <span>
            {consentText}
            <span aria-hidden="true"> *</span>
          </span>
        </label>
        <p id={hintId} className="sr-only">
          {consentText}
        </p>
        {errors.consent ? (
          <p id={errorId("consent")} role="alert" className="mt-1 text-xs text-destructive">
            {errors.consent}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="neobrutalism-button mt-4 w-full rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
      >
        {submitting ? t("Enviando…", "Sending…") : t("Quero saber mais", "I want to know more")}
      </button>
    </form>
  );
}
