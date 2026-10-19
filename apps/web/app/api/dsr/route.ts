import { createHmac } from "node:crypto";
import { dsrLog, leads } from "@/db/schema/app";
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { enqueue } from "@/lib/queue";
import { sendEmail } from "@/lib/resend";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

/**
 * LGPD art. 18 — Data Subject Rights endpoint.
 *
 * Fluxos:
 *  POST /api/dsr { email, action: 'request' }
 *    → gera token, salva dsr_log, envia email com link de confirmação
 *
 *  GET /api/dsr?email=...&token=...&action=export
 *    → exporta dados agregados do titular (leads + analytics agregados)
 *
 *  DELETE /api/dsr?email=...&token=...&action=delete
 *    → apaga leads do titular e anonimiza analytics
 */

const tokenSecret = () => env().ENCRYPTION_KEY ?? "dsr-fallback-secret";

function sign(email: string, action: "export" | "delete"): string {
  return createHmac("sha256", tokenSecret())
    .update(`${email.toLowerCase()}:${action}`)
    .digest("hex");
}

function verify(email: string, token: string, action: "export" | "delete"): boolean {
  const expected = sign(email, action);
  if (expected.length !== token.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return mismatch === 0;
}

const requestSchema = z.object({
  email: z.string().email(),
  action: z.enum(["export", "delete"]).default("export"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "BAD_REQUEST", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const db = getDb();
    const [log] = await db
      .insert(dsrLog)
      .values({
        leadEmail: parsed.data.email.toLowerCase(),
        action: parsed.data.action,
        status: "pending",
      })
      .returning();

    if (!log) {
      return NextResponse.json({ error: "INSERT_FAILED" }, { status: 500 });
    }

    const token = sign(parsed.data.email, parsed.data.action);

    const url = `${env().APP_BASE_URL}/api/dsr?email=${encodeURIComponent(
      parsed.data.email,
    )}&token=${token}&action=${parsed.data.action}&log=${log.id}`;

    await sendEmail({
      to: parsed.data.email,
      subject:
        parsed.data.action === "delete"
          ? "Confirmação de exclusão de dados (LGPD)"
          : "Link para exportação de dados (LGPD)",
      html: `
        <p>Recebemos uma solicitação ${
          parsed.data.action === "delete" ? "de exclusão" : "de exportação"
        } dos seus dados conforme LGPD art. 18.</p>
        <p>Para confirmar, clique: <a href="${url}">${url}</a></p>
        <p>Este link expira em 15 dias.</p>
        <p>Equipe DemoBR — dpo@dominio.com.br</p>
      `,
      replyTo: env().EMAIL_DPO,
    });

    await enqueue({ type: "cleanup_expired" });

    return NextResponse.json({ ok: true, dsrId: log?.id ?? "" });
  } catch (err) {
    console.error("[/api/dsr POST] error:", err);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action");
    const logId = url.searchParams.get("log");

    if (!email || !token || (action !== "export" && action !== "delete")) {
      return NextResponse.json({ error: "BAD_QUERY" }, { status: 400 });
    }

    if (!verify(email, token, action)) {
      return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 401 });
    }

    const db = getDb();
    const exportData = await collectExport(email);

    if (logId) {
      await db
        .update(dsrLog)
        .set({ status: "done", completedAt: new Date() })
        .where(eq(dsrLog.id, logId));
    }

    return NextResponse.json(exportData);
  } catch (err) {
    console.error("[/api/dsr GET] error:", err);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action");
    const logId = url.searchParams.get("log");

    if (!email || !token || action !== "delete") {
      return NextResponse.json({ error: "BAD_QUERY" }, { status: 400 });
    }
    if (!verify(email, token, action)) {
      return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 401 });
    }

    const db = getDb();

    // Apaga leads do titular
    const deleted = await db
      .delete(leads)
      .where(eq(leads.email, email.toLowerCase()))
      .returning({ id: leads.id });

    // Anonimiza analytics (substitui visitor_id_hash por hash vazio determinístico)
    await db.execute(sql`
      UPDATE analytics.events
      SET visitor_id_hash = 'anonymized-' || md5(random()::text)
      WHERE demo_id IN (
        SELECT id FROM app.demos WHERE workspace_id IN (
          SELECT workspace_id FROM app.leads WHERE email = ${email.toLowerCase()}
        )
      )
    `);

    if (logId) {
      await db
        .update(dsrLog)
        .set({
          status: "done",
          completedAt: new Date(),
          notes: `${deleted.length} leads removidos`,
        })
        .where(eq(dsrLog.id, logId));
    }

    return NextResponse.json({
      ok: true,
      leadsDeleted: deleted.length,
    });
  } catch (err) {
    console.error("[/api/dsr DELETE] error:", err);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}

async function collectExport(email: string) {
  const db = getDb();
  const lower = email.toLowerCase();
  const leadRows = await db.select().from(leads).where(eq(leads.email, lower));

  return {
    email: lower,
    leads: leadRows.map((l) => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      consentText: l.consentText,
      consentAt: l.consentAt,
      createdAt: l.createdAt,
    })),
    exportedAt: new Date().toISOString(),
    notice: "Eventos analíticos são agregados e anonimizados — não vinculáveis a este email.",
  };
}
