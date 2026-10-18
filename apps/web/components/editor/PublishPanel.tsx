"use client";

import * as React from "react";
import { Upload, Globe, Lock, Users, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslate } from "@/lib/i18n";

/**
 * PublishPanel — gerencia slug, cover, visibility e versões da demo.
 *
 * Slug validado em client (regex ^[a-z0-9-]{3,32}$).
 * Cover upload via endpoint /api/v1/upload/sign (R2 presigned).
 * Visibility: public | unlisted | password | workspace-only.
 *
 * TODO billing — versão (history de versões) é Business; outras features Free+.
 */

export type DemoVisibility = "public" | "unlisted" | "password" | "workspace";

export type DemoVersion = {
  id: string;
  number: number;
  publishedAt: string;
  publishedBy: string;
};

export type PublishPanelState = {
  slug: string;
  slugTaken: boolean;
  coverR2Key: string | null;
  visibility: DemoVisibility;
  password: string;
  status: "draft" | "published";
  currentVersion: number | null;
  versions: DemoVersion[];
};

export type PublishPanelProps = {
  value: PublishPanelState;
  onChange: (next: PublishPanelState) => void;
  onPublish: () => void | Promise<void>;
  onUnpublish: () => void | Promise<void>;
  onPublishVersion: () => void | Promise<void>;
  publishing?: boolean;
  workspaceSlug: string;
};

const SLUG_REGEX = /^[a-z0-9-]{3,32}$/;

export function PublishPanel({
  value,
  onChange,
  onPublish,
  onUnpublish,
  onPublishVersion,
  publishing = false,
  workspaceSlug,
}: PublishPanelProps): React.ReactElement {
  const t = useTranslate();
  const slugValid = SLUG_REGEX.test(value.slug);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const setField = <K extends keyof PublishPanelState>(
    key: K,
    val: PublishPanelState[K],
  ) => onChange({ ...value, [key]: val });

  const handleCoverUpload = async (file: File) => {
    try {
      const signRes = await fetch("/api/v1/upload/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "cover",
          contentType: file.type,
          contentLength: file.size,
          workspaceId: workspaceSlug,
        }),
      });
      if (!signRes.ok) throw new Error("Failed to get signed URL");
      const sign = (await signRes.json()) as {
        url: string;
        key: string;
        publicUrl?: string;
      };
      const putRes = await fetch(sign.url, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload failed");
      setField("coverR2Key", sign.key);
    } catch (err) {
      console.error("[cover-upload]", err);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-4 p-4">
        <header>
          <h3 className="text-sm font-semibold">
            {t("editor.publish.title")}
          </h3>
        </header>

        {/* Slug */}
        <div>
          <label
            htmlFor="publish-slug"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            {t("editor.publish.slug")}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">/d/</span>
            <input
              id="publish-slug"
              value={value.slug}
              onChange={(e) =>
                setField(
                  "slug",
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                )
              }
              aria-invalid={value.slug.length > 0 && !slugValid}
              aria-describedby="slug-help"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
            />
          </div>
          <p
            id="slug-help"
            className={`mt-1 text-[10px] ${
              !slugValid && value.slug.length > 0
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {!slugValid && value.slug.length > 0
              ? t("editor.publish.slugInvalid")
              : t("editor.publish.slugHelp")}
          </p>
          {value.slugTaken ? (
            <p className="mt-1 text-[10px] text-destructive">
              {t("editor.publish.slugTaken")}
            </p>
          ) : null}
        </div>

        {/* Cover */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("editor.publish.cover")}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleCoverUpload(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs hover:bg-muted"
          >
            <Upload className="h-3 w-3" />
            {t("editor.publish.upload")}
          </button>
          {value.coverR2Key ? (
            <p className="mt-1 truncate text-[10px] text-muted-foreground">
              {value.coverR2Key}
            </p>
          ) : null}
          <p className="mt-1 text-[10px] text-muted-foreground">
            {t("editor.publish.coverHelp")}
          </p>
        </div>

        {/* Visibility */}
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-muted-foreground">
            {t("editor.publish.visibility")}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <VisibilityOption
              id="public"
              icon={<Globe className="h-3 w-3" />}
              label={t("editor.publish.visibilityPublic")}
              current={value.visibility}
              onChange={(v) => setField("visibility", v)}
            />
            <VisibilityOption
              id="unlisted"
              icon={<Eye className="h-3 w-3" />}
              label={t("editor.publish.visibilityUnlisted")}
              current={value.visibility}
              onChange={(v) => setField("visibility", v)}
            />
            <VisibilityOption
              id="password"
              icon={<Lock className="h-3 w-3" />}
              label={t("editor.publish.visibilityPassword")}
              current={value.visibility}
              onChange={(v) => setField("visibility", v)}
            />
            <VisibilityOption
              id="workspace"
              icon={<Users className="h-3 w-3" />}
              label={t("editor.publish.visibilityWorkspace")}
              current={value.visibility}
              onChange={(v) => setField("visibility", v)}
            />
          </div>
          {value.visibility === "password" ? (
            <input
              value={value.password}
              onChange={(e) => setField("password", e.target.value)}
              placeholder={t("editor.publish.passwordPlaceholder")}
              type="password"
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          ) : null}
        </fieldset>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {value.status === "draft" ? (
            <button
              type="button"
              disabled={publishing || !slugValid || value.slugTaken}
              onClick={() => void onPublish()}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              {t("editor.publish.publishButton")}
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={publishing}
                onClick={() => void onPublishVersion()}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {t("editor.publish.publishVersionButton")}
              </button>
              <button
                type="button"
                disabled={publishing}
                onClick={() => void onUnpublish()}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                <EyeOff className="h-4 w-4" />
                {t("editor.publish.unpublishButton")}
              </button>
            </>
          )}
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">
          {t("editor.publish.history")}
        </h3>
        {value.versions.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("editor.publish.noVersions")}
          </p>
        ) : (
          <ol className="space-y-1 text-xs">
            {value.versions.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded border border-border bg-background px-3 py-2"
              >
                <span>
                  {t("editor.publish.statusVersion", { version: v.number })}
                </span>
                <span className="text-muted-foreground">
                  {new Date(v.publishedAt).toLocaleString("pt-BR")}
                </span>
              </li>
            ))}
          </ol>
        )}
        {value.currentVersion !== null ? (
          <p className="text-[10px] text-muted-foreground">
            {t("editor.publish.currentVersion", {
              version: value.currentVersion,
            })}
          </p>
        ) : null}
      </Card>
    </div>
  );
}

function VisibilityOption({
  id,
  icon,
  label,
  current,
  onChange,
}: {
  id: DemoVisibility;
  icon: React.ReactNode;
  label: string;
  current: DemoVisibility;
  onChange: (v: DemoVisibility) => void;
}): React.ReactElement {
  const isActive = current === id;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      onClick={() => onChange(id)}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs ${
        isActive
          ? "border-primary bg-primary/10 text-primary"
          : "border-border hover:bg-muted"
      }`}
    >
      {icon}
      <span className="flex-1">{label}</span>
    </button>
  );
}