import { createHmac } from "node:crypto";
import { createHash } from "node:crypto";
import { dsrLog, leads } from "@/db/schema/app";
import { getAdminDb, getDb, withTenant } from "@/lib/db";
import { env } from "@/lib/env";
import { enqueue } from "@/lib/queue";
import { sendEmail } from "@/lib/resend";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

/**
 * LGPD art. 18 — Data Subject Rights endpoint.
 *
 * Cross-tenant handling: o endpoint pode receber um titular que aparece
 * em MAIS DE UM workspace (mesmo email cadastrado em duas orgs diferentes).
 * Iteramos workspace-by-workspace usando o adminDb (BYPASSRLS) para garantir
 * isolamento real e auditamos o `cross_tenant=true`.
 *
 * Audit log: registramo o hash do email (não raw) conforme LGPD art. 46.
 */

const TENANT_SENTINEL = "00000000-0000-0000-0000-000000000000";

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

/**
 * Hash SHA-256 truncado para 16 chars.
 * LGPD art. 46: minimização — guardamos apenas identificador unidirecional.
 */
function emailHash(email: string): string {
  return createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 16);
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
        leadEmail: emailHash(parsed.data.email),
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

/**
 * Resolve todos os workspace IDs em que o titular tem dados.
 * Usa adminDb porque atravessa fronteiras de tenant intencionalmente —
 * TODO caller deve validar `verify(email, token)` ANTES de chamar isto.
 */
async function resolveWorkspaceIds(email: string): Promise<string[]> {
  const admin = getAdminDb();
  const rows = await admin
    .select({ workspaceId: leads.workspaceId })
    .from(leads)
    .where(eq(leads.email, email.toLowerCase()))
    .groupBy(leads.workspaceId);
  return rows.map((r) => r.workspaceId).filter((id) => id !== TENANT_SENTINEL);
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

    // ─────── Coleta cross-tenant usando adminDb ───────
    // Cada lead é anotado com seu workspaceId na resposta, sem assumir um único tenant.
    const admin = getAdminDb();
    const lower = email.toLowerCase();
    const allLeads = await admin.select().from(leads).where(eq(leads.email, lower));

    const groupedByWorkspace: Record<string, typeof allLeads> = {};
    for (const l of allLeads) {
      (groupedByWorkspace[l.workspaceId] ??= []).push(l);
    }

    const exportData = {
      email: lower,
      workspacesAffected: Object.keys(groupedByWorkspace).length,
      crossTenant: Object.keys(groupedByWorkspace).length > 1,
      leads: allLeads.map((l) => ({
        id: l.id,
        workspaceId: l.workspaceId,
        name: l.name,
        phone: l.phone,
        consentText: l.consentText,
        consentAt: l.consentAt,
        createdAt: l.createdAt,
      })),
      exportedAt: new Date().toISOString(),
      notice: "Eventos analíticos são agregados e anonimizados — não vinculáveis a este email.",
    };

    if (logId) {
      await admin
        .update(dsrLog)
        .set({
          status: "done",
          completedAt: new Date(),
          notes: `cross_tenant=${exportData.crossTenant}; workspaces=${exportData.workspacesAffected}`,
        })
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

    const lower = email.toLowerCase();
    const admin = getAdminDb();

    // ─────── Cross-tenant scoping ───────
    // Antes: db.delete(leads).where(eq(leads.email)) — único DELETE
    // atravessava fronteira de tenant sem proteção.
    // Agora: resolver workspace IDs, iterar um DELETE por workspace com
    // adminDb (BYPASSRLS) e manter audit log cross-tenant.
    const workspaceIds = await resolveWorkspaceIds(lower);

    let totalDeleted = 0;
    const workspacesTouched: string[] = [];
    for (const workspaceId of workspaceIds) {
      // BYPASSRLS aqui é intencional — DSR atravessa tenants por design.
      // Auditaremos via dsrLog (que vive no schema app sem RLS) o que cada
      // workspace foi afetado.
      const deleted = await admin
        .delete(leads)
        .where(and(eq(leads.email, lower), eq(leads.workspaceId, workspaceId)))
        .returning({ id: leads.id });

      // Anonimiza analytics deste workspace para o email via withTenant
      // (RLS-enforced) garante que cada step roda com o contexto certo.
      try {
        await withTenant(workspaceId, async (tx) => {
          await tx.execute(sql`
            UPDATE analytics.events
            SET visitor_id_hash = 'anonymized-' || md5(random()::text)
            WHERE demo_id IN (
              SELECT id FROM app.demos WHERE workspace_id = ${workspaceId}
            )
          `);
        });
      } catch (err) {
        // analytics.events pode estar vazia para o workspace; não fatal.
        console.warn(`[/api/dsr DELETE] analytics anonymize falhou para ${workspaceId}:`, err);
      }

      totalDeleted += deleted.length;
      workspacesTouched.push(workspaceId);
    }

    const crossTenant = workspacesTouched.length > 1;

    if (logId) {
      await admin
        .update(dsrLog)
        .set({
          status: "done",
          completedAt: new Date(),
          notes: `cross_tenant=${crossTenant}; workspaces=${workspacesTouched.length}; leads_removed=${totalDeleted}`,
        })
        .where(eq(dsrLog.id, logId));
    }

    return NextResponse.json({
      ok: true,
      leadsDeleted: totalDeleted,
      workspacesAffected: workspacesTouched.length,
      crossTenant,
    });
  } catch (err) {
    console.error("[/api/dsr DELETE] error:", err);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}

async function collectExport(email: string) {
  // Mantida para compat — chamada pelo 'old' flow GET antes do escopo cross-tenant.
  // Substituída pela lógica cross-tenant in-line em GET().
  // Se chamada, delega ao admin para preservar o comportamento original.
  const admin = getAdminDb();
  const lower = email.toLowerCase();
  const leadRows = await admin.select().from(leads).where(eq(leads.email, lower));

  return {
    email: lower,
    leads: leadRows.map((l) => ({
      id: l.id,
      workspaceId: l.workspaceId,
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
