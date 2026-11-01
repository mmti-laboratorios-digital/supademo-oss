/**
 * apps/web/app/api/v1/me/route.ts
 * -----------------------------------------------------------------------------
 * Perfil da sessão autenticada — usado pela extensão Chrome para descobrir
 * qual workspace a captura deve usar.
 *
 * ⚠️ A extensão não consegue ler cookies httpOnly diretamente. Ela obtém o
 * token JWT da sessão do Clerk via `chrome.runtime.sendMessage` para a página
 * web autenticada (o app) e envia em `Authorization: Bearer <token>`. Este
 * endpoint valida o token com o Clerk e retorna o workspace ativo.
 *
 * LGPD: só expomos ids/nome do workspace — nenhum e-mail, nenhum dado
 * pessoal do usuário.
 */

import { workspaces } from "@/db/schema/app";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export type MeResponse = {
  userId: string;
  workspaceId: string;
  workspaceName: string;
};

export async function GET(): Promise<NextResponse> {
  try {
    const { userId, orgId } = await requireAuth();
    const db = getDb();

    const [workspace] = await db
      .select({ id: workspaces.id, name: workspaces.name })
      .from(workspaces)
      .where(eq(workspaces.id, orgId))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ error: "WORKSPACE_NOT_FOUND" }, { status: 404 });
    }

    const body: MeResponse = {
      userId,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
    };

    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "NO_WORKSPACE") {
      return NextResponse.json({ error: "NO_WORKSPACE" }, { status: 403 });
    }
    console.error("[/api/v1/me] error:", err);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
