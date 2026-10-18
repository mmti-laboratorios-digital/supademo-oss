import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { env } from "../env";

/**
 * Insere eventos analytics LGPD-safe.
 * Nunca armazena IP, user_id, ou qualquer PII cru.
 */

export type EventInsert = {
  workspaceId: string;
  demoId: string;
  stepId?: string;
  eventType: "view" | "step_seen" | "cta_click" | "complete" | "bounce" | "lead_captured";
  visitorIdHash: string;
  deviceClass: "mobile" | "tablet" | "desktop";
  countryCode: string | null;
  referrerHost: string | null;
  utm?: Record<string, string>;
};

export async function recordView(e: EventInsert): Promise<void> {
  const db = getDb();
  try {
    await db.execute(sql`
      INSERT INTO analytics.events (
        workspace_id, demo_id, step_id, event_type,
        visitor_id_hash, device_class, country_code,
        referrer_host, utm, created_at
      ) VALUES (
        ${e.workspaceId}::uuid,
        ${e.demoId}::uuid,
        ${e.stepId ?? null}::uuid,
        ${e.eventType},
        ${e.visitorIdHash},
        ${e.deviceClass},
        ${e.countryCode},
        ${e.referrerHost},
        ${JSON.stringify(e.utm ?? {})}::jsonb,
        now()
      )
    `);
  } catch (err) {
    // Fire-and-forget: nunca quebra render do player.
    if (env().NODE_ENV !== "production") {
      console.warn("[analytics] insert failed:", err);
    }
  }
}

export async function recordStepSeen(args: Omit<EventInsert, "eventType">) {
  return recordView({ ...args, eventType: "step_seen" });
}

export async function recordCtaClick(args: Omit<EventInsert, "eventType">) {
  return recordView({ ...args, eventType: "cta_click" });
}

export async function recordComplete(args: Omit<EventInsert, "eventType">) {
  return recordView({ ...args, eventType: "complete" });
}

export async function recordLeadCaptured(args: Omit<EventInsert, "eventType">) {
  return recordView({ ...args, eventType: "lead_captured" });
}