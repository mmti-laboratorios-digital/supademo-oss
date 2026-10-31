import { requireAuth } from "@/lib/auth";
import { publishDemo } from "@/server/repositories/demos";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const publishSchema = z.object({
  slug: z
    .string()
    .min(3, "O slug deve ter pelo menos 3 caracteres")
    .max(32, "O slug deve ter no máximo 32 caracteres")
    .regex(/^[a-z0-9-]+$/, "O slug deve conter apenas letras minúsculas, números e hífens"),
  visibility: z.enum(["public", "unlisted", "password", "workspace"]).optional(),
  password: z.string().nullable().optional(),
  coverR2Key: z.string().nullable().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { orgId } = await requireAuth();
    const body = await req.json().catch(() => null);
    const parsed = publishSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "BAD_REQUEST",
          message: parsed.error.issues[0]?.message ?? "Payload inválido",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await publishDemo(orgId, id, parsed.data.slug);
    if (!result.ok) {
      switch (result.reason) {
        case "NOT_FOUND":
          return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
        case "NO_STEPS":
          return NextResponse.json(
            { error: "NO_STEPS", message: "Adicione pelo menos um step antes de publicar." },
            { status: 400 },
          );
        case "SLUG_TAKEN":
          return NextResponse.json(
            { error: "SLUG_TAKEN", message: "Este slug já está em uso." },
            { status: 409 },
          );
      }
    }

    return NextResponse.json({ demo: result.demo });
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
    if (err.message.includes("UNIQUE") || err.message.includes("duplicate")) {
      return NextResponse.json(
        { error: "SLUG_TAKEN", message: "Este slug já está em uso." },
        { status: 409 },
      );
    }
  }
  console.error("[/api/v1/demos/:id/publish] error:", err);
  return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
}
