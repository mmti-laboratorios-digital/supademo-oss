/**
 * Tipos canônicos do produto — compartilhados entre apps/web, extension,
 * workers e packages/player.
 */

export type DemoStatus = "draft" | "published" | "archived";
export type DemoLanguage = "pt-BR" | "en";
export type HotspotType = "pointer" | "callout" | "area";
export type HotspotAction = "next" | "branch" | "url" | "form";

export type Hotspot = {
  id?: string;
  type: HotspotType;
  geometry: {
    x: number; // 0-100 (%)
    y: number; // 0-100 (%)
    w?: number;
    h?: number;
  };
  action: HotspotAction;
  actionTarget?: Record<string, unknown> | null;
  label?: string | null;
};

export type FinalCta = {
  type: "whatsapp" | "url" | "email";
  value: string;
  label: string;
};

export type Step = {
  id: string;
  demoId?: string;
  position: number;
  screenshotR2Key: string;
  screenshotUrl?: string;
  sourceUrl: string;
  sourceTitle?: string | null;
  caption?: string | null;
  hotspot: Hotspot;
  voiceoverR2Key?: string | null;
  voiceoverText?: string | null;
  nextStepId?: string | null;
  createdAt?: Date | string;
};

export type Demo = {
  id: string;
  workspaceId: string;
  slug: string;
  title: string;
  description?: string | null;
  status: DemoStatus;
  language: DemoLanguage;
  coverR2Key?: string | null;
  leadFormEnabled: boolean;
  finalCta: FinalCta | null;
  variables?: Record<string, string> | null;
  publishedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

/**
 * Versões "frontend" (sem campos internos) usadas pelo player.
 */
export type DemoPlayerDemo = Pick<
  Demo,
  "id" | "slug" | "title" | "language" | "leadFormEnabled"
> & {
  description?: string;
  finalCta: FinalCta | null;
};

export type DemoPlayerStep = {
  id: string;
  position: number;
  screenshotUrl: string;
  sourceUrl: string;
  sourceTitle: string;
  caption: string;
  hotspot: {
    type: HotspotType;
    x: number;
    y: number;
    w?: number;
    h?: number;
  };
};