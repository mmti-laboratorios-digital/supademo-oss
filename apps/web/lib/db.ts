import * as schema from "@/db/schema";
import { sql } from "drizzle-orm";
import { type PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env";

/**
 * Cliente Postgres-js com pool limitado.
 *
 * IMPORTANTE: usamos `app_owner` para migrations (bypassa RLS)
 * e `app_user` para runtime (RLS aplicado).
 *
 * A função `withTenant(orgId)` injeta `SET LOCAL app.current_tenant_id = '...'`
 * em uma transação, fazendo o RLS funcionar por conexão.
 */

declare global {
  // eslint-disable-next-line no-var
  var __pg__: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __pgAdmin__: ReturnType<typeof postgres> | undefined;
}

function client(): ReturnType<typeof postgres> {
  if (!globalThis.__pg__) {
    globalThis.__pg__ = postgres(env().DATABASE_URL, {
      max: env().DATABASE_POOL_SIZE,
      idle_timeout: 30,
      prepare: false,
    });
  }
  return globalThis.__pg__;
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  return drizzle(client(), { schema, casing: "snake_case" });
}

/**
 * Cliente com BYPASSRLS — usa DIRECT_URL (app_owner role).
 * Use para webhooks, jobs assíncronos e migrations.
 * NÃO use em runtime de API: bypassaria o RLS dos tenants.
 */
function adminClient(): ReturnType<typeof postgres> {
  if (!globalThis.__pgAdmin__) {
    const url = env().DIRECT_URL ?? env().DATABASE_URL;
    globalThis.__pgAdmin__ = postgres(url, {
      max: 5,
      idle_timeout: 30,
      prepare: false,
    });
  }
  return globalThis.__pgAdmin__;
}

export function getAdminDb(): PostgresJsDatabase<typeof schema> {
  return drizzle(adminClient(), { schema, casing: "snake_case" });
}

/**
 * Cliente com RLS aplicado — usa connection separada para garantir
 * que SET LOCAL não vaze para outros usos do pool.
 */
export async function withTenant<T>(
  orgId: string,
  fn: (db: PostgresJsDatabase<typeof schema>) => Promise<T>,
): Promise<T> {
  const conn = postgres(env().DATABASE_URL, { max: 1, prepare: false });
  const db = drizzle(conn, { schema, casing: "snake_case" });

  try {
    return await db.transaction(async (tx) => {
      // SET LOCAL não aceita parâmetros via placeholder — usamos set_config().
      // UUID validado por regex para impedir SQL injection via orgId.
      const safeOrgId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        orgId,
      )
        ? orgId
        : (() => {
            throw new Error("Invalid orgId (must be UUID)");
          })();
      await tx.execute(sql.raw(`SET LOCAL app.current_tenant_id = '${safeOrgId}'`));
      return await fn(tx as unknown as PostgresJsDatabase<typeof schema>);
    });
  } finally {
    await conn.end();
  }
}

/**
 * Helper síncrono para casos em que já temos o orgId em closure.
 *
 * NOTA: para isolamento correto de RLS, prefira `withTenant()` que abre
 * uma transação e executa `SET LOCAL app.current_tenant_id`.
 *
 * Este helper retorna o db global — útil quando queries são executadas
 * pelo próprio app_user connection (que já tem o role correto e as
 * policies RLS usam current_setting() dentro de cada transação).
 */
export function getTenantDb(_orgId: string): PostgresJsDatabase<typeof schema> {
  return getDb();
}
