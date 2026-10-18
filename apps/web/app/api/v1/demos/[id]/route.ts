import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { demos, steps } from "@/db/schema/app";
import { asc } from "drizzle-orm";

export const runtime = "nodejs";

const updateDemoSchema = z.object({
  title: z.string().min(3).max(180).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  language: z.enum(["pt-BR", "en"]).optional(),
  leadFormEnabled: z.boolean().optional(),
  finalCta: z
    .object({
      type: z.enum(["whatsapp", "url", "email"]),
      value: z.string().min(1),
      label: z.string().min(1).max(80),
    })
    .nullable()
    .optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { orgId } = await requireAuth();
    const result = await withTenant(orgId, async (db) => {
      const [demo] = await db
        .select()
        .from(demos)
        .where(eq(demos.id, id))
        .limit(1);
      if (!demo) return null;

      const stepList = await db
        .select()
        .from(steps)
        .where(eq(steps.demoId, demo.id))
        .orderBy(asc(steps.position));

      return { demo, steps: stepList };
    });

    if (!result) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { orgId } = await requireAuth();
    const body = await req.json().catch(() => null);
    const parsed = updateDemoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "BAD_REQUEST", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updated = await withTenant(orgId, async (db) => {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (parsed.data.title !== undefined) updates.title = parsed.data.title;
      if (parsed.data.description !== undefined)
        updates.description = parsed.data.description;
      if (parsed.data.status !== undefined) {
        updates.status = parsed.data.status;
        if (parsed.data.status === "published") {
          updates.publishedAt = new Date();
        }
      }
      if (parsed.data.language !== undefined)
        updates.language = parsed.data.language;
      if (parsed.data.leadFormEnabled !== undefined)
        updates.leadFormEnabled = parsed.data.leadFormEnabled;
      if (parsed.data.finalCta !== undefined)
        updates.finalCta = parsed.data.finalCta;

      const [row] = await db
        .update(demos)
        .set(updates)
        .where(eq(demos.id, id))
        .returning();
      return row ?? null;
    });

    if (!updated) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ demo: updated });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { orgId } = await requireAuth();
    await withTenant(orgId, async (db) => {
      await db
        .update(demos)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(demos.id, id));
    });
    return NextResponse.json({ ok: true });
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
  console.error("[/api/v1/demos/:id] error:", err);
  return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
}