import { demos } from "@/db/schema/app";
import { requireAuth } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { PlanLimitError, assertWithinLimits, countWorkspaceResources } from "@/lib/plans";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const createDemoSchema = z.object({
  title: z.string().min(3).max(180),
  slug: z
    .string()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "slug deve ser [a-z0-9-]"),
  description: z.string().max(2000).optional(),
  language: z.enum(["pt-BR", "en"]).default("pt-BR"),
  leadFormEnabled: z.boolean().default(false),
  finalCta: z
    .object({
      type: z.enum(["whatsapp", "url", "email"]),
      value: z.string().min(1),
      label: z.string().min(1).max(80),
    })
    .optional(),
});

const listQuerySchema = z.object({
  status: z.enum(["draft", "published", "archived"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(req: Request) {
  try {
    const { orgId } = await requireAuth();
    const url = new URL(req.url);
    const parsed = listQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "BAD_QUERY", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { status, limit } = parsed.data;

    const items = await withTenant(orgId, async (db) => {
      const where = status
        ? and(eq(demos.workspaceId, orgId), eq(demos.status, status))
        : eq(demos.workspaceId, orgId);
      return db
        .select({
          id: demos.id,
          slug: demos.slug,
          title: demos.title,
          status: demos.status,
          language: demos.language,
          updatedAt: demos.updatedAt,
        })
        .from(demos)
        .where(where)
        .orderBy(desc(demos.updatedAt))
        .limit(limit);
    });

    return NextResponse.json({ items });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const { orgId } = await requireAuth();
    const body = await req.json().catch(() => null);
    const parsed = createDemoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "BAD_REQUEST", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // ─── Enforcement de limite do plano (F4.6) ───
    // O Free permite 3 demos. Criar o 4º precisa falhar com mensagem de
    // upgrade — sem isso, o plano é só um rótulo na página de billing.
    const demoCount = await countWorkspaceResources(orgId, "demo");
    await assertWithinLimits(orgId, "demo", demoCount + 1);

    const created = await withTenant(orgId, async (db) => {
      const [row] = await db
        .insert(demos)
        .values({
          workspaceId: orgId,
          slug: parsed.data.slug,
          title: parsed.data.title,
          description: parsed.data.description ?? null,
          language: parsed.data.language,
          leadFormEnabled: parsed.data.leadFormEnabled,
          finalCta: parsed.data.finalCta ?? null,
          status: "draft",
        })
        .returning();
      return row;
    });

    return NextResponse.json({ demo: created }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown): NextResponse {
  if (err instanceof PlanLimitError) {
    // 403 + mensagem de upgrade — é o que o creator vê quando estourou o
    // limite do plano. O `message` já é PT-BR e aponta o caminho.
    return NextResponse.json(
      {
        error: "PLAN_LIMIT_EXCEEDED",
        message: err.message,
        resource: err.resource,
        limit: err.limit,
        planId: err.planId,
        upgradeUrl: "/billing",
      },
      { status: 403 },
    );
  }
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (err.message === "NO_WORKSPACE") {
      return NextResponse.json({ error: "NO_WORKSPACE" }, { status: 403 });
    }
    if (err.message.includes("UNIQUE") || err.message.includes("duplicate")) {
      return NextResponse.json({ error: "SLUG_TAKEN" }, { status: 409 });
    }
  }
  console.error("[/api/v1/demos] error:", err);
  return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
}
