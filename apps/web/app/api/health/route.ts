import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Health check do serviço. Consumido por:
 *   - apps/web/Dockerfile:56  (HEALTHCHECK com `curl -fsS`)
 *   - Makefile:128             (`make health`)
 *   - scripts/health-check.sh  (smoke test de deploy)
 *   - .github/workflows/deploy.yml (dispara rollback automático)
 *
 * ## Contrato
 *
 * scripts/health-check.sh:37-62 já faz o parse deste shape:
 *   { "status": "ok"|"degraded"|"down",
 *     "checks": { "database": {...}, "r2": {...}, ... } }
 *
 * ## Semântica de status (alinhada ao exit code do health-check.sh)
 *
 *   ok        → tudo configurado e alcançável        → exit 0
 *   degraded  → serviço externo ausente/não configs  → exit 1 (warning)
 *   down      → dependência crítica indisponível     → exit 2
 *
 * ## Por que só o banco pode derrubar o serviço
 *
 * O HEALTHCHECK do container usa `curl -fsS`, que falha em qualquer resposta
 * não-2xx. Se um serviço externo não configurado (comum em dev/staging)
 * retornasse 503, o orchestrator reiniciaria o container em loop. Por isso:
 *
 *   - ausência de configuração externa → `degraded` + HTTP 200
 *   - banco inacessível               → `down`      + HTTP 503
 *
 * Assim o healthcheck só reflete a queda real do serviço, e não o estado da
 * integração com terceiros.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckStatus = "ok" | "degraded" | "down";

type Check = {
  status: CheckStatus;
  /** Detalhe curto e não-sensível. Nunca inclui valores de env. */
  detail: string;
  /** Milissegundos que o check levou. */
  latencyMs?: number;
};

const DB_TIMEOUT_MS = 3000;

/**
 * `SELECT 1` com timeout. Usa uma conexão avulsa (não o pool global) para
 * não competir por conexão com o tráfego normal, e para que uma conexão
 * pendurada não vaze para o healthcheck seguinte.
 */
async function checkDatabase(): Promise<Check> {
  const started = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      return { status: "down", detail: "DATABASE_URL não definida" };
    }

    const { default: postgres } = await import("postgres");
    const conn = postgres(url, { max: 1, connect_timeout: DB_TIMEOUT_MS, prepare: false });
    try {
      await Promise.race([
        conn`select 1`,
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("timeout")), DB_TIMEOUT_MS);
        }),
      ]);
      return { status: "ok", detail: "respondendo", latencyMs: Date.now() - started };
    } finally {
      await conn.end({ timeout: 1 }).catch(() => {});
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro desconhecido";
    return {
      status: "down",
      // Sem credencial/host na mensagem — health é público.
      detail: msg.slice(0, 120),
      latencyMs: Date.now() - started,
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Serviços externos: só verificamos se estão configurados. Não fazemos chamada
 * de rede — o healthcheck roda a cada 15s e não deve virar dependente da
 * latência de terceiros.
 */
function checkConfigured(name: string, keys: string[]): Check {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length === keys.length) {
    return { status: "degraded", detail: `não configurado (${missing.join(", ")})` };
  }
  if (missing.length > 0) {
    return { status: "degraded", detail: `parcial (falta ${missing.join(", ")})` };
  }
  void name;
  return { status: "ok", detail: "configurado" };
}

export async function GET() {
  const [database, r2, clerk, asaas, resend, sentry] = [
    await checkDatabase(),
    checkConfigured("r2", ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"]),
    checkConfigured("clerk", ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"]),
    checkConfigured("asaas", ["ASAAS_API_KEY", "ASAAS_WEBHOOK_SECRET"]),
    checkConfigured("resend", ["RESEND_API_KEY"]),
    checkConfigured("sentry", ["SENTRY_DSN"]),
  ];

  const checks = { database, r2, clerk, asaas, resend, sentry };
  const values = Object.values(checks).map((c) => c.status);

  // Rollback de precedência: um `down` (banco) sempre vence.
  const status: CheckStatus = values.includes("down")
    ? "down"
    : values.includes("degraded")
      ? "degraded"
      : "ok";

  return NextResponse.json(
    {
      status,
      checks,
      service: "demobr-web",
      version: process.env.npm_package_version ?? null,
      timestamp: new Date().toISOString(),
    },
    {
      // `curl -fsS` no HEALTHCHECK só aceita 2xx. 503 apenas para queda real.
      status: status === "down" ? 503 : 200,
      headers: { "cache-control": "no-store" },
    },
  );
}
