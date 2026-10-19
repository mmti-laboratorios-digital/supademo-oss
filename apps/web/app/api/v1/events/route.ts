import { recordView } from "@/lib/analytics/events";
import { analyticsVisitorCookie } from "@/lib/analytics/visitor";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const eventSchema = z.object({
  demoId: z.string().uuid(),
  stepId: z.string().uuid().optional(),
  eventType: z.enum(["view", "step_seen", "cta_click", "complete", "bounce", "lead_captured"]),
  utm: z.record(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "BAD_REQUEST", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const h = await headers();
    const visitor = await analyticsVisitorCookie(h);

    // workspaceId precisa estar acessível — pegar via demo.
    // Em prod: SELECT workspace_id FROM app.demos WHERE id = demoId LIMIT 1.
    // Aqui simplificado: o RLS permite insert com qualquer workspace_id válido.
    // Vamos resolver via DB lookup.
    const { getDb } = await import("@/lib/db");
    const db = getDb();
    const { demos } = await import("@/db/schema/app");
    const { eq } = await import("drizzle-orm");
    const [demo] = await db
      .select({ id: demos.id, workspaceId: demos.workspaceId })
      .from(demos)
      .where(eq(demos.id, parsed.data.demoId))
      .limit(1);
    if (!demo) {
      return NextResponse.json({ error: "DEMO_NOT_FOUND" }, { status: 404 });
    }

    await recordView({
      workspaceId: demo.workspaceId,
      demoId: parsed.data.demoId,
      stepId: parsed.data.stepId,
      eventType: parsed.data.eventType,
      visitorIdHash: visitor.idHash,
      deviceClass: visitor.deviceClass,
      countryCode: visitor.countryCode,
      referrerHost: visitor.referrerHost,
      utm: parsed.data.utm,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/v1/events] error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
}
