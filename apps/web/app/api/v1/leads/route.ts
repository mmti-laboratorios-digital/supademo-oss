import { demos, workspaces } from "@/db/schema/app";
import { getDb } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

/**
 * API pública de captura de lead.
 *
 * O visitante do player não tem sessão — o endpoint é público por
 * natureza. A segurança vem de duas garantias:
 * 1. o `demoId` precisa existir e estar `published`;
 * 2. o `workspaceId` **é derivado do demo**, nunca aceito do cliente — assim
 *    o lead não pode ser atribuído a outro workspace.
 *
 * A gravação reusa o mesmo schema e as mesmas regras de consentimento do
 * server action `server/actions/lead.ts` (consentimento obrigatório, hash de
 * IP/UA, texto de consentimento persistido).
 */

const leadSchema = z.object({
  demoId: z.string().uuid(),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(32).optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consentimento é obrigatório (LGPD art. 7º)" }),
  }),
  consentText: z.string().min(1).max(2000).optional(),
  extra: z.record(z.string()).optional(),
  locale: z.enum(["pt-BR", "en"]).default("pt-BR"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = leadSchema.safeParse(body);
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

    const { demoId } = parsed.data;

    // Demo publicado? (leitura pública — sem contexto de tenant)
    const db = getDb();
    const [demo] = await db
      .select({
        id: demos.id,
        workspaceId: demos.workspaceId,
        language: demos.language,
        status: demos.status,
      })
      .from(demos)
      .where(eq(demos.id, demoId))
      .limit(1);

    if (!demo || demo.status !== "published") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    // O nome do workspace é usado no texto de consentimento padrão — vem do
    // banco (não do cliente), para que o lead registre a empresa certa.
    const [workspace] = await db
      .select({ name: workspaces.name })
      .from(workspaces)
      .where(eq(workspaces.id, demo.workspaceId))
      .limit(1);

    const { captureLead } = await import("@/server/actions/lead");
    const result = await captureLead({
      workspaceId: demo.workspaceId,
      demoId: demo.id,
      workspaceName: workspace?.name ?? "EasyDemo",
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      consent: parsed.data.consent,
      consentText: parsed.data.consentText,
      extra: parsed.data.extra,
      locale: parsed.data.locale === "en" ? "en" : ("pt-BR" as const),
    });

    if (!result.ok) {
      return NextResponse.json({ error: "BAD_REQUEST", message: result.error }, { status: 400 });
    }

    return NextResponse.json({ leadId: result.leadId }, { status: 201 });
  } catch (err) {
    console.error("[/api/v1/leads] error:", err);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
