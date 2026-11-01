"use client";

import { Card } from "@/components/ui/card";
import { Check, Copy } from "lucide-react";
import * as React from "react";

/**
 * apps/web/components/embed/CopySnippet.tsx
 * -----------------------------------------------------------------------------
 * Card com textarea de código + botão copiar.
 *
 * Usado na página `(app)/demos/[id]/embed/page.tsx` (F6.1).
 */

export type CopySnippetProps = {
  label: string;
  value: string;
};

export function CopySnippet({ label, value }: CopySnippetProps): React.ReactElement {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    } catch {
      // Fallback silencioso: se o clipboard falhar, não quebra a UI.
    }
  }, [value]);

  return (
    <Card className="space-y-3 p-4">
      <label className="text-sm font-semibold">{label}</label>
      <div className="relative">
        <textarea
          readOnly
          value={value}
          rows={5}
          className="w-full rounded-md border border-border bg-muted/40 p-3 font-mono text-xs focus-visible:outline-none"
        />
        <button
          type="button"
          onClick={() => void handleCopy()}
          aria-label={copied ? "Copiado" : "Copiar snippet"}
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              <span>Copiado</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
    </Card>
  );
}
