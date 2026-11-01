/**
 * apps/web/app/api/v1/workspace/branding/route.ts
 * -----------------------------------------------------------------------------
 * Branding do **workspace** — cor primária e logo.
 *
 * ⚠️ **Por que este endpoint existe:** o `ThemeEditor` do editor de demos
 * existed desde o scaffold, mas ele edita o *tema da demo* (`primary`, `bg`,
 * `text`, `font`, `borderRadius`) e **não tinha onde persistir**. O player
 * público, por outro lado, lê o branding do **workspace**
 * (`app.workspaces.brand_color` e `app.workspaces.brand_logo_r2_key`) desde a
 * F7 — mas não havia nenhuma UI para escrever nessas colunas. O branding era
 * inserido manualmente no banco.
 *
 * Este endpoint fecha o loop: o creator configura a marca uma vez, e todas as
 * demos do workspace passam a exibi-la.
 *
 * LGPD: o branding é da organização, não do usuário. Não há dado pessoal aqui.
 */
import { workspaces } from "@/db/schema/app";
import { requireAuth } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

/**
 * Cor em hex de 3 ou 6 dígitos (`#fff` ou `#ffffff`).
 *
 * O `DemoPlayer` converte hex → HSL antes de injetar nas CSS variables, então
 * o formato é o que o player consome.
 */
const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "cor deve ser hex (#fff ou #ffffff)");

const updateSchema = z.object({
  /** `null` remove a cor (volta ao tema padrão). */
  brandColor: hexColor.nullable().optional(),
  /** `null` remove o logo. */
  brandLogoR2Key: z
    .string()
    .min(1)
    .max(255)
    .regex(/^branding\/[0-9a-f-]{36}\//, "key de logo inválida")
    .nullable()
    .optional(),
});

export async function GET(): Promise<NextResponse> {
  try {
    const { orgId } = await requireAuth();
    // ⚠️ Leitura **precisa** de `withTenant`: a policy de escrita de
    // `app.workspaces` exige `app.current_tenant_id()`. Sem o contexto de
    // tenant, o UPDATE afetaria 0 linhas e a API devolveria 404 — mesmo com
    // a sessão válida.
    const [ws] = await withTenant(orgId, async (db) =>
      db
        .select({
          brandColor: workspaces.brandColor,
          brandLogoR2Key: workspaces.brandLogoR2Key,
        })
        .from(workspaces)
        .where(eq(workspaces.id, orgId))
        .limit(1),
    );

    if (!ws) {
      return NextResponse.json({ error: "WORKSPACE_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({
      brandColor: ws.brandColor,
      brandLogoR2Key: ws.brandLogoR2Key,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request): Promise<NextResponse> {
  try {
    const { orgId } = await requireAuth();
    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "BAD_REQUEST", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.brandColor !== undefined) updates.brandColor = parsed.data.brandColor;

    const logoKey = parsed.data.brandLogoR2Key;
    if (logoKey !== undefined) {
      if (logoKey !== null) {
        // ⚠️ O prefixo precisa ser o do **próprio** workspace — o regex do Zod
        // só garante o formato (`branding/<uuid>/...`). Sem esta checagem, o
        // creator poderia apontar o logo para o arquivo de outro tenant.
        if (!logoKey.startsWith(`branding/${orgId}/`)) {
          return NextResponse.json({ error: "KEY_OUTSIDE_TENANT" }, { status: 403 });
        }
      }
      updates.brandLogoR2Key = logoKey;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "NO_CHANGES" }, { status: 400 });
    }

    const [updated] = await withTenant(orgId, async (db) =>
      db.update(workspaces).set(updates).where(eq(workspaces.id, orgId)).returning({
        brandColor: workspaces.brandColor,
        brandLogoR2Key: workspaces.brandLogoR2Key,
      }),
    );

    if (!updated) {
      return NextResponse.json({ error: "WORKSPACE_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(updated);
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
  console.error("[/api/v1/workspace/branding] error:", err);
  return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
}
