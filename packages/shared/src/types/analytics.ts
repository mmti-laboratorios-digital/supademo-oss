/**
 * Eventos analytics LGPD-safe — sem PII, sem IP.
 */

export type EventType =
  | "view"
  | "step_seen"
  | "cta_click"
  | "complete"
  | "bounce"
  | "lead_captured";

export type DeviceClass = "mobile" | "tablet" | "desktop";

export type DemoEvent = {
  type: EventType;
  demoId: string;
  stepId?: string;
  ts: number;
};

export type EventRow = {
  id: number;
  workspaceId: string;
  demoId: string;
  stepId: string | null;
  eventType: EventType;
  visitorIdHash: string | null;
  deviceClass: DeviceClass | null;
  countryCode: string | null;
  referrerHost: string | null;
  utm: Record<string, string> | null;
  createdAt: Date;
};

export type AnalyticsSummary = {
  demoId: string;
  views: number;
  stepSeen: number;
  ctaClicks: number;
  completes: number;
  bounces: number;
  leads: number;
  completionRate: number;
};