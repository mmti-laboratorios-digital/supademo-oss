"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as React from "react";

/**
 * Editor de branding do **workspace**.
 *
 * ⚠️ **Conceitos:** o branding (logo + cor primária) pertence ao
 * **workspace** — uma empresa tem várias demos com a mesma identidade. O
 * `ThemeEditor` do editor de demos edita o *tema da demo* (fonte, raio de
 * borda, fundo), que é outra coisa. Antes da F7.6 não havia UI para gravar
 * `app.workspaces.brand_color` / `brand_logo_r2_key` — o branding era
 * inserido manualmente no banco.
 *
 * Fluxo do logo: file picker → presigned PUT no R2 → `PATCH
 * /api/v1/workspace/branding` com a key. O upload direto segue o mesmo
 * padrão do upload manual de screenshots (F2).
 */

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export type BrandingEditorProps = {
  initialBrandColor: string | null;
  initialBrandLogoR2Key: string | null;
  /** URL pública do logo atual (para preview). */
  initialLogoUrl: string | null;
  /** Plano do workspace — o logo é feature Pro+. */
  planId: string;
};

type Status = "idle" | "saving" | "saved" | "error";

export function BrandingEditor({
  initialBrandColor,
  initialBrandLogoR2Key,
  initialLogoUrl,
  planId,
}: BrandingEditorProps): React.ReactElement {
  const [color, setColor] = React.useState(initialBrandColor ?? "#2563eb");
  const [logoKey, setLogoKey] = React.useState(initialBrandLogoR2Key);
  const [logoUrl, setLogoUrl] = React.useState(initialLogoUrl);
  const [status, setStatus] = React.useState<Status>("idle");
  const [message, setMessage] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const isFree = planId === "free";

  async function saveColor(): Promise<void> {
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/v1/workspace/branding", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brandColor: color }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("saved");
      setMessage("Cor salva. As demos publicadas passam a usar a nova cor.");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error && err.message.startsWith("HTTP")
          ? "Não foi possível salvar. Tente novamente."
          : "Erro de rede ao salvar.",
      );
    }
  }

  async function onPickLogo(file: File): Promise<void> {
    setMessage(null);

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setStatus("error");
      setMessage("Formato inválido. Use PNG, JPG, WEBP ou SVG.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setStatus("error");
      setMessage("Arquivo muito grande (máx. 2 MB).");
      return;
    }

    setStatus("saving");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      // A key precisa do workspaceId — o endpoint `/api/v1/me` devolve, mas
      // aqui usamos o path relativo que o próprio upload/sign exige.
      const meRes = await fetch("/api/v1/me");
      if (!meRes.ok) throw new Error("HTTP me");
      const me = (await meRes.json()) as { workspaceId: string };

      const key = `branding/${me.workspaceId}/logo-${Date.now()}.${ext}`;

      const signRes = await fetch("/api/v1/upload/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bucket: "public", key, contentType: file.type }),
      });
      if (!signRes.ok) throw new Error(`HTTP ${signRes.status}`);
      const presigned = (await signRes.json()) as { url: string; key: string };

      const putRes = await fetch(presigned.url, {
        method: "PUT",
        body: file,
        headers: { "content-type": file.type },
      });
      if (!putRes.ok) throw new Error(`HTTP ${putRes.status}`);

      const patchRes = await fetch("/api/v1/workspace/branding", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brandLogoR2Key: presigned.key }),
      });
      if (!patchRes.ok) throw new Error(`HTTP ${patchRes.status}`);

      setLogoKey(presigned.key);
      setLogoUrl(URL.createObjectURL(file));
      setStatus("saved");
      setMessage("Logo salvo. As demos publicadas passam a exibir a sua marca.");
    } catch {
      setStatus("error");
      setMessage("Não foi possível enviar o logo. Tente novamente.");
    }
  }

  async function removeLogo(): Promise<void> {
    setStatus("saving");
    try {
      const res = await fetch("/api/v1/workspace/branding", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brandLogoR2Key: null }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLogoKey(null);
      setLogoUrl(null);
      setStatus("saved");
      setMessage("Logo removido.");
    } catch {
      setStatus("error");
      setMessage("Não foi possível remover o logo. Tente novamente.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <p className="text-sm text-muted-foreground">
          A marca que aparece no player público e no embed. Vale para todas as demos deste
          workspace.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {isFree ? (
          <p className="text-sm text-muted-foreground">
            O logo faz parte do plano Pro. Você pode personalizar a cor primária no Free.
          </p>
        ) : null}

        {/* Cor primária */}
        <div className="space-y-2">
          <label htmlFor="brand-color" className="text-sm font-medium">
            Cor primária
          </label>
          <div className="flex items-center gap-3">
            <input
              id="brand-color"
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setStatus("idle");
              }}
              className="h-10 w-14 cursor-pointer rounded border border-border bg-background"
              aria-label="Escolher cor primária"
            />
            <code className="rounded bg-muted px-2 py-1 font-mono text-xs">{color}</code>
            <Button
              type="button"
              size="sm"
              onClick={saveColor}
              disabled={status === "saving" || color === initialBrandColor}
            >
              {status === "saving" ? "Salvando…" : "Salvar cor"}
            </Button>
          </div>
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Logo</span>
          <div className="flex flex-wrap items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo atual do workspace"
                className="h-12 w-auto rounded border border-border bg-background p-1 object-contain"
              />
            ) : (
              <div className="flex h-12 w-24 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground">
                Sem logo
              </div>
            )}

            {isFree ? null : (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onPickLogo(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={status === "saving"}
                >
                  {logoKey ? "Trocar logo" : "Enviar logo"}
                </Button>
                {logoKey ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={removeLogo}
                    disabled={status === "saving"}
                  >
                    Remover
                  </Button>
                ) : null}
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP ou SVG. Até 2 MB. Ideal: fundo transparente e altura ~40 px.
          </p>
        </div>

        {message ? (
          <p
            className={`text-sm ${
              status === "error" ? "text-destructive" : "text-muted-foreground"
            }`}
            role="status"
          >
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
