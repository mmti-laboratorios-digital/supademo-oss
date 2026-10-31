import { requireAuth } from "@/lib/auth";
import { unpublishDemo } from "@/server/repositories/demos";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { orgId } = await requireAuth();

    const result = await unpublishDemo(orgId, id);
    if (!result.ok) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
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
  }
  console.error("[/api/v1/demos/:id/unpublish] error:", err);
  return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
}
