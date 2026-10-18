"use client";

import * as React from "react";
import {
  ANALYTICS_BANNER_EN,
  ANALYTICS_BANNER_PT_BR,
} from "@/lib/lgpd/consent";

export type ConsentBannerProps = {
  locale: "pt-BR" | "en";
};

const STORAGE_KEY = "demobr.consent";

export function ConsentBanner({ locale }: ConsentBannerProps) {
  const [decision, setDecision] = React.useState<"accepted" | "declined" | null>(
    null,
  );

  React.useEffect(() => {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "accepted" || v === "declined") setDecision(v);
  }, []);

  const accept = () => {
    window.localStorage.setItem(STORAGE_KEY, "accepted");
    setDecision("accepted");
  };
  const decline = () => {
    window.localStorage.setItem(STORAGE_KEY, "declined");
    setDecision("declined");
  };

  if (decision !== null) return null;

  const t = locale === "pt-BR" ? ANALYTICS_BANNER_PT_BR : ANALYTICS_BANNER_EN;

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-4 backdrop-blur"
    >
      <div className="container flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <strong className="block text-sm font-semibold">{t.title}</strong>
          <span className="text-sm text-muted-foreground">{t.body}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={decline}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            {t.reject}
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}