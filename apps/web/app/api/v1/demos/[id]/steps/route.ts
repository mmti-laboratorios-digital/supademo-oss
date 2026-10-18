import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { steps } from "@/db/schema/app";
import { presignPut } from "@/lib/r2";

export const runtime = "nodejs";

const createStepSchema = z.object({
  position: z.number().int().min(1).max(1000),
  screenshotR2Key: z.string().min(1).max(255),
  sourceUrl: z.string().url(),
  sourceTitle: z.string().max(255).optional(),
  caption: z.string().max(2000).optional(),
  hotspot: z.object({
    type: z.enum(["pointer", "callout", "area"]),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    w: z.number().min(0).max(100).optional(),
    h: z.number().min(0).max(100).optional(),
  }),
});

const updateStepSchema = createStepSchema.partial();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { orgId } = await requireAuth();
    const list = await withTenant(orgId, async (db) => {
      return db
        .select()
        .from(steps)
        .where(eq(steps.demoId, id))
        .orderBy(asc(steps.position));
    });
    return NextResponse.json({ items: list });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: demoId } = await params;
    const { orgId } = await requireAuth();
    const body = await req.json().catch(() => null);
    const parsed = createStepSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "BAD_REQUEST", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const created = await withTenant(orgId, async (db) => {
      const [row] = await db
        .insert(steps)
        .values({
          demoId,
          position: parsed.data.position,
          screenshotR2Key: parsed.data.screenshotR2Key,
          sourceUrl: parsed.data.sourceUrl,
          sourceTitle: parsed.data.sourceTitle ?? null,
          caption: parsed.data.caption ?? null,
          hotspot: parsed.data.hotspot,
        })
        .returning();
      return row;
    });

    if (!created) {
      return NextResponse.json({ error: "INSERT_FAILED" }, { status: 500 });
    }

    // Presigned PUT para re-upload opcional (se cliente preferir upload separado)
    const presigned = await presignPut({
      bucket: "public",
      key: `demos/${demoId}/steps/${created.position}-${created.id}.webp`,
      contentType: "image/webp",
      expiresInSeconds: 600,
    });

    return NextResponse.json({ step: created, upload: presigned }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: demoId } = await params;
    const { orgId } = await requireAuth();
    const body = await req.json().catch(() => null);
    const parsed = updateStepSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "BAD_REQUEST", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // PATCH requer {stepId} no body — atualiza apenas um step específico
    const stepId = (body as { stepId?: string })?.stepId;
    if (!stepId) {
      return NextResponse.json({ error: "MISSING_STEP_ID" }, { status: 400 });
    }

    const updated = await withTenant(orgId, async (db) => {
      const updates: Record<string, unknown> = {};
      if (parsed.data.position !== undefined) updates.position = parsed.data.position;
      if (parsed.data.caption !== undefined) updates.caption = parsed.data.caption;
      if (parsed.data.hotspot !== undefined) updates.hotspot = parsed.data.hotspot;
      if (parsed.data.screenshotR2Key !== undefined)
        updates.screenshotR2Key = parsed.data.screenshotR2Key;

      const [row] = await db
        .update(steps)
        .set(updates)
        .where(eq(steps.id, stepId))
        .returning();
      return row ?? null;
    });

    if (!updated) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    void demoId;
    return NextResponse.json({ step: updated });
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown): NextResponse {
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (err.message === "NO_WORKSPACE") {
      return NextResponse.json({ error: "NO_WORKSPACE" }, { status: 403 });
    }
  }
  console.error("[/api/v1/demos/:id/steps] error:", err);
  return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
}