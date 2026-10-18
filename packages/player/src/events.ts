/**
 * Event tracker do player — envia eventos para /api/v1/events.
 */

export type DemoEvent = {
  type:
    | "view"
    | "step_seen"
    | "cta_click"
    | "complete"
    | "bounce"
    | "lead_captured";
  demoId: string;
  stepId?: string;
  ts: number;
  utm?: Record<string, string>;
};

const ENDPOINT = "/api/v1/events";

export async function trackEvent(
  e: DemoEvent,
  endpoint: string = ENDPOINT,
): Promise<void> {
  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(e),
      keepalive: true,
    });
  } catch {
    // fire-and-forget
  }
}

export const defaultEvents = {
  endpoint: ENDPOINT,
};