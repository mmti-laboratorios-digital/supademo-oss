import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Versionamento de demos é Fase 2.
 *
 * O endpoint existe para que a UI e integrações tenham um contrato estável,
 * mas responde 501 enquanto a funcionalidade não for implementada.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(
    {
      error: "NOT_IMPLEMENTED",
      message: "Publicação de versões ainda não está disponível.",
      demoId: id,
    },
    { status: 501 },
  );
}
