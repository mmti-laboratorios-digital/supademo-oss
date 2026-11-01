/**
 * apps/web/lib/analytics/visitor-id.ts
 * -----------------------------------------------------------------------------
 * Geração e hashing do identificador do visitante (cookie `_pk_id`).
 *
 * ⚠️ **Por que este módulo é separado do `visitor.ts`?**
 *
 * O middleware do Next roda no **Edge runtime** — lá `node:crypto` não
 * existe. Mas o cookie do visitante precisa ser criado **no middleware**,
 * porque a página do player (`/d/[slug]`, `/embed/[id]`) é um Server
 * Component e Server Components **não** podem escrever `Set-Cookie`
 * (só Server Actions e Route Handlers podem).
 *
 * Então: este módulo tem **zero** dependência de Node — usa só Web Crypto
 * (`crypto.getRandomValues` + `crypto.subtle.digest`), que existe no Edge e
 * no Node 22. O `visitor.ts` (Node) tem o equivalente **síncrono** com
 * `node:crypto`.
 *
 * ⚠️ **Os dois precisam produzir o MESMO hash.** O Edge grava o cookie e o
 * Node lê o cookie — se os hashes divergissem, o mesmo visitante contaria
 * como dois. Por isso o formato é fixo e o teste
 * `lib/__tests__/visitor-id.test.ts` compara as duas implementações.
 *
 * LGPD-safe:
 * - o id bruto é aleatório (16 bytes) e **nunca** sai do servidor;
 * - o que vai para o cookie e para o banco é o **hash** (SHA-256 + salt),
 *   truncado em 32 chars hex;
 * - o salt (`PII_HASH_SALT`) é rotativo — com ele, o hash não é
 *   reversível nem correlacionável entre períodos;
 * - **nenhum IP, nenhum fingerprint de browser.**
 */

/** Comprimento do hash gravado (hex chars). 32 chars = 128 bits. */
export const VISITOR_HASH_LENGTH = 32;

/** Bytes de entropia do id bruto. */
const RANDOM_BYTES = 16;

/**
 * Nome do cookie de visitante.
 *
 * ⚠️ O valor é duplicado de `env.VISITOR_COOKIE_NAME` (default `_pk_id`).
 * A duplicação é **deliberada**: o middleware roda no Edge e não pode
 * importar `lib/env.ts` (que valida o schema Zod inteiro, incluindo
 * `DATABASE_URL`). O teste `lib/__tests__/visitor-id.test.ts` verifica que
 * os dois defaults coincidem.
 */
export const VISITOR_COOKIE_NAME = "_pk_id";

/** TTL padrão do cookie, em dias (mesma default de `env.VISITOR_COOKIE_TTL_DAYS`). */
export const VISITOR_COOKIE_TTL_DAYS = 30;

/**
 * Header interno por onde o middleware passa o hash do visitante para a
 * página do player.
 *
 * ⚠️ **Não é um header público** — é criado pelo middleware na requisição
 * interna e lido pelo Server Component. Nunca sai para o browser. O prefixo
 * `x-` é o mesmo padrão do `x-locale` que o middleware já injeta.
 */
export const VISITOR_ID_HEADER = "x-visitor-id";

/**
 * Lê a config do cookie de visitante do `process.env`.
 *
 * Usado pelo middleware (Edge). Não valida o schema inteiro — só os campos
 * que o cookie precisa.
 */
export function visitorCookieConfig(): {
  name: string;
  ttlDays: number;
  salt: string | undefined;
  secure: boolean;
} {
  const rawTtl = Number(process.env.VISITOR_COOKIE_TTL_DAYS);
  return {
    name: process.env.VISITOR_COOKIE_NAME || VISITOR_COOKIE_NAME,
    ttlDays: Number.isFinite(rawTtl) && rawTtl > 0 ? rawTtl : VISITOR_COOKIE_TTL_DAYS,
    salt: process.env.PII_HASH_SALT,
    // `secure` só em produção — em dev o app roda em HTTP e o browser
    // descarta o cookie (o visitor vira "novo" a cada view).
    secure: process.env.NODE_ENV === "production",
  };
}

/**
 * Formato canônico do input do hash: `${salt}:${id}`.
 *
 * ⚠️ **Não mudar.** O Node (`visitor.ts`) usa exatamente o mesmo formato, e
 * os dois precisam gerar o mesmo hash para o mesmo id.
 */
export function visitorHashInput(id: string, salt: string | undefined): string {
  return `${salt ?? ""}:${id}`;
}

/**
 * Hash de um id bruto de visitante (SHA-256 + salt, 32 chars hex).
 *
 * ⚠️ O **salt é obrigatório em produção** — sem ele, o mesmo id gera
 * sempre o mesmo hash e dá para correlacionar visitantes entre installs.
 * O `salt` undefined é aceito só para desenvolvimento.
 */
export async function hashVisitorId(id: string, salt: string | undefined): Promise<string> {
  const data = new TextEncoder().encode(visitorHashInput(id, salt));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest)).slice(0, VISITOR_HASH_LENGTH);
}

/**
 * Gera um id bruto aleatório (hex). **Nunca** deve ser persistido — só o
 * hash vai para o cookie e para o banco.
 */
export function randomVisitorId(): string {
  const bytes = new Uint8Array(RANDOM_BYTES);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Gera o hash de um visitante novo (id aleatório + hash).
 */
export async function newVisitorIdHash(salt: string | undefined): Promise<string> {
  return hashVisitorId(randomVisitorId(), salt);
}

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) {
    out += b.toString(16).padStart(2, "0");
  }
  return out;
}
