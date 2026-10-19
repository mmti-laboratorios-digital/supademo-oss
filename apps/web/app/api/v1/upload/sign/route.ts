import { requireAuth } from "@/lib/auth";
import { presignPut } from "@/lib/r2";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const signSchema = z.object({
  bucket: z.enum(["public", "private"]).default("public"),
  key: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9/_.\-]+$/, "caracteres inválidos na key"),
  contentType: z.string().regex(/^[a-z]+\/[a-z0-9.+-]+$/, "content-type inválido"),
  expiresInSeconds: z.number().int().min(60).max(3600).default(600),
});

export async function POST(req: Request) {
  try {
    const { orgId } = await requireAuth();
    const body = await req.json().catch(() => null);
    const parsed = signSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "BAD_REQUEST", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Sanity check: a key deve começar com `demos/{orgId}/`
    if (!parsed.data.key.startsWith(`demos/${orgId}/`)) {
      return NextResponse.json(
        { error: "KEY_OUTSIDE_TENANT", key: parsed.data.key },
        { status: 403 },
      );
    }

    const presigned = await presignPut({
      bucket: parsed.data.bucket,
      key: parsed.data.key,
      contentType: parsed.data.contentType,
      expiresInSeconds: parsed.data.expiresInSeconds,
    });

    return NextResponse.json(presigned);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
      }
      if (err.message === "NO_WORKSPACE") {
        return NextResponse.json({ error: "NO_WORKSPACE" }, { status: 403 });
      }
      if (err.message.includes("R2 credentials")) {
        return NextResponse.json({ error: "STORAGE_NOT_CONFIGURED" }, { status: 503 });
      }
    }
    console.error("[/api/v1/upload/sign] error:", err);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
